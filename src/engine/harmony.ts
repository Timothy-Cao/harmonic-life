// src/engine/harmony.ts
import { Cell } from './cell'
import { getMidiNote } from './cell'

const INTERVAL_SCORES: Record<number, number> = {
  0: 1.0,   // unison
  1: -0.6,  // minor 2nd
  2: 0.0,   // major 2nd
  3: 0.4,   // minor 3rd
  4: 0.5,   // major 3rd
  5: 0.6,   // perfect 4th
  6: -0.5,  // tritone
  7: 0.8,   // perfect 5th
  8: 0.3,   // minor 6th
  9: 0.3,   // major 6th
  10: -0.2, // minor 7th
  11: -0.6, // major 7th
}

export function getInterval(noteA: number, noteB: number): number {
  return Math.abs(getMidiNote(noteA) - getMidiNote(noteB)) % 12
}

export function intervalScore(interval: number): number {
  return INTERVAL_SCORES[interval] ?? 0
}

export function scoreHarmony(cell: Cell, neighbors: Cell[]): number {
  let score = 0
  for (const neighbor of neighbors) {
    const interval = getInterval(cell.note, neighbor.note)
    score += intervalScore(interval)
  }
  return score
}
