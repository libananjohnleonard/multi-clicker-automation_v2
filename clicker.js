const { mouse, Point } = require('@nut-tree-fork/nut-js');

mouse.config.autoDelayMs = 0;

async function clickGrid(gridBounds, cols, rows, cellSize) {
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const x = Math.round(gridBounds.x + col * cellSize + cellSize / 2);
      const y = Math.round(gridBounds.y + row * cellSize + cellSize / 2);
      await mouse.setPosition(new Point(x, y));
      await mouse.leftClick();
    }
  }
}

module.exports = { clickGrid };
