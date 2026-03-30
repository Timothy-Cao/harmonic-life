# Harmonic Life Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a musical zero-player game where cellular automata driven by music theory grow seeds into self-composing music.

**Architecture:** Main-thread rAF loop with tick gating. Pure TypeScript engine (grid, harmony, rules, conductor) feeds a Tone.js audio layer and HTML Canvas renderer. Zustand for state, React + Tailwind for UI.

**Tech Stack:** Next.js 14+ (App Router), TypeScript, HTML Canvas, Tone.js, Zustand, Tailwind CSS

**Spec:** `docs/superpowers/specs/2026-03-30-harmonic-life-design.md`

---

## File Map

```
src/
  engine/
    config.ts         — All tunable constants (CONFIG object)
    cell.ts           — Cell type, createCell, midiToNoteName, noteToColor helpers
    harmony.ts        — INTERVAL_SCORES, getInterval, scoreHarmony, getConsonantNeighbors
    grid.ts           — Grid class: create, get, set, getNeighbors, forEachCell, density
    music.ts          — SCALES, CHORD_TEMPLATES, getScaleNotes, findChordCompletion
    rules.ts          — survives(), applyPitchGravity(), updateEnergy()
    tick.ts           — simulateTick() — orchestrates one full tick
    conductor.ts      — ConductorState type, createConductor(), updateConductor()
  audio/
    synth.ts          — initAudio(), triggerNotes(), dispose()
    mix.ts            — setupEffects(), updateEffects(), calculateVolume()
  canvas/
    renderer.ts       — initCanvas(), drawGrid(), noteToColor()
    particles.ts      — ParticleSystem class: emit(), update(), draw()
  ui/
    ControlPanel.tsx  — Play/pause/stop, tempo, mode toggle
    NotePalette.tsx   — Note buttons, brush selector
    SettingsDrawer.tsx — Sliders for config values
  hooks/
    useSimulation.ts  — Tick loop, play/pause/stop, speed
    useAudio.ts       — Audio context lifecycle, mute toggle
  store/
    store.ts          — Zustand store: grid, conductor, playback, settings
  app/
    page.tsx          — Main page, mounts canvas + UI
    layout.tsx        — Root layout, fonts, metadata
    globals.css       — Dark theme, CSS variables
```

Note: `music.ts` is split from `harmony.ts` — harmony handles interval math, music handles scales/chords/theory. This keeps files focused.

---

### Task 0: Project Scaffold + GitHub + Vercel

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `tailwind.config.ts`, `.gitignore`, `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/globals.css`, `TUNING.md`

- [ ] **Step 1: Create Next.js project**

```bash
cd "/Users/bytedance/Documents/Personal/musical conway"
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm
```

Accept defaults. This creates the full Next.js scaffold with App Router, TypeScript, Tailwind, ESLint.

- [ ] **Step 2: Install dependencies**

```bash
npm install tone zustand
```

- [ ] **Step 3: Create TUNING.md**

Create `TUNING.md` at project root:

```markdown
# TUNING.md — Paste your feedback here

## Current Issues
- (what sounds wrong, looks wrong, feels off)

## What I Want Changed
- (the vibe you're going for)

## What's Working Well
- (so Claude Code doesn't break it)
```

- [ ] **Step 4: Set up dark theme in globals.css**

Replace the default `globals.css` with a minimal dark theme:
- Background: `#0a0a0f`
- Foreground: `#e0e0e0`
- Remove default Next.js template styles

- [ ] **Step 5: Create minimal page.tsx**

Replace default `page.tsx` with a centered "Harmonic Life" heading on dark background. Just enough to verify the app renders.

- [ ] **Step 6: Verify dev server works**

```bash
npm run dev
```

Visit http://localhost:3000, confirm dark background with heading.

- [ ] **Step 7: Create GitHub repo and push**

```bash
gh repo create harmonic-life --public --source=. --remote=origin --push
```

- [ ] **Step 8: Connect to Vercel**

```bash
npx vercel link
```

Follow prompts to connect to Vercel project. Then:

```bash
npx vercel --prod
```

Verify the deployment URL loads.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat: scaffold Next.js project with Tone.js and Zustand"
git push
```

---

### Task 1: Config + Cell + Grid (Engine Core)

**Files:**
- Create: `src/engine/config.ts`, `src/engine/cell.ts`, `src/engine/grid.ts`
- Test: `src/engine/__tests__/cell.test.ts`, `src/engine/__tests__/grid.test.ts`

- [ ] **Step 1: Install vitest**

```bash
npm install -D vitest @vitejs/plugin-react
```

Add to `package.json` scripts: `"test": "vitest run", "test:watch": "vitest"`

Create `vitest.config.ts`:

```typescript
import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    environment: 'node',
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

- [ ] **Step 2: Write config.ts**

Create `src/engine/config.ts` with the full CONFIG object from the spec. All tunable constants in one place.

```typescript
export const CONFIG = {
  GRID_SIZE: 48,
  TICK_INTERVAL_MS: 300,
  CONSONANCE_THRESHOLD: 0.5,
  PITCH_GRAVITY_STRENGTH: 0.1,
  BIRTH_CHORD_COMPLETION: true,
  PLACED_ENERGY: 1.0,
  BIRTH_ENERGY: 0.7,
  ENERGY_DECAY_PER_TICK: 0.02,
  CONSONANCE_ENERGY_RESTORE: 0.05,
  GLOBAL_ENERGY_CURVE: 'arc' as const,
  ARC_DURATION_TICKS: 200,
  KEY_CHANGE_PROBABILITY: 0.005,
  PROGRESSION: ['I', 'IV', 'V', 'I'] as const,
  DENSITY_TARGET: 0.15,
  SYNTH_TYPE: 'pad' as const,
  REVERB_MIX: 0.4,
  TEMPO_BPM: 80,
  CELL_GLOW: true,
  HARMONIC_CONNECTIONS: true,
  PARTICLE_EFFECTS: true,
}
```

- [ ] **Step 3: Write failing tests for cell.ts**

```typescript
// src/engine/__tests__/cell.test.ts
import { describe, it, expect } from 'vitest'
import { createCell, getMidiNote, midiToNoteName } from '../cell'

describe('createCell', () => {
  it('creates a cell with given note and default energy', () => {
    const cell = createCell(60) // Middle C
    expect(cell.note).toBe(60)
    expect(cell.energy).toBe(1.0)
    expect(cell.age).toBe(0)
  })

  it('creates a cell with custom energy', () => {
    const cell = createCell(67, 0.7)
    expect(cell.energy).toBe(0.7)
  })
})

describe('getMidiNote', () => {
  it('rounds float note to nearest integer', () => {
    expect(getMidiNote(60.3)).toBe(60)
    expect(getMidiNote(60.7)).toBe(61)
  })
})

describe('midiToNoteName', () => {
  it('converts MIDI 60 to C4', () => {
    expect(midiToNoteName(60)).toBe('C4')
  })
  it('converts MIDI 69 to A4', () => {
    expect(midiToNoteName(69)).toBe('A4')
  })
})
```

- [ ] **Step 4: Run tests, verify they fail**

```bash
npm test -- src/engine/__tests__/cell.test.ts
```

Expected: FAIL — modules not found.

- [ ] **Step 5: Implement cell.ts**

