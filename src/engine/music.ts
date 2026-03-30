// src/engine/music.ts

export const SCALES: Record<string, number[]> = {
  major:      [0, 2, 4, 5, 7, 9, 11],
  minor:      [0, 2, 3, 5, 7, 8, 10],
  pentatonic: [0, 2, 4, 7, 9],
  blues:      [0, 3, 5, 6, 7, 10],
  dorian:     [0, 2, 3, 5, 7, 9, 10],
}

const CHORD_TEMPLATES = [
  [0, 4, 7],  // major
  [0, 3, 7],  // minor
  [0, 3, 6],  // diminished
  [0, 4, 8],  // augmented
  [0, 2, 7],  // sus2
  [0, 5, 7],  // sus4
]

export function getScaleNotes(root: number, scaleName: string): number[] {
  const intervals = SCALES[scaleName] ?? SCALES.major
  return intervals.map(i => (i + root) % 12)
}

export function findChordCompletion(neighborPitchClasses: number[], scaleNotes: number[]): number[] {
  if (neighborPitchClasses.length < 2) return []

  const candidates = new Set<number>()
  const neighborSet = new Set(neighborPitchClasses)

  for (const template of CHORD_TEMPLATES) {
    for (let rootOffset = 0; rootOffset < 12; rootOffset++) {
      const rotated = template.map(t => (t + rootOffset) % 12)
      const matches = rotated.filter(n => neighborSet.has(n))
      if (matches.length === 2) {
        const missing = rotated.find(n => !neighborSet.has(n))!
        if (scaleNotes.includes(missing)) {
          candidates.add(missing)
        }
      }
    }
  }

  return Array.from(candidates)
}
