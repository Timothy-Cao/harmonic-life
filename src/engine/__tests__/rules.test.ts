import { describe, it, expect } from 'vitest'
import { survives, updateEnergy, applyPitchGravity } from '../rules'
import { createCell } from '../cell'

describe('survives', () => {
  it('cell with consonant neighbors survives', () => {
    const cell = createCell(60) // C
    const neighbors = [createCell(67), createCell(64)] // G, E — score 1.3
    expect(survives(cell, neighbors, 0.5)).toBe(true)
  })

  it('cell with dissonant neighbors dies', () => {
    const cell = createCell(60) // C
    const neighbors = [createCell(61)] // C# — score -0.6
    expect(survives(cell, neighbors, 0.5)).toBe(false)
  })

  it('isolated cell with no neighbors dies', () => {
    expect(survives(createCell(60), [], 0.5)).toBe(false)
  })
})

describe('updateEnergy', () => {
  it('decays energy each tick', () => {
    const cell = createCell(60, 1.0)
    const updated = updateEnergy(cell, 0, 1.0) // 0 consonant neighbors
    expect(updated.energy).toBeCloseTo(0.98) // 1.0 - 0.02
  })

  it('restores energy from consonant neighbors', () => {
    const cell = createCell(60, 0.5)
    const updated = updateEnergy(cell, 3, 1.0) // 3 consonant neighbors
    expect(updated.energy).toBeCloseTo(0.5 - 0.02 + 3 * 0.05) // 0.63
  })

  it('clamps energy to 1.0', () => {
    const cell = createCell(60, 1.0)
    const updated = updateEnergy(cell, 8, 1.0) // lots of restore
    expect(updated.energy).toBeLessThanOrEqual(1.0)
  })

  it('applies curve multiplier', () => {
    const cell = createCell(60, 1.0)
    const updated = updateEnergy(cell, 0, 0.5) // half energy curve
    expect(updated.energy).toBeCloseTo((1.0 - 0.02) * 0.5)
  })
})

describe('applyPitchGravity', () => {
  it('drifts note toward consonant neighbor average', () => {
    const cell = createCell(60, 1.0) // C4
    const target = 67 // G4
    const result = applyPitchGravity(cell, target, [0, 2, 4, 5, 7, 9, 11])
    // note += (67 - 60) * 0.1 = 60.7
    expect(result.note).toBeCloseTo(60.7)
  })
})
