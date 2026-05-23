// src/audio/song.ts
// The hand-composed song that always plays underneath. Conway is window dressing —
// this file owns the actual music. 4-bar loop in A minor: Am – F – C – G.
//
// Each chord exposes:
//   bass:  a single low MIDI note for the downbeat
//   pad:   the chord triad (MIDI notes) for the held pad
//   arp:   4 ascending chord-tone notes played as an 1/8th-note arpeggio
//   tones: every chord-tone MIDI note across a comfortable range; user-triggered
//          ornament notes are picked from here, guaranteeing they fit the chord

export type Chord = {
  bass: number
  pad: number[]
  arp: number[]
  tones: number[]
}

const M = (note: string, octave: number): number => {
  const names: Record<string, number> = { C: 0, 'C#': 1, D: 2, 'D#': 3, E: 4, F: 5, 'F#': 6, G: 7, 'G#': 8, A: 9, 'A#': 10, B: 11 }
  return (octave + 1) * 12 + names[note]
}

// Build a chord-tone ladder across octaves 3..6 so row-mapping has range.
function ladder(pcs: number[], lowOct = 3, highOct = 6): number[] {
  const out: number[] = []
  for (let o = lowOct; o <= highOct; o++) {
    for (const pc of pcs) out.push(o * 12 + pc + 12) // +12 because MIDI octave shifted
  }
  return out.sort((a, b) => a - b)
}

const AM: Chord = {
  bass: M('A', 2),
  pad:  [M('A', 3), M('C', 4), M('E', 4)],
  arp:  [M('A', 4), M('C', 5), M('E', 5), M('C', 5)],
  tones: ladder([9, 0, 4]), // A, C, E
}
const F: Chord = {
  bass: M('F', 2),
  pad:  [M('F', 3), M('A', 3), M('C', 4)],
  arp:  [M('F', 4), M('A', 4), M('C', 5), M('A', 4)],
  tones: ladder([5, 9, 0]),
}
const C: Chord = {
  bass: M('C', 2),
  pad:  [M('C', 3), M('E', 3), M('G', 3)],
  arp:  [M('C', 4), M('E', 4), M('G', 4), M('E', 4)],
  tones: ladder([0, 4, 7]),
}
const G: Chord = {
  bass: M('G', 2),
  pad:  [M('G', 3), M('B', 3), M('D', 4)],
  arp:  [M('G', 4), M('B', 4), M('D', 5), M('B', 4)],
  tones: ladder([7, 11, 2]),
}

export const PROGRESSION: Chord[] = [AM, F, C, G]
export const BARS_PER_LOOP = PROGRESSION.length

// Hand-composed lead melody. 16 sixteenth-note steps per bar × 4 bars = 64 slots.
// `null` = silence on that step. Pretty, sparse, sings over the chord.
export const LEAD_MELODY: Array<number | null> = [
  // Bar 1 (Am):   1   .   .   .   2   .   .   .   3   .   .   .   4   .   .   .
                   M('E', 5), null, null, null,  M('A', 5), null, M('G', 5), null,
                   M('E', 5), null, null, null,  M('A', 5), null, null, null,
  // Bar 2 (F)
                   M('F', 5), null, null, null,  M('A', 5), null, M('G', 5), null,
                   M('F', 5), null, null, null,  M('E', 5), null, null, null,
  // Bar 3 (C)
                   M('G', 5), null, null, null,  M('E', 5), null, M('C', 5), null,
                   M('D', 5), null, null, null,  M('E', 5), null, null, null,
  // Bar 4 (G)
                   M('D', 5), null, null, null,  M('G', 5), null, M('F', 5), null,
                   M('D', 5), null, M('B', 4), null,  M('D', 5), null, null, null,
]

// Soft kick on beat 1 of every bar, soft tick on beat 3 — keeps the groove without drum sounds.
export function isKickStep(step: number): boolean {
  return step % 16 === 0
}
export function isTickStep(step: number): boolean {
  return step % 16 === 8
}

export function chordAtStep(step: number): Chord {
  const bar = Math.floor(step / 16) % BARS_PER_LOOP
  return PROGRESSION[bar]
}

export function leadNoteAtStep(step: number): number | null {
  return LEAD_MELODY[step % LEAD_MELODY.length]
}

export function arpNoteAtStep(step: number): number | null {
  // arp on every 8th note (step 0, 2, 4, ...)
  if (step % 2 !== 0) return null
  const chord = chordAtStep(step)
  const idx = (step / 2) % chord.arp.length
  return chord.arp[idx]
}

// Map a row (0=top) to a chord-tone MIDI note for the *current* chord.
// User ornament notes use this — guaranteed in-chord, guaranteed in tune.
export function rowToChordTone(row: number, gridHeight: number, step: number): number {
  const chord = chordAtStep(step)
  // top of grid = high tones, bottom = low tones
  const inverted = (gridHeight - 1) - row
  const idx = Math.round((inverted / (gridHeight - 1)) * (chord.tones.length - 1))
  return chord.tones[Math.max(0, Math.min(chord.tones.length - 1, idx))]
}
