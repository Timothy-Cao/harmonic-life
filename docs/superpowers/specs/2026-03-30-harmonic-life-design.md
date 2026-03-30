# Harmonic Life — Design Spec

A musical zero-player game. Seed a grid with notes, press play, and listen as cellular automata rules driven by music theory grow your seeds into a self-composing piece of music.

## Architecture

Main-thread `requestAnimationFrame` loop with tick gating. No web workers — a 48x48 grid (~2,300 cells) at 300ms tick intervals is trivial computation.

### Components

- **Simulation Engine** — Pure TypeScript. Grid, cells, harmony scoring, automata rules, conductor. No framework dependencies.
- **Audio Layer** — Tone.js PolySynth. Schedules notes each tick, manages effects chain.
- **Rendering Layer** — HTML Canvas. Redraws each animation frame (independent of tick rate). Glowing cells, harmonic connections, particle effects.
- **State Management** — Zustand store: grid state, conductor state, playback state, user settings.
- **UI** — React + Tailwind CSS. ControlPanel, NotePalette, SettingsDrawer.

### Data Flow Per Tick

```
Conductor reads grid → outputs biases (key, energy multiplier, birth preferences)
Rules engine reads grid + biases → produces next grid state
Audio layer reads next grid → schedules Tone.js notes
Renderer reads next grid → draws Canvas frame
Zustand store updated with next grid + conductor state
```

## Cell Model

```typescript
type Cell = {
  note: number;    // MIDI note as float (integer part = semitone, fractional = pitch gravity drift)
  energy: number;  // 0-1, maps to volume
  age: number;     // ticks alive
}
```

For harmony calculations and audio playback, `Math.round(cell.note)` is used. The fractional component accumulates pitch gravity drift between semitones.

**Initial energy values:**
- User-placed cells: `PLACED_ENERGY` (default 1.0)
- Born cells: `BIRTH_ENERGY` (default 0.7)

Grid is a flat array of `Cell | null`, size `GRID_SIZE x GRID_SIZE` (default 48x48). Neighbor lookups use Moore neighborhood (8 surrounding cells).

## Simulation Rules

### Survival

Each living cell scores harmonic support from living neighbors. The interval between two cells is `abs(noteA - noteB) % 12`. Each neighbor contributes a score based on the interval:

| Interval (semitones) | Name | Score |
|---|---|---|
| 0 | Unison | +1.0 |
| 7 | Perfect fifth | +0.8 |
| 5 | Perfect fourth | +0.6 |
| 4 | Major third | +0.5 |
| 3 | Minor third | +0.4 |
| 9 | Major sixth | +0.3 |
| 8 | Minor sixth | +0.3 |
| 2 | Major 2nd | 0.0 |
| 10 | Minor 7th | -0.2 |
| 6 | Tritone | -0.5 |
| 1 | Minor 2nd | -0.6 |
| 11 | Major 7th | -0.6 |

Scores are **summed** across all living neighbors. Cell survives if `harmonicScore >= CONSONANCE_THRESHOLD` (default 0.5). The conductor adjusts this threshold for density management. All score values are tunable.

### Birth

A dead cell with 2+ living neighbors may be born. The birth note is chosen by chord completion:

1. Collect the pitch classes (mod 12) of living neighbors.
2. Match against a set of recognized chord templates (triads only for v1): major `[0,4,7]`, minor `[0,3,7]`, diminished `[0,3,6]`, augmented `[0,4,8]`, sus2 `[0,2,7]`, sus4 `[0,5,7]`. Templates are matched in any rotation/inversion.
3. For each template that partially matches the neighbor pitch classes (2 of 3 notes present), the missing note is a candidate.
4. Candidates are filtered to the current conductor key/scale. If multiple remain, prefer the one with the highest harmonic score against the neighbors. If none remain, no birth occurs.
5. The born cell's octave is set to the average octave of its living neighbors (rounded to nearest MIDI note in the chosen pitch class).

Initial energy of a born cell: `BIRTH_ENERGY` (default 0.7).

### Pitch Gravity

Pitch gravity operates on the full MIDI note (not just pitch class). Each tick, compute the weighted average MIDI note of consonant neighbors (weighted by their harmonic score). The cell's internal note is stored as a float. Each tick: `note += (target - note) * PITCH_GRAVITY_STRENGTH`. The note is rounded to the nearest integer for audio playback and harmony calculations. Drift is constrained to the current scale — if rounding would produce an out-of-scale note, snap to the nearest in-scale note instead. Creates emergent key centers as clusters "agree" on a tonal center.

### Energy Dynamics

- Decays by `ENERGY_DECAY_PER_TICK` (0.02) each tick
- Consonant neighbors restore `CONSONANCE_ENERGY_RESTORE` (0.05) per consonant neighbor
- Cell dies when energy reaches 0
- Low-energy cells skip ticks: energy < 0.5 plays every 2nd tick, energy < 0.25 plays every 4th tick — natural rhythm emerges

### Volume Balancing

Audible volume per cell: `energy / sqrt(local_density)` where `local_density` is the count of living cells in the Moore neighborhood. Dense clusters become soft pads; isolated cells ring out as leads.

## Conductor (Global Layer)

Reads aggregate grid state each tick, outputs biases. Never directly mutates cells.

### Global Energy Curve

Arc shape over `ARC_DURATION_TICKS` (default 200), defined as three phases:
- **Rise** (0–20% of ticks): sine ease-in from 0 to 1.0
- **Plateau** (20–70% of ticks): holds at 1.0
- **Fall** (70–100% of ticks): exponential decay from 1.0 toward 0, formula: `e^(-5 * t)` where t is 0→1 over the fall phase

