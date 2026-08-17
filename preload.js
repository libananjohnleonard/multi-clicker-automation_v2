const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  getWindows: () => ipcRenderer.invoke('get-windows'),
  selectWindow: (win) => ipcRenderer.invoke('select-window', win)
});
