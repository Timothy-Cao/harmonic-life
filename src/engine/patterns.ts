// src/engine/patterns.ts
// Classic Game-of-Life starting patterns, stamped into the center of a grid.

import { Grid } from './grid'

type Stamp = ReadonlyArray<readonly [number, number]>

// Coordinates are (dx, dy) relative to a chosen anchor.
const GLIDER: Stamp = [[1, 0], [2, 1], [0, 2], [1, 2], [2, 2]]

const PULSAR: Stamp = (() => {
  const cells: [number, number][] = []
  const arms = [2, 3, 4]
  for (const a of arms) {
    cells.push([a, 0], [-a, 0], [a, 5], [-a, 5], [a, 7], [-a, 7], [a, 12], [-a, 12])
    cells.push([0, a], [0, -a], [5, a], [5, -a], [7, a], [7, -a], [12, a], [12, -a])
  }
  // dedupe
  const seen = new Set<string>()
  return cells.filter(([x, y]) => {
    const k = `${x},${y}`
    if (seen.has(k)) return false
    seen.add(k)
    return true
  })
})()

const ACORN: Stamp = [[1, 0], [3, 1], [0, 2], [1, 2], [4, 2], [5, 2], [6, 2]]

const RPENT: Stamp = [[1, 0], [2, 0], [0, 1], [1, 1], [1, 2]]

const GOSPER_GUN: Stamp = [
  [0, 4], [0, 5], [1, 4], [1, 5],
  [10, 4], [10, 5], [10, 6], [11, 3], [11, 7], [12, 2], [12, 8], [13, 2], [13, 8],
  [14, 5], [15, 3], [15, 7], [16, 4], [16, 5], [16, 6], [17, 5],
  [20, 2], [20, 3], [20, 4], [21, 2], [21, 3], [21, 4], [22, 1], [22, 5],
  [24, 0], [24, 1], [24, 5], [24, 6],
  [34, 2], [34, 3], [35, 2], [35, 3],
]

export type PatternName = 'glider' | 'pulsar' | 'acorn' | 'r-pentomino' | 'gosper' | 'random'

const STAMPS: Record<Exclude<PatternName, 'random'>, Stamp> = {
  glider: GLIDER,
  pulsar: PULSAR,
  acorn: ACORN,
  'r-pentomino': RPENT,
  gosper: GOSPER_GUN,
}

export function stampPattern(name: PatternName, size: number): Grid {
  const grid = new Uint8Array(size * size)
  if (name === 'random') {
    for (let i = 0; i < grid.length; i++) {
      grid[i] = Math.random() < 0.22 ? 1 : 0
    }
    return grid
  }
  const stamp = STAMPS[name]
  // center the bounding box
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
  for (const [x, y] of stamp) {
    if (x < minX) minX = x
    if (y < minY) minY = y
    if (x > maxX) maxX = x
    if (y > maxY) maxY = y
  }
  const bw = maxX - minX
  const bh = maxY - minY
  const cx = Math.floor((size - bw) / 2) - minX
  const cy = Math.floor((size - bh) / 2) - minY
  for (const [dx, dy] of stamp) {
    const x = cx + dx
    const y = cy + dy
    if (x >= 0 && x < size && y >= 0 && y < size) {
      grid[y * size + x] = 1
    }
  }
  return grid
}

export const PATTERN_ORDER: PatternName[] = ['glider', 'pulsar', 'acorn', 'r-pentomino', 'gosper', 'random']
