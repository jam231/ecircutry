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
  | 'motor'
  | 'buzzer'
  | 'rheostat';

export type LedColor = 'red' | 'green' | 'amber' | 'blue';

export type WireColor = 'red' | 'black' | 'blue' | 'amber' | 'green';

export interface CircuitComponent {
  id: string;
  kind: ComponentKind;
  /** Positive / anode terminal for polarized parts (battery +, LED +, motor +) */
  a: GridCoord;
  /** Negative / cathode terminal for polarized parts */
  b: GridCoord;
  /** Locked pre-placed components cannot be deleted in puzzle levels */
  locked?: boolean;
  /** Battery nominal voltage in Volts (e.g. 3, 6, 9) */
  voltage?: number;
  /** Resistance in Ohms (for resistor & rheostat current setting) */
  resistance?: number;
  /** Minimum / maximum Ohms for rheostat slider */
  rheostatMin?: number;
  rheostatMax?: number;
  /** LED color (also determines realistic forward voltage Vf) */
  ledColor?: LedColor;
  /** Switch closed state (toggle or momentary push) */
  closed?: boolean;
  /** Permanently popped until reset/replaced */
  burnedOut?: boolean;
  /** Optional short badge label (e.g. "S1", "S2") */
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

export interface ComponentTelemetry {
  id: string;
  /** Signed current from terminal a -> b in Amperes */
  current: number;
  /** Voltage difference Va - Vb in Volts */
  voltageDrop: number;
  /** Power dissipated or delivered in Watts (|V * I|) */
  power: number;
  /** Whether load is meaningfully energized */
  active: boolean;
  /** 0..1 normalized brightness for LEDs, 0..1 loudness for buzzers */
  intensity: number;
  /** Signed angular velocity factor for DC motor (-1..+1, can exceed 1 if overdriven) */
  motorSpeed: number;
  /** Current exceeds safe rating right now */
  overloaded: boolean;
  /** LED is reverse-biased with noticeable voltage */
  reverseBiased: boolean;
  /** Battery or element experiencing a short circuit */
  shorted: boolean;
  /** Effective resistance seen in solver */
  effectiveResistance: number;
  /** Concise human-friendly status */
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

export interface TrayItemTemplate {
  templateId: string;
  kind: ComponentKind;
  name: string;
  shortLabel: string;
  voltage?: number;
  resistance?: number;
  rheostatMin?: number;
  rheostatMax?: number;
  ledColor?: LedColor;
  /** null = unlimited (sandbox) */
  limit: number | null;
}

export type AppMode = 'adult' | 'kid';

export interface GoalCheckItem {
  id: string;
  label: string;
  /** Visual icon key for zero-reading Kid Mode */
  icon: 'led_red' | 'led_green' | 'led_amber' | 'led_blue' | 'motor' | 'buzzer' | 'switch' | 'meter' | 'shield';
  satisfied: boolean;
}

export interface LevelDefinition {
  id: string;
  mode: AppMode;
  order: number;
  title: string;
  subtitle: string;
  conceptTag: string;
  isSandbox?: boolean;
  cols: number;
  rows: number;
  initialComponents: CircuitComponent[];
  initialWires: JumperWire[];
  tray: TrayItemTemplate[];
  /** Optional guided wire hint for first-time kids/learners */
  guideWire?: { a: GridCoord; b: GridCoord }[];
  /** Bite-sized adult concept card for the "Why? (Show Math)" drawer */
  lesson: {
    principle: string;
    formula: string;
    explanation: string;
  };
  /** Dynamic goal evaluator returning visual checklist + solved flag */
  evaluate: (
    board: CircuitBoardState,
    sim: SimulationResult,
    history: LevelInteractionHistory
  ) => {
    goals: GoalCheckItem[];
    solved: boolean;
    hint?: string;
  };
  /** Par part count (components + wires placed by user) for 3-star efficiency */
  parUserItems?: number;
}

export interface LevelInteractionHistory {
  /** Tracks multi-state observations (e.g. switch toggled ON and OFF) */
  flags: Record<string, boolean>;
  burnoutCount: number;
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
