import type { Language } from '../core/i18n';
import {
  type AcWaveform,
  type CircuitBoardState,
  type ComponentTelemetry,
  DEFAULT_ENVIRONMENT,
  type DiagnosticInsight,
  type EnvironmentState,
  type LedColor,
  type SimulationResult,
  type TransientMemory,
  type WireTelemetry,
  coordKey,
} from './types';
import {
  formatCapacitance,
  formatCurrent,
  formatFrequency,
  formatInductance,
  formatOhms,
  formatPower,
  formatVoltage,
} from './resistorColors';

/** Realistic forward voltages (Vf) for standard 5mm LEDs */
export const LED_SPECS: Record<
  LedColor,
  { vf: number; maxCurrent: number; optimalCurrent: number; dynamicR: number; label: Record<Language, string> }
> = {
  red: {
    vf: 2.0,
    maxCurrent: 0.035,
    optimalCurrent: 0.02,
    dynamicR: 15,
    label: { en: 'Red LED', pl: 'Czerwona dioda LED' },
  },
  amber: {
    vf: 2.1,
    maxCurrent: 0.035,
    optimalCurrent: 0.02,
    dynamicR: 15,
    label: { en: 'Amber LED', pl: 'Żółta dioda LED' },
  },
  green: {
    vf: 2.2,
    maxCurrent: 0.035,
    optimalCurrent: 0.02,
    dynamicR: 16,
    label: { en: 'Green LED', pl: 'Zielona dioda LED' },
  },
  blue: {
    vf: 3.0,
    maxCurrent: 0.035,
    optimalCurrent: 0.02,
    dynamicR: 18,
    label: { en: 'Blue LED', pl: 'Niebieska dioda LED' },
  },
};

const WIRE_RESISTANCE = 0.02;
const OPEN_RESISTANCE = 1e8;
const DIODE_OFF_RESISTANCE = 1e7;
const BLEED_CONDUCTANCE = 1e-9;
const MOTOR_RESISTANCE = 25;
const MOTOR_MIN_VOLTAGE = 1.2;
const MOTOR_MAX_VOLTAGE = 9.5;
const BUZZER_RESISTANCE = 150;
const BUZZER_MIN_VOLTAGE = 1.8;
const SILICON_DIODE_VF = 0.7;
const SILICON_DIODE_RD = 4.0;
const INDUCTOR_WINDING_R = 2.0;

// Smooth Ebers-Moll BJT constants
const VT = 0.026;
const BJT_IS = 1e-12;
const BJT_ALPHA_R = 0.65;
const BJT_EXP_LIM = 28; // Linearized above 28 * 0.026V ≈ 0.728V for bulletproof convergence
const BJT_GMIN = 1e-9;

function getBatteryInternalResistance(voltage: number): number {
  if (voltage >= 8) return 1.0;
  if (voltage >= 5) return 0.7;
  return 0.5;
}

/** Light-Dependent Resistor (LDR): 10kΩ in pitch dark -> 200Ω in bright sunlight */
export function getLdrResistance(lightLevel: number): number {
  const clamped = Math.max(0, Math.min(1, lightLevel));
  return Math.round(200 * Math.pow(50, 1 - clamped));
}

/** NTC Thermistor: 10kΩ cold -> 300Ω hot */
export function getThermistorResistance(temperature: number): number {
  const clamped = Math.max(0, Math.min(1, temperature));
  return Math.round(300 * Math.pow(33.33, 1 - clamped));
}

/** AC Function Generator instantaneous source voltage */
export function evaluateAcWaveform(
  waveform: AcWaveform,
  amplitude: number,
  frequency: number,
  time: number
): number {
  const phase = (time * frequency) % 1;
  const p = phase < 0 ? phase + 1 : phase;
  switch (waveform) {
    case 'square':
      return p < 0.5 ? amplitude : -amplitude;
    case 'triangle':
      if (p < 0.25) return amplitude * (p * 4);
      if (p < 0.75) return amplitude * (2 - p * 4);
      return amplitude * (p * 4 - 4);
    case 'sine':
    default:
      return amplitude * Math.sin(2 * Math.PI * frequency * time);
  }
}

/** Deterministic tiny beta mismatch (±1.5%) so symmetric 2-NPN astable oscillators self-start naturally */
function getBjtBeta(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) | 0;
  }
  const offset = ((Math.abs(hash) % 7) - 3) * 0.5; // -1.5 .. +1.5
  return 100 + offset;
}

/** Smooth clamped exponential junction current I(v) and conductance dI/dv */
function evalJunction(v: number): { i: number; g: number } {
  const u = v / VT;
  if (u > BJT_EXP_LIM) {
    const expMax = Math.exp(BJT_EXP_LIM);
    const i0 = BJT_IS * (expMax - 1);
    const g = (BJT_IS * expMax) / VT;
    return { i: i0 + g * (v - BJT_EXP_LIM * VT), g };
  }
  if (u < -40) {
    return { i: -BJT_IS, g: BJT_GMIN };
  }
  const e = Math.exp(u);
  return {
    i: BJT_IS * (e - 1),
    g: (BJT_IS * e) / VT + BJT_GMIN,
  };
}

/** Smooth Ebers-Moll NPN BJT model returning terminal currents (into C, B, E) and Jacobian partials */
function evalNpnBjt(vbe: number, vbc: number, betaF: number) {
  const alphaF = betaF / (betaF + 1);
  const f = evalJunction(vbe); // forward BE junction
  const r = evalJunction(vbc); // reverse BC junction

  // Collector current INTO C, Emitter current OUT OF E, Base current INTO B
  const ic = alphaF * f.i - r.i;
  const ie = f.i - BJT_ALPHA_R * r.i;
  const ib = ie - ic; // = (1 - alphaF)*f.i + (1 - alphaR)*r.i

  // Partials wrt (vbe, vbc)
  const dIc_dVbe = alphaF * f.g;
  const dIc_dVbc = -r.g;
  const dIb_dVbe = (1 - alphaF) * f.g;
  const dIb_dVbc = (1 - BJT_ALPHA_R) * r.g;

  return { ic, ib, ie, dIc_dVbe, dIc_dVbc, dIb_dVbe, dIb_dVbc };
}

