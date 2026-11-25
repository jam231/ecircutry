import type { Language, LocalizedText } from '../core/i18n';

export interface GridCoord {
  col: number;
  row: number;
}

export type ComponentKind =
  | 'battery'
  | 'resistor'
  | 'led'
  | 'switch_toggle'
  | 'switch_push'
  | 'switch_spdt'
  | 'motor'
  | 'buzzer'
  | 'rheostat'
  | 'ldr'
  | 'thermistor'
  | 'diode'
  | 'transistor_npn'
  | 'capacitor'
  | 'inductor'
  | 'ac_source';

export type LedColor = 'red' | 'green' | 'amber' | 'blue';

export type WireColor = 'red' | 'black' | 'blue' | 'amber' | 'green';

export type AcWaveform = 'sine' | 'square' | 'triangle';

export type TierId = 1 | 2 | 3 | 4;

export interface EnvironmentState {
  /** Ambient light: 0 = dark night, 1 = bright sun */
  lightLevel: number;
  /** Ambient temperature: 0 = cold (0°C), 1 = hot (100°C) */
  temperature: number;
}

export const DEFAULT_ENVIRONMENT: EnvironmentState = {
  lightLevel: 0.7,
  temperature: 0.25,
};

export interface CircuitComponent {
  id: string;
  kind: ComponentKind;
  /**
   * Terminal A:
   * - Polarized 2-pin: + / Anode / Motor + / Cap + / AC +
   * - 3-pin SPDT: Throw 1 (connected to Common when closed=false)
   * - 3-pin NPN BJT: Collector (C)
   */
  a: GridCoord;
  /**
   * Terminal B:
   * - Polarized 2-pin: − / Cathode / Motor − / Cap − / AC −
   * - 3-pin SPDT: Throw 2 (connected to Common when closed=true)
   * - 3-pin NPN BJT: Emitter (E)
   */
  b: GridCoord;
  /**
   * Optional 3rd center terminal C (collinear midpoint between A and B):
   * - 3-pin SPDT: Common (COM)
   * - 3-pin NPN BJT: Base (B)
   */
  c?: GridCoord;
  /** Locked pre-placed components cannot be deleted in puzzle levels */
  locked?: boolean;
  /** Battery nominal voltage in Volts (e.g. 3, 6, 9) */
  voltage?: number;
  /** Resistance in Ohms (for resistor & rheostat current setting) */
  resistance?: number;
  /** Maximum rated power in Watts for resistors (default 0.6W; 0.25W in wattage labs) */
  maxPower?: number;
  /** Minimum / maximum Ohms for rheostat slider */
  rheostatMin?: number;
  rheostatMax?: number;
  /** LED color (also determines realistic forward voltage Vf) */
  ledColor?: LedColor;
  /** Switch closed state (toggle, momentary push, or SPDT throw selector) */
  closed?: boolean;
  /** Permanently popped/burned until reset/replaced */
  burnedOut?: boolean;
  /** Capacitance in Farads (e.g. 100e-6 = 100µF, 1000e-6 = 1000µF) */
  capacitance?: number;
  /** Inductance in Henrys (e.g. 0.05 = 50mH, 0.2 = 200mH) */
  inductance?: number;
  /** AC generator waveform */
  waveform?: AcWaveform;
  /** AC generator frequency in Hz */
  frequency?: number;
  /** AC generator peak amplitude in Volts */
  amplitude?: number;
  /** Optional short badge label (e.g. "S1", "Q1", "Vout") */
  label?: string;
}

export interface JumperWire {
  id: string;
  a: GridCoord;
  b: GridCoord;
  color: WireColor;
  locked?: boolean;
}

export interface CircuitBoardState {
  cols: number;
  rows: number;
  components: CircuitComponent[];
  wires: JumperWire[];
}

