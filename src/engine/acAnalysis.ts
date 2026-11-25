import {
  type AcSweepResult,
  type BodePoint,
  type CircuitBoardState,
  DEFAULT_ENVIRONMENT,
  type EnvironmentState,
  type GridCoord,
  coordKey,
} from './types';
import { getLdrResistance, getThermistorResistance } from './circuitSolver';

interface Complex {
  re: number;
  im: number;
}

function cAdd(a: Complex, b: Complex): Complex {
  return { re: a.re + b.re, im: a.im + b.im };
}
function cSub(a: Complex, b: Complex): Complex {
  return { re: a.re - b.re, im: a.im - b.im };
}
function cMul(a: Complex, b: Complex): Complex {
  return { re: a.re * b.re - a.im * b.im, im: a.re * b.im + a.im * b.re };
}
function cDiv(a: Complex, b: Complex): Complex {
  const denom = b.re * b.re + b.im * b.im;
  if (denom < 1e-24) return { re: 0, im: 0 };
  return { re: (a.re * b.re + a.im * b.im) / denom, im: (a.im * b.re - a.re * b.im) / denom };
}
function cAbs(a: Complex): number {
  return Math.hypot(a.re, a.im);
}

function solveComplexLinearSystem(A: Complex[][], b: Complex[]): Complex[] {
  const n = b.length;
  const M = A.map((row) => row.map((v) => ({ ...v })));
  const rhs = b.map((v) => ({ ...v }));

  for (let col = 0; col < n; col++) {
    let pivotRow = col;
    let maxAbs = cAbs(M[col][col]);
    for (let r = col + 1; r < n; r++) {
      const mag = cAbs(M[r][col]);
      if (mag > maxAbs) {
        maxAbs = mag;
        pivotRow = r;
      }
    }
    if (maxAbs < 1e-14) continue;

    if (pivotRow !== col) {
      const tmp = M[col];
      M[col] = M[pivotRow];
      M[pivotRow] = tmp;
      const tb = rhs[col];
      rhs[col] = rhs[pivotRow];
      rhs[pivotRow] = tb;
    }

    const pivot = M[col][col];
    for (let r = col + 1; r < n; r++) {
      const factor = cDiv(M[r][col], pivot);
      if (cAbs(factor) < 1e-16) continue;
      for (let c = col; c < n; c++) {
        M[r][c] = cSub(M[r][c], cMul(factor, M[col][c]));
      }
      rhs[r] = cSub(rhs[r], cMul(factor, rhs[col]));
    }
  }

  const x: Complex[] = Array.from({ length: n }, () => ({ re: 0, im: 0 }));
  for (let r = n - 1; r >= 0; r--) {
    let sum = rhs[r];
    for (let c = r + 1; c < n; c++) {
      sum = cSub(sum, cMul(M[r][c], x[c]));
    }
    x[r] = cAbs(M[r][r]) > 1e-14 ? cDiv(sum, M[r][r]) : { re: 0, im: 0 };
  }
  return x;
}

/**
 * Exact Complex-Impedance AC Frequency Sweep (Bode Magnitude & Phase Analyzer).
 * Evaluates V(outputCoord) / V(source+) across 64 logarithmically spaced frequencies.
 */
