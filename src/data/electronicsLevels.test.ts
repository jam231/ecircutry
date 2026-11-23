import { describe, expect, it } from 'vitest';
import { ADULT_LEVELS, KID_MISSIONS } from './electronicsLevels';
import { solveCircuit } from '../engine/circuitSolver';
import type { CircuitBoardState, LevelDefinition } from '../engine/types';

function makeBoard(level: LevelDefinition): CircuitBoardState {
  return {
    cols: level.cols,
    rows: level.rows,
    components: level.initialComponents.map((c) => ({ ...c, a: { ...c.a }, b: { ...c.b } })),
    wires: level.initialWires.map((w) => ({ ...w, a: { ...w.a }, b: { ...w.b } })),
  };
}

describe('electronicsLevels solvability verification', () => {
  it('Adult Lab 1 (First Spark) solves with 100Ω resistor in series', () => {
    const lvl = ADULT_LEVELS[0];
    const b = makeBoard(lvl);
    b.components.push({ id: 'r1', kind: 'resistor', resistance: 100, a: { col: 2, row: 1 }, b: { col: 3, row: 1 } });
    b.wires.push(
      { id: 'w1', a: { col: 1, row: 1 }, b: { col: 2, row: 1 }, color: 'red' },
      { id: 'w2', a: { col: 3, row: 1 }, b: { col: 4, row: 1 }, color: 'red' },
      { id: 'w3', a: { col: 4, row: 2 }, b: { col: 1, row: 2 }, color: 'black' }
    );
    const res = lvl.evaluate(b, solveCircuit(b), { flags: {}, burnoutCount: 0 });
    expect(res.solved).toBe(true);
  });

  it('Adult Lab 2 (Dont Pop the Bulb) solves with 330Ω and fails with 47Ω or 10kΩ', () => {
    const lvl = ADULT_LEVELS[1];
    const tryR = (r: number) => {
      const b = makeBoard(lvl);
      b.components.push({ id: 'r1', kind: 'resistor', resistance: r, a: { col: 2, row: 1 }, b: { col: 3, row: 1 } });
      b.wires.push(
        { id: 'w1', a: { col: 1, row: 1 }, b: { col: 2, row: 1 }, color: 'red' },
        { id: 'w2', a: { col: 3, row: 1 }, b: { col: 4, row: 1 }, color: 'red' },
        { id: 'w3', a: { col: 4, row: 2 }, b: { col: 1, row: 2 }, color: 'black' }
      );
      return lvl.evaluate(b, solveCircuit(b), { flags: {}, burnoutCount: 0 }).solved;
    };
    expect(tryR(47)).toBe(false);
    expect(tryR(10000)).toBe(false);
    expect(tryR(330)).toBe(true);
  });

  it('Adult Lab 7 (Two-Key Safety Lock) solves with two series switches closed', () => {
    const lvl = ADULT_LEVELS[6];
    const b = makeBoard(lvl);
    b.components.push(
      { id: 's1', kind: 'switch_toggle', closed: true, a: { col: 2, row: 1 }, b: { col: 3, row: 1 } },
      { id: 's2', kind: 'switch_toggle', closed: true, a: { col: 3, row: 1 }, b: { col: 4, row: 1 } }
    );
    b.wires.push(
      { id: 'w1', a: { col: 1, row: 1 }, b: { col: 2, row: 1 }, color: 'red' },
      { id: 'w2', a: { col: 4, row: 1 }, b: { col: 5, row: 1 }, color: 'red' },
      { id: 'w3', a: { col: 5, row: 3 }, b: { col: 1, row: 3 }, color: 'black' }
    );
    const res = lvl.evaluate(b, solveCircuit(b), { flags: {}, burnoutCount: 0 });
    expect(res.solved).toBe(true);
  });

  it('Adult Lab 8 (Workshop Station) solves with independent parallel switched fan and push-button buzzer', () => {
    const lvl = ADULT_LEVELS[7];
    const b = makeBoard(lvl);
    b.components.push(
      { id: 'sw', kind: 'switch_toggle', closed: true, a: { col: 3, row: 1 }, b: { col: 3, row: 2 } },
      { id: 'btn', kind: 'switch_push', closed: false, a: { col: 5, row: 1 }, b: { col: 5, row: 2 } }
    );
    b.wires.push(
      { id: 'w1', a: { col: 1, row: 1 }, b: { col: 3, row: 1 }, color: 'red' },
      { id: 'w2', a: { col: 3, row: 1 }, b: { col: 5, row: 1 }, color: 'red' },
      { id: 'w3', a: { col: 3, row: 3 }, b: { col: 1, row: 3 }, color: 'black' },
      { id: 'w4', a: { col: 5, row: 3 }, b: { col: 3, row: 3 }, color: 'black' }
    );
    const res = lvl.evaluate(b, solveCircuit(b), { flags: {}, burnoutCount: 0 });
    expect(res.solved).toBe(true);
  });

  it('Kid Mission 1 (Light Up!) solves by connecting the two guided wires', () => {
    const lvl = KID_MISSIONS[0];
    const b = makeBoard(lvl);
    b.wires.push(
      { id: 'w1', a: { col: 1, row: 1 }, b: { col: 2, row: 1 }, color: 'red' },
      { id: 'w2', a: { col: 3, row: 2 }, b: { col: 1, row: 2 }, color: 'black' }
    );
    const res = lvl.evaluate(b, solveCircuit(b), { flags: {}, burnoutCount: 0 });
    expect(res.solved).toBe(true);
  });
});
