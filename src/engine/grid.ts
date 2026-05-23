// src/engine/grid.ts
// Pure boolean Conway's Game of Life grid.
// Cells are just alive/dead. Music interpretation lives in src/audio.

export type Grid = Uint8Array  // 0 = dead, 1 = alive

export function createGrid(size: number): Grid {
  return new Uint8Array(size * size)
}

export function cloneGrid(grid: Grid): Grid {
  return new Uint8Array(grid)
}

export function getCell(grid: Grid, size: number, x: number, y: number): number {
  if (x < 0 || x >= size || y < 0 || y >= size) return 0
  return grid[y * size + x]
}

export function setCell(grid: Grid, size: number, x: number, y: number, alive: 0 | 1): Grid {
  if (x < 0 || x >= size || y < 0 || y >= size) return grid
  const next = new Uint8Array(grid)
  next[y * size + x] = alive
  return next
}

export function toggleCell(grid: Grid, size: number, x: number, y: number): Grid {
  if (x < 0 || x >= size || y < 0 || y >= size) return grid
  const next = new Uint8Array(grid)
  const i = y * size + x
  next[i] = next[i] ? 0 : 1
  return next
}

// Conway B3/S23 with toroidal wrap-around so gliders don't fall off the edge.
export function stepConway(grid: Grid, size: number): Grid {
  const next = new Uint8Array(size * size)
  for (let y = 0; y < size; y++) {
    const yUp = (y - 1 + size) % size
    const yDn = (y + 1) % size
    for (let x = 0; x < size; x++) {
      const xL = (x - 1 + size) % size
      const xR = (x + 1) % size
      const n =
        grid[yUp * size + xL] + grid[yUp * size + x] + grid[yUp * size + xR] +
        grid[y   * size + xL] +                         grid[y   * size + xR] +
        grid[yDn * size + xL] + grid[yDn * size + x] + grid[yDn * size + xR]
      const alive = grid[y * size + x]
      // Conway B3/S23: birth on 3 neighbors, survive on 2 or 3
      next[y * size + x] = (n === 3 || (alive && n === 2)) ? 1 : 0
    }
  }
  return next
}

export function countAlive(grid: Grid): number {
  let n = 0
  for (let i = 0; i < grid.length; i++) n += grid[i]
  return n
}

export function clearGrid(size: number): Grid {
  return new Uint8Array(size * size)
}
