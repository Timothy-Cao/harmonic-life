import { describe, it, expect } from 'vitest'
import { createGrid, setCell, stepConway, countAlive, getCell } from '@/engine/grid'

describe('Conway grid', () => {
  it('a blinker oscillates between vertical and horizontal', () => {
    const size = 5
    let g = createGrid(size)
    // horizontal blinker in the middle
    g = setCell(g, size, 1, 2, 1)
    g = setCell(g, size, 2, 2, 1)
    g = setCell(g, size, 3, 2, 1)

    const next = stepConway(g, size)
    expect(getCell(next, size, 2, 1)).toBe(1)
    expect(getCell(next, size, 2, 2)).toBe(1)
    expect(getCell(next, size, 2, 3)).toBe(1)
    expect(countAlive(next)).toBe(3)

    const back = stepConway(next, size)
    // back to horizontal
    expect(getCell(back, size, 1, 2)).toBe(1)
    expect(getCell(back, size, 2, 2)).toBe(1)
    expect(getCell(back, size, 3, 2)).toBe(1)
  })

  it('a block is stable', () => {
    const size = 4
    let g = createGrid(size)
    g = setCell(g, size, 1, 1, 1)
    g = setCell(g, size, 2, 1, 1)
    g = setCell(g, size, 1, 2, 1)
    g = setCell(g, size, 2, 2, 1)
    const next = stepConway(g, size)
    expect(Array.from(next)).toEqual(Array.from(g))
  })
})
