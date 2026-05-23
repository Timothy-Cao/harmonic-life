'use client'

import { useRef, useEffect, useCallback, useState } from 'react'
import { useStore } from '@/store/store'
import { drawGrid, canvasToGrid } from '@/canvas/renderer'
import { useSimulation } from '@/hooks/useSimulation'
import ControlPanel from '@/ui/ControlPanel'

const CANVAS_SIZE = 640

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { gridSize, toggle } = useStore()
  const [started, setStarted] = useState(false)
  const { start } = useSimulation()

  // Render loop — reads grid + playhead directly from store on each frame
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let raf: number
    const draw = () => {
      const s = useStore.getState()
      drawGrid(ctx, s.grid, s.gridSize, CANVAS_SIZE, CANVAS_SIZE, s.playhead)
      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [])

  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const pos = canvasToGrid(
      e.clientX - rect.left,
      e.clientY - rect.top,
      CANVAS_SIZE,
      CANVAS_SIZE,
      gridSize,
    )
    if (!pos) return
    toggle(pos.x, pos.y)
  }, [gridSize, toggle])

  const beginSession = useCallback(async () => {
    setStarted(true)
    await start()
  }, [start])

  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-5 p-4 relative">
      <div className="flex flex-col items-center gap-1">
        <h1 className="text-3xl font-light tracking-[0.25em] uppercase text-white/90">
          Harmonic Life
        </h1>
        <p className="text-xs text-white/40 tracking-wide">
          Conway&apos;s Game of Life — but it makes music.
        </p>
      </div>

      <ControlPanel />

      <div className="relative">
        <canvas
          ref={canvasRef}
          width={CANVAS_SIZE}
          height={CANVAS_SIZE}
          onClick={handleCanvasClick}
          className="rounded-lg cursor-pointer ring-1 ring-white/10 shadow-[0_0_60px_rgba(80,60,160,0.2)]"
        />
        {!started && (
          <button
            onClick={() => void beginSession()}
            className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/60 backdrop-blur-sm rounded-lg text-white hover:bg-black/40 transition"
          >
            <span className="text-2xl font-light tracking-widest uppercase">Tap to begin</span>
            <span className="text-xs text-white/60">Sound will play</span>
          </button>
        )}
      </div>

      <p className="text-xs text-white/40 max-w-md text-center leading-relaxed">
        Click any cell to bring it to life. Watch them grow, dance, and die — every living cell sings a note as the playhead sweeps across.
      </p>
    </main>
  )
}
