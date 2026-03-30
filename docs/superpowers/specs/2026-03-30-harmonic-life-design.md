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
  note: number;    // MIDI note number (0-127)
  energy: number;  // 0-1, maps to volume
  age: number;     // ticks alive
}
```

Grid is a flat array of `Cell | null`, size `GRID_SIZE x GRID_SIZE` (default 48x48). Neighbor lookups use Moore neighborhood (8 surrounding cells).

## Simulation Rules

### Survival

Each living cell scores harmonic support from living neighbors:

- **Consonant intervals** (positive score): unison, octave, perfect fifth, major third, minor third, perfect fourth
- **Dissonant intervals** (negative score): minor 2nd, major 7th, tritone

Cell survives if `harmonicScore >= CONSONANCE_THRESHOLD`. The conductor adjusts this threshold for density management.

### Birth

A dead cell with 2+ living neighbors may be born. The birth note is chosen as the pitch (from the current key/scale) that best completes a chord implied by the neighbors. If no good chord completion exists, no birth occurs.

### Pitch Gravity

Each tick, a living cell's note drifts toward the weighted average pitch class of its consonant neighbors. Drift rate controlled by `PITCH_GRAVITY_STRENGTH` (default 0.1). Creates emergent key centers as clusters "agree" on a tonal center.

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

Arc shape (rise → plateau → fall) over `ARC_DURATION_TICKS` (default 200). Multiplies all cell energy. The piece concludes naturally when the curve decays to zero.

### Key Tracking

Tracks the dominant pitch class on the grid (most common note mod 12). Biases new births toward this key. With probability `KEY_CHANGE_PROBABILITY` (0.005) per tick, shifts the key — cells gradually re-harmonize through normal pitch gravity.

### Chord Progression

Follows a loose progression (default: I → IV → V → I). Advances when grid tension resolves (measured by ratio of consonant to dissonant intervals), not on a fixed timer. Biases which birth notes are favored during each phase.

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
- Place silence bombs to clear regions
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
