import type { Language } from '../../core/i18n';
import { solveCircuit, stepTransientCircuit } from '../../engine/circuitSolver';
import {
  type CircuitBoardState,
  type CircuitComponent,
  DEFAULT_ENVIRONMENT,
  type LevelDefinition,
  createTransientMemory,
} from '../../engine/types';

function withSwitches(board: CircuitBoardState, map: Record<string, boolean>): CircuitBoardState {
  return {
    ...board,
    components: board.components.map((c: CircuitComponent) =>
      c.id in map ? { ...c, closed: map[c.id] } : c
    ),
  };
}

export const KID_MISSIONS: LevelDefinition[] = [
  // ==================== CHAPTER 1: FIRST SPARKS (M1–M5) ====================
  {
    id: 'kid-1-light-up',
    mode: 'kid',
    tier: 1,
    order: 1,
    title: { en: 'Light Up!', pl: 'Zaświeć Lampkę!' },
    subtitle: {
      en: 'Connect the glowing dotted lines to light the Red LED!',
      pl: 'Połącz kropkowane linie kabelkiem, żeby zaświecić czerwoną lampkę!',
    },
    conceptTag: { en: 'Mission 1', pl: 'Misja 1' },
    narrationPrompt: {
      en: 'Mission one: Light Up! Drag your finger along the dotted lines to plug in the wires and make the red light glow!',
      pl: 'Misja pierwsza: Zaświeć lampkę! Przeciągnij palcem po kropkowanych liniach, żeby podłączyć kabelki i zaświecić czerwoną lampkę!',
    },
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
      principle: { en: 'Complete the Circle!', pl: 'Zamknij kółeczko!' },
      formula: { en: '+ → Helper → Light → −', pl: '+ → Pomocnik → Lampka → −' },
      explanation: {
        en: 'Electricity loves a complete circle from the top of the battery all the way back to the bottom!',
        pl: 'Prąd uwielbia pełne kółeczko — od plusa baterii, przez lampkę, z powrotem do minusa!',
      },
    },
    evaluate: (_board, sim, _history, lang: Language = 'en') => {
      const ok = Boolean(sim.componentStates['led1']?.active && !sim.componentStates['led1']?.overloaded && !sim.shortCircuit);
      return {
        goals: [{ id: 'led', label: lang === 'pl' ? 'Czerwona lampka' : 'Red Light ON', icon: 'led_red', satisfied: ok }],
        solved: ok,
      };
    },
  },
  {
    id: 'kid-2-spin-fan',
    mode: 'kid',
    tier: 1,
    order: 2,
    title: { en: 'Spin the Fan!', pl: 'Zakręć Wiatrakiem!' },
    subtitle: {
      en: 'Wire the battery to the fan to make it spin!',
      pl: 'Połącz baterię z wiatrakiem, żeby zaczął się kręcić!',
    },
    conceptTag: { en: 'Mission 2', pl: 'Misja 2' },
    narrationPrompt: {
      en: 'Mission two: Spin the Fan! Connect two wires from the battery to the fan to make it whoosh!',
      pl: 'Misja druga: Zakręć wiatrakiem! Połącz dwoma kabelkami baterię z wiatrakiem, żeby zaczął wirować!',
    },
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
      principle: { en: 'Electric Motion', pl: 'Elektryczny ruch' },
      formula: { en: 'Power → Motor Spin', pl: 'Prąd → Obroty wiatraka' },
      explanation: {
        en: 'Electricity flows through coils inside the motor to spin the fan blades. Try flipping the battery to spin it backwards!',
        pl: 'Prąd płynie przez silniczek i kręci łopatkami wiatraka. Spróbuj odwrócić baterię, a zakręci się w drugą stronę!',
      },
    },
    evaluate: (_board, sim, _history, lang: Language = 'en') => {
      const ok = Boolean(sim.componentStates['mot']?.active && !sim.shortCircuit);
      return {
        goals: [{ id: 'fan', label: lang === 'pl' ? 'Wiatrak się kręci' : 'Fan Spinning', icon: 'motor', satisfied: ok }],
        solved: ok,
      };
    },
  },
  {
    id: 'kid-3-buzz-button',
    mode: 'kid',
    tier: 1,
    order: 3,
    title: { en: 'Buzz Button!', pl: 'Przycisk Brzęczyka!' },
    subtitle: {
      en: 'Connect the big red button and press it to make the buzzer sing!',
      pl: 'Podłącz czerwony przycisk i naciśnij go, żeby brzęczyk zaśpiewał!',
    },
    conceptTag: { en: 'Mission 3', pl: 'Misja 3' },
    narrationPrompt: {
      en: 'Mission three: Buzz Button! Plug in the wires, then press and hold the big red button to make the buzzer sing!',
      pl: 'Misja trzecia: Przycisk brzęczyka! Podłącz kabelki, a potem wciśnij i przytrzymaj czerwony przycisk, żeby brzęczyk zabrzęczał!',
    },
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
      principle: { en: 'Push-Button Bridge', pl: 'Mostek w przycisku' },
      formula: { en: 'Press = Bridge Closed', pl: 'Wciśnięty = Mostek zamknięty' },
      explanation: {
        en: 'Pressing the red button closes a tiny metal bridge inside so electricity can rush to the buzzer!',
        pl: 'Kiedy naciskasz czerwony przycisk, w środku zamyka się malutki mostek i prąd może pobiec do brzęczyka!',
      },
    },
    evaluate: (_board, sim, _history, lang: Language = 'en') => {
      const ok = Boolean(sim.componentStates['buz']?.active && !sim.shortCircuit);
      return {
        goals: [
          { id: 'btn', label: lang === 'pl' ? 'Naciśnij przycisk' : 'Press Button', icon: 'switch', satisfied: ok },
          { id: 'buz', label: lang === 'pl' ? 'Brzęczyk gra' : 'Buzzer Sing', icon: 'buzzer', satisfied: ok },
        ],
        solved: ok,
      };
    },
  },
  {
    id: 'kid-4-traffic-glow',
    mode: 'kid',
    tier: 1,
    order: 4,
    title: { en: 'Traffic Lights!', pl: 'Sygnalizacja!' },
    subtitle: {
      en: 'Light up BOTH the Red light and the Green light!',
      pl: 'Zaświeć jednocześnie czerwoną i zieloną lampkę!',
    },
    conceptTag: { en: 'Mission 4', pl: 'Misja 4' },
    narrationPrompt: {
      en: 'Mission four: Traffic Lights! Connect wires so both the red light and the green light glow at the same time!',
      pl: 'Misja czwarta: Sygnalizacja! Podłącz kabelki tak, żeby czerwona i zielona lampka świeciły naraz!',
    },
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
      principle: { en: 'Two Paths!', pl: 'Dwie ścieżki!' },
      formula: { en: 'Split the Power Rail', pl: 'Prąd dzieli się na dwie drogi' },
      explanation: {
        en: 'Electricity can split into two roads at the same time so both lights shine bright!',
        pl: 'Prąd potrafi podzielić się na dwie drogi naraz, dzięki czemu obie lampki świecą jasno!',
      },
    },
    evaluate: (_board, sim, _history, lang: Language = 'en') => {
      const rOk = Boolean(sim.componentStates['ledR']?.active && !sim.componentStates['ledR']?.overloaded);
      const gOk = Boolean(sim.componentStates['ledG']?.active && !sim.componentStates['ledG']?.overloaded);
      return {
        goals: [
          { id: 'r', label: lang === 'pl' ? 'Czerwona' : 'Red Light', icon: 'led_red', satisfied: rOk },
          { id: 'g', label: lang === 'pl' ? 'Zielona' : 'Green Light', icon: 'led_green', satisfied: gOk },
        ],
        solved: rOk && gOk && !sim.shortCircuit,
      };
    },
  },
  {
    id: 'kid-5-super-machine',
    mode: 'kid',
    tier: 1,
    order: 5,
    title: { en: 'Super Machine!', pl: 'Super Maszyna!' },
    subtitle: {
      en: 'Make the Green Light glow, the Fan spin, AND the Buzzer sing!',
      pl: 'Uruchom naraz zieloną lampkę, wirujący wiatrak i brzęczyk!',
    },
    conceptTag: { en: 'Mission 5', pl: 'Misja 5' },
    narrationPrompt: {
      en: 'Mission five: Super Machine! Make the fan spin, the buzzer sing, and the green light shine all together! Remember to use a Helper piece for the green light.',
      pl: 'Misja piąta: Super Maszyna! Spraw, żeby wiatrak się kręcił, brzęczyk grał, a zielona lampka świeciła — wszystko naraz! Pamiętaj o Pomocniku dla zielonej lampki.',
    },
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
      {
        templateId: 'res-220',
        kind: 'resistor',
        name: { en: 'Helper', pl: 'Pomocnik' },
        shortLabel: { en: 'Helper', pl: 'Pomocnik' },
        resistance: 220,
        limit: 2,
      },
    ],
    lesson: {
      principle: { en: 'Master Inventor!', pl: 'Mistrz Wynalazków!' },
      formula: { en: 'Light + Fan + Buzzer', pl: 'Światło + Wiatrak + Brzęczyk' },
      explanation: {
        en: 'You built a whole machine with light, motion, and sound all running together!',
        pl: 'Zbudowałeś prawdziwą maszynę ze światłem, ruchem i dźwiękiem działającymi jednocześnie!',
      },
    },
    evaluate: (_board, sim, _history, lang: Language = 'en') => {
      const mOk = Boolean(sim.componentStates['mot']?.active);
      const bOk = Boolean(sim.componentStates['buz']?.active);
      const lOk = Boolean(sim.componentStates['ledG']?.active && !sim.componentStates['ledG']?.overloaded);
      return {
        goals: [
          { id: 'fan', label: lang === 'pl' ? 'Wiatrak' : 'Fan', icon: 'motor', satisfied: mOk },
          { id: 'buz', label: lang === 'pl' ? 'Brzęczyk' : 'Buzzer', icon: 'buzzer', satisfied: bOk },
          { id: 'led', label: lang === 'pl' ? 'Zielona lampka' : 'Green Light', icon: 'led_green', satisfied: lOk },
        ],
        solved: mOk && bOk && lOk && !sim.shortCircuit,
      };
    },
  },

  // ==================== CHAPTER 2: SMART GADGETS (M6–M8) ====================
  {
    id: 'kid-6-magic-swap',
    mode: 'kid',
    tier: 2,
    order: 6,
    title: { en: 'Color Swapper!', pl: 'Magiczny Przełącznik!' },
    subtitle: {
      en: 'Connect the 3-way switch to swap between Red and Green lights!',
      pl: 'Podłącz przełącznik, żeby zmieniać światło między czerwonym a zielonym!',
    },
    conceptTag: { en: 'Mission 6', pl: 'Misja 6' },
    narrationPrompt: {
      en: 'Mission six: Color Swapper! Connect the dotted wires to the three-way switch, then tap the switch to jump between the red light and the green light!',
      pl: 'Misja szósta: Magiczny przełącznik! Podłącz kropkowane kabelki do przełącznika, a potem klikaj go, żeby przełączać między czerwoną a zieloną lampką!',
    },
    cols: 6,
    rows: 4,
    initialComponents: [
      { id: 'bat', kind: 'battery', voltage: 3, a: { col: 0, row: 1 }, b: { col: 0, row: 2 }, locked: true },
      { id: 'spdt', kind: 'switch_spdt', closed: false, a: { col: 2, row: 0 }, c: { col: 2, row: 1 }, b: { col: 2, row: 2 }, locked: true },
      { id: 'r1', kind: 'resistor', resistance: 47, a: { col: 3, row: 0 }, b: { col: 4, row: 0 }, locked: true },
      { id: 'ledR', kind: 'led', ledColor: 'red', a: { col: 4, row: 0 }, b: { col: 4, row: 1 }, locked: true },
      { id: 'r2', kind: 'resistor', resistance: 47, a: { col: 3, row: 2 }, b: { col: 4, row: 2 }, locked: true },
      { id: 'ledG', kind: 'led', ledColor: 'green', a: { col: 4, row: 2 }, b: { col: 4, row: 3 }, locked: true },
    ],
    initialWires: [
      { id: 'w-g1', a: { col: 4, row: 1 }, b: { col: 5, row: 1 }, color: 'black', locked: true },
      { id: 'w-g2', a: { col: 5, row: 1 }, b: { col: 4, row: 3 }, color: 'black', locked: true },
      { id: 'w-g3', a: { col: 4, row: 3 }, b: { col: 0, row: 2 }, color: 'black', locked: true },
    ],
    tray: [],
    guideWire: [
      { a: { col: 0, row: 1 }, b: { col: 2, row: 1 } },
      { a: { col: 2, row: 0 }, b: { col: 3, row: 0 } },
      { a: { col: 2, row: 2 }, b: { col: 3, row: 2 } },
    ],
    lesson: {
      principle: { en: 'Train-Track Switch!', pl: 'Zwrotnica kolejowa!' },
      formula: { en: 'Up = Red   |   Down = Green', pl: 'Góra = Czerwona   |   Dół = Zielona' },
      explanation: {
        en: 'A three-way switch works just like a train track switch—sending electricity down road A or road B!',
        pl: 'Taki przełącznik działa jak zwrotnica kolejowa — kieruje prąd raz na górny tor, a raz na dolny!',
      },
    },
    evaluate: (board, sim, _history, lang: Language = 'en') => {
      const sA = solveCircuit(withSwitches(board, { spdt: false }));
      const sB = solveCircuit(withSwitches(board, { spdt: true }));
      const swaps = Boolean(
        sA.componentStates['ledR']?.active &&
          !sA.componentStates['ledG']?.active &&
          sB.componentStates['ledG']?.active &&
          !sB.componentStates['ledR']?.active &&
          !sim.shortCircuit
      );
      return {
        goals: [
          { id: 'r', label: lang === 'pl' ? 'Czerwona' : 'Red', icon: 'led_red', satisfied: Boolean(sA.componentStates['ledR']?.active) },
          { id: 'g', label: lang === 'pl' ? 'Zielona' : 'Green', icon: 'led_green', satisfied: Boolean(sB.componentStates['ledG']?.active) },
        ],
        solved: swaps,
      };
    },
  },
  {
    id: 'kid-7-sun-moon',
    mode: 'kid',
    tier: 2,
    order: 7,
    title: { en: 'Sun & Moon Lamp!', pl: 'Słońce i Księżyc!' },
    subtitle: {
      en: 'Wire the Sunshine Sensor and slide to bright Sun to light the lamp!',
      pl: 'Podłącz Czujnik Słońca i przesuń suwak na Słoneczko!',
    },
    conceptTag: { en: 'Mission 7', pl: 'Misja 7' },
    narrationPrompt: {
      en: 'Mission seven: Sun and Moon Lamp! Connect the light sensor piece, then slide the Sun and Moon slider to bright sunshine to make the yellow light shine!',
      pl: 'Misja siódma: Słońce i Księżyc! Podłącz czujnik światła, a potem przesuń suwak w stronę słoneczka, żeby żółta lampka zaświeciła jasno!',
    },
    cols: 6,
    rows: 4,
    initialEnvironment: { lightLevel: 0.15 },
    initialComponents: [
      { id: 'bat', kind: 'battery', voltage: 6, a: { col: 1, row: 1 }, b: { col: 1, row: 2 }, locked: true },
      { id: 'r1', kind: 'resistor', resistance: 100, a: { col: 2, row: 1 }, b: { col: 3, row: 1 }, locked: true },
      { id: 'ldr1', kind: 'ldr', a: { col: 3, row: 1 }, b: { col: 4, row: 1 }, locked: true },
      { id: 'led1', kind: 'led', ledColor: 'amber', a: { col: 4, row: 1 }, b: { col: 4, row: 2 }, locked: true },
    ],
    initialWires: [],
    tray: [],
    guideWire: [
      { a: { col: 1, row: 1 }, b: { col: 2, row: 1 } },
      { a: { col: 4, row: 2 }, b: { col: 1, row: 2 } },
    ],
    lesson: {
      principle: { en: 'Seeing Light!', pl: 'Czujnik widzi światło!' },
      formula: { en: '☀️ Bright = Light ON', pl: '☀️ Słońce = Lampka świeci' },
      explanation: {
        en: 'The sunshine sensor opens the gate wide when bright light hits it, letting electricity zoom to the lamp!',
        pl: 'Czujnik słońca otwiera szeroko bramkę, gdy padają na niego promienie, i pozwala prądowi popłynąć do lampki!',
      },
    },
    evaluate: (board, sim, _history, lang: Language = 'en') => {
      const sunSim = solveCircuit(board, 'en', { ...DEFAULT_ENVIRONMENT, lightLevel: 1 });
      const darkSim = solveCircuit(board, 'en', { ...DEFAULT_ENVIRONMENT, lightLevel: 0 });
      const wired = Boolean(sunSim.componentStates['led1']?.active && !darkSim.componentStates['led1']?.active);
      const brightNow = Boolean(sim.componentStates['led1']?.active && (sim.componentStates['led1']?.current ?? 0) >= 0.008);
      return {
        goals: [
          { id: 'sun', label: lang === 'pl' ? 'Przesuń na Słońce' : 'Slide to Sun', icon: 'sun', satisfied: wired && brightNow },
          { id: 'led', label: lang === 'pl' ? 'Żółta lampka' : 'Amber Light', icon: 'led_amber', satisfied: brightNow },
        ],
        solved: wired && brightNow && !sim.shortCircuit,
      };
    },
  },
  {
    id: 'kid-8-hot-alarm',
    mode: 'kid',
    tier: 2,
    order: 8,
    title: { en: 'Hot Alarm!', pl: 'Gorący Alarm!' },
    subtitle: {
      en: 'Wire the Heat Sensor and slide to Hot to sound the alarm!',
      pl: 'Podłącz Czujnik Ciepła i przesuń na Gorąco, żeby włączyć alarm!',
    },
    conceptTag: { en: 'Mission 8', pl: 'Misja 8' },
    narrationPrompt: {
      en: 'Mission eight: Hot Alarm! Connect the wires to the heat sensor and buzzer, then slide the temperature up to Hot to hear the fire alarm!',
      pl: 'Misja ósma: Gorący Alarm! Podłącz kabelki do czujnika ciepła i brzęczyka, a potem przesuń termometr na Gorąco, żeby włączyć alarm!',
    },
    cols: 6,
    rows: 4,
    initialEnvironment: { temperature: 0.1 },
    initialComponents: [
      { id: 'bat', kind: 'battery', voltage: 9, a: { col: 1, row: 1 }, b: { col: 1, row: 2 }, locked: true },
      { id: 'ntc', kind: 'thermistor', a: { col: 2, row: 1 }, b: { col: 3, row: 1 }, locked: true },
      { id: 'buz', kind: 'buzzer', a: { col: 4, row: 1 }, b: { col: 4, row: 2 }, locked: true },
    ],
    initialWires: [],
    tray: [],
    guideWire: [
      { a: { col: 1, row: 1 }, b: { col: 2, row: 1 } },
      { a: { col: 3, row: 1 }, b: { col: 4, row: 1 } },
      { a: { col: 4, row: 2 }, b: { col: 1, row: 2 } },
    ],
    lesson: {
      principle: { en: 'Feeling Heat!', pl: 'Czujnik czuje ciepło!' },
      formula: { en: '🔥 Hot = Alarm ON', pl: '🔥 Gorąco = Alarm gra!' },
      explanation: {
        en: 'When the heat sensor warms up, it lets electricity rush through to ring the alarm—just like a real smoke detector!',
        pl: 'Gdy czujnik ciepła się rozgrzeje, przepuszcza prąd i uruchamia brzęczyk — zupełnie jak prawdziwy czujnik pożarowy!',
      },
    },
    evaluate: (_board, sim, _history, lang: Language = 'en') => {
      const ok = Boolean(sim.componentStates['buz']?.active && !sim.shortCircuit);
      return {
        goals: [
          { id: 'hot', label: lang === 'pl' ? 'Gorąco!' : 'Hot!', icon: 'fire', satisfied: ok },
          { id: 'buz', label: lang === 'pl' ? 'Alarm!' : 'Alarm!', icon: 'buzzer', satisfied: ok },
        ],
        solved: ok,
      };
    },
  },

  // ==================== CHAPTER 3: MAGIC BOOSTERS (M9–M10) ====================
  {
    id: 'kid-9-magic-nightlight',
    mode: 'kid',
    tier: 3,
    order: 9,
    title: { en: 'Magic Night-Light!', pl: 'Lampka Nocna!' },
    subtitle: {
      en: 'Snap in the Magic Booster (NPN) and slide to Moon to turn ON the night-light automatically!',
      pl: 'Wepnij Magiczny Wzmacniacz (NPN) i przesuń na Księżyc, żeby lampka sama się zapaliła!',
    },
    conceptTag: { en: 'Mission 9', pl: 'Misja 9' },
    narrationPrompt: {
      en: 'Mission nine: Magic Night-Light! Wire the Moon sensor so when you slide to nighttime, the Magic Booster automatically turns on the cozy yellow night-light!',
      pl: 'Misja dziewiąta: Lampka Nocna! Podłącz kabelki do Księżycowego czujnika, a potem przesuń suwak na Noc, żeby Magiczny Wzmacniacz sam zapalił lampkę!',
    },
    cols: 6,
    rows: 4,
    initialEnvironment: { lightLevel: 0.9 },
    initialComponents: [
      { id: 'bat', kind: 'battery', voltage: 6, a: { col: 0, row: 1 }, b: { col: 0, row: 3 }, locked: true },
      { id: 'rUp', kind: 'resistor', resistance: 10000, a: { col: 2, row: 0 }, b: { col: 2, row: 1 }, locked: true },
      { id: 'ldr1', kind: 'ldr', a: { col: 2, row: 2 }, b: { col: 2, row: 3 }, locked: true },
      { id: 'rLed', kind: 'resistor', resistance: 220, a: { col: 5, row: 0 }, b: { col: 5, row: 1 }, locked: true },
      { id: 'led1', kind: 'led', ledColor: 'amber', a: { col: 5, row: 1 }, b: { col: 5, row: 2 }, locked: true },
      { id: 'q1', kind: 'transistor_npn', a: { col: 5, row: 2 }, c: { col: 4, row: 2 }, b: { col: 3, row: 2 }, locked: true },
    ],
    initialWires: [
      { id: 'w-v1', a: { col: 0, row: 1 }, b: { col: 2, row: 0 }, color: 'red', locked: true },
      { id: 'w-v2', a: { col: 2, row: 0 }, b: { col: 5, row: 0 }, color: 'red', locked: true },
      { id: 'w-g1', a: { col: 2, row: 3 }, b: { col: 0, row: 3 }, color: 'black', locked: true },
      { id: 'w-g2', a: { col: 3, row: 2 }, b: { col: 2, row: 3 }, color: 'black', locked: true },
    ],
    tray: [],
    guideWire: [
      { a: { col: 2, row: 1 }, b: { col: 2, row: 2 } },
      { a: { col: 2, row: 2 }, b: { col: 4, row: 2 } },
    ],
    lesson: {
      principle: { en: 'Automatic Streetlight!', pl: 'Automatyczna latarnia!' },
      formula: { en: '🌙 Night ⇒ Magic Booster turns Lamp ON!', pl: '🌙 Noc ⇒ Wzmacniacz zapala lampkę!' },
      explanation: {
        en: 'Real streetlights use a tiny transistor booster just like this so they wake up all by themselves at bedtime!',
        pl: 'Prawdziwe latarnie uliczne mają w środku taki sam tranzystor, dzięki czemu same budzą się, gdy zapada zmrok!',
      },
    },
    evaluate: (board, sim, _history, lang: Language = 'en') => {
      const sunSim = solveCircuit(board, 'en', { ...DEFAULT_ENVIRONMENT, lightLevel: 1 });
      const nightSim = solveCircuit(board, 'en', { ...DEFAULT_ENVIRONMENT, lightLevel: 0 });
      const auto = Boolean(!sunSim.componentStates['led1']?.active && nightSim.componentStates['led1']?.active);
      const onNow = Boolean(sim.componentStates['led1']?.active && !sim.shortCircuit);
      return {
        goals: [
          { id: 'moon', label: lang === 'pl' ? 'Przesuń na Noc' : 'Slide to Night', icon: 'sun', satisfied: auto && onNow },
          { id: 'led', label: lang === 'pl' ? 'Lampka świeci' : 'Night-Light ON', icon: 'led_amber', satisfied: onNow },
        ],
        solved: auto && onNow,
      };
    },
  },
  {
    id: 'kid-10-touch-booster',
    mode: 'kid',
    tier: 3,
    order: 10,
    title: { en: 'Super Fan Booster!', pl: 'Super Wzmacniacz!' },
    subtitle: {
      en: 'Wire the Magic Booster so a tiny tap on the Red Button spins the giant fan!',
      pl: 'Podłącz Magiczny Wzmacniacz, żeby czerwony przycisk uruchamiał wielki wiatrak!',
    },
    conceptTag: { en: 'Mission 10', pl: 'Misja 10' },
    narrationPrompt: {
      en: 'Mission ten: Super Fan Booster! Plug in the dotted wires to the Magic Booster, then press and hold the red button to blast the fan!',
      pl: 'Misja dziesiąta: Super Wzmacniacz! Połącz kropkowane linie z Magicznym Wzmacniaczem, a potem wciśnij czerwony przycisk, żeby rozkręcić wiatrak!',
    },
    cols: 6,
    rows: 4,
    initialComponents: [
      { id: 'bat', kind: 'battery', voltage: 6, a: { col: 0, row: 1 }, b: { col: 0, row: 3 }, locked: true },
      { id: 'btn', kind: 'switch_push', closed: false, a: { col: 1, row: 1 }, b: { col: 2, row: 1 }, locked: true },
      { id: 'rb', kind: 'resistor', resistance: 1000, a: { col: 2, row: 1 }, b: { col: 3, row: 1 }, locked: true },
      { id: 'mot', kind: 'motor', a: { col: 5, row: 0 }, b: { col: 5, row: 1 }, locked: true },
      { id: 'q1', kind: 'transistor_npn', a: { col: 5, row: 1 }, c: { col: 5, row: 2 }, b: { col: 5, row: 3 }, locked: true },
    ],
    initialWires: [
      { id: 'w-v1', a: { col: 0, row: 1 }, b: { col: 1, row: 1 }, color: 'red', locked: true },
      { id: 'w-v2', a: { col: 0, row: 1 }, b: { col: 5, row: 0 }, color: 'red', locked: true },
    ],
    tray: [],
    guideWire: [
      { a: { col: 3, row: 1 }, b: { col: 5, row: 2 } },
      { a: { col: 5, row: 3 }, b: { col: 0, row: 3 } },
    ],
    lesson: {
      principle: { en: 'Tiny Signal, Giant Power!', pl: 'Mały sygnał, wielka moc!' },
      formula: { en: 'Tiny Button Tickle ⇒ Full Fan Whoosh!', pl: 'Mały prąd z przycisku ⇒ Wiatrak na maksa!' },
      explanation: {
        en: 'A transistor lets a super gentle tickle of electricity turn on a huge motor—that is how robot brains move heavy arms!',
        pl: 'Tranzystor pozwala malutkiemu sygnałowi uruchomić duży silnik — właśnie tak mózgi robotów poruszają silnymi ramionami!',
      },
    },
    evaluate: (_board, sim, _history, lang: Language = 'en') => {
      const ok = Boolean(sim.componentStates['mot']?.active && !sim.shortCircuit);
      return {
        goals: [
          { id: 'chip', label: lang === 'pl' ? 'Wzmacniacz WŁ' : 'Booster ON', icon: 'chip', satisfied: Boolean(sim.componentStates['q1']?.active) },
          { id: 'fan', label: lang === 'pl' ? 'Wiatrak kręci!' : 'Fan Spinning!', icon: 'motor', satisfied: ok },
        ],
        solved: ok,
      };
    },
  },

  // ==================== CHAPTER 4: GLOWS & WAVES (M11–M13) ====================
  {
    id: 'kid-11-firefly-fade',
    mode: 'kid',
    tier: 4,
    order: 11,
    title: { en: 'Firefly Fade!', pl: 'Świetlik!' },
    subtitle: {
      en: 'Plug in the Energy Tank so the Green Firefly glows softly even after you switch OFF!',
      pl: 'Wepnij Zbiornik Energii, żeby zielony świetlik świecił jeszcze chwilkę po wyłączeniu!',
    },
    conceptTag: { en: 'Mission 11', pl: 'Misja 11' },
    narrationPrompt: {
      en: 'Mission eleven: Firefly Fade! Place the blue Energy Tank on the board to store glowing power like a real firefly!',
      pl: 'Misja jedenasta: Świetlik! Wepnij niebieski Zbiornik Energii na płytkę, żeby lampka świeciła miękko jak prawdziwy świetlik!',
    },
    cols: 6,
    rows: 4,
    initialComponents: [
      { id: 'bat', kind: 'battery', voltage: 6, a: { col: 0, row: 1 }, b: { col: 0, row: 2 }, locked: true },
      { id: 'sw1', kind: 'switch_toggle', closed: true, a: { col: 1, row: 1 }, b: { col: 2, row: 1 }, locked: true },
      { id: 'r1', kind: 'resistor', resistance: 220, a: { col: 4, row: 1 }, b: { col: 5, row: 1 }, locked: true },
      { id: 'led1', kind: 'led', ledColor: 'green', a: { col: 5, row: 1 }, b: { col: 5, row: 2 }, locked: true },
    ],
    initialWires: [
      { id: 'w-1', a: { col: 0, row: 1 }, b: { col: 1, row: 1 }, color: 'red', locked: true },
      { id: 'w-2', a: { col: 2, row: 1 }, b: { col: 4, row: 1 }, color: 'red', locked: true },
      { id: 'w-g', a: { col: 5, row: 2 }, b: { col: 0, row: 2 }, color: 'black', locked: true },
    ],
    tray: [
      {
        templateId: 'cap-1000',
        kind: 'capacitor',
        name: { en: 'Energy Tank', pl: 'Zbiornik Energii' },
        shortLabel: { en: 'Tank', pl: 'Zbiornik' },
        capacitance: 1000e-6,
        limit: 1,
      },
    ],
    lesson: {
      principle: { en: 'Electricity Bucket!', pl: 'Wiaderko z prądem!' },
      formula: { en: 'Full Tank ⇒ Slow Firefly Fade!', pl: 'Pełny zbiornik ⇒ Powolne gaśnięcie!' },
      explanation: {
        en: 'The Energy Tank fills up with electricity and lets it trickle out slowly—just like a glowing firefly!',
        pl: 'Zbiornik energii napełnia się prądem i powoli go oddaje — dzięki temu lampka miękko gaśnie jak świetlik!',
      },
    },
    evaluate: (board, sim, _history, lang: Language = 'en') => {
      const cap = board.components.find((c) => c.kind === 'capacitor');
      let fades = false;
      if (cap) {
        const mem = createTransientMemory();
        const onB = withSwitches(board, { sw1: true });
        const offB = withSwitches(board, { sw1: false });
        for (let i = 0; i < 25; i++) stepTransientCircuit(onB, mem, 0.02);
        let afterOff = stepTransientCircuit(offB, mem, 0.02);
        for (let i = 0; i < 6; i++) afterOff = stepTransientCircuit(offB, mem, 0.02);
        fades = Boolean(afterOff.componentStates['led1']?.active && !afterOff.shortCircuit);
      }
      return {
        goals: [
          { id: 'tank', label: lang === 'pl' ? 'Zbiornik' : 'Tank', icon: 'bolt', satisfied: Boolean(cap) },
          { id: 'glow', label: lang === 'pl' ? 'Świetlik!' : 'Firefly!', icon: 'led_green', satisfied: fades },
        ],
        solved: fades && !sim.shortCircuit,
      };
    },
  },
  {
    id: 'kid-12-lighthouse',
    mode: 'kid',
    tier: 4,
    order: 12,
    title: { en: 'Blinking Lighthouse!', pl: 'Latarnia Morska!' },
    subtitle: {
      en: 'Connect the last dotted wire to make Red and Green flash back and forth by themselves!',
      pl: 'Podłącz ostatni kabelek, żeby czerwona i zielona lampka zaczęły same migać naprzemiennie!',
    },
    conceptTag: { en: 'Mission 12', pl: 'Misja 12' },
    narrationPrompt: {
      en: 'Mission twelve: Blinking Lighthouse! Plug in the dotted wires so the red and green lighthouse beams blink back and forth all by themselves!',
      pl: 'Misja dwunasta: Latarnia Morska! Podłącz kropkowane kabelki, żeby czerwone i zielone światło latarni zaczęły same migać na zmianę!',
    },
    cols: 8,
    rows: 5,
    initialComponents: [
      { id: 'bat', kind: 'battery', voltage: 6, a: { col: 0, row: 1 }, b: { col: 0, row: 4 }, locked: true },
      { id: 'rc1', kind: 'resistor', resistance: 330, a: { col: 1, row: 0 }, b: { col: 1, row: 1 }, locked: true },
      { id: 'ledR', kind: 'led', ledColor: 'red', a: { col: 2, row: 0 }, b: { col: 2, row: 1 }, locked: true },
      { id: 'rb1', kind: 'resistor', resistance: 10000, a: { col: 3, row: 0 }, b: { col: 3, row: 2 }, locked: true },
      { id: 'q1', kind: 'transistor_npn', a: { col: 1, row: 1 }, c: { col: 1, row: 2 }, b: { col: 1, row: 3 }, locked: true },
      { id: 'rc2', kind: 'resistor', resistance: 330, a: { col: 6, row: 0 }, b: { col: 6, row: 1 }, locked: true },
      { id: 'ledG', kind: 'led', ledColor: 'green', a: { col: 7, row: 0 }, b: { col: 7, row: 1 }, locked: true },
      { id: 'rb2', kind: 'resistor', resistance: 10000, a: { col: 5, row: 0 }, b: { col: 5, row: 2 }, locked: true },
      { id: 'q2', kind: 'transistor_npn', a: { col: 6, row: 1 }, c: { col: 6, row: 2 }, b: { col: 6, row: 3 }, locked: true },
      { id: 'c1', kind: 'capacitor', capacitance: 47e-6, a: { col: 3, row: 1 }, b: { col: 4, row: 1 }, locked: true },
      { id: 'c2', kind: 'capacitor', capacitance: 47e-6, a: { col: 4, row: 3 }, b: { col: 5, row: 3 }, locked: true },
    ],
    initialWires: [
      { id: 'w-v0', a: { col: 0, row: 1 }, b: { col: 1, row: 0 }, color: 'red', locked: true },
      { id: 'w-v1', a: { col: 1, row: 0 }, b: { col: 2, row: 0 }, color: 'red', locked: true },
      { id: 'w-v2', a: { col: 2, row: 0 }, b: { col: 3, row: 0 }, color: 'red', locked: true },
      { id: 'w-v3', a: { col: 3, row: 0 }, b: { col: 5, row: 0 }, color: 'red', locked: true },
      { id: 'w-v4', a: { col: 5, row: 0 }, b: { col: 6, row: 0 }, color: 'red', locked: true },
      { id: 'w-v5', a: { col: 6, row: 0 }, b: { col: 7, row: 0 }, color: 'red', locked: true },
      { id: 'w-l1', a: { col: 2, row: 1 }, b: { col: 1, row: 1 }, color: 'amber', locked: true },
      { id: 'w-l2', a: { col: 7, row: 1 }, b: { col: 6, row: 1 }, color: 'green', locked: true },
      { id: 'w-b1', a: { col: 3, row: 2 }, b: { col: 1, row: 2 }, color: 'blue', locked: true },
      { id: 'w-b2', a: { col: 5, row: 2 }, b: { col: 6, row: 2 }, color: 'blue', locked: true },
      { id: 'w-g1', a: { col: 1, row: 3 }, b: { col: 0, row: 4 }, color: 'black', locked: true },
      { id: 'w-g2', a: { col: 6, row: 3 }, b: { col: 0, row: 4 }, color: 'black', locked: true },
      { id: 'w-c1a', a: { col: 1, row: 1 }, b: { col: 3, row: 1 }, color: 'amber', locked: true },
      { id: 'w-c2b', a: { col: 5, row: 3 }, b: { col: 6, row: 1 }, color: 'green', locked: true },
    ],
    tray: [],
    guideWire: [
      { a: { col: 4, row: 1 }, b: { col: 5, row: 2 } },
      { a: { col: 4, row: 3 }, b: { col: 3, row: 2 } },
    ],
    lesson: {
      principle: { en: 'Automatic Blinker!', pl: 'Samodzielny migacz!' },
      formula: { en: 'Red → Green → Red → Green!', pl: 'Czerwone → Zielone → Czerwone!' },
      explanation: {
        en: 'The two energy tanks take turns filling up and nudging each other—like a real blinking lighthouse!',
        pl: 'Dwa zbiorniki energii na zmianę się napełniają i popychają — dokładnie jak światła w prawdziwej latarni morskiej!',
      },
    },
    evaluate: (board, sim, _history, lang: Language = 'en') => {
      let blinks = false;
      if (!sim.shortCircuit) {
        const mem = createTransientMemory();
        let transitions = 0;
        let lastHigh: boolean | null = null;
        for (let i = 0; i < 240; i++) {
          const st = stepTransientCircuit(board, mem, 0.008);
          const isH = (st.nodeVoltages['1,1'] ?? 0) > 2.5;
          if (lastHigh !== null && isH !== lastHigh) transitions += 1;
          lastHigh = isH;
        }
        blinks = transitions >= 3;
      }
      return {
        goals: [
          { id: 'r', label: lang === 'pl' ? 'Czerwone' : 'Red', icon: 'led_red', satisfied: blinks },
          { id: 'g', label: lang === 'pl' ? 'Zielone' : 'Green', icon: 'led_green', satisfied: blinks },
        ],
        solved: blinks,
      };
    },
  },
  {
    id: 'kid-13-wave-machine',
    mode: 'kid',
    tier: 4,
    order: 13,
    title: { en: 'Wave Machine!', pl: 'Maszyna Fal!' },
    subtitle: {
      en: 'Connect the Wave Maker to the Blue Light and watch the wiggly waves dance on the Wave Screen!',
      pl: 'Podłącz Maszynę Fal do lampki i zobacz tańczące fale na kolorowym ekranie!',
    },
    conceptTag: { en: 'Mission 13', pl: 'Misja 13' },
    narrationPrompt: {
      en: 'Final Mission thirteen: Wave Machine! Plug in the dotted wires to send electricity waves to the blue light and watch them dance on the Wave Screen!',
      pl: 'Ostatnia misja trzynasta: Maszyna Fal! Podłącz kropkowane kabelki, żeby puścić fale prądu do niebieskiej lampki i zobacz, jak tańczą na ekranie!',
    },
    cols: 6,
    rows: 4,
    defaultScope: {
      open: true,
      mode: 'time',
      ch1: { col: 1, row: 1 },
      ch2: { col: 4, row: 1 },
      timeScale: 1,
    },
    initialComponents: [
      {
        id: 'ac1',
        kind: 'ac_source',
        waveform: 'sine',
        amplitude: 6,
        frequency: 2,
        a: { col: 1, row: 1 },
        b: { col: 1, row: 2 },
        locked: true,
      },
      { id: 'r1', kind: 'resistor', resistance: 220, a: { col: 2, row: 1 }, b: { col: 3, row: 1 }, locked: true },
      { id: 'ledB', kind: 'led', ledColor: 'blue', a: { col: 4, row: 1 }, b: { col: 4, row: 2 }, locked: true },
    ],
    initialWires: [],
    tray: [],
    guideWire: [
      { a: { col: 1, row: 1 }, b: { col: 2, row: 1 } },
      { a: { col: 3, row: 1 }, b: { col: 4, row: 1 } },
      { a: { col: 4, row: 2 }, b: { col: 1, row: 2 } },
    ],
    lesson: {
      principle: { en: 'Dancing Electricity Waves!', pl: 'Tańczące fale prądu!' },
      formula: { en: 'Up & Down Wave = Alternating Current (AC)', pl: 'Fala w górę i w dół = Prąd zmienny (AC)' },
      explanation: {
        en: 'You completed every Kid Mode mission! Tap the Wave Maker to wiggle its speed and shape whenever you play!',
        pl: 'Ukończyłeś wszystkie misje Małego Wynalazcy! Możesz dotknąć Maszyny Fal, żeby zmieniać jej szybkość i kształt!',
      },
    },
    evaluate: (board, sim, _history, lang: Language = 'en') => {
      const mem = createTransientMemory();
      let litEver = false;
      for (let i = 0; i < 40; i++) {
        const st = stepTransientCircuit(board, mem, 0.015);
        if (st.componentStates['ledB']?.active && !st.shortCircuit) {
          litEver = true;
          break;
        }
      }
      return {
        goals: [
          { id: 'wave', label: lang === 'pl' ? 'Fale!' : 'Waves!', icon: 'wave', satisfied: litEver },
          { id: 'blue', label: lang === 'pl' ? 'Niebieska lampka!' : 'Blue Light!', icon: 'led_blue', satisfied: litEver },
        ],
        solved: litEver && !sim.shortCircuit,
      };
    },
  },
];
