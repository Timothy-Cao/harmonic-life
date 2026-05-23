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

// Drops a small consonant cluster near the center so the canvas is never blank on load.
// Notes are root, fifth, octave-third — a stable, pleasant seed in any major-ish scale.
export function seedGarden(size: number, rootKey: number = 0): Grid {
  const grid = createGrid(size)
  const cx = Math.floor(size / 2)
  const cy = Math.floor(size / 2)
  const base = 60 + rootKey // middle C-ish + root offset
  const seeds: Array<[number, number, number]> = [
    [cx - 3, cy,     base],            // root
    [cx,     cy - 2, base + 7],        // fifth
    [cx + 3, cy,     base + 12],       // octave
    [cx,     cy + 3, base + 4],        // major third
    [cx - 1, cy + 1, base - 5],        // bass fourth below
  ]
  for (const [x, y, note] of seeds) {
    if (x >= 0 && x < size && y >= 0 && y < size) {
      grid[y * size + x] = { note, energy: 0.9, age: 0 }
    }
  }
  return grid
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
