'use client'

import { useStore, PATTERN_ORDER } from '@/store/store'
import { useSimulation } from '@/hooks/useSimulation'

export default function ControlPanel() {
  const { playing, clear, cyclePattern, patternIndex } = useStore()
  const { pause, start } = useSimulation()

  return (
    <div className="flex items-center gap-2">
      {playing ? (
        <button
          onClick={pause}
          className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-sm font-medium"
        >
          Pause
        </button>
      ) : (
        <button
          onClick={() => void start()}
          className="px-4 py-2 rounded-full bg-emerald-500/80 hover:bg-emerald-400 text-sm font-medium"
        >
          Play
        </button>
      )}
      <button
        onClick={clear}
        className="px-4 py-2 rounded-full bg-white/5 hover:bg-white/15 text-sm"
      >
        Clear
      </button>
      <button
        onClick={cyclePattern}
        className="px-4 py-2 rounded-full bg-white/5 hover:bg-white/15 text-sm capitalize"
        title="Cycle through Conway patterns"
      >
        Pattern: {PATTERN_ORDER[patternIndex]}
      </button>
    </div>
  )
}
