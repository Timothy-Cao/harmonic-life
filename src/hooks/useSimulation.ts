// src/hooks/useSimulation.ts
// Drives the sequencer: every 16th note, advance the playhead, fire notes for the
// new column, and (every CONWAY_STEPS_PER_TICK steps) advance Conway. Bass plays
// on the downbeat of each bar using a fixed pentatonic-friendly progression.

'use client'

import { useCallback, useEffect, useRef } from 'react'
import * as Tone from 'tone'
import { useStore } from '@/store/store'
import { CONFIG } from '@/engine/config'
import { rowToMidi, bassNoteForBar } from '@/engine/music'
import { initAudio, playColumn, playBass } from '@/audio/synth'
import { stepConway } from '@/engine/grid'

export function useSimulation() {
  const repeatIdRef = useRef<number | null>(null)
  const stepCounterRef = useRef(0)

  const start = useCallback(async () => {
    await initAudio()
    const transport = Tone.getTransport()

    if (repeatIdRef.current === null) {
      repeatIdRef.current = transport.scheduleRepeat((time: number) => {
        const state = useStore.getState()
        const { grid, gridSize } = state
        const col = state.playhead

        // Collect alive rows in the current column → pentatonic-mapped MIDI notes
        const aliveRows: number[] = []
        for (let y = 0; y < gridSize; y++) {
          if (grid[y * gridSize + col]) aliveRows.push(y)
        }
        // Cap polyphony: take the top, the bottom, and pick a couple from the middle.
        // Simpler: just take the first N from a deterministic stride so columns sound consistent.
        const picks = aliveRows.length <= CONFIG.MAX_NOTES_PER_COLUMN
          ? aliveRows
          : pickEvenly(aliveRows, CONFIG.MAX_NOTES_PER_COLUMN)

        const notes = picks.map(y => rowToMidi(y, gridSize, CONFIG.ROOT_KEY))
        if (notes.length > 0) playColumn(notes, time)

        // Bass: downbeat of each bar (every 16 steps)
        if (stepCounterRef.current % 16 === 0) {
          const bar = Math.floor(stepCounterRef.current / 16)
          playBass(bassNoteForBar(bar, CONFIG.ROOT_KEY), time)
          state.setBar(bar)
        }

        // Conway step
        stepCounterRef.current++
        if (stepCounterRef.current % CONFIG.CONWAY_STEPS_PER_TICK === 0) {
          state.setGrid(stepConway(grid, gridSize))
        }

        // Advance playhead
        const nextCol = (col + 1) % gridSize
        state.setPlayhead(nextCol)
      }, '16n')
    }

    if (transport.state !== 'started') transport.start()
    useStore.getState().setPlaying(true)
  }, [])

  const pause = useCallback(() => {
    Tone.getTransport().pause()
    useStore.getState().setPlaying(false)
  }, [])

  useEffect(() => {
    return () => {
      if (repeatIdRef.current !== null) {
        Tone.getTransport().clear(repeatIdRef.current)
        repeatIdRef.current = null
      }
    }
  }, [])

  return { start, pause }
}

function pickEvenly<T>(arr: T[], n: number): T[] {
  if (arr.length <= n) return arr
  const out: T[] = []
  const stride = arr.length / n
  for (let i = 0; i < n; i++) out.push(arr[Math.floor(i * stride)])
  return out
}
