import type { Language } from '../../core/i18n';
import { solveCircuit } from '../../engine/circuitSolver';
import {
  type CircuitBoardState,
  type CircuitComponent,
  DEFAULT_ENVIRONMENT,
  type LevelDefinition,
} from '../../engine/types';

function withSwitches(board: CircuitBoardState, map: Record<string, boolean>): CircuitBoardState {
  return {
    ...board,
    components: board.components.map((c: CircuitComponent) =>
      c.id in map ? { ...c, closed: map[c.id] } : c
    ),
  };
}

export const TIER2_LEVELS: LevelDefinition[] = [
  {
    id: 'adult-9-resistor-craft',
    mode: 'adult',
    tier: 2,
    order: 9,
    title: { en: 'Resistor Craft', pl: 'Składanie Oporu' },
    subtitle: {
      en: 'You only have 100Ω resistors, but the 9V Red LED needs ~200Ω–320Ω! Combine resistors in series to land in 18–30 mA.',
      pl: 'Masz tylko rezystory 100Ω, a czerwona LED na 9V wymaga ~200–320Ω! Połącz rezystory szeregowo, by uzyskać 18–30 mA.',
    },
    conceptTag: { en: 'Equivalent Resistance', pl: 'Opór zastępczy' },
    narrationPrompt: {
      en: 'Lab nine: Resistor Craft. You only have 100 ohm resistors. Chain them in series to build enough resistance so the 9 volt red LED glows safely between 18 and 30 milliamps.',
      pl: 'Poziom dziewiąty: Składanie Oporu. Masz tylko rezystory po 100 omów. Połącz je szeregowo, żeby zwiększyć opór i bezpiecznie zasilić czerwoną diodę z 9 woltów.',
    },
    cols: 7,
    rows: 4,
    parUserItems: 5,
    initialComponents: [
      { id: 'bat', kind: 'battery', voltage: 9, a: { col: 1, row: 1 }, b: { col: 1, row: 2 }, locked: true },
      { id: 'led1', kind: 'led', ledColor: 'red', a: { col: 5, row: 1 }, b: { col: 5, row: 2 }, locked: true },
    ],
    initialWires: [],
    tray: [
      { templateId: 'res-100', kind: 'resistor', name: { en: '100Ω Resistor', pl: 'Rezystor 100Ω' }, shortLabel: { en: '100Ω', pl: '100Ω' }, resistance: 100, limit: 3 },
    ],
    lesson: {
      principle: { en: 'Series & Parallel Resistance Math', pl: 'Łączenie rezystorów szeregowo i równolegle' },
      formula: {
        en: 'Series: R_eq = R1 + R2 + R3   |   Parallel: 1/R_eq = 1/R1 + 1/R2',
        pl: 'Szeregowo: R_z = R1 + R2 + R3   |   Równolegle: 1/R_z = 1/R1 + 1/R2',
      },
      explanation: {
        en: 'One 100Ω resistor lets 60 mA through (POP!). Chaining three 100Ω resistors in series gives 300Ω, landing right at ~22 mA.',
        pl: 'Jeden rezystor 100Ω przepuści aż 60 mA (spalenie!). Trzy rezystory 100Ω połączone szeregowo dają 300Ω i idealny prąd ok. 22 mA.',
      },
    },
    evaluate: (board, sim, _history, lang: Language = 'en') => {
      const led = sim.componentStates['led1'];
      const rCount = board.components.filter((c) => c.kind === 'resistor').length;
      const inRange = Boolean(
        led && led.active && !led.overloaded && led.current >= 0.018 && led.current <= 0.032 && !sim.shortCircuit
      );
      return {
        goals: [
          {
            id: 'combine',
            label: lang === 'pl' ? 'Połącz co najmniej 2 rezystory' : 'Combine at least 2 resistors',
            icon: 'shield',
            satisfied: rCount >= 2,
          },
          {
            id: 'led',
            label: lang === 'pl' ? 'Prąd LED w zakresie 18–32 mA' : 'Red LED glowing at 18–32 mA',
            icon: 'led_red',
            satisfied: inRange,
          },
        ],
        solved: rCount >= 2 && inRange,
      };
    },
  },
  {
    id: 'adult-10-voltage-divider',
    mode: 'adult',
    tier: 2,
    order: 10,
    title: { en: 'Half-Voltage Trick', pl: 'Dzielnik Napięcia' },
    subtitle: {
      en: 'Build a voltage divider from the 9V battery so the middle test socket (D2) reads 4.5V (±0.4V). Use X-Ray or Meter to check!',
      pl: 'Zbuduj dzielnik napięcia z baterii 9V tak, by środkowy punkt (D2) miał 4,5V (±0,4V). Sprawdź Prądem lub Miernikiem!',
    },
    conceptTag: { en: 'Voltage Divider', pl: 'Dzielnik napięcia' },
    narrationPrompt: {
      en: 'Lab ten: Half-Voltage Trick. Wire two equal resistors from 9 volts to ground so socket D2 in the middle sits right at 4.5 volts.',
      pl: 'Poziom dziesiąty: Dzielnik Napięcia. Połącz dwa równe rezystory między 9 woltów a minus tak, aby punkt D2 pośrodku miał dokładnie 4,5 wolta.',
    },
    cols: 7,
    rows: 4,
    parUserItems: 5,
    initialComponents: [
      { id: 'bat', kind: 'battery', voltage: 9, a: { col: 1, row: 1 }, b: { col: 1, row: 2 }, locked: true },
    ],
    initialWires: [],
    tray: [
      { templateId: 'res-1k', kind: 'resistor', name: { en: '1kΩ Resistor', pl: 'Rezystor 1kΩ' }, shortLabel: { en: '1kΩ', pl: '1kΩ' }, resistance: 1000, limit: 2 },
      { templateId: 'res-2k2', kind: 'resistor', name: { en: '2.2kΩ Resistor', pl: 'Rezystor 2.2kΩ' }, shortLabel: { en: '2.2kΩ', pl: '2.2kΩ' }, resistance: 2200, limit: 1 },
    ],
    lesson: {
      principle: { en: 'The Voltage Divider Equation', pl: 'Wzór na dzielnik napięcia' },
      formula: {
        en: 'V_out = V_in × R2 / (R1 + R2)   ⇒   9V × 1kΩ / 2kΩ = 4.5V',
        pl: 'U_wy = U_we × R2 / (R1 + R2)   ⇒   9V × 1kΩ / 2kΩ = 4,5V',
      },
      explanation: {
        en: 'Two series resistors split the supply voltage proportionally to their values. Equal resistors cut 9V cleanly in half to 4.5V—this is how sensors and analog inputs work.',
        pl: 'Dwa rezystory połączone szeregowo dzielą napięcie proporcjonalnie do swoich oporów. Dwa równe rezystory dzielą 9V dokładnie na pół — do 4,5V!',
      },
    },
    evaluate: (_board, sim, _history, lang: Language = 'en') => {
      // Socket D2 is col=3, row=1 (0-indexed: A=0,B=1,C=2,D=3; row1=0, row2=1)
      const vD2 = sim.nodeVoltages['3,1'];
      const hasMid = vD2 !== undefined && vD2 >= 4.1 && vD2 <= 4.9 && !sim.shortCircuit;
      // Also allow any intermediate node at 4.1..4.9V in case user builds divider at another column, but prefer D2
      const anyHalfNode = Object.entries(sim.nodeVoltages).some(
        ([k, v]) => k !== '1,1' && k !== '1,2' && v >= 4.1 && v <= 4.9
      );
      const ok = (hasMid || anyHalfNode) && !sim.shortCircuit;
      return {
        goals: [
          {
            id: 'mid',
            label: lang === 'pl' ? 'Wytwórz napięcie 4,5V (±0,4V) w węźle dzielnika' : 'Create 4.5V (±0.4V) at the divider node',
            icon: 'meter',
            satisfied: ok,
          },
          {
            id: 'safe',
            label: lang === 'pl' ? 'Bez zwarć' : 'No short circuits',
            icon: 'shield',
            satisfied: !sim.shortCircuit,
          },
        ],
        solved: ok,
      };
    },
  },
  {
    id: 'adult-11-divider-sag',
    mode: 'adult',
    tier: 2,
    order: 11,
    title: { en: 'Why Dividers Sag', pl: 'Efekt Obciążenia' },
    subtitle: {
      en: 'A 10kΩ divider collapses to ~0.1V when wired to a 150Ω Buzzer! Pick a stiffer divider (100Ω) so the Buzzer stays above 2.5V.',
      pl: 'Dzielnik 10kΩ spada prawie do zera pod obciążeniem brzęczyka 150Ω! Użyj „sztywniejszego” dzielnika (100Ω), by brzęczyk miał >2,5V.',
    },
    conceptTag: { en: 'Thévenin Loading Effect', pl: 'Obciążenie dzielnika' },
    narrationPrompt: {
      en: 'Lab eleven: Why Dividers Sag. A high-ohm divider cannot push enough current to drive a buzzer. Swap in lower-resistance parts so the buzzer gets at least 2.5 volts without exceeding 6 volts.',
      pl: 'Poziom jedenasty: Efekt Obciążenia. Dzielnik o dużym oporze nie potrafi zasilić brzęczyka. Zbuduj sztywniejszy dzielnik z mniejszych rezystorów, aby brzęczyk otrzymał od 2,5 do 6 woltów.',
    },
    cols: 7,
    rows: 4,
    parUserItems: 5,
    initialComponents: [
      { id: 'bat', kind: 'battery', voltage: 9, a: { col: 1, row: 1 }, b: { col: 1, row: 2 }, locked: true },
      { id: 'buz', kind: 'buzzer', a: { col: 5, row: 1 }, b: { col: 5, row: 2 }, locked: true },
    ],
    initialWires: [],
    tray: [
      { templateId: 'res-10k', kind: 'resistor', name: { en: '10kΩ Resistor', pl: 'Rezystor 10kΩ' }, shortLabel: { en: '10kΩ', pl: '10kΩ' }, resistance: 10000, limit: 2 },
      { templateId: 'res-100', kind: 'resistor', name: { en: '100Ω Resistor', pl: 'Rezystor 100Ω' }, shortLabel: { en: '100Ω', pl: '100Ω' }, resistance: 100, limit: 2 },
    ],
    lesson: {
      principle: { en: 'Loading Effect (Source Impedance)', pl: 'Efekt obciążenia dzielnika' },
      formula: {
        en: 'R_bottom_eff = R2 || R_load   ⇒   if R1 ≫ R_load, V_out collapses!',
        pl: 'R_dolny_z = R2 || R_obc   ⇒   gdy R1 ≫ R_obc, napięcie spada!',
      },
      explanation: {
        en: 'A voltage divider works great for high-impedance sensors, not heavy loads. When you attach a 150Ω buzzer in parallel with a 10kΩ resistor, R_bottom drops to 148Ω—so 10kΩ on top steals 98% of the voltage!',
        pl: 'Dzielnik napięcia świetnie działa dla czujników, ale słabo dla obciążeń. Brzęczyk 150Ω podłączony równolegle do 10kΩ obniża dolny opór do 148Ω — górny rezystor 10kΩ „zjada” wtedy 98% napięcia!',
      },
    },
    evaluate: (_board, sim, _history, lang: Language = 'en') => {
      const buz = sim.componentStates['buz'];
      const vBuz = Math.abs(buz?.voltageDrop ?? 0);
      const ok = Boolean(buz?.active && vBuz >= 2.5 && vBuz <= 6.2 && !sim.shortCircuit);
      return {
        goals: [
          {
            id: 'buz',
            label: lang === 'pl' ? 'Brzęczyk działa na 2,5–6,2V (nie bezpośrednio na 9V)' : 'Buzzer powered at 2.5–6.2V (divided, not direct 9V)',
            icon: 'buzzer',
            satisfied: ok,
          },
          {
            id: 'safe',
            label: lang === 'pl' ? 'Bez przeciążeń i zwarć' : 'No overloads or shorts',
            icon: 'shield',
            satisfied: !sim.shortCircuit && !Object.values(sim.componentStates).some((c) => c.overloaded),
          },
        ],
        solved: ok && !Object.values(sim.componentStates).some((c) => c.overloaded),
      };
    },
  },
  {
    id: 'adult-12-wattage-limit',
    mode: 'adult',
    tier: 2,
    order: 12,
    title: { en: "Don't Toast It!", pl: 'Moc i Przegrzanie' },
    subtitle: {
      en: 'A single 100Ω (0.25W) resistor across 9V burns at 0.81W! Split the current across parallel 220Ω resistors to drive ≥70 mA without overheating any part.',
      pl: 'Pojedynczy rezystor 100Ω (0,25W) pod 9V wydziela aż 0,81W i pali się! Podziel prąd równolegle przez rezystory 220Ω, by uzyskać ≥70 mA bez przegrzewania.',
    },
    conceptTag: { en: 'Power Dissipation (P = V²/R)', pl: 'Moc i ciepło (P = U²/R)' },
    narrationPrompt: {
      en: "Lab twelve: Don't Toast It! Resistors have wattage limits. Split the load across multiple resistors so total battery current reaches at least 70 milliamps while every resistor stays under its quarter-watt limit.",
      pl: 'Poziom dwunasty: Moc i Przegrzanie. Rezystory mają limit mocy! Rozdziel prąd na kilka rezystorów, aby bateria oddawała minimum 70 miliamperów, a żaden rezystor nie przekroczył 0,25 wata.',
    },
    cols: 7,
    rows: 5,
    parUserItems: 7,
    initialComponents: [
      { id: 'bat', kind: 'battery', voltage: 9, a: { col: 1, row: 1 }, b: { col: 1, row: 3 }, locked: true },
    ],
    initialWires: [],
    tray: [
      {
        templateId: 'res-100-q',
        kind: 'resistor',
        name: { en: '100Ω (0.25W)', pl: '100Ω (0,25W)' },
        shortLabel: { en: '100Ω ¼W', pl: '100Ω ¼W' },
        resistance: 100,
        maxPower: 0.25,
        limit: 1,
      },
      {
        templateId: 'res-330-q',
        kind: 'resistor',
        name: { en: '330Ω (0.25W)', pl: '330Ω (0,25W)' },
        shortLabel: { en: '330Ω ¼W', pl: '330Ω ¼W' },
        resistance: 330,
        maxPower: 0.25,
        limit: 4,
      },
    ],
    lesson: {
      principle: { en: 'Resistor Power Sharing', pl: 'Podział mocy na rezystorach' },
      formula: {
        en: 'P = V² / R   ⇒   9²/100Ω = 0.81W (🔥)  vs.  9²/330Ω = 0.245W (✓)',
        pl: 'P = U² / R   ⇒   9²/100Ω = 0,81W (🔥)  vs.  9²/330Ω = 0,245W (✓)',
      },
      explanation: {
        en: 'Standard lab resistors are rated for 0.25W (250 mW). Putting three 330Ω resistors in parallel gives 110Ω total (~80 mA) while each resistor stays safely at 245 mW!',
        pl: 'Standardowe rezystory wytrzymują 0,25W (250 mW). Trzy rezystory 330Ω połączone równolegle dają łącznie 110Ω (~80 mA), a każdy z osobna grzeje się bezpiecznie na 245 mW!',
      },
    },
    evaluate: (board, sim, _history, lang: Language = 'en') => {
      const bat = sim.componentStates['bat'];
      const draw = Math.abs(bat?.current ?? 0);
      const anyOver =
        sim.shortCircuit ||
        board.components.some((c) => c.burnedOut || sim.componentStates[c.id]?.overloaded);
      const enoughCurrent = draw >= 0.07;
      return {
        goals: [
          {
            id: 'draw',
            label: lang === 'pl' ? 'Prąd baterii co najmniej 70 mA' : 'Total battery draw ≥ 70 mA',
            icon: 'meter',
            satisfied: enoughCurrent && !sim.shortCircuit,
          },
          {
            id: 'cool',
            label: lang === 'pl' ? 'Żaden rezystor nie przekracza 0,25W' : 'Zero resistors overheating (> 0.25W)',
            icon: 'fire',
            satisfied: !anyOver && enoughCurrent,
          },
        ],
        solved: enoughCurrent && !anyOver,
      };
    },
  },
  {
    id: 'adult-13-hallway-3way',
    mode: 'adult',
    tier: 2,
    order: 13,
    title: { en: 'Hallway 3-Way Light', pl: 'Wyłącznik Schodowy' },
    subtitle: {
      en: 'Wire two 3-pin SPDT switches so flipping EITHER switch always toggles the hallway Amber LED (real staircase XOR wiring!).',
      pl: 'Połącz dwa 3-pinowe przełączniki schodowe (SPDT) tak, by przełączenie DOWOLNEGO z nich zawsze zmieniało stan żółtej lampki!',
    },
    conceptTag: { en: 'SPDT & XOR Staircase Logic', pl: 'Przełączniki SPDT (Logika XOR)' },
    narrationPrompt: {
      en: 'Lab thirteen: Hallway 3-Way Light. Connect two 3-pin SPDT switches with two traveler wires so flipping either switch always toggles the hallway light.',
      pl: 'Poziom trzynasty: Wyłącznik Schodowy. Połącz dwa 3-pinowe przełączniki dwoma przewodami krzyżowymi tak, żeby pstryknięcie dowolnego zawsze przełączało światło.',
    },
    cols: 7,
    rows: 5,
    parUserItems: 7,
    initialComponents: [
      { id: 'bat', kind: 'battery', voltage: 3, a: { col: 0, row: 1 }, b: { col: 0, row: 3 }, locked: true },
      { id: 'r1', kind: 'resistor', resistance: 100, a: { col: 5, row: 2 }, b: { col: 6, row: 2 }, locked: true },
      { id: 'led1', kind: 'led', ledColor: 'amber', a: { col: 6, row: 2 }, b: { col: 6, row: 3 }, locked: true },
    ],
    initialWires: [
      { id: 'w-gnd', a: { col: 6, row: 3 }, b: { col: 0, row: 3 }, color: 'black', locked: true },
    ],
    tray: [
      { templateId: 'spdt', kind: 'switch_spdt', name: { en: '3-Way Switch (SPDT)', pl: 'Przełącznik SPDT' }, shortLabel: { en: 'SPDT', pl: 'SPDT' }, limit: 2 },
    ],
    lesson: {
      principle: { en: 'Real Staircase 3-Way Switching', pl: 'Prawdziwy układ schodowy (SPDT)' },
      formula: {
        en: 'Travelers connect Throw1↔Throw1 and Throw2↔Throw2',
        pl: 'Przewody łączą Styk1↔Styk1 oraz Styk2↔Styk2',
      },
      explanation: {
        en: 'Each SPDT switch routes its middle Common pin to either Throw 1 or Throw 2. Connecting both throws between the two switches lets either end of the hallway toggle the light!',
        pl: 'Każdy przełącznik SPDT łączy środkowy pin wspólny z górnym lub dolnym stykiem. Spięcie obu skrajnych styków między przełącznikami sprawia, że każdy z nich przełącza światło!',
      },
    },
    evaluate: (board, sim, _history, lang: Language = 'en') => {
      const spdts = board.components.filter((c) => c.kind === 'switch_spdt');
      let xorValid = false;
      if (spdts.length >= 2) {
        const [s1, s2] = spdts;
        const a = Boolean(solveCircuit(withSwitches(board, { [s1.id]: false, [s2.id]: false })).componentStates['led1']?.active);
        const b = Boolean(solveCircuit(withSwitches(board, { [s1.id]: true, [s2.id]: false })).componentStates['led1']?.active);
        const c = Boolean(solveCircuit(withSwitches(board, { [s1.id]: false, [s2.id]: true })).componentStates['led1']?.active);
        const d = Boolean(solveCircuit(withSwitches(board, { [s1.id]: true, [s2.id]: true })).componentStates['led1']?.active);
        // Valid 3-way wiring is either XNOR (a=d=true, b=c=false) or XOR (a=d=false, b=c=true)
        xorValid = (a === d && b === c && a !== b) && !sim.shortCircuit;
      }
      const litNow = Boolean(sim.componentStates['led1']?.active && !sim.shortCircuit);
      return {
        goals: [
          {
            id: 'xor',
            label: lang === 'pl' ? 'Każdy z przełączników SPDT zmienia stan lampki' : 'Either SPDT switch toggles the light',
            icon: 'switch',
            satisfied: xorValid,
          },
          {
            id: 'lit',
            label: lang === 'pl' ? 'Przełącz tak, aby zaświecić lampkę' : 'Flip a switch to turn the light ON',
            icon: 'led_amber',
            satisfied: xorValid && litNow,
          },
        ],
        solved: xorValid && litNow,
      };
    },
  },
  {
    id: 'adult-14-ldr-sensor',
    mode: 'adult',
    tier: 2,
    order: 14,
    title: { en: 'Day & Night Sensor', pl: 'Czujnik Światła (LDR)' },
    subtitle: {
      en: 'Wire the Photoresistor (LDR) in series with the Green LED so it glows brightly in Sunlight (>10 mA) and dims off at Night (<2 mA).',
      pl: 'Połącz fotorezystor (LDR) szeregowo z zieloną LED tak, by świeciła jasno w Słońcu (>10 mA) i gasła w Nocy (<2 mA).',
    },
    conceptTag: { en: 'Photoresistor (LDR)', pl: 'Fotorezystor (LDR)' },
    narrationPrompt: {
      en: 'Lab fourteen: Day and Night Sensor. Wire the photoresistor and safety resistor with the green LED, then drag the Sun and Moon slider to watch light control the current.',
      pl: 'Poziom czternasty: Czujnik Światła. Podłącz fotorezystor i rezystor ochronny z zieloną diodą LED, a potem przesuwaj suwak Słońca i Księżyca.',
    },
    cols: 7,
    rows: 4,
    parUserItems: 5,
    initialEnvironment: { lightLevel: 0.9 },
    initialComponents: [
      { id: 'bat', kind: 'battery', voltage: 6, a: { col: 1, row: 1 }, b: { col: 1, row: 2 }, locked: true },
      { id: 'led1', kind: 'led', ledColor: 'green', a: { col: 5, row: 1 }, b: { col: 5, row: 2 }, locked: true },
    ],
    initialWires: [],
    tray: [
      { templateId: 'ldr', kind: 'ldr', name: { en: 'Light Sensor (LDR)', pl: 'Fotorezystor (LDR)' }, shortLabel: { en: 'LDR', pl: 'LDR' }, limit: 1 },
      { templateId: 'res-100', kind: 'resistor', name: { en: '100Ω Resistor', pl: 'Rezystor 100Ω' }, shortLabel: { en: '100Ω', pl: '100Ω' }, resistance: 100, limit: 1 },
    ],
    lesson: {
      principle: { en: 'Light-Controlled Resistance', pl: 'Opór sterowany światłem' },
      formula: {
        en: 'Sun: R_LDR ≈ 200Ω (bright)   |   Night: R_LDR ≈ 10kΩ (dark)',
        pl: 'Słońce: R_LDR ≈ 200Ω (jasno)   |   Noc: R_LDR ≈ 10kΩ (ciemno)',
      },
      explanation: {
        en: 'Photons knock electrons loose inside the semiconductor track, dropping resistance 50× in sunlight! A small 100Ω safety resistor protects the LED at full noon brightness.',
        pl: 'Fotony uwalniają elektrony w półprzewodniku, obniżając opór aż 50-krotnie w pełnym słońcu! Mały rezystor 100Ω chroni diodę w słoneczne południe.',
      },
    },
    evaluate: (board, sim, _history, lang: Language = 'en') => {
      const hasLdr = board.components.some((c) => c.kind === 'ldr');
      let reacts = false;
      if (hasLdr) {
        const sunSim = solveCircuit(board, 'en', { ...DEFAULT_ENVIRONMENT, lightLevel: 1 });
        const darkSim = solveCircuit(board, 'en', { ...DEFAULT_ENVIRONMENT, lightLevel: 0 });
        const sunLed = sunSim.componentStates['led1'];
        const darkLed = darkSim.componentStates['led1'];
        reacts = Boolean(
          sunLed?.active &&
            !sunLed.overloaded &&
            sunLed.current >= 0.008 &&
            (!darkLed?.active || (darkLed?.current ?? 0) < 0.002) &&
            !sunSim.shortCircuit
        );
      }
      return {
        goals: [
          {
            id: 'sun',
            label: lang === 'pl' ? 'Świeci w Słońcu (bez przeciążenia) i gaśnie w Nocy' : 'Glows safely in Sunlight & turns off at Night',
            icon: 'sun',
            satisfied: reacts,
          },
          {
            id: 'safe',
            label: lang === 'pl' ? 'Brak zwarć' : 'No shorts or burnouts',
            icon: 'shield',
            satisfied: !sim.shortCircuit && !sim.componentStates['led1']?.overloaded,
          },
        ],
        solved: reacts && !sim.shortCircuit,
      };
    },
  },
  {
    id: 'adult-15-overheat-alarm',
    mode: 'adult',
    tier: 2,
    order: 15,
    title: { en: 'Overheat Alarm', pl: 'Alarm Temperatury' },
    subtitle: {
      en: 'Wire the NTC Thermistor with the Piezo Buzzer so it stays SILENT when Cold (0°C) and sounds an alarm when Hot (100°C)!',
      pl: 'Połącz termistor NTC z brzęczykiem tak, by milczał na Zimno (0°C) i włączał alarm na Gorąco (100°C)!',
    },
    conceptTag: { en: 'NTC Thermistor', pl: 'Termistor NTC' },
    narrationPrompt: {
      en: 'Lab fifteen: Overheat Alarm. Wire the NTC thermistor in series with the 9 volt battery and buzzer, then slide the temperature up to Hot to trigger the alarm.',
      pl: 'Poziom piętnasty: Alarm Temperatury. Podłącz termistor NTC szeregowo z baterią 9 woltów i brzęczykiem, a potem przesuń suwak temperatury w stronę Gorąca!',
    },
    cols: 7,
    rows: 4,
    parUserItems: 4,
    initialEnvironment: { temperature: 0.15 },
    initialComponents: [
      { id: 'bat', kind: 'battery', voltage: 9, a: { col: 1, row: 1 }, b: { col: 1, row: 2 }, locked: true },
      { id: 'buz', kind: 'buzzer', a: { col: 5, row: 1 }, b: { col: 5, row: 2 }, locked: true },
    ],
    initialWires: [],
    tray: [
      { templateId: 'therm', kind: 'thermistor', name: { en: 'NTC Thermistor', pl: 'Termistor NTC' }, shortLabel: { en: 'NTC', pl: 'NTC' }, limit: 1 },
    ],
    lesson: {
      principle: { en: 'Negative Temperature Coefficient (NTC)', pl: 'Ujemny współczynnik temperaturowy (NTC)' },
      formula: {
        en: 'Cold (0°C): R ≈ 10kΩ (silent)   |   Hot (100°C): R ≈ 300Ω (3.0V alarm!)',
        pl: 'Zimno (0°C): R ≈ 10kΩ (cisza)   |   Gorąco (100°C): R ≈ 300Ω (alarm 3,0V!)',
      },
      explanation: {
        en: 'An NTC thermistor drops its resistance as it heats up. At 0°C the buzzer gets barely 0.13V (silent); at 100°C the thermistor drops to 300Ω, giving the buzzer 3.0V to ring!',
        pl: 'Termistor NTC zmniejsza swój opór pod wpływem ciepła. Przy 0°C do brzęczyka dociera zaledwie 0,13V (cisza), a przy 100°C opór spada do 300Ω i brzęczyk dostaje 3,0V!',
      },
    },
    evaluate: (board, sim, _history, lang: Language = 'en') => {
      const hasNtc = board.components.some((c) => c.kind === 'thermistor');
      let triggersOnHeat = false;
      if (hasNtc) {
        const coldSim = solveCircuit(board, 'en', { ...DEFAULT_ENVIRONMENT, temperature: 0 });
        const hotSim = solveCircuit(board, 'en', { ...DEFAULT_ENVIRONMENT, temperature: 1 });
        triggersOnHeat = Boolean(
          !coldSim.componentStates['buz']?.active &&
            hotSim.componentStates['buz']?.active &&
            !hotSim.shortCircuit
        );
      }
      const buzzingNow = Boolean(sim.componentStates['buz']?.active && !sim.shortCircuit);
      return {
        goals: [
          {
            id: 'logic',
            label: lang === 'pl' ? 'Cisza na zimno, alarm na gorąco' : 'Silent when Cold, alarms when Hot',
            icon: 'fire',
            satisfied: triggersOnHeat,
          },
          {
            id: 'test',
            label: lang === 'pl' ? 'Przesuń temperaturę na Gorąco, aby usłyszeć alarm' : 'Slide Temperature to Hot to test the alarm',
            icon: 'buzzer',
            satisfied: triggersOnHeat && buzzingNow,
          },
        ],
        solved: triggersOnHeat && buzzingNow,
      };
    },
  },
];
