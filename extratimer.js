let images = [];
let label = document.querySelector('#label');
var random;

//function that starts when the start timer button is clicked
function startTimer(duration, display) {
    let timer = duration;  // set duration for timer
    let minutes;
    let seconds;
    let key = 1;
    let nextMinute = 4;

    // This only works if the window is open
    let interval = setInterval(function () {
        // Converts to minute & seconds int in main number system (10)
        minutes = parseInt(timer / 60, 10);
        seconds = parseInt(timer % 60, 10);

        minutes = minutes < 10 ? '0' + minutes : minutes;
        seconds = seconds < 10 ? '0' + seconds : seconds;

        // set display for HTML
        display.textContent = minutes + ':' + seconds;

        
        if (--timer < 0) {
            clearInterval(interval);
            timer = 0;
        }

        // Check if the time has reached certain intervals to set images
        if (timer > 0 && minutes == nextMinute && seconds == 0) {
            setImage(key);
            key++;
            nextMinute--;
        }
    }, 1000);
}

let display; // Timer display element
let isOn; // true or false

// Update the display when the window is loaded
function updateDisplay() {
    // Ensure display element is correctly set
    display = document.querySelector('#time');
    if (!display) {
        console.error("Element with ID 'time' not found.");
    }
}

// When the user opens the extension, update display
window.onload = function () {
    updateDisplay();
    // Display the initial time when the page loads
    let initialTime = 20;  // You can change the initial time here
    let initialDisplay = document.querySelector('#timer');  // Set initial display element
    let minutes = Math.floor(initialTime / 60);
    let seconds = initialTime % 60;
    initialDisplay.textContent = (minutes < 10 ? '0' + minutes : minutes) + ':' + (seconds < 10 ? '0' + seconds : seconds);
};

// Set up a listener for the start button click event
document.getElementById('startTimerButton').addEventListener('click', function () {
    let twentySecond = 20;  // Set the duration for the timer (20 seconds)
    let display = document.querySelector('#timer');  // Timer display element
    startTimer(twentySecond, display);  // Start the timer when the button is clicked
});

// Check if the extension is on or off
chrome.storage.local.get(['on'], function (result) {
    updateDisplay();
    if (result.on != null) {
        if (!result.on) {
            document.getElementById('checkbox1').checked = false; // off
            isOn = false;
            if (display)  // Access display
                display.textContent = 'Turn on to see time';
        } else {
            document.getElementById('checkbox1').checked = true; // on
            isOn = true;
        }
    } else { // Automatically on at first launch
        chrome.storage.local.set({ on: true }, function () {
            // console.log('On set to true.');
        });
        document.getElementById('checkbox1').checked = true;
        isOn = true;
    }
});

// Update on or off preference when clicked
document.getElementById('checkbox1').onclick = function () {
    if (document.getElementById('checkbox1').checked === false) {
        chrome.storage.local.set({ on: false }, function () {
            // console.log('On set to false.');
        });
        isOn = false;
        if (display)
            display.textContent = 'Turn on to see time'; // Access display
    } else {
        chrome.storage.local.set({ on: true }, function () {
            // console.log('On set to true.');
        });
        isOn = true;
    }
};

// Listens for changes in timeLeft var from background.js timer & update display
chrome.storage.onChanged.addListener(function (changes, namespace) {
    for (let key in changes) {
        if (key === 'TIME_LEFT') {
            // Store all changes
            let storageChange = changes[key];
            time = storageChange.newValue;
            if (isOn && display) {
                if (time > 1200) {
                    // 60, 1200
                    display.textContent = 'stretch';
                } else if (time <= 1200) {
                    // 60, 1200
                    // Convert newValue to time & seconds display
                    let minutes = Math.floor(time / 60);
                    let seconds = time % 60;
                    // Pretty-print the time
                    function str_pad_left(string, pad, length) {
                        return (new Array(length + 1).join(pad) + string).slice(-length);
                    }
                    let finalTime =
                        str_pad_left(minutes, '0', 2) + ':' + str_pad_left(seconds, '0', 2);
                    // Set display to new updated time
                    display.textContent = finalTime;
                }
            } else if (display) {
                display.textContent = 'turn on';
            }
        }
    }
});

// Random number generator 
function randomNums(max) {
    var arr = [];
    while (arr.length < 5) {
        var r = Math.floor(Math.random() * max);
        if (arr.indexOf(r) === -1) {
            arr.push(r); // If index doesn't exist == -1
        }
    }
    return arr;
}
