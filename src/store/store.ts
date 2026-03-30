// src/store/store.ts
import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import { Grid, createGrid } from '@/engine/grid'
import { ConductorState, createConductor } from '@/engine/conductor'
import { CONFIG } from '@/engine/config'

export type PlaybackState = 'setup' | 'playing' | 'paused' | 'finished'

type Store = {
  // Grid
  grid: Grid
  gridSize: number

  // Conductor
  conductor: ConductorState

  // Playback
  playback: PlaybackState
  tick: number

  // Settings
  rootKey: number
  scale: string
  selectedNote: number | null
  brushType: 'single' | 'chord' | 'scatter' | 'bass' | 'random'
  muted: boolean

  // Actions
  setCell: (x: number, y: number, note: number) => void
  clearCell: (x: number, y: number) => void
  setGrid: (grid: Grid) => void
  setConductor: (conductor: ConductorState) => void
  setPlayback: (state: PlaybackState) => void
  setTick: (tick: number) => void
  setSelectedNote: (note: number | null) => void
  setBrushType: (brush: Store['brushType']) => void
  setRootKey: (key: number) => void
  setScale: (scale: string) => void
  toggleMute: () => void
  reset: () => void
}

export const useStore = create<Store>()(subscribeWithSelector((set) => ({
  grid: createGrid(CONFIG.GRID_SIZE),
  gridSize: CONFIG.GRID_SIZE,
  conductor: createConductor(),
  playback: 'setup',
  tick: 0,
  rootKey: 0,
  scale: 'pentatonic',
  selectedNote: null,
  brushType: 'single',
  muted: false,

  setCell: (x, y, note) => set((s) => {
    const next = [...s.grid]
    next[y * s.gridSize + x] = { note, energy: CONFIG.PLACED_ENERGY, age: 0 }
    return { grid: next }
  }),
  clearCell: (x, y) => set((s) => {
    const next = [...s.grid]
    next[y * s.gridSize + x] = null
    return { grid: next }
  }),
  setGrid: (grid) => set({ grid }),
  setConductor: (conductor) => set({ conductor }),
  setPlayback: (playback) => set({ playback }),
  setTick: (tick) => set({ tick }),
  setSelectedNote: (selectedNote) => set({ selectedNote }),
  setBrushType: (brushType) => set({ brushType }),
  setRootKey: (rootKey) => set({ rootKey }),
  setScale: (scale) => set({ scale }),
  toggleMute: () => set((s) => ({ muted: !s.muted })),
  reset: () => set({
    grid: createGrid(CONFIG.GRID_SIZE),
    conductor: createConductor(),
    playback: 'setup',
    tick: 0,
  }),
})))
