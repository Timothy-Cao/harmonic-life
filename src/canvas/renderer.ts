// src/canvas/renderer.ts
import { Grid, getCell } from '@/engine/grid'
import { getMidiNote } from '@/engine/cell'
import { getInterval, intervalScore } from '@/engine/harmony'

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

      // Glow effect: radial gradient around the cell
      const glowRadius = radius * (1.5 + cell.energy * 1.5)
      const glow = ctx.createRadialGradient(cx, cy, radius * 0.5, cx, cy, glowRadius)
      glow.addColorStop(0, `hsla(${hue}, 80%, 60%, ${0.3 * cell.energy})`)
      glow.addColorStop(1, `hsla(${hue}, 80%, 60%, 0)`)
      ctx.fillStyle = glow
      ctx.beginPath()
      ctx.arc(cx, cy, glowRadius, 0, Math.PI * 2)
      ctx.fill()

      // Base cell circle
      ctx.fillStyle = `hsl(${hue}, 80%, ${lightness}%)`
      ctx.beginPath()
      ctx.arc(cx, cy, radius, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  // Draw harmonic connection lines between consonant neighbors
  const neighborOffsets: [number, number][] = [
    [1, 0],   // right
    [1, 1],   // bottom-right
    [0, 1],   // bottom
    [-1, 1],  // bottom-left
  ]

  for (let y = 0; y < gridSize; y++) {
    for (let x = 0; x < gridSize; x++) {
      const cellA = getCell(grid, gridSize, x, y)
      if (!cellA) continue

      const cxA = x * cellW + cellW / 2
      const cyA = y * cellH + cellH / 2

      for (const [dx, dy] of neighborOffsets) {
        const nx = x + dx
        const ny = y + dy
        if (nx < 0 || nx >= gridSize || ny < 0 || ny >= gridSize) continue

        const cellB = getCell(grid, gridSize, nx, ny)
        if (!cellB) continue

        const interval = getInterval(cellA.note, cellB.note)
        const score = intervalScore(interval)
        if (score <= 0.3) continue

        const cxB = nx * cellW + cellW / 2
        const cyB = ny * cellH + cellH / 2

        ctx.strokeStyle = `rgba(255,255,255,${score * 0.15})`
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(cxA, cyA)
        ctx.lineTo(cxB, cyB)
        ctx.stroke()
      }
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
