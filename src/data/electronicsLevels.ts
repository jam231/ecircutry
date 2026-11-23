import { solveCircuit } from '../engine/circuitSolver';
import type {
  CircuitBoardState,
  CircuitComponent,
  LevelDefinition,
  TrayItemTemplate,
} from '../engine/types';
import { stemRegistry } from '../core/stemModule';

const SANDBOX_TRAY_ADULT: TrayItemTemplate[] = [
  { templateId: 'bat-3v', kind: 'battery', name: '3V Battery', shortLabel: '3V', voltage: 3, limit: null },
  { templateId: 'bat-6v', kind: 'battery', name: '6V Battery', shortLabel: '6V', voltage: 6, limit: null },
  { templateId: 'bat-9v', kind: 'battery', name: '9V Battery', shortLabel: '9V', voltage: 9, limit: null },
  { templateId: 'res-47', kind: 'resistor', name: '47Ω Resistor', shortLabel: '47Ω', resistance: 47, limit: null },
  { templateId: 'res-100', kind: 'resistor', name: '100Ω Resistor', shortLabel: '100Ω', resistance: 100, limit: null },
  { templateId: 'res-220', kind: 'resistor', name: '220Ω Resistor', shortLabel: '220Ω', resistance: 220, limit: null },
  { templateId: 'res-330', kind: 'resistor', name: '330Ω Resistor', shortLabel: '330Ω', resistance: 330, limit: null },
  { templateId: 'res-1k', kind: 'resistor', name: '1kΩ Resistor', shortLabel: '1kΩ', resistance: 1000, limit: null },
  {
    templateId: 'rheo',
    kind: 'rheostat',
    name: 'Dimmer (20Ω–1kΩ)',
    shortLabel: 'Dimmer',
    resistance: 330,
    rheostatMin: 20,
    rheostatMax: 1000,
    limit: null,
  },
  { templateId: 'led-red', kind: 'led', name: 'Red LED', shortLabel: 'Red LED', ledColor: 'red', limit: null },
  { templateId: 'led-green', kind: 'led', name: 'Green LED', shortLabel: 'Green LED', ledColor: 'green', limit: null },
  { templateId: 'led-amber', kind: 'led', name: 'Amber LED', shortLabel: 'Amber LED', ledColor: 'amber', limit: null },
  { templateId: 'led-blue', kind: 'led', name: 'Blue LED', shortLabel: 'Blue LED', ledColor: 'blue', limit: null },
  { templateId: 'sw-toggle', kind: 'switch_toggle', name: 'Toggle Switch', shortLabel: 'Switch', limit: null },
  { templateId: 'sw-push', kind: 'switch_push', name: 'Push Button', shortLabel: 'Button', limit: null },
  { templateId: 'motor', kind: 'motor', name: 'DC Fan Motor', shortLabel: 'Fan', limit: null },
  { templateId: 'buzzer', kind: 'buzzer', name: 'Piezo Buzzer', shortLabel: 'Buzzer', limit: null },
];

const SANDBOX_TRAY_KID: TrayItemTemplate[] = [
  { templateId: 'bat-3v', kind: 'battery', name: '3V Power', shortLabel: '3V', voltage: 3, limit: null },
  { templateId: 'bat-6v', kind: 'battery', name: '6V Power', shortLabel: '6V', voltage: 6, limit: null },
  { templateId: 'res-100', kind: 'resistor', name: 'Helper', shortLabel: '100Ω', resistance: 100, limit: null },
  { templateId: 'res-220', kind: 'resistor', name: 'Strong Helper', shortLabel: '220Ω', resistance: 220, limit: null },
  {
    templateId: 'rheo',
    kind: 'rheostat',
    name: 'Magic Dial',
    shortLabel: 'Dial',
    resistance: 220,
    rheostatMin: 40,
    rheostatMax: 800,
    limit: null,
  },
  { templateId: 'led-red', kind: 'led', name: 'Red Light', shortLabel: 'Red', ledColor: 'red', limit: null },
  { templateId: 'led-green', kind: 'led', name: 'Green Light', shortLabel: 'Green', ledColor: 'green', limit: null },
  { templateId: 'led-amber', kind: 'led', name: 'Yellow Light', shortLabel: 'Yellow', ledColor: 'amber', limit: null },
  { templateId: 'led-blue', kind: 'led', name: 'Blue Light', shortLabel: 'Blue', ledColor: 'blue', limit: null },
  { templateId: 'sw-toggle', kind: 'switch_toggle', name: 'Switch', shortLabel: 'Switch', limit: null },
  { templateId: 'sw-push', kind: 'switch_push', name: 'Button', shortLabel: 'Button', limit: null },
  { templateId: 'motor', kind: 'motor', name: 'Spinning Fan', shortLabel: 'Fan', limit: null },
  { templateId: 'buzzer', kind: 'buzzer', name: 'Buzzer', shortLabel: 'Buzzer', limit: null },
];

