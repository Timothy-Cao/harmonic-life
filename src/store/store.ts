// src/store/store.ts
// Minimal state: the boolean grid, the playhead column, play/pause flag, and a clear/seed action.

import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import { Grid, clearGrid, toggleCell, stepConway } from '@/engine/grid'
import { stampPattern, PATTERN_ORDER, PatternName } from '@/engine/patterns'
import { CONFIG } from '@/engine/config'

type Store = {
  grid: Grid
  gridSize: number
  playhead: number      // current sequencer column (0..gridSize-1)
  bar: number           // bar index for the bass progression
  playing: boolean
  patternIndex: number  // which pattern was last loaded

  toggle: (x: number, y: number) => void
  setGrid: (g: Grid) => void
  step: () => void
  setPlayhead: (p: number) => void
  setBar: (b: number) => void
  setPlaying: (p: boolean) => void
  clear: () => void
  loadPattern: (name?: PatternName) => void
  cyclePattern: () => void
}

export const useStore = create<Store>()(subscribeWithSelector((set, get) => ({
  grid: stampPattern('random', CONFIG.GRID_SIZE),
  gridSize: CONFIG.GRID_SIZE,
  playhead: 0,
  bar: 0,
  playing: false,
  patternIndex: PATTERN_ORDER.indexOf('random'),

  toggle: (x, y) => set((s) => ({ grid: toggleCell(s.grid, s.gridSize, x, y) })),
  setGrid: (grid) => set({ grid }),
  step: () => set((s) => ({ grid: stepConway(s.grid, s.gridSize) })),
  setPlayhead: (playhead) => set({ playhead }),
  setBar: (bar) => set({ bar }),
  setPlaying: (playing) => set({ playing }),
  clear: () => set((s) => ({ grid: clearGrid(s.gridSize), playhead: 0, bar: 0 })),
  loadPattern: (name) => set((s) => {
    const idx = name ? PATTERN_ORDER.indexOf(name) : s.patternIndex
    const pickName = name ?? PATTERN_ORDER[s.patternIndex]
    return {
      grid: stampPattern(pickName, s.gridSize),
      playhead: 0,
      bar: 0,
      patternIndex: Math.max(0, idx),
    }
  }),
  cyclePattern: () => {
    const next = (get().patternIndex + 1) % PATTERN_ORDER.length
    set({
      grid: stampPattern(PATTERN_ORDER[next], get().gridSize),
      playhead: 0,
      bar: 0,
      patternIndex: next,
    })
  },
})))

export { PATTERN_ORDER }
