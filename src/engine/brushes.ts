// src/engine/brushes.ts
import { getScaleNotes } from './music'

type BrushResult = { dx: number; dy: number; note: number }[]

export function applyBrush(
  brush: 'single' | 'chord' | 'scatter' | 'bass' | 'random',
  note: number,
  rootKey: number,
  scale: string,
): BrushResult {
  const scaleNotes = getScaleNotes(rootKey, scale)
  const octave = Math.floor(note / 12)

  switch (brush) {
    case 'single':
      return [{ dx: 0, dy: 0, note }]

    case 'chord': {
      const third = octave * 12 + scaleNotes[Math.min(2, scaleNotes.length - 1)]
      const fifth = octave * 12 + scaleNotes[Math.min(4, scaleNotes.length - 1)]
      return [
        { dx: 0, dy: 0, note },
        { dx: 1, dy: 0, note: third },
        { dx: 0, dy: 1, note: fifth },
      ]
    }

    case 'scatter': {
      const results: BrushResult = []
      const count = 4 + Math.floor(Math.random() * 3)
      for (let i = 0; i < count; i++) {
        const dx = Math.floor(Math.random() * 5) - 2
        const dy = Math.floor(Math.random() * 5) - 2
        const pc = scaleNotes[Math.floor(Math.random() * scaleNotes.length)]
        results.push({ dx, dy, note: octave * 12 + pc })
      }
      return results
    }

    case 'bass': {
      const bassNote = Math.max(24, note - 24)
      return [
        { dx: 0, dy: 0, note: bassNote },
        { dx: 1, dy: 0, note: bassNote },
        { dx: 0, dy: 1, note: bassNote },
      ]
    }

    case 'random': {
      const results: BrushResult = []
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (Math.random() > 0.5) {
            const pc = scaleNotes[Math.floor(Math.random() * scaleNotes.length)]
            const oct = octave + Math.floor(Math.random() * 2) - 1
            results.push({ dx, dy, note: Math.max(24, Math.min(96, oct * 12 + pc)) })
          }
        }
      }
      return results
    }
  }
}
