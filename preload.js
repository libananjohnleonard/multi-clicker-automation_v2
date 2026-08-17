const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  getWindows: () => ipcRenderer.invoke('get-windows'),
  selectWindow: (win) => ipcRenderer.invoke('select-window', win),
  redirectToTarget: (win) => ipcRenderer.invoke('redirect-to-target', win),
  showFloatingPanel: (target) => ipcRenderer.invoke('show-floating-panel', target),
  onTargetInfo: (callback) => ipcRenderer.on('target-info', (event, target) => callback(target)),
  setTimerInterval: (seconds) => ipcRenderer.invoke('set-timer-interval', seconds),
  addGrid: () => ipcRenderer.invoke('add-grid'),
  removeGrid: () => ipcRenderer.invoke('remove-grid'),
  toggleAutomation: () => ipcRenderer.invoke('toggle-automation'),
  onAutomationState: (callback) => ipcRenderer.on('automation-state', (event, state) => callback(state)),
  addClickPoint: () => ipcRenderer.invoke('add-click-point'),
  removeClickPoint: (id) => ipcRenderer.invoke('remove-click-point', id),
  setPointTimer: (id, seconds) => ipcRenderer.invoke('set-point-timer', id, seconds),
  onClickPointsState: (callback) => ipcRenderer.on('click-points-state', (event, points) => callback(points)),
  setIgnoreMouseEvents: (ignore) => ipcRenderer.send('set-ignore-mouse', ignore)
});
