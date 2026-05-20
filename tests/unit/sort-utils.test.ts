import { describe, it, expect } from 'vitest'
import { compareValues, sortImages } from '../../electron/utils.js'
import type { ImageItem } from '../../electron/types.js'

function makeImage(overrides: Partial<ImageItem> = {}): ImageItem {
  return {
    path: '/test/image.jpg',
    name: 'image.jpg',
    size: 1024,
    modifiedTime: 1000,
    width: 1920,
    height: 1080,
    resolution: 2073600,
    mimeType: 'image/jpeg',
    isAnimated: false,
    ...overrides,
  }
}

describe('compareValues', () => {
  it('sorts by name with numeric awareness (photo2 < photo10)', () => {
    const a = makeImage({ name: 'photo2.jpg' })
    const b = makeImage({ name: 'photo10.jpg' })
    expect(compareValues(a, b, 'name')).toBeLessThan(0)
  })

  it('sorts by name ascending', () => {
    const a = makeImage({ name: 'apple.jpg' })
    const b = makeImage({ name: 'banana.jpg' })
    expect(compareValues(a, b, 'name')).toBeLessThan(0)
  })

  it('sorts by size ascending', () => {
    const a = makeImage({ size: 500 })
    const b = makeImage({ size: 1000 })
    expect(compareValues(a, b, 'size')).toBeLessThan(0)
  })

  it('sorts by modified ascending', () => {
    const a = makeImage({ modifiedTime: 1000 })
    const b = makeImage({ modifiedTime: 2000 })
    expect(compareValues(a, b, 'modified')).toBeLessThan(0)
  })

  it('sorts by resolution ascending', () => {
    const a = makeImage({ width: 1920, height: 1080, resolution: 2073600 })
    const b = makeImage({ width: 3840, height: 2160, resolution: 8294400 })
    expect(compareValues(a, b, 'resolution')).toBeLessThan(0)
  })

  it('null resolution sorts before non-null ascending', () => {
    const a = makeImage({ width: null, height: null, resolution: null })
    const b = makeImage({ width: 1920, height: 1080, resolution: 2073600 })
    expect(compareValues(a, b, 'resolution')).toBe(-1)
  })

  it('null resolution sorts before non-null descending', () => {
    const a = makeImage({ width: null, height: null, resolution: null })
    const b = makeImage({ width: 1920, height: 1080, resolution: 2073600 })
    // When both are null, returns 0; when only a is null, returns -1
    expect(compareValues(a, b, 'resolution')).toBe(-1)
  })

  it('both null resolution returns 0', () => {
    const a = makeImage({ width: null, height: null, resolution: null })
    const b = makeImage({ width: null, height: null, resolution: null })
    expect(compareValues(a, b, 'resolution')).toBe(0)
  })
})

describe('sortImages', () => {
  it('sorts by name ascending', () => {
    const images = [
      makeImage({ name: 'zebra.jpg' }),
      makeImage({ name: 'apple.jpg' }),
      makeImage({ name: 'mango.jpg' }),
    ]
    const sorted = sortImages(images, 'name', 'asc')
    expect(sorted.map((i) => i.name)).toEqual(['apple.jpg', 'mango.jpg', 'zebra.jpg'])
  })

  it('sorts by name descending', () => {
    const images = [
      makeImage({ name: 'apple.jpg' }),
      makeImage({ name: 'mango.jpg' }),
      makeImage({ name: 'zebra.jpg' }),
    ]
    const sorted = sortImages(images, 'name', 'desc')
    expect(sorted.map((i) => i.name)).toEqual(['zebra.jpg', 'mango.jpg', 'apple.jpg'])
  })

  it('sorts by size ascending', () => {
    const images = [
      makeImage({ size: 3000 }),
      makeImage({ size: 1000 }),
      makeImage({ size: 2000 }),
    ]
    const sorted = sortImages(images, 'size', 'asc')
    expect(sorted.map((i) => i.size)).toEqual([1000, 2000, 3000])
  })

  it('sorts by modified ascending', () => {
    const images = [
      makeImage({ modifiedTime: 3000 }),
      makeImage({ modifiedTime: 1000 }),
      makeImage({ modifiedTime: 2000 }),
    ]
    const sorted = sortImages(images, 'modified', 'asc')
    expect(sorted.map((i) => i.modifiedTime)).toEqual([1000, 2000, 3000])
  })

  it('does not mutate original array', () => {
    const original = [
      makeImage({ name: 'zebra.jpg' }),
      makeImage({ name: 'apple.jpg' }),
    ]
    const copy = [...original]
    sortImages(original, 'name', 'asc')
    expect(original.map((i) => i.name)).toEqual(copy.map((i) => i.name))
  })
})