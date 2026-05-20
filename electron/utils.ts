import type { SortField, SortDirection, ImageItem } from './types.js'

export function compareValues(a: ImageItem, b: ImageItem, field: SortField) {
  if (field === 'name') {
    return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' })
  }

  if (field === 'size') {
    return a.size - b.size
  }

  if (field === 'modified') {
    return a.modifiedTime - b.modifiedTime
  }

  if (a.resolution === null && b.resolution === null) {
    return 0
  }
  if (a.resolution === null) {
    return -1
  }
  if (b.resolution === null) {
    return 1
  }
  return a.resolution - b.resolution
}

export function sortImages(images: ImageItem[], field: SortField, direction: SortDirection) {
  const sorted = [...images].sort((a, b) => compareValues(a, b, field))
  return direction === 'asc' ? sorted : sorted.reverse()
}

export function getMimeType(extension: string) {
  const ext = extension.toLowerCase()
  switch (ext) {
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