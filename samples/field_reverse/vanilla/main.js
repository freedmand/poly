const input = document.getElementById('input');
const output = document.getElementById('output');

input.addEventListener('input', (e) => {
  const reversed = e.target.value.split('').reverse().join('');
  output.textContent = reversed;
});
