const gridEl = document.getElementById('grid');
const COLS = 5;
const ROWS = 3;

for (let i = 0; i < COLS * ROWS; i++) {
  const cell = document.createElement('div');
  cell.className = 'cell';
  gridEl.appendChild(cell);
}
