// src/engine/rules.ts
import { Cell, getMidiNote } from './cell'
import { CONFIG } from './config'
import { scoreHarmony, getInterval, intervalScore } from './harmony'

export function survives(cell: Cell, neighbors: Cell[], threshold: number): boolean {
  if (neighbors.length === 0) return false
  const score = scoreHarmony(cell, neighbors)
  return score >= threshold
}

export function updateEnergy(
  cell: Cell,
  consonantNeighborCount: number,
  curveMultiplier: number,
): Cell {
  const decay = CONFIG.ENERGY_DECAY_PER_TICK
  const restore = consonantNeighborCount * CONFIG.CONSONANCE_ENERGY_RESTORE
  const raw = Math.min(1, cell.energy - decay + restore)
  const energy = Math.max(0, raw * curveMultiplier)
  return { ...cell, energy }
}

export function applyPitchGravity(
  cell: Cell,
  targetNote: number,
  scaleNotes: number[],
): Cell {
  const newNote = cell.note + (targetNote - cell.note) * CONFIG.PITCH_GRAVITY_STRENGTH
  // Check if the nearest semitone below (floor) is in scale — if so, keep the float note
  const floored = Math.floor(newNote)
  const floorPC = ((floored % 12) + 12) % 12
  if (scaleNotes.includes(floorPC)) {
    return { ...cell, note: newNote }
  }
  // Otherwise snap to nearest in-scale semitone
  const rounded = Math.round(newNote)
  const pitchClass = ((rounded % 12) + 12) % 12
  if (scaleNotes.includes(pitchClass)) {
    return { ...cell, note: newNote }
  }
  let bestDist = Infinity
  let bestPC = pitchClass
  for (const pc of scaleNotes) {
    const dist = Math.min(Math.abs(pc - pitchClass), 12 - Math.abs(pc - pitchClass))
    if (dist < bestDist) {
      bestDist = dist
      bestPC = pc
    }
  }
  const octave = Math.floor(rounded / 12)
  const snapped = octave * 12 + bestPC
  return { ...cell, note: snapped }
}

export function countConsonantNeighbors(cell: Cell, neighbors: Cell[]): number {
  let count = 0
  for (const n of neighbors) {
    if (intervalScore(getInterval(cell.note, n.note)) > 0) count++
  }
  return count
}

export function shouldPlayThisTick(cell: Cell, tick: number): boolean {
  if (cell.energy >= 0.5) return true
  if (cell.energy >= 0.25) return tick % 2 === 0
  return tick % 4 === 0
}