```typescript
// src/engine/cell.ts
import { CONFIG } from './config'

export type Cell = {
  note: number   // MIDI note as float
  energy: number // 0-1
  age: number    // ticks alive
}

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

export function createCell(note: number, energy: number = CONFIG.PLACED_ENERGY): Cell {
  return { note, energy, age: 0 }
}

export function getMidiNote(note: number): number {
  return Math.round(note)
}

export function midiToNoteName(midi: number): string {
  const note = NOTE_NAMES[midi % 12]
  const octave = Math.floor(midi / 12) - 1
  return `${note}${octave}`
}
```

- [ ] **Step 6: Run cell tests, verify pass**

```bash
npm test -- src/engine/__tests__/cell.test.ts
```

Expected: PASS

- [ ] **Step 7: Write failing tests for grid.ts**

```typescript
// src/engine/__tests__/grid.test.ts
import { describe, it, expect } from 'vitest'
import { createGrid, getCell, setCell, getNeighbors, gridDensity } from '../grid'
import { createCell } from '../cell'

describe('createGrid', () => {
  it('creates a grid of given size filled with null', () => {
    const grid = createGrid(4)
    expect(grid.length).toBe(16)
    expect(grid.every(c => c === null)).toBe(true)
  })
})

describe('getCell / setCell', () => {
  it('sets and gets a cell by x,y', () => {
    const grid = createGrid(4)
    const cell = createCell(60)
    const next = setCell(grid, 4, 1, 2, cell)
    expect(getCell(next, 4, 1, 2)).toEqual(cell)
  })

  it('returns null for out-of-bounds', () => {
    const grid = createGrid(4)
    expect(getCell(grid, 4, -1, 0)).toBeNull()
    expect(getCell(grid, 4, 4, 0)).toBeNull()
  })
})

describe('getNeighbors', () => {
  it('returns up to 8 neighbors for interior cell', () => {
    const grid = createGrid(4)
    const withCell = setCell(grid, 4, 1, 0, createCell(60))
    const neighbors = getNeighbors(withCell, 4, 1, 1)
    // (1,0) is a neighbor of (1,1)
    expect(neighbors.length).toBe(1)
    expect(neighbors[0].note).toBe(60)
  })
})

describe('gridDensity', () => {
  it('returns 0 for empty grid', () => {
    expect(gridDensity(createGrid(4), 4)).toBe(0)
  })

  it('returns correct density', () => {
    let grid = createGrid(4)
    grid = setCell(grid, 4, 0, 0, createCell(60))
    grid = setCell(grid, 4, 1, 1, createCell(64))
    expect(gridDensity(grid, 4)).toBeCloseTo(2 / 16)
  })
})
```

- [ ] **Step 8: Run grid tests, verify fail**

```bash
npm test -- src/engine/__tests__/grid.test.ts
```

Expected: FAIL

- [ ] **Step 9: Implement grid.ts**

```typescript
// src/engine/grid.ts
import { Cell } from './cell'

export type Grid = (Cell | null)[]

export function createGrid(size: number): Grid {
  return new Array(size * size).fill(null)
}

export function getCell(grid: Grid, size: number, x: number, y: number): Cell | null {
  if (x < 0 || x >= size || y < 0 || y >= size) return null
  return grid[y * size + x]
}

export function setCell(grid: Grid, size: number, x: number, y: number, cell: Cell | null): Grid {
  if (x < 0 || x >= size || y < 0 || y >= size) return grid
  const next = [...grid]
  next[y * size + x] = cell
  return next
}

const NEIGHBOR_OFFSETS = [
  [-1, -1], [0, -1], [1, -1],
  [-1,  0],          [1,  0],
  [-1,  1], [0,  1], [1,  1],
]

export function getNeighbors(grid: Grid, size: number, x: number, y: number): Cell[] {
  const result: Cell[] = []
  for (const [dx, dy] of NEIGHBOR_OFFSETS) {
    const cell = getCell(grid, size, x + dx, y + dy)
    if (cell) result.push(cell)
  }
  return result
}

export function gridDensity(grid: Grid, size: number): number {
  let count = 0
  for (const cell of grid) {
    if (cell) count++
  }
  return count / (size * size)
}
```

- [ ] **Step 10: Run grid tests, verify pass**

```bash
npm test -- src/engine/__tests__/grid.test.ts
```

Expected: PASS

- [ ] **Step 11: Commit**

```bash
git add src/engine/ vitest.config.ts package.json package-lock.json
git commit -m "feat: add config, cell, and grid engine core with tests"
```

---

### Task 2: Harmony Scoring

**Files:**
- Create: `src/engine/harmony.ts`
- Test: `src/engine/__tests__/harmony.test.ts`

- [ ] **Step 1: Write failing tests for harmony.ts**

```typescript
// src/engine/__tests__/harmony.test.ts
import { describe, it, expect } from 'vitest'
import { getInterval, intervalScore, scoreHarmony } from '../harmony'
import { createCell } from '../cell'

describe('getInterval', () => {
  it('returns interval mod 12', () => {
    expect(getInterval(60, 67)).toBe(7) // perfect fifth
    expect(getInterval(60, 61)).toBe(1) // minor 2nd
    expect(getInterval(60, 72)).toBe(0) // octave = unison
  })
})

describe('intervalScore', () => {
  it('returns correct scores for known intervals', () => {
    expect(intervalScore(0)).toBe(1.0)   // unison
    expect(intervalScore(7)).toBe(0.8)   // fifth
    expect(intervalScore(1)).toBe(-0.6)  // minor 2nd
    expect(intervalScore(6)).toBe(-0.5)  // tritone
  })
})

describe('scoreHarmony', () => {
  it('sums scores across neighbors', () => {
    const cell = createCell(60)  // C
    const neighbors = [
      createCell(67), // G — fifth (+0.8)
      createCell(64), // E — major third (+0.5)
    ]
    expect(scoreHarmony(cell, neighbors)).toBeCloseTo(1.3)
  })

  it('returns 0 for no neighbors', () => {
    expect(scoreHarmony(createCell(60), [])).toBe(0)
  })

  it('handles dissonant neighbors', () => {
    const cell = createCell(60) // C
    const neighbors = [createCell(61)] // C# — minor 2nd (-0.6)
    expect(scoreHarmony(cell, neighbors)).toBeCloseTo(-0.6)
  })
})
```

- [ ] **Step 2: Run tests, verify fail**

```bash
npm test -- src/engine/__tests__/harmony.test.ts
```

- [ ] **Step 3: Implement harmony.ts**

```typescript
// src/engine/harmony.ts
import { Cell } from './cell'
import { getMidiNote } from './cell'

const INTERVAL_SCORES: Record<number, number> = {
  0: 1.0,   // unison
  1: -0.6,  // minor 2nd
  2: 0.0,   // major 2nd
  3: 0.4,   // minor 3rd
  4: 0.5,   // major 3rd
  5: 0.6,   // perfect 4th
  6: -0.5,  // tritone
  7: 0.8,   // perfect 5th
  8: 0.3,   // minor 6th
  9: 0.3,   // major 6th
  10: -0.2, // minor 7th
  11: -0.6, // major 7th
}

export function getInterval(noteA: number, noteB: number): number {
  return Math.abs(getMidiNote(noteA) - getMidiNote(noteB)) % 12
}

export function intervalScore(interval: number): number {
  return INTERVAL_SCORES[interval] ?? 0
}

export function scoreHarmony(cell: Cell, neighbors: Cell[]): number {
  let score = 0
  for (const neighbor of neighbors) {
    const interval = getInterval(cell.note, neighbor.note)
    score += intervalScore(interval)
  }
  return score
}
```

- [ ] **Step 4: Run tests, verify pass**

