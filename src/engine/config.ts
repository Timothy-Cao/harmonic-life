// src/engine/config.ts
// The few global knobs left after the simplification.

export const CONFIG = {
  GRID_SIZE: 32,
  BPM: 110,
  // Conway tick rate, in 16th-note steps. 4 = once per beat.
  CONWAY_STEPS_PER_TICK: 4,
  // Max simultaneous notes per playhead column (keeps dense grids from sounding like mud).
  MAX_NOTES_PER_COLUMN: 4,
  ROOT_KEY: 0, // 0 = C
}
