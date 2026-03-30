// src/engine/cell.ts
import { CONFIG } from './config'

export type Cell = {
  note: number   // MIDI note as float
  energy: number // 0-1
  age: number    // ticks alive
}

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

export function createCell(note: number, energy: number = CONFIG.PLACED_ENERGY): Cell {
  return { note, energy, age: 0 }
}

export function getMidiNote(note: number): number {
  return Math.round(note)
}

export function midiToNoteName(midi: number): string {
  const note = NOTE_NAMES[midi % 12]
  const octave = Math.floor(midi / 12) - 1
  return `${note}${octave}`
}
