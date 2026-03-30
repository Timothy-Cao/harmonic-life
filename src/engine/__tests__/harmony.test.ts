// src/engine/__tests__/harmony.test.ts
import { describe, it, expect } from 'vitest'
import { getInterval, intervalScore, scoreHarmony } from '../harmony'
import { createCell } from '../cell'

describe('getInterval', () => {
  it('returns interval mod 12', () => {
    expect(getInterval(60, 67)).toBe(7) // perfect fifth
    expect(getInterval(60, 61)).toBe(1) // minor 2nd
    expect(getInterval(60, 72)).toBe(0) // octave = unison
  })
})

describe('intervalScore', () => {
  it('returns correct scores for known intervals', () => {
    expect(intervalScore(0)).toBe(1.0)   // unison
    expect(intervalScore(7)).toBe(0.8)   // fifth
    expect(intervalScore(1)).toBe(-0.6)  // minor 2nd
    expect(intervalScore(6)).toBe(-0.5)  // tritone
  })
})

describe('scoreHarmony', () => {
  it('sums scores across neighbors', () => {
    const cell = createCell(60)  // C
    const neighbors = [
      createCell(67), // G — fifth (+0.8)
      createCell(64), // E — major third (+0.5)
    ]
    expect(scoreHarmony(cell, neighbors)).toBeCloseTo(1.3)
  })

  it('returns 0 for no neighbors', () => {
    expect(scoreHarmony(createCell(60), [])).toBe(0)
  })

  it('handles dissonant neighbors', () => {
    const cell = createCell(60) // C
    const neighbors = [createCell(61)] // C# — minor 2nd (-0.6)
    expect(scoreHarmony(cell, neighbors)).toBeCloseTo(-0.6)
  })
})
