import { describe, it, expect } from 'vitest'
import { getMimeType } from '../../electron/utils.js'

describe('getMimeType', () => {
  it('returns image/jpeg for .jpg', () => {
    expect(getMimeType('.jpg')).toBe('image/jpeg')
  })

  it('returns image/jpeg for .jpeg', () => {
    expect(getMimeType('.jpeg')).toBe('image/jpeg')
  })

  it('returns image/png for .png', () => {
    expect(getMimeType('.png')).toBe('image/png')
  })

  it('returns image/gif for .gif', () => {
    expect(getMimeType('.gif')).toBe('image/gif')
  })

  it('returns image/webp for .webp', () => {
    expect(getMimeType('.webp')).toBe('image/webp')
  })

  it('returns image/bmp for .bmp', () => {
    expect(getMimeType('.bmp')).toBe('image/bmp')
  })

  it('returns image/svg+xml for .svg', () => {
    expect(getMimeType('.svg')).toBe('image/svg+xml')
  })

  it('returns image/tiff for .tif', () => {
    expect(getMimeType('.tif')).toBe('image/tiff')
  })

  it('returns image/tiff for .tiff', () => {
    expect(getMimeType('.tiff')).toBe('image/tiff')
  })

  it('returns application/octet-stream for unknown extension', () => {
    expect(getMimeType('.xyz')).toBe('application/octet-stream')
    expect(getMimeType('.unknown')).toBe('application/octet-stream')
    expect(getMimeType('.foo')).toBe('application/octet-stream')
  })

  it('is case-insensitive for extensions', () => {
    expect(getMimeType('.JPG')).toBe('image/jpeg')
    expect(getMimeType('.PNG')).toBe('image/png')
    expect(getMimeType('.WebP')).toBe('image/webp')
  })
})