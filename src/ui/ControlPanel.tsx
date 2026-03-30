'use client'

import { useStore } from '@/store/store'
import { useSimulation } from '@/hooks/useSimulation'
import { useAudio } from '@/hooks/useAudio'

export default function ControlPanel() {
  const { playback, tick, conductor, muted, toggleMute } = useStore()
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
      <span className="text-xs text-white/40 ml-2">
        Tick: {tick} | Key: {['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'][conductor.key]}
      </span>
    </div>
  )
}