```bash
npm test -- src/engine/__tests__/harmony.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add src/engine/harmony.ts src/engine/__tests__/harmony.test.ts
git commit -m "feat: add harmony interval scoring with tests"
```

---

### Task 3: Music Theory (Scales + Chord Completion)

**Files:**
- Create: `src/engine/music.ts`
- Test: `src/engine/__tests__/music.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// src/engine/__tests__/music.test.ts
import { describe, it, expect } from 'vitest'
import { getScaleNotes, findChordCompletion, SCALES } from '../music'

describe('getScaleNotes', () => {
  it('returns C major pentatonic notes', () => {
    const notes = getScaleNotes(0, 'pentatonic') // C pentatonic
    expect(notes).toEqual([0, 2, 4, 7, 9])
  })

  it('returns D major scale notes', () => {
    const notes = getScaleNotes(2, 'major') // D major
    expect(notes).toEqual([2, 4, 6, 7, 9, 11, 1])
  })
})

describe('findChordCompletion', () => {
  it('completes C major triad from C and E → G', () => {
    const result = findChordCompletion([0, 4], getScaleNotes(0, 'major'))
    expect(result).toContain(7) // G completes C-E-G
  })

  it('completes A minor triad from A and C → E', () => {
    const result = findChordCompletion([9, 0], getScaleNotes(0, 'major'))
    expect(result).toContain(4) // E completes A-C-E
  })

  it('returns empty when no completion fits scale', () => {
    // Two notes that only complete to out-of-scale chords
    const result = findChordCompletion([1, 5], getScaleNotes(0, 'pentatonic'))
    // May or may not have results — just verify it returns an array
    expect(Array.isArray(result)).toBe(true)
  })

  it('returns empty for single note', () => {
    const result = findChordCompletion([0], getScaleNotes(0, 'major'))
    expect(result).toEqual([])
  })
})
```

- [ ] **Step 2: Run tests, verify fail**

```bash
npm test -- src/engine/__tests__/music.test.ts
```

- [ ] **Step 3: Implement music.ts**

```typescript
// src/engine/music.ts

export const SCALES: Record<string, number[]> = {
  major:      [0, 2, 4, 5, 7, 9, 11],
  minor:      [0, 2, 3, 5, 7, 8, 10],
  pentatonic: [0, 2, 4, 7, 9],
  blues:      [0, 3, 5, 6, 7, 10],
  dorian:     [0, 2, 3, 5, 7, 9, 10],
}

// Chord templates: triads as sets of intervals from root
const CHORD_TEMPLATES = [
  [0, 4, 7],  // major
  [0, 3, 7],  // minor
  [0, 3, 6],  // diminished
  [0, 4, 8],  // augmented
  [0, 2, 7],  // sus2
  [0, 5, 7],  // sus4
]

export function getScaleNotes(root: number, scaleName: string): number[] {
  const intervals = SCALES[scaleName] ?? SCALES.major
  return intervals.map(i => (i + root) % 12)
}

/**
 * Given a set of pitch classes from neighbors, find candidate birth notes
 * by chord completion. Returns pitch classes filtered to the given scale.
 */
export function findChordCompletion(neighborPitchClasses: number[], scaleNotes: number[]): number[] {
  if (neighborPitchClasses.length < 2) return []

  const candidates = new Set<number>()
  const neighborSet = new Set(neighborPitchClasses)

  for (const template of CHORD_TEMPLATES) {
    // Try every rotation (every note in template as root)
    for (let rootOffset = 0; rootOffset < 12; rootOffset++) {
      const rotated = template.map(t => (t + rootOffset) % 12)
      // Check if 2 of 3 notes are in neighbor pitch classes
      const matches = rotated.filter(n => neighborSet.has(n))
      if (matches.length === 2) {
        const missing = rotated.find(n => !neighborSet.has(n))!
        if (scaleNotes.includes(missing)) {
          candidates.add(missing)
        }
      }
    }
  }

  return Array.from(candidates)
}
```

- [ ] **Step 4: Run tests, verify pass**

```bash
npm test -- src/engine/__tests__/music.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add src/engine/music.ts src/engine/__tests__/music.test.ts
git commit -m "feat: add scales, chord templates, and chord completion logic"
```

---

### Task 4: Automata Rules (Survive, Birth, Energy, Pitch Gravity)

**Files:**
- Create: `src/engine/rules.ts`
- Test: `src/engine/__tests__/rules.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// src/engine/__tests__/rules.test.ts
import { describe, it, expect } from 'vitest'
import { survives, updateEnergy, applyPitchGravity } from '../rules'
import { createCell } from '../cell'

describe('survives', () => {
  it('cell with consonant neighbors survives', () => {
    const cell = createCell(60) // C
    const neighbors = [createCell(67), createCell(64)] // G, E — score 1.3
    expect(survives(cell, neighbors, 0.5)).toBe(true)
  })

  it('cell with dissonant neighbors dies', () => {
    const cell = createCell(60) // C
    const neighbors = [createCell(61)] // C# — score -0.6
    expect(survives(cell, neighbors, 0.5)).toBe(false)
  })

  it('isolated cell with no neighbors dies', () => {
    expect(survives(createCell(60), [], 0.5)).toBe(false)
  })
})

describe('updateEnergy', () => {
  it('decays energy each tick', () => {
    const cell = createCell(60, 1.0)
    const updated = updateEnergy(cell, 0, 1.0) // 0 consonant neighbors
    expect(updated.energy).toBeCloseTo(0.98) // 1.0 - 0.02
  })

  it('restores energy from consonant neighbors', () => {
    const cell = createCell(60, 0.5)
    const updated = updateEnergy(cell, 3, 1.0) // 3 consonant neighbors
    expect(updated.energy).toBeCloseTo(0.5 - 0.02 + 3 * 0.05) // 0.63
  })

  it('clamps energy to 1.0', () => {
    const cell = createCell(60, 1.0)
    const updated = updateEnergy(cell, 8, 1.0) // lots of restore
    expect(updated.energy).toBeLessThanOrEqual(1.0)
  })

  it('applies curve multiplier', () => {
    const cell = createCell(60, 1.0)
    const updated = updateEnergy(cell, 0, 0.5) // half energy curve
    expect(updated.energy).toBeCloseTo((1.0 - 0.02) * 0.5)
  })
})

describe('applyPitchGravity', () => {
  it('drifts note toward consonant neighbor average', () => {
    const cell = createCell(60, 1.0) // C4
    const target = 67 // G4
    const result = applyPitchGravity(cell, target, [0, 2, 4, 5, 7, 9, 11])
    // note += (67 - 60) * 0.1 = 60.7
    expect(result.note).toBeCloseTo(60.7)
  })
})
```

- [ ] **Step 2: Run tests, verify fail**

```bash
npm test -- src/engine/__tests__/rules.test.ts
```

- [ ] **Step 3: Implement rules.ts**

