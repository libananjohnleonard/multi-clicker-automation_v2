const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  getWindows: () => ipcRenderer.invoke('get-windows'),
  selectWindow: (win) => ipcRenderer.invoke('select-window', win),
  redirectToTarget: (win) => ipcRenderer.invoke('redirect-to-target', win)
});
