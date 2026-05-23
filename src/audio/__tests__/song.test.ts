import { describe, it, expect } from 'vitest'
import { chordAtStep, leadNoteAtStep, arpNoteAtStep, rowToChordTone, PROGRESSION } from '@/audio/song'

describe('song', () => {
  it('chord cycles every 4 bars', () => {
    expect(chordAtStep(0)).toBe(PROGRESSION[0])
    expect(chordAtStep(16)).toBe(PROGRESSION[1])
    expect(chordAtStep(32)).toBe(PROGRESSION[2])
    expect(chordAtStep(48)).toBe(PROGRESSION[3])
    expect(chordAtStep(64)).toBe(PROGRESSION[0])
  })

  it('arp fires on even steps only', () => {
    expect(arpNoteAtStep(0)).not.toBeNull()
    expect(arpNoteAtStep(1)).toBeNull()
    expect(arpNoteAtStep(2)).not.toBeNull()
  })

  it('lead melody has notes', () => {
    const someNonNull = Array.from({ length: 64 }, (_, i) => leadNoteAtStep(i)).filter(n => n !== null)
    expect(someNonNull.length).toBeGreaterThan(8)
  })

  it('every rowToChordTone result is a chord tone of the active chord', () => {
    for (let step = 0; step < 64; step += 8) {
      const chord = chordAtStep(step)
      const allowed = new Set(chord.tones.map(m => ((m % 12) + 12) % 12))
      for (let row = 0; row < 32; row++) {
        const midi = rowToChordTone(row, 32, step)
        const pc = ((midi % 12) + 12) % 12
        expect(allowed.has(pc)).toBe(true)
      }
    }
  })
})
