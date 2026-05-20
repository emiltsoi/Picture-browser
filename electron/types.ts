export type SortField = 'name' | 'size' | 'resolution' | 'modified'
export type SortDirection = 'asc' | 'desc'

export type ImageItem = {
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