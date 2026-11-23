import type { Language } from '../core/i18n';
import { solveCircuit } from '../engine/circuitSolver';
import type {
  CircuitBoardState,
  CircuitComponent,
  LevelDefinition,
  TrayItemTemplate,
} from '../engine/types';
import { stemRegistry } from '../core/stemModule';

const SANDBOX_TRAY_ADULT: TrayItemTemplate[] = [
  { templateId: 'bat-3v', kind: 'battery', name: { en: '3V Battery', pl: 'Bateria 3V' }, shortLabel: { en: '3V', pl: '3V' }, voltage: 3, limit: null },
  { templateId: 'bat-6v', kind: 'battery', name: { en: '6V Battery', pl: 'Bateria 6V' }, shortLabel: { en: '6V', pl: '6V' }, voltage: 6, limit: null },
  { templateId: 'bat-9v', kind: 'battery', name: { en: '9V Battery', pl: 'Bateria 9V' }, shortLabel: { en: '9V', pl: '9V' }, voltage: 9, limit: null },
  { templateId: 'res-47', kind: 'resistor', name: { en: '47Ω Resistor', pl: 'Rezystor 47Ω' }, shortLabel: { en: '47Ω', pl: '47Ω' }, resistance: 47, limit: null },
  { templateId: 'res-100', kind: 'resistor', name: { en: '100Ω Resistor', pl: 'Rezystor 100Ω' }, shortLabel: { en: '100Ω', pl: '100Ω' }, resistance: 100, limit: null },
  { templateId: 'res-220', kind: 'resistor', name: { en: '220Ω Resistor', pl: 'Rezystor 220Ω' }, shortLabel: { en: '220Ω', pl: '220Ω' }, resistance: 220, limit: null },
  { templateId: 'res-330', kind: 'resistor', name: { en: '330Ω Resistor', pl: 'Rezystor 330Ω' }, shortLabel: { en: '330Ω', pl: '330Ω' }, resistance: 330, limit: null },
  { templateId: 'res-1k', kind: 'resistor', name: { en: '1kΩ Resistor', pl: 'Rezystor 1kΩ' }, shortLabel: { en: '1kΩ', pl: '1kΩ' }, resistance: 1000, limit: null },
  {
    templateId: 'rheo',
    kind: 'rheostat',
    name: { en: 'Dimmer (20Ω–1kΩ)', pl: 'Ściemniacz (20Ω–1kΩ)' },
    shortLabel: { en: 'Dimmer', pl: 'Ściemniacz' },
    resistance: 330,
    rheostatMin: 20,
    rheostatMax: 1000,
    limit: null,
  },
  { templateId: 'led-red', kind: 'led', name: { en: 'Red LED', pl: 'Czerwona LED' }, shortLabel: { en: 'Red LED', pl: 'Czerw. LED' }, ledColor: 'red', limit: null },
  { templateId: 'led-green', kind: 'led', name: { en: 'Green LED', pl: 'Zielona LED' }, shortLabel: { en: 'Green LED', pl: 'Ziel. LED' }, ledColor: 'green', limit: null },
  { templateId: 'led-amber', kind: 'led', name: { en: 'Amber LED', pl: 'Żółta LED' }, shortLabel: { en: 'Amber LED', pl: 'Żółta LED' }, ledColor: 'amber', limit: null },
  { templateId: 'led-blue', kind: 'led', name: { en: 'Blue LED', pl: 'Niebieska LED' }, shortLabel: { en: 'Blue LED', pl: 'Nieb. LED' }, ledColor: 'blue', limit: null },
  { templateId: 'sw-toggle', kind: 'switch_toggle', name: { en: 'Toggle Switch', pl: 'Przełącznik' }, shortLabel: { en: 'Switch', pl: 'Przełącz.' }, limit: null },
  { templateId: 'sw-push', kind: 'switch_push', name: { en: 'Push Button', pl: 'Przycisk' }, shortLabel: { en: 'Button', pl: 'Przycisk' }, limit: null },
  { templateId: 'motor', kind: 'motor', name: { en: 'DC Fan Motor', pl: 'Wiatrak DC' }, shortLabel: { en: 'Fan', pl: 'Wiatrak' }, limit: null },
  { templateId: 'buzzer', kind: 'buzzer', name: { en: 'Piezo Buzzer', pl: 'Brzęczyk' }, shortLabel: { en: 'Buzzer', pl: 'Brzęczyk' }, limit: null },
];

