'use client'

import { useStore } from '@/store/store'
import { getScaleNotes } from '@/engine/music'
import { midiToNoteName } from '@/engine/cell'

const BASE_OCTAVE = 4

function noteToHue(midi: number): number {
  return (midi % 12) * 30
}

const BRUSH_TYPES = ['single', 'chord', 'scatter', 'bass', 'random'] as const

export default function NotePalette() {
  const { rootKey, scale, selectedNote, setSelectedNote, brushType, setBrushType } = useStore()
  const scaleNotes = getScaleNotes(rootKey, scale)

  // Generate MIDI notes across 2 octaves
  const notes = scaleNotes.flatMap((pc) => [
    (BASE_OCTAVE + 1) * 12 + pc,
    (BASE_OCTAVE + 2) * 12 + pc,
  ]).sort((a, b) => a - b)

  return (
    <div className="flex flex-col gap-1 p-2">
      <div className="flex gap-1">
        {BRUSH_TYPES.map((bt) => (
          <button
            key={bt}
            onClick={() => setBrushType(bt)}
            className={`px-2 py-1 rounded text-xs font-mono capitalize transition-all ${
              brushType === bt
                ? 'bg-white/20 ring-1 ring-white text-white'
                : 'bg-white/5 text-white/50 hover:text-white/80 hover:bg-white/10'
            }`}
          >
            {bt}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-1">
        {notes.map((midi) => {
          const hue = noteToHue(midi)
          const isSelected = selectedNote === midi
          return (
            <button
              key={midi}
              onClick={() => setSelectedNote(isSelected ? null : midi)}
              className={`px-2 py-1 rounded text-xs font-mono transition-all ${
                isSelected ? 'ring-2 ring-white scale-110' : 'opacity-70 hover:opacity-100'
              }`}
              style={{
                backgroundColor: `hsl(${hue}, 70%, 40%)`,
                color: 'white',
              }}
            >
              {midiToNoteName(midi)}
            </button>
          )
        })}
      </div>
    </div>
  )
}