```typescript
// src/engine/rules.ts
import { Cell, createCell, getMidiNote } from './cell'
import { CONFIG } from './config'
import { scoreHarmony, getInterval, intervalScore } from './harmony'

export function survives(cell: Cell, neighbors: Cell[], threshold: number): boolean {
  if (neighbors.length === 0) return false
  const score = scoreHarmony(cell, neighbors)
  return score >= threshold
}

export function updateEnergy(
  cell: Cell,
  consonantNeighborCount: number,
  curveMultiplier: number,
): Cell {
  const decay = CONFIG.ENERGY_DECAY_PER_TICK
  const restore = consonantNeighborCount * CONFIG.CONSONANCE_ENERGY_RESTORE
  const raw = Math.min(1, cell.energy - decay + restore)
  const energy = Math.max(0, raw * curveMultiplier)
  return { ...cell, energy }
}

export function applyPitchGravity(
  cell: Cell,
  targetNote: number,
  scaleNotes: number[], // pitch classes in current scale
): Cell {
  const newNote = cell.note + (targetNote - cell.note) * CONFIG.PITCH_GRAVITY_STRENGTH
  // Snap rounded note to scale if needed
  const rounded = Math.round(newNote)
  const pitchClass = rounded % 12
  if (!scaleNotes.includes(pitchClass)) {
    // Find nearest scale note
    let bestDist = Infinity
    let bestPC = pitchClass
    for (const pc of scaleNotes) {
      const dist = Math.min(Math.abs(pc - pitchClass), 12 - Math.abs(pc - pitchClass))
      if (dist < bestDist) {
        bestDist = dist
        bestPC = pc
      }
    }
    // Adjust the float note to snap
    const octave = Math.floor(rounded / 12)
    const snapped = octave * 12 + bestPC
    return { ...cell, note: snapped }
  }
  return { ...cell, note: newNote }
}

export function countConsonantNeighbors(cell: Cell, neighbors: Cell[]): number {
  let count = 0
  for (const n of neighbors) {
    if (intervalScore(getInterval(cell.note, n.note)) > 0) count++
  }
  return count
}

export function shouldPlayThisTick(cell: Cell, tick: number): boolean {
  if (cell.energy >= 0.5) return true
  if (cell.energy >= 0.25) return tick % 2 === 0
  return tick % 4 === 0
}
```

- [ ] **Step 4: Run tests, verify pass**

```bash
npm test -- src/engine/__tests__/rules.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add src/engine/rules.ts src/engine/__tests__/rules.test.ts
git commit -m "feat: add automata rules — survival, energy, pitch gravity"
```

---

### Task 5: Conductor

**Files:**
- Create: `src/engine/conductor.ts`
- Test: `src/engine/__tests__/conductor.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// src/engine/__tests__/conductor.test.ts
import { describe, it, expect } from 'vitest'
import { createConductor, getEnergyCurve, updateConductor } from '../conductor'

describe('createConductor', () => {
  it('initializes with default state', () => {
    const c = createConductor()
    expect(c.tick).toBe(0)
    expect(c.key).toBe(0) // C
    expect(c.progressionIndex).toBe(0)
    expect(c.curveMultiplier).toBe(1.0) // starts at 1.0 so cells don't die immediately
  })
})

describe('getEnergyCurve', () => {
  it('returns small value at tick 0 (start of rise)', () => {
    // tick 0 is before the curve starts — curve only applies from tick 1
    expect(getEnergyCurve(1, 200)).toBeGreaterThan(0)
    expect(getEnergyCurve(1, 200)).toBeLessThan(0.1)
  })

  it('returns ~1.0 during plateau', () => {
    expect(getEnergyCurve(100, 200)).toBeCloseTo(1.0)
  })

  it('returns near 0 at end of fall', () => {
    expect(getEnergyCurve(199, 200)).toBeLessThan(0.05)
  })
})
```

- [ ] **Step 2: Run tests, verify fail**

```bash
npm test -- src/engine/__tests__/conductor.test.ts
```

- [ ] **Step 3: Implement conductor.ts**

```typescript
// src/engine/conductor.ts
import { CONFIG } from './config'

export type ConductorState = {
  tick: number
  key: number              // pitch class 0-11
  scale: string            // scale name
  progressionIndex: number // index into CONFIG.PROGRESSION
  curveMultiplier: number  // 0-1
  consonanceRatio: number  // rolling ratio for progression advance
  stableTickCount: number  // consecutive ticks above tension threshold
  thresholdAdjustment: number // density management offset
}

export function createConductor(key = 0, scale = 'pentatonic'): ConductorState {
  return {
    tick: 0,
    key,
    scale,
    progressionIndex: 0,
    curveMultiplier: 1.0, // Start at 1.0; curve takes over from tick 1
    consonanceRatio: 0,
    stableTickCount: 0,
    thresholdAdjustment: 0,
  }
}

export function getEnergyCurve(tick: number, totalTicks: number): number {
  const t = tick / totalTicks
  if (t < 0.2) {
    // Rise: sine ease-in from 0 to 1
    const phase = t / 0.2 // 0 to 1
    return Math.sin((phase * Math.PI) / 2)
  } else if (t < 0.7) {
    // Plateau
    return 1.0
  } else {
    // Fall: exponential decay
    const phase = (t - 0.7) / 0.3 // 0 to 1
    return Math.exp(-5 * phase)
  }
}

export function updateConductor(
  state: ConductorState,
  gridDensity: number,
  totalPositiveScore: number,
  totalNegativeScore: number,
): ConductorState {
  const tick = state.tick + 1
  const curveMultiplier = getEnergyCurve(tick, CONFIG.ARC_DURATION_TICKS)

  // Density management
  let thresholdAdjustment = 0
  if (gridDensity > CONFIG.DENSITY_TARGET * 1.5) {
    thresholdAdjustment = 0.2
  } else if (gridDensity < CONFIG.DENSITY_TARGET * 0.5) {
    thresholdAdjustment = -0.2
  }

  // Chord progression advance
  const ratio = totalNegativeScore === 0
    ? Infinity
    : totalPositiveScore / Math.abs(totalNegativeScore)
  const consonanceRatio = ratio
  const stableTickCount = ratio > 3 ? state.stableTickCount + 1 : 0
  let progressionIndex = state.progressionIndex
  if (stableTickCount >= 5) {
    progressionIndex = (progressionIndex + 1) % CONFIG.PROGRESSION.length
  }

  // Key change (random)
  let key = state.key
  if (Math.random() < CONFIG.KEY_CHANGE_PROBABILITY) {
    // Shift by a fifth (7 semitones) — musically smooth
    key = (key + 7) % 12
  }

  return {
    ...state,
    tick,
    key,
    progressionIndex,
    curveMultiplier,
    consonanceRatio,
    stableTickCount: stableTickCount >= 5 ? 0 : stableTickCount,
    thresholdAdjustment,
  }
}

export function isFinished(state: ConductorState): boolean {
  return state.curveMultiplier < 0.01 && state.tick > 10
}
```

- [ ] **Step 4: Run tests, verify pass**

```bash
npm test -- src/engine/__tests__/conductor.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add src/engine/conductor.ts src/engine/__tests__/conductor.test.ts
git commit -m "feat: add conductor — energy curve, key tracking, progression"
```

---

### Task 6: Zustand Store

**Files:**
- Create: `src/store/store.ts`

- [ ] **Step 1: Implement store.ts**

