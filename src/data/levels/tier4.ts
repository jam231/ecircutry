import type { Language } from '../../core/i18n';
import { runAcFrequencySweep } from '../../engine/acAnalysis';
import { stepTransientCircuit } from '../../engine/circuitSolver';
import {
  type CircuitBoardState,
  type CircuitComponent,
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

export const TIER4_LEVELS: LevelDefinition[] = [
  {
    id: 'adult-23-energy-tank',
    mode: 'adult',
    tier: 4,
    order: 23,
    title: { en: 'Energy Tank (RC Fade)', pl: 'Zbiornik Energii (Kondensator)' },
    subtitle: {
      en: 'Wire the 1000µF Capacitor in parallel across the Resistor + Green LED branch so turning the switch OFF makes the light fade softly instead of snapping dark!',
      pl: 'Podłącz kondensator 1000µF równolegle do gałęzi z rezystorem i zieloną LED, aby po wyłączeniu przełącznika światło powoli gasło!',
    },
    conceptTag: { en: 'Capacitor Energy Storage', pl: 'Magazynowanie energii (RC)' },
    narrationPrompt: {
      en: 'Lab twenty-three: Energy Tank. Place the 1000 microfarad capacitor in parallel after the switch. Flip the switch on to fill the tank, then flip it off and watch the LED fade smoothly on the oscilloscope!',
      pl: 'Poziom dwudziesty trzeci: Zbiornik Energii. Podłącz kondensator 1000 mikrofaradów równolegle za przełącznikiem. Włącz przełącznik, by naładować zbiornik, a potem wyłącz i obserwuj powolne gaśnięcie na oscyloskopie!',
    },
    cols: 7,
    rows: 4,
    parUserItems: 4,
    defaultScope: {
      open: true,
      mode: 'time',
      ch1: { col: 3, row: 1 },
      ch2: { col: 5, row: 1 },
      timeScale: 1,
    },
    initialComponents: [
      { id: 'bat', kind: 'battery', voltage: 6, a: { col: 0, row: 1 }, b: { col: 0, row: 2 }, locked: true },
      { id: 'sw1', kind: 'switch_toggle', closed: true, a: { col: 1, row: 1 }, b: { col: 2, row: 1 }, locked: true },
      { id: 'r1', kind: 'resistor', resistance: 220, a: { col: 4, row: 1 }, b: { col: 5, row: 1 }, locked: true },
      { id: 'led1', kind: 'led', ledColor: 'green', a: { col: 5, row: 1 }, b: { col: 5, row: 2 }, locked: true },
    ],
    initialWires: [
      { id: 'w-b1', a: { col: 0, row: 1 }, b: { col: 1, row: 1 }, color: 'red', locked: true },
      { id: 'w-b2', a: { col: 2, row: 1 }, b: { col: 4, row: 1 }, color: 'red', locked: true },
      { id: 'w-g', a: { col: 5, row: 2 }, b: { col: 0, row: 2 }, color: 'black', locked: true },
    ],
    tray: [
      {
        templateId: 'cap-1000',
        kind: 'capacitor',
        name: { en: '1000µF Capacitor', pl: 'Kondensator 1000µF' },
        shortLabel: { en: '1000µF', pl: '1000µF' },
        capacitance: 1000e-6,
        limit: 1,
      },
    ],
    lesson: {
      principle: { en: 'Exponential RC Discharge', pl: 'Wykładnicze rozładowanie RC' },
      formula: { en: 'V(t) = V_0 · e^(−t / R·C)   (τ = 220Ω × 1000µF = 0.22s)', pl: 'U(t) = U_0 · e^(−t / R·C)   (τ = 220Ω × 1000µF = 0,22s)' },
      explanation: {
        en: 'A capacitor stores charge like a tiny rechargeable water tank. When you open the switch, stored charge flows out through the resistor and LED, creating a smooth exponential fade curve!',
        pl: 'Kondensator gromadzi ładunek jak mały zbiornik. Po otwarciu przełącznika zmagazynowana energia powoli wypływa przez rezystor i diodę LED, dając łagodny zanik światła!',
      },
    },
    evaluate: (board, sim, _history, lang: Language = 'en') => {
      const cap = board.components.find((c) => c.kind === 'capacitor');
      let sustainsFade = false;
      let chargesUp = false;
      if (cap) {
        const mem = createTransientMemory();
        const onBoard = withSwitches(board, { sw1: true });
        const offBoard = withSwitches(board, { sw1: false });
        let lastOn = stepTransientCircuit(onBoard, mem, 0.02);
        for (let i = 0; i < 30; i++) {
          lastOn = stepTransientCircuit(onBoard, mem, 0.02);
        }
        chargesUp = Boolean(
          Math.abs(lastOn.componentStates[cap.id]?.voltageDrop ?? 0) > 4.5 &&
            lastOn.componentStates['led1']?.active &&
            !lastOn.shortCircuit
        );
        // Simulate 160ms after switch opens — LED must still be glowing from capacitor energy!
        let afterOff = lastOn;
        for (let i = 0; i < 8; i++) {
          afterOff = stepTransientCircuit(offBoard, mem, 0.02);
        }
        sustainsFade = Boolean(chargesUp && afterOff.componentStates['led1']?.active && !afterOff.shortCircuit);
      }
      return {
        goals: [
          {
            id: 'chg',
            label: lang === 'pl' ? 'Kondensator ładuje się powyżej 4,5V' : 'Capacitor charges above 4.5V',
            icon: 'bolt',
            satisfied: chargesUp,
          },
          {
            id: 'fade',
            label: lang === 'pl' ? 'LED świeci po wyłączeniu przełącznika (płynne gaśnięcie)' : 'LED stays lit during fade-out after switch opens',
            icon: 'led_green',
            satisfied: sustainsFade,
          },
        ],
        solved: sustainsFade && !sim.shortCircuit,
      };
    },
  },
  {
    id: 'adult-24-rc-stopwatch',
    mode: 'adult',
    tier: 4,
    order: 24,
    title: { en: 'The RC Stopwatch (τ)', pl: 'Stoper RC (Stała τ)' },
    subtitle: {
      en: 'Pick the resistor that gives the 1000µF capacitor a time constant τ = R·C = 1.0s (so it reaches 63.2% ≈ 5.7V in exactly 1 second).',
      pl: 'Dobierz rezystor tak, aby kondensator 1000µF miał stałą czasową τ = R·C = 1,0s (osiągając 63,2% ≈ 5,7V po dokładnie 1 sekundzie).',
    },
    conceptTag: { en: 'RC Time Constant (τ = RC)', pl: 'Stała czasowa τ = R·C' },
    narrationPrompt: {
      en: 'Lab twenty-four: The RC Stopwatch. Pair the 1000 microfarad capacitor with the resistor whose product R times C equals one full second!',
      pl: 'Poziom dwudziesty czwarty: Stoper RC. Dobierz do kondensatora 1000 mikrofaradów taki rezystor, aby iloczyn R razy C wynosił dokładnie jedną sekundę!',
    },
    cols: 6,
    rows: 4,
    parUserItems: 4,
    defaultScope: {
      open: true,
      mode: 'time',
      ch1: { col: 4, row: 1 },
      ch2: { col: 1, row: 1 },
      timeScale: 1,
    },
    initialComponents: [
      { id: 'bat', kind: 'battery', voltage: 9, a: { col: 1, row: 1 }, b: { col: 1, row: 2 }, locked: true },
      { id: 'c1', kind: 'capacitor', capacitance: 1000e-6, a: { col: 4, row: 1 }, b: { col: 4, row: 2 }, locked: true },
    ],
    initialWires: [
      { id: 'w-g', a: { col: 4, row: 2 }, b: { col: 1, row: 2 }, color: 'black', locked: true },
    ],
    tray: [
      { templateId: 'res-100', kind: 'resistor', name: { en: '100Ω (τ = 0.1s)', pl: '100Ω (τ = 0,1s)' }, shortLabel: { en: '100Ω', pl: '100Ω' }, resistance: 100, limit: 1 },
      { templateId: 'res-1k', kind: 'resistor', name: { en: '1kΩ (τ = 1.0s)', pl: '1kΩ (τ = 1,0s)' }, shortLabel: { en: '1kΩ', pl: '1kΩ' }, resistance: 1000, limit: 1 },
      { templateId: 'res-4k7', kind: 'resistor', name: { en: '4.7kΩ (τ = 4.7s)', pl: '4,7kΩ (τ = 4,7s)' }, shortLabel: { en: '4.7kΩ', pl: '4.7kΩ' }, resistance: 4700, limit: 1 },
    ],
    lesson: {
      principle: { en: 'The Universal 63.2% Rule (τ = R · C)', pl: 'Uniwersalna zasada 63,2% (τ = R · C)' },
      formula: { en: 'τ = 1000Ω × 1000µF = 1.0 s   ⇒   V(1s) = 9V × (1 − 1/e) = 5.69V', pl: 'τ = 1000Ω × 1000µF = 1,0 s   ⇒   U(1s) = 9V × 0,632 = 5,69V' },
      explanation: {
        en: 'In every RC circuit, one time constant τ = R×C always charges the capacitor to 63.2% of supply voltage, and 5τ reaches >99%. That formula drives timers, debouncers, and audio filters!',
        pl: 'W każdym obwodzie RC po jednej stałej czasowej τ = R×C kondensator osiąga 63,2% napięcia zasilania, a po 5τ ponad 99%. Ten wzór rządzi timerami i filtrami!',
      },
    },
    evaluate: (board, sim, _history, lang: Language = 'en') => {
      const mem = createTransientMemory();
      let res = sim;
      for (let i = 0; i < 50; i++) {
        res = stepTransientCircuit(board, mem, 0.02); // 50 * 0.02 = 1.00s
      }
      const vAt1s = Math.abs(res.componentStates['c1']?.voltageDrop ?? 0);
      const exactTau = vAt1s >= 5.15 && vAt1s <= 6.25 && !res.shortCircuit;
      return {
        goals: [
          {
            id: 'tau',
            label: lang === 'pl' ? 'Kondensator osiąga 5,2–6,2V (63%) dokładnie po 1,0s' : 'Capacitor reaches 5.2–6.2V (63%) at t = 1.0s',
            icon: 'wave',
            satisfied: exactTau,
          },
          {
            id: 'safe',
            label: lang === 'pl' ? 'Bez zwarć' : 'No short circuits',
            icon: 'shield',
            satisfied: !sim.shortCircuit,
          },
        ],
        solved: exactTau,
      };
    },
  },
  {
    id: 'adult-25-heartbeat-blinker',
    mode: 'adult',
    tier: 4,
    order: 25,
    title: { en: 'Heartbeat Blinker', pl: 'Multiwibrator Astabilny' },
    subtitle: {
      en: 'Add the TWO 47µF cross-coupling capacitors between each Collector and the opposite Base to turn these two NPN inverters into a self-oscillating blinker!',
      pl: 'Wepnij DWA kondensatory 47µF na krzyż (kolektor jednego do bazy drugiego), aby zbudować samowzbudny migacz na dwóch tranzystorach!',
    },
    conceptTag: { en: 'Astable Multivibrator Oscillator', pl: 'Generator astabilny (Migacz)' },
    narrationPrompt: {
      en: 'Lab twenty-five: Heartbeat Blinker. Connect the two 47 microfarad capacitors crosswise from each collector to the opposite transistor base and watch the two LEDs blink back and forth automatically!',
      pl: 'Poziom dwudziesty piąty: Multiwibrator Astabilny. Połącz dwa kondensatory 47 mikrofaradów na krzyż między kolektorami a bazami tranzystorów i patrz, jak diody zaczynają same migać naprzemiennie!',
    },
    cols: 8,
    rows: 5,
    parUserItems: 6,
    defaultScope: {
      open: true,
      mode: 'time',
      ch1: { col: 1, row: 1 },
      ch2: { col: 6, row: 1 },
      timeScale: 1,
    },
    initialComponents: [
      { id: 'bat', kind: 'battery', voltage: 6, a: { col: 0, row: 1 }, b: { col: 0, row: 4 }, locked: true },
      // Left side
      { id: 'rc1', kind: 'resistor', resistance: 330, a: { col: 1, row: 0 }, b: { col: 1, row: 1 }, locked: true },
      { id: 'ledR', kind: 'led', ledColor: 'red', a: { col: 2, row: 0 }, b: { col: 2, row: 1 }, locked: true },
      { id: 'rb1', kind: 'resistor', resistance: 10000, a: { col: 3, row: 0 }, b: { col: 3, row: 2 }, locked: true },
      { id: 'q1', kind: 'transistor_npn', a: { col: 1, row: 1 }, c: { col: 1, row: 2 }, b: { col: 1, row: 3 }, locked: true },
      // Right side
      { id: 'rc2', kind: 'resistor', resistance: 330, a: { col: 6, row: 0 }, b: { col: 6, row: 1 }, locked: true },
      { id: 'ledG', kind: 'led', ledColor: 'green', a: { col: 7, row: 0 }, b: { col: 7, row: 1 }, locked: true },
      { id: 'rb2', kind: 'resistor', resistance: 10000, a: { col: 5, row: 0 }, b: { col: 5, row: 2 }, locked: true },
      { id: 'q2', kind: 'transistor_npn', a: { col: 6, row: 1 }, c: { col: 6, row: 2 }, b: { col: 6, row: 3 }, locked: true },
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
    ],
    tray: [
      {
        templateId: 'cap-47',
        kind: 'capacitor',
        name: { en: '47µF Capacitor', pl: 'Kondensator 47µF' },
        shortLabel: { en: '47µF', pl: '47µF' },
        capacitance: 47e-6,
        limit: 2,
      },
    ],
    lesson: {
      principle: { en: 'Self-Oscillating RC Flip-Flop', pl: 'Samowzbudny generator RC' },
      formula: { en: 'T ≈ 1.38 × R_B × C   (1.38 × 10kΩ × 47µF ≈ 0.65s)', pl: 'T ≈ 1,38 × R_B × C   (1,38 × 10kΩ × 47µF ≈ 0,65s)' },
      explanation: {
        en: 'When Q1 switches ON, its capacitor slams Q2’s Base negative (turning Q2 OFF) until R_B2 recharges it back to +0.7V—then they swap roles forever! This is how electronic clocks are born.',
        pl: 'Gdy Q1 się włącza, kondensator ściąga bazę Q2 poniżej zera (wyłączając Q2), aż rezystor R_B2 naładuje go z powrotem do +0,7V — i wtedy zamieniają się rolami bez końca!',
      },
    },
    evaluate: (board, sim, _history, lang: Language = 'en') => {
      const caps = board.components.filter((c) => c.kind === 'capacitor');
      let oscillating = false;
      if (caps.length >= 2 && !sim.shortCircuit) {
        const mem = createTransientMemory();
        let transitions = 0;
        let lastHigh: boolean | null = null;
        let seenBoth = false;
        let rOn = false;
        let gOn = false;
        for (let i = 0; i < 280; i++) {
          const step = stepTransientCircuit(board, mem, 0.008);
          const v1 = step.nodeVoltages['1,1'] ?? 0;
          const isHigh = v1 > 2.5;
          if (lastHigh !== null && isHigh !== lastHigh) transitions += 1;
          lastHigh = isHigh;
          if (step.componentStates['ledR']?.active) rOn = true;
          if (step.componentStates['ledG']?.active) gOn = true;
        }
        seenBoth = rOn && gOn;
        oscillating = transitions >= 3 && seenBoth;
      }
      return {
        goals: [
          {
            id: 'caps',
            label: lang === 'pl' ? 'Wepnij oba kondensatory 47µF na krzyż' : 'Place both 47µF cross-coupling capacitors',
            icon: 'chip',
            satisfied: caps.length >= 2,
          },
          {
            id: 'osc',
            label: lang === 'pl' ? 'Diody migają naprzemiennie bez przełącznika!' : 'Red & Green LEDs oscillate alternately on their own!',
            icon: 'wave',
            satisfied: oscillating,
          },
        ],
        solved: oscillating,
      };
    },
  },
  {
    id: 'adult-26-ac-rectifier',
    mode: 'adult',
    tier: 4,
    order: 26,
    title: { en: 'AC to DC Rectifier', pl: 'Prostownik i Filtr DC' },
    subtitle: {
      en: 'Convert the 6V AC sine wave into smooth positive DC across the 470Ω load using the Silicon Diode + 470µF smoothing capacitor!',
      pl: 'Zamień sinusoidalny prąd zmienny 6V AC w gładkie napięcie stałe DC na oporze 470Ω za pomocą diody krzemowej i kondensatora 470µF!',
    },
    conceptTag: { en: 'Half-Wave Rectification & Smoothing', pl: 'Prostowanie i wygładzanie tętnień' },
    narrationPrompt: {
      en: 'Lab twenty-six: AC to DC Rectifier. Put the silicon diode in series to block the negative half of the wave, then add the 470 microfarad capacitor across the load to smooth out the ripple!',
      pl: 'Poziom dwudziesty szósty: Prostownik i Filtr DC. Wstaw diodę krzemową szeregowo, żeby odciąć ujemną połówkę fali, a potem dodaj kondensator 470 mikrofaradów równolegle do obciążenia, by wygładzić napięcie!',
    },
    cols: 7,
    rows: 4,
    parUserItems: 5,
    defaultScope: {
      open: true,
      mode: 'time',
      ch1: { col: 1, row: 1 },
      ch2: { col: 5, row: 1 },
      timeScale: 1,
    },
    initialComponents: [
      {
        id: 'ac1',
        kind: 'ac_source',
        waveform: 'sine',
        amplitude: 6,
        frequency: 6,
        a: { col: 1, row: 1 },
        b: { col: 1, row: 2 },
        locked: true,
      },
      { id: 'rLoad', kind: 'resistor', resistance: 470, a: { col: 5, row: 1 }, b: { col: 5, row: 2 }, locked: true },
    ],
    initialWires: [
      { id: 'w-g', a: { col: 5, row: 2 }, b: { col: 1, row: 2 }, color: 'black', locked: true },
    ],
    tray: [
      { templateId: 'diode', kind: 'diode', name: { en: 'Silicon Diode', pl: 'Dioda krzemowa' }, shortLabel: { en: 'Diode', pl: 'Dioda' }, limit: 1 },
      {
        templateId: 'cap-470',
        kind: 'capacitor',
        name: { en: '470µF Capacitor', pl: 'Kondensator 470µF' },
        shortLabel: { en: '470µF', pl: '470µF' },
        capacitance: 470e-6,
        limit: 1,
      },
    ],
    lesson: {
      principle: { en: 'Inside Every Phone Charger (AC → DC)', pl: 'Jak działa każda ładowarka (AC → DC)' },
      formula: { en: 'V_DC ≈ V_peak − 0.7V   |   V_ripple ≈ I_load / (f × C)', pl: 'U_DC ≈ U_szczyt − 0,7V   |   Tętnienia ≈ I / (f × C)' },
      explanation: {
        en: 'The silicon diode clips off the negative swings (half-wave DC). Adding the capacitor across the load stores peak energy and fills in the valleys, turning pulsing AC into steady DC!',
        pl: 'Dioda krzemowa odcina ujemne połówki fali. Kondensator równolegle do obciążenia magazynuje energię na szczytach i wypełnia doliny, zamieniając falę AC w stabilne napięcie DC!',
      },
    },
    evaluate: (board, sim, _history, lang: Language = 'en') => {
      const mem = createTransientMemory();
      let minV = 999;
      let maxV = -999;
      // Settle for 0.35s then measure across 1 full AC period (~0.17s)
      for (let i = 0; i < 120; i++) {
        const st = stepTransientCircuit(board, mem, 0.005);
        if (i >= 70) {
          const vLoad = st.nodeVoltages['5,1'] ?? 0;
          minV = Math.min(minV, vLoad);
          maxV = Math.max(maxV, vLoad);
        }
      }
      const rectified = minV >= -0.15 && maxV >= 3.2 && !sim.shortCircuit;
      const smoothed = rectified && minV >= 1.5 && maxV - minV < 3.4;
      return {
        goals: [
          {
            id: 'rect',
            label: lang === 'pl' ? 'Dioda blokuje ujemne napięcie (tylko DC+)' : 'Diode blocks negative AC half-cycles',
            icon: 'wave',
            satisfied: rectified,
          },
          {
            id: 'smooth',
            label: lang === 'pl' ? 'Kondensator wygładza napięcie (>1,5V bez spadku do 0)' : 'Capacitor smooths ripple (stays > 1.5V DC)',
            icon: 'bolt',
            satisfied: smoothed,
          },
        ],
        solved: smoothed,
      };
    },
  },
  {
    id: 'adult-27-inductor-kickback',
    mode: 'adult',
    tier: 4,
    order: 27,
    title: { en: 'Taming the Kickback', pl: 'Przepięcie Cewki (Flyback)' },
    subtitle: {
      en: 'Flip the switch OFF once to see the 500mH Inductor launch a >15V flyback spike on the Scope! Then wire the Silicon Diode in reverse-parallel across the coil to clamp it safely under 3V.',
      pl: 'Wyłącz przełącznik, by zobaczyć na oscyloskopie impuls przepięcia >15V z cewki 500mH! Potem dodaj diodę zaporowo równolegle do cewki, by stłumić szpilkę poniżej 3V.',
    },
    conceptTag: { en: 'Inductive Kickback & Flyback Diode', pl: 'Samoindukcja i dioda gasząca' },
    narrationPrompt: {
      en: 'Lab twenty-seven: Taming the Kickback. Inductors fight sudden current stops with huge voltage spikes. Wire the silicon diode backwards across the coil so the magnetic energy loops harmlessly when the switch opens!',
      pl: 'Poziom dwudziesty siódmy: Przepięcie Cewki. Cewka broni się przed nagłym wyłączeniem prądu potężnym skokiem napięcia. Podłącz diodę krzemową zaporowo równolegle do cewki, by bezpiecznie rozładować pole magnetyczne!',
    },
    cols: 7,
    rows: 4,
    parUserItems: 3,
    defaultScope: {
      open: true,
      mode: 'time',
      ch1: { col: 4, row: 1 },
      ch2: { col: 1, row: 1 },
      timeScale: 1,
    },
    initialComponents: [
      { id: 'bat', kind: 'battery', voltage: 6, a: { col: 0, row: 1 }, b: { col: 0, row: 2 }, locked: true },
      { id: 'sw1', kind: 'switch_toggle', closed: true, a: { col: 1, row: 1 }, b: { col: 2, row: 1 }, locked: true },
      { id: 'r1', kind: 'resistor', resistance: 22, a: { col: 2, row: 1 }, b: { col: 3, row: 1 }, locked: true },
      { id: 'l1', kind: 'inductor', inductance: 0.5, a: { col: 4, row: 1 }, b: { col: 4, row: 2 }, locked: true },
    ],
    initialWires: [
      { id: 'w-1', a: { col: 0, row: 1 }, b: { col: 1, row: 1 }, color: 'red', locked: true },
      { id: 'w-2', a: { col: 3, row: 1 }, b: { col: 4, row: 1 }, color: 'red', locked: true },
      { id: 'w-g', a: { col: 4, row: 2 }, b: { col: 0, row: 2 }, color: 'black', locked: true },
    ],
    tray: [
      { templateId: 'diode', kind: 'diode', name: { en: 'Flyback Diode', pl: 'Dioda gasząca' }, shortLabel: { en: 'Diode', pl: 'Dioda' }, limit: 1 },
    ],
    lesson: {
      principle: { en: 'Faraday’s Law & Flyback Protection', pl: 'Prawo Faradaya i ochrona przed przepięciem' },
      formula: { en: 'V_L = L · (dI / dt)   ⇒   Reverse diode clamps spike to −0.7V!', pl: 'U_L = L · (dI / dt)   ⇒   Dioda zaporowa ogranicza szpilkę do −0,7V!' },
      explanation: {
        en: 'An inductor stores energy in a magnetic field and refuses to let current stop instantly—spiking to tens of volts that destroy transistors. A reverse flyback diode gives that current a safe circulation loop!',
        pl: 'Cewka magazynuje energię w polu magnetycznym i nie pozwala na nagłe przerwanie prądu — generując dziesiątki woltów niszczące tranzystory. Dioda gasząca daje temu prądowi bezpieczną pętlę powrotną!',
      },
    },
    evaluate: (board, sim, _history, lang: Language = 'en') => {
      const hasDiode = board.components.some((c) => c.kind === 'diode');
      let energized = false;
      let clamped = false;
      if (hasDiode && !sim.shortCircuit) {
        const mem = createTransientMemory();
        const onB = withSwitches(board, { sw1: true });
        const offB = withSwitches(board, { sw1: false });
        let lastOn = stepTransientCircuit(onB, mem, 0.005);
        for (let i = 0; i < 60; i++) {
          lastOn = stepTransientCircuit(onB, mem, 0.005);
        }
        const iCoil = Math.abs(lastOn.componentStates['l1']?.current ?? 0);
        energized = iCoil >= 0.14 && !lastOn.shortCircuit;
        const afterOff = stepTransientCircuit(offB, mem, 0.005);
        const spikeV = Math.abs(afterOff.componentStates['l1']?.voltageDrop ?? 0);
        clamped = energized && spikeV < 3.5;
      }
      return {
        goals: [
          {
            id: 'coil',
            label: lang === 'pl' ? 'Cewka ładuje się normalnie przy włączonym przełączniku (dioda zaporowo)' : 'Coil energizes normally when ON (diode does not short battery)',
            icon: 'bolt',
            satisfied: energized,
          },
          {
            id: 'clamp',
            label: lang === 'pl' ? 'Przepięcie przy wyłączeniu stłumione poniżej 3,5V!' : 'Switch-off flyback spike clamped safely below 3.5V!',
            icon: 'shield',
            satisfied: clamped,
          },
        ],
        solved: clamped,
      };
    },
  },
  {
    id: 'adult-28-lowpass-filter',
    mode: 'adult',
    tier: 4,
    order: 28,
    title: { en: 'Bass Booster (Low-Pass)', pl: 'Filtr Dolnoprzepustowy (LPF)' },
    subtitle: {
      en: 'Build an RC Low-Pass Filter with cutoff fc ≈ 159 Hz at socket E2 (Ch2). Switch the Scope to BODE to see high frequencies roll off!',
      pl: 'Zbuduj filtr dolnoprzepustowy RC o częstotliwości granicznej fc ≈ 159 Hz w punkcie E2 (Ch2). Przełącz oscyloskop na BODE, by zobaczyć tłumienie wysokich tonów!',
    },
    conceptTag: { en: 'RC Low-Pass Filter & Phase Lag', pl: 'Filtr dolnoprzepustowy i przesunięcie fazy' },
    narrationPrompt: {
      en: 'Lab twenty-eight: Bass Booster, an RC Low-Pass Filter. Put the 1 kilo-ohm resistor in series and the 1 microfarad capacitor from output E2 to ground, then inspect the Bode curve!',
      pl: 'Poziom dwudziesty ósmy: Filtr Dolnoprzepustowy. Wstaw rezystor 1 kiloom szeregowo, a kondensator 1 mikrofarad z wyjścia E2 do masy i zobacz charakterystykę Bodego!',
    },
    cols: 6,
    rows: 4,
    parUserItems: 4,
    defaultScope: {
      open: true,
      mode: 'bode',
      ch1: { col: 1, row: 1 },
      ch2: { col: 4, row: 1 },
      timeScale: 0.1,
    },
    initialComponents: [
      {
        id: 'ac1',
        kind: 'ac_source',
        waveform: 'sine',
        amplitude: 5,
        frequency: 159,
        a: { col: 1, row: 1 },
        b: { col: 1, row: 2 },
        locked: true,
      },
    ],
    initialWires: [],
    tray: [
      { templateId: 'res-1k', kind: 'resistor', name: { en: '1kΩ Resistor', pl: 'Rezystor 1kΩ' }, shortLabel: { en: '1kΩ', pl: '1kΩ' }, resistance: 1000, limit: 1 },
      {
        templateId: 'cap-1u',
        kind: 'capacitor',
        name: { en: '1µF Capacitor', pl: 'Kondensator 1µF' },
        shortLabel: { en: '1µF', pl: '1µF' },
        capacitance: 1e-6,
        limit: 1,
      },
    ],
    lesson: {
      principle: { en: 'Capacitive Reactance & −3 dB Cutoff', pl: 'Reaktancja pojemnościowa i spadek −3 dB' },
      formula: { en: 'X_C = 1 / (2πfC)   ⇒   f_c = 1 / (2πRC) = 159 Hz (−45° lag)', pl: 'X_C = 1 / (2πfC)   ⇒   f_c = 1 / (2πRC) = 159 Hz (−45°)' },
      explanation: {
        en: 'At low frequencies a capacitor looks open so bass passes straight to E2. At high frequencies X_C drops near zero, shunting treble to ground at −20 dB/decade!',
        pl: 'Dla niskich częstotliwości kondensator stawia duży opór, więc bas przechodzi na wyjście E2. Dla wysokich tonów jego reaktancja X_C maleje i zwiera wysokie dźwięki do masy!',
      },
    },
    evaluate: (board, sim, _history, lang: Language = 'en') => {
      const sweep = runAcFrequencySweep(board, { col: 4, row: 1 });
      const lowPt = sweep?.points[0];
      const highPt = sweep?.points[sweep.points.length - 1];
      const isLpf = Boolean(
        sweep &&
          lowPt &&
          highPt &&
          lowPt.gainDb > -1.0 &&
          highPt.gainDb < -12.0 &&
          !sim.shortCircuit
      );
      const fcMatch = Boolean(
        isLpf && sweep?.cutoffHz && sweep.cutoffHz >= 120 && sweep.cutoffHz <= 210
      );
      return {
        goals: [
          {
            id: 'lpf',
            label: lang === 'pl' ? 'Przepuszcza bas, tłumi wysokie tony na wyjściu E2' : 'Passes low frequencies, attenuates highs at E2',
            icon: 'wave',
            satisfied: isLpf,
          },
          {
            id: 'fc',
            label: lang === 'pl' ? 'Częstotliwość graniczna fc (−3 dB) ≈ 159 Hz' : '−3 dB cutoff frequency fc ≈ 159 Hz',
            icon: 'meter',
            satisfied: fcMatch,
          },
        ],
        solved: fcMatch,
      };
    },
  },
  {
    id: 'adult-29-highpass-filter',
    mode: 'adult',
    tier: 4,
    order: 29,
    title: { en: 'Treble Pass (High-Pass)', pl: 'Filtr Górnoprzepustowy (HPF)' },
    subtitle: {
      en: 'Swap the RC topology so the 1µF Capacitor blocks low frequencies and passes treble (fc ≈ 159 Hz) to output socket E2!',
      pl: 'Odwróć układ RC tak, aby kondensator 1µF blokował niskie tony i przepuszczał wysokie częstotliwości (fc ≈ 159 Hz) na wyjście E2!',
    },
    conceptTag: { en: 'RC High-Pass Filter & Phase Lead', pl: 'Filtr górnoprzepustowy (HPF)' },
    narrationPrompt: {
      en: 'Lab twenty-nine: Treble Pass, an RC High-Pass Filter. Place the 1 microfarad capacitor in series with the AC signal and the 1 kilo-ohm resistor from E2 to ground!',
      pl: 'Poziom dwudziesty dziewiąty: Filtr Górnoprzepustowy. Umieść kondensator 1 mikrofarad szeregowo z sygnałem AC, a rezystor 1 kiloom między wyjściem E2 a masą!',
    },
    cols: 6,
    rows: 4,
    parUserItems: 4,
    defaultScope: {
      open: true,
      mode: 'bode',
      ch1: { col: 1, row: 1 },
      ch2: { col: 4, row: 1 },
      timeScale: 0.1,
    },
    initialComponents: [
      {
        id: 'ac1',
        kind: 'ac_source',
        waveform: 'sine',
        amplitude: 5,
        frequency: 159,
        a: { col: 1, row: 1 },
        b: { col: 1, row: 2 },
        locked: true,
      },
    ],
    initialWires: [],
    tray: [
      { templateId: 'res-1k', kind: 'resistor', name: { en: '1kΩ Resistor', pl: 'Rezystor 1kΩ' }, shortLabel: { en: '1kΩ', pl: '1kΩ' }, resistance: 1000, limit: 1 },
      {
        templateId: 'cap-1u',
        kind: 'capacitor',
        name: { en: '1µF Capacitor', pl: 'Kondensator 1µF' },
        shortLabel: { en: '1µF', pl: '1µF' },
        capacitance: 1e-6,
        limit: 1,
      },
    ],
    lesson: {
      principle: { en: 'DC Blocking & High-Pass Phase Lead', pl: 'Blokowanie DC i filtr górnoprzepustowy' },
      formula: { en: 'f_c = 1 / (2πRC) = 159 Hz   (+45° phase lead at f_c)', pl: 'f_c = 1 / (2πRC) = 159 Hz   (+45° wyprzedzenia fazy)' },
      explanation: {
        en: 'Putting the capacitor in series blocks DC and low-frequency rumble while letting crisp high-frequency audio pass freely—used in every speaker tweeter crossover!',
        pl: 'Kondensator wpięty szeregowo blokuje prąd stały i niskie dudnienie, przepuszczając czyste wysokie tony — dokładnie jak w zwrotnicy głośnika wysokotonowego!',
      },
    },
    evaluate: (board, sim, _history, lang: Language = 'en') => {
      const sweep = runAcFrequencySweep(board, { col: 4, row: 1 });
      const lowPt = sweep?.points[0];
      const highPt = sweep?.points[sweep.points.length - 1];
      const isHpf = Boolean(
        sweep &&
          lowPt &&
          highPt &&
          lowPt.gainDb < -18.0 &&
          highPt.gainDb > -1.0 &&
          !sim.shortCircuit
      );
      const fcMatch = Boolean(
        isHpf && sweep?.cutoffHz && sweep.cutoffHz >= 120 && sweep.cutoffHz <= 210
      );
      return {
        goals: [
          {
            id: 'hpf',
            label: lang === 'pl' ? 'Blokuje niskie tony, przepuszcza wysokie na E2' : 'Blocks low frequencies, passes highs at E2',
            icon: 'wave',
            satisfied: isHpf,
          },
          {
            id: 'fc',
            label: lang === 'pl' ? 'Częstotliwość graniczna fc (−3 dB) ≈ 159 Hz' : '−3 dB cutoff frequency fc ≈ 159 Hz',
            icon: 'meter',
            satisfied: fcMatch,
          },
        ],
        solved: fcMatch,
      };
    },
  },
  {
    id: 'adult-30-rlc-radio-tuner',
    mode: 'adult',
    tier: 4,
    order: 30,
    title: { en: 'Radio Tuner (RLC Resonance)', pl: 'Rezonans Radiowy (RLC)' },
    subtitle: {
      en: 'Build a series RLC bandpass tuner feeding the 47Ω output resistor (E2) tuned right to f₀ ≈ 159 Hz — watch the sharp resonance peak on the Bode plot!',
      pl: 'Zbuduj szeregowy obwód rezonansowy RLC zasilający opór 47Ω (wyjście E2), nastrojony na f₀ ≈ 159 Hz — zobacz ostry szczyt rezonansu na wykresie Bodego!',
    },
    conceptTag: { en: 'LC Resonance & RF Tuning', pl: 'Rezonans LC i strojenie radiowe' },
    narrationPrompt: {
      en: 'Final Lab thirty: Radio Tuner, RLC Resonance! Wire the 100 millihenry inductor and the right capacitor in series with the 47 ohm output load so inductive and capacitive reactances cancel at 159 hertz!',
      pl: 'Finałowy poziom trzydziesty: Rezonans Radiowy RLC! Połącz cewkę 100 milihenrów oraz właściwy kondensator szeregowo z wyjściem 47 omów, aby uzyskać ostry szczyt rezonansu dokładnie przy 159 hercach!',
    },
    cols: 7,
    rows: 4,
    parUserItems: 5,
    defaultScope: {
      open: true,
      mode: 'bode',
      ch1: { col: 1, row: 1 },
      ch2: { col: 4, row: 1 },
      timeScale: 0.1,
    },
    initialComponents: [
      {
        id: 'ac1',
        kind: 'ac_source',
        waveform: 'sine',
        amplitude: 5,
        frequency: 159,
        a: { col: 1, row: 1 },
        b: { col: 1, row: 2 },
        locked: true,
      },
      { id: 'rOut', kind: 'resistor', resistance: 47, a: { col: 4, row: 1 }, b: { col: 4, row: 2 }, locked: true },
    ],
    initialWires: [
      { id: 'w-g', a: { col: 4, row: 2 }, b: { col: 1, row: 2 }, color: 'black', locked: true },
    ],
    tray: [
      {
        templateId: 'ind-100m',
        kind: 'inductor',
        name: { en: '100mH Inductor', pl: 'Cewka 100mH' },
        shortLabel: { en: '100mH', pl: '100mH' },
        inductance: 0.1,
        limit: 1,
      },
      {
        templateId: 'cap-10u',
        kind: 'capacitor',
        name: { en: '10µF Capacitor', pl: 'Kondensator 10µF' },
        shortLabel: { en: '10µF', pl: '10µF' },
        capacitance: 10e-6,
        limit: 1,
      },
      {
        templateId: 'cap-1u',
        kind: 'capacitor',
        name: { en: '1µF Capacitor', pl: 'Kondensator 1µF' },
        shortLabel: { en: '1µF', pl: '1µF' },
        capacitance: 1e-6,
        limit: 1,
      },
    ],
    lesson: {
      principle: { en: 'Resonance: When X_L Cancels X_C', pl: 'Rezonans: gdy X_L znosi X_C' },
      formula: {
        en: 'f₀ = 1 / (2π√(L·C)) = 1 / (2π√(0.1H × 10µF)) = 159 Hz',
        pl: 'f₀ = 1 / (2π√(L·C)) = 1 / (2π√(0,1H × 10µF)) = 159 Hz',
      },
      explanation: {
        en: 'At one magic frequency f₀, the inductor’s +jωL and capacitor’s −j/(ωC) cancel out completely—letting ONLY that radio station’s frequency ring through at full strength while rejecting all others!',
        pl: 'Przy jednej magicznej częstotliwości f₀ reaktancja cewki (+jωL) i kondensatora (−j/ωC) całkowicie się znoszą — przepuszczając pełną mocą TYLKO tę jedną stację radiową!',
      },
    },
    evaluate: (board, sim, _history, lang: Language = 'en') => {
      const sweep = runAcFrequencySweep(board, { col: 4, row: 1 });
      const hasPeak = Boolean(sweep && sweep.resonantPeakHz !== null && !sim.shortCircuit);
      const tuned = Boolean(
        hasPeak &&
          sweep!.resonantPeakHz! >= 130 &&
          sweep!.resonantPeakHz! <= 195 &&
          sweep!.peakGainDb > -2.0
      );
      return {
        goals: [
          {
            id: 'peak',
            label: lang === 'pl' ? 'Wyraźny szczyt rezonansowy pasmowy na wykresie Bodego' : 'Sharp bandpass resonance peak on Bode plot',
            icon: 'wave',
            satisfied: hasPeak,
          },
          {
            id: 'tune',
            label: lang === 'pl' ? 'Nastrojony na f₀ ≈ 159 Hz (130–195 Hz)' : 'Tuned right onto f₀ ≈ 159 Hz (130–195 Hz)',
            icon: 'meter',
            satisfied: tuned,
          },
        ],
        solved: tuned,
      };
    },
  },
];
