import { contextBridge, ipcRenderer } from 'electron'
import type { SortField, SortDirection, ImageItem } from './types.js'

type MenuAction = 'open-folder' | 'open-picture' | 'toggle-fullscreen' | 'toggle-picture-mode' | 'show-help'

const api = {
  pickDirectory: () => ipcRenderer.invoke('directory:pick') as Promise<string | null>,
  pickImageFile: () => ipcRenderer.invoke('file:pick-image') as Promise<string | null>,
  loadDirectory: (directoryPath: string, sortField: SortField, sortDirection: SortDirection) =>
    ipcRenderer.invoke('directory:load', directoryPath, sortField, sortDirection) as Promise<ImageItem[]>,
  directoryExists: (directoryPath: string) => ipcRenderer.invoke('directory:exists', directoryPath) as Promise<boolean>,
  toggleFullscreen: () => ipcRenderer.invoke('window:toggle-fullscreen') as Promise<boolean>,
  isFullscreen: () => ipcRenderer.invoke('window:is-fullscreen') as Promise<boolean>,
  toFileUrl: (filePath: string) => ipcRenderer.invoke('file:to-url', filePath) as Promise<string>,
  toDataUrl: (filePath: string) => ipcRenderer.invoke('file:to-data-url', filePath) as Promise<string>,
  toThumbnailDataUrl: (filePath: string, width: number, height: number) =>
    ipcRenderer.invoke('file:to-thumbnail-data-url', filePath, width, height) as Promise<string>,
  getInitialFilePath: () => ipcRenderer.invoke('file:get-initial-path') as Promise<string | null>,
  onFileOpenedFromAssociation: (callback: (filePath: string) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, filePath: string) => callback(filePath)
    ipcRenderer.on('file:opened-from-association', listener)
    return () => ipcRenderer.removeListener('file:opened-from-association', listener)
  },
  onMenuAction: (callback: (action: MenuAction) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, action: MenuAction) => callback(action)
    ipcRenderer.on('menu:action', listener)
    return () => ipcRenderer.removeListener('menu:action', listener)
  },
}

contextBridge.exposeInMainWorld('pictureBrowserAPI', api)
