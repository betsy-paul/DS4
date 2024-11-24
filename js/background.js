let freq; // in min (for chrome alarm)
let timeLeft; // in secs (for onscreen timer)
let isOn; // true or false
let timeOut;
let secondTimeout;

// Check on or off when first open
chrome.storage.local.get(['on'], function(result) {
    if (result.on === true) {
        isOn = true;
        startAlarmAndNotif();
    } else if (result.on === false) {
        isOn = false;
    } else {
        // Auto-on for first download
        isOn = true;
    }
});

// Updates when user chooses on/off settings
chrome.storage.onChanged.addListener(function(changes, namespace) {
    for (let key in changes) {
        if (key === 'on') {
            let storageChange = changes[key];
            isOn = storageChange.newValue; // true or false
            if (isOn) {
                startAlarmAndNotif();
            } else {
                // Cancel the last timer
                clearTimeout(timeOut);
                clearTimeout(secondTimeout);
                // Cancel the chrome alarm
                chrome.alarms.clearAll();
                console.log('Clear alarms.');
            }
        }
    }
});

function startAlarmAndNotif() {
    freq = 1; // Frequency in minutes (e.g., 1 or 25)
    timeLeft = 60; // Initial time in seconds (e.g., 60 or 1500)
    createAlarm(freq);
}

function createAlarm(freq) {
    // Start the background timer
    startBackgroundTimer();
    // Clears past notification alarms in Chrome
    chrome.alarms.clearAll();
    console.log('Cleared all chrome alarms.');

    // Creates a new notification alarm
    chrome.alarms.create('alarmStart', {
        when: Date.now(),
        periodInMinutes: freq,
    });
}

// Listen for alarm and handle notifications
chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === 'workTimerEnd') {
        chrome.storage.local.set({ timerPhase: 'break' });
        chrome.notifications.create({
            type: 'basic',
            iconUrl: 'icon.png',
            title: 'Take a Break!',
            message: 'Time to take a 20-second break.',
        });
    }
});

function openNotification() {
    const popupUrl = chrome.runtime.getURL('/notification.html');
    chrome.tabs.query({ url: popupUrl }, function(tabs) {
        if (tabs.length > 0) {
            // Remove last exercise tab if it hasn't been closed
            chrome.tabs.remove(tabs[0].id);
        }
        // Creates a new notification popup window
        chrome.windows.create({
            url: 'notification.html',
            type: 'popup',
            width: 1200,
            height: 750,
            top: 20,
            left: 20,
        });
    });
}

// Start a background timer separate from the chrome alarm for front-end
function startBackgroundTimer() {
    // Clear the last timer
    clearTimeout(timeOut);

    chrome.storage.local.set({ TIME_LEFT: timeLeft }, function() {
        console.log('timeLeft is saved: ' + timeLeft + ' seconds');
    });

    const interval = 1000; // Decreasing interval is every second
    let endTime = Date.now() + interval; // Next endTime is 1 second from now

    // After one second, execute step() function
    timeOut = setTimeout(step, interval);

    function step() {
        let dt = Date.now() - endTime; // How much time has passed

        if (dt > interval) {
            console.log('Timer is not accurate due to JavaScript runtime.');
        }

        timeLeft--; // Decrease timeLeft by 1 second

        chrome.storage.local.set({ TIME_LEFT: timeLeft }, function() {
            console.log('timeLeft is saved: ' + timeLeft + ' seconds');
        });

        endTime += interval; // Increment endTime by one second

        secondTimeout = setTimeout(step, Math.max(0, interval - dt)); // Schedule next step

        if (timeLeft <= 0) {
            // Resets timer, with 30 minutes for stretch
            timeLeft = 1800; // Example: 30 minutes
        }
    }
}
