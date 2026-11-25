import { describe, expect, it } from 'vitest';
import { runAcFrequencySweep } from './acAnalysis';
import type { CircuitBoardState } from './types';

describe('runAcFrequencySweep (Complex MNA Bode Analyzer)', () => {
  it('computes accurate -3 dB cutoff and -45° phase lag for an RC Low-Pass Filter', () => {
    // R = 1000Ω, C = 1µF => fc = 1 / (2*pi*1000*1e-6) ≈ 159.15 Hz
    const board: CircuitBoardState = {
      cols: 4,
      rows: 3,
      components: [
        { id: 'ac', kind: 'ac_source', amplitude: 5, frequency: 159, waveform: 'sine', a: { col: 0, row: 0 }, b: { col: 0, row: 1 } },
        { id: 'r1', kind: 'resistor', resistance: 1000, a: { col: 1, row: 0 }, b: { col: 2, row: 0 } },
        { id: 'c1', kind: 'capacitor', capacitance: 1e-6, a: { col: 2, row: 0 }, b: { col: 2, row: 1 } },
      ],
      wires: [
        { id: 'w1', a: { col: 0, row: 0 }, b: { col: 1, row: 0 }, color: 'red' },
        { id: 'w2', a: { col: 2, row: 1 }, b: { col: 0, row: 1 }, color: 'black' },
      ],
    };

    const sweep = runAcFrequencySweep(board, { col: 2, row: 0 });
    expect(sweep).not.toBeNull();
    expect(sweep!.cutoffHz).not.toBeNull();
    expect(sweep!.cutoffHz!).toBeGreaterThan(145);
    expect(sweep!.cutoffHz!).toBeLessThan(175);
    expect(sweep!.gainAtCurrentFreqDb).toBeCloseTo(-3.01, 0);
    expect(sweep!.phaseAtCurrentFreqDeg).toBeCloseTo(-45, 0);
  });

  it('computes accurate -3 dB cutoff and +45° phase lead for an RC High-Pass Filter', () => {
    // C = 1µF, R = 1000Ω => fc ≈ 159.15 Hz
    const board: CircuitBoardState = {
      cols: 4,
      rows: 3,
      components: [
        { id: 'ac', kind: 'ac_source', amplitude: 5, frequency: 159, waveform: 'sine', a: { col: 0, row: 0 }, b: { col: 0, row: 1 } },
        { id: 'c1', kind: 'capacitor', capacitance: 1e-6, a: { col: 1, row: 0 }, b: { col: 2, row: 0 } },
        { id: 'r1', kind: 'resistor', resistance: 1000, a: { col: 2, row: 0 }, b: { col: 2, row: 1 } },
      ],
      wires: [
        { id: 'w1', a: { col: 0, row: 0 }, b: { col: 1, row: 0 }, color: 'red' },
        { id: 'w2', a: { col: 2, row: 1 }, b: { col: 0, row: 1 }, color: 'black' },
      ],
    };

    const sweep = runAcFrequencySweep(board, { col: 2, row: 0 });
    expect(sweep).not.toBeNull();
    expect(sweep!.cutoffHz!).toBeGreaterThan(145);
    expect(sweep!.cutoffHz!).toBeLessThan(175);
    expect(sweep!.phaseAtCurrentFreqDeg).toBeCloseTo(45, 0);
  });

  it('detects sharp resonant peak at f0 = 1 / (2*pi*sqrt(L*C)) for an RLC Resonator', () => {
    // Series L=100mH + C=10µF driving R=47Ω load => f0 = 1 / (2*pi*sqrt(0.1 * 10e-6)) ≈ 159.15 Hz
    const board: CircuitBoardState = {
      cols: 5,
      rows: 3,
      components: [
        { id: 'ac', kind: 'ac_source', amplitude: 5, frequency: 159, waveform: 'sine', a: { col: 0, row: 0 }, b: { col: 0, row: 1 } },
        { id: 'l1', kind: 'inductor', inductance: 0.1, a: { col: 1, row: 0 }, b: { col: 2, row: 0 } },
        { id: 'c1', kind: 'capacitor', capacitance: 10e-6, a: { col: 2, row: 0 }, b: { col: 3, row: 0 } },
        { id: 'r1', kind: 'resistor', resistance: 47, a: { col: 3, row: 0 }, b: { col: 3, row: 1 } },
      ],
      wires: [
        { id: 'w1', a: { col: 0, row: 0 }, b: { col: 1, row: 0 }, color: 'red' },
        { id: 'w2', a: { col: 3, row: 1 }, b: { col: 0, row: 1 }, color: 'black' },
      ],
    };

    const sweep = runAcFrequencySweep(board, { col: 3, row: 0 });
    expect(sweep).not.toBeNull();
    expect(sweep!.resonantPeakHz).not.toBeNull();
    expect(sweep!.resonantPeakHz!).toBeGreaterThan(140);
    expect(sweep!.resonantPeakHz!).toBeLessThan(180);
  });
});
