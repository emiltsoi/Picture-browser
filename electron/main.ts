import { app, BrowserWindow, dialog, ipcMain, nativeImage } from 'electron'
import { promises as fs } from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { imageSize } from 'image-size'

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

const supportedExtensions = new Set([
  '.jpg',
  '.jpeg',
  '.png',
  '.gif',
  '.webp',
  '.bmp',
  '.svg',
  '.tif',
  '.tiff',
])

let mainWindow: BrowserWindow | null = null

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 960,
    minWidth: 960,
    minHeight: 640,
    backgroundColor: '#111111',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(app.getAppPath(), 'electron', 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  const devServerUrl = process.env.VITE_DEV_SERVER_URL

  if (devServerUrl) {
    void mainWindow.loadURL(devServerUrl)
  } else {
    void mainWindow.loadFile(path.join(app.getAppPath(), 'dist', 'index.html'))
  }
}

function compareValues(a: ImageItem, b: ImageItem, field: SortField) {
  if (field === 'name') {
    return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' })
  }

  if (field === 'size') {
    return a.size - b.size
  }

  if (field === 'modified') {
    return a.modifiedTime - b.modifiedTime
  }

  const left = a.resolution ?? Number.NEGATIVE_INFINITY
  const right = b.resolution ?? Number.NEGATIVE_INFINITY
  return left - right
}

function sortImages(images: ImageItem[], field: SortField, direction: SortDirection) {
  const sorted = [...images].sort((a, b) => compareValues(a, b, field))
  return direction === 'asc' ? sorted : sorted.reverse()
}

function getMimeType(extension: string) {
  switch (extension) {
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg'
    case '.png':
      return 'image/png'
    case '.gif':
      return 'image/gif'
    case '.webp':
      return 'image/webp'
    case '.bmp':
      return 'image/bmp'
    case '.svg':
      return 'image/svg+xml'
    case '.tif':
    case '.tiff':
      return 'image/tiff'
    default:
      return 'application/octet-stream'
  }
}

async function fileToDataUrl(filePath: string) {
  const extension = path.extname(filePath).toLowerCase()
  const mimeType = getMimeType(extension)
  const fileBuffer = await fs.readFile(filePath)
  return `data:${mimeType};base64,${fileBuffer.toString('base64')}`
}

async function fileToThumbnailDataUrl(filePath: string, width: number, height: number) {
  const thumbnail = await nativeImage.createThumbnailFromPath(filePath, { width, height })
  return thumbnail.toDataURL()
}

function getImageDimensions(filePath: string) {
  try {
    const dimensions = imageSize(filePath)
    return {
      width: typeof dimensions.width === 'number' ? dimensions.width : null,
      height: typeof dimensions.height === 'number' ? dimensions.height : null,
    }
  } catch {
    return {
      width: null,
      height: null,
    }
  }
}

async function readImageItem(filePath: string, includeDimensions: boolean): Promise<ImageItem | null> {
  try {
    const stats = await fs.stat(filePath)
    if (!stats.isFile()) {
      return null
    }

    const extension = path.extname(filePath).toLowerCase()
    if (!supportedExtensions.has(extension)) {
      return null
    }

    const { width, height } = includeDimensions ? getImageDimensions(filePath) : { width: null, height: null }

    return {
      path: filePath,
      name: path.basename(filePath),
      size: stats.size,
      modifiedTime: stats.mtimeMs,
      width,
      height,
      resolution: width && height ? width * height : null,
      mimeType: getMimeType(extension),
      isAnimated: extension === '.gif' || extension === '.webp',
    }
  } catch {
    return null
  }
}

async function scanDirectory(directoryPath: string, sortField: SortField) {
  const stats = await fs.stat(directoryPath)
  if (!stats.isDirectory()) {
    throw new Error('The selected path is not a directory.')
  }

  const entries = await fs.readdir(directoryPath, { withFileTypes: true })
  const includeDimensions = sortField === 'resolution'
  const imagePromises = entries
    .filter((entry) => entry.isFile())
    .map((entry) => readImageItem(path.join(directoryPath, entry.name), includeDimensions))

  const imageItems = await Promise.all(imagePromises)
  return imageItems.filter((item): item is ImageItem => item !== null)
}

app.whenReady().then(() => {
  ipcMain.handle('directory:pick', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory'],
    })

    if (result.canceled || result.filePaths.length === 0) {
      return null
    }

    return result.filePaths[0]
  })

  ipcMain.handle('file:pick-image', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [
        {
          name: 'Images',
          extensions: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg', 'tif', 'tiff'],
        },
      ],
    })

    if (result.canceled || result.filePaths.length === 0) {
      return null
    }

    return result.filePaths[0]
  })

  ipcMain.handle('directory:load', async (_event, directoryPath: string, sortField: SortField, sortDirection: SortDirection) => {
    const images = await scanDirectory(directoryPath, sortField)
    return sortImages(images, sortField, sortDirection)
  })

  ipcMain.handle('directory:exists', async (_event, directoryPath: string) => {
    try {
      const stats = await fs.stat(directoryPath)
      return stats.isDirectory()
    } catch {
      return false
    }
  })

  ipcMain.handle('window:toggle-fullscreen', () => {
    if (!mainWindow) {
      return false
    }

    const nextValue = !mainWindow.isFullScreen()
    mainWindow.setFullScreen(nextValue)
    return nextValue
  })

  ipcMain.handle('window:is-fullscreen', () => {
    return mainWindow?.isFullScreen() ?? false
  })

  ipcMain.handle('file:to-url', (_event, filePath: string) => {
    return pathToFileURL(filePath).href
  })

  ipcMain.handle('file:to-data-url', async (_event, filePath: string) => {
    return fileToDataUrl(filePath)
  })

  ipcMain.handle('file:to-thumbnail-data-url', async (_event, filePath: string, width: number, height: number) => {
    return fileToThumbnailDataUrl(filePath, width, height)
  })

  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