function cloneWithSwitchStates(
  board: CircuitBoardState,
  overrides: Record<string, boolean>
): CircuitBoardState {
  return {
    ...board,
    components: board.components.map((c: CircuitComponent) =>
      c.id in overrides ? { ...c, closed: overrides[c.id] } : c
    ),
  };
}

export const ADULT_LEVELS: LevelDefinition[] = [
  {
    id: 'adult-1-first-spark',
    mode: 'adult',
    order: 1,
    title: 'First Spark',
    subtitle: 'Complete a safe loop from the 3V battery through the 100Ω resistor and Red LED.',
    conceptTag: 'Closed Loops & Polarity',
    cols: 6,
    rows: 4,
    parUserItems: 4,
    initialComponents: [
      { id: 'bat', kind: 'battery', voltage: 3, a: { col: 1, row: 1 }, b: { col: 1, row: 2 }, locked: true },
      { id: 'led1', kind: 'led', ledColor: 'red', a: { col: 4, row: 1 }, b: { col: 4, row: 2 }, locked: true },
    ],
    initialWires: [],
    tray: [
      { templateId: 'res-100', kind: 'resistor', name: '100Ω Resistor', shortLabel: '100Ω', resistance: 100, limit: 1 },
    ],
    guideWire: [
      { a: { col: 1, row: 1 }, b: { col: 2, row: 1 } },
      { a: { col: 3, row: 1 }, b: { col: 4, row: 1 } },
      { a: { col: 4, row: 2 }, b: { col: 1, row: 2 } },
    ],
    lesson: {
      principle: 'Closed Circuit & Current Limiting',
      formula: 'I = (Vs − Vf) / R',
      explanation:
        'Electricity only flows in a complete loop from + back to −. An LED has almost no internal resistance once it turns on, so a resistor acts like a narrow valve keeping current in the safe 5–25 mA zone.',
    },
    evaluate: (_board, sim) => {
      const led = sim.componentStates['led1'];
      const ledSafe = Boolean(led && led.active && !led.overloaded && !sim.shortCircuit);
      return {
        goals: [
          { id: 'led', label: 'Light the Red LED safely', icon: 'led_red', satisfied: ledSafe },
          { id: 'safe', label: 'No shorts or blown parts', icon: 'shield', satisfied: !sim.shortCircuit && !led?.overloaded },
        ],
        solved: ledSafe,
        hint: !ledSafe ? 'Place the 100Ω resistor along the top row, then drag between sockets to snap jumper wires.' : undefined,
      };
    },
  },
  {
    id: 'adult-2-dont-pop',
    mode: 'adult',
    order: 2,
    title: "Don't Pop the Bulb",
    subtitle: 'A 9V battery packs a punch! Pick the right resistor so the Red LED glows in its 10–28 mA sweet spot.',
    conceptTag: "Ohm's Law",
    cols: 6,
    rows: 4,
    parUserItems: 4,
    initialComponents: [
      { id: 'bat', kind: 'battery', voltage: 9, a: { col: 1, row: 1 }, b: { col: 1, row: 2 }, locked: true },
      { id: 'led1', kind: 'led', ledColor: 'red', a: { col: 4, row: 1 }, b: { col: 4, row: 2 }, locked: true },
    ],
    initialWires: [],
    tray: [
      { templateId: 'res-47', kind: 'resistor', name: '47Ω Resistor', shortLabel: '47Ω', resistance: 47, limit: 1 },
      { templateId: 'res-330', kind: 'resistor', name: '330Ω Resistor', shortLabel: '330Ω', resistance: 330, limit: 1 },
      { templateId: 'res-10k', kind: 'resistor', name: '10kΩ Resistor', shortLabel: '10kΩ', resistance: 10000, limit: 1 },
    ],
    lesson: {
      principle: "Ohm's Law for LEDs",
      formula: 'R = (9V − 2V) / 0.02A = 350Ω',
      explanation:
        'A Red LED drops ~2.0V, leaving 7.0V across the resistor. 47Ω lets over 100 mA surge through (POP!), 10kΩ starves it to 0.7 mA (invisible), and 330Ω hits ~20 mA—perfection.',
    },
    evaluate: (_board, sim) => {
      const led = sim.componentStates['led1'];
      const inSweetSpot = Boolean(
        led && led.active && !led.overloaded && led.current >= 0.01 && led.current <= 0.028 && !sim.shortCircuit
      );
      return {
        goals: [
          { id: 'led-on', label: 'Red LED glowing brightly (10–28 mA)', icon: 'led_red', satisfied: inSweetSpot },
          { id: 'no-pop', label: 'Keep current under 35 mA limit', icon: 'shield', satisfied: !sim.shortCircuit && !led?.overloaded },
        ],
        solved: inSweetSpot,
        hint: 'Try measuring current with the Multimeter or checking "Why? (Show Math)" if it pops or stays dim.',
      };
    },
  },
  {
    id: 'adult-3-flip-switch',
    mode: 'adult',
    order: 3,
    title: 'Flip the Switch',
    subtitle: 'Wire a toggle switch in series with the LED so tapping the switch turns the light cleanly ON and OFF.',
    conceptTag: 'Open vs. Closed Circuits',
    cols: 6,
    rows: 4,
    parUserItems: 5,
    initialComponents: [
      { id: 'bat', kind: 'battery', voltage: 3, a: { col: 1, row: 1 }, b: { col: 1, row: 2 }, locked: true },
      { id: 'led1', kind: 'led', ledColor: 'amber', a: { col: 4, row: 1 }, b: { col: 4, row: 2 }, locked: true },
    ],
    initialWires: [],
    tray: [
      { templateId: 'res-100', kind: 'resistor', name: '100Ω Resistor', shortLabel: '100Ω', resistance: 100, limit: 1 },
      { templateId: 'sw-toggle', kind: 'switch_toggle', name: 'Toggle Switch', shortLabel: 'Switch', limit: 1 },
    ],
    lesson: {
      principle: 'Series Control Switch',
      formula: 'R_open = ∞ Ω  ⇒  I = 0 A',
      explanation:
        'A switch placed in series physically breaks the loop. When open, resistance jumps to near infinity so zero current can flow anywhere in that branch.',
    },
    evaluate: (board, sim) => {
      const sw = board.components.find((c) => c.kind === 'switch_toggle');
      const led = sim.componentStates['led1'];
      let controlsLed = false;
      if (sw) {
        const simClosed = solveCircuit(cloneWithSwitchStates(board, { [sw.id]: true }));
        const simOpen = solveCircuit(cloneWithSwitchStates(board, { [sw.id]: false }));
        const onWhenClosed = Boolean(
          simClosed.componentStates['led1']?.active &&
            !simClosed.componentStates['led1']?.overloaded &&
            !simClosed.shortCircuit
        );
        const offWhenOpen = Boolean(!simOpen.componentStates['led1']?.active && !simOpen.shortCircuit);
        controlsLed = onWhenClosed && offWhenOpen;
      }
      const currentlyLit = Boolean(led && led.active && !led.overloaded && !sim.shortCircuit);
      return {
        goals: [
          { id: 'ctrl', label: 'Switch cleanly toggles the Amber LED', icon: 'switch', satisfied: controlsLed },
          { id: 'on', label: 'Flip switch ON to light the LED', icon: 'led_amber', satisfied: controlsLed && currentlyLit },
        ],
        solved: controlsLed && currentlyLit,
        hint: 'Place both the switch and the 100Ω resistor in the loop, then tap the switch lever to flip it ON.',
      };
    },
  },
  {
    id: 'adult-4-two-lights',
    mode: 'adult',
    order: 4,
    title: 'Two Lights, One Power',
    subtitle: 'Power BOTH the Red (2.0V) and Green (2.2V) LEDs brightly from a single 3V battery.',
    conceptTag: 'Parallel vs. Series',
    cols: 7,
    rows: 4,
    parUserItems: 7,
    initialComponents: [
      { id: 'bat', kind: 'battery', voltage: 3, a: { col: 1, row: 1 }, b: { col: 1, row: 2 }, locked: true },
      { id: 'ledR', kind: 'led', ledColor: 'red', a: { col: 3, row: 1 }, b: { col: 3, row: 2 }, locked: true },
      { id: 'ledG', kind: 'led', ledColor: 'green', a: { col: 5, row: 1 }, b: { col: 5, row: 2 }, locked: true },
    ],
    initialWires: [],
    tray: [
      { templateId: 'res-47', kind: 'resistor', name: '47Ω Resistor', shortLabel: '47Ω', resistance: 47, limit: 2 },
      { templateId: 'res-100', kind: 'resistor', name: '100Ω Resistor', shortLabel: '100Ω', resistance: 100, limit: 2 },
    ],
    lesson: {
      principle: 'Parallel Branches Share Voltage',
      formula: 'Series: 2.0V + 2.2V = 4.2V > 3V   |   Parallel: Each branch gets 3.0V',
      explanation:
        'In series, forward voltages add up (4.2V) so a 3V battery cannot light both. In parallel, every branch sits across the full 3.0V rail—give each LED its own resistor so currents balance cleanly!',
    },
    evaluate: (_board, sim) => {
      const r = sim.componentStates['ledR'];
      const g = sim.componentStates['ledG'];
      const rOk = Boolean(r && r.active && !r.overloaded && r.current >= 0.005);
      const gOk = Boolean(g && g.active && !g.overloaded && g.current >= 0.005);
      return {
        goals: [
          { id: 'red', label: 'Red LED glowing safely', icon: 'led_red', satisfied: rOk },
          { id: 'green', label: 'Green LED glowing safely', icon: 'led_green', satisfied: gOk },
          { id: 'safe', label: 'No shorts or burnouts', icon: 'shield', satisfied: !sim.shortCircuit && !r?.overloaded && !g?.overloaded },
        ],
        solved: rOk && gOk && !sim.shortCircuit,
        hint: 'Give each LED its own parallel path from + to − with a 47Ω or 100Ω resistor in series.',
      };
    },
  },
  {
    id: 'adult-5-bright-and-spinning',
    mode: 'adult',
    order: 5,
    title: 'Bright & Spinning',
    subtitle: 'Run the DC Fan Motor AND the Amber status LED together from a 6V battery without blowing the LED.',
    conceptTag: 'Mixed Parallel Loads',
    cols: 7,
    rows: 5,
    parUserItems: 6,
    initialComponents: [
      { id: 'bat', kind: 'battery', voltage: 6, a: { col: 1, row: 1 }, b: { col: 1, row: 3 }, locked: true },
      { id: 'mot', kind: 'motor', a: { col: 3, row: 1 }, b: { col: 3, row: 2 }, locked: true },
      { id: 'led1', kind: 'led', ledColor: 'amber', a: { col: 5, row: 2 }, b: { col: 5, row: 3 }, locked: true },
    ],
    initialWires: [],
    tray: [
      { templateId: 'res-220', kind: 'resistor', name: '220Ω Resistor', shortLabel: '220Ω', resistance: 220, limit: 1 },
      { templateId: 'res-47', kind: 'resistor', name: '47Ω Resistor', shortLabel: '47Ω', resistance: 47, limit: 1 },
      { templateId: 'res-1k', kind: 'resistor', name: '1kΩ Resistor', shortLabel: '1kΩ', resistance: 1000, limit: 1 },
    ],
    lesson: {
      principle: 'Different Loads Need Different Currents',
      formula: 'I_motor ≈ 6V / 25Ω = 240 mA   |   I_LED = (6V − 2.1V) / 220Ω ≈ 17 mA',
      explanation:
        'A DC motor loves ~200+ mA directly from 6V, while an LED pops above 35 mA. Wiring them in parallel lets the motor draw full current while a 220Ω resistor protects only the LED branch.',
    },
    evaluate: (_board, sim) => {
      const m = sim.componentStates['mot'];
      const l = sim.componentStates['led1'];
      const mOk = Boolean(m && m.active && !m.overloaded && Math.abs(m.motorSpeed) >= 0.45);
      const lOk = Boolean(l && l.active && !l.overloaded && l.current >= 0.008);
      return {
        goals: [
          { id: 'motor', label: 'Fan spinning briskly', icon: 'motor', satisfied: mOk },
          { id: 'led', label: 'Amber LED glowing safely', icon: 'led_amber', satisfied: lOk },
          { id: 'safe', label: 'No overloaded parts', icon: 'shield', satisfied: !sim.shortCircuit && !m?.overloaded && !l?.overloaded },
        ],
        solved: mOk && lOk && !sim.shortCircuit,
        hint: 'Connect the Fan directly across 6V, and put the 220Ω resistor in series with the Amber LED on a parallel branch.',
      };
    },
  },
  {
    id: 'adult-6-master-dimmer',
    mode: 'adult',
    order: 6,
    title: 'Master Dimmer',
    subtitle: 'Wire the Variable Dimmer in series with the Blue LED (3.0V) and dial current into 14–22 mA.',
    conceptTag: 'Variable Resistance & Metering',
    cols: 7,
    rows: 4,
    parUserItems: 4,
    initialComponents: [
      { id: 'bat', kind: 'battery', voltage: 9, a: { col: 1, row: 1 }, b: { col: 1, row: 2 }, locked: true },
      { id: 'ledB', kind: 'led', ledColor: 'blue', a: { col: 5, row: 1 }, b: { col: 5, row: 2 }, locked: true },
    ],
    initialWires: [],
    tray: [
      {
        templateId: 'rheo',
        kind: 'rheostat',
        name: 'Dimmer (20Ω–1kΩ)',
        shortLabel: 'Dimmer',
        resistance: 820,
        rheostatMin: 20,
        rheostatMax: 1000,
        limit: 1,
      },
    ],
    lesson: {
      principle: 'Tuning Current with a Rheostat',
      formula: 'I = (9.0V − 3.0V) / R_dimmer   ⇒   R ≈ 300Ω gives 20 mA',
      explanation:
        'Blue LEDs need a higher forward voltage (3.0V) than red ones (2.0V). Tap the Dimmer after wiring it and slide its resistance while watching the live current meter!',
    },
    evaluate: (_board, sim) => {
      const led = sim.componentStates['ledB'];
      const inBand = Boolean(
        led && led.active && !led.overloaded && led.current >= 0.014 && led.current <= 0.022 && !sim.shortCircuit
      );
      return {
        goals: [
          { id: 'led', label: 'Blue LED powered safely', icon: 'led_blue', satisfied: Boolean(led?.active && !led?.overloaded) },
          { id: 'meter', label: 'Tune LED current to 14–22 mA', icon: 'meter', satisfied: inBand },
        ],
        solved: inBand,
        hint: 'Wire the Dimmer in series, then tap the Dimmer and slide the knob down toward ~300Ω.',
      };
    },
  },
  {
    id: 'adult-7-safety-lock',
    mode: 'adult',
    order: 7,
    title: 'Two-Key Safety Lock',
    subtitle: 'Wire BOTH toggle switches so the Piezo Buzzer sounds ONLY when Switch 1 AND Switch 2 are both ON.',
    conceptTag: 'Series Logic (AND Gate)',
    cols: 7,
    rows: 5,
    parUserItems: 6,
    initialComponents: [
      { id: 'bat', kind: 'battery', voltage: 6, a: { col: 1, row: 1 }, b: { col: 1, row: 3 }, locked: true },
      { id: 'buz', kind: 'buzzer', a: { col: 5, row: 1 }, b: { col: 5, row: 3 }, locked: true },
    ],
    initialWires: [],
    tray: [
      { templateId: 'sw-1', kind: 'switch_toggle', name: 'Toggle Switch', shortLabel: 'Switch', limit: 2 },
    ],
    lesson: {
      principle: 'Mechanical AND Logic',
      formula: 'Buzzer = S1 AND S2',
      explanation:
        'Putting two switches end-to-end in series means current must pass through BOTH. If either switch is open, the loop breaks—this is the physical foundation of a digital AND gate.',
    },
    evaluate: (board, sim) => {
      const switches = board.components.filter((c) => c.kind === 'switch_toggle');
      let trueAnd = false;
      if (switches.length >= 2) {
        const [s1, s2] = switches;
        const onBoth = solveCircuit(cloneWithSwitchStates(board, { [s1.id]: true, [s2.id]: true }));
        const only1 = solveCircuit(cloneWithSwitchStates(board, { [s1.id]: true, [s2.id]: false }));
        const only2 = solveCircuit(cloneWithSwitchStates(board, { [s1.id]: false, [s2.id]: true }));
        const offBoth = solveCircuit(cloneWithSwitchStates(board, { [s1.id]: false, [s2.id]: false }));
        trueAnd =
          Boolean(onBoth.componentStates['buz']?.active && !onBoth.shortCircuit) &&
          !only1.componentStates['buz']?.active &&
          !only2.componentStates['buz']?.active &&
          !offBoth.componentStates['buz']?.active;
      }
      const buzzingNow = Boolean(sim.componentStates['buz']?.active && !sim.shortCircuit);
      return {
        goals: [
          { id: 'and-logic', label: 'Buzzer requires BOTH switches ON (AND)', icon: 'switch', satisfied: trueAnd },
          { id: 'buzz', label: 'Flip both switches ON to test buzzer', icon: 'buzzer', satisfied: trueAnd && buzzingNow },
        ],
        solved: trueAnd && buzzingNow,
        hint: 'Chain Battery + → Switch 1 → Switch 2 → Buzzer → Battery −, then close both switches.',
      };
    },
  },
  {
    id: 'adult-8-workshop-station',
    mode: 'adult',
    order: 8,
    title: 'Workshop Station',
    subtitle: 'Build an independent bench: a Toggle Switch controls the Fan, and a Push Button controls the Buzzer—from one 9V battery.',
    conceptTag: 'Independent Parallel Circuits',
    cols: 7,
    rows: 5,
    parUserItems: 9,
    initialComponents: [
      { id: 'bat', kind: 'battery', voltage: 9, a: { col: 1, row: 1 }, b: { col: 1, row: 3 }, locked: true },
      { id: 'mot', kind: 'motor', a: { col: 3, row: 2 }, b: { col: 3, row: 3 }, locked: true },
      { id: 'buz', kind: 'buzzer', a: { col: 5, row: 2 }, b: { col: 5, row: 3 }, locked: true },
    ],
    initialWires: [],
    tray: [
      { templateId: 'sw-toggle', kind: 'switch_toggle', name: 'Toggle Switch', shortLabel: 'Switch', limit: 1 },
      { templateId: 'sw-push', kind: 'switch_push', name: 'Push Button', shortLabel: 'Button', limit: 1 },
      { templateId: 'res-47', kind: 'resistor', name: '47Ω Resistor', shortLabel: '47Ω', resistance: 47, limit: 1 },
    ],
    lesson: {
      principle: 'Household Parallel Wiring',
      formula: 'Branch 1: Switch → Fan   ||   Branch 2: Button → Buzzer',
      explanation:
        'This is how rooms in your home are wired: every appliance sits on its own parallel branch with its own switch so turning off the fan never disables the doorbell!',
    },
    evaluate: (board, sim) => {
      const sw = board.components.find((c) => c.kind === 'switch_toggle');
      const btn = board.components.find((c) => c.kind === 'switch_push');
      let fanIndep = false;
      let buzIndep = false;

      if (sw && btn) {
        const s1b0 = solveCircuit(cloneWithSwitchStates(board, { [sw.id]: true, [btn.id]: false }));
        const s0b1 = solveCircuit(cloneWithSwitchStates(board, { [sw.id]: false, [btn.id]: true }));
        const s0b0 = solveCircuit(cloneWithSwitchStates(board, { [sw.id]: false, [btn.id]: false }));
        const s1b1 = solveCircuit(cloneWithSwitchStates(board, { [sw.id]: true, [btn.id]: true }));

        fanIndep =
          Boolean(s1b0.componentStates['mot']?.active && !s1b0.componentStates['mot']?.overloaded && !s1b0.shortCircuit) &&
          !s0b1.componentStates['mot']?.active &&
          !s0b0.componentStates['mot']?.active &&
          Boolean(s1b1.componentStates['mot']?.active);

        buzIndep =
          Boolean(s0b1.componentStates['buz']?.active && !s0b1.shortCircuit) &&
          !s1b0.componentStates['buz']?.active &&
          !s0b0.componentStates['buz']?.active &&
          Boolean(s1b1.componentStates['buz']?.active);
      }

      const activeTest = Boolean(
        !sim.shortCircuit && (sim.componentStates['mot']?.active || sim.componentStates['buz']?.active)
      );

      return {
        goals: [
          { id: 'fan', label: 'Toggle Switch controls Fan independently', icon: 'motor', satisfied: fanIndep },
          { id: 'buz', label: 'Push Button controls Buzzer independently', icon: 'buzzer', satisfied: buzIndep },
          { id: 'safe', label: 'No shorts — flip Switch or press Button to verify', icon: 'shield', satisfied: fanIndep && buzIndep && activeTest },
        ],
        solved: fanIndep && buzIndep && activeTest,
        hint: 'Give the Fan branch its own Toggle Switch and the Buzzer branch its own Push Button, both connected to the 9V + and − rails.',
      };
    },
  },
];