const SANDBOX_TRAY_KID: TrayItemTemplate[] = [
  { templateId: 'bat-3v', kind: 'battery', name: { en: '3V Power', pl: 'Bateria 3V' }, shortLabel: { en: '3V', pl: '3V' }, voltage: 3, limit: null },
  { templateId: 'bat-6v', kind: 'battery', name: { en: '6V Power', pl: 'Bateria 6V' }, shortLabel: { en: '6V', pl: '6V' }, voltage: 6, limit: null },
  { templateId: 'res-100', kind: 'resistor', name: { en: 'Helper', pl: 'Pomocnik' }, shortLabel: { en: 'Helper', pl: 'Pomocnik' }, resistance: 100, limit: null },
  { templateId: 'res-220', kind: 'resistor', name: { en: 'Strong Helper', pl: 'Mocny Pomocnik' }, shortLabel: { en: 'Strong', pl: 'Mocny' }, resistance: 220, limit: null },
  {
    templateId: 'rheo',
    kind: 'rheostat',
    name: { en: 'Magic Dial', pl: 'Magiczne Pokrętło' },
    shortLabel: { en: 'Dial', pl: 'Pokrętło' },
    resistance: 220,
    rheostatMin: 40,
    rheostatMax: 800,
    limit: null,
  },
  { templateId: 'led-red', kind: 'led', name: { en: 'Red Light', pl: 'Czerwona Lampka' }, shortLabel: { en: 'Red', pl: 'Czerwona' }, ledColor: 'red', limit: null },
  { templateId: 'led-green', kind: 'led', name: { en: 'Green Light', pl: 'Zielona Lampka' }, shortLabel: { en: 'Green', pl: 'Zielona' }, ledColor: 'green', limit: null },
  { templateId: 'led-amber', kind: 'led', name: { en: 'Yellow Light', pl: 'Żółta Lampka' }, shortLabel: { en: 'Yellow', pl: 'Żółta' }, ledColor: 'amber', limit: null },
  { templateId: 'led-blue', kind: 'led', name: { en: 'Blue Light', pl: 'Niebieska Lampka' }, shortLabel: { en: 'Blue', pl: 'Niebieska' }, ledColor: 'blue', limit: null },
  { templateId: 'sw-toggle', kind: 'switch_toggle', name: { en: 'Switch', pl: 'Przełącznik' }, shortLabel: { en: 'Switch', pl: 'Przełącz.' }, limit: null },
  { templateId: 'sw-push', kind: 'switch_push', name: { en: 'Button', pl: 'Przycisk' }, shortLabel: { en: 'Button', pl: 'Przycisk' }, limit: null },
  { templateId: 'motor', kind: 'motor', name: { en: 'Spinning Fan', pl: 'Wiatrak' }, shortLabel: { en: 'Fan', pl: 'Wiatrak' }, limit: null },
  { templateId: 'buzzer', kind: 'buzzer', name: { en: 'Buzzer', pl: 'Brzęczyk' }, shortLabel: { en: 'Buzzer', pl: 'Brzęczyk' }, limit: null },
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
    title: { en: 'First Spark', pl: 'Pierwsza Iskra' },
    subtitle: {
      en: 'Complete a safe loop from the 3V battery through the 100Ω resistor and Red LED.',
      pl: 'Zamknij bezpieczny obwód z baterii 3V przez rezystor 100Ω i czerwoną diodę LED.',
    },
    conceptTag: { en: 'Closed Loops & Polarity', pl: 'Obwód zamknięty i polaryzacja' },
    narrationPrompt: {
      en: 'Lab one: First Spark. Place the 100 ohm resistor and connect jumper wires from the 3 volt battery through the resistor and red LED back to minus.',
      pl: 'Poziom pierwszy: Pierwsza Iskra. Wstaw rezystor 100 omów i połącz przewodami baterię 3 wolty przez rezystor i czerwoną diodę LED z powrotem do minusa.',
    },
    cols: 6,
    rows: 4,
    parUserItems: 4,
    initialComponents: [
      { id: 'bat', kind: 'battery', voltage: 3, a: { col: 1, row: 1 }, b: { col: 1, row: 2 }, locked: true },
      { id: 'led1', kind: 'led', ledColor: 'red', a: { col: 4, row: 1 }, b: { col: 4, row: 2 }, locked: true },
    ],
    initialWires: [],
    tray: [
      {
        templateId: 'res-100',
        kind: 'resistor',
        name: { en: '100Ω Resistor', pl: 'Rezystor 100Ω' },
        shortLabel: { en: '100Ω', pl: '100Ω' },
        resistance: 100,
        limit: 1,
      },
    ],
    guideWire: [
      { a: { col: 1, row: 1 }, b: { col: 2, row: 1 } },
      { a: { col: 3, row: 1 }, b: { col: 4, row: 1 } },
      { a: { col: 4, row: 2 }, b: { col: 1, row: 2 } },
    ],
    lesson: {
      principle: { en: 'Closed Circuit & Current Limiting', pl: 'Obwód zamknięty i ograniczanie prądu' },
      formula: { en: 'I = (Vs − Vf) / R', pl: 'I = (Vs − Vf) / R' },
      explanation: {
        en: 'Electricity only flows in a complete loop from + back to −. An LED has almost no internal resistance once it turns on, so a resistor acts like a narrow valve keeping current in the safe 5–25 mA zone.',
        pl: 'Prąd płynie tylko w zamkniętej pętli od plusa do minusa. Dioda LED po włączeniu ma minimalny opór, więc rezystor działa jak zawór utrzymujący bezpieczne natężenie 5–25 mA.',
      },
    },
    evaluate: (_board, sim, _history, lang: Language = 'en') => {
      const led = sim.componentStates['led1'];
      const ledSafe = Boolean(led && led.active && !led.overloaded && !sim.shortCircuit);
      return {
        goals: [
          {
            id: 'led',
            label: lang === 'pl' ? 'Zaświeć bezpiecznie czerwoną LED' : 'Light the Red LED safely',
            icon: 'led_red',
            satisfied: ledSafe,
          },
          {
            id: 'safe',
            label: lang === 'pl' ? 'Bez zwarć i spalonych części' : 'No shorts or blown parts',
            icon: 'shield',
            satisfied: !sim.shortCircuit && !led?.overloaded,
          },
        ],
        solved: ledSafe,
      };
    },
  },
  {
    id: 'adult-2-dont-pop',
    mode: 'adult',
    order: 2,
    title: { en: "Don't Pop the Bulb", pl: 'Nie Spal Żarówki' },
    subtitle: {
      en: 'A 9V battery packs a punch! Pick the right resistor so the Red LED glows in its 10–28 mA sweet spot.',
      pl: 'Bateria 9V ma sporą moc! Dobierz właściwy rezystor, aby przez czerwoną LED płynęło 10–28 mA.',
    },
    conceptTag: { en: "Ohm's Law", pl: 'Prawo Ohma' },
    narrationPrompt: {
      en: "Lab two: Don't Pop the Bulb. A 9 volt battery is too strong for a bare LED. Choose the right resistor so current lands safely between 10 and 28 milliamps.",
      pl: 'Poziom drugi: Nie Spal Żarówki. Bateria 9 woltów jest zbyt mocna dla samej diody LED. Dobierz odpowiedni rezystor, żeby prąd zmieścił się w bezpiecznym zakresie od 10 do 28 miliamperów.',
    },
    cols: 6,
    rows: 4,
    parUserItems: 4,
    initialComponents: [
      { id: 'bat', kind: 'battery', voltage: 9, a: { col: 1, row: 1 }, b: { col: 1, row: 2 }, locked: true },
      { id: 'led1', kind: 'led', ledColor: 'red', a: { col: 4, row: 1 }, b: { col: 4, row: 2 }, locked: true },
    ],
    initialWires: [],
    tray: [
      { templateId: 'res-47', kind: 'resistor', name: { en: '47Ω Resistor', pl: 'Rezystor 47Ω' }, shortLabel: { en: '47Ω', pl: '47Ω' }, resistance: 47, limit: 1 },
      { templateId: 'res-330', kind: 'resistor', name: { en: '330Ω Resistor', pl: 'Rezystor 330Ω' }, shortLabel: { en: '330Ω', pl: '330Ω' }, resistance: 330, limit: 1 },
      { templateId: 'res-10k', kind: 'resistor', name: { en: '10kΩ Resistor', pl: 'Rezystor 10kΩ' }, shortLabel: { en: '10kΩ', pl: '10kΩ' }, resistance: 10000, limit: 1 },
    ],
    lesson: {
      principle: { en: "Ohm's Law for LEDs", pl: 'Prawo Ohma dla diody LED' },
      formula: { en: 'R = (9V − 2V) / 0.02A = 350Ω', pl: 'R = (9V − 2V) / 0,02A = 350Ω' },
      explanation: {
        en: 'A Red LED drops ~2.0V, leaving 7.0V across the resistor. 47Ω lets over 100 mA surge through (POP!), 10kΩ starves it to 0.7 mA (invisible), and 330Ω hits ~20 mA—perfection.',
        pl: 'Czerwona LED zabiera ok. 2V, więc na rezystorze zostaje 7V. Przy 47Ω płynie ponad 100 mA (spalenie!), 10kΩ daje ledwo 0,7 mA, a 330Ω trafia idealnie w ok. 20 mA.',
      },
    },
    evaluate: (_board, sim, _history, lang: Language = 'en') => {
      const led = sim.componentStates['led1'];
      const inSweetSpot = Boolean(
        led && led.active && !led.overloaded && led.current >= 0.01 && led.current <= 0.028 && !sim.shortCircuit
      );
      return {
        goals: [
          {
            id: 'led-on',
            label: lang === 'pl' ? 'Czerwona LED świeci jasno (10–28 mA)' : 'Red LED glowing brightly (10–28 mA)',
            icon: 'led_red',
            satisfied: inSweetSpot,
          },
          {
            id: 'no-pop',
            label: lang === 'pl' ? 'Prąd poniżej limitu 35 mA' : 'Keep current under 35 mA limit',
            icon: 'shield',
            satisfied: !sim.shortCircuit && !led?.overloaded,
          },
        ],
        solved: inSweetSpot,
      };
    },
  },
  {
    id: 'adult-3-flip-switch',
    mode: 'adult',
    order: 3,
    title: { en: 'Flip the Switch', pl: 'Pstryk i Świeci' },
    subtitle: {
      en: 'Wire a toggle switch in series with the LED so tapping the switch turns the light cleanly ON and OFF.',
      pl: 'Wepnij przełącznik szeregowo z diodą LED, aby można było ją wygodnie włączać i wyłączać.',
    },
    conceptTag: { en: 'Open vs. Closed Circuits', pl: 'Obwód otwarty i zamknięty' },
    narrationPrompt: {
      en: 'Lab three: Flip the Switch. Wire the toggle switch and resistor in series with the amber LED, then tap the switch lever to turn it on.',
      pl: 'Poziom trzeci: Pstryk i Świeci. Podłącz przełącznik oraz rezystor szeregowo z żółtą diodą LED, a potem pstryknij przełącznik na pozycję włączoną.',
    },
    cols: 6,
    rows: 4,
    parUserItems: 5,
    initialComponents: [
      { id: 'bat', kind: 'battery', voltage: 3, a: { col: 1, row: 1 }, b: { col: 1, row: 2 }, locked: true },
      { id: 'led1', kind: 'led', ledColor: 'amber', a: { col: 4, row: 1 }, b: { col: 4, row: 2 }, locked: true },
    ],
    initialWires: [],
    tray: [
      { templateId: 'res-100', kind: 'resistor', name: { en: '100Ω Resistor', pl: 'Rezystor 100Ω' }, shortLabel: { en: '100Ω', pl: '100Ω' }, resistance: 100, limit: 1 },
      { templateId: 'sw-toggle', kind: 'switch_toggle', name: { en: 'Toggle Switch', pl: 'Przełącznik' }, shortLabel: { en: 'Switch', pl: 'Przełącz.' }, limit: 1 },
    ],
    lesson: {
      principle: { en: 'Series Control Switch', pl: 'Szeregowy przełącznik sterujący' },
      formula: { en: 'R_open = ∞ Ω  ⇒  I = 0 A', pl: 'R_otwarty = ∞ Ω  ⇒  I = 0 A' },
      explanation: {
        en: 'A switch placed in series physically breaks the loop. When open, resistance jumps to near infinity so zero current can flow anywhere in that branch.',
        pl: 'Przełącznik wpięty szeregowo fizycznie przerywa ścieżkę prądu. Gdy jest otwarty, opór rośnie do nieskończoności i prąd całkowicie ustaje.',
      },
    },
    evaluate: (board, sim, _history, lang: Language = 'en') => {
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
          {
            id: 'ctrl',
            label: lang === 'pl' ? 'Przełącznik steruje żółtą LED' : 'Switch cleanly toggles the Amber LED',
            icon: 'switch',
            satisfied: controlsLed,
          },
          {
            id: 'on',
            label: lang === 'pl' ? 'Włącz przełącznik, aby zaświecić LED' : 'Flip switch ON to light the LED',
            icon: 'led_amber',
            satisfied: controlsLed && currentlyLit,
          },
        ],
        solved: controlsLed && currentlyLit,
      };
    },
  },
  {
    id: 'adult-4-two-lights',
    mode: 'adult',
    order: 4,
    title: { en: 'Two Lights, One Power', pl: 'Dwie Lampki, Jedno Źródło' },
    subtitle: {
      en: 'Power BOTH the Red (2.0V) and Green (2.2V) LEDs brightly from a single 3V battery.',
      pl: 'Zasil równocześnie czerwoną (2,0V) i zieloną (2,2V) diodę LED z jednej baterii 3V.',
    },
    conceptTag: { en: 'Parallel vs. Series', pl: 'Układ równoległy i szeregowy' },
    narrationPrompt: {
      en: 'Lab four: Two Lights, One Power. Power both the red and green LEDs brightly from a single 3 volt battery. Hint: think about parallel branches.',
      pl: 'Poziom czwarty: Dwie Lampki, Jedno Źródło. Zaświeć równocześnie czerwoną i zieloną diodę LED z jednej baterii 3 wolty. Wskazówka: pomyśl o dwóch równoległych gałęziach.',
    },
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
      { templateId: 'res-47', kind: 'resistor', name: { en: '47Ω Resistor', pl: 'Rezystor 47Ω' }, shortLabel: { en: '47Ω', pl: '47Ω' }, resistance: 47, limit: 2 },
      { templateId: 'res-100', kind: 'resistor', name: { en: '100Ω Resistor', pl: 'Rezystor 100Ω' }, shortLabel: { en: '100Ω', pl: '100Ω' }, resistance: 100, limit: 2 },
    ],
    lesson: {
      principle: { en: 'Parallel Branches Share Voltage', pl: 'Gałęzie równoległe mają pełne napięcie' },
      formula: {
        en: 'Series: 2.0V + 2.2V = 4.2V > 3V  |  Parallel: Each gets 3.0V',
        pl: 'Szeregowo: 2,0V + 2,2V = 4,2V > 3V  |  Równolegle: każda ma 3,0V',
      },
      explanation: {
        en: 'In series, forward voltages add up (4.2V) so a 3V battery cannot light both. In parallel, every branch sits across the full 3.0V rail—give each LED its own resistor so currents balance cleanly!',
        pl: 'W układzie szeregowym napięcia diod się sumują (4,2V), więc bateria 3V nie wystarczy. W układzie równoległym każda gałąź dostaje pełne 3V — własny rezystor dla każdej diody zapewnia idealną jasność.',
      },
    },
    evaluate: (_board, sim, _history, lang: Language = 'en') => {
      const r = sim.componentStates['ledR'];
      const g = sim.componentStates['ledG'];
      const rOk = Boolean(r && r.active && !r.overloaded && r.current >= 0.005);
      const gOk = Boolean(g && g.active && !g.overloaded && g.current >= 0.005);
      return {
        goals: [
          { id: 'red', label: lang === 'pl' ? 'Czerwona LED świeci' : 'Red LED glowing safely', icon: 'led_red', satisfied: rOk },
          { id: 'green', label: lang === 'pl' ? 'Zielona LED świeci' : 'Green LED glowing safely', icon: 'led_green', satisfied: gOk },
          {
            id: 'safe',
            label: lang === 'pl' ? 'Bez zwarć i spaleń' : 'No shorts or burnouts',
            icon: 'shield',
            satisfied: !sim.shortCircuit && !r?.overloaded && !g?.overloaded,
          },
        ],
        solved: rOk && gOk && !sim.shortCircuit,
      };
    },
  },
  {
    id: 'adult-5-bright-and-spinning',
    mode: 'adult',
    order: 5,
    title: { en: 'Bright & Spinning', pl: 'Świeci i Kręci' },
    subtitle: {
      en: 'Run the DC Fan Motor AND the Amber status LED together from a 6V battery without blowing the LED.',
      pl: 'Uruchom jednocześnie wiatrak DC oraz żółtą diodę LED z baterii 6V, nie spalając diody.',
    },
    conceptTag: { en: 'Mixed Parallel Loads', pl: 'Różne odbiorniki równolegle' },
    narrationPrompt: {
      en: 'Lab five: Bright and Spinning. Run both the DC fan motor and the amber LED from the 6 volt battery without overloading the LED.',
      pl: 'Poziom piąty: Świeci i Kręci. Uruchom wiatrak i żółtą diodę LED z jednej baterii 6 woltów tak, aby dioda się nie spaliła.',
    },
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
      { templateId: 'res-220', kind: 'resistor', name: { en: '220Ω Resistor', pl: 'Rezystor 220Ω' }, shortLabel: { en: '220Ω', pl: '220Ω' }, resistance: 220, limit: 1 },
      { templateId: 'res-47', kind: 'resistor', name: { en: '47Ω Resistor', pl: 'Rezystor 47Ω' }, shortLabel: { en: '47Ω', pl: '47Ω' }, resistance: 47, limit: 1 },
      { templateId: 'res-1k', kind: 'resistor', name: { en: '1kΩ Resistor', pl: 'Rezystor 1kΩ' }, shortLabel: { en: '1kΩ', pl: '1kΩ' }, resistance: 1000, limit: 1 },
    ],
    lesson: {
      principle: { en: 'Different Loads Need Different Currents', pl: 'Różne odbiorniki potrzebują innego prądu' },
      formula: {
        en: 'I_motor ≈ 6V / 25Ω = 240 mA  |  I_LED = (6V − 2.1V) / 220Ω ≈ 17 mA',
        pl: 'I_silnik ≈ 6V / 25Ω = 240 mA  |  I_LED = (6V − 2,1V) / 220Ω ≈ 17 mA',
      },
      explanation: {
        en: 'A DC motor loves ~200+ mA directly from 6V, while an LED pops above 35 mA. Wiring them in parallel lets the motor draw full current while a 220Ω resistor protects only the LED branch.',
        pl: 'Silnik potrzebuje ponad 200 mA prosto z 6V, podczas gdy dioda LED spala się powyżej 35 mA. Układ równoległy pozwala silnikowi pracować pełną mocą, a rezystor 220Ω chroni gałąź z diodą.',
      },
    },
    evaluate: (_board, sim, _history, lang: Language = 'en') => {
      const m = sim.componentStates['mot'];
      const l = sim.componentStates['led1'];
      const mOk = Boolean(m && m.active && !m.overloaded && Math.abs(m.motorSpeed) >= 0.45);
      const lOk = Boolean(l && l.active && !l.overloaded && l.current >= 0.008);
      return {
        goals: [
          { id: 'motor', label: lang === 'pl' ? 'Wiatrak szybko się kręci' : 'Fan spinning briskly', icon: 'motor', satisfied: mOk },
          { id: 'led', label: lang === 'pl' ? 'Żółta LED świeci bezpiecznie' : 'Amber LED glowing safely', icon: 'led_amber', satisfied: lOk },
          {
            id: 'safe',
            label: lang === 'pl' ? 'Brak przeciążeń' : 'No overloaded parts',
            icon: 'shield',
            satisfied: !sim.shortCircuit && !m?.overloaded && !l?.overloaded,
          },
        ],
        solved: mOk && lOk && !sim.shortCircuit,
      };
    },
  },
  {
    id: 'adult-6-master-dimmer',
    mode: 'adult',
    order: 6,
    title: { en: 'Master Dimmer', pl: 'Mistrz Ściemniacza' },
    subtitle: {
      en: 'Wire the Variable Dimmer in series with the Blue LED (3.0V) and dial current into 14–22 mA.',
      pl: 'Wepnij ściemniacz szeregowo z niebieską diodą LED (3,0V) i wyreguluj prąd na 14–22 mA.',
    },
    conceptTag: { en: 'Variable Resistance & Metering', pl: 'Zmienny opór i pomiary' },
    narrationPrompt: {
      en: 'Lab six: Master Dimmer. Connect the variable dimmer in series with the blue LED, then tap the dimmer and slide its resistance until current reaches 14 to 22 milliamps.',
      pl: 'Poziom szósty: Mistrz Ściemniacza. Podłącz ściemniacz szeregowo z niebieską diodą LED, potem dotknij ściemniacza i ustaw suwakiem prąd między 14 a 22 miliampery.',
    },
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
        name: { en: 'Dimmer (20Ω–1kΩ)', pl: 'Ściemniacz (20Ω–1kΩ)' },
        shortLabel: { en: 'Dimmer', pl: 'Ściemniacz' },
        resistance: 820,
        rheostatMin: 20,
        rheostatMax: 1000,
        limit: 1,
      },
    ],
    lesson: {
      principle: { en: 'Tuning Current with a Rheostat', pl: 'Regulacja prądu potencjometrem' },
      formula: {
        en: 'I = (9.0V − 3.0V) / R_dimmer  ⇒  R ≈ 300Ω gives 20 mA',
        pl: 'I = (9,0V − 3,0V) / R_ściemniacza  ⇒  R ≈ 300Ω daje 20 mA',
      },
      explanation: {
        en: 'Blue LEDs need a higher forward voltage (3.0V) than red ones (2.0V). Tap the Dimmer after wiring it and slide its resistance while watching the live current meter!',
        pl: 'Niebieskie diody LED wymagają wyższego napięcia (3,0V) niż czerwone (2,0V). Po podłączeniu dotknij ściemniacza i płynnie zmieniaj opór, obserwując prąd na mierniku!',
      },
    },
    evaluate: (_board, sim, _history, lang: Language = 'en') => {
      const led = sim.componentStates['ledB'];
      const inBand = Boolean(
        led && led.active && !led.overloaded && led.current >= 0.014 && led.current <= 0.022 && !sim.shortCircuit
      );
      return {
        goals: [
          {
            id: 'led',
            label: lang === 'pl' ? 'Niebieska LED zasilona bezpiecznie' : 'Blue LED powered safely',
            icon: 'led_blue',
            satisfied: Boolean(led?.active && !led?.overloaded),
          },
          {
            id: 'meter',
            label: lang === 'pl' ? 'Ustaw prąd diody na 14–22 mA' : 'Tune LED current to 14–22 mA',
            icon: 'meter',
            satisfied: inBand,
          },
        ],
        solved: inBand,
      };
    },
  },
  {
    id: 'adult-7-safety-lock',
    mode: 'adult',
    order: 7,
    title: { en: 'Two-Key Safety Lock', pl: 'Podwójna Blokada' },
    subtitle: {
      en: 'Wire BOTH toggle switches so the Piezo Buzzer sounds ONLY when Switch 1 AND Switch 2 are both ON.',
      pl: 'Podłącz OBA przełączniki tak, aby brzęczyk zadziałał TYLKO wtedy, gdy oba są włączone jednocześnie.',
    },
    conceptTag: { en: 'Series Logic (AND Gate)', pl: 'Logika szeregowa (Bramka AND)' },
    narrationPrompt: {
      en: 'Lab seven: Two-Key Safety Lock. Wire both switches so the buzzer sounds only when both switches are turned on at the same time.',
      pl: 'Poziom siódmy: Podwójna Blokada. Połącz oba przełączniki tak, żeby brzęczyk zabrzmiał tylko wtedy, gdy oba są włączone jednocześnie.',
    },
    cols: 7,
    rows: 5,
    parUserItems: 6,
    initialComponents: [
      { id: 'bat', kind: 'battery', voltage: 6, a: { col: 1, row: 1 }, b: { col: 1, row: 3 }, locked: true },
      { id: 'buz', kind: 'buzzer', a: { col: 5, row: 1 }, b: { col: 5, row: 3 }, locked: true },
    ],
    initialWires: [],
    tray: [
      { templateId: 'sw-1', kind: 'switch_toggle', name: { en: 'Toggle Switch', pl: 'Przełącznik' }, shortLabel: { en: 'Switch', pl: 'Przełącz.' }, limit: 2 },
    ],
    lesson: {
      principle: { en: 'Mechanical AND Logic', pl: 'Mechaniczna bramka logiczna AND' },
      formula: { en: 'Buzzer = S1 AND S2', pl: 'Brzęczyk = S1 ORAZ S2' },
      explanation: {
        en: 'Putting two switches end-to-end in series means current must pass through BOTH. If either switch is open, the loop breaks—this is the physical foundation of a digital AND gate.',
        pl: 'Dwa przełączniki ustawione szeregowo jeden za drugim wymagają, aby prąd przeszedł przez OBA. Otwarcie któregokolwiek przerywa obwód — to fizyczna podstawa cyfrowej bramki AND.',
      },
    },
    evaluate: (board, sim, _history, lang: Language = 'en') => {
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
          {
            id: 'and-logic',
            label: lang === 'pl' ? 'Brzęczyk wymaga OBU przełączników (AND)' : 'Buzzer requires BOTH switches ON (AND)',
            icon: 'switch',
            satisfied: trueAnd,
          },
          {
            id: 'buzz',
            label: lang === 'pl' ? 'Włącz oba, by przetestować brzęczyk' : 'Flip both switches ON to test buzzer',
            icon: 'buzzer',
            satisfied: trueAnd && buzzingNow,
          },
        ],
        solved: trueAnd && buzzingNow,
      };
    },
  },
  {
    id: 'adult-8-workshop-station',
    mode: 'adult',
    order: 8,
    title: { en: 'Workshop Station', pl: 'Stanowisko Warsztatowe' },
    subtitle: {
      en: 'Build an independent bench: a Toggle Switch controls the Fan, and a Push Button controls the Buzzer—from one 9V battery.',
      pl: 'Zbuduj niezależne obwody z jednej baterii 9V: przełącznik steruje wiatrakiem, a przycisk uruchamia brzęczyk.',
    },
    conceptTag: { en: 'Independent Parallel Circuits', pl: 'Niezależne obwody równoległe' },
    narrationPrompt: {
      en: 'Lab eight: Workshop Station. Wire two independent parallel branches from the 9 volt battery: a toggle switch for the fan, and a push button for the buzzer.',
      pl: 'Poziom ósmy: Stanowisko Warsztatowe. Zbuduj dwie niezależne gałęzie równoległe z baterii 9 woltów: przełącznik dla wiatraka i przycisk dla brzęczyka.',
    },
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
      { templateId: 'sw-toggle', kind: 'switch_toggle', name: { en: 'Toggle Switch', pl: 'Przełącznik' }, shortLabel: { en: 'Switch', pl: 'Przełącz.' }, limit: 1 },
      { templateId: 'sw-push', kind: 'switch_push', name: { en: 'Push Button', pl: 'Przycisk' }, shortLabel: { en: 'Button', pl: 'Przycisk' }, limit: 1 },
      { templateId: 'res-47', kind: 'resistor', name: { en: '47Ω Resistor', pl: 'Rezystor 47Ω' }, shortLabel: { en: '47Ω', pl: '47Ω' }, resistance: 47, limit: 1 },
    ],
    lesson: {
      principle: { en: 'Household Parallel Wiring', pl: 'Domowa instalacja równoległa' },
      formula: {
        en: 'Branch 1: Switch → Fan  ||  Branch 2: Button → Buzzer',
        pl: 'Gałąź 1: Przełącznik → Wiatrak  ||  Gałąź 2: Przycisk → Brzęczyk',
      },
      explanation: {
        en: 'This is how rooms in your home are wired: every appliance sits on its own parallel branch with its own switch so turning off the fan never disables the doorbell!',
        pl: 'Dokładnie tak działa instalacja w domu: każde urządzenie ma własną równoległą gałąź i wyłącznik, więc wyłączenie wiatraka nie wyłącza dzwonka!',
      },
    },
    evaluate: (board, sim, _history, lang: Language = 'en') => {
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
          {
            id: 'fan',
            label: lang === 'pl' ? 'Przełącznik steruje wiatrakiem niezależnie' : 'Toggle Switch controls Fan independently',
            icon: 'motor',
            satisfied: fanIndep,
          },
          {
            id: 'buz',
            label: lang === 'pl' ? 'Przycisk steruje brzęczykiem niezależnie' : 'Push Button controls Buzzer independently',
            icon: 'buzzer',
            satisfied: buzIndep,
          },
          {
            id: 'safe',
            label: lang === 'pl' ? 'Przetestuj wiatrak lub brzęczyk bez zwarć' : 'No shorts — flip Switch or press Button to verify',
            icon: 'shield',
            satisfied: fanIndep && buzIndep && activeTest,
          },
        ],
        solved: fanIndep && buzIndep && activeTest,
      };
    },
  },
];

