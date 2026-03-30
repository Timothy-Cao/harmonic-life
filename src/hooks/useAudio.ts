'use client'

// src/hooks/useAudio.ts
import { useEffect, useRef, useCallback } from 'react'
import { initAudio, disposeAudio, triggerNotes, updateEffects } from '@/audio/synth'
import { collectPlayableNotes } from '@/audio/mix'
import { useStore } from '@/store/store'
import { gridDensity } from '@/engine/grid'

export function useAudio() {
  const initializedRef = useRef(false)

  const init = useCallback(async () => {
    if (initializedRef.current) return
    await initAudio()
    initializedRef.current = true
  }, [])

  // Listen for tick changes and play notes
  useEffect(() => {
    const unsub = useStore.subscribe(
      (state) => state.tick,
      (tick) => {
        if (!initializedRef.current) return
        const state = useStore.getState()
        if (state.playback !== 'playing' || state.muted) return

        const notes = collectPlayableNotes(state.grid, state.gridSize, tick)
        triggerNotes(notes)

        const density = gridDensity(state.grid, state.gridSize)
        updateEffects(density)
      },
    )

    return () => unsub()
  }, [])

  useEffect(() => {
    return () => {
      disposeAudio()
      initializedRef.current = false
    }
  }, [])

  return { init }
}
