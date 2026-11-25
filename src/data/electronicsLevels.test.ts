import { describe, expect, it } from 'vitest';
import { ADULT_LEVELS, KID_MISSIONS } from './electronicsLevels';
import { solveCircuit } from '../engine/circuitSolver';
import {
  type CircuitBoardState,
  DEFAULT_ENVIRONMENT,
  type LevelDefinition,
} from '../engine/types';

function makeBoard(level: LevelDefinition): CircuitBoardState {
  return {
    cols: level.cols,
    rows: level.rows,
    components: level.initialComponents.map((c) => ({
      ...c,
      a: { ...c.a },
      b: { ...c.b },
      ...(c.c ? { c: { ...c.c } } : {}),
    })),
    wires: level.initialWires.map((w) => ({ ...w, a: { ...w.a }, b: { ...w.b } })),
  };
}

const EMPTY_HISTORY = { flags: {}, metrics: {}, burnoutCount: 0 };

function byId(list: LevelDefinition[], id: string): LevelDefinition {
  const found = list.find((l) => l.id === id);
  if (!found) throw new Error(`Level not found: ${id}`);
  return found;
}

describe('Tier 1–4 curriculum completeness & physical solvability', () => {
  it('ships 30 Adult Labs (Tiers 1–4) and 13 Kid Missions with EN/PL text', () => {
    expect(ADULT_LEVELS.length).toBe(30);
    expect(KID_MISSIONS.length).toBe(13);
    for (const lvl of [...ADULT_LEVELS, ...KID_MISSIONS]) {
      expect(lvl.title.en.length).toBeGreaterThan(2);
      expect(lvl.title.pl.length).toBeGreaterThan(2);
      expect(lvl.narrationPrompt.en.length).toBeGreaterThan(10);
      expect(lvl.narrationPrompt.pl.length).toBeGreaterThan(10);
    }
  });

  // --- Tier 1 ---
  it('Lab 01 & Lab 02 solve cleanly', () => {
    const l1 = byId(ADULT_LEVELS, 'adult-1-first-spark');
    const b1 = makeBoard(l1);
    b1.components.push({ id: 'r1', kind: 'resistor', resistance: 100, a: { col: 2, row: 1 }, b: { col: 3, row: 1 } });
    b1.wires.push(
      { id: 'w1', a: { col: 1, row: 1 }, b: { col: 2, row: 1 }, color: 'red' },
      { id: 'w2', a: { col: 3, row: 1 }, b: { col: 4, row: 1 }, color: 'red' },
      { id: 'w3', a: { col: 4, row: 2 }, b: { col: 1, row: 2 }, color: 'black' }
    );
    expect(l1.evaluate(b1, solveCircuit(b1), EMPTY_HISTORY).solved).toBe(true);

    const l2 = byId(ADULT_LEVELS, 'adult-2-dont-pop');
    const b2 = makeBoard(l2);
    b2.components.push({ id: 'r330', kind: 'resistor', resistance: 330, a: { col: 2, row: 1 }, b: { col: 3, row: 1 } });
    b2.wires.push(
      { id: 'w1', a: { col: 1, row: 1 }, b: { col: 2, row: 1 }, color: 'red' },
      { id: 'w2', a: { col: 3, row: 1 }, b: { col: 4, row: 1 }, color: 'red' },
      { id: 'w3', a: { col: 4, row: 2 }, b: { col: 1, row: 2 }, color: 'black' }
    );
    expect(l2.evaluate(b2, solveCircuit(b2), EMPTY_HISTORY).solved).toBe(true);
  });

  // --- Tier 2 ---
  it('Lab 09 (Resistor Craft), Lab 10 (Voltage Divider), Lab 12 (Wattage), Lab 13 (SPDT 3-Way), Lab 14 (LDR), Lab 15 (NTC)', () => {
    // Lab 09: 3x 100Ω in series
    const l9 = byId(ADULT_LEVELS, 'adult-9-resistor-craft');
    const b9 = makeBoard(l9);
    b9.components.push(
      { id: 'r1', kind: 'resistor', resistance: 100, a: { col: 2, row: 1 }, b: { col: 3, row: 1 } },
      { id: 'r2', kind: 'resistor', resistance: 100, a: { col: 3, row: 1 }, b: { col: 4, row: 1 } },
      { id: 'r3', kind: 'resistor', resistance: 100, a: { col: 4, row: 1 }, b: { col: 5, row: 1 } }
    );
    b9.wires.push(
      { id: 'w1', a: { col: 1, row: 1 }, b: { col: 2, row: 1 }, color: 'red' },
      { id: 'w2', a: { col: 5, row: 2 }, b: { col: 1, row: 2 }, color: 'black' }
    );
    expect(l9.evaluate(b9, solveCircuit(b9), EMPTY_HISTORY).solved).toBe(true);

    // Lab 10: 2x 1kΩ divider
    const l10 = byId(ADULT_LEVELS, 'adult-10-voltage-divider');
    const b10 = makeBoard(l10);
    b10.components.push(
      { id: 'r1', kind: 'resistor', resistance: 1000, a: { col: 2, row: 1 }, b: { col: 3, row: 1 } },
      { id: 'r2', kind: 'resistor', resistance: 1000, a: { col: 3, row: 1 }, b: { col: 3, row: 2 } }
    );
    b10.wires.push(
      { id: 'w1', a: { col: 1, row: 1 }, b: { col: 2, row: 1 }, color: 'red' },
      { id: 'w2', a: { col: 3, row: 2 }, b: { col: 1, row: 2 }, color: 'black' }
    );
    expect(l10.evaluate(b10, solveCircuit(b10), EMPTY_HISTORY).solved).toBe(true);

    // Lab 12: 3x 330Ω (0.25W) in parallel -> ~80mA, each ~245mW < 250mW
    const l12 = byId(ADULT_LEVELS, 'adult-12-wattage-limit');
    const b12 = makeBoard(l12);
    b12.components.push(
      { id: 'r1', kind: 'resistor', resistance: 330, maxPower: 0.25, a: { col: 3, row: 1 }, b: { col: 3, row: 2 } },
      { id: 'r2', kind: 'resistor', resistance: 330, maxPower: 0.25, a: { col: 4, row: 1 }, b: { col: 4, row: 2 } },
      { id: 'r3', kind: 'resistor', resistance: 330, maxPower: 0.25, a: { col: 5, row: 1 }, b: { col: 5, row: 2 } }
    );
    b12.wires.push(
      { id: 'w1', a: { col: 1, row: 1 }, b: { col: 3, row: 1 }, color: 'red' },
      { id: 'w2', a: { col: 3, row: 1 }, b: { col: 4, row: 1 }, color: 'red' },
      { id: 'w3', a: { col: 4, row: 1 }, b: { col: 5, row: 1 }, color: 'red' },
      { id: 'w4', a: { col: 3, row: 2 }, b: { col: 1, row: 3 }, color: 'black' },
      { id: 'w5', a: { col: 4, row: 2 }, b: { col: 3, row: 2 }, color: 'black' },
      { id: 'w6', a: { col: 5, row: 2 }, b: { col: 4, row: 2 }, color: 'black' }
    );
    expect(l12.evaluate(b12, solveCircuit(b12), EMPTY_HISTORY).solved).toBe(true);

    // Lab 13: 3-way SPDT hallway switch
    const l13 = byId(ADULT_LEVELS, 'adult-13-hallway-3way');
    const b13 = makeBoard(l13);
    b13.components.push(
      { id: 's1', kind: 'switch_spdt', closed: false, a: { col: 2, row: 1 }, c: { col: 2, row: 2 }, b: { col: 2, row: 3 } },
      { id: 's2', kind: 'switch_spdt', closed: false, a: { col: 4, row: 1 }, c: { col: 4, row: 2 }, b: { col: 4, row: 3 } }
    );
    b13.wires.push(
      { id: 'w1', a: { col: 0, row: 1 }, b: { col: 2, row: 2 }, color: 'red' },
      { id: 'w2', a: { col: 2, row: 1 }, b: { col: 4, row: 1 }, color: 'blue' },
      { id: 'w3', a: { col: 2, row: 3 }, b: { col: 4, row: 3 }, color: 'amber' },
      { id: 'w4', a: { col: 4, row: 2 }, b: { col: 5, row: 2 }, color: 'red' }
    );
    expect(l13.evaluate(b13, solveCircuit(b13), EMPTY_HISTORY).solved).toBe(true);

    // Lab 14: LDR + 100Ω
    const l14 = byId(ADULT_LEVELS, 'adult-14-ldr-sensor');
    const b14 = makeBoard(l14);
    b14.components.push(
      { id: 'ldr1', kind: 'ldr', a: { col: 2, row: 1 }, b: { col: 3, row: 1 } },
      { id: 'r1', kind: 'resistor', resistance: 100, a: { col: 3, row: 1 }, b: { col: 4, row: 1 } }
    );
    b14.wires.push(
      { id: 'w1', a: { col: 1, row: 1 }, b: { col: 2, row: 1 }, color: 'red' },
      { id: 'w2', a: { col: 4, row: 1 }, b: { col: 5, row: 1 }, color: 'red' },
      { id: 'w3', a: { col: 5, row: 2 }, b: { col: 1, row: 2 }, color: 'black' }
    );
    expect(l14.evaluate(b14, solveCircuit(b14, 'en', { ...DEFAULT_ENVIRONMENT, lightLevel: 0.9 }), EMPTY_HISTORY).solved).toBe(true);

    // Lab 15: NTC Thermistor + Buzzer
    const l15 = byId(ADULT_LEVELS, 'adult-15-overheat-alarm');
    const b15 = makeBoard(l15);
    b15.components.push({ id: 'ntc', kind: 'thermistor', a: { col: 2, row: 1 }, b: { col: 3, row: 1 } });
    b15.wires.push(
      { id: 'w1', a: { col: 1, row: 1 }, b: { col: 2, row: 1 }, color: 'red' },
      { id: 'w2', a: { col: 3, row: 1 }, b: { col: 5, row: 1 }, color: 'red' },
      { id: 'w3', a: { col: 5, row: 2 }, b: { col: 1, row: 2 }, color: 'black' }
    );
    expect(l15.evaluate(b15, solveCircuit(b15, 'en', { ...DEFAULT_ENVIRONMENT, temperature: 1 }), EMPTY_HISTORY).solved).toBe(true);
  });

  // --- Tier 3 ---
  it('Lab 16 (NPN Lever), Lab 17 (Auto Streetlight), Lab 18 (Smart Fan), Lab 19 (NOT), Lab 20 (NAND), Lab 21 (NOR), Lab 22 (SR Latch)', () => {
    // Lab 16: NPN Lever
    const l16 = byId(ADULT_LEVELS, 'adult-16-npn-lever');
    const b16 = makeBoard(l16);
    b16.components.push(
      { id: 'rb', kind: 'resistor', resistance: 2200, a: { col: 2, row: 2 }, b: { col: 3, row: 2 } },
      { id: 'q1', kind: 'transistor_npn', a: { col: 4, row: 1 }, c: { col: 4, row: 2 }, b: { col: 4, row: 3 } }
    );
    b16.wires.push(
      { id: 'w1', a: { col: 3, row: 2 }, b: { col: 4, row: 2 }, color: 'blue' },
      { id: 'w2', a: { col: 4, row: 3 }, b: { col: 0, row: 3 }, color: 'black' }
    );
    expect(l16.evaluate(b16, solveCircuit(b16), EMPTY_HISTORY).solved).toBe(true);

    // Lab 17: Auto Streetlight
    const l17 = byId(ADULT_LEVELS, 'adult-17-auto-streetlight');
    const b17 = makeBoard(l17);
    b17.components.push(
      { id: 'r10k', kind: 'resistor', resistance: 10000, a: { col: 2, row: 0 }, b: { col: 2, row: 1 } },
      { id: 'ldr1', kind: 'ldr', a: { col: 2, row: 1 }, b: { col: 2, row: 2 } }
    );
    b17.wires.push(
      { id: 'w1', a: { col: 0, row: 1 }, b: { col: 2, row: 0 }, color: 'red' },
      { id: 'w2', a: { col: 2, row: 1 }, b: { col: 4, row: 2 }, color: 'blue' },
      { id: 'w3', a: { col: 2, row: 2 }, b: { col: 0, row: 3 }, color: 'black' }
    );
    expect(l17.evaluate(b17, solveCircuit(b17, 'en', { ...DEFAULT_ENVIRONMENT, lightLevel: 0 }), EMPTY_HISTORY).solved).toBe(true);

    // Lab 18: Smart Cooling Fan
    const l18 = byId(ADULT_LEVELS, 'adult-18-smart-fan');
    const b18 = makeBoard(l18);
    b18.components.push(
      { id: 'ntc', kind: 'thermistor', a: { col: 2, row: 1 }, b: { col: 2, row: 2 } },
      { id: 'r1k', kind: 'resistor', resistance: 1000, a: { col: 2, row: 2 }, b: { col: 2, row: 3 } }
    );
    b18.wires.push(
      { id: 'w1', a: { col: 0, row: 1 }, b: { col: 2, row: 1 }, color: 'red' },
      { id: 'w2', a: { col: 2, row: 2 }, b: { col: 5, row: 2 }, color: 'blue' },
      { id: 'w3', a: { col: 2, row: 3 }, b: { col: 0, row: 3 }, color: 'black' }
    );
    expect(l18.evaluate(b18, solveCircuit(b18, 'en', { ...DEFAULT_ENVIRONMENT, temperature: 1 }), EMPTY_HISTORY).solved).toBe(true);

    // Lab 19: NOT Gate
    const l19 = byId(ADULT_LEVELS, 'adult-19-not-gate');
    const b19 = makeBoard(l19);
    b19.components.push(
      { id: 'rb', kind: 'resistor', resistance: 2200, a: { col: 2, row: 2 }, b: { col: 3, row: 2 } },
      { id: 'q1', kind: 'transistor_npn', a: { col: 4, row: 1 }, c: { col: 4, row: 2 }, b: { col: 4, row: 3 } }
    );
    b19.wires.push(
      { id: 'w1', a: { col: 3, row: 2 }, b: { col: 4, row: 2 }, color: 'blue' },
      { id: 'w2', a: { col: 4, row: 3 }, b: { col: 0, row: 3 }, color: 'black' }
    );
    expect(l19.evaluate(b19, solveCircuit(b19), EMPTY_HISTORY).solved).toBe(true);

    // Lab 20: NAND Gate (2 stacked NPNs)
    const l20 = byId(ADULT_LEVELS, 'adult-20-nand-gate');
    const b20 = makeBoard(l20);
    b20.components.push(
      { id: 'rA', kind: 'resistor', resistance: 2200, a: { col: 2, row: 2 }, b: { col: 3, row: 2 } },
      { id: 'rB', kind: 'resistor', resistance: 2200, a: { col: 2, row: 4 }, b: { col: 3, row: 4 } },
      { id: 'q1', kind: 'transistor_npn', a: { col: 5, row: 1 }, c: { col: 5, row: 2 }, b: { col: 5, row: 3 } },
      { id: 'q2', kind: 'transistor_npn', a: { col: 5, row: 3 }, c: { col: 5, row: 4 }, b: { col: 5, row: 5 } }
    );
    b20.wires.push(
      { id: 'w1', a: { col: 3, row: 2 }, b: { col: 5, row: 2 }, color: 'blue' },
      { id: 'w2', a: { col: 3, row: 4 }, b: { col: 5, row: 4 }, color: 'amber' },
      { id: 'w3', a: { col: 5, row: 5 }, b: { col: 0, row: 5 }, color: 'black' }
    );
    expect(l20.evaluate(b20, solveCircuit(b20), EMPTY_HISTORY).solved).toBe(true);

    // Lab 21: NOR Gate (2 parallel NPNs)
    const l21 = byId(ADULT_LEVELS, 'adult-21-nor-gate');
    const b21 = makeBoard(l21);
    b21.components.push(
      { id: 'rA', kind: 'resistor', resistance: 2200, a: { col: 2, row: 1 }, b: { col: 3, row: 1 } },
      { id: 'rB', kind: 'resistor', resistance: 2200, a: { col: 2, row: 3 }, b: { col: 3, row: 3 } },
      { id: 'q1', kind: 'transistor_npn', a: { col: 4, row: 1 }, c: { col: 4, row: 2 }, b: { col: 4, row: 3 } },
      { id: 'q2', kind: 'transistor_npn', a: { col: 5, row: 1 }, c: { col: 5, row: 2 }, b: { col: 5, row: 3 } }
    );
    b21.wires.push(
      { id: 'w1', a: { col: 3, row: 1 }, b: { col: 4, row: 2 }, color: 'blue' },
      { id: 'w2', a: { col: 3, row: 3 }, b: { col: 5, row: 2 }, color: 'amber' },
      { id: 'w3', a: { col: 4, row: 1 }, b: { col: 5, row: 1 }, color: 'blue' },
      { id: 'w4', a: { col: 4, row: 3 }, b: { col: 0, row: 4 }, color: 'black' },
      { id: 'w5', a: { col: 5, row: 3 }, b: { col: 0, row: 4 }, color: 'black' }
    );
    expect(l21.evaluate(b21, solveCircuit(b21), EMPTY_HISTORY).solved).toBe(true);

    // Lab 22: 1-Bit SR Latch
    const l22 = byId(ADULT_LEVELS, 'adult-22-sr-latch');
    const b22 = makeBoard(l22);
    b22.components.push(
      { id: 'rf1', kind: 'resistor', resistance: 4700, a: { col: 3, row: 2 }, b: { col: 4, row: 2 } },
      { id: 'rf2', kind: 'resistor', resistance: 4700, a: { col: 4, row: 3 }, b: { col: 5, row: 3 } }
    );
    b22.wires.push(
      { id: 'w1', a: { col: 2, row: 2 }, b: { col: 3, row: 2 }, color: 'amber' },
      { id: 'w2', a: { col: 4, row: 2 }, b: { col: 6, row: 3 }, color: 'amber' },
      { id: 'w3', a: { col: 6, row: 2 }, b: { col: 5, row: 3 }, color: 'blue' },
      { id: 'w4', a: { col: 4, row: 3 }, b: { col: 2, row: 3 }, color: 'blue' }
    );
    expect(l22.evaluate(b22, solveCircuit(b22), EMPTY_HISTORY).solved).toBe(true);
  });

  // --- Tier 4 ---
  it('Labs 23–30 (RC Fade, Stopwatch, Blinker, Rectifier, Flyback, LPF, HPF, RLC Resonance)', () => {
    // Lab 23: RC Energy Tank
    const l23 = byId(ADULT_LEVELS, 'adult-23-energy-tank');
    const b23 = makeBoard(l23);
    b23.components.push({ id: 'c1', kind: 'capacitor', capacitance: 1000e-6, a: { col: 3, row: 1 }, b: { col: 3, row: 2 } });
    b23.wires.push(
      { id: 'w1', a: { col: 2, row: 1 }, b: { col: 3, row: 1 }, color: 'red' },
      { id: 'w2', a: { col: 3, row: 2 }, b: { col: 0, row: 2 }, color: 'black' }
    );
    expect(l23.evaluate(b23, solveCircuit(b23), EMPTY_HISTORY).solved).toBe(true);

    // Lab 24: RC Stopwatch (1kΩ + 1000µF = 1.0s)
    const l24 = byId(ADULT_LEVELS, 'adult-24-rc-stopwatch');
    const b24 = makeBoard(l24);
    b24.components.push({ id: 'r1k', kind: 'resistor', resistance: 1000, a: { col: 2, row: 1 }, b: { col: 3, row: 1 } });
    b24.wires.push(
      { id: 'w1', a: { col: 1, row: 1 }, b: { col: 2, row: 1 }, color: 'red' },
      { id: 'w2', a: { col: 3, row: 1 }, b: { col: 4, row: 1 }, color: 'red' }
    );
    expect(l24.evaluate(b24, solveCircuit(b24), EMPTY_HISTORY).solved).toBe(true);

    // Lab 25: Heartbeat Blinker (2x 47µF cross-coupled)
    const l25 = byId(ADULT_LEVELS, 'adult-25-heartbeat-blinker');
    const b25 = makeBoard(l25);
    b25.components.push(
      { id: 'c1', kind: 'capacitor', capacitance: 47e-6, a: { col: 3, row: 1 }, b: { col: 4, row: 1 } },
      { id: 'c2', kind: 'capacitor', capacitance: 47e-6, a: { col: 4, row: 3 }, b: { col: 5, row: 3 } }
    );
    b25.wires.push(
      { id: 'w1', a: { col: 1, row: 1 }, b: { col: 3, row: 1 }, color: 'amber' },
      { id: 'w2', a: { col: 4, row: 1 }, b: { col: 5, row: 2 }, color: 'amber' },
      { id: 'w3', a: { col: 6, row: 1 }, b: { col: 5, row: 3 }, color: 'green' },
      { id: 'w4', a: { col: 4, row: 3 }, b: { col: 3, row: 2 }, color: 'green' }
    );
    expect(l25.evaluate(b25, solveCircuit(b25), EMPTY_HISTORY).solved).toBe(true);

    // Lab 26: AC Rectifier + Smoothing
    const l26 = byId(ADULT_LEVELS, 'adult-26-ac-rectifier');
    const b26 = makeBoard(l26);
    b26.components.push(
      { id: 'd1', kind: 'diode', a: { col: 2, row: 1 }, b: { col: 3, row: 1 } },
      { id: 'c1', kind: 'capacitor', capacitance: 470e-6, a: { col: 4, row: 1 }, b: { col: 4, row: 2 } }
    );
    b26.wires.push(
      { id: 'w1', a: { col: 1, row: 1 }, b: { col: 2, row: 1 }, color: 'red' },
      { id: 'w2', a: { col: 3, row: 1 }, b: { col: 4, row: 1 }, color: 'red' },
      { id: 'w3', a: { col: 4, row: 1 }, b: { col: 5, row: 1 }, color: 'red' },
      { id: 'w4', a: { col: 4, row: 2 }, b: { col: 1, row: 2 }, color: 'black' }
    );
    expect(l26.evaluate(b26, solveCircuit(b26), EMPTY_HISTORY).solved).toBe(true);

    // Lab 27: Flyback Diode Clamping
    const l27 = byId(ADULT_LEVELS, 'adult-27-inductor-kickback');
    const b27 = makeBoard(l27);
    b27.components.push({ id: 'd1', kind: 'diode', a: { col: 5, row: 2 }, b: { col: 5, row: 1 } });
    b27.wires.push(
      { id: 'w1', a: { col: 4, row: 1 }, b: { col: 5, row: 1 }, color: 'blue' },
      { id: 'w2', a: { col: 4, row: 2 }, b: { col: 5, row: 2 }, color: 'black' }
    );
    expect(l27.evaluate(b27, solveCircuit(b27), EMPTY_HISTORY).solved).toBe(true);

    // Lab 28: RC Low-Pass Filter (fc ≈ 159 Hz at E2 = 4,1)
    const l28 = byId(ADULT_LEVELS, 'adult-28-lowpass-filter');
    const b28 = makeBoard(l28);
    b28.components.push(
      { id: 'r1', kind: 'resistor', resistance: 1000, a: { col: 2, row: 1 }, b: { col: 3, row: 1 } },
      { id: 'c1', kind: 'capacitor', capacitance: 1e-6, a: { col: 4, row: 1 }, b: { col: 4, row: 2 } }
    );
    b28.wires.push(
      { id: 'w1', a: { col: 1, row: 1 }, b: { col: 2, row: 1 }, color: 'red' },
      { id: 'w2', a: { col: 3, row: 1 }, b: { col: 4, row: 1 }, color: 'red' },
      { id: 'w3', a: { col: 4, row: 2 }, b: { col: 1, row: 2 }, color: 'black' }
    );
    expect(l28.evaluate(b28, solveCircuit(b28), EMPTY_HISTORY).solved).toBe(true);

    // Lab 29: RC High-Pass Filter (fc ≈ 159 Hz at E2 = 4,1)
    const l29 = byId(ADULT_LEVELS, 'adult-29-highpass-filter');
    const b29 = makeBoard(l29);
    b29.components.push(
      { id: 'c1', kind: 'capacitor', capacitance: 1e-6, a: { col: 2, row: 1 }, b: { col: 3, row: 1 } },
      { id: 'r1', kind: 'resistor', resistance: 1000, a: { col: 4, row: 1 }, b: { col: 4, row: 2 } }
    );
    b29.wires.push(
      { id: 'w1', a: { col: 1, row: 1 }, b: { col: 2, row: 1 }, color: 'red' },
      { id: 'w2', a: { col: 3, row: 1 }, b: { col: 4, row: 1 }, color: 'red' },
      { id: 'w3', a: { col: 4, row: 2 }, b: { col: 1, row: 2 }, color: 'black' }
    );
    expect(l29.evaluate(b29, solveCircuit(b29), EMPTY_HISTORY).solved).toBe(true);

    // Lab 30: RLC Radio Tuner (100mH + 10µF -> f0 ≈ 159 Hz)
    const l30 = byId(ADULT_LEVELS, 'adult-30-rlc-radio-tuner');
    const b30 = makeBoard(l30);
    b30.components.push(
      { id: 'l1', kind: 'inductor', inductance: 0.1, a: { col: 2, row: 1 }, b: { col: 3, row: 1 } },
      { id: 'c1', kind: 'capacitor', capacitance: 10e-6, a: { col: 3, row: 1 }, b: { col: 4, row: 1 } }
    );
    b30.wires.push({ id: 'w1', a: { col: 1, row: 1 }, b: { col: 2, row: 1 }, color: 'red' });
    expect(l30.evaluate(b30, solveCircuit(b30), EMPTY_HISTORY).solved).toBe(true);
  });

  // --- Kid Mode Missions M6–M13 ---
  it('Kid Missions M6 (Swapper), M9 (Night-Light), M11 (Firefly), M12 (Lighthouse), M13 (Wave Machine) solve via guides', () => {
    for (const id of ['kid-1-light-up', 'kid-6-magic-swap', 'kid-9-magic-nightlight', 'kid-12-lighthouse', 'kid-13-wave-machine']) {
      const m = byId(KID_MISSIONS, id);
      const b = makeBoard(m);
      (m.guideWire ?? []).forEach((gw, idx) => {
        b.wires.push({ id: `wg-${idx}`, a: gw.a, b: gw.b, color: 'red' });
      });
      const env = id === 'kid-9-magic-nightlight' ? { ...DEFAULT_ENVIRONMENT, lightLevel: 0 } : DEFAULT_ENVIRONMENT;
      expect(m.evaluate(b, solveCircuit(b, 'en', env), EMPTY_HISTORY).solved).toBe(true);
    }

    // M11 Firefly Fade
    const m11 = byId(KID_MISSIONS, 'kid-11-firefly-fade');
    const b11 = makeBoard(m11);
    b11.components.push({ id: 'c1', kind: 'capacitor', capacitance: 1000e-6, a: { col: 3, row: 1 }, b: { col: 3, row: 2 } });
    b11.wires.push(
      { id: 'w1', a: { col: 2, row: 1 }, b: { col: 3, row: 1 }, color: 'red' },
      { id: 'w2', a: { col: 3, row: 2 }, b: { col: 0, row: 2 }, color: 'black' }
    );
    expect(m11.evaluate(b11, solveCircuit(b11), EMPTY_HISTORY).solved).toBe(true);
  });
});
