import type { Language } from '../core/i18n';
import {
  type CircuitBoardState,
  type ComponentTelemetry,
  type DiagnosticInsight,
  type LedColor,
  type SimulationResult,
  type WireTelemetry,
  coordKey,
} from './types';
import { formatCurrent, formatOhms, formatVoltage } from './resistorColors';

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

const WIRE_RESISTANCE = 0.02; // Ohms — small enough for real accuracy, gives exact per-wire KCL current
const OPEN_RESISTANCE = 1e8; // Ohms for open switches / burned-out parts
const DIODE_OFF_RESISTANCE = 1e7; // Ohms for reverse/cutoff LED
const BLEED_CONDUCTANCE = 1e-9; // Ensures floating islands never make the matrix singular
const MOTOR_RESISTANCE = 25; // Ohms (small hobby DC fan motor)
const MOTOR_MIN_VOLTAGE = 1.2; // Volts to overcome static friction
const MOTOR_MAX_VOLTAGE = 9.5; // Volts overdriven threshold
const BUZZER_RESISTANCE = 150; // Ohms (active piezo transducer)
const BUZZER_MIN_VOLTAGE = 1.8; // Volts to trigger tone

function getBatteryInternalResistance(voltage: number): number {
  if (voltage >= 8) return 1.0; // Typical 9V alkaline block
  if (voltage >= 5) return 0.7; // 4xAA 6V pack
  return 0.5; // 2xAA 3V pack
}

/**
 * Dense Gaussian elimination with partial pivoting for G * v = i.
 * Board grids have <= ~50 active nodes, so this executes in < 0.05ms.
 */
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

    if (maxAbs < 1e-14) {
      continue;
    }

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

/**
 * Real DC Nodal Analysis solver with iterative piecewise-linear LED convergence.
 * Computes node voltages, signed per-component and per-wire currents, power,
 * burnout/short states, and localized educational diagnostics with plugged-in live math.
 */