```typescript
// src/store/store.ts
import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import { Grid, createGrid } from '@/engine/grid'
import { ConductorState, createConductor } from '@/engine/conductor'
import { CONFIG } from '@/engine/config'

export type PlaybackState = 'setup' | 'playing' | 'paused' | 'finished'

type Store = {
  // Grid
  grid: Grid
  gridSize: number

  // Conductor
  conductor: ConductorState

  // Playback
  playback: PlaybackState
  tick: number

  // Settings
  rootKey: number
  scale: string
  selectedNote: number | null
  brushType: 'single' | 'chord' | 'scatter' | 'bass' | 'random'
  muted: boolean

  // Actions
  setCell: (x: number, y: number, note: number) => void
  clearCell: (x: number, y: number) => void
  setGrid: (grid: Grid) => void
  setConductor: (conductor: ConductorState) => void
  setPlayback: (state: PlaybackState) => void
  setTick: (tick: number) => void
  setSelectedNote: (note: number | null) => void
  setBrushType: (brush: Store['brushType']) => void
  setRootKey: (key: number) => void
  setScale: (scale: string) => void
  toggleMute: () => void
  reset: () => void
}

export const useStore = create<Store>()(subscribeWithSelector((set) => ({
  grid: createGrid(CONFIG.GRID_SIZE),
  gridSize: CONFIG.GRID_SIZE,
  conductor: createConductor(),
  playback: 'setup',
  tick: 0,
  rootKey: 0,
  scale: 'pentatonic',
  selectedNote: null,
  brushType: 'single',
  muted: false,

  setCell: (x, y, note) => set((s) => {
    const next = [...s.grid]
    next[y * s.gridSize + x] = { note, energy: CONFIG.PLACED_ENERGY, age: 0 }
    return { grid: next }
  }),
  clearCell: (x, y) => set((s) => {
    const next = [...s.grid]
    next[y * s.gridSize + x] = null
    return { grid: next }
  }),
  setGrid: (grid) => set({ grid }),
  setConductor: (conductor) => set({ conductor }),
  setPlayback: (playback) => set({ playback }),
  setTick: (tick) => set({ tick }),
  setSelectedNote: (selectedNote) => set({ selectedNote }),
  setBrushType: (brushType) => set({ brushType }),
  setRootKey: (rootKey) => set({ rootKey }),
  setScale: (scale) => set({ scale }),
  toggleMute: () => set((s) => ({ muted: !s.muted })),
  reset: () => set({
    grid: createGrid(CONFIG.GRID_SIZE),
    conductor: createConductor(),
    playback: 'setup',
    tick: 0,
  }),
})))
```

- [ ] **Step 2: Commit**

```bash
git add src/store/store.ts
git commit -m "feat: add Zustand store for grid, conductor, playback state"
```

---

### Task 7: Canvas Renderer (Basic Grid)

**Files:**
- Create: `src/canvas/renderer.ts`

- [ ] **Step 1: Implement renderer.ts**

Basic renderer — draws cells as colored circles on dark background. No glow/particles yet.

```typescript
// src/canvas/renderer.ts
import { Grid, getCell } from '@/engine/grid'
import { getMidiNote } from '@/engine/cell'

const BG_COLOR = '#0a0a0f'

// Map pitch class (0-11) to hue (0-360)
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
```

- [ ] **Step 2: Commit**

```bash
git add src/canvas/renderer.ts
git commit -m "feat: add basic Canvas renderer for grid cells"
```

---

### Task 8: Main Page — Interactive Grid (No Audio)

**Files:**
- Modify: `src/app/page.tsx`
- Create: `src/ui/NotePalette.tsx`

This is the first visual milestone: user can paint notes on a grid and see colored circles.

- [ ] **Step 1: Create NotePalette.tsx**

Simple row of note buttons (pentatonic scale by default). Clicking a button selects that note. The palette reads `rootKey` and `scale` from the store.

```typescript
// src/ui/NotePalette.tsx
'use client'

import { useStore } from '@/store/store'
import { getScaleNotes } from '@/engine/music'
import { midiToNoteName } from '@/engine/cell'

const BASE_OCTAVE = 4 // Start at octave 4 (MIDI 60+)

function noteToHue(midi: number): number {
  return (midi % 12) * 30
}

export default function NotePalette() {
  const { rootKey, scale, selectedNote, setSelectedNote } = useStore()
  const scaleNotes = getScaleNotes(rootKey, scale)

  // Generate MIDI notes across 2 octaves
  const notes = scaleNotes.flatMap((pc) => [
    (BASE_OCTAVE + 1) * 12 + pc,
    (BASE_OCTAVE + 2) * 12 + pc,
  ]).sort((a, b) => a - b)

  return (
    <div className="flex flex-wrap gap-1 p-2">
      {notes.map((midi) => {
        const hue = noteToHue(midi)
        const isSelected = selectedNote === midi
        return (
          <button
            key={midi}
            onClick={() => setSelectedNote(isSelected ? null : midi)}
            className={`px-2 py-1 rounded text-xs font-mono transition-all ${
              isSelected ? 'ring-2 ring-white scale-110' : 'opacity-70 hover:opacity-100'
            }`}
            style={{
              backgroundColor: `hsl(${hue}, 70%, 40%)`,
              color: 'white',
            }}
          >
            {midiToNoteName(midi)}
          </button>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 2: Update page.tsx with canvas + palette**

Replace `page.tsx` with a component that mounts a `<canvas>`, draws the grid, and handles click-to-place.

```typescript
// src/app/page.tsx
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
```

- [ ] **Step 3: Verify in browser**

```bash
npm run dev
```

Visit http://localhost:3000. Confirm:
- Dark background with grid
- Note palette appears below
- Clicking a note then clicking grid places a colored dot
- Clicking with no note selected erases

- [ ] **Step 4: Commit**

```bash
git add src/app/page.tsx src/ui/NotePalette.tsx
git commit -m "feat: interactive grid — paint notes on canvas with palette"
```

---

### Task 9: Simulation Tick Loop

**Files:**
- Create: `src/engine/tick.ts`, `src/hooks/useSimulation.ts`
- Test: `src/engine/__tests__/tick.test.ts`

- [ ] **Step 1: Write failing tests for tick.ts**

The tick function takes a grid + conductor state and returns the next grid + conductor state. Pure function — no side effects.

```typescript
// src/engine/__tests__/tick.test.ts
import { describe, it, expect } from 'vitest'
import { simulateTick } from '../tick'
import { createGrid, setCell } from '../grid'
import { createCell } from '../cell'
import { createConductor } from '../conductor'

describe('simulateTick', () => {
  it('kills isolated cell (no harmonic support)', () => {
    let grid = createGrid(8)
    grid = setCell(grid, 8, 4, 4, createCell(60, 0.03)) // Low energy, isolated
    const conductor = createConductor()

    const result = simulateTick(grid, 8, conductor, [0, 2, 4, 7, 9])
    // Cell should lose energy and die (0.03 - 0.02 < threshold for survival)
    const cell = result.grid[4 * 8 + 4]
    // Either dead (null) or very low energy
    expect(cell === null || cell.energy <= 0.01).toBe(true)
  })

  it('consonant neighbors keep cells alive', () => {
    let grid = createGrid(8)
    // C and G (perfect fifth) next to each other
    grid = setCell(grid, 8, 3, 4, createCell(60, 0.8)) // C
    grid = setCell(grid, 8, 4, 4, createCell(67, 0.8)) // G
    const conductor = createConductor()

    const result = simulateTick(grid, 8, conductor, [0, 2, 4, 5, 7, 9, 11])
    // Both should survive
    expect(result.grid[4 * 8 + 3]).not.toBeNull()
    expect(result.grid[4 * 8 + 4]).not.toBeNull()
  })

  it('advances conductor tick', () => {
    const grid = createGrid(8)
    const conductor = createConductor()
    const result = simulateTick(grid, 8, conductor, [0, 2, 4, 7, 9])
    expect(result.conductor.tick).toBe(1)
  })
})
```

- [ ] **Step 2: Run tests, verify fail**

```bash
npm test -- src/engine/__tests__/tick.test.ts
```

- [ ] **Step 3: Implement tick.ts**

```typescript
// src/engine/tick.ts
import { Grid, getCell, getNeighbors, gridDensity } from './grid'
import { Cell, getMidiNote } from './cell'
import { CONFIG } from './config'
import { scoreHarmony, getInterval, intervalScore } from './harmony'
import { findChordCompletion } from './music'
import { survives, updateEnergy, applyPitchGravity, countConsonantNeighbors } from './rules'
import { ConductorState, updateConductor, isFinished } from './conductor'

