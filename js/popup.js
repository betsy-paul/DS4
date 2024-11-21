let display; // Timer display element
let isOn; // true or false

function updateDisplay() {
	// Ensure display element is correctly initialized
	display = document.querySelector('#time');
	if (!display) {
		console.error("Element with ID 'time' not found.");
	}
}

// Ensure display is updated when the user opens the extension
window.onload = function () {
	updateDisplay();
};

// Check if extension is on or off
chrome.storage.local.get(['on'], function (result) {
    updateDisplay()
	if (result.on != null) {
		if (!result.on) {
			document.getElementById('checkbox1').checked = false; // off
			isOn = false;
			if (display) display.textContent = 'turn on'; // Safely access display
		} else {
			document.getElementById('checkbox1').checked = true; // on
			isOn = true;
		}
	} else {
		// Auto-on on first launch
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
		if (display) display.textContent = 'turn on'; // Safely access display
	} else {
		chrome.storage.local.set({ on: true }, function () {
			// console.log('On set to true.');
		});
		isOn = true;
	}
};

// Listen for changes in timeLeft from background.js and update the display
chrome.storage.onChanged.addListener(function (changes, namespace) {
	for (let key in changes) {
		if (key === 'TIME_LEFT') {
			let storageChange = changes[key];
			let time = storageChange.newValue;

			if (isOn && display) {
				if (time > 1200) {
					display.textContent = 'stretch';
				} else {
					let minutes = Math.floor(time / 60);
					let seconds = time % 60;

					// Pretty-print the time
					function str_pad_left(string, pad, length) {
						return (new Array(length + 1).join(pad) + string).slice(-length);
					}
					let finalTime = str_pad_left(minutes, '0', 2) + ':' + str_pad_left(seconds, '0', 2);
					display.textContent = finalTime;
				}
			} else if (display) {
				display.textContent = 'turn on';
			}
		}
	}
});
