const { execFile } = require('child_process');
const path = require('path');

const LIST_SCRIPT_PATH = path.join(__dirname, 'scripts', 'list-windows.ps1');
const FOCUS_SCRIPT_PATH = path.join(__dirname, 'scripts', 'focus-window.ps1');
const RECT_SCRIPT_PATH = path.join(__dirname, 'scripts', 'get-window-rect.ps1');
const CLICK_SCRIPT_PATH = path.join(__dirname, 'scripts', 'click-grid.ps1');
const CLICK_CURSOR_SCRIPT_PATH = path.join(__dirname, 'scripts', 'click-grid-cursor.ps1');
const EXCLUDED_TITLES = new Set(['Multi Clicker']);

function getVisibleWindows() {
  return new Promise((resolve, reject) => {
    execFile(
      'powershell.exe',
      ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', LIST_SCRIPT_PATH],
      { maxBuffer: 10 * 1024 * 1024 },
      (error, stdout) => {
        if (error) {
          reject(error);
          return;
        }

        const trimmed = stdout.trim();
        if (!trimmed) {
          resolve([]);
          return;
        }

        let parsed;
        try {
          parsed = JSON.parse(trimmed);
        } catch (parseError) {
          reject(parseError);
          return;
        }

        const windows = Array.isArray(parsed) ? parsed : [parsed];
        resolve(windows.filter((w) => !EXCLUDED_TITLES.has(w.title)));
      }
    );
  });
}

function bringToForeground(handle) {
  return new Promise((resolve, reject) => {
    execFile(
      'powershell.exe',
      ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', FOCUS_SCRIPT_PATH, '-Handle', String(handle)],
      { maxBuffer: 10 * 1024 * 1024 },
      (error, stdout) => {
        if (error) {
          reject(error);
          return;
        }

        const trimmed = stdout.trim();
        if (!trimmed) {
          reject(new Error('No output from focus-window.ps1'));
          return;
        }

        try {
          resolve(JSON.parse(trimmed));
        } catch (parseError) {
          reject(parseError);
        }
      }
    );
  });
}

function getWindowRect(handle) {
  return new Promise((resolve, reject) => {
    execFile(
      'powershell.exe',
      ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', RECT_SCRIPT_PATH, '-Handle', String(handle)],
      { maxBuffer: 10 * 1024 * 1024 },
      (error, stdout) => {
        if (error) {
          reject(error);
          return;
        }

        const trimmed = stdout.trim();
        if (!trimmed) {
          reject(new Error('No output from get-window-rect.ps1'));
          return;
        }

        try {
          resolve(JSON.parse(trimmed));
        } catch (parseError) {
          reject(parseError);
        }
      }
    );
  });
}

function clickGrid(handle, gridBounds, cols, rows, cellSize) {
  return new Promise((resolve, reject) => {
    execFile(
      'powershell.exe',
      [
        '-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', CLICK_SCRIPT_PATH,
        '-Handle', String(handle),
        '-GridX', String(Math.round(gridBounds.x)),
        '-GridY', String(Math.round(gridBounds.y)),
        '-Cols', String(cols),
        '-Rows', String(rows),
        '-CellSize', String(cellSize)
      ],
      { maxBuffer: 10 * 1024 * 1024 },
      (error, stdout) => {
        if (error) {
          reject(error);
          return;
        }

        const trimmed = stdout.trim();
        if (!trimmed) {
          reject(new Error('No output from click-grid.ps1'));
          return;
        }

        try {
          resolve(JSON.parse(trimmed));
        } catch (parseError) {
          reject(parseError);
        }
      }
    );
  });
}

function clickGridCursor(gridBounds, cols, rows, cellSize) {
  return new Promise((resolve, reject) => {
    execFile(
      'powershell.exe',
      [
        '-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', CLICK_CURSOR_SCRIPT_PATH,
        '-GridX', String(Math.round(gridBounds.x)),
        '-GridY', String(Math.round(gridBounds.y)),
        '-Cols', String(cols),
        '-Rows', String(rows),
        '-CellSize', String(cellSize)
      ],
      { maxBuffer: 10 * 1024 * 1024 },
      (error, stdout) => {
        if (error) {
          reject(error);
          return;
        }

        const trimmed = stdout.trim();
        if (!trimmed) {
          reject(new Error('No output from click-grid-cursor.ps1'));
          return;
        }

        try {
          resolve(JSON.parse(trimmed));
        } catch (parseError) {
          reject(parseError);
        }
      }
    );
  });
}

module.exports = { getVisibleWindows, bringToForeground, getWindowRect, clickGrid, clickGridCursor };
