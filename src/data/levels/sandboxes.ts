import type { LevelDefinition, TrayItemTemplate } from '../../engine/types';

export const SANDBOX_TRAY_ADULT: TrayItemTemplate[] = [
  // Sources
  { templateId: 'bat-3v', kind: 'battery', name: { en: '3V Battery', pl: 'Bateria 3V' }, shortLabel: { en: '3V', pl: '3V' }, voltage: 3, limit: null },
  { templateId: 'bat-6v', kind: 'battery', name: { en: '6V Battery', pl: 'Bateria 6V' }, shortLabel: { en: '6V', pl: '6V' }, voltage: 6, limit: null },
  { templateId: 'bat-9v', kind: 'battery', name: { en: '9V Battery', pl: 'Bateria 9V' }, shortLabel: { en: '9V', pl: '9V' }, voltage: 9, limit: null },
  {
    templateId: 'ac-gen',
    kind: 'ac_source',
    name: { en: 'AC Generator', pl: 'Generator AC' },
    shortLabel: { en: 'AC ~', pl: 'AC ~' },
    waveform: 'sine',
    amplitude: 5,
    frequency: 10,
    limit: null,
  },
  // Passives
  { templateId: 'res-47', kind: 'resistor', name: { en: '47Ω Resistor', pl: 'Rezystor 47Ω' }, shortLabel: { en: '47Ω', pl: '47Ω' }, resistance: 47, limit: null },
  { templateId: 'res-100', kind: 'resistor', name: { en: '100Ω Resistor', pl: 'Rezystor 100Ω' }, shortLabel: { en: '100Ω', pl: '100Ω' }, resistance: 100, limit: null },
  { templateId: 'res-220', kind: 'resistor', name: { en: '220Ω Resistor', pl: 'Rezystor 220Ω' }, shortLabel: { en: '220Ω', pl: '220Ω' }, resistance: 220, limit: null },
  { templateId: 'res-330', kind: 'resistor', name: { en: '330Ω Resistor', pl: 'Rezystor 330Ω' }, shortLabel: { en: '330Ω', pl: '330Ω' }, resistance: 330, limit: null },
  { templateId: 'res-1k', kind: 'resistor', name: { en: '1kΩ Resistor', pl: 'Rezystor 1kΩ' }, shortLabel: { en: '1kΩ', pl: '1kΩ' }, resistance: 1000, limit: null },
  { templateId: 'res-10k', kind: 'resistor', name: { en: '10kΩ Resistor', pl: 'Rezystor 10kΩ' }, shortLabel: { en: '10kΩ', pl: '10kΩ' }, resistance: 10000, limit: null },
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
  // Reactive
  { templateId: 'cap-1u', kind: 'capacitor', name: { en: '1µF Capacitor', pl: 'Kondensator 1µF' }, shortLabel: { en: '1µF', pl: '1µF' }, capacitance: 1e-6, limit: null },
  { templateId: 'cap-47u', kind: 'capacitor', name: { en: '47µF Capacitor', pl: 'Kondensator 47µF' }, shortLabel: { en: '47µF', pl: '47µF' }, capacitance: 47e-6, limit: null },
  { templateId: 'cap-1000u', kind: 'capacitor', name: { en: '1000µF Capacitor', pl: 'Kondensator 1000µF' }, shortLabel: { en: '1000µF', pl: '1000µF' }, capacitance: 1000e-6, limit: null },
  { templateId: 'ind-100m', kind: 'inductor', name: { en: '100mH Inductor', pl: 'Cewka 100mH' }, shortLabel: { en: '100mH', pl: '100mH' }, inductance: 0.1, limit: null },
  // Semiconductors & Sensors
  { templateId: 'diode', kind: 'diode', name: { en: 'Silicon Diode', pl: 'Dioda krzemowa' }, shortLabel: { en: 'Diode', pl: 'Dioda' }, limit: null },
  { templateId: 'npn', kind: 'transistor_npn', name: { en: 'NPN Transistor', pl: 'Tranzystor NPN' }, shortLabel: { en: 'NPN', pl: 'NPN' }, limit: null },
  { templateId: 'ldr', kind: 'ldr', name: { en: 'Light Sensor (LDR)', pl: 'Fotorezystor' }, shortLabel: { en: 'LDR', pl: 'LDR' }, limit: null },
  { templateId: 'therm', kind: 'thermistor', name: { en: 'NTC Thermistor', pl: 'Termistor NTC' }, shortLabel: { en: 'NTC', pl: 'NTC' }, limit: null },
  // Switches & Outputs
  { templateId: 'sw-toggle', kind: 'switch_toggle', name: { en: 'Toggle Switch', pl: 'Przełącznik' }, shortLabel: { en: 'Switch', pl: 'Przełącz.' }, limit: null },
  { templateId: 'sw-push', kind: 'switch_push', name: { en: 'Push Button', pl: 'Przycisk' }, shortLabel: { en: 'Button', pl: 'Przycisk' }, limit: null },
  { templateId: 'sw-spdt', kind: 'switch_spdt', name: { en: '3-Way Switch (SPDT)', pl: 'Przełącznik SPDT' }, shortLabel: { en: 'SPDT', pl: 'SPDT' }, limit: null },
  { templateId: 'led-red', kind: 'led', name: { en: 'Red LED', pl: 'Czerwona LED' }, shortLabel: { en: 'Red LED', pl: 'Czerw. LED' }, ledColor: 'red', limit: null },
  { templateId: 'led-green', kind: 'led', name: { en: 'Green LED', pl: 'Zielona LED' }, shortLabel: { en: 'Green LED', pl: 'Ziel. LED' }, ledColor: 'green', limit: null },
  { templateId: 'led-amber', kind: 'led', name: { en: 'Amber LED', pl: 'Żółta LED' }, shortLabel: { en: 'Amber LED', pl: 'Żółta LED' }, ledColor: 'amber', limit: null },
  { templateId: 'led-blue', kind: 'led', name: { en: 'Blue LED', pl: 'Niebieska LED' }, shortLabel: { en: 'Blue LED', pl: 'Nieb. LED' }, ledColor: 'blue', limit: null },
  { templateId: 'motor', kind: 'motor', name: { en: 'DC Fan Motor', pl: 'Wiatrak DC' }, shortLabel: { en: 'Fan', pl: 'Wiatrak' }, limit: null },
  { templateId: 'buzzer', kind: 'buzzer', name: { en: 'Piezo Buzzer', pl: 'Brzęczyk' }, shortLabel: { en: 'Buzzer', pl: 'Brzęczyk' }, limit: null },
];

