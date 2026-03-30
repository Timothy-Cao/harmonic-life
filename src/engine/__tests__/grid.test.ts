// src/engine/__tests__/grid.test.ts
import { describe, it, expect } from 'vitest'
import { createGrid, getCell, setCell, getNeighbors, gridDensity } from '../grid'
import { createCell } from '../cell'

describe('createGrid', () => {
  it('creates a grid of given size filled with null', () => {
    const grid = createGrid(4)
    expect(grid.length).toBe(16)
    expect(grid.every(c => c === null)).toBe(true)
  })
})

describe('getCell / setCell', () => {
  it('sets and gets a cell by x,y', () => {
    const grid = createGrid(4)
    const cell = createCell(60)
    const next = setCell(grid, 4, 1, 2, cell)
    expect(getCell(next, 4, 1, 2)).toEqual(cell)
  })

  it('returns null for out-of-bounds', () => {
    const grid = createGrid(4)
    expect(getCell(grid, 4, -1, 0)).toBeNull()
    expect(getCell(grid, 4, 4, 0)).toBeNull()
  })
})

describe('getNeighbors', () => {
  it('returns up to 8 neighbors for interior cell', () => {
    const grid = createGrid(4)
    const withCell = setCell(grid, 4, 1, 0, createCell(60))
    const neighbors = getNeighbors(withCell, 4, 1, 1)
    // (1,0) is a neighbor of (1,1)
    expect(neighbors.length).toBe(1)
    expect(neighbors[0].note).toBe(60)
  })
})

describe('gridDensity', () => {
  it('returns 0 for empty grid', () => {
    expect(gridDensity(createGrid(4), 4)).toBe(0)
  })

  it('returns correct density', () => {
    let grid = createGrid(4)
    grid = setCell(grid, 4, 0, 0, createCell(60))
    grid = setCell(grid, 4, 1, 1, createCell(64))
    expect(gridDensity(grid, 4)).toBeCloseTo(2 / 16)
  })
})
