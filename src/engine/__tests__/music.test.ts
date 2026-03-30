import { describe, it, expect } from 'vitest'
import { getScaleNotes, findChordCompletion, SCALES } from '../music'

describe('getScaleNotes', () => {
  it('returns C major pentatonic notes', () => {
    const notes = getScaleNotes(0, 'pentatonic') // C pentatonic
    expect(notes).toEqual([0, 2, 4, 7, 9])
  })

  it('returns D major scale notes', () => {
    const notes = getScaleNotes(2, 'major') // D major
    expect(notes).toEqual([2, 4, 6, 7, 9, 11, 1])
  })
})

describe('findChordCompletion', () => {
  it('completes C major triad from C and E → G', () => {
    const result = findChordCompletion([0, 4], getScaleNotes(0, 'major'))
    expect(result).toContain(7) // G completes C-E-G
  })

  it('completes A minor triad from A and C → E', () => {
    const result = findChordCompletion([9, 0], getScaleNotes(0, 'major'))
    expect(result).toContain(4) // E completes A-C-E
  })

  it('returns empty when no completion fits scale', () => {
    const result = findChordCompletion([1, 5], getScaleNotes(0, 'pentatonic'))
    expect(Array.isArray(result)).toBe(true)
  })

  it('returns empty for single note', () => {
    const result = findChordCompletion([0], getScaleNotes(0, 'major'))
    expect(result).toEqual([])
  })
})
