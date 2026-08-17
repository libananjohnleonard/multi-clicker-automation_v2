const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const windowManager = require('./windowManager');

const PANEL_WIDTH = 260;
const PANEL_HEIGHT = 180;
const PANEL_INSET = 20;
const TRACK_INTERVAL_MS = 1000;
const GRID_COLS = 14;
const GRID_ROWS = 8;
const GRID_CELL_SIZE = 20;
const GRID_WIDTH = GRID_COLS * GRID_CELL_SIZE;
const GRID_HEIGHT = GRID_ROWS * GRID_CELL_SIZE;

let mainWindow;
let panelWindow;
let gridWindow;
let selectedTarget = null;
let trackInterval = null;
let timerIntervalSeconds = 6;
let lastTrackedRect = null;

function computePanelPosition(target) {
  return {
    x: Math.round(target.x + target.width - PANEL_WIDTH - PANEL_INSET),
    y: Math.round(target.y + PANEL_INSET)
  };
}

function stopTrackingTarget() {
  if (trackInterval) {
    clearInterval(trackInterval);
    trackInterval = null;
  }
  lastTrackedRect = null;
}

function applyForegroundVisibility(win, isTargetForeground) {
  if (!win || win.isDestroyed()) return;

  if (isTargetForeground || win.isFocused()) {
    if (!win.isVisible()) win.showInactive();
  } else if (win.isVisible()) {
    win.hide();
  }
}

function startTrackingTarget(handle) {
  stopTrackingTarget();

  trackInterval = setInterval(async () => {
    if (!panelWindow || panelWindow.isDestroyed()) {
      stopTrackingTarget();
      return;
    }

    try {
      const rect = await windowManager.getWindowRect(handle);
      if (!rect.exists) return;

      const pos = computePanelPosition(rect);
      panelWindow.setBounds({ x: pos.x, y: pos.y, width: PANEL_WIDTH, height: PANEL_HEIGHT });
      applyForegroundVisibility(panelWindow, rect.isForeground);

      if (gridWindow && !gridWindow.isDestroyed()) {
        if (lastTrackedRect) {
          const dx = rect.x - lastTrackedRect.x;
          const dy = rect.y - lastTrackedRect.y;
          if (dx !== 0 || dy !== 0) {
            const bounds = gridWindow.getBounds();
            gridWindow.setBounds({ x: bounds.x + dx, y: bounds.y + dy, width: bounds.width, height: bounds.height });
          }
        }
        applyForegroundVisibility(gridWindow, rect.isForeground);
      }

      lastTrackedRect = rect;
    } catch (error) {
      // transient PowerShell errors are ignored; next tick retries
    }
  }, TRACK_INTERVAL_MS);
}

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
  const pos = computePanelPosition(target);

  panelWindow = new BrowserWindow({
    width: PANEL_WIDTH,
    height: PANEL_HEIGHT,
    x: pos.x,
    y: pos.y,
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

  panelWindow.on('closed', () => {
    stopTrackingTarget();
    panelWindow = null;
    if (gridWindow) gridWindow.close();
  });

  startTrackingTarget(target.handle);
}

function createGridWindow(target) {
  const x = Math.round(target.x + (target.width - GRID_WIDTH) / 2);
  const y = Math.round(target.y + (target.height - GRID_HEIGHT) / 2);

  gridWindow = new BrowserWindow({
    width: GRID_WIDTH,
    height: GRID_HEIGHT,
    x,
    y,
    frame: false,
    alwaysOnTop: true,
    resizable: false,
    transparent: true,
    hasShadow: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  gridWindow.loadFile(path.join(__dirname, 'renderer', 'grid.html'));

  gridWindow.on('closed', () => {
    gridWindow = null;
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

ipcMain.handle('set-timer-interval', (event, seconds) => {
  if (Number.isInteger(seconds) && seconds >= 1) {
    timerIntervalSeconds = seconds;
  }
  return timerIntervalSeconds;
});

ipcMain.handle('add-grid', () => {
  if (!gridWindow && selectedTarget) {
    createGridWindow(selectedTarget);
  }
  return !!gridWindow;
});

ipcMain.handle('remove-grid', () => {
  if (gridWindow) {
    gridWindow.close();
  }
  return true;
});

app.whenReady().then(createMainWindow);

app.on('window-all-closed', () => {
  stopTrackingTarget();
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
});
