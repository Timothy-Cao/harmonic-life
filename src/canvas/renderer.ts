// src/canvas/renderer.ts
// Boolean Conway grid + a glowing vertical playhead that sweeps left→right.
// Cells in the playhead column glow brighter for the half-beat they're being played.

import { Grid } from '@/engine/grid'

const BG = '#0a0a14'

export function drawGrid(
  ctx: CanvasRenderingContext2D,
  grid: Grid,
  gridSize: number,
  canvasWidth: number,
  canvasHeight: number,
  playhead: number,
) {
  const cellW = canvasWidth / gridSize
  const cellH = canvasHeight / gridSize

  ctx.fillStyle = BG
  ctx.fillRect(0, 0, canvasWidth, canvasHeight)

  // Playhead column shaded behind the cells
  ctx.fillStyle = 'rgba(120, 200, 255, 0.10)'
  ctx.fillRect(playhead * cellW, 0, cellW, canvasHeight)

  // Cells
  for (let y = 0; y < gridSize; y++) {
    for (let x = 0; x < gridSize; x++) {
      if (!grid[y * gridSize + x]) continue
      const cx = x * cellW + cellW / 2
      const cy = y * cellH + cellH / 2
      const inPlayhead = x === playhead

      const r = (cellW / 2 - 1) * (inPlayhead ? 1.05 : 0.78)
      // Hue: top of grid = warm/yellow (high notes), bottom = cool/violet (low notes)
      const hue = 60 + (y / gridSize) * 240
      ctx.fillStyle = inPlayhead
        ? `hsl(${hue}, 90%, 72%)`
        : `hsl(${hue}, 60%, 55%)`
      ctx.beginPath()
      ctx.arc(cx, cy, r, 0, Math.PI * 2)
      ctx.fill()

      if (inPlayhead) {
        // soft glow on the active column
        const glow = ctx.createRadialGradient(cx, cy, r * 0.4, cx, cy, r * 3)
        glow.addColorStop(0, `hsla(${hue}, 90%, 70%, 0.45)`)
        glow.addColorStop(1, `hsla(${hue}, 90%, 70%, 0)`)
        ctx.fillStyle = glow
        ctx.beginPath()
        ctx.arc(cx, cy, r * 3, 0, Math.PI * 2)
        ctx.fill()
      }
    }
  }

  // Bright vertical playhead line
  ctx.strokeStyle = 'rgba(180, 220, 255, 0.6)'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(playhead * cellW + cellW / 2, 0)
  ctx.lineTo(playhead * cellW + cellW / 2, canvasHeight)
  ctx.stroke()
}

export function canvasToGrid(
  canvasX: number,
  canvasY: number,
  canvasWidth: number,
  canvasHeight: number,
  gridSize: number,
): { x: number; y: number } | null {
  const cellW = canvasWidth / gridSize
  const cellH = canvasHeight / gridSize
  const x = Math.floor(canvasX / cellW)
  const y = Math.floor(canvasY / cellH)
  if (x < 0 || x >= gridSize || y < 0 || y >= gridSize) return null
  return { x, y }
}