export function solveCircuit(board: CircuitBoardState, lang: Language = 'en'): SimulationResult {
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

  const firstBattery = board.components.find((c) => c.kind === 'battery' && !c.burnedOut);
  const groundIdx = firstBattery ? registerNode(coordKey(firstBattery.b)) : 0;

  const ledConducting = new Map<string, boolean>();
  for (const comp of board.components) {
    if (comp.kind === 'led' && !comp.burnedOut) {
      ledConducting.set(comp.id, true);
    }
  }

  let voltages: Float64Array<ArrayBufferLike> = new Float64Array(nodeCount);
  const maxIterations = 24;

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

    for (const wire of board.wires) {
      const n1 = nodeIndex.get(coordKey(wire.a))!;
      const n2 = nodeIndex.get(coordKey(wire.b))!;
      if (n1 !== n2) {
        stampResistor(n1, n2, WIRE_RESISTANCE);
      }
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
          const rInt = getBatteryInternalResistance(v);
          stampNortonSource(nA, nB, v, rInt);
          break;
        }
        case 'resistor':
        case 'rheostat': {
          const r = Math.max(1, comp.resistance ?? 220);
          stampResistor(nA, nB, r);
          break;
        }
        case 'switch_toggle':
        case 'switch_push': {
          stampResistor(nA, nB, comp.closed ? 0.05 : OPEN_RESISTANCE);
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
          if (ledConducting.get(comp.id)) {
            stampNortonSource(nA, nB, spec.vf, spec.dynamicR);
          } else {
            stampResistor(nA, nB, DIODE_OFF_RESISTANCE);
          }
          break;
        }
      }
    }

    for (let c = 0; c < nodeCount; c++) {
      G[groundIdx][c] = 0;
    }
    G[groundIdx][groundIdx] = 1;
    I[groundIdx] = 0;

    voltages = solveLinearSystem(G, I);

    let changed = false;
    for (const comp of board.components) {
      if (comp.kind !== 'led' || comp.burnedOut) continue;
      const spec = LED_SPECS[comp.ledColor ?? 'red'];
      const nA = nodeIndex.get(coordKey(comp.a))!;
      const nB = nodeIndex.get(coordKey(comp.b))!;
      const vDrop = voltages[nA] - voltages[nB];
      const wasOn = ledConducting.get(comp.id) ?? false;

      if (wasOn) {
        const iForward = (vDrop - spec.vf) / spec.dynamicR;
        if (iForward < -1e-6) {
          ledConducting.set(comp.id, false);
          changed = true;
        }
      } else {
        if (vDrop > spec.vf + 1e-4) {
          ledConducting.set(comp.id, true);
          changed = true;
        }
      }
    }

    if (!changed) break;
  }

  const nodeVoltages: Record<string, number> = {};
  for (let i = 0; i < nodeCount; i++) {
    nodeVoltages[indexToKey[i]] = Math.abs(voltages[i]) < 1e-5 ? 0 : voltages[i];
  }

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
    let active = false;
    let intensity = 0;
    let motorSpeed = 0;
    let overloaded = false;
    let reverseBiased = false;
    let shorted = false;
    let effectiveResistance = OPEN_RESISTANCE;
    let statusText = isPl ? 'Spoczynek' : 'Idle';

    if (comp.burnedOut) {
      statusText = isPl ? 'Spalona!' : 'Burned out!';
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
            statusText = isPl
              ? `Zwarcie! (${formatCurrent(draw)})`
              : `Short circuit! (${formatCurrent(draw)})`;
          } else if (active) {
            statusText = isPl
              ? `Zasila ${formatCurrent(draw)}`
              : `Supplying ${formatCurrent(draw)}`;
          } else {
            statusText = isPl ? `${vNom}V Gotowa` : `${vNom}V Ready`;
          }
          break;
        }
        case 'resistor':
        case 'rheostat': {
          const r = Math.max(1, comp.resistance ?? 220);
          current = vDrop / r;
          effectiveResistance = r;
          const p = Math.abs(vDrop * current);
          active = Math.abs(current) > 0.0005;
          if (p > 0.6) {
            overloaded = true;
            statusText = isPl
              ? `Przegrzewa się! (${(p * 1000).toFixed(0)}mW)`
              : `Overheating! (${(p * 1000).toFixed(0)}mW)`;
          } else if (active) {
            statusText = `${formatOhms(r)} • ${formatCurrent(current)}`;
          } else {
            statusText = `${formatOhms(r)}`;
          }
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
        case 'led': {
          const spec = LED_SPECS[comp.ledColor ?? 'red'];
          const isOn = ledConducting.get(comp.id) ?? false;
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
            statusText = isPl
              ? `Brzęczy (${formatVoltage(absV)})`
              : `Buzzing (${formatVoltage(absV)})`;
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
      }
    }

    componentStates[comp.id] = {
      id: comp.id,
      current,
      voltageDrop: vDrop,
      power: Math.abs(vDrop * current),
      active,
      intensity,
      motorSpeed,
      overloaded,
      reverseBiased,
      shorted,
      effectiveResistance,
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
    wireStates[wire.id] = {
      id: wire.id,
      current,
      overloaded,
    };
  }

  const sourceBattery = board.components.find((c) => c.kind === 'battery' && !c.burnedOut);
  const vs = sourceBattery?.voltage ?? 3;

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
        ? 'Wstaw w obwód odbiornik lub rezystor (np. silnik albo rezystor z diodą LED), aby prąd miał co zasilać.'
        : 'Put a resistor or load (like a motor or resistor + LED) in the loop so current has work to do.',
    });
  }

  for (const comp of board.components) {
    const t = componentStates[comp.id];
    if (!t) continue;

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
              ? 'Przez diodę popłynął zbyt duży prąd (bezpieczny limit to 35 mA). Dodaj rezystor szeregowo, by go ograniczyć.'
              : 'Too much current rushed through the LED (max is 35 mA). Add a resistor in series to tame it.'
            : isPl
            ? `Natężenie wynosi ${formatCurrent(t.current)} — znacznie powyżej limitu 35 mA!`
            : `Current is ${formatCurrent(t.current)}, well above the 35 mA safe limit!`,
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
            ? 'Diody LED działają jak zawór jednokierunkowy. Prąd płynie tylko od + (anody) do − (katody ze ściętą krawędzią).'
            : 'LEDs are one-way valves (diodes). Current only flows from + (anode) to − (cathode, flat side).',
          formulaLabel: isPl ? 'Polaryzacja diody' : 'Diode Polarity',
          formulaEquation: 'Va − Vc ≥ Vf',
          formulaPluggedIn: isPl
            ? `Obecnie ${formatVoltage(t.voltageDrop)} (wymaga ≥ +${spec.vf.toFixed(1)}V)`
            : `Currently ${formatVoltage(t.voltageDrop)} (needs ≥ +${spec.vf.toFixed(1)}V)`,
          tip: isPl
            ? 'Dotknij diody i naciśnij „Odwróć +/−”, aby zamienić jej kierunek.'
            : 'Tap the LED and press Flip +/− to reverse its direction.',
          componentId: comp.id,
        });
      } else if (!t.active && t.voltageDrop > 0.3 && t.voltageDrop < spec.vf) {
        diagnostics.push({
          id: `led-lowv-${comp.id}`,
          severity: 'info',
          title: isPl ? `${ledName} potrzebuje wyższego napięcia` : `${ledName} Needs More Voltage`,
          summary: isPl
            ? `Do diody dociera tylko ${formatVoltage(t.voltageDrop)}, a ${ledName.toLowerCase()} wymaga minimum ${spec.vf.toFixed(1)}V.`
            : `Only ${formatVoltage(t.voltageDrop)} is reaching this LED, but a ${ledName} needs at least ${spec.vf.toFixed(1)}V to light up.`,
          formulaLabel: isPl ? 'Napięcie przewodzenia' : 'Forward Voltage Threshold',
          formulaEquation: 'V_LED ≥ Vf',
          formulaPluggedIn: isPl
            ? `${formatVoltage(t.voltageDrop)} < ${spec.vf.toFixed(1)}V (Wskazówka: spróbuj połączenia równoległego!)`
            : `${formatVoltage(t.voltageDrop)} < ${spec.vf.toFixed(1)}V (Hint: Try parallel branches instead of series!)`,
          tip: isPl
            ? 'W połączeniu szeregowym diody dzielą się napięciem. W równoległym każda gałąź dostaje pełne napięcie baterii.'
            : 'In series, LEDs share voltage. In parallel, each branch gets the full battery voltage.',
          componentId: comp.id,
        });
      }
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
        formulaPluggedIn: isPl
          ? `${formatVoltage(Math.abs(t.voltageDrop))} na oporze ${MOTOR_RESISTANCE}Ω`
          : `${formatVoltage(Math.abs(t.voltageDrop))} across ${MOTOR_RESISTANCE}Ω`,
        tip: isPl
          ? 'Dodaj niewielki rezystor (np. 47Ω) szeregowo z silnikiem, aby obniżyć obroty.'
          : 'Add a small resistor (e.g. 47Ω) in series with the motor to bring its speed into the safe zone.',
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