export function runAcFrequencySweep(
  board: CircuitBoardState,
  outputCoord: GridCoord,
  env: EnvironmentState = DEFAULT_ENVIRONMENT,
  minFreq = 1,
  maxFreq = 2000,
  numPoints = 64
): AcSweepResult | null {
  const acSource = board.components.find((c) => c.kind === 'ac_source' && !c.burnedOut);
  if (!acSource) return null;

  const nodeIndex = new Map<string, number>();
  const registerNode = (key: string): number => {
    const ex = nodeIndex.get(key);
    if (ex !== undefined) return ex;
    const idx = nodeIndex.size;
    nodeIndex.set(key, idx);
    return idx;
  };

  for (const comp of board.components) {
    registerNode(coordKey(comp.a));
    registerNode(coordKey(comp.b));
    if (comp.c) registerNode(coordKey(comp.c));
  }
  for (const wire of board.wires) {
    registerNode(coordKey(wire.a));
    registerNode(coordKey(wire.b));
  }

  const outIdx = nodeIndex.get(coordKey(outputCoord));
  if (outIdx === undefined) return null;

  const srcPosIdx = registerNode(coordKey(acSource.a));
  const gndIdx = registerNode(coordKey(acSource.b));
  const n = nodeIndex.size;

  const evalAtFreq = (freq: number): BodePoint => {
    const omega = 2 * Math.PI * freq;
    const Y: Complex[][] = Array.from({ length: n }, () =>
      Array.from({ length: n }, () => ({ re: 0, im: 0 }))
    );
    const I: Complex[] = Array.from({ length: n }, () => ({ re: 0, im: 0 }));

    for (let i = 0; i < n; i++) {
      Y[i][i].re += 1e-9;
    }

    const stampY = (n1: number, n2: number, y: Complex) => {
      Y[n1][n1] = cAdd(Y[n1][n1], y);
      Y[n2][n2] = cAdd(Y[n2][n2], y);
      Y[n1][n2] = cSub(Y[n1][n2], y);
      Y[n2][n1] = cSub(Y[n2][n1], y);
    };

    for (const wire of board.wires) {
      const n1 = nodeIndex.get(coordKey(wire.a))!;
      const n2 = nodeIndex.get(coordKey(wire.b))!;
      if (n1 !== n2) stampY(n1, n2, { re: 1 / 0.02, im: 0 });
    }

    for (const comp of board.components) {
      if (comp.burnedOut) continue;
      const nA = nodeIndex.get(coordKey(comp.a))!;
      const nB = nodeIndex.get(coordKey(comp.b))!;

      switch (comp.kind) {
        case 'ac_source': {
          // 1V∠0° Norton excitation with 1Ω source resistance
          stampY(nA, nB, { re: 1.0, im: 0 });
          I[nA].re += 1.0;
          I[nB].re -= 1.0;
          break;
        }
        case 'battery': {
          // DC battery is AC short (only internal resistance)
          stampY(nA, nB, { re: 1 / 0.7, im: 0 });
          break;
        }
        case 'resistor':
        case 'rheostat': {
          stampY(nA, nB, { re: 1 / Math.max(1, comp.resistance ?? 220), im: 0 });
          break;
        }
        case 'ldr': {
          stampY(nA, nB, { re: 1 / getLdrResistance(env.lightLevel), im: 0 });
          break;
        }
        case 'thermistor': {
          stampY(nA, nB, { re: 1 / getThermistorResistance(env.temperature), im: 0 });
          break;
        }
        case 'switch_toggle':
        case 'switch_push': {
          stampY(nA, nB, { re: comp.closed ? 1 / 0.05 : 1e-8, im: 0 });
          break;
        }
        case 'switch_spdt': {
          const nC = comp.c ? nodeIndex.get(coordKey(comp.c))! : nA;
          stampY(nC, nA, { re: comp.closed ? 1e-8 : 1 / 0.05, im: 0 });
          stampY(nC, nB, { re: comp.closed ? 1 / 0.05 : 1e-8, im: 0 });
          break;
        }
        case 'motor': {
          stampY(nA, nB, { re: 1 / 25, im: 0 });
          break;
        }
        case 'buzzer': {
          stampY(nA, nB, { re: 1 / 150, im: 0 });
          break;
        }
        case 'capacitor': {
          const cap = comp.capacitance ?? 10e-6;
          stampY(nA, nB, { re: 0, im: omega * cap });
          break;
        }
        case 'inductor': {
          const ind = comp.inductance ?? 0.1;
          // Z = R_w + j*omega*L => Y = 1 / Z
          const yL = cDiv({ re: 1, im: 0 }, { re: 2.0, im: omega * ind });
          stampY(nA, nB, yL);
          break;
        }
        default: {
          stampY(nA, nB, { re: 1e-6, im: 0 });
          break;
        }
      }
    }

    // Pin ground node to 0+0j
    for (let c = 0; c < n; c++) {
      Y[gndIdx][c] = { re: 0, im: 0 };
    }
    Y[gndIdx][gndIdx] = { re: 1, im: 0 };
    I[gndIdx] = { re: 0, im: 0 };

    const V = solveComplexLinearSystem(Y, I);
    const vIn = V[srcPosIdx];
    const vOut = V[outIdx];
    const ratio = cAbs(vIn) > 1e-9 ? cDiv(vOut, vIn) : { re: 0, im: 0 };
    const mag = cAbs(ratio);
    const gainDb = 20 * Math.log10(Math.max(mag, 1e-4));
    const phaseDeg = (Math.atan2(ratio.im, ratio.re) * 180) / Math.PI;
    return { freq, gainDb, magnitude: mag, phaseDeg };
  };

  const points: BodePoint[] = [];
  const logMin = Math.log10(minFreq);
  const logMax = Math.log10(maxFreq);
  for (let i = 0; i < numPoints; i++) {
    const f = Math.pow(10, logMin + ((logMax - logMin) * i) / (numPoints - 1));
    points.push(evalAtFreq(f));
  }

  let peakIdx = 0;
  let peakGainDb = -999;
  for (let i = 0; i < points.length; i++) {
    if (points[i].gainDb > peakGainDb) {
      peakGainDb = points[i].gainDb;
      peakIdx = i;
    }
  }

  // Detect resonant peak (interior maximum exceeding both endpoints by at least 2 dB)
  const edgeMax = Math.max(points[0].gainDb, points[points.length - 1].gainDb);
  const resonantPeakHz =
    peakIdx > 2 && peakIdx < points.length - 3 && peakGainDb - edgeMax >= 2.0
      ? points[peakIdx].freq
      : null;

  // Detect -3 dB cutoff crossing relative to passband peak
  let cutoffHz: number | null = null;
  const targetDb = peakGainDb - 3.01;
  for (let i = 1; i < points.length; i++) {
    const g0 = points[i - 1].gainDb;
    const g1 = points[i].gainDb;
    if ((g0 >= targetDb && g1 < targetDb) || (g0 <= targetDb && g1 > targetDb)) {
      const frac = Math.abs(g1 - g0) > 1e-6 ? (targetDb - g0) / (g1 - g0) : 0.5;
      cutoffHz = points[i - 1].freq * Math.pow(points[i].freq / points[i - 1].freq, frac);
      break;
    }
  }

  const currentFreq = acSource.frequency ?? 2;
  const currentPt = evalAtFreq(currentFreq);

  return {
    points,
    cutoffHz,
    resonantPeakHz,
    peakGainDb,
    gainAtCurrentFreqDb: currentPt.gainDb,
    phaseAtCurrentFreqDeg: currentPt.phaseDeg,
  };
}
