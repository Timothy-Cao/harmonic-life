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
