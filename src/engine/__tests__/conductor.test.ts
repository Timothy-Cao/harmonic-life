import { describe, it, expect } from 'vitest'
import { createConductor, getEnergyCurve, updateConductor } from '../conductor'

describe('createConductor', () => {
  it('initializes with default state', () => {
    const c = createConductor()
    expect(c.tick).toBe(0)
    expect(c.key).toBe(0) // C
    expect(c.progressionIndex).toBe(0)
    expect(c.curveMultiplier).toBe(1.0)
  })
})

describe('getEnergyCurve', () => {
  it('returns small value at tick 0 (start of rise)', () => {
    expect(getEnergyCurve(1, 200)).toBeGreaterThan(0)
    expect(getEnergyCurve(1, 200)).toBeLessThan(0.1)
  })

  it('returns ~1.0 during plateau', () => {
    expect(getEnergyCurve(100, 200)).toBeCloseTo(1.0)
  })

  it('returns near 0 at end of fall', () => {
    expect(getEnergyCurve(199, 200)).toBeLessThan(0.05)
  })
})