export const KID_MISSIONS: LevelDefinition[] = [
  {
    id: 'kid-1-light-up',
    mode: 'kid',
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
];

export const ADULT_SANDBOX: LevelDefinition = {
  id: 'adult-sandbox',
  mode: 'adult',
  order: 99,
  title: { en: 'Free Lab Bench', pl: 'Wolny Stół Lab' },
  subtitle: {
    en: 'Unlimited parts. Build, measure, experiment, and break things safely.',
    pl: 'Nieograniczone części. Buduj, mierz, eksperymentuj i testuj bezpiecznie.',
  },
  conceptTag: { en: 'Open Sandbox', pl: 'Swobodny tryb' },
  narrationPrompt: {
    en: 'Welcome to the Free Lab Bench! Place any parts you like and explore with X-Ray flow and the multimeter.',
    pl: 'Witaj przy Wolnym Stole! Układaj dowolne części i badaj obwody miernikiem oraz podglądem przepływu prądu.',
  },
  isSandbox: true,
  cols: 7,
  rows: 5,
  initialComponents: [
    { id: 'bat-sb', kind: 'battery', voltage: 6, a: { col: 1, row: 1 }, b: { col: 1, row: 2 } },
  ],
  initialWires: [],
  tray: SANDBOX_TRAY_ADULT,
  lesson: {
    principle: { en: 'Free Experimentation', pl: 'Swobodne eksperymenty' },
    formula: { en: 'V = I × R  |  P = V × I', pl: 'U = I × R  |  P = U × I' },
    explanation: {
      en: 'Use X-Ray Flow and the Multimeter probe to explore voltage dividers, series vs. parallel batteries, dimmers, motors, and LEDs.',
      pl: 'Użyj podglądu prądu i multimetru, aby badać dzielniki napięcia, łączenie baterii, ściemniacze, silniki i diody LED.',
    },
  },
  evaluate: () => ({ goals: [], solved: false }),
};

export const KID_SANDBOX: LevelDefinition = {
  id: 'kid-sandbox',
  mode: 'kid',
  order: 99,
  title: { en: 'Free Play Toybox', pl: 'Plac Zabaw' },
  subtitle: {
    en: 'Snap anything onto the board and see what lights up, spins, or buzzes!',
    pl: 'Wpinaj co tylko chcesz i sprawdzaj, co zaświeci, zakręci się lub zabrzęczy!',
  },
  conceptTag: { en: 'Free Play', pl: 'Wolna zabawa' },
  narrationPrompt: {
    en: 'Welcome to the Free Play Toybox! Pick lights, fans, buttons, and buzzers to build your own cool invention!',
    pl: 'Witaj na Placu Zabaw! Wybieraj lampki, wiatraki, przyciski i brzęczyki, żeby zbudować własny wynalazek!',
  },
  isSandbox: true,
  cols: 6,
  rows: 4,
  initialComponents: [
    { id: 'bat-ksb', kind: 'battery', voltage: 6, a: { col: 1, row: 1 }, b: { col: 1, row: 2 } },
  ],
  initialWires: [],
  tray: SANDBOX_TRAY_KID,
  lesson: {
    principle: { en: 'Invent Anything!', pl: 'Wymyśl coś własnego!' },
    formula: { en: 'Snap + Wire + Play', pl: 'Wepnij + Połącz + Baw się' },
    explanation: {
      en: 'Mix lights, spinning fans, dials, buttons, and buzzers to build your own cool invention!',
      pl: 'Łącz kolorowe lampki, wirujące wiatraki, pokrętła, przyciski i brzęczyki w swoje super maszyny!',
    },
  },
  evaluate: () => ({ goals: [], solved: false }),
};

// Register Electronics as the first active STEM module + placeholder roadmap modules
stemRegistry.register({
  id: 'electronics',
  name: { en: 'DC Electronics', pl: 'Elektronika DC' },
  tagline: {
    en: 'Circuits, Ohm’s Law, LEDs, Motors & Logic',
    pl: 'Obwody, Prawo Ohma, Diody LED, Silniki i Logika',
  },
  status: 'active',
  accentColor: '#D96528',
  adultLevels: ADULT_LEVELS,
  kidMissions: KID_MISSIONS,
  adultSandbox: ADULT_SANDBOX,
  kidSandbox: KID_SANDBOX,
});

stemRegistry.register({
  id: 'chemistry',
  name: { en: 'Reaction Lab', pl: 'Laboratorium Chemii' },
  tagline: {
    en: 'Molecules, Energy & Reactions (Planned)',
    pl: 'Cząsteczki, Energia i Reakcje (W planach)',
  },
  status: 'coming-soon',
  accentColor: '#2B8A78',
  adultLevels: [],
  kidMissions: [],
  adultSandbox: ADULT_SANDBOX,
  kidSandbox: KID_SANDBOX,
});
