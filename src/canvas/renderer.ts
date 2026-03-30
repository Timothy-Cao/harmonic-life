// src/canvas/renderer.ts
import { Grid, getCell } from '@/engine/grid'
import { getMidiNote } from '@/engine/cell'

const BG_COLOR = '#0a0a0f'

function noteToHue(midi: number): number {
  return (getMidiNote(midi) % 12) * 30
}

export function drawGrid(
  ctx: CanvasRenderingContext2D,
  grid: Grid,
  gridSize: number,
  canvasWidth: number,
  canvasHeight: number,
) {
  const cellW = canvasWidth / gridSize
  const cellH = canvasHeight / gridSize

  // Clear
  ctx.fillStyle = BG_COLOR
  ctx.fillRect(0, 0, canvasWidth, canvasHeight)

  // Draw grid lines (very faint)
  ctx.strokeStyle = 'rgba(255,255,255,0.03)'
  ctx.lineWidth = 0.5
  for (let i = 0; i <= gridSize; i++) {
    ctx.beginPath()
    ctx.moveTo(i * cellW, 0)
    ctx.lineTo(i * cellW, canvasHeight)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(0, i * cellH)
    ctx.lineTo(canvasWidth, i * cellH)
    ctx.stroke()
  }

  // Draw cells
  for (let y = 0; y < gridSize; y++) {
    for (let x = 0; x < gridSize; x++) {
      const cell = getCell(grid, gridSize, x, y)
      if (!cell) continue

      const cx = x * cellW + cellW / 2
      const cy = y * cellH + cellH / 2
      const radius = (cellW / 2 - 1) * Math.max(0.3, cell.energy)
      const hue = noteToHue(cell.note)
      const lightness = 40 + cell.energy * 30

      ctx.fillStyle = `hsl(${hue}, 80%, ${lightness}%)`
      ctx.beginPath()
      ctx.arc(cx, cy, radius, 0, Math.PI * 2)
      ctx.fill()
    }
  }
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