The curve multiplier is applied **after** energy decay and consonance restore: `cell.energy = min(1, (cell.energy - decay + restore)) * curveMultiplier`. When the curve multiplier reaches < 0.01, all remaining cells die simultaneously and the piece ends.

### Key Tracking

Tracks the dominant pitch class on the grid (most common note mod 12). Biases new births toward this key. With probability `KEY_CHANGE_PROBABILITY` (0.005) per tick, shifts the key — cells gradually re-harmonize through normal pitch gravity. A key change does NOT reset the chord progression — the progression continues in the new key.

### Chord Progression

Follows a loose progression (default: I → IV → V → I). Advances when grid tension resolves — specifically, when the ratio of total positive harmonic scores to total negative harmonic scores exceeds 3:1 for at least 5 consecutive ticks. Not on a fixed timer. Biases which birth notes are favored: birth candidates that belong to the current chord degree are scored 2x higher. The chord progression is subordinate to key tracking — birth notes must be in the current key, and the progression biases within that constraint.

### Density Management

Targets `DENSITY_TARGET` (0.15 = ~15% of cells alive). If density exceeds target, raises survival threshold. If below, lowers it. Prevents total death or overwhelming noise.

## Audio Design

### Synthesis

- Tone.js `PolySynth` with warm pad preset (slow attack, long release)
- Future optional layers: plucky lead for high-energy isolated cells, sub bass for low sustained notes

### Effects Chain

- Global reverb: mix inversely proportional to density (sparse = spacious, dense = intimate)
- Global delay: same density relationship
- Default reverb mix: 0.4, tempo: 80 BPM

### Scheduling

Each tick, collect all living cells that should play this tick (based on energy-driven rhythm skipping). Schedule notes via Tone.js transport. One tick = one rhythmic subdivision.

## Visual Design

- Dark background (near-black)
- Cells as glowing circles, color-mapped to pitch (chromatic rainbow palette)
- Size and brightness mapped to energy
- Faint particle effects on birth/death events
- Subtle lines between harmonically bonded neighbors
- All visual features toggleable via config

## UI & Interaction

### Setup Phase

- Paint notes onto grid from a scale-locked palette (default: C major pentatonic)
- Preset brushes: chord cluster, scattered melody, bass drone, random spray
- Choose root key and scale
- Choose mood/tempo preset (slow ambient, medium flow, upbeat pulse)

### During Playback

- Drop seed clusters of new notes
- Place silence bombs to clear regions (radius: 3 cells, instant death — killed cells cannot be reborn for 3 ticks)
- Shift root key manually (force modulation)
- Adjust consonance strictness slider
- Pause / resume

### Post-Playback

- Piece ends naturally via global energy curve
- Option to save/share initial seed for deterministic replay (stretch goal)

## Tech Stack

- **Framework:** Next.js 14+ (App Router) on Vercel
- **Language:** TypeScript
- **Rendering:** HTML Canvas
- **Audio:** Tone.js
- **State:** Zustand
- **Styling:** Tailwind CSS

## Project Structure

```
src/
  app/
    page.tsx              # Main app — mounts canvas + controls
    layout.tsx            # Root layout, fonts, metadata
    globals.css           # Theme, CSS variables
  engine/
    config.ts             # All tunable constants
    grid.ts               # Grid data structure, neighbor lookups
    cell.ts               # Cell type + helpers
    rules.ts              # Automata rules (survive, birth, death)
    harmony.ts            # Interval scoring, consonance math
    conductor.ts          # Global conductor state + logic
  audio/
    synth.ts              # Tone.js setup, note triggering
    mix.ts                # Volume balancing, effects chain
  canvas/
    renderer.ts           # Canvas drawing: cells, connections, effects
    particles.ts          # Birth/death particle effects
  ui/
    ControlPanel.tsx      # Setup + playback controls
    NotePalette.tsx       # Note painting tools
    SettingsDrawer.tsx    # Advanced tuning sliders
  hooks/
    useSimulation.ts      # Tick loop, play/pause, speed control
    useAudio.ts           # Audio context init, mute, volume
```

## Configuration

All tunable constants centralized in `engine/config.ts`:

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
  VOLUME_DENSITY_DIVISOR: 'sqrt',
  GLOBAL_ENERGY_CURVE: 'arc',
  ARC_DURATION_TICKS: 200,
  KEY_CHANGE_PROBABILITY: 0.005,
  PROGRESSION: ['I', 'IV', 'V', 'I'],
  DENSITY_TARGET: 0.15,
  SYNTH_TYPE: 'pad',
  REVERB_MIX: 0.4,
  TEMPO_BPM: 80,
  CELL_GLOW: true,
  HARMONIC_CONNECTIONS: true,
  PARTICLE_EFFECTS: true,
}
```

## Tuning Workflow

`TUNING.md` at project root for iterative feedback. Listen → note issues → update TUNING.md → adjust config/rules → repeat.

## Build Order

1. Grid + Canvas rendering — clickable grid, place colored cells, no audio
2. Basic automata rules — cells live/die based on consonance scoring
3. Audio hookup — living cells play notes via Tone.js each tick
4. Volume balancing — density-based volume
5. Pitch gravity — cells drift, clusters form
6. Chord-completion births — system "wants" to make music
7. Global conductor — energy arc, key tracking, progression
8. Visual polish — glow, particles, harmonic connections
9. UI polish — control panel, presets, share/export
10. Tuning — iterate with TUNING.md

## Repo & Deployment

- **GitHub:** `harmonic-life` (public) under Timothy-Cao
- **Vercel:** Connected via CLI, auto-deploys from main branch
