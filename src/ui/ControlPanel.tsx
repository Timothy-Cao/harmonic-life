'use client'

import { useStore } from '@/store/store'
import { useSimulation } from '@/hooks/useSimulation'
import { useAudio } from '@/hooks/useAudio'

export default function ControlPanel() {
  const { playback, tick, conductor, muted, toggleMute, silenceBombActive, toggleSilenceBomb, applyPreset } = useStore()
  const { play, pause, stop } = useSimulation()
  const { init: initAudio } = useAudio()

  const handlePlay = async () => {
    await initAudio()
    play()
  }

  return (
    <div className="flex items-center gap-3">
      {playback === 'playing' ? (
        <button
          onClick={pause}
          className="px-4 py-2 bg-yellow-600 hover:bg-yellow-500 rounded text-sm font-medium"
        >
          Pause
        </button>
      ) : (
        <button
          onClick={handlePlay}
          className="px-4 py-2 bg-green-600 hover:bg-green-500 rounded text-sm font-medium"
          disabled={playback === 'finished'}
        >
          {playback === 'finished' ? 'Finished' : 'Play'}
        </button>
      )}
      <button
        onClick={stop}
        className="px-4 py-2 bg-red-600/60 hover:bg-red-500 rounded text-sm font-medium"
      >
        Reset
      </button>
      <button
        onClick={toggleMute}
        className={`px-3 py-2 rounded text-sm ${muted ? 'bg-white/10' : 'bg-white/5'}`}
      >
        {muted ? 'Unmute' : 'Mute'}
      </button>
      <button
        onClick={toggleSilenceBomb}
        className={`px-3 py-2 rounded text-sm transition-all ${
          silenceBombActive
            ? 'bg-purple-600 ring-2 ring-purple-400 text-white'
            : 'bg-white/5 text-white/70 hover:bg-white/10'
        }`}
        title="Silence Bomb: click the grid to erase a circular area (radius 3)"
      >
        Silence Bomb
      </button>
      <div className="flex items-center gap-1 ml-2 border border-white/10 rounded overflow-hidden">
        <button
          onClick={() => applyPreset('slow-ambient')}
          className="px-2 py-1 text-xs bg-white/5 hover:bg-indigo-600/50"
          title="Slow Ambient: 600ms tick, high reverb"
        >
          Ambient
        </button>
        <button
          onClick={() => applyPreset('medium-flow')}
          className="px-2 py-1 text-xs bg-white/5 hover:bg-teal-600/50 border-l border-white/10"
          title="Medium Flow: 300ms tick, medium reverb"
        >
          Flow
        </button>
        <button
          onClick={() => applyPreset('upbeat-pulse')}
          className="px-2 py-1 text-xs bg-white/5 hover:bg-orange-600/50 border-l border-white/10"
          title="Upbeat Pulse: 150ms tick, low reverb"
        >
          Pulse
        </button>
      </div>
      <span className="text-xs text-white/40 ml-2">
        Tick: {tick} | Key: {['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'][conductor.key]}
      </span>
    </div>
  )
}