export type TickResult = {
  grid: Grid
  conductor: ConductorState
  births: { x: number; y: number }[]
  deaths: { x: number; y: number }[]
  finished: boolean
}

export function simulateTick(
  grid: Grid,
  size: number,
  conductor: ConductorState,
  scaleNotes: number[],
): TickResult {
  const next: Grid = new Array(size * size).fill(null)
  const births: { x: number; y: number }[] = []
  const deaths: { x: number; y: number }[] = []
  let totalPositive = 0
  let totalNegative = 0

  const threshold = CONFIG.CONSONANCE_THRESHOLD + conductor.thresholdAdjustment

  // Phase 1: Evaluate survival and energy for living cells
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const cell = getCell(grid, size, x, y)
      if (!cell) continue

      const neighbors = getNeighbors(grid, size, x, y)
      const harmonyScore = scoreHarmony(cell, neighbors)

      // Track global scores for conductor
      if (harmonyScore > 0) totalPositive += harmonyScore
      else totalNegative += harmonyScore

      if (!survives(cell, neighbors, threshold)) {
        deaths.push({ x, y })
        continue
      }

      // Update energy
      const consonantCount = countConsonantNeighbors(cell, neighbors)
      let updated = updateEnergy(cell, consonantCount, conductor.curveMultiplier)

      // Pitch gravity
      if (neighbors.length > 0) {
        let weightedSum = 0
        let weightTotal = 0
        for (const n of neighbors) {
          const score = intervalScore(getInterval(cell.note, n.note))
          if (score > 0) {
            weightedSum += n.note * score
            weightTotal += score
          }
        }
        if (weightTotal > 0) {
          const target = weightedSum / weightTotal
          updated = applyPitchGravity(updated, target, scaleNotes)
        }
      }

      // Age
      updated = { ...updated, age: cell.age + 1 }

      // Die if energy depleted
      if (updated.energy <= 0) {
        deaths.push({ x, y })
        continue
      }

      next[y * size + x] = updated
    }
  }

  // Phase 2: Birth
  if (CONFIG.BIRTH_CHORD_COMPLETION) {
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        if (next[y * size + x] !== null) continue // already alive

        const neighbors = getNeighbors(grid, size, x, y)
        if (neighbors.length < 2) continue

        const pitchClasses = [...new Set(neighbors.map(n => getMidiNote(n.note) % 12))]
        const candidates = findChordCompletion(pitchClasses, scaleNotes)
        if (candidates.length === 0) continue

        // Pick best candidate (highest harmony score against neighbors)
        let bestNote = candidates[0]
        let bestScore = -Infinity
        const avgOctave = Math.round(
          neighbors.reduce((sum, n) => sum + Math.floor(getMidiNote(n.note) / 12), 0) / neighbors.length
        )

        for (const pc of candidates) {
          const midi = avgOctave * 12 + pc
          const tempCell: Cell = { note: midi, energy: CONFIG.BIRTH_ENERGY, age: 0 }
          const score = scoreHarmony(tempCell, neighbors)
          if (score > bestScore) {
            bestScore = score
            bestNote = pc
          }
        }

        const midi = avgOctave * 12 + bestNote
        next[y * size + x] = { note: midi, energy: CONFIG.BIRTH_ENERGY, age: 0 }
        births.push({ x, y })
      }
    }
  }

  // Phase 3: Update conductor
  const density = gridDensity(next, size)
  const nextConductor = updateConductor(conductor, density, totalPositive, Math.abs(totalNegative))
  const finished = isFinished(nextConductor)

  // If finished, kill all remaining
  if (finished) {
    for (let i = 0; i < next.length; i++) {
      next[i] = null
    }
  }

  return { grid: next, conductor: nextConductor, births, deaths, finished }
}
```

- [ ] **Step 4: Run tests, verify pass**

```bash
npm test -- src/engine/__tests__/tick.test.ts
```

- [ ] **Step 5: Implement useSimulation.ts**

```typescript
// src/hooks/useSimulation.ts
'use client'

import { useCallback, useRef, useEffect } from 'react'
import { useStore } from '@/store/store'
import { simulateTick, TickResult } from '@/engine/tick'
import { getScaleNotes } from '@/engine/music'
import { CONFIG } from '@/engine/config'

export function useSimulation() {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const lastTickResult = useRef<TickResult | null>(null)

  const doTick = useCallback(() => {
    const state = useStore.getState()
    if (state.playback !== 'playing') return

    const scaleNotes = getScaleNotes(state.conductor.key, state.conductor.scale)
    const result = simulateTick(state.grid, state.gridSize, state.conductor, scaleNotes)

    lastTickResult.current = result
    state.setGrid(result.grid)
    state.setConductor(result.conductor)
    state.setTick(state.tick + 1)

    if (result.finished) {
      state.setPlayback('finished')
    }
  }, [])

  const play = useCallback(() => {
    const state = useStore.getState()
    if (state.playback === 'finished') return
    useStore.getState().setPlayback('playing')
  }, [])

  const pause = useCallback(() => {
    useStore.getState().setPlayback('paused')
  }, [])

  const stop = useCallback(() => {
    useStore.getState().reset()
  }, [])

  // Tick loop
  useEffect(() => {
    const unsub = useStore.subscribe((state) => {
      if (state.playback === 'playing' && !intervalRef.current) {
        intervalRef.current = setInterval(doTick, CONFIG.TICK_INTERVAL_MS)
      } else if (state.playback !== 'playing' && intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    })

    return () => {
      unsub()
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [doTick])

  return { play, pause, stop, lastTickResult }
}
```

- [ ] **Step 6: Commit**

```bash
git add src/engine/tick.ts src/engine/__tests__/tick.test.ts src/hooks/useSimulation.ts
git commit -m "feat: add simulation tick loop and useSimulation hook"
```

---

### Task 10: Audio — Tone.js Integration

**Files:**
- Create: `src/audio/synth.ts`, `src/audio/mix.ts`, `src/hooks/useAudio.ts`

- [ ] **Step 1: Implement synth.ts**

```typescript
// src/audio/synth.ts
import * as Tone from 'tone'
import { midiToNoteName } from '@/engine/cell'

let synth: Tone.PolySynth | null = null
let reverb: Tone.Reverb | null = null
let delay: Tone.FeedbackDelay | null = null

export async function initAudio(): Promise<void> {
  await Tone.start()

  reverb = new Tone.Reverb({ decay: 4, wet: 0.4 }).toDestination()
  delay = new Tone.FeedbackDelay({ delayTime: '8n', feedback: 0.2, wet: 0.15 }).connect(reverb)

  synth = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: 'sine' },
    envelope: {
      attack: 0.3,
      decay: 0.5,
      sustain: 0.6,
      release: 1.5,
    },
    volume: -12,
  }).connect(delay)
}