/** Dense Gaussian elimination with partial pivoting for G * v = i */
function solveLinearSystem(A: Float64Array[], b: Float64Array): Float64Array {
  const n = b.length;
  const M = A.map((row) => Float64Array.from(row));
  const rhs = Float64Array.from(b);

  for (let col = 0; col < n; col++) {
    let pivotRow = col;
    let maxAbs = Math.abs(M[col][col]);
    for (let r = col + 1; r < n; r++) {
      const val = Math.abs(M[r][col]);
      if (val > maxAbs) {
        maxAbs = val;
        pivotRow = r;
      }
    }

    if (maxAbs < 1e-14) continue;

    if (pivotRow !== col) {
      const tmpRow = M[col];
      M[col] = M[pivotRow];
      M[pivotRow] = tmpRow;
      const tmpB = rhs[col];
      rhs[col] = rhs[pivotRow];
      rhs[pivotRow] = tmpB;
    }

    const pivot = M[col][col];
    for (let r = col + 1; r < n; r++) {
      const factor = M[r][col] / pivot;
      if (Math.abs(factor) < 1e-16) continue;
      for (let c = col; c < n; c++) {
        M[r][c] -= factor * M[col][c];
      }
      rhs[r] -= factor * rhs[col];
    }
  }

  const x = new Float64Array(n);
  for (let r = n - 1; r >= 0; r--) {
    let sum = rhs[r];
    for (let c = r + 1; c < n; c++) {
      sum -= M[r][c] * x[c];
    }
    const diag = M[r][r];
    x[r] = Math.abs(diag) > 1e-14 ? sum / diag : 0;
  }

  return x;
}

interface InternalSolveOptions {
  lang: Language;
  env: EnvironmentState;
  transient?: {
    memory: TransientMemory;
    dt: number;
  };
  /** Optional warm-start voltages (used for bistable latches & transient continuity) */
  initialVoltages?: Record<string, number>;
}

/**
 * Core unified MNA solver supporting:
 * - Linear DC elements, SPDT 3-pin switches, LDR & NTC sensors
 * - Piecewise-linear LEDs & Silicon diodes
 * - Smooth damped Newton-Raphson Ebers-Moll NPN transistors (3-pin)
 * - Optional Backward-Euler transient companion models for Capacitors, Inductors & AC Sources
 */
