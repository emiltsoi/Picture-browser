/// <reference types="vite/client" />

type SortField = 'name' | 'size' | 'resolution' | 'modified'
type SortDirection = 'asc' | 'desc'
type FitMode = 'actual' | 'fit-width' | 'fit-height' | 'fit-screen' | 'custom'

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

declare global {
  interface Window {
    pictureBrowserAPI?: {
      pickDirectory: () => Promise<string | null>
      pickImageFile: () => Promise<string | null>
      loadDirectory: (directoryPath: string, sortField: SortField, sortDirection: SortDirection) => Promise<ImageItem[]>
      directoryExists: (directoryPath: string) => Promise<boolean>
      toggleFullscreen: () => Promise<boolean>
      isFullscreen: () => Promise<boolean>
      toFileUrl: (filePath: string) => Promise<string>
      toDataUrl: (filePath: string) => Promise<string>
      toThumbnailDataUrl: (filePath: string, width: number, height: number) => Promise<string>
    }
  }
}

export {}
