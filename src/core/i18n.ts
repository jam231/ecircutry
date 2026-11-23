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
    brandSub: 'DC Electronics Lab',
    modeAdult: 'Adult Lab',
    modeKid: 'Kid Mode',
    xray: 'X-Ray',
    xrayTitle: 'Toggle X-Ray live current flow & node voltages',
    meter: 'Meter',
    meterTitle: 'Tap any part or socket to measure Voltage, Current & Power',
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
    adultReplaceLed: 'Replace LED',
    kidFixBtn: 'Fix ✨',
    adultReplaceBtn: 'Replace',
    flipPolarity: '⇄ Flip +/−',
    rotatePart: '↻ Rotate',
    removePart: 'Remove',
    removeWire: 'Remove Wire',
    jumperWire: 'Jumper Wire',
    // Component names
    compBattery: 'Battery',
    compResistor: 'Resistor',
    compDimmer: 'Dimmer',
    compLed: 'LED',
    compMotor: 'DC Fan',
    compBuzzer: 'Piezo Buzzer',
    compPushBtn: 'Push Button',
    compToggleSw: 'Toggle Switch',
    compHelper: 'Helper',
    switchOn: 'ON',
    switchOff: 'OFF',
    btnHeld: 'HELD',
    btnHold: 'HOLD',
    // Multimeter
    meterHeader: 'DC Multimeter',
    meterTapPrompt: 'Tap any part or socket',
    meterReady: 'Ready to measure live DC values.',
    meterSocket: 'Socket',
    meterGroundRef: 'Voltage relative to Battery − (GND)',
    meterFloat: 'Unconnected socket',
    meterWireOverload: 'OVERLOAD! Short circuit current.',
    meterWireFlow: 'Carrying current',
    meterWireIdle: 'No current flowing',
    meterOpen: 'OPEN',
    // Math drawer
    mathTitle: 'Why? — Live Circuit Math',
    liveDiagnosis: 'Live Diagnosis',
    tryThis: 'Try this:',
    corePrinciple: 'Core Principle',
    cheatSheetTag: 'Pocket Cheat Sheet',
    cheatSheetLine1:
      'Voltage (V) = electrical push • Current (A / mA) = flow rate • Resistance (Ω) = flow squeeze.',
    cheatSheetLine2:
      'Standard 5mm LEDs glow happiest around 10–25 mA and pop above 35 mA.',
    // Level modal
    kidMissionsHeader: 'Little Inventor Missions',
    adultCampaignHeader: 'Practical DC Lab — Campaign',
    stemModulesLabel: 'STEM Modules:',
    nextBadge: '• Next',
    // Victory modal
    victoryKidTitle: 'Awesome Invention!',
    victoryAdultSuffix: 'Solved!',
    keepTinkering: 'Keep Tinkering',
    openSandbox: 'Open Free Sandbox →',
    nextMission: 'Next Mission →',
    nextLab: 'Next Lab →',
    // Spoken narration templates (Kid & Adult)
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
    why: 'Dlaczego?',
    whyTitle: 'Zobacz wzory z prawa Ohma i diagnozę obwodu',
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
    adultReplaceLed: 'Wymień LED',
    kidFixBtn: 'Napraw ✨',
    adultReplaceBtn: 'Wymień',
    flipPolarity: '⇄ Odwróć +/−',
    rotatePart: '↻ Obróć',
    removePart: 'Usuń',
    removeWire: 'Usuń przewód',
    jumperWire: 'Przewód',
    // Component names
    compBattery: 'Bateria',
    compResistor: 'Rezystor',
    compDimmer: 'Ściemniacz',
    compLed: 'Dioda LED',
    compMotor: 'Wiatrak DC',
    compBuzzer: 'Brzęczyk',
    compPushBtn: 'Przycisk',
    compToggleSw: 'Przełącznik',
    compHelper: 'Pomocnik',
    switchOn: 'WŁ',
    switchOff: 'WYŁ',
    btnHeld: 'WCISK',
    btnHold: 'TRZYMAJ',
    // Multimeter
    meterHeader: 'Multimetr DC',
    meterTapPrompt: 'Dotknij części lub otworu',
    meterReady: 'Gotowy do pomiaru obwodu DC.',
    meterSocket: 'Otwór',
    meterGroundRef: 'Napięcie względem minusa baterii (GND)',
    meterFloat: 'Niepodłączony otwór',
    meterWireOverload: 'ZWARCIE! Zbyt duży prąd w przewodzie.',
    meterWireFlow: 'Płynie prąd',
    meterWireIdle: 'Brak przepływu prądu',
    meterOpen: 'PRZERWA',
    // Math drawer
    mathTitle: 'Dlaczego? — Fizyka na żywo',
    liveDiagnosis: 'Diagnoza obwodu',
    tryThis: 'Spróbuj tak:',
    corePrinciple: 'Zasada działania',
    cheatSheetTag: 'Ściągawka inżyniera',
    cheatSheetLine1:
      'Napięcie (V) = „ciśnienie” prądu • Natężenie (A / mA) = szybkość przepływu • Opór (Ω) = zwężenie.',
    cheatSheetLine2:
      'Zwykłe diody LED najlepiej świecą przy 10–25 mA, a powyżej 35 mA ulegają spaleniu.',
    // Level modal
    kidMissionsHeader: 'Misje Małego Wynalazcy',
    adultCampaignHeader: 'Praktyczna Elektronika DC — Kampania',
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
