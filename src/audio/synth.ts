// src/audio/synth.ts
//
// Three-layer generative voice rig:
//   - bass (AMSynth) for MIDI < 52        — warm sub root
//   - pad  (FMSynth) for 52..71           — sustained core
//   - bell (Synth/tri) for MIDI >= 72     — sparkling top
//
// All voices share one reverb/chorus bus so they sit in the same room.
// Notes are staggered with small random offsets to avoid machine-gun unison,
// and polyphony per tick is capped so dense grids don't collapse into mud.

import * as Tone from 'tone'
import { midiToNoteName } from '@/engine/cell'

type Voices = {
  bass: Tone.PolySynth
  pad: Tone.PolySynth
  bell: Tone.PolySynth
}

let voices: Voices | null = null
let reverb: Tone.Reverb | null = null
let chorus: Tone.Chorus | null = null
let delay: Tone.FeedbackDelay | null = null
let autoFilter: Tone.AutoFilter | null = null
let compressor: Tone.Compressor | null = null
let limiter: Tone.Limiter | null = null

const MAX_NOTES_PER_TICK = 8

export async function initAudio(): Promise<void> {
  await Tone.start()

  // ---- master bus: compressor -> limiter -> destination ----
  limiter = new Tone.Limiter(-1).toDestination()
  compressor = new Tone.Compressor({ threshold: -18, ratio: 3, attack: 0.05, release: 0.25 }).connect(limiter)

  // ---- shared FX chain ----
  reverb = new Tone.Reverb({ decay: 8, preDelay: 0.05, wet: 0.55 }).connect(compressor)
  await reverb.generate()

  chorus = new Tone.Chorus({ frequency: 0.6, depth: 0.45, delayTime: 4, wet: 0.4 }).connect(reverb).start()
  delay = new Tone.FeedbackDelay({ delayTime: '8n.', feedback: 0.28, wet: 0.18 }).connect(chorus)
  autoFilter = new Tone.AutoFilter({ frequency: 0.08, depth: 0.5, baseFrequency: 600, octaves: 2.5, wet: 0.6 }).connect(delay).start()

  // ---- voices ----
  const bass = new Tone.PolySynth(Tone.AMSynth, {
    harmonicity: 1.5,
    oscillator: { type: 'sine' },
    modulation: { type: 'triangle' },
    envelope: { attack: 0.4, decay: 0.6, sustain: 0.7, release: 2.4 },
    modulationEnvelope: { attack: 0.5, decay: 0.2, sustain: 0.8, release: 1.5 },
    volume: -10,
  })
  bass.maxPolyphony = 4
  bass.connect(autoFilter)

  const pad = new Tone.PolySynth(Tone.FMSynth, {
    harmonicity: 2,
    modulationIndex: 4,
    oscillator: { type: 'sine' },
    modulation: { type: 'sine' },
    envelope: { attack: 0.8, decay: 1.2, sustain: 0.6, release: 3.5 },
    modulationEnvelope: { attack: 1.2, decay: 0.5, sustain: 0.7, release: 2.5 },
    volume: -14,
  })
  pad.maxPolyphony = 8
  pad.connect(autoFilter)

  const bell = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: 'triangle' },
    envelope: { attack: 0.02, decay: 0.6, sustain: 0.25, release: 2.2 },
    volume: -16,
  })
  bell.maxPolyphony = 6
  bell.connect(autoFilter)

  voices = { bass, pad, bell }
}

function voiceFor(midi: number): { synth: Tone.PolySynth; durationMul: number; volMul: number } {
  if (!voices) throw new Error('audio not initialized')
  if (midi < 52) return { synth: voices.bass, durationMul: 1.6, volMul: 0.9 }
  if (midi < 72) return { synth: voices.pad, durationMul: 1.3, volMul: 0.85 }
  return { synth: voices.bell, durationMul: 0.9, volMul: 0.7 }
}

export function triggerNotes(notes: { midi: number; volume: number }[]): void {
  if (!voices) return
  if (notes.length === 0) return

  // Cap polyphony to keep dense grids musical
  const sorted = [...notes].sort((a, b) => b.volume - a.volume).slice(0, MAX_NOTES_PER_TICK)

  const now = Tone.now()
  for (const { midi, volume } of sorted) {
    const { synth, durationMul, volMul } = voiceFor(midi)
    const name = midiToNoteName(midi)
    // velocity: gentle curve so soft notes still register
    const velocity = Math.max(0.05, Math.min(0.85, Math.pow(volume, 0.7) * 0.7 * volMul))
    // duration scales with energy: lush sustain for healthy cells, short for fading
    const baseSeconds = 0.35 + volume * 1.4
    const duration = baseSeconds * durationMul
    // tiny stagger so the tick doesn't sound like one stab
    const offset = Math.random() * 0.06
    try {
      synth.triggerAttackRelease(name, duration, now + offset, velocity)
    } catch {
      // tone occasionally throws on overlapping releases; safe to ignore
    }
  }
}

export function updateEffects(density: number): void {
  // sparser grids -> wetter, dreamier; denser -> drier so things stay legible
  if (reverb) reverb.wet.rampTo(Math.min(0.85, 0.35 + (1 - density) * 0.5), 0.5)
  if (delay) delay.wet.rampTo(Math.min(0.35, 0.08 + (1 - density) * 0.27), 0.5)
  if (autoFilter) autoFilter.depth.rampTo(0.35 + (1 - density) * 0.35, 0.5)
}

export function disposeAudio(): void {
  voices?.bass.dispose()
  voices?.pad.dispose()
  voices?.bell.dispose()
  autoFilter?.dispose()
  delay?.dispose()
  chorus?.dispose()
  reverb?.dispose()
  compressor?.dispose()
  limiter?.dispose()
  voices = null
  autoFilter = null
  delay = null
  chorus = null
  reverb = null
  compressor = null
  limiter = null
}
