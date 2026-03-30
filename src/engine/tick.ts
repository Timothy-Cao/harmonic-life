// src/engine/tick.ts
import { Grid, getCell, getNeighbors, gridDensity } from './grid'
import { Cell, getMidiNote } from './cell'
import { CONFIG } from './config'
import { scoreHarmony, getInterval, intervalScore } from './harmony'
import { findChordCompletion } from './music'
import { survives, updateEnergy, applyPitchGravity, countConsonantNeighbors } from './rules'
import { ConductorState, updateConductor, isFinished } from './conductor'

export type TickResult = {
  grid: Grid
  conductor: ConductorState
  births: { x: number; y: number }[]
  deaths: { x: number; y: number }[]
  finished: boolean
}

export function simulateTick(
  grid: Grid,
  size: number,
  conductor: ConductorState,
  scaleNotes: number[],
): TickResult {
  const next: Grid = new Array(size * size).fill(null)
  const births: { x: number; y: number }[] = []
  const deaths: { x: number; y: number }[] = []
  let totalPositive = 0
  let totalNegative = 0

  const threshold = CONFIG.CONSONANCE_THRESHOLD + conductor.thresholdAdjustment

  // Phase 1: Evaluate survival and energy for living cells
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const cell = getCell(grid, size, x, y)
      if (!cell) continue

      const neighbors = getNeighbors(grid, size, x, y)
      const harmonyScore = scoreHarmony(cell, neighbors)

      if (harmonyScore > 0) totalPositive += harmonyScore
      else totalNegative += harmonyScore

      if (!survives(cell, neighbors, threshold)) {
        deaths.push({ x, y })
        continue
      }

      const consonantCount = countConsonantNeighbors(cell, neighbors)
      let updated = updateEnergy(cell, consonantCount, conductor.curveMultiplier)

      // Pitch gravity
      if (neighbors.length > 0) {
        let weightedSum = 0
        let weightTotal = 0
        for (const n of neighbors) {
          const score = intervalScore(getInterval(cell.note, n.note))
          if (score > 0) {
            weightedSum += n.note * score
            weightTotal += score
          }
        }
        if (weightTotal > 0) {
          const target = weightedSum / weightTotal
          updated = applyPitchGravity(updated, target, scaleNotes)
        }
      }

      updated = { ...updated, age: cell.age + 1 }

      if (updated.energy <= 0) {
        deaths.push({ x, y })
        continue
      }

      next[y * size + x] = updated
    }
  }

  // Phase 2: Birth
  if (CONFIG.BIRTH_CHORD_COMPLETION) {
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        if (next[y * size + x] !== null) continue

        const neighbors = getNeighbors(grid, size, x, y)
        if (neighbors.length < 2) continue

        const pitchClasses = [...new Set(neighbors.map(n => getMidiNote(n.note) % 12))]
        const candidates = findChordCompletion(pitchClasses, scaleNotes)
        if (candidates.length === 0) continue

        let bestNote = candidates[0]
        let bestScore = -Infinity
        const avgOctave = Math.round(
          neighbors.reduce((sum, n) => sum + Math.floor(getMidiNote(n.note) / 12), 0) / neighbors.length
        )

        for (const pc of candidates) {
          const midi = avgOctave * 12 + pc
          const tempCell: Cell = { note: midi, energy: CONFIG.BIRTH_ENERGY, age: 0 }
          const score = scoreHarmony(tempCell, neighbors)
          if (score > bestScore) {
            bestScore = score
            bestNote = pc
          }
        }

        const midi = avgOctave * 12 + bestNote
        next[y * size + x] = { note: midi, energy: CONFIG.BIRTH_ENERGY, age: 0 }
        births.push({ x, y })
      }
    }
  }

  // Phase 3: Update conductor
  const density = gridDensity(next, size)
  const nextConductor = updateConductor(conductor, density, totalPositive, Math.abs(totalNegative))
  const finished = isFinished(nextConductor)

  if (finished) {
    for (let i = 0; i < next.length; i++) {
      next[i] = null
    }
  }

  return { grid: next, conductor: nextConductor, births, deaths, finished }
}
