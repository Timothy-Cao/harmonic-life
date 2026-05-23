// src/hooks/useSimulation.ts
// Drives the song: on every 16th note, schedule the right voices.
// Cells alive in the playhead column trigger *ornament* notes from the current
// chord — they can't ruin the song, only decorate it.

'use client'

import { useCallback, useEffect, useRef } from 'react'
import * as Tone from 'tone'
import { useStore } from '@/store/store'
import { CONFIG } from '@/engine/config'
import { stepConway } from '@/engine/grid'
import {
  initAudio,
  playPad,
  playBass,
  playArp,
  playLead,
  playOrnament,
} from '@/audio/synth'
import {
  chordAtStep,
  leadNoteAtStep,
  arpNoteAtStep,
  rowToChordTone,
} from '@/audio/song'

export function useSimulation() {
  const repeatIdRef = useRef<number | null>(null)
  const stepCounterRef = useRef(0)

  const start = useCallback(async () => {
    await initAudio()
    const transport = Tone.getTransport()

    if (repeatIdRef.current === null) {
      stepCounterRef.current = 0
      repeatIdRef.current = transport.scheduleRepeat((time: number) => {
        const state = useStore.getState()
        const { grid, gridSize } = state
        const step = stepCounterRef.current
        const posInBar = step % 16

        // --- Backing song layer (deterministic, always plays) ---
        const chord = chordAtStep(step)

        // Pad: hit at the start of every bar, sustains
        if (posInBar === 0) {
          playPad(chord.pad, time, '1m')
          playBass(chord.bass, time, '1m')
          state.setBar(Math.floor(step / 16))
        }

        // Arpeggio on every 8th
        const arpNote = arpNoteAtStep(step)
        if (arpNote !== null) playArp(arpNote, time)

        // Lead melody (hand-composed)
        const leadNote = leadNoteAtStep(step)
        if (leadNote !== null) playLead(leadNote, time, '4n')

        // --- User ornament layer (driven by Conway grid) ---
        // Pick alive cells in the current playhead column → chord-tone notes.
        const col = state.playhead
        const aliveRows: number[] = []
        for (let y = 0; y < gridSize; y++) {
          if (grid[y * gridSize + col]) aliveRows.push(y)
        }
        if (aliveRows.length > 0) {
          const picks = aliveRows.length <= CONFIG.MAX_NOTES_PER_COLUMN
            ? aliveRows
            : pickEvenly(aliveRows, CONFIG.MAX_NOTES_PER_COLUMN)
          const ornaments = picks.map(y => rowToChordTone(y, gridSize, step))
          playOrnament(ornaments, time)
        }

        // Conway advance once per beat
        stepCounterRef.current = step + 1
        if ((step + 1) % CONFIG.CONWAY_STEPS_PER_TICK === 0) {
          state.setGrid(stepConway(grid, gridSize))
        }

        // Advance visual playhead
        state.setPlayhead((col + 1) % gridSize)
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