export const SANDBOX_TRAY_KID: TrayItemTemplate[] = [
  { templateId: 'bat-3v', kind: 'battery', name: { en: '3V Power', pl: 'Bateria 3V' }, shortLabel: { en: '3V', pl: '3V' }, voltage: 3, limit: null },
  { templateId: 'bat-6v', kind: 'battery', name: { en: '6V Power', pl: 'Bateria 6V' }, shortLabel: { en: '6V', pl: '6V' }, voltage: 6, limit: null },
  {
    templateId: 'ac-gen',
    kind: 'ac_source',
    name: { en: 'Wave Maker', pl: 'Maszyna Fal' },
    shortLabel: { en: 'Waves', pl: 'Fale' },
    waveform: 'sine',
    amplitude: 6,
    frequency: 2,
    limit: null,
  },
  { templateId: 'res-100', kind: 'resistor', name: { en: 'Helper', pl: 'Pomocnik' }, shortLabel: { en: 'Helper', pl: 'Pomocnik' }, resistance: 100, limit: null },
  { templateId: 'res-220', kind: 'resistor', name: { en: 'Strong Helper', pl: 'Mocny Pomocnik' }, shortLabel: { en: 'Strong', pl: 'Mocny' }, resistance: 220, limit: null },
  { templateId: 'cap-1000', kind: 'capacitor', name: { en: 'Energy Tank', pl: 'Zbiornik' }, shortLabel: { en: 'Tank', pl: 'Zbiornik' }, capacitance: 1000e-6, limit: null },
  {
    templateId: 'rheo',
    kind: 'rheostat',
    name: { en: 'Magic Dial', pl: 'Pokrętło' },
    shortLabel: { en: 'Dial', pl: 'Pokrętło' },
    resistance: 220,
    rheostatMin: 40,
    rheostatMax: 800,
    limit: null,
  },
  { templateId: 'ldr', kind: 'ldr', name: { en: 'Sun Sensor', pl: 'Czujnik Słońca' }, shortLabel: { en: 'Sun', pl: 'Słońce' }, limit: null },
  { templateId: 'therm', kind: 'thermistor', name: { en: 'Heat Sensor', pl: 'Czujnik Ciepła' }, shortLabel: { en: 'Heat', pl: 'Ciepło' }, limit: null },
  { templateId: 'npn', kind: 'transistor_npn', name: { en: 'Magic Booster', pl: 'Wzmacniacz' }, shortLabel: { en: 'Boost', pl: 'Wzmacn.' }, limit: null },
  { templateId: 'led-red', kind: 'led', name: { en: 'Red Light', pl: 'Czerwona Lampka' }, shortLabel: { en: 'Red', pl: 'Czerwona' }, ledColor: 'red', limit: null },
  { templateId: 'led-green', kind: 'led', name: { en: 'Green Light', pl: 'Zielona Lampka' }, shortLabel: { en: 'Green', pl: 'Zielona' }, ledColor: 'green', limit: null },
  { templateId: 'led-amber', kind: 'led', name: { en: 'Yellow Light', pl: 'Żółta Lampka' }, shortLabel: { en: 'Yellow', pl: 'Żółta' }, ledColor: 'amber', limit: null },
  { templateId: 'led-blue', kind: 'led', name: { en: 'Blue Light', pl: 'Niebieska Lampka' }, shortLabel: { en: 'Blue', pl: 'Niebieska' }, ledColor: 'blue', limit: null },
  { templateId: 'sw-toggle', kind: 'switch_toggle', name: { en: 'Switch', pl: 'Przełącznik' }, shortLabel: { en: 'Switch', pl: 'Przełącz.' }, limit: null },
  { templateId: 'sw-push', kind: 'switch_push', name: { en: 'Button', pl: 'Przycisk' }, shortLabel: { en: 'Button', pl: 'Przycisk' }, limit: null },
  { templateId: 'sw-spdt', kind: 'switch_spdt', name: { en: '3-Way Switch', pl: 'Zwrotnica' }, shortLabel: { en: '3-Way', pl: 'Zwrotn.' }, limit: null },
  { templateId: 'motor', kind: 'motor', name: { en: 'Spinning Fan', pl: 'Wiatrak' }, shortLabel: { en: 'Fan', pl: 'Wiatrak' }, limit: null },
  { templateId: 'buzzer', kind: 'buzzer', name: { en: 'Buzzer', pl: 'Brzęczyk' }, shortLabel: { en: 'Buzzer', pl: 'Brzęczyk' }, limit: null },
];

