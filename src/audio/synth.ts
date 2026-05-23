// src/audio/synth.ts
import * as Tone from 'tone'
import { midiToNoteName } from '@/engine/cell'

let synth: Tone.PolySynth | null = null
let reverb: Tone.Reverb | null = null
let delay: Tone.FeedbackDelay | null = null

export async function initAudio(): Promise<void> {
  await Tone.start()

  reverb = new Tone.Reverb({ decay: 4, wet: 0.4 }).toDestination()
  delay = new Tone.FeedbackDelay({ delayTime: '8n', feedback: 0.2, wet: 0.15 }).connect(reverb)

  synth = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: 'sine' },
    envelope: {
      attack: 0.3,
      decay: 0.5,
      sustain: 0.6,
      release: 1.5,
    },
    volume: -12,
  }).connect(delay)
}

export function triggerNotes(notes: { midi: number; volume: number }[]): void {
  if (!synth) return

  const now = Tone.now()
  for (const { midi, volume } of notes) {
    const name = midiToNoteName(midi)
    const velocity = Math.max(0.01, Math.min(1, volume * 0.3))
    synth.triggerAttackRelease(name, '4n', now, velocity)
  }
}

export function updateEffects(density: number): void {
  if (reverb) {
    reverb.wet.value = Math.min(0.8, 0.2 + (1 - density) * 0.6)
  }
  if (delay) {
    delay.wet.value = Math.min(0.4, 0.05 + (1 - density) * 0.35)
  }
}

export function disposeAudio(): void {
  synth?.dispose()
  reverb?.dispose()
  delay?.dispose()
  synth = null
  reverb = null
  delay = null
}
