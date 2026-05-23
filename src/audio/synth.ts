// src/audio/synth.ts
// Two voices: a warm "kalimba" for cells and a soft bass for the hidden chord cycle.
// Both share one reverb so the mix breathes together. Pentatonic-only input means
// no amount of cell density can produce dissonance.

import * as Tone from 'tone'
import { midiToNoteName } from '@/engine/cell'

let kalimba: Tone.PolySynth | null = null
let bass: Tone.MonoSynth | null = null
let reverb: Tone.Reverb | null = null
let ready = false

export async function initAudio(): Promise<void> {
  if (ready) return
  await Tone.start()

  reverb = new Tone.Reverb({ decay: 4, wet: 0.35, preDelay: 0.02 }).toDestination()
  await reverb.generate()

  kalimba = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: 'triangle' },
    envelope: { attack: 0.005, decay: 0.4, sustain: 0.0, release: 1.2 },
    volume: -10,
  })
  kalimba.maxPolyphony = 16
  kalimba.connect(reverb)

  bass = new Tone.MonoSynth({
    oscillator: { type: 'sine' },
    envelope: { attack: 0.05, decay: 0.4, sustain: 0.6, release: 1.4 },
    filterEnvelope: { attack: 0.05, decay: 0.3, sustain: 0.4, release: 1, baseFrequency: 120, octaves: 2 },
    volume: -14,
  })
  bass.connect(reverb)

  Tone.getTransport().bpm.value = 110
  ready = true
}

export function playColumn(midiNotes: number[], time: number): void {
  if (!kalimba) return
  // Light velocity variation so it doesn't feel robotic.
  for (const midi of midiNotes) {
    const name = midiToNoteName(midi)
    const velocity = 0.45 + Math.random() * 0.25
    try {
      kalimba.triggerAttackRelease(name, '8n', time, velocity)
    } catch {
      // ignore overlapping-trigger races
    }
  }
}

export function playBass(midi: number, time: number): void {
  if (!bass) return
  const name = midiToNoteName(midi)
  try {
    bass.triggerAttackRelease(name, '2n', time, 0.7)
  } catch {
    // ignore
  }
}

export function disposeAudio(): void {
  kalimba?.dispose()
  bass?.dispose()
  reverb?.dispose()
  kalimba = null
  bass = null
  reverb = null
  ready = false
}

export function isReady(): boolean {
  return ready
}
