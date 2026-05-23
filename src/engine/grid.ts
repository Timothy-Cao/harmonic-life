// src/engine/grid.ts
import { Cell } from './cell'

export type Grid = (Cell | null)[]

export function createGrid(size: number): Grid {
  return new Array(size * size).fill(null)
}

export function getCell(grid: Grid, size: number, x: number, y: number): Cell | null {
  if (x < 0 || x >= size || y < 0 || y >= size) return null
  return grid[y * size + x]
}

export function setCell(grid: Grid, size: number, x: number, y: number, cell: Cell | null): Grid {
  if (x < 0 || x >= size || y < 0 || y >= size) return grid
  const next = [...grid]
  next[y * size + x] = cell
  return next
}

const NEIGHBOR_OFFSETS = [
  [-1, -1], [0, -1], [1, -1],
  [-1,  0],          [1,  0],
  [-1,  1], [0,  1], [1,  1],
]

export function getNeighbors(grid: Grid, size: number, x: number, y: number): Cell[] {
  const result: Cell[] = []
  for (const [dx, dy] of NEIGHBOR_OFFSETS) {
    const cell = getCell(grid, size, x + dx, y + dy)
    if (cell) result.push(cell)
  }
  return result
}

export function gridDensity(grid: Grid, size: number): number {
  let count = 0
  for (const cell of grid) {
    if (cell) count++
  }
  return count / (size * size)
}

export function applySilenceBomb(
  grid: Grid, size: number, cx: number, cy: number, radius: number
): Grid {
  const next = [...grid]
  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      if (dx * dx + dy * dy > radius * radius) continue
      const x = cx + dx, y = cy + dy
      if (x < 0 || x >= size || y < 0 || y >= size) continue
      next[y * size + x] = null
    }
  }
  return next
}
