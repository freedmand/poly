const decrement = document.getElementById('decrement');
const text = document.getElementById('text');
const increment = document.getElementById('increment');

let counter = 0;

function alter(amount) {
  counter += amount;
  text.textContent = counter;
}

increment.addEventListener('click', () => alter(1));
decrement.addEventListener('click', () => alter(-1));
