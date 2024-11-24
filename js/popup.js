// // load URL of logo image
// // chrome.extension.getURL('/assets/reclogoa.png');

// let display; //timer display
// let isOn; //true or false

// function updateDisplay() {
// 	//esnure display element is correctly set
// 	display = document.querySelector('#time');
// 	if (!display) {
// 		console.error("Element with ID 'time' not found.");
// 	}
// }

// //when user opens extension, update display
// window.onload = function () {
// 	updateDisplay();
// };


// // check if extension on or off
// chrome.storage.local.get(['on'], function (result) {
// 	updateDisplay()
// 	if (result.on != null) {
// 		if (!result.on) {
// 			document.getElementById('checkbox1').checked = false; //off
// 			isOn = false;
// 			if (display)  //access display
// 				display.textContent = 'Turn on to see time';
// 		} else {
// 			document.getElementById('checkbox1').checked = true; //on
// 			isOn = true;
// 		}
// 	} else { //automatically on at first launch
// 		chrome.storage.local.set({ on: true }, function () {
// 		// console.log('On set to true.');
// 	});
// 		document.getElementById('checkbox1').checked = true;
// 		isOn = true;
// 	}
// });

// // update on or off preference when clicked
// document.getElementById('checkbox1').onclick = function () {
// 	if (document.getElementById('checkbox1').checked === false) {
// 		chrome.storage.local.set({ on: false }, function () {
// 			// console.log('On set to false.');
// 		});
// 		isOn = false;
// 		if (display) 
// 			display.textContent = 'Turn on to see time'; //access display
// 	} else {
// 		chrome.storage.local.set({ on: true }, function () {
// 			// console.log('On set to true.');
// 		});
// 		isOn = true;
// 	}
// };

// // listens for changes in timeLeft var from background.js timer & update display
// chrome.storage.onChanged.addListener(function (changes, namespace) {
// 	for (let key in changes) {
// 		if (key === 'TIME_LEFT') {
// 			//store all changes
// 			let storageChange = changes[key];
// 			time = storageChange.newValue;
// 			if (isOn && display) {
// 				if (time > 60) {
// 					//60, 1200
// 					display.textContent = 'stretch';
// 				} else if (time <= 60) {
// 					//60, 1200
// 					// convert newValue to time & seconds display
// 					let minutes = Math.floor(time / 60);
// 					let seconds = time % 60;
// 					// pretty-print the time
// 					function str_pad_left(string, pad, length) {
// 						return (new Array(length + 1).join(pad) + string).slice(-length);
// 					}
// 					let finalTime =
// 						str_pad_left(minutes, '0', 2) + ':' + str_pad_left(seconds, '0', 2);
// 					//set display to new updated time
// 					display.textContent = finalTime;
// 				}
// 			} else if (display) {
// 				display.textContent = 'turn on';
// 			}
// 		}
// 	}
// });

let display; // Timer display element
let isOn; // Tracks whether the extension is on
let isWorkTimer = true; // Tracks if it's the work timer (true) or break timer (false)
let workTimer = 2 * 60; // Work time in seconds (2 minutes for testing) // changed*****
let breakTimer = 20; // Break time in seconds

// Load timer state from storage when popup opens
chrome.storage.local.get(["workTimer", "breakTimer", "isWorkTimer"], (data) => {
    workTimer = data.workTimer || 2 * 60; //changedddd*****
    breakTimer = data.breakTimer || 20;
    isWorkTimer = data.isWorkTimer !== undefined ? data.isWorkTimer : true;
    updateTimerDisplay(isWorkTimer ? workTimer : breakTimer);
});

function updateDisplayElement() {
    display = document.querySelector("#time");
    if (!display) {
        console.error("Element with ID 'time' not found.");
    }
}

// Update the display with the formatted time
function updateTimerDisplay(seconds) {
    if (display) {
        if (seconds <= 0) {
            display.textContent = "00:00";
        } else {
            const minutes = Math.floor(seconds / 60);
            const secs = seconds % 60;
            display.textContent =
                String(minutes).padStart(2, "0") + ":" + String(secs).padStart(2, "0");
        }
    }
}

