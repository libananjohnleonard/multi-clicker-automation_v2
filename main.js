const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const windowManager = require('./windowManager');

let mainWindow;
let selectedTarget = null;

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 480,
    height: 360,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));
}

ipcMain.handle('get-windows', () => windowManager.getVisibleWindows());

ipcMain.handle('select-window', (event, win) => {
  selectedTarget = win;
  return selectedTarget;
});

ipcMain.handle('redirect-to-target', async (event, win) => {
  const bounds = await windowManager.bringToForeground(win.handle);
  selectedTarget = { ...win, ...bounds };
  return selectedTarget;
});

app.whenReady().then(createMainWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
});
