import { describe, it, expect } from 'vitest'

const MIN_CUSTOM_ZOOM = 10
const MAX_CUSTOM_ZOOM = 800

function clampZoomPercent(value: number) {
  return Math.max(MIN_CUSTOM_ZOOM, Math.min(MAX_CUSTOM_ZOOM, Math.round(value)))
}

describe('clampZoomPercent', () => {
  it('returns value when within range', () => {
    expect(clampZoomPercent(50)).toBe(50)
    expect(clampZoomPercent(100)).toBe(100)
    expect(clampZoomPercent(500)).toBe(500)
  })

  it('clamps to MIN_CUSTOM_ZOOM when below', () => {
    expect(clampZoomPercent(0)).toBe(10)
    expect(clampZoomPercent(1)).toBe(10)
    expect(clampZoomPercent(5)).toBe(10)
    expect(clampZoomPercent(9)).toBe(10)
  })

  it('clamps to MAX_CUSTOM_ZOOM when above', () => {
    expect(clampZoomPercent(801)).toBe(800)
    expect(clampZoomPercent(900)).toBe(800)
    expect(clampZoomPercent(1000)).toBe(800)
    expect(clampZoomPercent(9999)).toBe(800)
  })

  it('rounds decimal values', () => {
    expect(clampZoomPercent(50.4)).toBe(50)
    expect(clampZoomPercent(50.6)).toBe(51)
  })

  it('boundary: 10 returns 10', () => {
    expect(clampZoomPercent(10)).toBe(10)
  })

  it('boundary: 800 returns 800', () => {
    expect(clampZoomPercent(800)).toBe(800)
  })
})