// Start the timer phase
function startPhase() {
    // Reset timers for the new phase
    const currentTimer = isWorkTimer ? workTimer : breakTimer;
    updateTimerDisplay(currentTimer);
    startCountdown();
}


function update_brightness() {
    chrome.tabs.query({active:true, currentWindow:true}, function(tabs) {
        if (tabs.length > 0){
            // api call function to locate given tab and adjust brightness 
            chrome.scripting.executeScript({
                target: {tabId: tabs[0].id, allFrames:true},
                func: () => {
                    document.documentElement.style.filter = 'brightness(100%)';
                    document.documentElement.style.transition = 'filter 0.3s ease';
                }
            })
        }
    })
}



function dim_brightness() {
    chrome.tabs.query({active:true, currentWindow:true}, function(tabs) {
        if (tabs.length > 0){
            // api call function to locate given tab and adjust brightness 
            chrome.scripting.executeScript({
                target: {tabId: tabs[0].id, allFrames:true},
                func: () => {
                    document.documentElement.style.filter = 'brightness(50%)';
                    document.documentElement.style.transition = 'filter 0.5s ease';
                }
            })
        }
    })
}



// Countdown logic
function startCountdown() {
    const interval = setInterval(() => {
        if (!isOn) {
            clearInterval(interval);
            return;
        }

        // Decrement the correct timer based on the phase
        if (isWorkTimer) {
            workTimer--;
        } else {
            breakTimer--;
        }

        // Update display with the correct timer value
        const timeLeft = isWorkTimer ? workTimer : breakTimer;
        updateTimerDisplay(timeLeft);

        // Check if timer has finished
        if (timeLeft <= 0) {
            clearInterval(interval); // Clear the current interval
            isWorkTimer = !isWorkTimer; // Switch to the other timer phase
            if (isWorkTimer){
                update_brightness()
            } else {
                dim_brightness()
            }
            resetAndStartNextPhase();
        }
    }, 1000);
}

// Reset and start the next phase with a delay
function resetAndStartNextPhase() {
    // Reset the appropriate timer
    if (isWorkTimer) {
        workTimer = 2 * 60; // Reset work timer to 2 minutes
    } else {
        breakTimer = 20; // Reset break timer to 20 seconds
    }

    // Update display
    updateTimerDisplay(isWorkTimer ? workTimer : breakTimer);

    // Add a short delay before starting the next phase
    setTimeout(() => {
        startPhase(); // Start the next phase after delay
    }, 1000); // 1 second delay before starting the next phase
}


// Save timer state to storage periodically
setInterval(() => {
    chrome.storage.local.set({
        workTimer: workTimer,
        breakTimer: breakTimer,
        isWorkTimer: isWorkTimer,
    });
}, 1000);

// Handle toggling the timer on/off
document.getElementById("checkbox1").onclick = function () {
    if (document.getElementById("checkbox1").checked === false) {
        chrome.storage.local.set({ on: false }, function () {});
        isOn = false;
        if (display) display.textContent = "Turn on to see time";
    } else {
        chrome.storage.local.set({ on: true }, function () {});
        isOn = true;
        startPhase(); // Start the timer
    }
};

// Load "on/off" state from storage
chrome.storage.local.get(["on"], function (result) {
    updateDisplayElement();
    if (result.on != null) {
        isOn = result.on;
        document.getElementById("checkbox1").checked = isOn;
        if (isOn) {
            startPhase(); // Start the timer
        } else {
            if (display) display.textContent = "Turn on to see time";
        }
    } else {
        chrome.storage.local.set({ on: true }, function () {});
        document.getElementById("checkbox1").checked = true;
        isOn = true;
        startPhase(); // Start the timer by default
    }
});

// Ensure the display is updated when the popup loads
window.onload = function () {
    updateDisplayElement();
};
