// src/engine/__tests__/tick.test.ts
import { describe, it, expect } from 'vitest'
import { simulateTick } from '../tick'
import { createGrid, setCell } from '../grid'
import { createCell } from '../cell'
import { createConductor } from '../conductor'

describe('simulateTick', () => {
  it('kills isolated cell (no harmonic support)', () => {
    let grid = createGrid(8)
    grid = setCell(grid, 8, 4, 4, createCell(60, 0.03))
    const conductor = createConductor()

    const result = simulateTick(grid, 8, conductor, [0, 2, 4, 7, 9])
    const cell = result.grid[4 * 8 + 4]
    expect(cell === null || cell.energy <= 0.01).toBe(true)
  })

  it('consonant neighbors keep cells alive', () => {
    let grid = createGrid(8)
    grid = setCell(grid, 8, 3, 4, createCell(60, 0.8))
    grid = setCell(grid, 8, 4, 4, createCell(67, 0.8))
    const conductor = createConductor()

    const result = simulateTick(grid, 8, conductor, [0, 2, 4, 5, 7, 9, 11])
    expect(result.grid[4 * 8 + 3]).not.toBeNull()
    expect(result.grid[4 * 8 + 4]).not.toBeNull()
  })

  it('advances conductor tick', () => {
    const grid = createGrid(8)
    const conductor = createConductor()
    const result = simulateTick(grid, 8, conductor, [0, 2, 4, 7, 9])
    expect(result.conductor.tick).toBe(1)
  })
})