export interface TransientMemory {
  /** Simulated elapsed time in seconds */
  time: number;
  /** Capacitor voltage Va - Vb keyed by component id */
  capVoltages: Record<string, number>;
  /** Inductor current a -> b keyed by component id */
  indCurrents: Record<string, number>;
  /** Previous node voltages for warm-starting Newton-Raphson (vital for bistable latches & oscillators) */
  prevNodeVoltages: Record<string, number>;
  /** Peak inductive spike voltage observed across each inductor */
  peakInductorSpikes: Record<string, number>;
}

export function createTransientMemory(): TransientMemory {
  return {
    time: 0,
    capVoltages: {},
    indCurrents: {},
    prevNodeVoltages: {},
    peakInductorSpikes: {},
  };
}

export interface ComponentTelemetry {
  id: string;
  /** Signed primary current (a -> b, or Collector current Ic for NPN, or Common current for SPDT) */
  current: number;
  /** Optional Base current Ib for NPN transistors */
  baseCurrent?: number;
  /** Voltage difference Va - Vb in Volts (Vce for NPN) */
  voltageDrop: number;
  /** Optional Base-Emitter voltage Vbe for NPN transistors */
  vbe?: number;
  /** Power dissipated or delivered in Watts */
  power: number;
  /** Whether load / transistor is meaningfully energized */
  active: boolean;
  /** 0..1 normalized brightness for LEDs, loudness for buzzers, or charge ratio for capacitors */
  intensity: number;
  /** Signed angular velocity factor for DC motor */
  motorSpeed: number;
  /** Current or power exceeds safe rating right now */
  overloaded: boolean;
  /** LED or Diode is reverse-biased with noticeable voltage */
  reverseBiased: boolean;
  /** Battery or element experiencing a short circuit */
  shorted: boolean;
  /** Effective resistance seen in solver */
  effectiveResistance: number;
  /** Capacitor stored voltage or Inductor current for HUD display */
  storedValue?: number;
  /** Peak inductive spike detected on switch-off */
  spikeDetected?: boolean;
  /** Concise localized status */
  statusText: string;
}

export interface WireTelemetry {
  id: string;
  /** Signed current from wire.a -> wire.b in Amperes */
  current: number;
  overloaded: boolean;
}

export interface DiagnosticInsight {
  id: string;
  severity: 'info' | 'warn' | 'danger' | 'success';
  title: string;
  summary: string;
  formulaLabel?: string;
  formulaEquation?: string;
  formulaPluggedIn?: string;
  tip?: string;
  componentId?: string;
}

export interface SimulationResult {
  /** Voltage at each socket keyed by "col,row" */
  nodeVoltages: Record<string, number>;
  componentStates: Record<string, ComponentTelemetry>;
  wireStates: Record<string, WireTelemetry>;
  shortCircuit: boolean;
  totalPower: number;
  diagnostics: DiagnosticInsight[];
}

export interface ScopeSample {
  t: number;
  ch1: number;
  ch2: number;
}

export interface BodePoint {
  freq: number;
  gainDb: number;
  magnitude: number;
  phaseDeg: number;
}

export interface AcSweepResult {
  points: BodePoint[];
  cutoffHz: number | null;
  resonantPeakHz: number | null;
  peakGainDb: number;
  gainAtCurrentFreqDb: number;
  phaseAtCurrentFreqDeg: number;
}

export interface TrayItemTemplate {
  templateId: string;
  kind: ComponentKind;
  name: LocalizedText;
  shortLabel: LocalizedText;
  voltage?: number;
  resistance?: number;
  maxPower?: number;
  rheostatMin?: number;
  rheostatMax?: number;
  ledColor?: LedColor;
  capacitance?: number;
  inductance?: number;
  waveform?: AcWaveform;
  frequency?: number;
  amplitude?: number;
  /** null = unlimited (sandbox) */
  limit: number | null;
}

export type AppMode = 'adult' | 'kid';

export interface GoalCheckItem {
  id: string;
  label: string;
  /** Visual icon key for zero-reading Kid Mode */
  icon:
    | 'led_red'
    | 'led_green'
    | 'led_amber'
    | 'led_blue'
    | 'motor'
    | 'buzzer'
    | 'switch'
    | 'meter'
    | 'shield'
    | 'sun'
    | 'fire'
    | 'chip'
    | 'wave'
    | 'bolt';
  satisfied: boolean;
}

