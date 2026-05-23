'use client'

import { useRef, useEffect, useCallback, useState } from 'react'
import { useStore } from '@/store/store'
import { drawGrid, canvasToGrid } from '@/canvas/renderer'
import { applySilenceBomb } from '@/engine/grid'
import { applyBrush } from '@/engine/brushes'
import NotePalette from '@/ui/NotePalette'
import ControlPanel from '@/ui/ControlPanel'
import SettingsDrawer from '@/ui/SettingsDrawer'

const CANVAS_SIZE = 600

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { grid, gridSize, setCell, setGrid } = useStore()
  const [settingsOpen, setSettingsOpen] = useState(false)

  // Draw loop
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let raf: number
    const draw = () => {
      drawGrid(ctx, useStore.getState().grid, gridSize, CANVAS_SIZE, CANVAS_SIZE)
      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [gridSize])

  // Click handler
  const handleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
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

    const { selectedNote, brushType, rootKey, scale, silenceBombActive, grid: currentGrid } = useStore.getState()

    if (silenceBombActive) {
      const nextGrid = applySilenceBomb(currentGrid, gridSize, pos.x, pos.y, 3)
      setGrid(nextGrid)
      return
    }

    if (selectedNote !== null) {
      const cells = applyBrush(brushType, selectedNote, rootKey, scale)
      for (const { dx, dy, note } of cells) {
        const nx = pos.x + dx
        const ny = pos.y + dy
        if (nx >= 0 && nx < gridSize && ny >= 0 && ny < gridSize) {
          setCell(nx, ny, note)
        }
      }
    } else {
      const { clearCell } = useStore.getState()
      clearCell(pos.x, pos.y)
    }
  }, [gridSize, setCell, setGrid])

  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-4 p-4">
      <div className="flex flex-col items-center gap-1">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-light tracking-[0.3em] uppercase bg-gradient-to-r from-indigo-300 via-purple-200 to-amber-200 bg-clip-text text-transparent">
            Harmonic Life
          </h1>
          <button
            onClick={() => setSettingsOpen(true)}
            className="text-white/30 hover:text-white text-xl"
            aria-label="Open settings"
          >
            &#9881;
          </button>
        </div>
        <p className="text-xs text-white/40 italic tracking-wide">
          Plant a garden of sound. Watch it bloom into music.
        </p>
      </div>
      <ControlPanel />
      <canvas
        ref={canvasRef}
        width={CANVAS_SIZE}
        height={CANVAS_SIZE}
        onClick={handleClick}
        className="rounded-lg cursor-crosshair shadow-[0_0_60px_rgba(80,60,160,0.25)] ring-1 ring-white/5"
      />
      <NotePalette />
      <p className="text-xs text-white/40 max-w-md text-center leading-relaxed">
        Pick a note, tap the grid to plant it. Harmonious neighbors live and reproduce;
        dissonant ones fade. Press <span className="text-white/70">Play</span> to let the garden grow.
      </p>
      <SettingsDrawer open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </main>
  )
}
