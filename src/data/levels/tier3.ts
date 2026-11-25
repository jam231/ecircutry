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

export const TIER3_LEVELS: LevelDefinition[] = [
  {
    id: 'adult-16-npn-lever',
    mode: 'adult',
    tier: 3,
    order: 16,
    title: { en: 'The Tiny Lever (NPN)', pl: 'Dźwignia Prądowa (NPN)' },
    subtitle: {
      en: 'Use the 3-pin NPN Transistor (C–B–E) so a tiny <3 mA trickle through the 2.2kΩ Base resistor switches the 200 mA DC Fan ON and OFF!',
      pl: 'Użyj tranzystora NPN (C–B–E), aby malutki prąd <3 mA przez rezystor bazy 2,2kΩ sterował wiatrakiem pobierającym 200 mA!',
    },
    conceptTag: { en: 'BJT Current Amplification', pl: 'Wzmocnienie prądowe tranzystora' },
    narrationPrompt: {
      en: 'Lab sixteen: The Tiny Lever. Place the NPN transistor so the fan sits above its Collector, the Emitter goes to ground, and the switch plus 2.2 kilo-ohm resistor feeds its middle Base pin.',
      pl: 'Poziom szesnasty: Dźwignia Prądowa. Podłącz tranzystor NPN tak, aby wiatrak był przy kolektorze, emiter przy minusie, a przełącznik z rezystorem 2,2 kilooma sterował środkową bazą.',
    },
    cols: 7,
    rows: 5,
    parUserItems: 7,
    initialComponents: [
      { id: 'bat', kind: 'battery', voltage: 6, a: { col: 0, row: 1 }, b: { col: 0, row: 3 }, locked: true },
      { id: 'sw1', kind: 'switch_toggle', closed: true, a: { col: 1, row: 2 }, b: { col: 2, row: 2 }, locked: true },
      { id: 'mot', kind: 'motor', a: { col: 4, row: 0 }, b: { col: 4, row: 1 }, locked: true },
    ],
    initialWires: [
      { id: 'w-v1', a: { col: 0, row: 1 }, b: { col: 4, row: 0 }, color: 'red', locked: true },
      { id: 'w-v2', a: { col: 0, row: 1 }, b: { col: 1, row: 2 }, color: 'red', locked: true },
    ],
    tray: [
      { templateId: 'npn', kind: 'transistor_npn', name: { en: 'NPN Transistor', pl: 'Tranzystor NPN' }, shortLabel: { en: 'NPN', pl: 'NPN' }, limit: 1 },
      { templateId: 'res-2k2', kind: 'resistor', name: { en: '2.2kΩ Base Resistor', pl: 'Rezystor bazy 2,2kΩ' }, shortLabel: { en: '2.2kΩ', pl: '2.2kΩ' }, resistance: 2200, limit: 1 },
    ],
    lesson: {
      principle: { en: 'Transistor Current Gain (β ≈ 100)', pl: 'Wzmocnienie prądowe tranzystora (β ≈ 100)' },
      formula: { en: 'I_C = β × I_B   (2.4 mA into Base → 220 mA through Fan!)', pl: 'I_C = β × I_B   (2,4 mA w bazę → 220 mA przez wiatrak!)' },
      explanation: {
        en: 'An NPN transistor is an electronic valve: when Base-Emitter rises above ~0.7V, a tiny base current unlocks a collector-to-emitter current up to 100× larger!',
        pl: 'Tranzystor NPN to elektroniczny zawór: gdy napięcie baza–emiter przekroczy ~0,7V, minimalny prąd bazy otwiera przepływ kolektor–emiter nawet 100 razy większy!',
      },
    },
    evaluate: (board, sim, _history, lang: Language = 'en') => {
      const q = board.components.find((c) => c.kind === 'transistor_npn');
      const sw = board.components.find((c) => c.id === 'sw1');
      let amplified = false;
      if (q && sw) {
        const onSim = solveCircuit(withSwitches(board, { sw1: true }));
        const offSim = solveCircuit(withSwitches(board, { sw1: false }));
        const qOn = onSim.componentStates[q.id];
        const mOn = onSim.componentStates['mot'];
        const mOff = offSim.componentStates['mot'];
        amplified = Boolean(
          qOn?.active &&
            (qOn.baseCurrent ?? 0) < 0.008 &&
            mOn?.active &&
            !mOff?.active &&
            !onSim.shortCircuit
        );
      }
      const spinningNow = Boolean(sim.componentStates['mot']?.active && !sim.shortCircuit);
      return {
        goals: [
          {
            id: 'amp',
            label: lang === 'pl' ? 'Tranzystor steruje wiatrakiem małym prądem bazy (<8 mA)' : 'NPN amplifies tiny Base trickle (<8 mA) to switch Fan',
            icon: 'chip',
            satisfied: amplified,
          },
          {
            id: 'spin',
            label: lang === 'pl' ? 'Wiatrak kręci się przy włączonym przełączniku' : 'Fan spinning with switch ON',
            icon: 'motor',
            satisfied: amplified && spinningNow,
          },
        ],
        solved: amplified && spinningNow,
      };
    },
  },
  {
    id: 'adult-17-auto-streetlight',
    mode: 'adult',
    tier: 3,
    order: 17,
    title: { en: 'Auto Streetlight', pl: 'Automatyczna Latarnia' },
    subtitle: {
      en: 'Build a real dark-activated streetlight: LED stays OFF in Daylight and automatically turns ON when you slide to Night!',
      pl: 'Zbuduj prawdziwą latarnię zmierzchową: dioda gaśnie w Dzień i sama się zapala, gdy przesuniesz suwak na Noc!',
    },
    conceptTag: { en: 'Sensor + NPN Inverter', pl: 'Czujnik + Tranzystor NPN' },
    narrationPrompt: {
      en: 'Lab seventeen: Auto Streetlight. Put the 10 kilo-ohm resistor above the Base and the LDR below the Base to ground. In sunlight the LDR steals Base voltage, and at night the transistor switches the streetlight on!',
      pl: 'Poziom siedemnasty: Automatyczna Latarnia. Wstaw rezystor 10 kiloomów od plusa do bazy, a fotorezystor od bazy do minusa. W dzień fotorezystor ściąga bazę do zera, a w nocy latarnia sama się zapala!',
    },
    cols: 7,
    rows: 5,
    parUserItems: 7,
    initialEnvironment: { lightLevel: 0.9 },
    initialComponents: [
      { id: 'bat', kind: 'battery', voltage: 6, a: { col: 0, row: 1 }, b: { col: 0, row: 3 }, locked: true },
      { id: 'rLed', kind: 'resistor', resistance: 220, a: { col: 5, row: 0 }, b: { col: 5, row: 1 }, locked: true },
      { id: 'led1', kind: 'led', ledColor: 'amber', a: { col: 5, row: 1 }, b: { col: 5, row: 2 }, locked: true },
      { id: 'q1', kind: 'transistor_npn', a: { col: 5, row: 2 }, c: { col: 4, row: 2 }, b: { col: 3, row: 2 }, locked: true },
    ],
    initialWires: [
      { id: 'w-top', a: { col: 0, row: 1 }, b: { col: 5, row: 0 }, color: 'red', locked: true },
      { id: 'w-emit', a: { col: 3, row: 2 }, b: { col: 0, row: 3 }, color: 'black', locked: true },
    ],
    tray: [
      { templateId: 'ldr', kind: 'ldr', name: { en: 'Light Sensor (LDR)', pl: 'Fotorezystor (LDR)' }, shortLabel: { en: 'LDR', pl: 'LDR' }, limit: 1 },
      { templateId: 'res-10k', kind: 'resistor', name: { en: '10kΩ Resistor', pl: 'Rezystor 10kΩ' }, shortLabel: { en: '10kΩ', pl: '10kΩ' }, resistance: 10000, limit: 1 },
    ],
    lesson: {
      principle: { en: 'Dark-Activated Voltage Divider Bias', pl: 'Polaryzacja bazy dzielnikiem z LDR' },
      formula: {
        en: 'Day: V_B = 6V × 200Ω / 10.2kΩ = 0.12V (OFF)  |  Night: V_B tries 3V ⇒ clamps at 0.7V (ON!)',
        pl: 'Dzień: U_B = 0,12V (WYŁ)  |  Noc: U_B rośnie do 0,7V ⇒ tranzystor WŁ!',
      },
      explanation: {
        en: 'Putting the LDR on the bottom half of the Base divider inverts its action: bright sun pulls the Base down to 0.12V (OFF), while darkness lets the 10kΩ pull-up switch the transistor ON!',
        pl: 'Umieszczenie fotorezystora w dolnej części dzielnika bazy odwraca jego działanie: słońce ściąga bazę do 0,12V (WYŁ), a ciemność pozwala rezystorowi 10kΩ otworzyć tranzystor!',
      },
    },
    evaluate: (board, sim, _history, lang: Language = 'en') => {
      const sunSim = solveCircuit(board, 'en', { ...DEFAULT_ENVIRONMENT, lightLevel: 1 });
      const nightSim = solveCircuit(board, 'en', { ...DEFAULT_ENVIRONMENT, lightLevel: 0 });
      const autoWorks = Boolean(
        !sunSim.componentStates['led1']?.active &&
          nightSim.componentStates['led1']?.active &&
          !nightSim.componentStates['led1']?.overloaded &&
          !nightSim.shortCircuit
      );
      const litNow = Boolean(sim.componentStates['led1']?.active && !sim.shortCircuit);
      return {
        goals: [
          {
            id: 'auto',
            label: lang === 'pl' ? 'Zgaszona w Dzień, zapalona w Nocy' : 'OFF in Daylight, ON automatically at Night',
            icon: 'sun',
            satisfied: autoWorks,
          },
          {
            id: 'test',
            label: lang === 'pl' ? 'Przesuń suwak na Noc, by zobaczyć latarnię!' : 'Slide Light to Night to see it turn ON!',
            icon: 'led_amber',
            satisfied: autoWorks && litNow,
          },
        ],
        solved: autoWorks && litNow,
      };
    },
  },
  {
    id: 'adult-18-smart-fan',
    mode: 'adult',
    tier: 3,
    order: 18,
    title: { en: 'Smart Cooling Fan', pl: 'Inteligentny Wiatrak' },
    subtitle: {
      en: 'An NTC Thermistor alone cannot power a 200 mA Fan (remember Lab 11!). Use the NPN Transistor so the Fan stays OFF when Cold and spins fast when Hot!',
      pl: 'Sam termistor nie udźwignie prądu 200 mA dla wiatraka! Użyj tranzystora NPN, by wiatrak stał na Zimno i ruszał pełną mocą na Gorąco!',
    },
    conceptTag: { en: 'Buffered Sensor Driver', pl: 'Wzmacniacz sygnału czujnika' },
    narrationPrompt: {
      en: 'Lab eighteen: Smart Cooling Fan. Use the thermistor on the top of the Base divider and 2.2 kilo-ohms on the bottom so heat lifts Base voltage above 0.7 volts and spins up the fan!',
      pl: 'Poziom osiemnasty: Inteligentny Wiatrak. Wstaw termistor u góry dzielnika bazy, a 2,2 kilooma u dołu. Gdy zrobi się gorąco, napięcie bazy wzrośnie i uruchomi wiatrak!',
    },
    cols: 7,
    rows: 5,
    parUserItems: 7,
    initialEnvironment: { temperature: 0.15 },
    initialComponents: [
      { id: 'bat', kind: 'battery', voltage: 6, a: { col: 0, row: 1 }, b: { col: 0, row: 3 }, locked: true },
      { id: 'mot', kind: 'motor', a: { col: 5, row: 0 }, b: { col: 5, row: 1 }, locked: true },
      { id: 'q1', kind: 'transistor_npn', a: { col: 5, row: 1 }, c: { col: 5, row: 2 }, b: { col: 5, row: 3 }, locked: true },
    ],
    initialWires: [
      { id: 'w-v', a: { col: 0, row: 1 }, b: { col: 5, row: 0 }, color: 'red', locked: true },
      { id: 'w-g', a: { col: 5, row: 3 }, b: { col: 0, row: 3 }, color: 'black', locked: true },
    ],
    tray: [
      { templateId: 'therm', kind: 'thermistor', name: { en: 'NTC Thermistor', pl: 'Termistor NTC' }, shortLabel: { en: 'NTC', pl: 'NTC' }, limit: 1 },
      { templateId: 'res-1k', kind: 'resistor', name: { en: '1kΩ Resistor', pl: 'Rezystor 1kΩ' }, shortLabel: { en: '1kΩ', pl: '1kΩ' }, resistance: 1000, limit: 1 },
    ],
    lesson: {
      principle: { en: 'Solving Loading Collapse with a Transistor', pl: 'Tranzystor rozwiązuje efekt obciążenia' },
      formula: {
        en: 'Cold: V_B ≈ 0.54V (OFF)   |   Hot: I_B ≈ 17 mA ⇒ Fan runs at full speed!',
        pl: 'Zimno: U_B ≈ 0,54V (WYŁ)   |   Gorąco: tranzystor otwiera wiatrak na pełne obroty!',
      },
      explanation: {
        en: 'By placing the thermistor on the high side and 1kΩ to ground, cold keeps V_B safely below 0.6V (fan OFF). Heating drops thermistor resistance to 300Ω, saturating Q1 so the fan gets full 6V!',
        pl: 'Termistor od plusa i rezystor 1kΩ do masy utrzymują bazę poniżej 0,6V na zimno (wiatrak stoi). Ciepło obniża opór termistora do 300Ω i nasyca tranzystor, dając wiatrakowi pełne 6V!',
      },
    },
    evaluate: (board, sim, _history, lang: Language = 'en') => {
      const coldSim = solveCircuit(board, 'en', { ...DEFAULT_ENVIRONMENT, temperature: 0 });
      const hotSim = solveCircuit(board, 'en', { ...DEFAULT_ENVIRONMENT, temperature: 1 });
      const autoWorks = Boolean(
        !coldSim.componentStates['mot']?.active &&
          hotSim.componentStates['mot']?.active &&
          Math.abs(hotSim.componentStates['mot']?.motorSpeed ?? 0) >= 0.4 &&
          !hotSim.shortCircuit
      );
      const spinningNow = Boolean(sim.componentStates['mot']?.active && !sim.shortCircuit);
      return {
        goals: [
          {
            id: 'auto',
            label: lang === 'pl' ? 'Wiatrak stoi na Zimno i szybko kręci na Gorąco' : 'Fan OFF when Cold, spins briskly when Hot',
            icon: 'fire',
            satisfied: autoWorks,
          },
          {
            id: 'test',
            label: lang === 'pl' ? 'Podnieś temperaturę na Gorąco, by go włączyć!' : 'Slide Temperature to Hot to spin the Fan!',
            icon: 'motor',
            satisfied: autoWorks && spinningNow,
          },
        ],
        solved: autoWorks && spinningNow,
      };
    },
  },
  {
    id: 'adult-19-not-gate',
    mode: 'adult',
    tier: 3,
    order: 19,
    title: { en: 'Opposite Day (NOT Gate)', pl: 'Bramka NOT (Inwerter)' },
    subtitle: {
      en: 'Build a real transistor NOT gate: the Blue output LED must glow when Switch A is OFF, and turn OFF when Switch A is ON!',
      pl: 'Zbuduj prawdziwą tranzystorową bramkę NOT: niebieska LED świeci, gdy przełącznik A jest WYŁ, i gaśnie, gdy A jest WŁ!',
    },
    conceptTag: { en: 'RTL Digital Logic (NOT)', pl: 'Logika cyfrowa (Bramka NOT)' },
    narrationPrompt: {
      en: 'Lab nineteen: Opposite Day, the NOT gate. Wire the NPN transistor across the output so closing switch A pulls the LED node down to ground, turning the light off!',
      pl: 'Poziom dziewiętnasty: Bramka NOT. Podłącz tranzystor NPN równolegle do wyjścia, aby włączenie przełącznika A ściągało napięcie diody do masy i ją gasiło!',
    },
    cols: 7,
    rows: 5,
    parUserItems: 6,
    initialComponents: [
      { id: 'bat', kind: 'battery', voltage: 6, a: { col: 0, row: 1 }, b: { col: 0, row: 3 }, locked: true },
      { id: 'swA', kind: 'switch_toggle', closed: false, a: { col: 1, row: 2 }, b: { col: 2, row: 2 }, locked: true },
      { id: 'rPull', kind: 'resistor', resistance: 220, a: { col: 4, row: 0 }, b: { col: 4, row: 1 }, locked: true },
      { id: 'ledOut', kind: 'led', ledColor: 'blue', a: { col: 6, row: 1 }, b: { col: 6, row: 3 }, locked: true },
    ],
    initialWires: [
      { id: 'w-v1', a: { col: 0, row: 1 }, b: { col: 4, row: 0 }, color: 'red', locked: true },
      { id: 'w-v2', a: { col: 0, row: 1 }, b: { col: 1, row: 2 }, color: 'red', locked: true },
      { id: 'w-out', a: { col: 4, row: 1 }, b: { col: 6, row: 1 }, color: 'blue', locked: true },
      { id: 'w-gnd', a: { col: 6, row: 3 }, b: { col: 0, row: 3 }, color: 'black', locked: true },
    ],
    tray: [
      { templateId: 'npn', kind: 'transistor_npn', name: { en: 'NPN Transistor', pl: 'Tranzystor NPN' }, shortLabel: { en: 'NPN', pl: 'NPN' }, limit: 1 },
      { templateId: 'res-2k2', kind: 'resistor', name: { en: '2.2kΩ Resistor', pl: 'Rezystor 2,2kΩ' }, shortLabel: { en: '2.2kΩ', pl: '2.2kΩ' }, resistance: 2200, limit: 1 },
    ],
    lesson: {
      principle: { en: 'Resistor-Transistor Logic (Inverter)', pl: 'Inwerter tranzystorowy (RTL NOT)' },
      formula: { en: 'OUT = NOT A   (A=0 ⇒ OUT=1 | A=1 ⇒ Q1 shorts OUT to 0.15V)', pl: 'WYJ = NOT A   (A=0 ⇒ WYJ=1 | A=1 ⇒ Q1 zwiera WYJ do 0,15V)' },
      explanation: {
        en: 'When Switch A is OFF, current flows through the 220Ω pull-up into the Blue LED. Turning A ON saturates Q1, clamping the output node to ~0.15V—far below the LED’s 3.0V threshold!',
        pl: 'Gdy A jest WYŁ, prąd płynie przez rezystor 220Ω do niebieskiej LED. Włączenie A nasyca tranzystor, ściągając napięcie wyjścia do ~0,15V — znacznie poniżej progu 3V diody!',
      },
    },
    evaluate: (board, _sim, _history, lang: Language = 'en') => {
      const offSim = solveCircuit(withSwitches(board, { swA: false }));
      const onSim = solveCircuit(withSwitches(board, { swA: true }));
      const validNot = Boolean(
        offSim.componentStates['ledOut']?.active &&
          !offSim.componentStates['ledOut']?.overloaded &&
          !onSim.componentStates['ledOut']?.active &&
          !onSim.shortCircuit &&
          !offSim.shortCircuit
      );
      return {
        goals: [
          {
            id: 'not0',
            label: lang === 'pl' ? 'A = WYŁ ⇒ Niebieska LED WŁ' : 'Switch A OFF ⇒ Blue LED ON',
            icon: 'led_blue',
            satisfied: Boolean(offSim.componentStates['ledOut']?.active && !offSim.shortCircuit),
          },
          {
            id: 'not1',
            label: lang === 'pl' ? 'A = WŁ ⇒ Niebieska LED WYŁ (Inwersja!)' : 'Switch A ON ⇒ Blue LED OFF (Inverted!)',
            icon: 'chip',
            satisfied: validNot,
          },
        ],
        solved: validNot,
      };
    },
  },
  {
    id: 'adult-20-nand-gate',
    mode: 'adult',
    tier: 3,
    order: 20,
    title: { en: 'Universal Gate (NAND)', pl: 'Bramka Uniwersalna (NAND)' },
    subtitle: {
      en: 'Stack TWO NPN transistors in series so the output LED turns OFF ONLY when BOTH Switch A AND Switch B are ON!',
      pl: 'Połącz DWA tranzystory NPN szeregowo tak, aby dioda wyjściowa gasła TYLKO wtedy, gdy OBA przełączniki A i B są WŁ!',
    },
    conceptTag: { en: 'Transistor NAND Gate', pl: 'Tranzystorowa bramka NAND' },
    narrationPrompt: {
      en: 'Lab twenty: Universal Gate, NAND. Stack two NPN transistors in series below the pull-up node. Only when both A and B are on can current sink to ground and turn the output off. Every computer CPU can be built from NAND gates!',
      pl: 'Poziom dwudziesty: Bramka Uniwersalna NAND. Połącz dwa tranzystory NPN szeregowo. Tylko gdy oba przełączniki A i B są włączone, wyjście spada do zera. Z samych bramek NAND można zbudować cały komputer!',
    },
    cols: 8,
    rows: 6,
    parUserItems: 8,
    initialComponents: [
      { id: 'bat', kind: 'battery', voltage: 6, a: { col: 0, row: 1 }, b: { col: 0, row: 5 }, locked: true },
      { id: 'swA', kind: 'switch_toggle', closed: false, a: { col: 1, row: 2 }, b: { col: 2, row: 2 }, locked: true, label: 'A' },
      { id: 'swB', kind: 'switch_toggle', closed: false, a: { col: 1, row: 4 }, b: { col: 2, row: 4 }, locked: true, label: 'B' },
      { id: 'rPull', kind: 'resistor', resistance: 220, a: { col: 5, row: 0 }, b: { col: 5, row: 1 }, locked: true },
      { id: 'ledOut', kind: 'led', ledColor: 'green', a: { col: 7, row: 1 }, b: { col: 7, row: 5 }, locked: true },
    ],
    initialWires: [
      { id: 'w-v0', a: { col: 0, row: 1 }, b: { col: 5, row: 0 }, color: 'red', locked: true },
      { id: 'w-va', a: { col: 0, row: 1 }, b: { col: 1, row: 2 }, color: 'red', locked: true },
      { id: 'w-vb', a: { col: 0, row: 1 }, b: { col: 1, row: 4 }, color: 'red', locked: true },
      { id: 'w-out', a: { col: 5, row: 1 }, b: { col: 7, row: 1 }, color: 'green', locked: true },
      { id: 'w-gnd', a: { col: 7, row: 5 }, b: { col: 0, row: 5 }, color: 'black', locked: true },
    ],
    tray: [
      { templateId: 'npn', kind: 'transistor_npn', name: { en: 'NPN Transistor', pl: 'Tranzystor NPN' }, shortLabel: { en: 'NPN', pl: 'NPN' }, limit: 2 },
      { templateId: 'res-2k2', kind: 'resistor', name: { en: '2.2kΩ Base Resistor', pl: 'Rezystor 2,2kΩ' }, shortLabel: { en: '2.2kΩ', pl: '2.2kΩ' }, resistance: 2200, limit: 2 },
    ],
    lesson: {
      principle: { en: 'NAND — The Building Block of CPUs', pl: 'NAND — cegiełka procesorów' },
      formula: { en: 'OUT = NOT (A AND B)   (Series pull-down stack)', pl: 'WYJ = NOT (A ORAZ B)   (Szeregowy stos tranzystorów)' },
      explanation: {
        en: 'NAND is functionally complete: any digital circuit in your phone or laptop—adders, RAM, CPUs—can be constructed solely by wiring NAND gates together!',
        pl: 'Bramka NAND jest funkcjonalnie pełna: każdy układ cyfrowy w telefonie lub komputerze — sumatory, pamięć, procesor — da się zbudować wyłącznie z bramek NAND!',
      },
    },
    evaluate: (board, _sim, _history, lang: Language = 'en') => {
      const s00 = solveCircuit(withSwitches(board, { swA: false, swB: false }));
      const s10 = solveCircuit(withSwitches(board, { swA: true, swB: false }));
      const s01 = solveCircuit(withSwitches(board, { swA: false, swB: true }));
      const s11 = solveCircuit(withSwitches(board, { swA: true, swB: true }));

      const o00 = Boolean(s00.componentStates['ledOut']?.active && !s00.shortCircuit);
      const o10 = Boolean(s10.componentStates['ledOut']?.active && !s10.shortCircuit);
      const o01 = Boolean(s01.componentStates['ledOut']?.active && !s01.shortCircuit);
      const o11 = Boolean(!s11.componentStates['ledOut']?.active && !s11.shortCircuit);

      return {
        goals: [
          {
            id: 'hi',
            label: lang === 'pl' ? 'LED świeci dla (0,0), (1,0) i (0,1)' : 'Output ON for (0,0), (1,0), and (0,1)',
            icon: 'led_green',
            satisfied: o00 && o10 && o01,
          },
          {
            id: 'lo',
            label: lang === 'pl' ? 'LED gaśnie TYLKO dla A=WŁ i B=WŁ' : 'Output OFF ONLY when A=ON and B=ON',
            icon: 'chip',
            satisfied: o00 && o10 && o01 && o11,
          },
        ],
        solved: o00 && o10 && o01 && o11,
      };
    },
  },
  {
    id: 'adult-21-nor-gate',
    mode: 'adult',
    tier: 3,
    order: 21,
    title: { en: 'Either Or (NOR Gate)', pl: 'Bramka NOR' },
    subtitle: {
      en: 'Wire TWO NPN transistors in parallel so the Red output LED glows ONLY when BOTH Switch A and Switch B are OFF!',
      pl: 'Połącz DWA tranzystory NPN równolegle tak, by czerwona LED świeciła TYLKO wtedy, gdy OBA przełączniki A i B są WYŁ!',
    },
    conceptTag: { en: 'Transistor NOR Gate', pl: 'Tranzystorowa bramka NOR' },
    narrationPrompt: {
      en: 'Lab twenty-one: Either Or, the NOR gate. Wire two NPN transistors in parallel from the output rail to ground so turning on either switch pulls the output low.',
      pl: 'Poziom dwudziesty pierwszy: Bramka NOR. Podłącz dwa tranzystory NPN równolegle między wyjście a masę — włączenie któregokolwiek z przełączników zgasi lampkę!',
    },
    cols: 8,
    rows: 5,
    parUserItems: 8,
    initialComponents: [
      { id: 'bat', kind: 'battery', voltage: 6, a: { col: 0, row: 1 }, b: { col: 0, row: 4 }, locked: true },
      { id: 'swA', kind: 'switch_toggle', closed: false, a: { col: 1, row: 1 }, b: { col: 2, row: 1 }, locked: true, label: 'A' },
      { id: 'swB', kind: 'switch_toggle', closed: false, a: { col: 1, row: 3 }, b: { col: 2, row: 3 }, locked: true, label: 'B' },
      { id: 'rPull', kind: 'resistor', resistance: 220, a: { col: 4, row: 0 }, b: { col: 4, row: 1 }, locked: true },
      { id: 'ledOut', kind: 'led', ledColor: 'red', a: { col: 7, row: 1 }, b: { col: 7, row: 4 }, locked: true },
    ],
    initialWires: [
      { id: 'w-v0', a: { col: 0, row: 1 }, b: { col: 4, row: 0 }, color: 'red', locked: true },
      { id: 'w-va', a: { col: 0, row: 1 }, b: { col: 1, row: 1 }, color: 'red', locked: true },
      { id: 'w-vb', a: { col: 0, row: 1 }, b: { col: 1, row: 3 }, color: 'red', locked: true },
      { id: 'w-out', a: { col: 4, row: 1 }, b: { col: 7, row: 1 }, color: 'blue', locked: true },
      { id: 'w-gnd', a: { col: 7, row: 4 }, b: { col: 0, row: 4 }, color: 'black', locked: true },
    ],
    tray: [
      { templateId: 'npn', kind: 'transistor_npn', name: { en: 'NPN Transistor', pl: 'Tranzystor NPN' }, shortLabel: { en: 'NPN', pl: 'NPN' }, limit: 2 },
      { templateId: 'res-2k2', kind: 'resistor', name: { en: '2.2kΩ Base Resistor', pl: 'Rezystor 2,2kΩ' }, shortLabel: { en: '2.2kΩ', pl: '2.2kΩ' }, resistance: 2200, limit: 2 },
    ],
    lesson: {
      principle: { en: 'Parallel Pull-Down NOR Logic', pl: 'Równoległa bramka NOR' },
      formula: { en: 'OUT = NOT (A OR B)', pl: 'WYJ = NOT (A LUB B)' },
      explanation: {
        en: 'Fun fact: the Apollo Guidance Computer that landed humans on the Moon was built almost entirely out of 3-input RTL NOR gates just like this one!',
        pl: 'Ciekawostka: komputer pokładowy Apollo, który wylądował na Księżycu, był zbudowany niemal w całości z takich właśnie bramek RTL NOR!',
      },
    },
    evaluate: (board, _sim, _history, lang: Language = 'en') => {
      const s00 = solveCircuit(withSwitches(board, { swA: false, swB: false }));
      const s10 = solveCircuit(withSwitches(board, { swA: true, swB: false }));
      const s01 = solveCircuit(withSwitches(board, { swA: false, swB: true }));
      const s11 = solveCircuit(withSwitches(board, { swA: true, swB: true }));

      const o00 = Boolean(s00.componentStates['ledOut']?.active && !s00.shortCircuit);
      const o10 = Boolean(!s10.componentStates['ledOut']?.active && !s10.shortCircuit);
      const o01 = Boolean(!s01.componentStates['ledOut']?.active && !s01.shortCircuit);
      const o11 = Boolean(!s11.componentStates['ledOut']?.active && !s11.shortCircuit);

      return {
        goals: [
          {
            id: 'only00',
            label: lang === 'pl' ? 'LED świeci przy A=WYŁ i B=WYŁ' : 'Output ON when A=OFF and B=OFF',
            icon: 'led_red',
            satisfied: o00,
          },
          {
            id: 'offAny',
            label: lang === 'pl' ? 'LED gaśnie po włączeniu A lub B' : 'Output OFF if A or B (or both) is ON',
            icon: 'chip',
            satisfied: o00 && o10 && o01 && o11,
          },
        ],
        solved: o00 && o10 && o01 && o11,
      };
    },
  },
  {
    id: 'adult-22-sr-latch',
    mode: 'adult',
    tier: 3,
    order: 22,
    title: { en: '1-Bit Memory (SR Latch)', pl: 'Pamięć 1-Bitowa (Przerzutnik SR)' },
    subtitle: {
      en: 'Cross-couple the two inverters with two 4.7kΩ feedback resistors so pressing SET locks Green ON and pressing RESET locks Red ON—even after releasing the buttons!',
      pl: 'Połącz krzyżowo oba inwertery dwoma rezystorami 4,7kΩ, aby przycisk SET zapamiętał zieloną LED, a RESET czerwoną — nawet po puszczeniu przycisków!',
    },
    conceptTag: { en: 'Bistable Feedback Memory', pl: 'Pamięć bistabilna (1 bit RAM)' },
    narrationPrompt: {
      en: 'Lab twenty-two: 1-Bit Memory. Add two cross-coupled 4.7 kilo-ohm feedback resistors from each collector to the opposite transistor base, then tap the Set and Reset buttons to store a bit of memory!',
      pl: 'Poziom dwudziesty drugi: Pamięć 1-Bitowa. Dodaj dwa skrzyżowane rezystory 4,7 kilooma od kolektora jednego tranzystora do bazy drugiego, a potem kliknij przyciski, by zapisać bit pamięci!',
    },
    cols: 8,
    rows: 5,
    parUserItems: 6,
    initialComponents: [
      { id: 'bat', kind: 'battery', voltage: 6, a: { col: 0, row: 1 }, b: { col: 0, row: 4 }, locked: true },
      // Left inverter (Red LED)
      { id: 'rc1', kind: 'resistor', resistance: 220, a: { col: 2, row: 0 }, b: { col: 2, row: 1 }, locked: true },
      { id: 'ledR', kind: 'led', ledColor: 'red', a: { col: 2, row: 1 }, b: { col: 2, row: 2 }, locked: true },
      { id: 'q1', kind: 'transistor_npn', a: { col: 2, row: 2 }, c: { col: 2, row: 3 }, b: { col: 2, row: 4 }, locked: true },
      { id: 'btnSet', kind: 'switch_push', closed: false, a: { col: 1, row: 3 }, b: { col: 1, row: 4 }, locked: true, label: 'SET' },
      // Right inverter (Green LED)
      { id: 'rc2', kind: 'resistor', resistance: 220, a: { col: 6, row: 0 }, b: { col: 6, row: 1 }, locked: true },
      { id: 'ledG', kind: 'led', ledColor: 'green', a: { col: 6, row: 1 }, b: { col: 6, row: 2 }, locked: true },
      { id: 'q2', kind: 'transistor_npn', a: { col: 6, row: 2 }, c: { col: 6, row: 3 }, b: { col: 6, row: 4 }, locked: true },
      { id: 'btnRst', kind: 'switch_push', closed: false, a: { col: 7, row: 3 }, b: { col: 7, row: 4 }, locked: true, label: 'RST' },
    ],
    initialWires: [
      { id: 'w-v1', a: { col: 0, row: 1 }, b: { col: 2, row: 0 }, color: 'red', locked: true },
      { id: 'w-v2', a: { col: 2, row: 0 }, b: { col: 6, row: 0 }, color: 'red', locked: true },
      { id: 'w-g1', a: { col: 0, row: 4 }, b: { col: 1, row: 4 }, color: 'black', locked: true },
      { id: 'w-g2', a: { col: 1, row: 4 }, b: { col: 2, row: 4 }, color: 'black', locked: true },
      { id: 'w-g3', a: { col: 2, row: 4 }, b: { col: 6, row: 4 }, color: 'black', locked: true },
      { id: 'w-g4', a: { col: 6, row: 4 }, b: { col: 7, row: 4 }, color: 'black', locked: true },
      { id: 'w-b1', a: { col: 1, row: 3 }, b: { col: 2, row: 3 }, color: 'amber', locked: true },
      { id: 'w-b2', a: { col: 7, row: 3 }, b: { col: 6, row: 3 }, color: 'blue', locked: true },
    ],
    tray: [
      { templateId: 'res-4k7', kind: 'resistor', name: { en: '4.7kΩ Feedback Resistor', pl: 'Rezystor sprzężenia 4,7kΩ' }, shortLabel: { en: '4.7kΩ', pl: '4.7kΩ' }, resistance: 4700, limit: 2 },
    ],
    lesson: {
      principle: { en: 'Positive Feedback = Static RAM (1 Bit)', pl: 'Sprzężenie zwrotne = pamięć SRAM (1 bit)' },
      formula: { en: 'Q1 Collector → 4.7kΩ → Q2 Base   &&   Q2 Collector → 4.7kΩ → Q1 Base', pl: 'Kolektor Q1 → 4,7kΩ → Baza Q2   i   Kolektor Q2 → 4,7kΩ → Baza Q1' },
      explanation: {
        en: 'When Q1 is OFF, its collector pulls Q2 Base HIGH, locking Q2 ON—which holds Q1 Base LOW! That self-reinforcing loop stores 1 bit forever as long as power stays on.',
        pl: 'Gdy Q1 jest WYŁ, jego kolektor włącza Q2, który z kolei blokuje bazę Q1! Ta samopodtrzymująca pętla przechowuje 1 bit pamięci tak długo, jak podłączona jest bateria.',
      },
    },
    evaluate: (board, _sim, _history, lang: Language = 'en') => {
      // Programmatically verify bistability: press SET -> release -> check state A; press RST -> release -> check opposite state B!
      const pressSet = solveCircuit(withSwitches(board, { btnSet: true, btnRst: false }));
      const releaseAfterSet = solveCircuit(
        withSwitches(board, { btnSet: false, btnRst: false }),
        'en',
        DEFAULT_ENVIRONMENT,
        pressSet.nodeVoltages
      );

      const pressRst = solveCircuit(withSwitches(board, { btnSet: false, btnRst: true }));
      const releaseAfterRst = solveCircuit(
        withSwitches(board, { btnSet: false, btnRst: false }),
        'en',
        DEFAULT_ENVIRONMENT,
        pressRst.nodeVoltages
      );

      const holdGreen = Boolean(
        releaseAfterSet.componentStates['ledG']?.active &&
          !releaseAfterSet.componentStates['ledR']?.active &&
          !releaseAfterSet.shortCircuit
      );
      const holdRed = Boolean(
        releaseAfterRst.componentStates['ledR']?.active &&
          !releaseAfterRst.componentStates['ledG']?.active &&
          !releaseAfterRst.shortCircuit
      );

      return {
        goals: [
          {
            id: 'set',
            label: lang === 'pl' ? 'Zapamiętuje stan „1” (Zielona LED)' : 'Latches state "1" (Green LED held ON)',
            icon: 'led_green',
            satisfied: holdGreen,
          },
          {
            id: 'rst',
            label: lang === 'pl' ? 'Zapamiętuje stan „0” (Czerwona LED)' : 'Latches state "0" (Red LED held ON)',
            icon: 'led_red',
            satisfied: holdRed,
          },
        ],
        solved: holdGreen && holdRed,
      };
    },
  },
];
