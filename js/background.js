let freq; //in min (for chrome alarm)
let timeLeft; //in secs (for onscreen timer)
let isOn; //true or false
let timeOut;
let secondTimeout;
// check on or off when first open
chrome.storage.local.get(['on'], function(result) {
    if (result.on === true) {
        isOn = true;
        startAlarmAndNotif();
    } else if (result.on === false) {
        isOn = false;
    } else {
        //auto on for first download
        isOn = true;
    }
});
// updates when user choose on/off settings
chrome.storage.onChanged.addListener(function(changes, namespace) {
    for (let key in changes) {
        if (key === 'on') {
            let storageChange = changes[key];
            isOn = storageChange.newValue; //true or false
            if (isOn) {
                startAlarmAndNotif();
            } else {
                // cancel the last timer
                clearTimeout(timeOut);
                clearTimeout(secondTimeout);
                // cancel the chrome alarm
                chrome.alarms.clearAll();
                console.log('Clear alarms.');
            }
            //printing changes in console
            // console.log(
            // 	'Storage key "%s" in namespace "%s" changed. ' +
            // 		'Old value was "%s", new value is "%s".',
            // 	key,
            // 	namespace,
            // 	storageChange.oldValue,
            // 	storageChange.newValue
            // );
        }
    }
});
function startAlarmAndNotif() {
    freq = 20; //1, 25
    // console.log('set alarm freq to ' + freq);
    timeLeft = 1200; //60, 1500
    createAlarm(freq);
}

function createAlarm(freq) {
    // start the background timer
    startBackgroundTimer();
    // clears past notif alarms on chrome
    chrome.alarms.clearAll();
    console.log('Cleared all chrome alarms.');
    // creates a new notif alarm
    chrome.alarms.create('alarmStart', {
        when: Date()
            .now,
        periodInMinutes: freq,
    });
    // console.log('New chrome alarm set at ' + freq + ' minutes');
}

function openNotification() {
    // Create the popup window
    chrome.windows.create({
        url: chrome.runtime.getURL('html/notification.html'),
        type: 'popup',
        width: 25,
        height: 30,
        left: screen.availWidth - 320, // Adjust based on the popup's size
        top: 50,
        position: relative,

    }, function(newWindow) {
        // Query open windows to check if there's an existing notification popup
        chrome.windows.getAll({ windowTypes: ['popup'] }, function(windows) {
            // Check if there's already a notification popup open
            for (let win of windows) {
                if (win.id !== newWindow.id) {
                    // Close any other notification windows
                    chrome.windows.remove(win.id);
                }
            }
        });
    });
}

// listen for alarm and open the notif popup
chrome.alarms.onAlarm.addListener(function(alarm) {
    openNotification();
    // clear old alarm and add 30 min (account for 5 break)
    chrome.alarms.clearAll();
    chrome.alarms.create('alarmStart', {
        when: Date()
            .now,
        periodInMinutes: 30, //2, 30
    });
});

// Start a background timer seperate from the chrome alarm for front-end
function startBackgroundTimer() {
    //clear the last timer
    clearTimeout(timeOut);
    // console.log('Starting timer at ' + timeLeft + ' seconds.');
    chrome.storage.local.set({
        TIME_LEFT: timeLeft
    }, function() {
        // console.log('timeLeft is saved: ' + timeLeft + ' seconds');
    });
    const interval = 1000; //decreasing interval is every sec
    let endTime = Date.now() + interval; //next endTime is 1 min from now
    // after one min, execute step() fcn
    timeOut = setTimeout(step, interval);
    function step() {
        // how much time has passed
        let dt = Date.now() - endTime;
        // if time passed > 1 min, javascript not running accurately with time
        if (dt > interval) {
            console.log('Timer is not accurate due to javascript runtime.');
        }
        //decrease the time left by 1 min
        timeLeft--;
        // console.log(timeLeft);
        // save the new timeLeft to local storage (in user chrome browser)
        chrome.storage.local.set({
            TIME_LEFT: timeLeft
        }, function() {
            // console.log('timeLeft is saved: ' + timeLeft + 'min');
        });
        //increase the endTime by 1 more min
        endTime += interval;
        //after one min, execute step() fcn to decrease timeLeft again
        secondTimeout = setTimeout(step, Math.max(0, interval - dt));
        if (timeLeft <= 0) {
            //resets timer, with 5 extra minute for stretch
            timeLeft = 1800; //120, 1800
        }
    }
}