export const KID_MISSIONS: LevelDefinition[] = [
  {
    id: 'kid-1-light-up',
    mode: 'kid',
    order: 1,
    title: 'Light Up!',
    subtitle: 'Connect the glowing dotted lines to light the Red LED!',
    conceptTag: 'Mission 1',
    cols: 5,
    rows: 4,
    initialComponents: [
      { id: 'bat', kind: 'battery', voltage: 3, a: { col: 1, row: 1 }, b: { col: 1, row: 2 }, locked: true },
      { id: 'res', kind: 'resistor', resistance: 100, a: { col: 2, row: 1 }, b: { col: 3, row: 1 }, locked: true },
      { id: 'led1', kind: 'led', ledColor: 'red', a: { col: 3, row: 1 }, b: { col: 3, row: 2 }, locked: true },
    ],
    initialWires: [],
    tray: [],
    guideWire: [
      { a: { col: 1, row: 1 }, b: { col: 2, row: 1 } },
      { a: { col: 3, row: 2 }, b: { col: 1, row: 2 } },
    ],
    lesson: {
      principle: 'Complete the Circle!',
      formula: '+ → Helper → Light → −',
      explanation: 'Electricity loves a complete circle from the top of the battery all the way back to the bottom!',
    },
    evaluate: (_board, sim) => {
      const ok = Boolean(sim.componentStates['led1']?.active && !sim.componentStates['led1']?.overloaded && !sim.shortCircuit);
      return {
        goals: [{ id: 'led', label: 'Red Light ON', icon: 'led_red', satisfied: ok }],
        solved: ok,
      };
    },
  },
  {
    id: 'kid-2-spin-fan',
    mode: 'kid',
    order: 2,
    title: 'Spin the Fan!',
    subtitle: 'Wire the battery to the fan to make it spin!',
    conceptTag: 'Mission 2',
    cols: 5,
    rows: 4,
    initialComponents: [
      { id: 'bat', kind: 'battery', voltage: 6, a: { col: 1, row: 1 }, b: { col: 1, row: 2 }, locked: true },
      { id: 'mot', kind: 'motor', a: { col: 3, row: 1 }, b: { col: 3, row: 2 }, locked: true },
    ],
    initialWires: [],
    tray: [],
    guideWire: [
      { a: { col: 1, row: 1 }, b: { col: 3, row: 1 } },
      { a: { col: 3, row: 2 }, b: { col: 1, row: 2 } },
    ],
    lesson: {
      principle: 'Electric Motion',
      formula: 'Power → Motor Spin',
      explanation: 'Electricity flows through coils inside the motor to spin the fan blades. Try flipping the wires to spin backwards!',
    },
    evaluate: (_board, sim) => {
      const ok = Boolean(sim.componentStates['mot']?.active && !sim.shortCircuit);
      return {
        goals: [{ id: 'fan', label: 'Fan Spinning', icon: 'motor', satisfied: ok }],
        solved: ok,
      };
    },
  },
  {
    id: 'kid-3-buzz-button',
    mode: 'kid',
    order: 3,
    title: 'Buzz Button!',
    subtitle: 'Connect the big red button and press it to make the buzzer sing!',
    conceptTag: 'Mission 3',
    cols: 5,
    rows: 4,
    initialComponents: [
      { id: 'bat', kind: 'battery', voltage: 6, a: { col: 1, row: 1 }, b: { col: 1, row: 2 }, locked: true },
      { id: 'btn', kind: 'switch_push', closed: false, a: { col: 2, row: 1 }, b: { col: 3, row: 1 }, locked: true },
      { id: 'buz', kind: 'buzzer', a: { col: 3, row: 1 }, b: { col: 3, row: 2 }, locked: true },
    ],
    initialWires: [],
    tray: [],
    guideWire: [
      { a: { col: 1, row: 1 }, b: { col: 2, row: 1 } },
      { a: { col: 3, row: 2 }, b: { col: 1, row: 2 } },
    ],
    lesson: {
      principle: 'Push-Button Bridge',
      formula: 'Press = Bridge Closed',
      explanation: 'Pressing the red button closes a tiny metal bridge inside so electricity can rush to the buzzer!',
    },
    evaluate: (_board, sim) => {
      const ok = Boolean(sim.componentStates['buz']?.active && !sim.shortCircuit);
      return {
        goals: [
          { id: 'btn', label: 'Press Button', icon: 'switch', satisfied: ok },
          { id: 'buz', label: 'Buzzer Sing', icon: 'buzzer', satisfied: ok },
        ],
        solved: ok,
      };
    },
  },
  {
    id: 'kid-4-traffic-glow',
    mode: 'kid',
    order: 4,
    title: 'Traffic Lights!',
    subtitle: 'Light up BOTH the Red light and the Green light!',
    conceptTag: 'Mission 4',
    cols: 6,
    rows: 4,
    initialComponents: [
      { id: 'bat', kind: 'battery', voltage: 3, a: { col: 1, row: 1 }, b: { col: 1, row: 2 }, locked: true },
      { id: 'r1', kind: 'resistor', resistance: 47, a: { col: 2, row: 1 }, b: { col: 3, row: 1 }, locked: true },
      { id: 'ledR', kind: 'led', ledColor: 'red', a: { col: 3, row: 1 }, b: { col: 3, row: 2 }, locked: true },
      { id: 'r2', kind: 'resistor', resistance: 47, a: { col: 4, row: 1 }, b: { col: 5, row: 1 }, locked: true },
      { id: 'ledG', kind: 'led', ledColor: 'green', a: { col: 5, row: 1 }, b: { col: 5, row: 2 }, locked: true },
    ],
    initialWires: [
      { id: 'w-init', a: { col: 1, row: 1 }, b: { col: 2, row: 1 }, color: 'red' },
    ],
    tray: [],
    lesson: {
      principle: 'Two Paths!',
      formula: 'Split the Power Rail',
      explanation: 'Electricity can split into two roads at the same time so both lights shine bright!',
    },
    evaluate: (_board, sim) => {
      const rOk = Boolean(sim.componentStates['ledR']?.active && !sim.componentStates['ledR']?.overloaded);
      const gOk = Boolean(sim.componentStates['ledG']?.active && !sim.componentStates['ledG']?.overloaded);
      return {
        goals: [
          { id: 'r', label: 'Red Light', icon: 'led_red', satisfied: rOk },
          { id: 'g', label: 'Green Light', icon: 'led_green', satisfied: gOk },
        ],
        solved: rOk && gOk && !sim.shortCircuit,
      };
    },
  },
  {
    id: 'kid-5-super-machine',
    mode: 'kid',
    order: 5,
    title: 'Super Machine!',
    subtitle: 'Make the Green Light glow, the Fan spin, AND the Buzzer sing!',
    conceptTag: 'Mission 5',
    cols: 6,
    rows: 4,
    initialComponents: [
      { id: 'bat', kind: 'battery', voltage: 6, a: { col: 0, row: 1 }, b: { col: 0, row: 2 }, locked: true },
      { id: 'mot', kind: 'motor', a: { col: 2, row: 1 }, b: { col: 2, row: 2 }, locked: true },
      { id: 'buz', kind: 'buzzer', a: { col: 3, row: 1 }, b: { col: 3, row: 2 }, locked: true },
      { id: 'ledG', kind: 'led', ledColor: 'green', a: { col: 5, row: 1 }, b: { col: 5, row: 2 }, locked: true },
    ],
    initialWires: [],
    tray: [
      { templateId: 'res-220', kind: 'resistor', name: 'Helper', shortLabel: '220Ω', resistance: 220, limit: 2 },
    ],
    lesson: {
      principle: 'Master Inventor!',
      formula: 'Light + Fan + Buzzer',
      explanation: 'You built a whole machine with light, motion, and sound all running together!',
    },
    evaluate: (_board, sim) => {
      const mOk = Boolean(sim.componentStates['mot']?.active);
      const bOk = Boolean(sim.componentStates['buz']?.active);
      const lOk = Boolean(sim.componentStates['ledG']?.active && !sim.componentStates['ledG']?.overloaded);
      return {
        goals: [
          { id: 'fan', label: 'Fan', icon: 'motor', satisfied: mOk },
          { id: 'buz', label: 'Buzzer', icon: 'buzzer', satisfied: bOk },
          { id: 'led', label: 'Green Light', icon: 'led_green', satisfied: lOk },
        ],
        solved: mOk && bOk && lOk && !sim.shortCircuit,
      };
    },
  },
];

