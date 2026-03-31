'use client'

import { useStore } from '@/store/store'

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
const SCALE_OPTIONS = ['pentatonic', 'major', 'minor', 'blues', 'dorian']

type Props = {
  open: boolean
  onClose: () => void
}

export default function SettingsDrawer({ open, onClose }: Props) {
  const store = useStore()

  if (!open) return null

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />
      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-80 bg-zinc-900 border-l border-white/10 z-50 overflow-y-auto p-4 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Settings</h2>
          <button onClick={onClose} className="text-white/40 hover:text-white text-xl">&times;</button>
        </div>

        {/* Root Key */}
        <label className="flex flex-col gap-1 text-sm">
          Root Key
          <select
            value={store.rootKey}
            onChange={(e) => store.setRootKey(Number(e.target.value))}
            className="bg-zinc-800 rounded px-2 py-1 text-sm"
          >
            {NOTE_NAMES.map((name, i) => (
              <option key={i} value={i}>{name}</option>
            ))}
          </select>
        </label>

        {/* Scale */}
        <label className="flex flex-col gap-1 text-sm">
          Scale
          <select
            value={store.scale}
            onChange={(e) => store.setScale(e.target.value)}
            className="bg-zinc-800 rounded px-2 py-1 text-sm"
          >
            {SCALE_OPTIONS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </label>

        {/* Consonance Threshold */}
        <label className="flex flex-col gap-1 text-sm">
          Consonance Threshold: {store.consonanceThreshold.toFixed(1)}
          <input
            type="range" min="0" max="2" step="0.1"
            value={store.consonanceThreshold}
            onChange={(e) => store.setConsonanceThreshold(Number(e.target.value))}
            className="w-full"
          />
        </label>

        {/* Tick Interval */}
        <label className="flex flex-col gap-1 text-sm">
          Tick Interval: {store.tickIntervalMs}ms
          <input
            type="range" min="100" max="1000" step="50"
            value={store.tickIntervalMs}
            onChange={(e) => store.setTickIntervalMs(Number(e.target.value))}
            className="w-full"
          />
        </label>

        {/* Reverb Mix */}
        <label className="flex flex-col gap-1 text-sm">
          Reverb Mix: {store.reverbMix.toFixed(2)}
          <input
            type="range" min="0" max="1" step="0.05"
            value={store.reverbMix}
            onChange={(e) => store.setReverbMix(Number(e.target.value))}
            className="w-full"
          />
        </label>

        {/* Toggles */}
        <div className="flex flex-col gap-2 text-sm">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={store.cellGlow} onChange={(e) => store.setCellGlow(e.target.checked)} />
            Cell Glow
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={store.harmonicConnections} onChange={(e) => store.setHarmonicConnections(e.target.checked)} />
            Harmonic Connections
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={store.particleEffects} onChange={(e) => store.setParticleEffects(e.target.checked)} />
            Particle Effects
          </label>
        </div>
      </div>
    </>
  )
}
