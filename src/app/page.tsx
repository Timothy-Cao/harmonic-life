'use client'

import { useRef, useEffect, useCallback } from 'react'
import { useStore } from '@/store/store'
import { drawGrid, canvasToGrid } from '@/canvas/renderer'
import NotePalette from '@/ui/NotePalette'

const CANVAS_SIZE = 600

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { grid, gridSize, selectedNote, setCell, clearCell } = useStore()

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

    const { selectedNote } = useStore.getState()
    if (selectedNote !== null) {
      setCell(pos.x, pos.y, selectedNote)
    } else {
      clearCell(pos.x, pos.y)
    }
  }, [gridSize, setCell, clearCell])

  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-4 p-4">
      <h1 className="text-2xl font-bold tracking-tight">Harmonic Life</h1>
      <canvas
        ref={canvasRef}
        width={CANVAS_SIZE}
        height={CANVAS_SIZE}
        onClick={handleClick}
        className="border border-white/10 rounded cursor-crosshair"
      />
      <NotePalette />
      <p className="text-sm text-white/40">
        Select a note, then click the grid to place it. Click without a note selected to erase.
      </p>
    </main>
  )
}
