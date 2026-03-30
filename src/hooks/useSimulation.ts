// src/hooks/useSimulation.ts
'use client'

import { useCallback, useRef, useEffect } from 'react'
import { useStore } from '@/store/store'
import { simulateTick, TickResult } from '@/engine/tick'
import { getScaleNotes } from '@/engine/music'
import { CONFIG } from '@/engine/config'

export function useSimulation() {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const lastTickResult = useRef<TickResult | null>(null)

  const doTick = useCallback(() => {
    const state = useStore.getState()
    if (state.playback !== 'playing') return

    const scaleNotes = getScaleNotes(state.conductor.key, state.conductor.scale)
    const result = simulateTick(state.grid, state.gridSize, state.conductor, scaleNotes)

    lastTickResult.current = result
    state.setGrid(result.grid)
    state.setConductor(result.conductor)
    state.setTick(state.tick + 1)

    if (result.finished) {
      state.setPlayback('finished')
    }
  }, [])

  const play = useCallback(() => {
    const state = useStore.getState()
    if (state.playback === 'finished') return
    useStore.getState().setPlayback('playing')
  }, [])

  const pause = useCallback(() => {
    useStore.getState().setPlayback('paused')
  }, [])

  const stop = useCallback(() => {
    useStore.getState().reset()
  }, [])

  // Tick loop
  useEffect(() => {
    const unsub = useStore.subscribe((state) => {
      if (state.playback === 'playing' && !intervalRef.current) {
        intervalRef.current = setInterval(doTick, CONFIG.TICK_INTERVAL_MS)
      } else if (state.playback !== 'playing' && intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    })

    return () => {
      unsub()
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [doTick])

  return { play, pause, stop, lastTickResult }
}
