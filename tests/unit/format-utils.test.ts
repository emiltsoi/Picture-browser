import { describe, it, expect } from 'vitest'
import type { ImageItem } from '../../src/types.js'

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

function formatResolution(item: ImageItem) {
  if (!item.width || !item.height) {
    return 'Unknown'
  }

  return `${item.width} × ${item.height}`
}

describe('formatFileSize', () => {
  it('formats bytes', () => {
    expect(formatFileSize(0)).toBe('0 B')
    expect(formatFileSize(500)).toBe('500 B')
    expect(formatFileSize(1023)).toBe('1023 B')
  })

  it('formats KB', () => {
    expect(formatFileSize(1024)).toBe('1.0 KB')
    expect(formatFileSize(1536)).toBe('1.5 KB')
    expect(formatFileSize(2048)).toBe('2.0 KB')
  })

  it('formats MB', () => {
    expect(formatFileSize(1048576)).toBe('1.0 MB')
    expect(formatFileSize(1572864)).toBe('1.5 MB')
    expect(formatFileSize(10485760)).toBe('10.0 MB')
  })

  it('formats GB', () => {
    expect(formatFileSize(1073741824)).toBe('1.0 GB')
    expect(formatFileSize(2147483648)).toBe('2.0 GB')
  })

  it('rounds large values without decimal', () => {
    expect(formatFileSize(102400)).toBe('100 KB')
  })

  it('shows one decimal for small values', () => {
    expect(formatFileSize(1536)).toBe('1.5 KB')
  })
})

describe('formatResolution', () => {
  it('formats standard resolution', () => {
    const item = { width: 1920, height: 1080 } as ImageItem
    expect(formatResolution(item)).toBe('1920 × 1080')
  })

  it('formats 4K resolution', () => {
    const item = { width: 3840, height: 2160 } as ImageItem
    expect(formatResolution(item)).toBe('3840 × 2160')
  })

  it('returns Unknown for null width', () => {
    const item = { width: null, height: 1080 } as ImageItem
    expect(formatResolution(item)).toBe('Unknown')
  })

  it('returns Unknown for null height', () => {
    const item = { width: 1920, height: null } as ImageItem
    expect(formatResolution(item)).toBe('Unknown')
  })

  it('returns Unknown for both null', () => {
    const item = { width: null, height: null } as ImageItem
    expect(formatResolution(item)).toBe('Unknown')
  })

  it('returns Unknown for undefined', () => {
    const item = {} as ImageItem
    expect(formatResolution(item)).toBe('Unknown')
  })
})