import { describe, it, expect } from 'vitest'
import { rowToMidi, bassNoteForBar, PENTATONIC } from '@/engine/music'

describe('music mapping', () => {
  it('row 0 is higher than the bottom row', () => {
    const top = rowToMidi(0, 32, 0)
    const bottom = rowToMidi(31, 32, 0)
    expect(top).toBeGreaterThan(bottom)
  })

  it('every rowToMidi result lies on the pentatonic scale', () => {
    for (let r = 0; r < 32; r++) {
      const midi = rowToMidi(r, 32, 0)
      const pc = ((midi % 12) + 12) % 12
      expect(PENTATONIC).toContain(pc)
    }
  })

  it('bass progression cycles through 4 bars', () => {
    const notes = [0, 1, 2, 3].map(b => bassNoteForBar(b, 0))
    expect(new Set(notes).size).toBeGreaterThan(1)
    expect(bassNoteForBar(4, 0)).toBe(bassNoteForBar(0, 0))
  })
})
