const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const windowManager = require('./windowManager');

let mainWindow;
let panelWindow;
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

function createPanelWindow(target) {
  const panelWidth = 260;
  const panelHeight = 180;
  const x = Math.round(target.x + target.width - panelWidth - 20);
  const y = Math.round(target.y + 20);

  panelWindow = new BrowserWindow({
    width: panelWidth,
    height: panelHeight,
    x,
    y,
    frame: false,
    alwaysOnTop: true,
    resizable: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  panelWindow.loadFile(path.join(__dirname, 'renderer', 'panel.html'));

  panelWindow.webContents.once('did-finish-load', () => {
    panelWindow.webContents.send('target-info', target);
  });
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

ipcMain.handle('show-floating-panel', (event, target) => {
  if (mainWindow) mainWindow.hide();
  createPanelWindow(target);
  return true;
});

app.whenReady().then(createMainWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
});
