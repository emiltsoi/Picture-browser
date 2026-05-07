import { useEffect, useMemo, useRef, useState } from 'react'
import type { MouseEvent as ReactMouseEvent, WheelEvent as ReactWheelEvent } from 'react'
import type { FitMode, ImageItem, SortDirection, SortField } from './types'

const MIN_CUSTOM_ZOOM = 10
const MAX_CUSTOM_ZOOM = 800
const ZOOM_STEP = 10

async function resolveImageUrl(api: NonNullable<typeof window.pictureBrowserAPI>, item: ImageItem, forThumbnail: boolean) {
  if (item.mimeType === 'image/webp') {
    if (forThumbnail) {
      return api.toThumbnailDataUrl(item.path, 96, 72)
    }

    return api.toDataUrl(item.path)
  }

  return api.toFileUrl(item.path)
}

function getParentDirectory(filePath: string) {
  const normalizedPath = filePath.replace(/\\/g, '/')
  const lastSlashIndex = normalizedPath.lastIndexOf('/')

  if (lastSlashIndex <= 0) {
    return filePath
  }

  const parent = normalizedPath.slice(0, lastSlashIndex)
  return filePath.includes('\\') ? parent.replace(/\//g, '\\') : parent
}

const sortOptions: Array<{ value: SortField; label: string }> = [
  { value: 'name', label: 'Name' },
  { value: 'size', label: 'File Size' },
  { value: 'resolution', label: 'Resolution' },
  { value: 'modified', label: 'Modified Date' },
]

const fitOptions: Array<{ value: FitMode; label: string }> = [
  { value: 'actual', label: 'Actual Size' },
  { value: 'fit-width', label: 'Fit Width' },
  { value: 'fit-height', label: 'Fit Height' },
  { value: 'fit-screen', label: 'Fit Screen' },
  { value: 'custom', label: 'Custom Size' },
]

function formatFileSize(value: number) {
  if (value < 1024) {
    return `${value} B`
  }

  const units = ['KB', 'MB', 'GB', 'TB']
  let size = value / 1024
  let index = 0

  while (size >= 1024 && index < units.length - 1) {
    size /= 1024
    index += 1
  }

  return `${size.toFixed(size >= 100 ? 0 : 1)} ${units[index]}`
}

function formatDate(value: number) {
  return new Date(value).toLocaleString()
}

function formatResolution(item: ImageItem) {
  if (!item.width || !item.height) {
    return 'Unknown'
  }

  return `${item.width} × ${item.height}`
}

function getViewerClassName(fitMode: FitMode) {
  switch (fitMode) {
    case 'actual':
      return 'viewer-image viewer-image-actual'
    case 'fit-width':
      return 'viewer-image viewer-image-fit-width'
    case 'fit-height':
      return 'viewer-image viewer-image-fit-height'
    case 'custom':
      return 'viewer-image viewer-image-custom'
    default:
      return 'viewer-image viewer-image-fit-screen'
  }
}

export default function App() {
  const api = window.pictureBrowserAPI
  const viewerStageRef = useRef<HTMLDivElement | null>(null)
  const viewerImageRef = useRef<HTMLImageElement | null>(null)
  const thumbnailListRef = useRef<HTMLDivElement | null>(null)
  const dragStateRef = useRef<{ isDragging: boolean; startX: number; startY: number; scrollLeft: number; scrollTop: number; panX: number; panY: number }>({
    isDragging: false,
    startX: 0,
    startY: 0,
    scrollLeft: 0,
    scrollTop: 0,
    panX: 0,
    panY: 0,
  })
  const [directoryPath, setDirectoryPath] = useState('')
  const [images, setImages] = useState<ImageItem[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [sortField, setSortField] = useState<SortField>('name')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')
  const [fitMode, setFitMode] = useState<FitMode>('fit-screen')
  const [customZoomPercent, setCustomZoomPercent] = useState(100)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isPictureMode, setIsPictureMode] = useState(false)
  const [isHelpOpen, setIsHelpOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [selectedImageUrl, setSelectedImageUrl] = useState('')
  const [thumbnailUrls, setThumbnailUrls] = useState<Record<string, string>>({})
  const [naturalImageSize, setNaturalImageSize] = useState({ width: 0, height: 0 })
  const [picturePan, setPicturePan] = useState({ x: 0, y: 0 })

  const selectedImage = images[selectedIndex] ?? null
  const viewerClassName = `${getViewerClassName(fitMode)}${isPictureMode ? ' viewer-image-picture-mode' : ''}`
  const viewerStageClassName = `viewer-stage viewer-stage-${fitMode}${isPictureMode ? ' viewer-stage-picture-mode' : ''}`
  const viewerCanvasClassName = `viewer-canvas viewer-canvas-${fitMode}${isPictureMode ? ' viewer-canvas-picture-mode' : ''}`
  const customPixelWidth = naturalImageSize.width > 0 ? `${Math.round((naturalImageSize.width * customZoomPercent) / 100)}px` : `${customZoomPercent}%`
  const viewerImageStyle = fitMode === 'custom'
    ? { width: customPixelWidth, height: 'auto', maxWidth: 'none', maxHeight: 'none' }
    : undefined
  const pictureModeImageStyle = (() => {
    if (!isPictureMode) {
      return viewerImageStyle
    }

    const rendered = getRenderedImageSize()

    if (rendered.width <= 0 || rendered.height <= 0) {
      return { transform: `translate(${picturePan.x}px, ${picturePan.y}px)` }
    }

    return {
      width: `${Math.round(rendered.width)}px`,
      height: `${Math.round(rendered.height)}px`,
      maxWidth: 'none',
      maxHeight: 'none',
      transform: `translate(${picturePan.x}px, ${picturePan.y}px)`,
    }
  })()

  function clampZoomPercent(value: number) {
    return Math.max(MIN_CUSTOM_ZOOM, Math.min(MAX_CUSTOM_ZOOM, Math.round(value)))
  }

  function getRenderedImageSize() {
    const natW = naturalImageSize.width
    const natH = naturalImageSize.height

    if (natW <= 0 || natH <= 0) {
      return { width: 0, height: 0 }
    }

    const vpW = window.innerWidth
    const vpH = window.innerHeight

    switch (fitMode) {
      case 'fit-screen': {
        const scale = Math.min(vpW / natW, vpH / natH)
        return { width: natW * scale, height: natH * scale }
      }
      case 'fit-width':
        return { width: vpW, height: natH * (vpW / natW) }
      case 'fit-height':
        return { width: natW * (vpH / natH), height: vpH }
      case 'actual':
        return { width: natW, height: natH }
      case 'custom': {
        const scale = customZoomPercent / 100
        return { width: natW * scale, height: natH * scale }
      }
      default:
        return { width: natW, height: natH }
    }
  }

  function getClampedPicturePan(nextPanX: number, nextPanY: number) {
    const rendered = getRenderedImageSize()
    const vpW = window.innerWidth
    const vpH = window.innerHeight

    const overflowX = Math.max(0, rendered.width - vpW)
    const overflowY = Math.max(0, rendered.height - vpH)
    const maxPanX = overflowX / 2
    const maxPanY = overflowY / 2

    return {
      x: Math.max(-maxPanX, Math.min(maxPanX, nextPanX)),
      y: Math.max(-maxPanY, Math.min(maxPanY, nextPanY)),
    }
  }

  function getCurrentDisplayZoomPercent() {
    const natW = naturalImageSize.width

    if (natW <= 0) {
      return customZoomPercent
    }

    if (isPictureMode) {
      const rendered = getRenderedImageSize()
      return rendered.width > 0 ? clampZoomPercent((rendered.width / natW) * 100) : customZoomPercent
    }

    const imageElement = viewerImageRef.current
    const baseWidth = imageElement?.naturalWidth ?? natW

    if (!imageElement || baseWidth <= 0) {
      return customZoomPercent
    }

    const renderedWidth = imageElement.getBoundingClientRect().width
    if (renderedWidth <= 0) {
      return customZoomPercent
    }

    return clampZoomPercent((renderedWidth / baseWidth) * 100)
  }

  function syncCustomZoomFromCurrentDisplay() {
    setCustomZoomPercent(getCurrentDisplayZoomPercent())
  }

  function changeFitMode(nextFitMode: FitMode) {
    if (nextFitMode !== fitMode && selectedImageUrl) {
      syncCustomZoomFromCurrentDisplay()
    }

    setFitMode(nextFitMode)
    setPicturePan({ x: 0, y: 0 })
  }

  function getSelectedImageIndex(items: ImageItem[], filePath: string) {
    const index = items.findIndex((item) => item.path === filePath)
    return index >= 0 ? index : 0
  }

  function goToPreviousImage() {
    setSelectedIndex((current: number) => Math.max(current - 1, 0))
  }

  function goToNextImage() {
    setSelectedIndex((current: number) => Math.min(current + 1, Math.max(images.length - 1, 0)))
  }

  const statusText = useMemo(() => {
    if (images.length === 0) {
      return 'No images loaded'
    }

    return `${selectedIndex + 1} / ${images.length}`
  }, [images.length, selectedIndex])

  useEffect(() => {
    if (!api) {
      setError('Desktop bridge failed to load. Restart the app after the preload fix is applied.')
      return
    }

    void api.isFullscreen().then(setIsFullscreen)
  }, [])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      const tagName = target?.tagName ?? ''
      const isTyping = tagName === 'INPUT' || tagName === 'TEXTAREA' || target?.isContentEditable

      if (isTyping) {
        return
      }

      if (event.key === 'ArrowLeft') {
        event.preventDefault()
        goToPreviousImage()
        return
      }

      if (event.key === 'ArrowRight') {
        event.preventDefault()
        goToNextImage()
        return
      }

      if (event.key === 'Home') {
        event.preventDefault()
        setSelectedIndex(0)
        return
      }

      if (event.key === 'End') {
        event.preventDefault()
        setSelectedIndex(Math.max(images.length - 1, 0))
        return
      }

      if (event.key === 'Escape' && isPictureMode) {
        event.preventDefault()
        setIsPictureMode(false)
        return
      }

      if (event.key === 'Escape' && isHelpOpen) {
        event.preventDefault()
        setIsHelpOpen(false)
        return
      }

      if (event.key.toLowerCase() === 'f') {
        event.preventDefault()
        void handleToggleFullscreen()
        return
      }

      if (event.key.toLowerCase() === 'p') {
        event.preventDefault()
        void handleTogglePictureMode()
        return
      }

      if (event.key === '1') {
        changeFitMode('actual')
        return
      }

      if (event.key === '2') {
        changeFitMode('fit-width')
        return
      }

      if (event.key === '3') {
        changeFitMode('fit-height')
        return
      }

      if (event.key === '4') {
        changeFitMode('fit-screen')
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [images.length, isHelpOpen, isPictureMode])

  useEffect(() => {
    const onMouseMove = (event: MouseEvent) => {
      const stage = viewerStageRef.current
      const dragState = dragStateRef.current

      if (!stage || !dragState.isDragging) {
        return
      }

      const deltaX = event.clientX - dragState.startX
      const deltaY = event.clientY - dragState.startY

      if (isPictureMode) {
        setPicturePan(getClampedPicturePan(dragState.panX + deltaX, dragState.panY + deltaY))
        return
      }

      stage.scrollLeft = dragState.scrollLeft - deltaX
      stage.scrollTop = dragState.scrollTop - deltaY
    }

    const onMouseUp = () => {
      const stage = viewerStageRef.current
      dragStateRef.current.isDragging = false
      stage?.classList.remove('viewer-stage-dragging')
    }

    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)

    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }
  }, [isPictureMode, fitMode, customZoomPercent, naturalImageSize])

  async function loadDirectory(nextPath?: string, preferredFilePath?: string) {
    if (!api) {
      setError('Desktop bridge is unavailable.')
      return
    }

    const pathToLoad = (nextPath ?? directoryPath).trim()

    if (!pathToLoad) {
      setError('Enter or choose a folder path.')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const exists = await api.directoryExists(pathToLoad)
      if (!exists) {
        setError('Directory not found or inaccessible.')
        setImages([])
        setSelectedIndex(0)
        return
      }

      const loadedImages = await api.loadDirectory(pathToLoad, sortField, sortDirection)

      setDirectoryPath(pathToLoad)
      setImages(loadedImages)
      setThumbnailUrls({})
      setSelectedImageUrl('')
      setPicturePan({ x: 0, y: 0 })
      setSelectedIndex(preferredFilePath ? getSelectedImageIndex(loadedImages, preferredFilePath) : 0)

      if (loadedImages.length === 0) {
        setError('No supported images found in this folder.')
      }
    } catch (loadError) {
      setImages([])
      setSelectedIndex(0)
      setError(loadError instanceof Error ? loadError.message : 'Failed to load the directory.')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleBrowse() {
    if (!api) {
      setError('Desktop bridge is unavailable.')
      return
    }

    const pickedPath = await api.pickDirectory()
    if (pickedPath) {
      setDirectoryPath(pickedPath)
      await loadDirectory(pickedPath)
    }
  }

  async function handleOpenPicture() {
    if (!api) {
      setError('Desktop bridge is unavailable.')
      return
    }

    const pickedFile = await api.pickImageFile()
    if (!pickedFile) {
      return
    }

    const parentDirectory = getParentDirectory(pickedFile)
    setDirectoryPath(parentDirectory)
    await loadDirectory(parentDirectory, pickedFile)
  }

  async function handleToggleFullscreen() {
    if (!api) {
      setError('Desktop bridge is unavailable.')
      return
    }

    const nextValue = await api.toggleFullscreen()
    setIsFullscreen(nextValue)
  }

  async function handleTogglePictureMode() {
    if (!api) {
      setError('Desktop bridge is unavailable.')
      return
    }

    const nextPictureMode = !isPictureMode

    if (nextPictureMode && !isFullscreen) {
      const nextValue = await api.toggleFullscreen()
      setIsFullscreen(nextValue)
    }

    setIsPictureMode(nextPictureMode)
  }

  useEffect(() => {
    if (!directoryPath) {
      return
    }

    void loadDirectory(directoryPath)
  }, [sortField, sortDirection])

  useEffect(() => {
    if (!api || !selectedImage) {
      setSelectedImageUrl('')
      setNaturalImageSize({ width: 0, height: 0 })
      return
    }

    let isCancelled = false

    void resolveImageUrl(api, selectedImage, false).then((url) => {
      if (!isCancelled) {
        setSelectedImageUrl(url)
      }
    }).catch(() => {
      if (!isCancelled) {
        setSelectedImageUrl('')
      }
    })

    return () => {
      isCancelled = true
    }
  }, [api, selectedImage])

  useEffect(() => {
    setPicturePan({ x: 0, y: 0 })
  }, [selectedIndex, isPictureMode, fitMode, customZoomPercent])

  useEffect(() => {
    if (!isPictureMode) {
      return
    }

    const stage = viewerStageRef.current
    if (stage) {
      stage.scrollLeft = 0
      stage.scrollTop = 0
    }

    setPicturePan((current) => getClampedPicturePan(current.x, current.y))
  }, [isPictureMode, selectedImageUrl, fitMode, customZoomPercent, naturalImageSize.width, naturalImageSize.height])

  useEffect(() => {
    const thumbnailList = thumbnailListRef.current
    const selectedThumbnail = thumbnailList?.querySelector<HTMLButtonElement>('.thumbnail-card-selected')

    selectedThumbnail?.scrollIntoView({
      block: 'center',
      inline: 'nearest',
    })
  }, [selectedIndex, images])

  useEffect(() => {
    if (!api || images.length === 0) {
      setThumbnailUrls({})
      return
    }

    const priorityImages = images.slice(Math.max(0, selectedIndex - 30), Math.min(images.length, selectedIndex + 31))
    const pendingImages = priorityImages.filter((item) => !thumbnailUrls[item.path])

    if (pendingImages.length === 0) {
      return
    }

    let isCancelled = false

    void Promise.all(
      pendingImages.map(async (item) => {
        const url = await resolveImageUrl(api, item, true)
        return [item.path, url] as const
      }),
    ).then((entries) => {
      if (isCancelled) {
        return
      }

      setThumbnailUrls((current) => {
        const next = { ...current }
        for (const [filePath, url] of entries) {
          next[filePath] = url
        }
        return next
      })
    }).catch(() => {
    })

    return () => {
      isCancelled = true
    }
  }, [api, images, selectedIndex, thumbnailUrls])

  function handleViewerWheel(event: ReactWheelEvent<HTMLDivElement>) {
    if (event.ctrlKey) {
      event.preventDefault()
      const delta = event.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP
      const baseZoom = fitMode === 'custom' ? customZoomPercent : getCurrentDisplayZoomPercent()
      setCustomZoomPercent(clampZoomPercent(baseZoom + delta))
      setFitMode('custom')
      return
    }

    if (Math.abs(event.deltaY) < 8) {
      return
    }

    event.preventDefault()

    if (event.deltaY > 0) {
      goToNextImage()
      return
    }

    goToPreviousImage()
  }

  function handleViewerMouseDown(event: ReactMouseEvent<HTMLDivElement>) {
    const stage = event.currentTarget
    if (!stage) {
      return
    }

    if (event.button !== 0) {
      return
    }

    const canPanHorizontally = isPictureMode ? true : stage.scrollWidth > stage.clientWidth
    const canPanVertically = isPictureMode ? true : stage.scrollHeight > stage.clientHeight

    if (!canPanHorizontally && !canPanVertically) {
      return
    }

    dragStateRef.current = {
      isDragging: true,
      startX: event.clientX,
      startY: event.clientY,
      scrollLeft: stage.scrollLeft,
      scrollTop: stage.scrollTop,
      panX: picturePan.x,
      panY: picturePan.y,
    }

    event.preventDefault()
    event.stopPropagation()
    viewerStageRef.current = stage
    stage.classList.add('viewer-stage-dragging')
  }

  return (
    <div className={`app-shell${isPictureMode ? ' app-shell-picture-mode' : ''}`}>
      <header className={`toolbar${isPictureMode ? ' toolbar-hidden' : ''}`}>
        <div className="toolbar-path-group">
          <input
            className="path-input"
            value={directoryPath}
            onChange={(event) => setDirectoryPath(event.target.value)}
            placeholder="Enter local path or network path, e.g. C:\\Pictures or \\\\server\\share"
          />
          <button className="toolbar-button" onClick={() => void loadDirectory()} disabled={isLoading}>
            Open
          </button>
          <button className="toolbar-button toolbar-button-secondary" onClick={() => void handleBrowse()} disabled={isLoading}>
            Browse
          </button>
          <button className="toolbar-button toolbar-button-secondary" onClick={() => void handleOpenPicture()} disabled={isLoading}>
            Open Picture
          </button>
        </div>
        <div className="toolbar-controls">
          <label className="control-group">
            <span>Sort</span>
            <select value={sortField} onChange={(event) => setSortField(event.target.value as SortField)}>
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <button
            className="toolbar-button toolbar-button-secondary"
            onClick={() => setSortDirection((value: SortDirection) => (value === 'asc' ? 'desc' : 'asc'))}
          >
            {sortDirection === 'asc' ? 'Ascending' : 'Descending'}
          </button>
          <label className="control-group">
            <span>Fit</span>
            <select value={fitMode} onChange={(event) => changeFitMode(event.target.value as FitMode)}>
              {fitOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          {fitMode === 'custom' ? (
            <label className="control-group control-group-zoom">
              <span>Zoom</span>
              <input
                className="zoom-input"
                type="number"
                min={MIN_CUSTOM_ZOOM}
                max={MAX_CUSTOM_ZOOM}
                step={ZOOM_STEP}
                value={customZoomPercent}
                onChange={(event) => setCustomZoomPercent(clampZoomPercent(Number(event.target.value) || 100))}
              />
              <span>%</span>
            </label>
          ) : null}
          <button className="toolbar-button" onClick={() => void handleToggleFullscreen()}>
            {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          </button>
          <button className="toolbar-button toolbar-button-secondary" onClick={() => void handleTogglePictureMode()} disabled={!selectedImage}>
            {isPictureMode ? 'Exit Picture Mode' : 'Picture Mode'}
          </button>
          <button className="toolbar-button toolbar-button-secondary toolbar-help-button" onClick={() => setIsHelpOpen(true)}>
            ?
          </button>
        </div>
      </header>

      <main className={`content-grid${isPictureMode ? ' content-grid-picture-mode' : ''}`}>
        <aside className={`sidebar${isPictureMode ? ' sidebar-hidden' : ''}`}>
          <div className="sidebar-header">
            <span>{statusText}</span>
            {isLoading ? <span>Loading...</span> : null}
          </div>
          <div ref={thumbnailListRef} className="thumbnail-list">
            {images.map((image, index) => (
              <button
                key={image.path}
                className={`thumbnail-card${index === selectedIndex ? ' thumbnail-card-selected' : ''}`}
                onClick={() => setSelectedIndex(index)}
                title={image.name}
              >
                <img className="thumbnail-image" src={thumbnailUrls[image.path] ?? ''} alt={image.name} loading="lazy" />
                <div className="thumbnail-meta">
                  <strong>{image.name}</strong>
                  <span>{formatResolution(image)}</span>
                  <span>{formatFileSize(image.size)}</span>
                </div>
              </button>
            ))}
          </div>
        </aside>

        <section className="viewer-panel">
          {selectedImage ? (
            <>
              <div
                ref={viewerStageRef}
                className={viewerStageClassName}
                onWheel={handleViewerWheel}
                onMouseDown={handleViewerMouseDown}
              >
                <div className={viewerCanvasClassName}>
                  <img
                    ref={viewerImageRef}
                    className={viewerClassName}
                    style={pictureModeImageStyle}
                    src={selectedImageUrl}
                    alt={selectedImage.name}
                    draggable={false}
                    onLoad={(event) => setNaturalImageSize({ width: event.currentTarget.naturalWidth, height: event.currentTarget.naturalHeight })}
                    onDragStart={(event) => event.preventDefault()}
                  />
                </div>
              </div>
              <div className={`viewer-info-bar${isPictureMode ? ' viewer-info-bar-hidden' : ''}`}>
                <div>
                  <strong>{selectedImage.name}</strong>
                </div>
                <div>{formatResolution(selectedImage)}</div>
                <div>{formatFileSize(selectedImage.size)}</div>
                <div>{formatDate(selectedImage.modifiedTime)}</div>
                <div>{selectedImage.isAnimated ? 'Animated' : 'Static'}</div>
              </div>
            </>
          ) : (
            <div className="empty-state">
              <h1>Picture Browser</h1>
              <p>Open a local folder or network share to browse images.</p>
              <p>Use Left and Right arrow keys to move between pictures.</p>
            </div>
          )}
          {error ? <div className="error-banner">{error}</div> : null}
          {isHelpOpen ? (
            <div className="help-overlay" onClick={() => setIsHelpOpen(false)}>
              <div className="help-dialog" onClick={(event) => event.stopPropagation()}>
                <div className="help-dialog-header">
                  <h2>Controls</h2>
                  <button className="toolbar-button toolbar-button-secondary" onClick={() => setIsHelpOpen(false)}>
                    Close
                  </button>
                </div>
                <div className="help-grid">
                  <div>
                    <h3>Keyboard</h3>
                    <p>Left / Right: Previous / Next picture</p>
                    <p>Home / End: First / Last picture</p>
                    <p>F: Toggle fullscreen</p>
                    <p>P: Toggle picture mode</p>
                    <p>Esc: Exit picture mode or close help</p>
                    <p>1 / 2 / 3 / 4: Actual / Fit Width / Fit Height / Fit Screen</p>
                    <p>Ctrl + Scroll: Zoom in / out and switch to Custom Size</p>
                  </div>
                  <div>
                    <h3>Mouse</h3>
                    <p>Mouse wheel: Previous / Next picture</p>
                    <p>Left click + drag: Pan oversized image</p>
                    <p>Custom Size: Use zoom percentage or Ctrl + Scroll</p>
                    <p>Click a thumbnail: Select picture</p>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </section>
      </main>
    </div>
  )
}