export const ADULT_SANDBOX: LevelDefinition = {
  id: 'adult-sandbox',
  mode: 'adult',
  tier: 4,
  order: 99,
  title: { en: 'Free Lab Bench', pl: 'Wolny Stół Lab' },
  subtitle: {
    en: 'Full Tier 1–4 parts catalog + Multimeter + Dual-Channel Oscilloscope & Bode Sweep.',
    pl: 'Pełny zestaw części (Poziomy 1–4) + Multimetr + Dwukanałowy Oscyloskop i Wykres Bodego.',
  },
  conceptTag: { en: 'Open Sandbox', pl: 'Swobodny tryb' },
  narrationPrompt: {
    en: 'Welcome to the Free Lab Bench! Build anything from DC dividers and NPN logic gates to blinking oscillators and tuned RLC radio filters.',
    pl: 'Witaj przy Wolnym Stole! Buduj wszystko: od dzielników napięcia i bramek na tranzystorach po migacze i rezonansowe filtry radiowe.',
  },
  isSandbox: true,
  cols: 8,
  rows: 5,
  initialComponents: [
    { id: 'bat-sb', kind: 'battery', voltage: 6, a: { col: 0, row: 1 }, b: { col: 0, row: 3 } },
  ],
  initialWires: [],
  tray: SANDBOX_TRAY_ADULT,
  lesson: {
    principle: { en: 'Full Electronics Workbench', pl: 'Pełny warsztat elektronika' },
    formula: { en: 'V = I·R  |  I_C = β·I_B  |  τ = R·C  |  f₀ = 1/(2π√LC)', pl: 'U = I·R  |  I_C = β·I_B  |  τ = R·C  |  f₀ = 1/(2π√LC)' },
    explanation: {
      en: 'Combine sensors, transistors, diodes, capacitors, inductors, and AC generators with live X-Ray flow, Multimeter, and Dual-Channel Oscilloscope.',
      pl: 'Łącz czujniki, tranzystory, diody, kondensatory, cewki i generatory AC z podglądem prądu, multimetrem i dwukanałowym oscyloskopem.',
    },
  },
  evaluate: () => ({ goals: [], solved: false }),
};

export const KID_SANDBOX: LevelDefinition = {
  id: 'kid-sandbox',
  mode: 'kid',
  tier: 4,
  order: 99,
  title: { en: 'Free Play Toybox', pl: 'Plac Zabaw' },
  subtitle: {
    en: 'Snap lights, fans, sun sensors, boosters, energy tanks, and wave makers!',
    pl: 'Łącz lampki, wiatraki, czujniki, wzmacniacze, zbiorniki energii i maszynę fal!',
  },
  conceptTag: { en: 'Free Play', pl: 'Wolna zabawa' },
  narrationPrompt: {
    en: 'Welcome to the Free Play Toybox! Mix lights, spinning fans, sun sensors, energy tanks, and the wave maker to invent your own super machine!',
    pl: 'Witaj na Placu Zabaw! Łącz lampki, wiatraki, czujniki słońca, zbiorniki energii i maszynę fal, żeby stworzyć własny wynalazek!',
  },
  isSandbox: true,
  cols: 7,
  rows: 5,
  initialComponents: [
    { id: 'bat-ksb', kind: 'battery', voltage: 6, a: { col: 0, row: 1 }, b: { col: 0, row: 3 } },
  ],
  initialWires: [],
  tray: SANDBOX_TRAY_KID,
  lesson: {
    principle: { en: 'Invent Anything!', pl: 'Wymyśl coś własnego!' },
    formula: { en: 'Snap + Wire + Play', pl: 'Wepnij + Połącz + Baw się' },
    explanation: {
      en: 'Mix lights, spinning fans, sensors, dials, buttons, and buzzers to build your own cool invention!',
      pl: 'Łącz kolorowe lampki, wirujące wiatraki, czujniki, pokrętła, przyciski i brzęczyki w swoje super maszyny!',
    },
  },
  evaluate: () => ({ goals: [], solved: false }),
};
