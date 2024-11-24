// load URL of logo image

let display; //timer display
let isOn; //true or false

function updateDisplay() {
	//esnure display element is correctly set
	display = document.querySelector('#time');
	if (!display) {
		console.error("Element with ID 'time' not found.");
	}
}

//when user opens extension, update display
window.onload = function () {
	updateDisplay();
};

//------------------------chrome.browserAction.setIcon({ path: "my-icon.png" });

// check if extension on or off
chrome.storage.local.get(['on'], function (result) {
	updateDisplay()
	if (result.on != null) {
		if (!result.on) {
			document.getElementById('checkbox1').checked = false; //off
			isOn = false;
			if (display)  //access display
				display.textContent = 'Turn on to see time';
		} else {
			document.getElementById('checkbox1').checked = true; //on
			isOn = true;
		}
	} else { //automatically on at first launch
		chrome.storage.local.set({ on: true }, function () {
		// console.log('On set to true.');
	});
		document.getElementById('checkbox1').checked = true;
		isOn = true;
	}
});

// update on or off preference when clicked
document.getElementById('checkbox1').onclick = function () {
	if (document.getElementById('checkbox1').checked === false) {
		chrome.storage.local.set({ on: false }, function () {
			// console.log('On set to false.');
		});
		isOn = false;
		if (display) 
			display.textContent = 'Turn on to see time'; //access display
	} else {
		chrome.storage.local.set({ on: true }, function () {
			// console.log('On set to true.');
		});
		isOn = true;
	}
};

// listens for changes in timeLeft var from background.js timer & update display
chrome.storage.onChanged.addListener(function (changes, namespace) {
	for (let key in changes) {
		if (key === 'TIME_LEFT') {
			//store all changes
			let storageChange = changes[key];
			time = storageChange.newValue;
			if (isOn && display) {
				if (time > 1200) {
					//60, 1200
					display.textContent = 'break';
				} else if (time <= 1200) {
					//60, 1200
					// convert newValue to time & seconds display
					let minutes = Math.floor(time / 60);
					let seconds = time % 60;
					// pretty-print the time
					function str_pad_left(string, pad, length) {
						return (new Array(length + 1).join(pad) + string).slice(-length);
					}
					let finalTime =
						str_pad_left(minutes, '0', 2) + ':' + str_pad_left(seconds, '0', 2);
					//set display to new updated time
					display.textContent = finalTime;
				}
			} else if (display) {
				display.textContent = 'turn on';
			}
		}
	}
});