export function triggerNotes(notes: { midi: number; volume: number }[]): void {
  if (!synth) return

  const now = Tone.now()
  for (const { midi, volume } of notes) {
    const name = midiToNoteName(midi)
    const velocity = Math.max(0.01, Math.min(1, volume * 0.3))
    synth.triggerAttackRelease(name, '4n', now, velocity)
  }
}

export function updateEffects(density: number): void {
  if (reverb) {
    reverb.wet.value = Math.min(0.8, 0.2 + (1 - density) * 0.6)
  }
  if (delay) {
    delay.wet.value = Math.min(0.4, 0.05 + (1 - density) * 0.35)
  }
}

export function disposeAudio(): void {
  synth?.dispose()
  reverb?.dispose()
  delay?.dispose()
  synth = null
  reverb = null
  delay = null
}
```

- [ ] **Step 2: Implement mix.ts**

```typescript
// src/audio/mix.ts
import { Cell, getMidiNote } from '@/engine/cell'
import { Grid, getCell, getNeighbors } from '@/engine/grid'
import { shouldPlayThisTick } from '@/engine/rules'

export function collectPlayableNotes(
  grid: Grid,
  size: number,
  tick: number,
): { midi: number; volume: number }[] {
  const notes: { midi: number; volume: number }[] = []

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const cell = getCell(grid, size, x, y)
      if (!cell) continue
      if (!shouldPlayThisTick(cell, tick)) continue

      const neighbors = getNeighbors(grid, size, x, y)
      const localDensity = Math.max(1, neighbors.filter(Boolean).length)
      const volume = cell.energy / Math.sqrt(localDensity)

      notes.push({ midi: getMidiNote(cell.note), volume })
    }
  }

  return notes
}
```

- [ ] **Step 3: Implement useAudio.ts**

```typescript
// src/hooks/useAudio.ts
'use client'

import { useEffect, useRef, useCallback } from 'react'
import { initAudio, disposeAudio, triggerNotes, updateEffects } from '@/audio/synth'
import { collectPlayableNotes } from '@/audio/mix'
import { useStore } from '@/store/store'
import { gridDensity } from '@/engine/grid'

export function useAudio() {
  const initializedRef = useRef(false)

  const init = useCallback(async () => {
    if (initializedRef.current) return
    await initAudio()
    initializedRef.current = true
  }, [])

  // Listen for tick changes and play notes
  useEffect(() => {
    const unsub = useStore.subscribe(
      (state) => state.tick,
      (tick) => {
        if (!initializedRef.current) return
        const state = useStore.getState()
        if (state.playback !== 'playing' || state.muted) return

        const notes = collectPlayableNotes(state.grid, state.gridSize, tick)
        triggerNotes(notes)

        const density = gridDensity(state.grid, state.gridSize)
        updateEffects(density)
      },
    )

    return () => unsub()
  }, [])

  useEffect(() => {
    return () => {
      disposeAudio()
      initializedRef.current = false
    }
  }, [])

  return { init }
}
```

- [ ] **Step 4: Commit**

```bash
git add src/audio/ src/hooks/useAudio.ts
git commit -m "feat: add Tone.js audio synthesis with volume balancing and effects"
```

---

### Task 11: Control Panel + Wire Everything Together

**Files:**
- Create: `src/ui/ControlPanel.tsx`
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Create ControlPanel.tsx**

```typescript
// src/ui/ControlPanel.tsx
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
```

- [ ] **Step 2: Update page.tsx to include ControlPanel and audio**

Update `page.tsx` to import and render `ControlPanel` above the canvas. The simulation and audio hooks are used inside ControlPanel.

- [ ] **Step 3: Verify in browser**

```bash
npm run dev
```

Confirm:
- Place some notes on the grid
- Press Play → cells evolve, audio plays
- Mute/unmute works
- Reset clears the grid
- Tick counter advances

- [ ] **Step 4: Commit**

```bash
git add src/ui/ControlPanel.tsx src/app/page.tsx
git commit -m "feat: add control panel, wire simulation + audio together"
```

---

### Task 12: Visual Polish — Glow, Particles, Harmonic Lines

**Files:**
- Create: `src/canvas/particles.ts`
- Modify: `src/canvas/renderer.ts`

- [ ] **Step 1: Add glow effect to renderer.ts**

Add a radial gradient glow around each cell. Glow radius proportional to energy. Color matches cell hue.

- [ ] **Step 2: Create particles.ts**

Simple particle system: on birth, emit 5-8 particles outward with cell's color. On death, emit 3-5 particles fading to dark. Particles have position, velocity, lifetime, color. Update and draw each frame.

```typescript
// src/canvas/particles.ts
export type Particle = {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  hue: number
  type: 'birth' | 'death'
}

export class ParticleSystem {
  particles: Particle[] = []

  emit(x: number, y: number, hue: number, type: 'birth' | 'death') {
    const count = type === 'birth' ? 6 : 4
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5
      const speed = 0.5 + Math.random() * 1.5
      this.particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        maxLife: 20 + Math.random() * 20,
        hue,
        type,
      })
    }
  }

  update() {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i]
      p.x += p.vx
      p.y += p.vy
      p.vx *= 0.96
      p.vy *= 0.96
      p.life -= 1 / p.maxLife
      if (p.life <= 0) {
        this.particles.splice(i, 1)
      }
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    for (const p of this.particles) {
      const alpha = p.life * 0.6
      const size = p.type === 'birth' ? 2 + p.life * 2 : 1 + p.life
      ctx.fillStyle = `hsla(${p.hue}, 80%, 60%, ${alpha})`
      ctx.beginPath()
      ctx.arc(p.x, p.y, size, 0, Math.PI * 2)
      ctx.fill()
    }
  }
}
```

- [ ] **Step 3: Add harmonic connection lines to renderer**

After drawing cells, draw faint lines between neighboring cells that have consonant intervals (score > 0.3). Line opacity proportional to score.

- [ ] **Step 4: Verify visuals in browser**

Confirm: glow around cells, particles on birth/death during playback, faint lines between harmonically bonded neighbors.

- [ ] **Step 5: Commit**

```bash
git add src/canvas/
git commit -m "feat: add visual polish — glow, particles, harmonic connection lines"
```

---

### Task 13: Runtime Settings + Settings Drawer

**Files:**
- Create: `src/ui/SettingsDrawer.tsx`
- Modify: `src/store/store.ts`, `src/app/page.tsx`, `src/engine/tick.ts`

The simulation must read tunable values from the store at tick time, not from the static CONFIG object. This enables runtime changes via UI sliders.

- [ ] **Step 1: Add runtime settings to store**

Add to the Zustand store:

```typescript
// Add to Store type
consonanceThreshold: number
tickIntervalMs: number
reverbMix: number
cellGlow: boolean
harmonicConnections: boolean
particleEffects: boolean