export const ADULT_SANDBOX: LevelDefinition = {
  id: 'adult-sandbox',
  mode: 'adult',
  order: 99,
  title: 'Free Lab Bench',
  subtitle: 'Unlimited parts. Build, measure, experiment, and break things safely.',
  conceptTag: 'Open Sandbox',
  isSandbox: true,
  cols: 7,
  rows: 5,
  initialComponents: [
    { id: 'bat-sb', kind: 'battery', voltage: 6, a: { col: 1, row: 1 }, b: { col: 1, row: 2 } },
  ],
  initialWires: [],
  tray: SANDBOX_TRAY_ADULT,
  lesson: {
    principle: 'Free Experimentation',
    formula: 'V = I × R   |   P = V × I',
    explanation:
      'Use X-Ray Flow and the Multimeter probe to explore voltage dividers, series vs. parallel batteries, dimmers, motors, and LEDs.',
  },
  evaluate: () => ({ goals: [], solved: false }),
};

export const KID_SANDBOX: LevelDefinition = {
  id: 'kid-sandbox',
  mode: 'kid',
  order: 99,
  title: 'Free Play Toybox',
  subtitle: 'Snap anything onto the board and see what lights up, spins, or buzzes!',
  conceptTag: 'Free Play',
  isSandbox: true,
  cols: 6,
  rows: 4,
  initialComponents: [
    { id: 'bat-ksb', kind: 'battery', voltage: 6, a: { col: 1, row: 1 }, b: { col: 1, row: 2 } },
  ],
  initialWires: [],
  tray: SANDBOX_TRAY_KID,
  lesson: {
    principle: 'Invent Anything!',
    formula: 'Snap + Wire + Play',
    explanation: 'Mix lights, spinning fans, dials, buttons, and buzzers to build your own cool invention!',
  },
  evaluate: () => ({ goals: [], solved: false }),
};

// Register Electronics as the first active STEM module + placeholder roadmap modules
stemRegistry.register({
  id: 'electronics',
  name: 'DC Electronics',
  tagline: 'Circuits, Ohm’s Law, LEDs, Motors & Logic',
  status: 'active',
  accentColor: '#D96528',
  adultLevels: ADULT_LEVELS,
  kidMissions: KID_MISSIONS,
  adultSandbox: ADULT_SANDBOX,
  kidSandbox: KID_SANDBOX,
});

stemRegistry.register({
  id: 'chemistry',
  name: 'Reaction Lab',
  tagline: 'Molecules, Energy & Reactions (Planned)',
  status: 'coming-soon',
  accentColor: '#2B8A78',
  adultLevels: [],
  kidMissions: [],
  adultSandbox: ADULT_SANDBOX,
  kidSandbox: KID_SANDBOX,
});
