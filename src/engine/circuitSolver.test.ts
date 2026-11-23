import { describe, expect, it } from 'vitest';
import { solveCircuit } from './circuitSolver';
import type { CircuitBoardState } from './types';

describe('solveCircuit (Real DC MNA Physics Engine)', () => {
  it('computes accurate Ohm law current for 9V battery + 330Ω resistor + Red LED', () => {
    const board: CircuitBoardState = {
      cols: 6,
      rows: 4,
      components: [
        { id: 'bat', kind: 'battery', voltage: 9, a: { col: 0, row: 0 }, b: { col: 0, row: 1 } },
        { id: 'res', kind: 'resistor', resistance: 330, a: { col: 1, row: 0 }, b: { col: 2, row: 0 } },
        { id: 'led', kind: 'led', ledColor: 'red', a: { col: 2, row: 0 }, b: { col: 2, row: 1 } },
      ],
      wires: [
        { id: 'w1', a: { col: 0, row: 0 }, b: { col: 1, row: 0 }, color: 'red' },
        { id: 'w2', a: { col: 2, row: 1 }, b: { col: 0, row: 1 }, color: 'black' },
      ],
    };

    const res = solveCircuit(board);
    const ledState = res.componentStates['led'];
    expect(res.shortCircuit).toBe(false);
    expect(ledState.active).toBe(true);
    expect(ledState.overloaded).toBe(false);
    // Expected: (9 - 2) / (1 + 330 + 15 + 0.04) ≈ 20.23mA
    expect(ledState.current).toBeGreaterThan(0.019);
    expect(ledState.current).toBeLessThan(0.0215);
  });

  it('blocks current and flags reverseBiased when an LED is placed backwards', () => {
    const board: CircuitBoardState = {
      cols: 6,
      rows: 4,
      components: [
        { id: 'bat', kind: 'battery', voltage: 3, a: { col: 0, row: 0 }, b: { col: 0, row: 1 } },
        { id: 'res', kind: 'resistor', resistance: 100, a: { col: 0, row: 0 }, b: { col: 1, row: 0 } },
        // Cathode (b) connected to + side, Anode (a) connected to - side
        { id: 'led', kind: 'led', ledColor: 'red', a: { col: 1, row: 1 }, b: { col: 1, row: 0 } },
      ],
      wires: [{ id: 'w1', a: { col: 1, row: 1 }, b: { col: 0, row: 1 }, color: 'black' }],
    };

    const res = solveCircuit(board);
    const ledState = res.componentStates['led'];
    expect(ledState.active).toBe(false);
    expect(ledState.reverseBiased).toBe(true);
    expect(Math.abs(ledState.current)).toBeLessThan(0.0001);
  });

  it('flags LED overload when connected directly to 9V without a resistor', () => {
    const board: CircuitBoardState = {
      cols: 4,
      rows: 3,
      components: [
        { id: 'bat', kind: 'battery', voltage: 9, a: { col: 0, row: 0 }, b: { col: 0, row: 1 } },
        { id: 'led', kind: 'led', ledColor: 'red', a: { col: 1, row: 0 }, b: { col: 1, row: 1 } },
      ],
      wires: [
        { id: 'w1', a: { col: 0, row: 0 }, b: { col: 1, row: 0 }, color: 'red' },
        { id: 'w2', a: { col: 1, row: 1 }, b: { col: 0, row: 1 }, color: 'black' },
      ],
    };

    const res = solveCircuit(board);
    expect(res.componentStates['led'].overloaded).toBe(true);
    expect(res.componentStates['led'].current).toBeGreaterThan(0.1);
  });

  it('proves 3V cannot light Red+Green LEDs in series, but lights both in parallel', () => {
    const seriesBoard: CircuitBoardState = {
      cols: 5,
      rows: 3,
      components: [
        { id: 'bat', kind: 'battery', voltage: 3, a: { col: 0, row: 0 }, b: { col: 0, row: 1 } },
        { id: 'r1', kind: 'resistor', resistance: 47, a: { col: 0, row: 0 }, b: { col: 1, row: 0 } },
        { id: 'led1', kind: 'led', ledColor: 'red', a: { col: 1, row: 0 }, b: { col: 2, row: 0 } },
        { id: 'led2', kind: 'led', ledColor: 'green', a: { col: 2, row: 0 }, b: { col: 2, row: 1 } },
      ],
      wires: [{ id: 'w1', a: { col: 2, row: 1 }, b: { col: 0, row: 1 }, color: 'black' }],
    };

    const seriesRes = solveCircuit(seriesBoard);
    expect(seriesRes.componentStates['led1'].active).toBe(false);
    expect(seriesRes.componentStates['led2'].active).toBe(false);

    const parallelBoard: CircuitBoardState = {
      cols: 5,
      rows: 3,
      components: [
        { id: 'bat', kind: 'battery', voltage: 3, a: { col: 0, row: 0 }, b: { col: 0, row: 2 } },
        { id: 'r1', kind: 'resistor', resistance: 47, a: { col: 1, row: 0 }, b: { col: 1, row: 1 } },
        { id: 'led1', kind: 'led', ledColor: 'red', a: { col: 1, row: 1 }, b: { col: 1, row: 2 } },
        { id: 'r2', kind: 'resistor', resistance: 47, a: { col: 2, row: 0 }, b: { col: 2, row: 1 } },
        { id: 'led2', kind: 'led', ledColor: 'green', a: { col: 2, row: 1 }, b: { col: 2, row: 2 } },
      ],
      wires: [
        { id: 'w1', a: { col: 0, row: 0 }, b: { col: 1, row: 0 }, color: 'red' },
        { id: 'w2', a: { col: 1, row: 0 }, b: { col: 2, row: 0 }, color: 'red' },
        { id: 'w3', a: { col: 1, row: 2 }, b: { col: 0, row: 2 }, color: 'black' },
        { id: 'w4', a: { col: 2, row: 2 }, b: { col: 1, row: 2 }, color: 'black' },
      ],
    };

    const parallelRes = solveCircuit(parallelBoard);
    expect(parallelRes.componentStates['led1'].active).toBe(true);
    expect(parallelRes.componentStates['led2'].active).toBe(true);
    expect(parallelRes.componentStates['led1'].overloaded).toBe(false);
    expect(parallelRes.componentStates['led2'].overloaded).toBe(false);
  });

  it('handles dead short circuits cleanly without NaN and flags shortCircuit', () => {
    const board: CircuitBoardState = {
      cols: 3,
      rows: 2,
      components: [
        { id: 'bat', kind: 'battery', voltage: 9, a: { col: 0, row: 0 }, b: { col: 0, row: 1 } },
      ],
      wires: [{ id: 'w1', a: { col: 0, row: 0 }, b: { col: 0, row: 1 }, color: 'red' }],
    };

    const res = solveCircuit(board);
    expect(res.shortCircuit).toBe(true);
    expect(Number.isFinite(res.wireStates['w1'].current)).toBe(true);
    expect(Math.abs(res.wireStates['w1'].current)).toBeGreaterThan(5);
  });

  it('reverses motor spin direction when battery polarity is flipped', () => {
    const makeBoard = (flip: boolean): CircuitBoardState => ({
      cols: 3,
      rows: 2,
      components: [
        {
          id: 'bat',
          kind: 'battery',
          voltage: 6,
          a: flip ? { col: 0, row: 1 } : { col: 0, row: 0 },
          b: flip ? { col: 0, row: 0 } : { col: 0, row: 1 },
        },
        { id: 'mot', kind: 'motor', a: { col: 1, row: 0 }, b: { col: 1, row: 1 } },
      ],
      wires: [
        { id: 'w1', a: { col: 0, row: 0 }, b: { col: 1, row: 0 }, color: 'red' },
        { id: 'w2', a: { col: 1, row: 1 }, b: { col: 0, row: 1 }, color: 'black' },
      ],
    });

    const cw = solveCircuit(makeBoard(false)).componentStates['mot'].motorSpeed;
    const ccw = solveCircuit(makeBoard(true)).componentStates['mot'].motorSpeed;
    expect(cw).toBeGreaterThan(0.5);
    expect(ccw).toBeLessThan(-0.5);
  });
});
