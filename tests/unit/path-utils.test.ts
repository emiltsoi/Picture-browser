import { describe, it, expect } from 'vitest'

function getParentDirectory(filePath: string) {
  const normalizedPath = filePath.replace(/\\/g, '/')
  const lastSlashIndex = normalizedPath.lastIndexOf('/')

  if (lastSlashIndex <= 0) {
    return filePath
  }

  const parent = normalizedPath.slice(0, lastSlashIndex)
  if (parent.length <= 2) {
    return filePath
  }
  return filePath.includes('\\') ? parent.replace(/\//g, '\\') : parent
}

describe('getParentDirectory', () => {
  it('returns parent for Unix file path', () => {
    expect(getParentDirectory('/home/user/photos/image.jpg')).toBe('/home/user/photos')
  })

  it('returns parent for deep Unix path', () => {
    expect(getParentDirectory('/a/b/c/d/file.png')).toBe('/a/b/c/d')
  })

  it('returns original path for root-level file on Unix', () => {
    expect(getParentDirectory('/image.jpg')).toBe('/image.jpg')
  })

  it('returns parent for Windows file path', () => {
    expect(getParentDirectory('C:\\Users\\John\\Pictures\\photo.png')).toBe('C:\\Users\\John\\Pictures')
  })

  it('returns parent for deep Windows path', () => {
    expect(getParentDirectory('C:\\Users\\John\\Documents\\Photos\\image.jpg')).toBe('C:\\Users\\John\\Documents\\Photos')
  })

  it('returns original path for Windows drive root', () => {
    expect(getParentDirectory('C:\\image.jpg')).toBe('C:\\image.jpg')
  })

  it('handles Windows network share path', () => {
    expect(getParentDirectory('\\\\server\\share\\photos\\image.jpg')).toBe('\\\\server\\share\\photos')
  })

  it('handles macOS network share path', () => {
    expect(getParentDirectory('/Volumes/server/share/photos/image.jpg')).toBe('/Volumes/server/share/photos')
  })

  it('handles single segment Unix path', () => {
    expect(getParentDirectory('photo.jpg')).toBe('photo.jpg')
  })

  it('handles mixed separators in Windows path', () => {
    expect(getParentDirectory('C:/Users/John/Pictures/photo.png')).toBe('C:/Users/John/Pictures')
  })
})