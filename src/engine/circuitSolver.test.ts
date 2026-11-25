import { describe, expect, it } from 'vitest';
import { solveCircuit, stepTransientCircuit } from './circuitSolver';
import { type CircuitBoardState, createTransientMemory } from './types';

describe('solveCircuit & stepTransientCircuit (Tier 1–4 Real Physics)', () => {
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
        { id: 'led', kind: 'led', ledColor: 'red', a: { col: 1, row: 1 }, b: { col: 1, row: 0 } },
      ],
      wires: [{ id: 'w1', a: { col: 1, row: 1 }, b: { col: 0, row: 1 }, color: 'black' }],
    };

    const res = solveCircuit(board);
    expect(res.componentStates['led'].active).toBe(false);
    expect(res.componentStates['led'].reverseBiased).toBe(true);
  });

  it('flags LED overload and produces localized Polish diagnostics when lang is pl', () => {
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

    const resPl = solveCircuit(board, 'pl');
    expect(resPl.componentStates['led'].overloaded).toBe(true);
    expect(resPl.diagnostics[0]?.title).toContain('przeciążona');
  });

  it('computes exact 4.5V voltage divider and flags 0.25W resistor wattage overload', () => {
    const divBoard: CircuitBoardState = {
      cols: 4,
      rows: 3,
      components: [
        { id: 'bat', kind: 'battery', voltage: 9, a: { col: 0, row: 0 }, b: { col: 0, row: 2 } },
        { id: 'r1', kind: 'resistor', resistance: 1000, a: { col: 1, row: 0 }, b: { col: 1, row: 1 } },
        { id: 'r2', kind: 'resistor', resistance: 1000, a: { col: 1, row: 1 }, b: { col: 1, row: 2 } },
      ],
      wires: [
        { id: 'w1', a: { col: 0, row: 0 }, b: { col: 1, row: 0 }, color: 'red' },
        { id: 'w2', a: { col: 1, row: 2 }, b: { col: 0, row: 2 }, color: 'black' },
      ],
    };
    const divRes = solveCircuit(divBoard);
    expect(divRes.nodeVoltages['1,1']).toBeCloseTo(4.5, 1);

    // 9V across 100Ω = 0.81W > 0.25W limit!
    const hotBoard: CircuitBoardState = {
      cols: 3,
      rows: 2,
      components: [
        { id: 'bat', kind: 'battery', voltage: 9, a: { col: 0, row: 0 }, b: { col: 0, row: 1 } },
        { id: 'rHot', kind: 'resistor', resistance: 100, maxPower: 0.25, a: { col: 1, row: 0 }, b: { col: 1, row: 1 } },
      ],
      wires: [
        { id: 'w1', a: { col: 0, row: 0 }, b: { col: 1, row: 0 }, color: 'red' },
        { id: 'w2', a: { col: 1, row: 1 }, b: { col: 0, row: 1 }, color: 'black' },
      ],
    };
    const hotRes = solveCircuit(hotBoard);
    expect(hotRes.componentStates['rHot'].overloaded).toBe(true);
    expect(hotRes.componentStates['rHot'].power).toBeGreaterThan(0.75);
  });

  it('routes 3-pin SPDT switches accurately for a 3-way hallway XOR light', () => {
    const makeHallway = (s1Closed: boolean, s2Closed: boolean): CircuitBoardState => ({
      cols: 6,
      rows: 4,
      components: [
        { id: 'bat', kind: 'battery', voltage: 3, a: { col: 0, row: 1 }, b: { col: 0, row: 2 } },
        {
          id: 's1',
          kind: 'switch_spdt',
          closed: s1Closed,
          a: { col: 2, row: 0 },
          c: { col: 2, row: 1 },
          b: { col: 2, row: 2 },
        },
        {
          id: 's2',
          kind: 'switch_spdt',
          closed: s2Closed,
          a: { col: 4, row: 0 },
          c: { col: 4, row: 1 },
          b: { col: 4, row: 2 },
        },
        { id: 'r1', kind: 'resistor', resistance: 100, a: { col: 4, row: 1 }, b: { col: 5, row: 1 } },
        { id: 'led', kind: 'led', ledColor: 'amber', a: { col: 5, row: 1 }, b: { col: 5, row: 2 } },
      ],
      wires: [
        { id: 'w1', a: { col: 0, row: 1 }, b: { col: 2, row: 1 }, color: 'red' },
        { id: 'wTop', a: { col: 2, row: 0 }, b: { col: 4, row: 0 }, color: 'blue' },
        { id: 'wBot', a: { col: 2, row: 2 }, b: { col: 4, row: 2 }, color: 'amber' },
        { id: 'wGnd', a: { col: 5, row: 2 }, b: { col: 0, row: 2 }, color: 'black' },
      ],
    });

    expect(solveCircuit(makeHallway(false, false)).componentStates['led'].active).toBe(true);
    expect(solveCircuit(makeHallway(true, false)).componentStates['led'].active).toBe(false);
    expect(solveCircuit(makeHallway(false, true)).componentStates['led'].active).toBe(false);
    expect(solveCircuit(makeHallway(true, true)).componentStates['led'].active).toBe(true);
  });

  it('models Ebers-Moll NPN BJT cutoff, current amplification, saturation, and RTL NOT gate', () => {
    // NPN driving DC motor with 10kΩ base resistor: tiny Ib (~0.5mA) switches >50mA collector current!
    const makeAmp = (swClosed: boolean): CircuitBoardState => ({
      cols: 6,
      rows: 4,
      components: [
        { id: 'bat', kind: 'battery', voltage: 6, a: { col: 0, row: 0 }, b: { col: 0, row: 3 } },
        { id: 'sw', kind: 'switch_toggle', closed: swClosed, a: { col: 1, row: 1 }, b: { col: 2, row: 1 } },
        { id: 'rb', kind: 'resistor', resistance: 2200, a: { col: 2, row: 1 }, b: { col: 3, row: 1 } },
        {
          id: 'q1',
          kind: 'transistor_npn',
          a: { col: 4, row: 0 }, // Collector
          c: { col: 4, row: 1 }, // Base
          b: { col: 4, row: 2 }, // Emitter
        },
        { id: 'mot', kind: 'motor', a: { col: 3, row: 0 }, b: { col: 4, row: 0 } },
      ],
      wires: [
        { id: 'w1', a: { col: 0, row: 0 }, b: { col: 3, row: 0 }, color: 'red' },
        { id: 'w2', a: { col: 0, row: 0 }, b: { col: 1, row: 1 }, color: 'red' },
        { id: 'w3', a: { col: 3, row: 1 }, b: { col: 4, row: 1 }, color: 'blue' },
        { id: 'w4', a: { col: 4, row: 2 }, b: { col: 0, row: 3 }, color: 'black' },
      ],
    });

    const offRes = solveCircuit(makeAmp(false));
    expect(offRes.componentStates['mot'].active).toBe(false);
    expect(offRes.componentStates['q1'].active).toBe(false);

    const onRes = solveCircuit(makeAmp(true));
    expect(onRes.componentStates['mot'].active).toBe(true);
    expect(onRes.componentStates['q1'].active).toBe(true);
    expect(onRes.componentStates['q1'].baseCurrent ?? 0).toBeLessThan(0.004);
    expect(onRes.componentStates['q1'].current).toBeGreaterThan(0.15);
  });

  it('simulates RC exponential charging hitting 63.2% at tau = R * C', () => {
    // R = 1000Ω, C = 1000µF => tau = 1.0s
    const board: CircuitBoardState = {
      cols: 4,
      rows: 3,
      components: [
        { id: 'bat', kind: 'battery', voltage: 9, a: { col: 0, row: 0 }, b: { col: 0, row: 1 } },
        { id: 'r1', kind: 'resistor', resistance: 1000, a: { col: 1, row: 0 }, b: { col: 2, row: 0 } },
        { id: 'c1', kind: 'capacitor', capacitance: 1000e-6, a: { col: 2, row: 0 }, b: { col: 2, row: 1 } },
      ],
      wires: [
        { id: 'w1', a: { col: 0, row: 0 }, b: { col: 1, row: 0 }, color: 'red' },
        { id: 'w2', a: { col: 2, row: 1 }, b: { col: 0, row: 1 }, color: 'black' },
      ],
    };

    const mem = createTransientMemory();
    const dt = 0.01;
    let res = solveCircuit(board);
    for (let i = 0; i < 100; i++) {
      res = stepTransientCircuit(board, mem, dt);
    }
    // 100 steps * 0.01s = 1.0s = 1*tau => Vc ≈ 9 * 0.632 = 5.69V
    const vc = res.componentStates['c1'].voltageDrop;
    expect(vc).toBeGreaterThan(5.4);
    expect(vc).toBeLessThan(5.95);
  });

  it('self-starts and oscillates a 2-NPN astable multivibrator blinker', () => {
    // Classic 2-NPN cross-coupled astable multivibrator:
    // Vcc = 6V, Rc1=Rc2=330Ω, Rb1=Rb2=10kΩ, C1=C2=47µF => period ≈ 1.4*R*C ≈ 0.66s
    const board: CircuitBoardState = {
      cols: 7,
      rows: 5,
      components: [
        { id: 'bat', kind: 'battery', voltage: 6, a: { col: 0, row: 0 }, b: { col: 0, row: 4 } },
        // Left branch
        { id: 'rc1', kind: 'resistor', resistance: 330, a: { col: 1, row: 0 }, b: { col: 1, row: 1 } },
        { id: 'rb1', kind: 'resistor', resistance: 10000, a: { col: 2, row: 0 }, b: { col: 2, row: 2 } },
        { id: 'q1', kind: 'transistor_npn', a: { col: 1, row: 1 }, c: { col: 1, row: 2 }, b: { col: 1, row: 3 } },
        // Right branch
        { id: 'rc2', kind: 'resistor', resistance: 330, a: { col: 5, row: 0 }, b: { col: 5, row: 1 } },
        { id: 'rb2', kind: 'resistor', resistance: 10000, a: { col: 4, row: 0 }, b: { col: 4, row: 2 } },
        { id: 'q2', kind: 'transistor_npn', a: { col: 5, row: 1 }, c: { col: 5, row: 2 }, b: { col: 5, row: 3 } },
        // Cross-coupling capacitors: C1 connects Q1 Collector (1,1) to Q2 Base (4,2); C2 connects Q2 Collector (5,1) to Q1 Base (2,2)
        { id: 'c1', kind: 'capacitor', capacitance: 47e-6, a: { col: 1, row: 1 }, b: { col: 3, row: 1 } },
        { id: 'c2', kind: 'capacitor', capacitance: 47e-6, a: { col: 5, row: 1 }, b: { col: 3, row: 2 } },
      ],
      wires: [
        { id: 'v1', a: { col: 0, row: 0 }, b: { col: 1, row: 0 }, color: 'red' },
        { id: 'v2', a: { col: 1, row: 0 }, b: { col: 2, row: 0 }, color: 'red' },
        { id: 'v3', a: { col: 2, row: 0 }, b: { col: 4, row: 0 }, color: 'red' },
        { id: 'v4', a: { col: 4, row: 0 }, b: { col: 5, row: 0 }, color: 'red' },
        { id: 'g1', a: { col: 1, row: 3 }, b: { col: 0, row: 4 }, color: 'black' },
        { id: 'g2', a: { col: 5, row: 3 }, b: { col: 0, row: 4 }, color: 'black' },
        // Cross wires
        { id: 'x1', a: { col: 3, row: 1 }, b: { col: 4, row: 2 }, color: 'blue' },
        { id: 'x2', a: { col: 4, row: 2 }, b: { col: 5, row: 2 }, color: 'blue' },
        { id: 'x3', a: { col: 3, row: 2 }, b: { col: 2, row: 2 }, color: 'amber' },
        { id: 'x4', a: { col: 2, row: 2 }, b: { col: 1, row: 2 }, color: 'amber' },
      ],
    };

    const mem = createTransientMemory();
    let highSeen = false;
    let lowSeen = false;
    let transitions = 0;
    let lastHigh: boolean | null = null;

    for (let i = 0; i < 450; i++) {
      const res = stepTransientCircuit(board, mem, 0.005);
      const vc1 = res.nodeVoltages['1,1'] ?? 0;
      if (vc1 > 4.0) highSeen = true;
      if (vc1 < 1.5) lowSeen = true;
      const isHigh = vc1 > 3.0;
      if (lastHigh !== null && isHigh !== lastHigh) transitions += 1;
      lastHigh = isHigh;
    }

    expect(highSeen).toBe(true);
    expect(lowSeen).toBe(true);
    expect(transitions).toBeGreaterThanOrEqual(3);
  });

  it('produces an inductive flyback spike on switch-off and clamps it with a reverse flyback diode', () => {
    const buildInductorBoard = (swClosed: boolean, withDiode: boolean): CircuitBoardState => ({
      cols: 5,
      rows: 3,
      components: [
        { id: 'bat', kind: 'battery', voltage: 6, a: { col: 0, row: 0 }, b: { col: 0, row: 2 } },
        { id: 'sw', kind: 'switch_toggle', closed: swClosed, a: { col: 1, row: 0 }, b: { col: 2, row: 0 } },
        { id: 'r1', kind: 'resistor', resistance: 22, a: { col: 2, row: 0 }, b: { col: 3, row: 0 } },
        { id: 'l1', kind: 'inductor', inductance: 0.5, a: { col: 3, row: 0 }, b: { col: 3, row: 2 } },
        ...(withDiode
          ? [
              {
                id: 'd1',
                kind: 'diode' as const,
                // Reverse-parallel: Anode at bottom (3,2), Cathode at top (3,0)
                a: { col: 4, row: 2 },
                b: { col: 4, row: 0 },
              },
            ]
          : []),
      ],
      wires: [
        { id: 'w1', a: { col: 0, row: 0 }, b: { col: 1, row: 0 }, color: 'red' },
        { id: 'w2', a: { col: 3, row: 2 }, b: { col: 0, row: 2 }, color: 'black' },
        ...(withDiode
          ? [
              { id: 'wd1', a: { col: 3, row: 0 }, b: { col: 4, row: 0 }, color: 'blue' as const },
              { id: 'wd2', a: { col: 3, row: 2 }, b: { col: 4, row: 2 }, color: 'black' as const },
            ]
          : []),
      ],
    });

    // Without flyback diode: energize then open switch -> big kickback spike!
    const memNoDiode = createTransientMemory();
    for (let i = 0; i < 60; i++) {
      stepTransientCircuit(buildInductorBoard(true, false), memNoDiode, 0.005);
    }
    const spikeRes = stepTransientCircuit(buildInductorBoard(false, false), memNoDiode, 0.005);
    expect(Math.abs(spikeRes.componentStates['l1'].voltageDrop)).toBeGreaterThan(15);

    // With reverse flyback diode: spike clamped safely to ~0.7-2V!
    const memWithDiode = createTransientMemory();
    for (let i = 0; i < 60; i++) {
      stepTransientCircuit(buildInductorBoard(true, true), memWithDiode, 0.005);
    }
    const clampedRes = stepTransientCircuit(buildInductorBoard(false, true), memWithDiode, 0.005);
    expect(Math.abs(clampedRes.componentStates['l1'].voltageDrop)).toBeLessThan(3.0);
  });
});