export interface LevelInteractionHistory {
  /** Tracks multi-state observations (e.g. fade seen, blink count, latch states) */
  flags: Record<string, boolean>;
  /** Numeric counters for transient observations (e.g. blink toggles, peak spike) */
  metrics: Record<string, number>;
  burnoutCount: number;
}

export interface LevelDefinition {
  id: string;
  mode: AppMode;
  tier: TierId;
  order: number;
  title: LocalizedText;
  subtitle: LocalizedText;
  conceptTag: LocalizedText;
  /** Spoken voice prompt when narrating this mission/lab */
  narrationPrompt: LocalizedText;
  isSandbox?: boolean;
  cols: number;
  rows: number;
  initialComponents: CircuitComponent[];
  initialWires: JumperWire[];
  tray: TrayItemTemplate[];
  /** Optional initial environment override (e.g. start at daylight or cool) */
  initialEnvironment?: Partial<EnvironmentState>;
  /** Optional default Oscilloscope probes & mode for Tier 4 labs */
  defaultScope?: {
    open?: boolean;
    mode?: 'time' | 'bode';
    ch1?: GridCoord;
    ch2?: GridCoord;
    timeScale?: number;
  };
  /** Optional guided wire hint for first-time kids/learners */
  guideWire?: { a: GridCoord; b: GridCoord }[];
  /** Bite-sized concept card for the "Why? (Show Math)" drawer & victory narration */
  lesson: {
    principle: LocalizedText;
    formula: LocalizedText;
    explanation: LocalizedText;
  };
  /** Dynamic goal evaluator returning visual checklist + solved flag */
  evaluate: (
    board: CircuitBoardState,
    sim: SimulationResult,
    history: LevelInteractionHistory,
    lang?: Language,
    env?: EnvironmentState
  ) => {
    goals: GoalCheckItem[];
    solved: boolean;
    hint?: string;
  };
  /** Par part count (components + wires placed by user) for 3-star efficiency */
  parUserItems?: number;
}

export function isThreeTerminal(kind: ComponentKind): boolean {
  return kind === 'switch_spdt' || kind === 'transistor_npn';
}

export function isReactiveBoard(board: CircuitBoardState): boolean {
  return board.components.some(
    (c) => c.kind === 'capacitor' || c.kind === 'inductor' || c.kind === 'ac_source'
  );
}

export function coordKey(c: GridCoord): string {
  return `${c.col},${c.row}`;
}

export function coordsEqual(a: GridCoord, b: GridCoord): boolean {
  return a.col === b.col && a.row === b.row;
}

export function isAdjacent(a: GridCoord, b: GridCoord): boolean {
  const dc = Math.abs(a.col - b.col);
  const dr = Math.abs(a.row - b.row);
  return dc + dr === 1;
}

export function edgeKey(a: GridCoord, b: GridCoord): string {
  const k1 = coordKey(a);
  const k2 = coordKey(b);
  return k1 < k2 ? `${k1}|${k2}` : `${k2}|${k1}`;
}

/** Returns all 1-step grid edges occupied by a 2-pin or 3-pin component */
export function getComponentOccupiedEdges(comp: CircuitComponent): string[] {
  if (comp.c) {
    return [edgeKey(comp.a, comp.c), edgeKey(comp.c, comp.b)];
  }
  const dc = comp.b.col - comp.a.col;
  const dr = comp.b.row - comp.a.row;
  const steps = Math.max(Math.abs(dc), Math.abs(dr));
  if (steps <= 1) {
    return [edgeKey(comp.a, comp.b)];
  }
  const edges: string[] = [];
  const sc = Math.sign(dc);
  const sr = Math.sign(dr);
  for (let i = 0; i < steps; i++) {
    const p1 = { col: comp.a.col + sc * i, row: comp.a.row + sr * i };
    const p2 = { col: comp.a.col + sc * (i + 1), row: comp.a.row + sr * (i + 1) };
    edges.push(edgeKey(p1, p2));
  }
  return edges;
}
