// src/engine/music.ts
// Music helpers: pentatonic pitch mapping + a fixed 4-bar bass progression.
// Everything stays in a pentatonic key, so no combination of cells can be dissonant.

// C major pentatonic intervals from root
export const PENTATONIC = [0, 2, 4, 7, 9]

// Map a row index (0 = top/high, gridHeight-1 = bottom/low) to a MIDI note.
// We use 4 octaves of pentatonic centred so the typical row plays in a kalimba-friendly range.
const LOWEST_MIDI = 48 // C3
const HIGHEST_MIDI = 84 // C6

export function rowToMidi(row: number, gridHeight: number, rootKey: number = 0): number {
  // Build a ladder of pentatonic notes within [LOWEST_MIDI, HIGHEST_MIDI]
  const ladder: number[] = []
  for (let midi = LOWEST_MIDI; midi <= HIGHEST_MIDI; midi++) {
    if (PENTATONIC.includes(((midi - rootKey) % 12 + 12) % 12)) ladder.push(midi)
  }
  if (ladder.length === 0) return 60
  // Top of grid (row 0) = highest pitch. Map evenly across the ladder.
  const inverted = gridHeight - 1 - row
  const idx = Math.round((inverted / (gridHeight - 1)) * (ladder.length - 1))
  return ladder[Math.max(0, Math.min(ladder.length - 1, idx))]
}

// I - V - vi - IV in scale-degree terms, transposed by rootKey.
// In C major: C - G - Am - F. All notes are pentatonic-compatible, so the bass
// always sits politely under whatever the cells do.
const BASS_PROGRESSION = [0, 7, 9, 5] // semitone offsets from root for the bass note

export function bassNoteForBar(barIndex: number, rootKey: number = 0): number {
  const offset = BASS_PROGRESSION[barIndex % BASS_PROGRESSION.length]
  return 36 + ((rootKey + offset) % 12) // anchor around C2
}

export const BARS_PER_LOOP = BASS_PROGRESSION.length
