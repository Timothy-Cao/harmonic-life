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
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold tracking-tight">Harmonic Life</h1>
        <button
          onClick={() => setSettingsOpen(true)}
          className="text-white/40 hover:text-white text-xl"
          aria-label="Open settings"
        >
          &#9881;
        </button>
      </div>
      <ControlPanel />
      <canvas
        ref={canvasRef}
        width={CANVAS_SIZE}
        height={CANVAS_SIZE}
        onClick={handleClick}
        className="border border-white/10 rounded cursor-crosshair"
      />
      <NotePalette />
      <p className="text-sm text-white/40">
        Select a note and brush, then click the grid to place. Silence Bomb erases a circular area.
      </p>
      <SettingsDrawer open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </main>
  )
}
