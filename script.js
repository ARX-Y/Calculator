const display = document.getElementById('displayValue');
const buttons = document.querySelectorAll('.btn');

let displayValue = '0';
let storedValue = null;
let pendingOperator = null;
let waitingForOperand = false;
let lastOperator = null;
let lastOperand = null;
let expression = '';

function updateDisplay() {
	let visibleText = displayValue;
	if (expression) {
		visibleText = expression;
		if (!waitingForOperand || expression.endsWith('=')) {
			visibleText += ` ${displayValue}`;
		}
	}
	display.textContent = visibleText;
	display.scrollLeft = display.scrollWidth;
}

let isDraggingDisplay = false;
let displayDragStart = 0;
let displayScrollStart = 0;

display.addEventListener('pointerdown', (event) => {
	isDraggingDisplay = true;
	displayDragStart = event.clientX;
	displayScrollStart = display.scrollLeft;
	display.setPointerCapture(event.pointerId);
});

display.addEventListener('pointermove', (event) => {
	if (!isDraggingDisplay) return;
	display.scrollLeft = displayScrollStart - (event.clientX - displayDragStart);
});

function stopDisplayDragging() {
	isDraggingDisplay = false;
}

display.addEventListener('pointerup', stopDisplayDragging);
display.addEventListener('pointercancel', stopDisplayDragging);

function formatResult(value) {
	if (!Number.isFinite(value)) return 'Error';
	return String(Number(value.toFixed(10)));
}

function inputDigit(digit) {
	if (displayValue === 'Error' || waitingForOperand) {
		displayValue = digit;
		waitingForOperand = false;
	} else if (displayValue === '0') {
		displayValue = digit;
	} else if (displayValue.replace('-', '').replace('.', '').length < 16) {
		displayValue += digit;
	}
	updateDisplay();
}

function inputDecimal() {
	if (displayValue === 'Error' || waitingForOperand) {
		displayValue = '0.';
		waitingForOperand = false;
	} else if (!displayValue.includes('.')) {
		displayValue += '.';
	}
	updateDisplay();
}

function performCalculation(firstValue, secondValue, operator) {
	switch (operator) {
		case '+':
			return firstValue + secondValue;
		case '-':
			return firstValue - secondValue;
		case '*':
			return firstValue * secondValue;
		case '/':
			return secondValue === 0 ? Infinity : firstValue / secondValue;
		default:
			return secondValue;
	}
}

function chooseOperator(nextOperator) {
	if (displayValue === 'Error') return;

	const currentValue = Number(displayValue);
	if (pendingOperator && !waitingForOperand) {
		const result = performCalculation(storedValue, currentValue, pendingOperator);
		displayValue = formatResult(result);
		if (displayValue === 'Error') {
			clearCalculator();
			displayValue = 'Error';
			updateDisplay();
			return;
		}
		storedValue = result;
	} else if (storedValue === null) {
		storedValue = currentValue;
	}

	pendingOperator = nextOperator;
	waitingForOperand = true;
	lastOperator = null;
	lastOperand = null;
	expression = `${displayValue} ${nextOperator}`;
	updateDisplay();
}

function calculate() {
	if (displayValue === 'Error') return;

	let operator = pendingOperator || lastOperator;
	let operand;

	if (pendingOperator) {
		operand = waitingForOperand ? storedValue : Number(displayValue);
		if (waitingForOperand) {
			operand = storedValue;
		} else {
			lastOperand = operand;
		}
	} else if (lastOperator && lastOperand !== null) {
		operand = lastOperand;
	} else {
		return;
	}

	const firstValue = pendingOperator ? storedValue : Number(displayValue);
	const result = performCalculation(firstValue, operand, operator);
	displayValue = formatResult(result);
	if (displayValue === 'Error') {
		storedValue = null;
		pendingOperator = null;
		lastOperator = null;
		lastOperand = null;
		waitingForOperand = true;
		updateDisplay();
		return;
	}

	lastOperator = operator;
	lastOperand = operand;
	storedValue = null;
	pendingOperator = null;
	waitingForOperand = true;
	expression = `${firstValue} ${operator} ${operand} =`;
	updateDisplay();
}

function inputPercentage() {
	if (displayValue === 'Error') return;

	const value = Number(displayValue) / 100;
	displayValue = formatResult(value);
	expression = `${displayValue} %`;
	updateDisplay();
}

function deleteDigit() {
	if (displayValue === 'Error' || waitingForOperand) {
		displayValue = '0';
		waitingForOperand = false;
	} else if (displayValue.length <= 1 || (displayValue.length === 2 && displayValue.startsWith('-'))) {
		displayValue = '0';
	} else {
		displayValue = displayValue.slice(0, -1);
	}
	expression = '';
	updateDisplay();
}

function clearCalculator() {
	displayValue = '0';
	storedValue = null;
	pendingOperator = null;
	waitingForOperand = false;
	lastOperator = null;
	lastOperand = null;
	expression = '';
	updateDisplay();
}

function handleInput(value) {
	if (/^\d$/.test(value)) {
		inputDigit(value);
	} else if (value === '.') {
		inputDecimal();
	} else if (['+', '-', '*', '/'].includes(value)) {
		chooseOperator(value);
	} else if (value === '=') {
		calculate();
	} else if (value === '%') {
		inputPercentage();
	} else if (value === 'DEL') {
		deleteDigit();
	} else if (value === 'C') {
		clearCalculator();
	}
}

buttons.forEach((button) => {
	button.addEventListener('click', () => handleInput(button.textContent.trim()));
});

document.addEventListener('keydown', (event) => {
	const key = event.key === 'Enter' ? '=' : event.key;
	const validKey = /^\d$/.test(key) || ['.', '+', '-', '*', '/', '=', '%'].includes(key);

	if (validKey) {
		event.preventDefault();
		handleInput(key);
	} else if (event.key === 'Backspace') {
		event.preventDefault();
		handleInput('DEL');
	} else if (event.key === 'Escape' || event.key.toLowerCase() === 'c') {
		event.preventDefault();
		handleInput('C');
	}
});

updateDisplay();
