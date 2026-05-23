// src/audio/synth.ts
// Multi-voice instrument rig for the always-playing song. Each voice is tuned for
// its role; they all share one reverb so the mix glues.
//
//   pad     — warm sustained chord cushion
//   bass    — low sine root on each downbeat
//   arp     — gentle pluck running 1/8th-note chord tones
//   lead    — bell-ish FM voice for the hand-composed melody
//   ornament — bright soft pluck triggered by alive cells in the playhead column

import * as Tone from 'tone'
import { midiToNoteName } from '@/engine/cell'

let pad: Tone.PolySynth | null = null
let bass: Tone.MonoSynth | null = null
let arp: Tone.PluckSynth | null = null
let lead: Tone.PolySynth | null = null
let ornament: Tone.PolySynth | null = null
let reverb: Tone.Reverb | null = null
let masterGain: Tone.Gain | null = null
let ready = false

export async function initAudio(): Promise<void> {
  if (ready) return
  await Tone.start()

  masterGain = new Tone.Gain(0.85).toDestination()

  reverb = new Tone.Reverb({ decay: 4.5, wet: 0.32, preDelay: 0.02 }).connect(masterGain)
  await reverb.generate()

  // PAD: very slow attack, soft, fills the background
  pad = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: 'sine' },
    envelope: { attack: 1.2, decay: 0.5, sustain: 0.8, release: 2.5 },
    volume: -22,
  })
  pad.maxPolyphony = 6
  const padChorus = new Tone.Chorus({ frequency: 0.4, depth: 0.5, wet: 0.5 }).connect(reverb).start()
  pad.connect(padChorus)

  // BASS: deep round sine + light filter envelope
  bass = new Tone.MonoSynth({
    oscillator: { type: 'sine' },
    envelope: { attack: 0.02, decay: 0.5, sustain: 0.7, release: 1.2 },
    filterEnvelope: { attack: 0.01, decay: 0.3, sustain: 0.5, release: 0.8, baseFrequency: 80, octaves: 2.5 },
    volume: -14,
  })
  bass.connect(reverb)

  // ARPEGGIO: short plucky tone
  arp = new Tone.PluckSynth({
    attackNoise: 0.5,
    dampening: 4200,
    resonance: 0.78,
    volume: -16,
  })
  arp.connect(reverb)

  // LEAD: bell-like FM for the melody
  lead = new Tone.PolySynth(Tone.FMSynth, {
    harmonicity: 3,
    modulationIndex: 6,
    oscillator: { type: 'sine' },
    envelope: { attack: 0.005, decay: 0.7, sustain: 0.2, release: 1.5 },
    modulation: { type: 'sine' },
    modulationEnvelope: { attack: 0.02, decay: 0.3, sustain: 0.2, release: 0.8 },
    volume: -14,
  })
  lead.maxPolyphony = 6
  lead.connect(reverb)

  // ORNAMENT: bright triangle pluck for cell triggers
  ornament = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: 'triangle' },
    envelope: { attack: 0.003, decay: 0.35, sustain: 0.0, release: 0.9 },
    volume: -18,
  })
  ornament.maxPolyphony = 8
  ornament.connect(reverb)

  Tone.getTransport().bpm.value = 84
  ready = true
}

export function playPad(midis: number[], time: number, duration: string = '1n'): void {
  if (!pad) return
  const names = midis.map(midiToNoteName)
  try { pad.triggerAttackRelease(names, duration, time, 0.55) } catch {}
}

export function playBass(midi: number, time: number, duration: string = '2n'): void {
  if (!bass) return
  try { bass.triggerAttackRelease(midiToNoteName(midi), duration, time, 0.85) } catch {}
}

export function playArp(midi: number, time: number): void {
  if (!arp) return
  try {
    arp.triggerAttackRelease(midiToNoteName(midi), '8n', time)
  } catch {}
}

export function playLead(midi: number, time: number, duration: string = '4n'): void {
  if (!lead) return
  try { lead.triggerAttackRelease(midiToNoteName(midi), duration, time, 0.7) } catch {}
}

export function playOrnament(midis: number[], time: number): void {
  if (!ornament) return
  if (midis.length === 0) return
  for (const m of midis) {
    const velocity = 0.35 + Math.random() * 0.25
    try { ornament.triggerAttackRelease(midiToNoteName(m), '8n', time, velocity) } catch {}
  }
}

// Used for click-to-play before the transport is running.
export function playInstant(midi: number): void {
  if (!ornament) return
  try { ornament.triggerAttackRelease(midiToNoteName(midi), '8n', undefined, 0.55) } catch {}
}

export function disposeAudio(): void {
  pad?.dispose(); bass?.dispose(); arp?.dispose(); lead?.dispose(); ornament?.dispose()
  reverb?.dispose(); masterGain?.dispose()
  pad = bass = arp = lead = ornament = null as never
  reverb = null; masterGain = null
  ready = false
}

export function isReady(): boolean { return ready }