function solveUnified(board: CircuitBoardState, opts: InternalSolveOptions): SimulationResult {
  const { lang, env, transient } = opts;
  const isPl = lang === 'pl';
  const nodeIndex = new Map<string, number>();
  const indexToKey: string[] = [];

  const registerNode = (key: string): number => {
    const existing = nodeIndex.get(key);
    if (existing !== undefined) return existing;
    const idx = indexToKey.length;
    nodeIndex.set(key, idx);
    indexToKey.push(key);
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

  const nodeCount = indexToKey.length;
  if (nodeCount === 0) {
    return {
      nodeVoltages: {},
      componentStates: {},
      wireStates: {},
      shortCircuit: false,
      totalPower: 0,
      diagnostics: [],
    };
  }

  // Reference ground: negative terminal of first battery or AC source, else node 0
  const refSource =
    board.components.find((c) => c.kind === 'battery' && !c.burnedOut) ??
    board.components.find((c) => c.kind === 'ac_source' && !c.burnedOut);
  const groundIdx = refSource ? registerNode(coordKey(refSource.b)) : 0;

  // Initialize nonlinear states & warm-start voltages
  const diodeConducting = new Map<string, boolean>();
  for (const comp of board.components) {
    if ((comp.kind === 'led' || comp.kind === 'diode') && !comp.burnedOut) {
      diodeConducting.set(comp.id, true);
    }
  }

  const hasBjt = board.components.some((c) => c.kind === 'transistor_npn' && !c.burnedOut);
  let voltages: Float64Array<ArrayBufferLike> = new Float64Array(nodeCount);
  const warmMap = transient?.memory.prevNodeVoltages ?? opts.initialVoltages;
  if (warmMap) {
    for (let i = 0; i < nodeCount; i++) {
      const prevV = warmMap[indexToKey[i]];
      if (prevV !== undefined && Number.isFinite(prevV)) {
        voltages[i] = prevV;
      }
    }
  }

  const maxIterations = hasBjt ? 36 : 24;
  const dt = transient?.dt ?? 0.005;
  const simTime = transient?.memory.time ?? 0;

  for (let iter = 0; iter < maxIterations; iter++) {
    const G: Float64Array[] = Array.from({ length: nodeCount }, () => new Float64Array(nodeCount));
    const I = new Float64Array(nodeCount);

    for (let i = 0; i < nodeCount; i++) {
      G[i][i] += BLEED_CONDUCTANCE;
    }

    const stampResistor = (n1: number, n2: number, r: number) => {
      const g = 1 / Math.max(r, 1e-6);
      G[n1][n1] += g;
      G[n2][n2] += g;
      G[n1][n2] -= g;
      G[n2][n1] -= g;
    };

    const stampNortonSource = (nPos: number, nNeg: number, vSource: number, rInt: number) => {
      const g = 1 / Math.max(rInt, 1e-6);
      const iEq = vSource * g;
      G[nPos][nPos] += g;
      G[nNeg][nNeg] += g;
      G[nPos][nNeg] -= g;
      G[nNeg][nPos] -= g;
      I[nPos] += iEq;
      I[nNeg] -= iEq;
    };

    const stampCurrentSource = (nFrom: number, nTo: number, iVal: number) => {
      // Positive current flowing from nFrom -> nTo leaves nFrom and enters nTo
      I[nFrom] -= iVal;
      I[nTo] += iVal;
    };

    for (const wire of board.wires) {
      const n1 = nodeIndex.get(coordKey(wire.a))!;
      const n2 = nodeIndex.get(coordKey(wire.b))!;
      if (n1 !== n2) stampResistor(n1, n2, WIRE_RESISTANCE);
    }

    for (const comp of board.components) {
      const nA = nodeIndex.get(coordKey(comp.a))!;
      const nB = nodeIndex.get(coordKey(comp.b))!;

      if (comp.burnedOut) {
        stampResistor(nA, nB, OPEN_RESISTANCE);
        continue;
      }

      switch (comp.kind) {
        case 'battery': {
          const v = comp.voltage ?? 3;
          stampNortonSource(nA, nB, v, getBatteryInternalResistance(v));
          break;
        }
        case 'ac_source': {
          const amp = comp.amplitude ?? 5;
          const freq = comp.frequency ?? 2;
          const wf = comp.waveform ?? 'sine';
          const vInst = transient ? evaluateAcWaveform(wf, amp, freq, simTime) : amp * 0.707;
          stampNortonSource(nA, nB, vInst, 1.0);
          break;
        }
        case 'resistor':
        case 'rheostat': {
          stampResistor(nA, nB, Math.max(1, comp.resistance ?? 220));
          break;
        }
        case 'ldr': {
          stampResistor(nA, nB, getLdrResistance(env.lightLevel));
          break;
        }
        case 'thermistor': {
          stampResistor(nA, nB, getThermistorResistance(env.temperature));
          break;
        }
        case 'switch_toggle':
        case 'switch_push': {
          stampResistor(nA, nB, comp.closed ? 0.05 : OPEN_RESISTANCE);
          break;
        }
        case 'switch_spdt': {
          const nC = comp.c ? nodeIndex.get(coordKey(comp.c))! : nA;
          // closed=false connects Common(c) -> Throw1(a); closed=true connects Common(c) -> Throw2(b)
          stampResistor(nC, nA, comp.closed ? OPEN_RESISTANCE : 0.05);
          stampResistor(nC, nB, comp.closed ? 0.05 : OPEN_RESISTANCE);
          break;
        }
        case 'motor': {
          stampResistor(nA, nB, MOTOR_RESISTANCE);
          break;
        }
        case 'buzzer': {
          stampResistor(nA, nB, BUZZER_RESISTANCE);
          break;
        }
        case 'led': {
          const spec = LED_SPECS[comp.ledColor ?? 'red'];
          if (diodeConducting.get(comp.id)) {
            stampNortonSource(nA, nB, spec.vf, spec.dynamicR);
          } else {
            stampResistor(nA, nB, DIODE_OFF_RESISTANCE);
          }
          break;
        }
        case 'diode': {
          if (diodeConducting.get(comp.id)) {
            stampNortonSource(nA, nB, SILICON_DIODE_VF, SILICON_DIODE_RD);
          } else {
            stampResistor(nA, nB, DIODE_OFF_RESISTANCE);
          }
          break;
        }
        case 'capacitor': {
          const cap = comp.capacitance ?? 470e-6;
          if (transient) {
            const vPrev = transient.memory.capVoltages[comp.id] ?? 0;
            // Backward Euler companion model: Gc = C / dt in parallel with Ieq = Gc * vPrev (pushing from b -> a)
            const rEq = Math.max(0.05, dt / cap);
            stampNortonSource(nA, nB, vPrev, rEq);
          } else {
            // Steady-state DC: ideal open circuit with tiny leakage
            stampResistor(nA, nB, 1e7);
          }
          break;
        }
        case 'inductor': {
          const ind = comp.inductance ?? 0.2;
          if (transient) {
            const iPrev = transient.memory.indCurrents[comp.id] ?? 0;
            // Backward Euler companion: R_eq = R_winding + L/dt, parallel current source maintaining iPrev (a -> b)
            const rInd = ind / dt;
            const rEff = INDUCTOR_WINDING_R + rInd;
            // Stamp Norton equivalent of series (R_winding + L/dt) with voltage source (-rInd * iPrev)
            // V_ab = R_eff * I_ab - rInd * iPrev  =>  I_ab = V_ab / R_eff + (rInd / R_eff) * iPrev
            stampResistor(nA, nB, rEff);
            stampCurrentSource(nA, nB, (rInd / rEff) * iPrev);
            // Safe spark-gap clamp prevents infinite spikes on open switch while preserving dramatic 20-35V kickback
            stampResistor(nA, nB, 1500);
          } else {
            // Steady-state DC: copper winding resistance
            stampResistor(nA, nB, INDUCTOR_WINDING_R);
          }
          break;
        }
        case 'transistor_npn': {
          const nC = nA;
          const nE = nB;
          const nBase = comp.c ? nodeIndex.get(coordKey(comp.c))! : nA;
          const vbe = voltages[nBase] - voltages[nE];
          const vbc = voltages[nBase] - voltages[nC];
          const betaF = getBjtBeta(comp.id);
          const bjt = evalNpnBjt(vbe, vbc, betaF);

          // Linearized Newton-Raphson companion stamp:
          // Ic(v) ≈ Ic0 + dIc_dVbe*(Vb-Ve - vbe) + dIc_dVbc*(Vb-Vc - vbc)
          // Ib(v) ≈ Ib0 + dIb_dVbe*(Vb-Ve - vbe) + dIb_dVbc*(Vb-Vc - vbc)
          // Ie = Ic + Ib (leaving E)
          const g_c_b = bjt.dIc_dVbe + bjt.dIc_dVbc;
          const g_c_c = -bjt.dIc_dVbc;
          const g_c_e = -bjt.dIc_dVbe;

          const g_b_b = bjt.dIb_dVbe + bjt.dIb_dVbc;
          const g_b_c = -bjt.dIb_dVbc;
          const g_b_e = -bjt.dIb_dVbe;

          const g_e_b = -(g_c_b + g_b_b);
          const g_e_c = -(g_c_c + g_b_c);
          const g_e_e = -(g_c_e + g_b_e);

          // Stamp Jacobian into G (KCL: sum of currents leaving node = I_rhs)
          G[nC][nB_safe(nBase)] += g_c_b;
          G[nC][nC] += g_c_c;
          G[nC][nE] += g_c_e;

          G[nBase][nBase] += g_b_b;
          G[nBase][nC] += g_b_c;
          G[nBase][nE] += g_b_e;

          G[nE][nBase] += g_e_b;
          G[nE][nC] += g_e_c;
          G[nE][nE] += g_e_e;

          // Equivalent independent currents leaving each node (shifted to RHS with minus sign)
          const icEq = bjt.ic - (bjt.dIc_dVbe * vbe + bjt.dIc_dVbc * vbc);
          const ibEq = bjt.ib - (bjt.dIb_dVbe * vbe + bjt.dIb_dVbc * vbc);
          const ieEq = -(icEq + ibEq);

          I[nC] -= icEq;
          I[nBase] -= ibEq;
          I[nE] -= ieEq;

          // Small Gmin across CE/BE for numerical stability
          stampResistor(nC, nE, 1e8);
          stampResistor(nBase, nE, 1e8);
          break;
        }
      }
    }

    for (let c = 0; c < nodeCount; c++) {
      G[groundIdx][c] = 0;
    }
    G[groundIdx][groundIdx] = 1;
    I[groundIdx] = 0;

    const nextV = solveLinearSystem(G, I);

    // Damped Newton update for BJT circuits prevents overshoot during switching edges
    let maxDelta = 0;
    if (hasBjt) {
      for (let i = 0; i < nodeCount; i++) {
        const diff = nextV[i] - voltages[i];
        const step = Math.max(-0.35, Math.min(0.35, diff));
        voltages[i] += iter < 4 ? step : diff * 0.7;
        maxDelta = Math.max(maxDelta, Math.abs(diff));
      }
    } else {
      for (let i = 0; i < nodeCount; i++) {
        maxDelta = Math.max(maxDelta, Math.abs(nextV[i] - voltages[i]));
      }
      voltages = nextV;
    }

    // Update piecewise-linear LED / Diode states
    let diodeChanged = false;
    for (const comp of board.components) {
      if ((comp.kind !== 'led' && comp.kind !== 'diode') || comp.burnedOut) continue;
      const vf = comp.kind === 'led' ? LED_SPECS[comp.ledColor ?? 'red'].vf : SILICON_DIODE_VF;
      const rd = comp.kind === 'led' ? LED_SPECS[comp.ledColor ?? 'red'].dynamicR : SILICON_DIODE_RD;
      const nA = nodeIndex.get(coordKey(comp.a))!;
      const nB = nodeIndex.get(coordKey(comp.b))!;
      const vDrop = voltages[nA] - voltages[nB];
      const wasOn = diodeConducting.get(comp.id) ?? false;

      if (wasOn) {
        if ((vDrop - vf) / rd < -1e-6) {
          diodeConducting.set(comp.id, false);
          diodeChanged = true;
        }
      } else if (vDrop > vf + 1e-4) {
        diodeConducting.set(comp.id, true);
        diodeChanged = true;
      }
    }

    if (!diodeChanged && (!hasBjt || maxDelta < 1e-4)) {
      if (!hasBjt || iter >= 2) break;
    }
  }

  // Build readable node voltages & update transient memory if stepping in time
  const nodeVoltages: Record<string, number> = {};
  for (let i = 0; i < nodeCount; i++) {
    nodeVoltages[indexToKey[i]] = Math.abs(voltages[i]) < 1e-5 ? 0 : voltages[i];
  }

  if (transient) {
    transient.memory.prevNodeVoltages = { ...nodeVoltages };
  }

  // Compute per-component telemetry
  const componentStates: Record<string, ComponentTelemetry> = {};
  const wireStates: Record<string, WireTelemetry> = {};
  const diagnostics: DiagnosticInsight[] = [];
  let shortCircuit = false;
  let totalPower = 0;

  for (const comp of board.components) {
    const nA = nodeIndex.get(coordKey(comp.a))!;
    const nB = nodeIndex.get(coordKey(comp.b))!;
    const vDrop = voltages[nA] - voltages[nB];

    let current = 0;
    let baseCurrent: number | undefined;
    let vbe: number | undefined;
    let active = false;
    let intensity = 0;
    let motorSpeed = 0;
    let overloaded = false;
    let reverseBiased = false;
    let shorted = false;
    let effectiveResistance = OPEN_RESISTANCE;
    let storedValue: number | undefined;
    let spikeDetected = false;
    let statusText = isPl ? 'Spoczynek' : 'Idle';

    if (comp.burnedOut) {
      statusText = isPl ? 'Spalony!' : 'Burned out!';
    } else {
      switch (comp.kind) {
        case 'battery': {
          const vNom = comp.voltage ?? 3;
          const rInt = getBatteryInternalResistance(vNom);
          current = (vDrop - vNom) / rInt;
          const draw = Math.abs(current);
          effectiveResistance = rInt;
          active = draw > 0.0005;
          totalPower += vNom * draw;
          if (draw > 1.2) {
            shorted = true;
            overloaded = true;
            shortCircuit = true;
            statusText = isPl ? `Zwarcie! (${formatCurrent(draw)})` : `Short circuit! (${formatCurrent(draw)})`;
          } else if (active) {
            statusText = isPl ? `Zasila ${formatCurrent(draw)}` : `Supplying ${formatCurrent(draw)}`;
          } else {
            statusText = isPl ? `${vNom}V Gotowa` : `${vNom}V Ready`;
          }
          break;
        }
        case 'ac_source': {
          const amp = comp.amplitude ?? 5;
          const freq = comp.frequency ?? 2;
          const wf = comp.waveform ?? 'sine';
          const vInst = transient ? evaluateAcWaveform(wf, amp, freq, simTime) : amp * 0.707;
          current = (vDrop - vInst) / 1.0;
          effectiveResistance = 1.0;
          active = true;
          intensity = Math.min(1, Math.abs(vInst) / Math.max(1, amp));
          totalPower += Math.abs(vInst * current);
          if (Math.abs(current) > 1.8) {
            shorted = true;
            overloaded = true;
            shortCircuit = true;
          }
          statusText = `${formatFrequency(freq)} • ${amp.toFixed(1)}Vpk`;
          break;
        }
        case 'resistor':
        case 'rheostat': {
          const r = Math.max(1, comp.resistance ?? 220);
          const pMax = comp.maxPower ?? 0.6;
          current = vDrop / r;
          effectiveResistance = r;
          const p = Math.abs(vDrop * current);
          active = Math.abs(current) > 0.0005;
          if (p > pMax) {
            overloaded = true;
            statusText = isPl
              ? `Przegrzewa się! (${formatPower(p)} > ${formatPower(pMax)})`
              : `Overheating! (${formatPower(p)} > ${formatPower(pMax)})`;
          } else if (active) {
            statusText = `${formatOhms(r)} • ${formatCurrent(current)}`;
          } else {
            statusText = formatOhms(r);
          }
          break;
        }
        case 'ldr': {
          const r = getLdrResistance(env.lightLevel);
          current = vDrop / r;
          effectiveResistance = r;
          active = Math.abs(current) > 0.0002;
          statusText = isPl
            ? `Światło ${Math.round(env.lightLevel * 100)}% • ${formatOhms(r)}`
            : `Light ${Math.round(env.lightLevel * 100)}% • ${formatOhms(r)}`;
          break;
        }
        case 'thermistor': {
          const r = getThermistorResistance(env.temperature);
          current = vDrop / r;
          effectiveResistance = r;
          active = Math.abs(current) > 0.0002;
          const degC = Math.round(env.temperature * 100);
          statusText = `${degC}°C • ${formatOhms(r)}`;
          break;
        }
        case 'switch_toggle':
        case 'switch_push': {
          effectiveResistance = comp.closed ? 0.05 : OPEN_RESISTANCE;
          current = vDrop / effectiveResistance;
          active = Boolean(comp.closed);
          statusText = comp.closed
            ? isPl
              ? 'Zamknięty (WŁ)'
              : 'Closed (ON)'
            : isPl
            ? 'Otwarty (WYŁ)'
            : 'Open (OFF)';
          break;
        }
        case 'switch_spdt': {
          const nC = comp.c ? nodeIndex.get(coordKey(comp.c))! : nA;
          const activeTarget = comp.closed ? nB : nA;
          effectiveResistance = 0.05;
          current = (voltages[nC] - voltages[activeTarget]) / 0.05;
          active = Math.abs(current) > 0.0005;
          statusText = comp.closed
            ? isPl
              ? 'Pozycja B (COM → 2)'
              : 'Throw B (COM → 2)'
            : isPl
            ? 'Pozycja A (COM → 1)'
            : 'Throw A (COM → 1)';
          break;
        }
        case 'motor': {
          current = vDrop / MOTOR_RESISTANCE;
          effectiveResistance = MOTOR_RESISTANCE;
          const absV = Math.abs(vDrop);
          if (absV >= MOTOR_MIN_VOLTAGE) {
            active = true;
            const dir = vDrop >= 0 ? 1 : -1;
            motorSpeed = dir * Math.min(1.6, (absV - 0.5) / 5.5);
            intensity = Math.min(1, absV / 6);
            if (absV > MOTOR_MAX_VOLTAGE) {
              overloaded = true;
              statusText = isPl
                ? `Za wysokie obroty! (${formatVoltage(absV)})`
                : `Over-speed! (${formatVoltage(absV)})`;
            } else {
              statusText = isPl
                ? `${dir > 0 ? 'Kręci się w prawo' : 'Kręci się w lewo'} (${formatVoltage(absV)})`
                : `${dir > 0 ? 'Spinning CW' : 'Spinning CCW'} (${formatVoltage(absV)})`;
            }
          } else {
            statusText =
              absV > 0.2
                ? isPl
                  ? 'Za słaby prąd do rozruchu'
                  : 'Too weak to spin'
                : isPl
                ? 'Zatrzymany'
                : 'Stopped';
          }
          break;
        }
        case 'buzzer': {
          current = vDrop / BUZZER_RESISTANCE;
          effectiveResistance = BUZZER_RESISTANCE;
          const absV = Math.abs(vDrop);
          if (absV >= BUZZER_MIN_VOLTAGE) {
            active = true;
            intensity = Math.min(1, (absV - 1.2) / 5.5);
            statusText = isPl ? `Brzęczy (${formatVoltage(absV)})` : `Buzzing (${formatVoltage(absV)})`;
          } else {
            statusText =
              absV > 0.2
                ? isPl
                  ? 'Za cicho (< 1,8V)'
                  : 'Too quiet (< 1.8V)'
                : isPl
                ? 'Cisza'
                : 'Silent';
          }
          break;
        }
        case 'led': {
          const spec = LED_SPECS[comp.ledColor ?? 'red'];
          const isOn = diodeConducting.get(comp.id) ?? false;
          if (isOn) {
            current = Math.max(0, (vDrop - spec.vf) / spec.dynamicR);
            effectiveResistance = current > 1e-6 ? vDrop / current : spec.dynamicR;
          } else {
            current = vDrop / DIODE_OFF_RESISTANCE;
            effectiveResistance = DIODE_OFF_RESISTANCE;
          }
          if (vDrop < -0.5) {
            reverseBiased = true;
            statusText = isPl ? 'Odwrotnie (polaryzacja zaporowa)' : 'Backwards (reverse-biased)';
          } else if (current > spec.maxCurrent) {
            overloaded = true;
            active = true;
            intensity = 1.4;
            statusText = isPl
              ? `Za duży prąd! (${formatCurrent(current)})`
              : `Too much current! (${formatCurrent(current)})`;
          } else if (current >= 0.0015) {
            active = true;
            intensity = Math.min(1, Math.pow(current / spec.optimalCurrent, 0.72));
            statusText =
              current < 0.006
                ? isPl
                  ? `Słabo świeci (${formatCurrent(current)})`
                  : `Dim (${formatCurrent(current)})`
                : isPl
                ? `Świeci (${formatCurrent(current)})`
                : `Glowing (${formatCurrent(current)})`;
          } else if (vDrop > 0.4 && vDrop < spec.vf) {
            statusText = isPl
              ? `Wymaga ${spec.vf.toFixed(1)}V (ma ${vDrop.toFixed(1)}V)`
              : `Needs ${spec.vf.toFixed(1)}V (has ${vDrop.toFixed(1)}V)`;
          } else {
            statusText = isPl ? 'Wyłączona' : 'Off';
          }
          break;
        }
        case 'diode': {
          const isOn = diodeConducting.get(comp.id) ?? false;
          if (isOn) {
            current = Math.max(0, (vDrop - SILICON_DIODE_VF) / SILICON_DIODE_RD);
            effectiveResistance = current > 1e-6 ? vDrop / current : SILICON_DIODE_RD;
            active = current > 0.0005;
            statusText = isPl
              ? `Przewodzi (${formatCurrent(current)})`
              : `Conducting (${formatCurrent(current)})`;
          } else {
            current = vDrop / DIODE_OFF_RESISTANCE;
            effectiveResistance = DIODE_OFF_RESISTANCE;
            reverseBiased = vDrop < -0.5;
            statusText = reverseBiased
              ? isPl
                ? 'Blokuje (zaporowo)'
                : 'Blocking (reverse)'
              : isPl
              ? 'Nie przewodzi'
              : 'Cutoff';
          }
          break;
        }
        case 'transistor_npn': {
          const nBase = comp.c ? nodeIndex.get(coordKey(comp.c))! : nA;
          const vbeVal = voltages[nBase] - voltages[nB];
          const vbcVal = voltages[nBase] - voltages[nA];
          const bjt = evalNpnBjt(vbeVal, vbcVal, getBjtBeta(comp.id));
          current = bjt.ic;
          baseCurrent = bjt.ib;
          vbe = vbeVal;
          effectiveResistance = Math.abs(bjt.ic) > 1e-5 ? Math.abs(vDrop / bjt.ic) : OPEN_RESISTANCE;
          active = bjt.ic > 0.0005 || bjt.ib > 0.00005;
          intensity = Math.min(1, Math.max(0, bjt.ic / 0.05));
          const saturated = active && vDrop < 0.45 && vDrop > -0.1;
          if (bjt.ib > 0.06 || bjt.ic > 0.9) {
            overloaded = true;
            statusText = isPl ? 'Przeciążony tranzystor!' : 'Transistor overloaded!';
          } else if (saturated) {
            statusText = isPl
              ? `Nasycony (WŁ) • Ic=${formatCurrent(bjt.ic)}`
              : `Saturated (ON) • Ic=${formatCurrent(bjt.ic)}`;
          } else if (active) {
            statusText = isPl
              ? `Aktywny • Ib=${formatCurrent(bjt.ib)}, Ic=${formatCurrent(bjt.ic)}`
              : `Active • Ib=${formatCurrent(bjt.ib)}, Ic=${formatCurrent(bjt.ic)}`;
          } else {
            statusText = isPl ? 'Zatkany (WYŁ)' : 'Cutoff (OFF)';
          }
          break;
        }
        case 'capacitor': {
          const cap = comp.capacitance ?? 470e-6;
          if (transient) {
            const vPrev = transient.memory.capVoltages[comp.id] ?? 0;
            current = (cap * (vDrop - vPrev)) / dt;
            transient.memory.capVoltages[comp.id] = vDrop;
          } else {
            current = 0;
          }
          storedValue = vDrop;
          active = Math.abs(vDrop) > 0.25 || Math.abs(current) > 0.0005;
          intensity = Math.min(1, Math.abs(vDrop) / 9);
          effectiveResistance = 1e7;
          statusText = `${formatCapacitance(cap)} • ${formatVoltage(vDrop)}`;
          break;
        }
        case 'inductor': {
          const ind = comp.inductance ?? 0.2;
          if (transient) {
            const iPrev = transient.memory.indCurrents[comp.id] ?? 0;
            const rInd = ind / dt;
            const rEff = INDUCTOR_WINDING_R + rInd;
            current = (vDrop + rInd * iPrev) / rEff;
            transient.memory.indCurrents[comp.id] = current;
            const absV = Math.abs(vDrop);
            const prevPeak = transient.memory.peakInductorSpikes[comp.id] ?? 0;
            if (absV > prevPeak) {
              transient.memory.peakInductorSpikes[comp.id] = absV;
            }
            if (absV > 12.5) {
              spikeDetected = true;
              overloaded = absV > 14;
            }
          } else {
            current = vDrop / INDUCTOR_WINDING_R;
          }
          storedValue = current;
          effectiveResistance = INDUCTOR_WINDING_R;
          active = Math.abs(current) > 0.002;
          intensity = Math.min(1, Math.abs(current) / 0.25);
          statusText = spikeDetected
            ? isPl
              ? `Przepięcie! (${formatVoltage(Math.abs(vDrop))})`
              : `Flyback spike! (${formatVoltage(Math.abs(vDrop))})`
            : `${formatInductance(ind)} • ${formatCurrent(current)}`;
          break;
        }
      }
    }

    componentStates[comp.id] = {
      id: comp.id,
      current,
      baseCurrent,
      voltageDrop: vDrop,
      vbe,
      power: Math.abs(vDrop * current),
      active,
      intensity,
      motorSpeed,
      overloaded,
      reverseBiased,
      shorted,
      effectiveResistance,
      storedValue,
      spikeDetected,
      statusText,
    };
  }

  for (const wire of board.wires) {
    const nA = nodeIndex.get(coordKey(wire.a))!;
    const nB = nodeIndex.get(coordKey(wire.b))!;
    const vDrop = voltages[nA] - voltages[nB];
    const current = vDrop / WIRE_RESISTANCE;
    const overloaded = Math.abs(current) > 1.2;
    if (overloaded) shortCircuit = true;
    wireStates[wire.id] = { id: wire.id, current, overloaded };
  }

  // Educational diagnostics with plugged-in live math
  const sourceBattery = board.components.find((c) => c.kind === 'battery' && !c.burnedOut);
  const vs = sourceBattery?.voltage ?? 6;

  if (shortCircuit) {
    diagnostics.push({
      id: 'short-circuit',
      severity: 'danger',
      title: isPl ? 'Wykryto zwarcie!' : 'Short Circuit Detected!',
      summary: isPl
        ? 'Prąd płynie prosto z + do − z niemal zerowym oporem, przegrzewając baterię i przewody.'
        : 'Current is racing straight from + to − with almost zero resistance, overheating the battery and wires.',
      formulaLabel: isPl ? 'Prawo Ohma (Zwarcie)' : "Ohm's Law (Short Circuit)",
      formulaEquation: 'I = V / R',
      formulaPluggedIn: isPl
        ? `I ≈ ${vs.toFixed(1)}V / ~1Ω = ${vs.toFixed(1)}A (Niebezpiecznie dużo!)`
        : `I ≈ ${vs.toFixed(1)}V / ~1Ω = ${vs.toFixed(1)}A (Dangerously high!)`,
      tip: isPl
        ? 'Wstaw w obwód odbiornik lub rezystor, aby ograniczyć prąd.'
        : 'Put a resistor or load in the loop so current has work to do.',
    });
  }

  for (const comp of board.components) {
    const t = componentStates[comp.id];
    if (!t) continue;

    if (comp.kind === 'resistor' && (comp.burnedOut || t.overloaded)) {
      const r = comp.resistance ?? 100;
      const pMax = comp.maxPower ?? 0.6;
      diagnostics.push({
        id: `res-over-${comp.id}`,
        severity: 'danger',
        title: comp.burnedOut
          ? isPl
            ? `Rezystor ${formatOhms(r)} spalony!`
            : `${formatOhms(r)} Resistor Toasted!`
          : isPl
          ? `Rezystor ${formatOhms(r)} przegrzewa się!`
          : `${formatOhms(r)} Resistor Overheating!`,
        summary: isPl
          ? `Wydziela się na nim ${formatPower(t.power)}, a jego limit mocy to ${formatPower(pMax)}.`
          : `It is dissipating ${formatPower(t.power)}, exceeding its ${formatPower(pMax)} wattage rating.`,
        formulaLabel: isPl ? 'Moc wydzielana na rezystorze' : 'Resistor Power Dissipation',
        formulaEquation: 'P = I² × R = V² / R',
        formulaPluggedIn: `P = (${Math.abs(t.voltageDrop).toFixed(1)}V)² / ${r}Ω = ${formatPower(t.power)} > ${formatPower(pMax)}`,
        tip: isPl
          ? 'Rozdziel prąd równolegle przez dwa rezystory (każdy weźmie połowę prądu i 1/4 mocy!).'
          : 'Split current across two resistors in parallel so each handles half the current and a fraction of the heat!',
        componentId: comp.id,
      });
    }

    if (comp.kind === 'led') {
      const spec = LED_SPECS[comp.ledColor ?? 'red'];
      const ledName = spec.label[lang];
      if (comp.burnedOut || t.overloaded) {
        const targetI = 0.02;
        const recommendedR = Math.max(47, Math.ceil((vs - spec.vf) / targetI / 10) * 10);
        diagnostics.push({
          id: `led-over-${comp.id}`,
          severity: 'danger',
          title: comp.burnedOut
            ? isPl
              ? `${ledName} spalona!`
              : `${ledName} Popped!`
            : isPl
            ? `${ledName} przeciążona!`
            : `${ledName} Overloaded!`,
          summary: comp.burnedOut
            ? isPl
              ? 'Przez diodę popłynął zbyt duży prąd (limit 35 mA). Dodaj rezystor szeregowo.'
              : 'Too much current rushed through the LED (max is 35 mA). Add a resistor in series.'
            : isPl
            ? `Natężenie wynosi ${formatCurrent(t.current)} — powyżej limitu 35 mA!`
            : `Current is ${formatCurrent(t.current)}, above the 35 mA safe limit!`,
          formulaLabel: isPl ? 'Rezystor ograniczający prąd' : 'Current-Limiting Resistor',
          formulaEquation: 'R = (Vs − Vf) / I',
          formulaPluggedIn: `R = (${vs.toFixed(1)}V − ${spec.vf.toFixed(1)}V) / 0.020A = ${recommendedR}Ω`,
          tip: isPl
            ? `Użyj rezystora około ${recommendedR}Ω szeregowo z tą diodą, a potem kliknij Wymień LED.`
            : `Try a resistor around ${recommendedR}Ω in series with this LED, then tap Replace LED.`,
          componentId: comp.id,
        });
      } else if (t.reverseBiased) {
        diagnostics.push({
          id: `led-rev-${comp.id}`,
          severity: 'warn',
          title: isPl ? `${ledName} podłączona odwrotnie` : `${ledName} is Backwards`,
          summary: isPl
            ? 'Diody LED przewodzą tylko od + (anody) do − (katody ze ściętą krawędzią).'
            : 'LEDs are one-way valves (diodes). Current only flows from + (anode) to − (cathode).',
          formulaLabel: isPl ? 'Polaryzacja diody' : 'Diode Polarity',
          formulaEquation: 'Va − Vc ≥ Vf',
          formulaPluggedIn: isPl
            ? `Obecnie ${formatVoltage(t.voltageDrop)} (wymaga ≥ +${spec.vf.toFixed(1)}V)`
            : `Currently ${formatVoltage(t.voltageDrop)} (needs ≥ +${spec.vf.toFixed(1)}V)`,
          tip: isPl
            ? 'Dotknij diody i naciśnij „Odwróć +/−”.'
            : 'Tap the LED and press Flip +/− to reverse its direction.',
          componentId: comp.id,
        });
      } else if (!t.active && t.voltageDrop > 0.3 && t.voltageDrop < spec.vf) {
        diagnostics.push({
          id: `led-lowv-${comp.id}`,
          severity: 'info',
          title: isPl ? `${ledName} potrzebuje wyższego napięcia` : `${ledName} Needs More Voltage`,
          summary: isPl
            ? `Do diody dociera tylko ${formatVoltage(t.voltageDrop)}, a wymaga minimum ${spec.vf.toFixed(1)}V.`
            : `Only ${formatVoltage(t.voltageDrop)} is reaching this LED, but it needs at least ${spec.vf.toFixed(1)}V.`,
          formulaLabel: isPl ? 'Napięcie przewodzenia' : 'Forward Voltage Threshold',
          formulaEquation: 'V_LED ≥ Vf',
          formulaPluggedIn: `${formatVoltage(t.voltageDrop)} < ${spec.vf.toFixed(1)}V`,
          tip: isPl
            ? 'W układzie równoległym każda gałąź dostaje pełne napięcie baterii.'
            : 'In parallel, each branch gets the full battery voltage.',
          componentId: comp.id,
        });
      }
    }

    if (comp.kind === 'inductor' && t.spikeDetected) {
      diagnostics.push({
        id: `ind-spike-${comp.id}`,
        severity: 'warn',
        title: isPl ? 'Przepięcie samoindukcji (Kickback)!' : 'Inductive Flyback Spike!',
        summary: isPl
          ? `Nagłe przerwanie prądu cewki wywołało impuls ${formatVoltage(Math.abs(t.voltageDrop))}!`
          : `Cutting inductor current suddenly caused a ${formatVoltage(Math.abs(t.voltageDrop))} kickback spike!`,
        formulaLabel: isPl ? 'Napięcie samoindukcji' : 'Inductive Kickback',
        formulaEquation: 'V = L × (dI / dt)',
        formulaPluggedIn: `|V_spike| ≈ ${formatVoltage(Math.abs(t.voltageDrop))}`,
        tip: isPl
          ? 'Podłącz diodę krzemową równolegle do cewki (zaporowo, kreską do +), aby bezpiecznie rozproszyć energię.'
          : 'Wire a silicon diode in reverse-parallel across the coil (silver band to +) to clamp the spike safely.',
        componentId: comp.id,
      });
    }

    if (comp.kind === 'motor' && t.overloaded) {
      diagnostics.push({
        id: `motor-over-${comp.id}`,
        severity: 'warn',
        title: isPl ? 'Silnik kręci się za szybko!' : 'Motor Spinning Too Fast!',
        summary: isPl
          ? `Wiatrak dostaje ${formatVoltage(Math.abs(t.voltageDrop))} (bezpieczne maksimum to 9V).`
          : `The fan motor is getting ${formatVoltage(Math.abs(t.voltageDrop))} (safe max is 9V).`,
        formulaLabel: isPl ? 'Spadek napięcia' : 'Voltage Drop',
        formulaEquation: 'V_motor = I × R_motor',
        formulaPluggedIn: `${formatVoltage(Math.abs(t.voltageDrop))} / ${MOTOR_RESISTANCE}Ω`,
        tip: isPl
          ? 'Dodaj niewielki rezystor (np. 47Ω) szeregowo z silnikiem.'
          : 'Add a small resistor (e.g. 47Ω) in series with the motor.',
        componentId: comp.id,
      });
    }
  }

  return {
    nodeVoltages,
    componentStates,
    wireStates,
    shortCircuit,
    totalPower,
    diagnostics,
  };
}

function nB_safe(idx: number): number {
  return idx;
}

/** Steady-state DC MNA solver (used for Tiers 1–3 and static analysis) */
export function solveCircuit(
  board: CircuitBoardState,
  lang: Language = 'en',
  env: EnvironmentState = DEFAULT_ENVIRONMENT,
  initialVoltages?: Record<string, number>
): SimulationResult {
  return solveUnified(board, { lang, env, initialVoltages });
}

/** Fixed-timestep Backward-Euler transient solver (used for Tier 4 capacitors, inductors, oscillators & AC) */
export function stepTransientCircuit(
  board: CircuitBoardState,
  memory: TransientMemory,
  dt: number,
  lang: Language = 'en',
  env: EnvironmentState = DEFAULT_ENVIRONMENT
): SimulationResult {
  memory.time += dt;
  return solveUnified(board, { lang, env, transient: { memory, dt } });
}
