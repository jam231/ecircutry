export type Language = 'en' | 'pl';

export interface LocalizedText {
  en: string;
  pl: string;
}

export function pickText(text: LocalizedText, lang: Language): string {
  return text[lang];
}

export function detectInitialLanguage(): Language {
  if (typeof navigator !== 'undefined') {
    const langs = navigator.languages?.length ? navigator.languages : [navigator.language];
    for (const l of langs) {
      if (l && l.toLowerCase().startsWith('pl')) {
        return 'pl';
      }
    }
  }
  return 'en';
}

export const UI_STRINGS = {
  en: {
    brandSub: 'DC & AC Electronics Lab',
    modeAdult: 'Adult Lab',
    modeKid: 'Kid Mode',
    xray: 'X-Ray',
    xrayTitle: 'Toggle X-Ray live current flow & node voltages',
    meter: 'Meter',
    meterTitle: 'Tap any part or socket to measure Voltage, Current & Power',
    scope: 'Scope',
    scopeTitle: 'Open Dual-Channel Oscilloscope & Bode Frequency Sweep',
    why: 'Why?',
    whyTitle: "See live Ohm's Law math and diagnosis",
    resetTitle: 'Reset breadboard',
    muteTitle: 'Mute sound effects',
    unmuteTitle: 'Unmute sound effects',
    voiceOnTitle: 'Voice narration ON (tap to turn off)',
    voiceOffTitle: 'Voice narration OFF (tap to turn on)',
    listen: 'Listen',
    stopSpeaking: 'Stop',
    sandboxBadge: 'SANDBOX',
    labPrefix: 'LAB',
    missionPrefix: 'M',
    wireTool: 'Wire',
    wireHintKid: 'Drag from one hole to another to plug in a wire!',
    wireHintAdult: 'Swipe between any two sockets to snap a jumper wire.',
    wireDragTitle: 'Drag between any two sockets to snap a jumper wire',
    kidPoofBanner: 'Poof! Too much power! Add a Helper piece!',
    kidShortBanner: 'Oops! Sparks! Try moving a wire.',
    kidReverseBanner: 'Flip the light around!',
    kidFixLight: 'Fix Light ✨',
    adultReplaceLed: 'Replace Part',
    kidFixBtn: 'Fix ✨',
    adultReplaceBtn: 'Replace',
    flipPolarity: '⇄ Flip +/−',
    rotatePart: '↻ Rotate',
    removePart: 'Remove',
    removeWire: 'Remove Wire',
    jumperWire: 'Jumper Wire',
    dischargeCap: '⚡ Discharge',
    // Component names
    compBattery: 'Battery',
    compResistor: 'Resistor',
    compDimmer: 'Dimmer',
    compLed: 'LED',
    compMotor: 'DC Fan',
    compBuzzer: 'Piezo Buzzer',
    compPushBtn: 'Push Button',
    compToggleSw: 'Toggle Switch',
    compSpdtSw: '3-Way Switch',
    compLdr: 'Light Sensor (LDR)',
    compThermistor: 'NTC Thermistor',
    compDiode: 'Silicon Diode',
    compNpn: 'NPN Transistor',
    compCapacitor: 'Capacitor',
    compInductor: 'Inductor Coil',
    compAcSource: 'AC Generator',
    compHelper: 'Helper',
    switchOn: 'ON',
    switchOff: 'OFF',
    btnHeld: 'HELD',
    btnHold: 'HOLD',
    // Environment sliders
    envLight: 'Light',
    envNight: 'Night',
    envSun: 'Sun',
    envTemp: 'Temp',
    envCold: 'Cold',
    envHot: 'Hot',
    // Multimeter
    meterHeader: 'DC Multimeter',
    meterTapPrompt: 'Tap any part or socket',
    meterReady: 'Ready to measure live DC values.',
    meterSocket: 'Socket',
    meterGroundRef: 'Voltage relative to GND (−)',
    meterFloat: 'Unconnected socket',
    meterWireOverload: 'OVERLOAD! Short circuit current.',
    meterWireFlow: 'Carrying current',
    meterWireIdle: 'No current flowing',
    meterOpen: 'OPEN',
    // Oscilloscope
    scopeHeader: 'Oscilloscope',
    scopeKidHeader: 'Wave Screen',
    scopeTimeTab: 'TIME',
    scopeBodeTab: 'BODE',
    scopeRun: 'Run',
    scopePause: 'Hold',
    scopeTapProbe: 'Tap socket to move',
    scopeNoAc: 'Place an AC Generator to plot frequency response (Bode).',
    scopeCutoff: 'fc (−3dB)',
    scopeResonance: 'f₀ Peak',
    // Math drawer
    mathTitle: 'Why? — Live Circuit Math',
    liveDiagnosis: 'Live Diagnosis',
    tryThis: 'Try this:',
    corePrinciple: 'Core Principle',
    cheatSheetTag: 'Pocket Cheat Sheet',
    cheatSheetLine1:
      'V = I·R  •  P = V·I  •  BJT: I_C = β·I_B (V_BE ≈ 0.7V)  •  RC: τ = R·C',
    cheatSheetLine2:
      'Filters: f_c = 1/(2πRC)  •  RLC Resonance: f₀ = 1/(2π√LC)  •  LED safe limit: 10–25 mA.',
    // Level modal
    kidMissionsHeader: 'Little Inventor Missions',
    adultCampaignHeader: 'Electronics Curriculum — Tiers 1–4',
    stemModulesLabel: 'STEM Modules:',
    nextBadge: '• Next',
    // Victory modal
    victoryKidTitle: 'Awesome Invention!',
    victoryAdultSuffix: 'Solved!',
    keepTinkering: 'Keep Tinkering',
    openSandbox: 'Open Free Sandbox →',
    nextMission: 'Next Mission →',
    nextLab: 'Next Lab →',
    // Spoken narration templates
    speakKidBurnout: 'Oops! Poof! Too much power went to the light. Add a Helper resistor piece and try again!',
    speakKidShort: 'Careful! Sparks! A wire went straight from plus to minus. Move that wire!',
    speakKidReverse: 'The light is backwards! Tap the light and press Flip.',
    speakKidVictoryPrefix: 'Hooray! Awesome invention!',
    speakAdultVictoryPrefix: 'Nice work! Circuit solved.',
    // Led color adjectives
    ledRed: 'Red',
    ledGreen: 'Green',
    ledAmber: 'Amber',
    ledBlue: 'Blue',
  },
  pl: {
    brandSub: 'Laboratorium Elektroniki',
    modeAdult: 'Tryb Dorosły',
    modeKid: 'Dla Dzieci',
    xray: 'Prąd',
    xrayTitle: 'Pokaż przepływ prądu i napięcia w punktach',
    meter: 'Miernik',
    meterTitle: 'Dotknij elementu lub otworu, by zmierzyć napięcie, prąd i moc',
    scope: 'Oscyloskop',
    scopeTitle: 'Otwórz Dwukanałowy Oscyloskop i Wykres Bodego',
    why: 'Dlaczego?',
    whyTitle: 'Zobacz wzory z fizyki i diagnozę obwodu',
    resetTitle: 'Wyczyść płytkę',
    muteTitle: 'Wycisz dźwięki',
    unmuteTitle: 'Włącz dźwięki',
    voiceOnTitle: 'Lektor włączony (dotknij, aby wyłączyć)',
    voiceOffTitle: 'Lektor wyłączony (dotknij, aby włączyć)',
    listen: 'Posłuchaj',
    stopSpeaking: 'Stop',
    sandboxBadge: 'SWOBODA',
    labPrefix: 'LAB',
    missionPrefix: 'M',
    wireTool: 'Kabelek',
    wireHintKid: 'Przeciągnij palcem od dziurki do dziurki, żeby podłączyć kabelek!',
    wireHintAdult: 'Przeciągnij między dowolnymi otworami, by wpiąć przewód.',
    wireDragTitle: 'Przeciągnij między otworami, aby podłączyć przewód',
    kidPoofBanner: 'Puf! Za dużo prądu! Dodaj Pomocnika!',
    kidShortBanner: 'Ups! Iskry! Przestaw kabelek.',
    kidReverseBanner: 'Odwróć lampkę!',
    kidFixLight: 'Napraw lampkę ✨',
    adultReplaceLed: 'Wymień część',
    kidFixBtn: 'Napraw ✨',
    adultReplaceBtn: 'Wymień',
    flipPolarity: '⇄ Odwróć +/−',
    rotatePart: '↻ Obróć',
    removePart: 'Usuń',
    removeWire: 'Usuń przewód',
    jumperWire: 'Przewód',
    dischargeCap: '⚡ Rozładuj',
    // Component names
    compBattery: 'Bateria',
    compResistor: 'Rezystor',
    compDimmer: 'Ściemniacz',
    compLed: 'Dioda LED',
    compMotor: 'Wiatrak DC',
    compBuzzer: 'Brzęczyk',
    compPushBtn: 'Przycisk',
    compToggleSw: 'Przełącznik',
    compSpdtSw: 'Przełącznik SPDT',
    compLdr: 'Fotorezystor (LDR)',
    compThermistor: 'Termistor NTC',
    compDiode: 'Dioda krzemowa',
    compNpn: 'Tranzystor NPN',
    compCapacitor: 'Kondensator',
    compInductor: 'Cewka',
    compAcSource: 'Generator AC',
    compHelper: 'Pomocnik',
    switchOn: 'WŁ',
    switchOff: 'WYŁ',
    btnHeld: 'WCISK',
    btnHold: 'TRZYMAJ',
    // Environment sliders
    envLight: 'Światło',
    envNight: 'Noc',
    envSun: 'Słońce',
    envTemp: 'Temp.',
    envCold: 'Zimno',
    envHot: 'Gorąco',
    // Multimeter
    meterHeader: 'Multimetr DC',
    meterTapPrompt: 'Dotknij części lub otworu',
    meterReady: 'Gotowy do pomiaru obwodu.',
    meterSocket: 'Otwór',
    meterGroundRef: 'Napięcie względem masy (−)',
    meterFloat: 'Niepodłączony otwór',
    meterWireOverload: 'ZWARCIE! Zbyt duży prąd w przewodzie.',
    meterWireFlow: 'Płynie prąd',
    meterWireIdle: 'Brak przepływu prądu',
    meterOpen: 'PRZERWA',
    // Oscilloscope
    scopeHeader: 'Oscyloskop',
    scopeKidHeader: 'Ekran Fal',
    scopeTimeTab: 'CZAS',
    scopeBodeTab: 'BODE',
    scopeRun: 'Start',
    scopePause: 'Pauza',
    scopeTapProbe: 'Dotknij otworu, by przełożyć sondę',
    scopeNoAc: 'Dodaj Generator AC, aby wykreślić charakterystykę Bodego.',
    scopeCutoff: 'fc (−3dB)',
    scopeResonance: 'f₀ Szczyt',
    // Math drawer
    mathTitle: 'Dlaczego? — Fizyka na żywo',
    liveDiagnosis: 'Diagnoza obwodu',
    tryThis: 'Spróbuj tak:',
    corePrinciple: 'Zasada działania',
    cheatSheetTag: 'Ściągawka inżyniera',
    cheatSheetLine1:
      'U = I·R  •  P = U·I  •  NPN: I_C = β·I_B (U_BE ≈ 0,7V)  •  RC: τ = R·C',
    cheatSheetLine2:
      'Filtry: f_c = 1/(2πRC)  •  Rezonans RLC: f₀ = 1/(2π√LC)  •  Bezpieczny prąd LED: 10–25 mA.',
    // Level modal
    kidMissionsHeader: 'Misje Małego Wynalazcy',
    adultCampaignHeader: 'Kurs Elektroniki — Poziomy 1–4',
    stemModulesLabel: 'Moduły STEM:',
    nextBadge: '• Wkrótce',
    // Victory modal
    victoryKidTitle: 'Super wynalazek!',
    victoryAdultSuffix: 'Rozwiązane!',
    keepTinkering: 'Majsterkuj dalej',
    openSandbox: 'Otwórz Plac Zabaw →',
    nextMission: 'Następna misja →',
    nextLab: 'Następny poziom →',
    // Spoken narration templates
    speakKidBurnout: 'Ups! Puf! Za dużo prądu poleciało do lampki! Dodaj Pomocnika i spróbuj jeszcze raz!',
    speakKidShort: 'Uwaga! Iskry! Kabelek połączył plus prosto z minusem. Przestaw go!',
    speakKidReverse: 'Lampka jest włożona odwrotnie! Dotknij jej i naciśnij Odwróć.',
    speakKidVictoryPrefix: 'Brawo! Super wynalazek!',
    speakAdultVictoryPrefix: 'Świetna robota! Obwód działa poprawnie.',
    // Led color adjectives
    ledRed: 'Czerwona',
    ledGreen: 'Zielona',
    ledAmber: 'Żółta',
    ledBlue: 'Niebieska',
  },
} as const;

export type UiKey = keyof typeof UI_STRINGS.en;

export function t(lang: Language, key: UiKey): string {
  return UI_STRINGS[lang][key];
}
