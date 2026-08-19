const gridEl = document.getElementById('grid');
const COLS = 3;
const ROWS = 5;

for (let i = 0; i < COLS * ROWS; i++) {
  const cell = document.createElement('div');
  cell.className = 'cell';
  gridEl.appendChild(cell);
}
