import { CONFIG } from './config'

export type ConductorState = {
  tick: number
  key: number              // pitch class 0-11
  scale: string            // scale name
  progressionIndex: number // index into CONFIG.PROGRESSION
  curveMultiplier: number  // 0-1
  consonanceRatio: number  // rolling ratio for progression advance
  stableTickCount: number  // consecutive ticks above tension threshold
  thresholdAdjustment: number // density management offset
}

export function createConductor(key = 0, scale = 'pentatonic'): ConductorState {
  return {
    tick: 0,
    key,
    scale,
    progressionIndex: 0,
    curveMultiplier: 1.0,
    consonanceRatio: 0,
    stableTickCount: 0,
    thresholdAdjustment: 0,
  }
}

export function getEnergyCurve(tick: number, totalTicks: number): number {
  const t = tick / totalTicks
  if (t < 0.2) {
    const phase = t / 0.2
    return Math.sin((phase * Math.PI) / 2)
  } else if (t < 0.7) {
    return 1.0
  } else {
    const phase = (t - 0.7) / 0.3
    return Math.exp(-5 * phase)
  }
}

export function updateConductor(
  state: ConductorState,
  gridDensity: number,
  totalPositiveScore: number,
  totalNegativeScore: number,
): ConductorState {
  const tick = state.tick + 1
  const curveMultiplier = getEnergyCurve(tick, CONFIG.ARC_DURATION_TICKS)

  // Density management
  let thresholdAdjustment = 0
  if (gridDensity > CONFIG.DENSITY_TARGET * 1.5) {
    thresholdAdjustment = 0.2
  } else if (gridDensity < CONFIG.DENSITY_TARGET * 0.5) {
    thresholdAdjustment = -0.2
  }

  // Chord progression advance
  const ratio = totalNegativeScore === 0
    ? Infinity
    : totalPositiveScore / Math.abs(totalNegativeScore)
  const consonanceRatio = ratio
  const stableTickCount = ratio > 3 ? state.stableTickCount + 1 : 0
  let progressionIndex = state.progressionIndex
  if (stableTickCount >= 5) {
    progressionIndex = (progressionIndex + 1) % CONFIG.PROGRESSION.length
  }

  // Key change (random)
  let key = state.key
  if (Math.random() < CONFIG.KEY_CHANGE_PROBABILITY) {
    key = (key + 7) % 12
  }

  return {
    ...state,
    tick,
    key,
    progressionIndex,
    curveMultiplier,
    consonanceRatio,
    stableTickCount: stableTickCount >= 5 ? 0 : stableTickCount,
    thresholdAdjustment,
  }
}

export function isFinished(state: ConductorState): boolean {
  return state.curveMultiplier < 0.01 && state.tick > 10
}
