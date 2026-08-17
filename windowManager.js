const { execFile } = require('child_process');
const path = require('path');

const SCRIPT_PATH = path.join(__dirname, 'scripts', 'list-windows.ps1');
const EXCLUDED_TITLES = new Set(['Multi Clicker']);

function getVisibleWindows() {
  return new Promise((resolve, reject) => {
    execFile(
      'powershell.exe',
      ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', SCRIPT_PATH],
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

module.exports = { getVisibleWindows };
