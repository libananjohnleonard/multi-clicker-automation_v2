const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const windowManager = require('./windowManager');

const PANEL_WIDTH = 260;
const PANEL_HEIGHT = 340;
const PANEL_INSET = 20;
const TRACK_INTERVAL_MS = 1000;
const GRID_COLS = 5;
const GRID_ROWS = 3;
const GRID_CELL_SIZE = 22;
const GRID_WIDTH = GRID_COLS * GRID_CELL_SIZE;
const GRID_HEIGHT = GRID_ROWS * GRID_CELL_SIZE;
const POINT_SIZE = 30;
const POINT_OFFSET_STEP = 30;

let mainWindow;
let panelWindow;
let gridWindow;
let selectedTarget = null;
let trackInterval = null;
let timerIntervalSeconds = 6;
let lastTrackedRect = null;
let automationInterval = null;
let isAutomationRunning = false;
let countdownRemaining = 0;
let isClicking = false;
let clickPoints = [];
let nextPointId = 1;

function sendAutomationState() {
  if (panelWindow && !panelWindow.isDestroyed()) {
    panelWindow.webContents.send('automation-state', {
      running: isAutomationRunning,
      countdown: countdownRemaining
    });
  }
}

function sendClickPointsState() {
  if (panelWindow && !panelWindow.isDestroyed()) {
    panelWindow.webContents.send(
      'click-points-state',
      clickPoints.map((p) => ({ id: p.id }))
    );
  }
}

async function clickAllPoints() {
  for (const point of clickPoints) {
    if (!point.window || point.window.isDestroyed() || !selectedTarget || point.isClicking) continue;

    point.isClicking = true;
    const bounds = point.window.getBounds();
    point.window.setIgnoreMouseEvents(true);
    try {
      await windowManager.clickGrid(selectedTarget.handle, bounds, 1, 1, POINT_SIZE);
    } catch (error) {
      console.error(`[point ${point.id} click failed]`, error);
    } finally {
      if (point.window && !point.window.isDestroyed()) {
        point.window.setIgnoreMouseEvents(false);
      }
    }
    point.isClicking = false;
  }
}

async function clickTheGrid() {
  if (!gridWindow || gridWindow.isDestroyed() || !selectedTarget || isClicking) return;

  isClicking = true;
  const bounds = gridWindow.getBounds();
  gridWindow.setIgnoreMouseEvents(true);
  try {
    await windowManager.clickGrid(selectedTarget.handle, bounds, GRID_COLS, GRID_ROWS, GRID_CELL_SIZE);
  } catch (error) {
    console.error('[grid click failed]', error);
  } finally {
    if (gridWindow && !gridWindow.isDestroyed()) {
      gridWindow.setIgnoreMouseEvents(false);
    }
  }
  isClicking = false;
}

function stopAutomation() {
  isAutomationRunning = false;
  if (automationInterval) {
    clearInterval(automationInterval);
    automationInterval = null;
  }
  sendAutomationState();
}

function startAutomation() {
  if (isAutomationRunning || (!gridWindow && clickPoints.length === 0)) return;

  isAutomationRunning = true;
  sendAutomationState();

  let isCycleActive = true;

  (async () => {
    await clickAllPoints();
    countdownRemaining = timerIntervalSeconds;
    isCycleActive = false;
    sendAutomationState();
  })();

  automationInterval = setInterval(async () => {
    if (isCycleActive) {
      sendAutomationState();
      return;
    }

    countdownRemaining -= 1;

    if (countdownRemaining <= 0) {
      isCycleActive = true;

      await clickTheGrid();
      await clickAllPoints();

      countdownRemaining = timerIntervalSeconds;
      isCycleActive = false;
    }

    sendAutomationState();
  }, 1000);
}

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

function anyOwnWindowFocused() {
  return (
    (panelWindow && !panelWindow.isDestroyed() && panelWindow.isFocused()) ||
    (gridWindow && !gridWindow.isDestroyed() && gridWindow.isFocused()) ||
    clickPoints.some((p) => p.window && !p.window.isDestroyed() && p.window.isFocused())
  );
}

function moveByDelta(win, dx, dy) {
  if (!win || win.isDestroyed()) return;
  const bounds = win.getBounds();
  win.setBounds({ x: bounds.x + dx, y: bounds.y + dy, width: bounds.width, height: bounds.height });
}

function applyVisibility(win, shouldShow) {
  if (!win || win.isDestroyed()) return;

  if (shouldShow) {
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

      const shouldShow = rect.isForeground || anyOwnWindowFocused();

      let dx = 0;
      let dy = 0;
      if (lastTrackedRect) {
        dx = rect.x - lastTrackedRect.x;
        dy = rect.y - lastTrackedRect.y;
      }

      if (dx !== 0 || dy !== 0) moveByDelta(panelWindow, dx, dy);
      applyVisibility(panelWindow, shouldShow);

      if (gridWindow && !gridWindow.isDestroyed()) {
        if (dx !== 0 || dy !== 0) moveByDelta(gridWindow, dx, dy);
        applyVisibility(gridWindow, shouldShow);
      }

      clickPoints.forEach((point) => {
        if (!point.window || point.window.isDestroyed()) return;
        if (dx !== 0 || dy !== 0) moveByDelta(point.window, dx, dy);
        applyVisibility(point.window, shouldShow);
      });

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
    stopAutomation();
    panelWindow = null;
    if (gridWindow) gridWindow.close();
    clickPoints.slice().forEach((p) => p.window && !p.window.isDestroyed() && p.window.close());
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

function createClickPointWindow(target, id) {
  const offset = (clickPoints.length % 5) * POINT_OFFSET_STEP;
  const x = Math.round(target.x + target.width / 2 - POINT_SIZE / 2 + offset);
  const y = Math.round(target.y + target.height / 2 - POINT_SIZE / 2 + offset);

  const win = new BrowserWindow({
    width: POINT_SIZE,
    height: POINT_SIZE,
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

  win.loadFile(path.join(__dirname, 'renderer', 'point.html'));

  const point = {
    id,
    window: win,
    isClicking: false
  };

  win.on('closed', () => {
    clickPoints = clickPoints.filter((p) => p.id !== id);
    sendClickPointsState();
  });

  clickPoints.push(point);
  sendClickPointsState();
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
  if (automationInterval) {
    clearInterval(automationInterval);
    automationInterval = null;
  }
  if (gridWindow) {
    gridWindow.close();
  }
  return true;
});

ipcMain.handle('toggle-automation', () => {
  if (isAutomationRunning) {
    stopAutomation();
  } else {
    startAutomation();
  }
  return { running: isAutomationRunning, countdown: countdownRemaining };
});

ipcMain.handle('add-click-point', () => {
  if (selectedTarget) {
    createClickPointWindow(selectedTarget, nextPointId++);
  }
  return clickPoints.map((p) => ({ id: p.id }));
});

ipcMain.handle('remove-click-point', (event, id) => {
  const point = clickPoints.find((p) => p.id === id);
  if (point && point.window && !point.window.isDestroyed()) {
    point.window.close();
  }
  return true;
});

app.whenReady().then(createMainWindow);

app.on('window-all-closed', () => {
  stopTrackingTarget();
  stopAutomation();
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
});
