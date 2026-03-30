// src/audio/mix.ts
import { Grid, getCell, getNeighbors } from '@/engine/grid'
import { getMidiNote } from '@/engine/cell'
import { shouldPlayThisTick } from '@/engine/rules'

export function collectPlayableNotes(
  grid: Grid,
  size: number,
  tick: number,
): { midi: number; volume: number }[] {
  const notes: { midi: number; volume: number }[] = []

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const cell = getCell(grid, size, x, y)
      if (!cell) continue
      if (!shouldPlayThisTick(cell, tick)) continue

      const neighbors = getNeighbors(grid, size, x, y)
      const localDensity = Math.max(1, neighbors.filter(Boolean).length)
      const volume = cell.energy / Math.sqrt(localDensity)

      notes.push({ midi: getMidiNote(cell.note), volume })
    }
  }

  return notes
}