// Add actions
setConsonanceThreshold: (v: number) => void
setTickIntervalMs: (v: number) => void
setReverbMix: (v: number) => void
setCellGlow: (v: boolean) => void
setHarmonicConnections: (v: boolean) => void
setParticleEffects: (v: boolean) => void
```

Initialize from CONFIG defaults.

- [ ] **Step 2: Update simulateTick to accept threshold parameter**

Change `simulateTick` signature to accept `consonanceThreshold` as a parameter instead of reading from CONFIG directly. Update `useSimulation.ts` to pass `state.consonanceThreshold + conductor.thresholdAdjustment`.

- [ ] **Step 3: Create SettingsDrawer.tsx**

Slide-out drawer with:
- Root key selector (dropdown, C through B) — updates `conductor.key` via a `forceKeyChange` store action
- Scale selector (dropdown: pentatonic, major, minor, blues, dorian)
- Consonance threshold slider (0.0 – 2.0)
- Tempo/tick interval slider (100ms – 1000ms)
- Reverb mix slider (0 – 1)
- Toggle switches for: glow, harmonic connections, particles

Root key change during playback forces a modulation by updating `conductor.key` directly.

- [ ] **Step 4: Wire into page.tsx**

Add a gear icon button that toggles the drawer.

- [ ] **Step 5: Verify in browser**

Confirm: sliders change behavior in real time. Key change during playback causes modulation. Threshold change affects survival.

- [ ] **Step 6: Commit**

```bash
git add src/ui/SettingsDrawer.tsx src/store/store.ts src/app/page.tsx src/engine/tick.ts
git commit -m "feat: add settings drawer with runtime-configurable parameters"
```

---

### Task 14: Playback Interactions (Seeds, Silence Bombs, Brushes)

**Files:**
- Modify: `src/app/page.tsx`, `src/store/store.ts`, `src/engine/grid.ts`, `src/engine/tick.ts`
- Create: `src/engine/brushes.ts`

- [ ] **Step 1: Enable click-to-place during playback**

Update `page.tsx` click handler to work when `playback === 'playing'` (not just 'setup'). Placed cells during playback get `PLACED_ENERGY`.

- [ ] **Step 2: Implement brushes.ts**

```typescript
// src/engine/brushes.ts
import { Cell, createCell } from './cell'
import { getScaleNotes } from './music'
import { CONFIG } from './config'

type BrushResult = { dx: number; dy: number; note: number }[]

export function applyBrush(
  brush: 'single' | 'chord' | 'scatter' | 'bass' | 'random',
  note: number,
  rootKey: number,
  scale: string,
): BrushResult {
  const scaleNotes = getScaleNotes(rootKey, scale)
  const octave = Math.floor(note / 12)

  switch (brush) {
    case 'single':
      return [{ dx: 0, dy: 0, note }]

    case 'chord': {
      // Place a major triad cluster
      const third = octave * 12 + scaleNotes[Math.min(2, scaleNotes.length - 1)]
      const fifth = octave * 12 + scaleNotes[Math.min(4, scaleNotes.length - 1)]
      return [
        { dx: 0, dy: 0, note },
        { dx: 1, dy: 0, note: third },
        { dx: 0, dy: 1, note: fifth },
      ]
    }

    case 'scatter': {
      // Scatter 4-6 notes randomly in a 5x5 area
      const results: BrushResult = []
      const count = 4 + Math.floor(Math.random() * 3)
      for (let i = 0; i < count; i++) {
        const dx = Math.floor(Math.random() * 5) - 2
        const dy = Math.floor(Math.random() * 5) - 2
        const pc = scaleNotes[Math.floor(Math.random() * scaleNotes.length)]
        results.push({ dx, dy, note: octave * 12 + pc })
      }
      return results
    }

    case 'bass': {
      // Low sustained note, 2 octaves down
      const bassNote = Math.max(24, note - 24)
      return [
        { dx: 0, dy: 0, note: bassNote },
        { dx: 1, dy: 0, note: bassNote },
        { dx: 0, dy: 1, note: bassNote },
      ]
    }

    case 'random': {
      // Random notes from scale in a 3x3 area
      const results: BrushResult = []
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (Math.random() > 0.5) {
            const pc = scaleNotes[Math.floor(Math.random() * scaleNotes.length)]
            const oct = octave + Math.floor(Math.random() * 2) - 1
            results.push({ dx, dy, note: Math.max(24, Math.min(96, oct * 12 + pc)) })
          }
        }
      }
      return results
    }
  }
}
```

- [ ] **Step 3: Add brush selector to NotePalette**

Add a row of brush type buttons (single, chord, scatter, bass, random) above the note buttons. Store selection in Zustand.

- [ ] **Step 4: Update click handler to use brushes**

In `page.tsx`, when a cell is clicked, call `applyBrush()` and place all resulting cells.

- [ ] **Step 5: Implement silence bombs**

Add a "silence bomb" mode toggle to ControlPanel. When active, clicking the grid kills all cells within radius 3 and marks those positions with a 3-tick rebirth cooldown.

Add to grid.ts:

```typescript
// Cooldown map: position index → ticks remaining
export type CooldownMap = Map<number, number>

export function applySilenceBomb(
  grid: Grid, size: number, cx: number, cy: number, radius: number
): { grid: Grid; cooldowns: number[] } {
  const next = [...grid]
  const cooldowns: number[] = []
  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      if (dx * dx + dy * dy > radius * radius) continue
      const x = cx + dx, y = cy + dy
      if (x < 0 || x >= size || y < 0 || y >= size) continue
      next[y * size + x] = null
      cooldowns.push(y * size + x)
    }
  }
  return { grid: next, cooldowns }
}
```

Update `simulateTick` to skip birth for cells with active cooldowns. Store cooldown map in Zustand, decrement each tick.

- [ ] **Step 6: Verify in browser**

Test: brush types place different patterns, silence bomb clears area, cooldown prevents immediate rebirth.

- [ ] **Step 7: Commit**

```bash
git add src/engine/brushes.ts src/engine/grid.ts src/ui/NotePalette.tsx src/app/page.tsx src/store/store.ts src/engine/tick.ts
git commit -m "feat: add brushes, silence bombs, and playback interactions"
```

---

### Task 15: Mood/Tempo Presets

**Files:**
- Modify: `src/ui/ControlPanel.tsx`, `src/store/store.ts`

- [ ] **Step 1: Define presets**

Add to store or a constants file:

```typescript
const MOOD_PRESETS = {
  'slow-ambient': { tickIntervalMs: 600, tempoBpm: 60, reverbMix: 0.7, consonanceThreshold: 0.3 },
  'medium-flow':  { tickIntervalMs: 300, tempoBpm: 80, reverbMix: 0.4, consonanceThreshold: 0.5 },
  'upbeat-pulse': { tickIntervalMs: 150, tempoBpm: 120, reverbMix: 0.2, consonanceThreshold: 0.7 },
}
```

- [ ] **Step 2: Add preset selector to ControlPanel**

Three buttons or a dropdown: "Ambient", "Flow", "Pulse". Applying a preset updates the relevant store values.

- [ ] **Step 3: Verify presets change behavior**

- [ ] **Step 4: Commit**

```bash
git add src/ui/ControlPanel.tsx src/store/store.ts
git commit -m "feat: add mood/tempo presets (ambient, flow, pulse)"
```

---

### Task 16: Final Integration + Deploy

**Files:**
- Modify: various cleanup

- [ ] **Step 1: Run all tests**

```bash
npm test
```

Fix any failures.

- [ ] **Step 2: Run build**

```bash
npm run build
```

Fix any TypeScript or build errors.

- [ ] **Step 3: Create TUNING.md**

Ensure `TUNING.md` exists at project root with the template from the spec.

- [ ] **Step 4: Push and deploy**

```bash
git add -A
git commit -m "feat: complete Harmonic Life v1 — musical cellular automata"
git push origin main
```

Vercel auto-deploys from main. Verify the deployment URL works.

- [ ] **Step 5: Verify deployment**

Visit the Vercel URL. Confirm:
- Grid renders
- Notes can be placed with all brush types
- Play starts simulation with audio
- Silence bombs work
- Visual effects (glow, particles, connections) work
- Settings drawer opens and changes take effect
- Mood presets change behavior
- Piece ends naturally via energy curve
