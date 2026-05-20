const { contextBridge, ipcRenderer } = require('electron')

const api = {
  pickDirectory: () => ipcRenderer.invoke('directory:pick'),
  pickImageFile: () => ipcRenderer.invoke('file:pick-image'),
  loadDirectory: (directoryPath, sortField, sortDirection) =>
    ipcRenderer.invoke('directory:load', directoryPath, sortField, sortDirection),
  directoryExists: (directoryPath) => ipcRenderer.invoke('directory:exists', directoryPath),
  toggleFullscreen: () => ipcRenderer.invoke('window:toggle-fullscreen'),
  isFullscreen: () => ipcRenderer.invoke('window:is-fullscreen'),
  toFileUrl: (filePath) => ipcRenderer.invoke('file:to-url', filePath),
  toDataUrl: (filePath) => ipcRenderer.invoke('file:to-data-url', filePath),
  toThumbnailDataUrl: (filePath, width, height) => ipcRenderer.invoke('file:to-thumbnail-data-url', filePath, width, height),
  getInitialFilePath: () => ipcRenderer.invoke('file:get-initial-path'),
  onFileOpenedFromAssociation: (callback) => {
    const listener = (_event, filePath) => callback(filePath)
    ipcRenderer.on('file:opened-from-association', listener)
    return () => ipcRenderer.removeListener('file:opened-from-association', listener)
  },
  onMenuAction: (callback) => {
    const listener = (_event, action) => callback(action)
    ipcRenderer.on('menu:action', listener)
    return () => ipcRenderer.removeListener('menu:action', listener)
  },
}

contextBridge.exposeInMainWorld('pictureBrowserAPI', api)
