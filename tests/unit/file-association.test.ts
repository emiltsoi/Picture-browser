import { describe, it, expect } from 'vitest'

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

function isImageFile(filePath: string): boolean {
  const ext = filePath.toLowerCase()
  return supportedExtensions.has(ext)
}

function findImageFileInArgs(args: string[]): string | null {
  return args.find((arg) => {
    const ext = '.' + arg.split('.').pop()?.toLowerCase()
    return supportedExtensions.has(ext)
  }) ?? null
}

describe('isImageFile', () => {
  it('returns true for .jpg', () => {
    expect(isImageFile('.jpg')).toBe(true)
  })

  it('returns true for .jpeg', () => {
    expect(isImageFile('.jpeg')).toBe(true)
  })

  it('returns true for .png', () => {
    expect(isImageFile('.png')).toBe(true)
  })

  it('returns true for .gif', () => {
    expect(isImageFile('.gif')).toBe(true)
  })

  it('returns true for .webp', () => {
    expect(isImageFile('.webp')).toBe(true)
  })

  it('returns true for .bmp', () => {
    expect(isImageFile('.bmp')).toBe(true)
  })

  it('returns true for .svg', () => {
    expect(isImageFile('.svg')).toBe(true)
  })

  it('returns true for .tif', () => {
    expect(isImageFile('.tif')).toBe(true)
  })

  it('returns true for .tiff', () => {
    expect(isImageFile('.tiff')).toBe(true)
  })

  it('returns true for uppercase extensions', () => {
    expect(isImageFile('.JPG')).toBe(true)
    expect(isImageFile('.PNG')).toBe(true)
    expect(isImageFile('.WebP')).toBe(true)
  })

  it('returns false for unknown extensions', () => {
    expect(isImageFile('.xyz')).toBe(false)
    expect(isImageFile('.txt')).toBe(false)
    expect(isImageFile('.doc')).toBe(false)
  })
})

describe('findImageFileInArgs', () => {
  it('finds image file in command line args', () => {
    const args = ['/path/to/electron', '/path/to/image.jpg']
    expect(findImageFileInArgs(args)).toBe('/path/to/image.jpg')
  })

  it('finds image file among other args', () => {
    const args = ['electron.exe', '--disable-gpu', 'C:\\Users\\test\\photo.png', '--some-flag']
    expect(findImageFileInArgs(args)).toBe('C:\\Users\\test\\photo.png')
  })

  it('returns null when no image file found', () => {
    const args = ['electron.exe', '--help', '--version']
    expect(findImageFileInArgs(args)).toBe(null)
  })

  it('returns null for non-image file extensions', () => {
    const args = ['electron.exe', 'document.pdf', 'archive.zip']
    expect(findImageFileInArgs(args)).toBe(null)
  })

  it('handles files with multiple dots in name', () => {
    const args = ['electron.exe', 'my.photo.2024.jpg']
    expect(findImageFileInArgs(args)).toBe('my.photo.2024.jpg')
  })

  it('handles mixed case extensions', () => {
    const args = ['electron.exe', 'PHOTO.JPEG']
    expect(findImageFileInArgs(args)).toBe('PHOTO.JPEG')
  })

  it('handles Windows-style paths', () => {
    const args = ['C:\\Program Files\\app\\electron.exe', 'D:\\Pictures\\vacation.png']
    expect(findImageFileInArgs(args)).toBe('D:\\Pictures\\vacation.png')
  })

  it('handles Unix-style paths', () => {
    const args = ['/usr/bin/electron', '/home/user/images/photo.gif']
    expect(findImageFileInArgs(args)).toBe('/home/user/images/photo.gif')
  })
})