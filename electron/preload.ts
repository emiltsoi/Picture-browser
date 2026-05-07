import { contextBridge, ipcRenderer } from 'electron'

type SortField = 'name' | 'size' | 'resolution' | 'modified'
type SortDirection = 'asc' | 'desc'

type ImageItem = {
  path: string
  name: string
  size: number
  modifiedTime: number
  width: number | null
  height: number | null
  resolution: number | null
  mimeType: string
  isAnimated: boolean
}

const api = {
  pickDirectory: () => ipcRenderer.invoke('directory:pick') as Promise<string | null>,
  loadDirectory: (directoryPath: string, sortField: SortField, sortDirection: SortDirection) =>
    ipcRenderer.invoke('directory:load', directoryPath, sortField, sortDirection) as Promise<ImageItem[]>,
  directoryExists: (directoryPath: string) => ipcRenderer.invoke('directory:exists', directoryPath) as Promise<boolean>,
  toggleFullscreen: () => ipcRenderer.invoke('window:toggle-fullscreen') as Promise<boolean>,
  isFullscreen: () => ipcRenderer.invoke('window:is-fullscreen') as Promise<boolean>,
  toFileUrl: (filePath: string) => ipcRenderer.invoke('file:to-url', filePath) as Promise<string>,
}

contextBridge.exposeInMainWorld('pictureBrowserAPI', api)
