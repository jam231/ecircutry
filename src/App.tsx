import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { type Language, pickText, t } from './core/i18n';
import { narrator } from './core/narrator';
import {
  type AppMode,
  type CircuitBoardState,
  type CircuitComponent,
  type GridCoord,
  type LedColor,
  type LevelDefinition,
  type LevelInteractionHistory,
  type TrayItemTemplate,
  type WireColor,
  coordsEqual,
  edgeKey,
} from './engine/types';
import { solveCircuit } from './engine/circuitSolver';
import { formatCurrent, formatOhms, formatVoltage } from './engine/resistorColors';
import {
  ADULT_LEVELS,
  ADULT_SANDBOX,
  KID_MISSIONS,
  KID_SANDBOX,
} from './data/electronicsLevels';
import { soundEngine } from './core/soundEngine';
import { loadProgress, saveProgress } from './core/storage';
import { BreadboardView, type ProbeTarget } from './components/BreadboardView';
import { PartsTray } from './components/PartsTray';
import { MultimeterHud } from './components/MultimeterHud';
import { MathDrawer } from './components/MathDrawer';
import { LevelModal } from './components/LevelModal';
import { GoalIcon } from './components/GoalIcon';

function createInitialBoard(level: LevelDefinition): CircuitBoardState {
  return {
    cols: level.cols,
    rows: level.rows,
    components: level.initialComponents.map((c) => ({ ...c, a: { ...c.a }, b: { ...c.b } })),
    wires: level.initialWires.map((w) => ({ ...w, a: { ...w.a }, b: { ...w.b } })),
  };
}

let uidCounter = 1;
function nextUid(prefix: string): string {
  uidCounter += 1;
  return `${prefix}-${uidCounter}`;
}

function getLedColorLabel(color: LedColor | undefined, lang: Language): string {
  switch (color) {
    case 'green':
      return t(lang, 'ledGreen');
    case 'amber':
      return t(lang, 'ledAmber');
    case 'blue':
      return t(lang, 'ledBlue');
    default:
      return t(lang, 'ledRed');
  }
}

export function App() {
  const initialProgress = useMemo(() => loadProgress(), []);
  const [mode, setMode] = useState<AppMode>(initialProgress.mode);
  const [lang, setLang] = useState<Language>(initialProgress.lang);
  const [muted, setMuted] = useState<boolean>(initialProgress.muted);
  const [voiceEnabled, setVoiceEnabled] = useState<boolean>(initialProgress.voiceEnabled);
  const [completed, setCompleted] = useState<Record<string, number>>(initialProgress.completed);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);

  const activeLevels = mode === 'kid' ? KID_MISSIONS : ADULT_LEVELS;
  const activeSandbox = mode === 'kid' ? KID_SANDBOX : ADULT_SANDBOX;

  const [level, setLevel] = useState<LevelDefinition>(() =>
    initialProgress.mode === 'kid' ? KID_MISSIONS[0] : ADULT_LEVELS[0]
  );
  const [board, setBoard] = useState<CircuitBoardState>(() =>
    createInitialBoard(initialProgress.mode === 'kid' ? KID_MISSIONS[0] : ADULT_LEVELS[0])
  );
  const [componentTemplateMap, setComponentTemplateMap] = useState<Record<string, string>>({});
  const [history, setHistory] = useState<LevelInteractionHistory>({ flags: {}, burnoutCount: 0 });

  // UI & tool states
  const [wireColor, setWireColor] = useState<WireColor>('red');
  const [selectedTemplate, setSelectedTemplate] = useState<TrayItemTemplate | null>(null);
  const [selectedItem, setSelectedItem] = useState<{ kind: 'component' | 'wire'; id: string } | null>(null);
  const [xrayMode, setXrayMode] = useState<boolean>(false);
  const [meterMode, setMeterMode] = useState<boolean>(false);
  const [probeTarget, setProbeTarget] = useState<ProbeTarget | null>(null);
  const [showMath, setShowMath] = useState<boolean>(false);
  const [showLevels, setShowLevels] = useState<boolean>(false);
  const [victoryDismissed, setVictoryDismissed] = useState<boolean>(false);
  const [earnedStars, setEarnedStars] = useState<number>(3);

  const [fanAngles, setFanAngles] = useState<Record<string, number>>({});
  const solvedForLevelRef = useRef<string | null>(null);
  const shortSoundCooldownRef = useRef<number>(0);

  // Subscribe to narrator speaking state
  useEffect(() => narrator.subscribe(setIsSpeaking), []);

  // Sync mute, voice, language, html[lang], and persistence
  useEffect(() => {
    soundEngine.setMuted(muted);
    narrator.setMuted(muted);
    narrator.setEnabled(voiceEnabled);
    if (typeof document !== 'undefined') {
      document.documentElement.lang = lang;
    }
    saveProgress({ mode, lang, muted, voiceEnabled, completed });
  }, [mode, lang, muted, voiceEnabled, completed]);

  const loadLevel = useCallback(
    (nextLvl: LevelDefinition, options: { speakPrompt?: boolean; overrideLang?: Language; overrideMode?: AppMode } = {}) => {
      narrator.stop();
      setLevel(nextLvl);
      setBoard(createInitialBoard(nextLvl));
      setComponentTemplateMap({});
      setHistory({ flags: {}, burnoutCount: 0 });
      setSelectedTemplate(null);
      setSelectedItem(null);
      setProbeTarget(null);
      setVictoryDismissed(false);
      solvedForLevelRef.current = null;

      const effMode = options.overrideMode ?? nextLvl.mode;
      const effLang = options.overrideLang ?? lang;
      if (options.speakPrompt ?? effMode === 'kid') {
        narrator.speak(pickText(nextLvl.narrationPrompt, effLang), effLang, {
          isKidMode: effMode === 'kid',
          dedupeKey: `intro-${nextLvl.id}-${effLang}`,
          cooldownMs: 1200,
        });
      }
    },
    [lang]
  );

  const switchMode = (nextMode: AppMode) => {
    if (nextMode === mode) return;
    setMode(nextMode);
    const nextList = nextMode === 'kid' ? KID_MISSIONS : ADULT_LEVELS;
    if (nextMode === 'kid') {
      setMeterMode(false);
      setProbeTarget(null);
    }
    loadLevel(nextList[0], {
      speakPrompt: nextMode === 'kid',
      overrideMode: nextMode,
    });
  };

  const switchLanguage = (nextLang: Language) => {
    if (nextLang === lang) return;
    narrator.stop();
    setLang(nextLang);
    if (mode === 'kid') {
      narrator.speak(pickText(level.narrationPrompt, nextLang), nextLang, {
        isKidMode: true,
        dedupeKey: `lang-switch-${level.id}-${nextLang}`,
        cooldownMs: 500,
      });
    }
  };

  // Real-time MNA DC circuit solve (with localized diagnostics)
  const sim = useMemo(() => solveCircuit(board, lang), [board, lang]);

  // Evaluate level goals (with localized goal labels)
  const evaluation = useMemo(
    () => level.evaluate(board, sim, history, lang),
    [level, board, sim, history, lang]
  );

  // Continuous voltage-reactive Web Audio + friendly short/reverse voice hints in Kid Mode
  useEffect(() => {
    let maxMotor = 0;
    let maxBuzzer = 0;
    for (const comp of board.components) {
      const telem = sim.componentStates[comp.id];
      if (!telem || !telem.active || comp.burnedOut) continue;
      if (comp.kind === 'motor') {
        maxMotor = Math.max(maxMotor, Math.abs(telem.motorSpeed));
      } else if (comp.kind === 'buzzer') {
        maxBuzzer = Math.max(maxBuzzer, telem.intensity);
      }
    }
    soundEngine.updateContinuousLoads(maxMotor, maxBuzzer);

    if (sim.shortCircuit) {
      const now = Date.now();
      if (now - shortSoundCooldownRef.current > 1200) {
        shortSoundCooldownRef.current = now;
        soundEngine.playShortSpark();
        if (mode === 'kid') {
          narrator.speak(t(lang, 'speakKidShort'), lang, {
            isKidMode: true,
            dedupeKey: `kid-short-${lang}`,
            cooldownMs: 4500,
          });
        }
      }
    } else if (mode === 'kid') {
      const revDiag = sim.diagnostics.find((d) => d.id.startsWith('led-rev-'));
      if (revDiag) {
        narrator.speak(t(lang, 'speakKidReverse'), lang, {
          isKidMode: true,
          dedupeKey: `kid-rev-${revDiag.id}-${lang}`,
          cooldownMs: 5000,
        });
      }
    }
  }, [board.components, sim, mode, lang]);

  // Clean up audio & speech on unmount
  useEffect(
    () => () => {
      soundEngine.silenceContinuousLoads();
      narrator.stop();
    },
    []
  );

  // Thermal burnout timer: overloaded LED flashes bright then pops cleanly after 440ms
  useEffect(() => {
    const overloadedLedIds = board.components
      .filter((c) => c.kind === 'led' && !c.burnedOut && sim.componentStates[c.id]?.overloaded)
      .map((c) => c.id);

    if (overloadedLedIds.length === 0) return;

    const timer = window.setTimeout(() => {
      soundEngine.playLedPop(mode === 'kid');
      setHistory((prev) => ({ ...prev, burnoutCount: prev.burnoutCount + overloadedLedIds.length }));
      setBoard((prev) => ({
        ...prev,
        components: prev.components.map((c) =>
          overloadedLedIds.includes(c.id) ? { ...c, burnedOut: true } : c
        ),
      }));

      // Gentle voice feedback right after the pop sound
      window.setTimeout(() => {
        if (mode === 'kid') {
          narrator.speak(t(lang, 'speakKidBurnout'), lang, {
            isKidMode: true,
            dedupeKey: `kid-pop-${lang}`,
            cooldownMs: 4000,
          });
        } else {
          const ledDiag = sim.diagnostics.find((d) => d.id.startsWith('led-over-'));
          if (ledDiag) {
            narrator.speak(`${ledDiag.title} ${ledDiag.tip ?? ledDiag.summary}`, lang, {
              isKidMode: false,
              dedupeKey: `adult-pop-${lang}`,
              cooldownMs: 5000,
            });
          }
        }
      }, 260);
    }, 440);

    return () => window.clearTimeout(timer);
  }, [board.components, sim.componentStates, sim.diagnostics, mode, lang]);

  // Smooth 60fps fan blade rotation only while a motor is actively energized
  useEffect(() => {
    const activeMotors = board.components
      .filter((c) => c.kind === 'motor' && !c.burnedOut && Math.abs(sim.componentStates[c.id]?.motorSpeed ?? 0) > 0.05)
      .map((c) => ({ id: c.id, speed: sim.componentStates[c.id].motorSpeed }));

    if (activeMotors.length === 0) return;

    let rafId = 0;
    let last = performance.now();

    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      setFanAngles((prev) => {
        const next = { ...prev };
        for (const m of activeMotors) {
          next[m.id] = ((prev[m.id] ?? 0) + m.speed * 540 * dt) % 360;
        }
        return next;
      });
      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [board.components, sim.componentStates]);

  // Celebrate puzzle solve, save star rating, and narrate victory takeaway
  useEffect(() => {
    if (level.isSandbox || !evaluation.solved) return;
    if (solvedForLevelRef.current === level.id) return;

    solvedForLevelRef.current = level.id;
    soundEngine.playSuccessChime(mode === 'kid');

    const userCompCount = board.components.length - level.initialComponents.length;
    const userWireCount = board.wires.length - level.initialWires.length;
    const totalUserItems = Math.max(0, userCompCount + userWireCount);

    let stars = 1;
    if (history.burnoutCount === 0) stars = 2;
    if (history.burnoutCount === 0 && (!level.parUserItems || totalUserItems <= level.parUserItems + 1)) {
      stars = 3;
    }
    if (mode === 'kid') stars = 3;

    setEarnedStars(stars);
    setCompleted((prev) => ({
      ...prev,
      [level.id]: Math.max(prev[level.id] ?? 0, stars),
    }));

    const prefix = mode === 'kid' ? t(lang, 'speakKidVictoryPrefix') : t(lang, 'speakAdultVictoryPrefix');
    const explanation = pickText(level.lesson.explanation, lang);
    const speakTimer = window.setTimeout(() => {
      narrator.speak(`${prefix} ${explanation}`, lang, {
        isKidMode: mode === 'kid',
        dedupeKey: `win-${level.id}-${lang}`,
        cooldownMs: 3000,
      });
    }, 520);

    return () => window.clearTimeout(speakTimer);
  }, [evaluation.solved, level, board.components.length, board.wires.length, history.burnoutCount, mode, lang]);

  // Count used tray items
  const usedCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const comp of board.components) {
      const tid = componentTemplateMap[comp.id];
      if (tid) counts[tid] = (counts[tid] ?? 0) + 1;
    }
    return counts;
  }, [board.components, componentTemplateMap]);

  const maybeHealKids = useCallback(
    (comps: CircuitComponent[]): CircuitComponent[] =>
      mode === 'kid' ? comps.map((c) => (c.burnedOut ? { ...c, burnedOut: false } : c)) : comps,
    [mode]
  );

  // Actions
  const handleAddWire = useCallback(
    (a: GridCoord, b: GridCoord) => {
      if (coordsEqual(a, b)) return;
      const dup = board.wires.some(
        (w) => (coordsEqual(w.a, a) && coordsEqual(w.b, b)) || (coordsEqual(w.a, b) && coordsEqual(w.b, a))
      );
      if (dup) return;
      soundEngine.playPinSnap(1.08);
      setBoard((prev) => ({
        ...prev,
        components: maybeHealKids(prev.components),
        wires: [...prev.wires, { id: nextUid('w'), a, b, color: wireColor }],
      }));
    },
    [board.wires, wireColor, maybeHealKids]
  );

  const handlePlaceComponent = useCallback(
    (template: TrayItemTemplate, a: GridCoord, b: GridCoord) => {
      const used = usedCounts[template.templateId] ?? 0;
      if (template.limit !== null && used >= template.limit) return;

      const id = nextUid(template.kind);
      const newComp: CircuitComponent = {
        id,
        kind: template.kind,
        a,
        b,
        voltage: template.voltage,
        resistance: template.resistance,
        rheostatMin: template.rheostatMin,
        rheostatMax: template.rheostatMax,
        ledColor: template.ledColor,
        closed: false,
      };

      soundEngine.playPinSnap(0.92);
      setComponentTemplateMap((prev) => ({ ...prev, [id]: template.templateId }));
      setBoard((prev) => ({
        ...prev,
        components: [...maybeHealKids(prev.components), newComp],
      }));
      setSelectedItem({ kind: 'component', id });
      if (template.limit !== null && used + 1 >= template.limit) {
        setSelectedTemplate(null);
      }
    },
    [usedCounts, maybeHealKids]
  );

  const handleToggleSwitch = useCallback((id: string) => {
    setBoard((prev) => ({
      ...prev,
      components: prev.components.map((c) => {
        if (c.id !== id) return c;
        const nextClosed = !c.closed;
        soundEngine.playSwitchClick(nextClosed);
        return { ...c, closed: nextClosed };
      }),
    }));
  }, []);

  const handlePushButtonChange = useCallback((id: string, pressed: boolean) => {
    setBoard((prev) => ({
      ...prev,
      components: prev.components.map((c) => {
        if (c.id !== id || Boolean(c.closed) === pressed) return c;
        soundEngine.playSwitchClick(pressed);
        return { ...c, closed: pressed };
      }),
    }));
  }, []);

  const handleFlipComponent = (id: string) => {
    soundEngine.playPinSnap(1.0);
    setBoard((prev) => ({
      ...prev,
      components: prev.components.map((c) => (c.id === id ? { ...c, a: c.b, b: c.a } : c)),
    }));
  };

  const handleRotateComponent = (id: string) => {
    const comp = board.components.find((c) => c.id === id);
    if (!comp || comp.locked) return;
    const isHoriz = comp.a.row === comp.b.row;
    const candidates: GridCoord[] = isHoriz
      ? [
          { col: comp.a.col, row: comp.a.row + 1 },
          { col: comp.a.col, row: comp.a.row - 1 },
        ]
      : [
          { col: comp.a.col + 1, row: comp.a.row },
          { col: comp.a.col - 1, row: comp.a.row },
        ];

    const occupied = new Set(board.components.filter((c) => c.id !== id).map((c) => edgeKey(c.a, c.b)));
    const valid = candidates.find(
      (pt) =>
        pt.col >= 0 &&
        pt.col < board.cols &&
        pt.row >= 0 &&
        pt.row < board.rows &&
        !occupied.has(edgeKey(comp.a, pt))
    );
    if (!valid) return;
    soundEngine.playPinSnap(1.04);
    setBoard((prev) => ({
      ...prev,
      components: prev.components.map((c) => (c.id === id ? { ...c, b: valid } : c)),
    }));
  };

  const handleHealComponent = (id: string) => {
    soundEngine.playPinSnap(1.2);
    setBoard((prev) => ({
      ...prev,
      components: prev.components.map((c) => (c.id === id ? { ...c, burnedOut: false } : c)),
    }));
  };

  const handleHealAll = () => {
    soundEngine.playPinSnap(1.2);
    setBoard((prev) => ({
      ...prev,
      components: prev.components.map((c) => (c.burnedOut ? { ...c, burnedOut: false } : c)),
    }));
  };

  const handleRheostatChange = (id: string, resistance: number) => {
    setBoard((prev) => ({
      ...prev,
      components: prev.components.map((c) => (c.id === id ? { ...c, resistance } : c)),
    }));
  };

  const handleDeleteSelected = () => {
    if (!selectedItem) return;
    if (selectedItem.kind === 'wire') {
      soundEngine.playUnplug();
      setBoard((prev) => ({
        ...prev,
        wires: prev.wires.filter((w) => w.id !== selectedItem.id),
      }));
      setSelectedItem(null);
      return;
    }
    const comp = board.components.find((c) => c.id === selectedItem.id);
    if (!comp || comp.locked) return;
    soundEngine.playUnplug();
    setBoard((prev) => ({
      ...prev,
      components: prev.components.filter((c) => c.id !== selectedItem.id),
    }));
    setSelectedItem(null);
  };

  const handleProbe = (target: ProbeTarget) => {
    soundEngine.playProbeBeep();
    setProbeTarget(target);
  };

  const handleSpeakManual = (text: string) => {
    if (muted) {
      setMuted(false);
    }
    narrator.setMuted(false);
    narrator.speak(text, lang, { isKidMode: mode === 'kid', manual: true });
  };

  const selectedComp =
    selectedItem?.kind === 'component'
      ? board.components.find((c) => c.id === selectedItem.id) ?? null
      : null;
  const selectedWire =
    selectedItem?.kind === 'wire'
      ? board.wires.find((w) => w.id === selectedItem.id) ?? null
      : null;

  const topDiagnostic = sim.diagnostics[0] ?? null;
  const hasBurnedLed = board.components.some((c) => c.burnedOut);
  const currentIndex = activeLevels.findIndex((l) => l.id === level.id);
  const nextLevel =
    currentIndex >= 0 && currentIndex + 1 < activeLevels.length
      ? activeLevels[currentIndex + 1]
      : activeSandbox;

  return (
    <div className={`app-shell ${mode === 'kid' ? 'mode-kid' : 'mode-adult'}`}>
      {/* Top Bar */}
      <header className="top-bar">
        <div className="brand-group">
          <button
            type="button"
            className="brand-logo"
            onClick={() => setShowLevels(true)}
            aria-label={mode === 'kid' ? t(lang, 'kidMissionsHeader') : t(lang, 'adultCampaignHeader')}
          >
            <span className="brand-mark" aria-hidden="true">
              <svg width="20" height="20" viewBox="0 0 64 64">
                <rect x="6" y="29" width="12" height="6" rx="2" fill="#B8C2CC" />
                <rect x="46" y="29" width="12" height="6" rx="2" fill="#B8C2CC" />
                <rect x="16" y="21" width="32" height="22" rx="8" fill="#E3C796" />
                <rect x="22" y="21" width="4.5" height="22" fill="#E07A33" />
                <rect x="29.5" y="21" width="4.5" height="22" fill="#E07A33" />
                <rect x="37" y="21" width="4.5" height="22" fill="#7C4A27" />
                <circle cx="32" cy="11" r="5.5" fill="#F25C43" />
              </svg>
            </span>
            <span>
              <h1 className="brand-title">ecircutry</h1>
              <span className="brand-sub">{t(lang, 'brandSub')}</span>
            </span>
          </button>

          <div className="mode-switch" role="tablist" aria-label="Play mode">
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'adult'}
              className={`mode-btn ${mode === 'adult' ? 'active' : ''}`}
              onClick={() => switchMode('adult')}
            >
              <span>{t(lang, 'modeAdult')}</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'kid'}
              className={`mode-btn ${mode === 'kid' ? 'active kid-active' : ''}`}
              onClick={() => switchMode('kid')}
            >
              <span>{t(lang, 'modeKid')}</span>
            </button>
          </div>
        </div>

        <div className="top-actions">
          {/* Compact EN / PL Language Switcher */}
          <div className="lang-switch" role="group" aria-label="Language">
            <button
              type="button"
              className={`lang-btn ${lang === 'en' ? 'active' : ''}`}
              onClick={() => switchLanguage('en')}
              aria-pressed={lang === 'en'}
            >
              EN
            </button>
            <button
              type="button"
              className={`lang-btn ${lang === 'pl' ? 'active' : ''}`}
              onClick={() => switchLanguage('pl')}
              aria-pressed={lang === 'pl'}
            >
              PL
            </button>
          </div>

          {/* X-Ray Current Flow Overlay Toggle */}
          <button
            type="button"
            className={`icon-btn ${xrayMode ? 'active-xray' : ''}`}
            onClick={() => {
              soundEngine.playSwitchClick(!xrayMode);
              setXrayMode((v) => !v);
            }}
            title={t(lang, 'xrayTitle')}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z" />
            </svg>
            <span className="btn-text">{t(lang, 'xray')}</span>
          </button>

          {/* Multimeter Probe Toggle (Adult Mode) */}
          {mode === 'adult' && (
            <button
              type="button"
              className={`icon-btn ${meterMode ? 'active-meter' : ''}`}
              onClick={() => {
                soundEngine.playProbeBeep();
                setMeterMode((v) => {
                  const next = !v;
                  if (!next) setProbeTarget(null);
                  return next;
                });
              }}
              title={t(lang, 'meterTitle')}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <rect x="4" y="3" width="16" height="18" rx="3" />
                <path d="M8 7h8v4H8z" />
                <circle cx="12" cy="15.5" r="2" />
              </svg>
              <span className="btn-text">{t(lang, 'meter')}</span>
            </button>
          )}

          {/* Why? (Show Math) Drawer */}
          {mode === 'adult' && (
            <button
              type="button"
              className={`icon-btn btn-why ${topDiagnostic?.severity === 'danger' ? 'pulse-alert' : ''}`}
              onClick={() => setShowMath(true)}
              title={t(lang, 'whyTitle')}
            >
              <span className="btn-text">{t(lang, 'why')}</span>
            </button>
          )}

          {/* Voice Narration Toggle */}
          {narrator.isSupported() && (
            <button
              type="button"
              className={`icon-btn ${voiceEnabled && !muted ? 'active-voice' : ''}`}
              onClick={() => {
                const next = !voiceEnabled;
                setVoiceEnabled(next);
                if (!next) {
                  narrator.stop();
                } else if (muted) {
                  setMuted(false);
                }
              }}
              title={voiceEnabled ? t(lang, 'voiceOnTitle') : t(lang, 'voiceOffTitle')}
              aria-label={voiceEnabled ? t(lang, 'voiceOnTitle') : t(lang, 'voiceOffTitle')}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" y1="19" x2="12" y2="23" />
                {(!voiceEnabled || muted) && <line x1="3" y1="3" x2="21" y2="21" />}
              </svg>
            </button>
          )}

          {/* Reset Level */}
          <button
            type="button"
            className="icon-btn"
            onClick={() => {
              soundEngine.playUnplug();
              loadLevel(level, { speakPrompt: false });
            }}
            title={t(lang, 'resetTitle')}
            aria-label={t(lang, 'resetTitle')}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
              <path d="M3 3v5h5" />
            </svg>
          </button>

          {/* Audio Mute Toggle */}
          <button
            type="button"
            className="icon-btn"
            onClick={() => setMuted((m) => !m)}
            title={muted ? t(lang, 'unmuteTitle') : t(lang, 'muteTitle')}
            aria-label={muted ? t(lang, 'unmuteTitle') : t(lang, 'muteTitle')}
          >
            {muted ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                <path d="M11 5L6 9H2v6h4l5 4V5z" />
                <line x1="22" y1="9" x2="16" y2="15" />
                <line x1="16" y1="9" x2="22" y2="15" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                <path d="M11 5L6 9H2v6h4l5 4V5z" />
                <path d="M15.5 8.5a5 5 0 0 1 0 7" />
                <path d="M19 5a9.5 9.5 0 0 1 0 14" />
              </svg>
            )}
          </button>
        </div>
      </header>

      {/* Level Info & Goal Strip */}
      <section className="mission-strip" aria-label={pickText(level.title, lang)}>
        <div className="mission-meta">
          <button
            type="button"
            className="level-picker-trigger"
            onClick={() => setShowLevels(true)}
          >
            <span>
              {level.isSandbox
                ? t(lang, 'sandboxBadge')
                : mode === 'kid'
                ? `${t(lang, 'missionPrefix')}${level.order}`
                : `${t(lang, 'labPrefix')} ${String(level.order).padStart(2, '0')}`}
            </span>
            <span aria-hidden="true">▾</span>
          </button>

          {/* On-demand Read Aloud button (especially big & joyful in Kid Mode!) */}
          {narrator.isSupported() && (
            <button
              type="button"
              className={`mission-speak-btn ${mode === 'kid' ? 'kid-speak' : ''} ${isSpeaking ? 'speaking' : ''}`}
              onClick={() =>
                isSpeaking
                  ? narrator.stop()
                  : handleSpeakManual(pickText(level.narrationPrompt, lang))
              }
              title={isSpeaking ? t(lang, 'stopSpeaking') : t(lang, 'listen')}
              aria-label={isSpeaking ? t(lang, 'stopSpeaking') : t(lang, 'listen')}
            >
              {isSpeaking ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="6" y="6" width="12" height="12" rx="2.5" />
                </svg>
              ) : (
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round">
                  <path d="M11 5L6 9H2v6h4l5 4V5z" />
                  <path d="M15.5 8.5a5 5 0 0 1 0 7" />
                  <path d="M19 5a9.5 9.5 0 0 1 0 14" />
                </svg>
              )}
            </button>
          )}

          <div className="mission-copy">
            <div className="mission-title-row">
              <h2 className="mission-title">{pickText(level.title, lang)}</h2>
            </div>
            {mode === 'adult' && (
              <p className="mission-subtitle">{pickText(level.subtitle, lang)}</p>
            )}
          </div>
        </div>

        {/* Goals: Clean text chips in Adult Mode; Zero-reading giant icon pills in Kid Mode */}
        {evaluation.goals.length > 0 && (
          <div className="goal-list">
            {evaluation.goals.map((g) =>
              mode === 'kid' ? (
                <div
                  key={g.id}
                  className={`kid-goal-pill ${g.satisfied ? 'satisfied' : ''}`}
                  title={g.label}
                >
                  <GoalIcon icon={g.icon} satisfied={g.satisfied} size={24} />
                  {g.satisfied && (
                    <span style={{ fontSize: 15, fontWeight: 900, color: '#1B804B' }}>✓</span>
                  )}
                </div>
              ) : (
                <div key={g.id} className={`goal-chip ${g.satisfied ? 'satisfied' : ''}`}>
                  <GoalIcon icon={g.icon} satisfied={g.satisfied} size={15} />
                  <span>{g.label}</span>
                </div>
              )
            )}
          </div>
        )}
      </section>

      {/* Interactive Realistic Breadboard Stage */}
      <main className="stage-container">
        {topDiagnostic && (topDiagnostic.severity === 'danger' || topDiagnostic.severity === 'warn') && (
          <div className={`status-banner ${topDiagnostic.severity}`} role="status">
            <span>
              {mode === 'kid'
                ? hasBurnedLed
                  ? t(lang, 'kidPoofBanner')
                  : topDiagnostic.severity === 'danger'
                  ? t(lang, 'kidShortBanner')
                  : t(lang, 'kidReverseBanner')
                : topDiagnostic.title}
            </span>
            {hasBurnedLed && (
              <button type="button" className="status-banner-action" onClick={handleHealAll}>
                {mode === 'kid' ? t(lang, 'kidFixLight') : t(lang, 'adultReplaceLed')}
              </button>
            )}
            {mode === 'adult' && (
              <button
                type="button"
                className="status-banner-action"
                onClick={() => setShowMath(true)}
              >
                {t(lang, 'why')}
              </button>
            )}
          </div>
        )}

        <div className="breadboard-frame">
          <BreadboardView
            board={board}
            sim={sim}
            fanAngles={fanAngles}
            isKidMode={mode === 'kid'}
            lang={lang}
            xrayMode={xrayMode}
            meterMode={meterMode}
            wireColor={wireColor}
            selectedTemplate={selectedTemplate}
            selectedItem={selectedItem}
            probeTarget={probeTarget}
            guideWire={level.guideWire}
            onAddWire={handleAddWire}
            onPlaceComponent={handlePlaceComponent}
            onToggleSwitch={handleToggleSwitch}
            onPushButtonChange={handlePushButtonChange}
            onSelectItem={setSelectedItem}
            onProbe={handleProbe}
          />
        </div>

        {/* Pocket Digital Multimeter HUD */}
        {meterMode && (
          <MultimeterHud
            board={board}
            sim={sim}
            probeTarget={probeTarget}
            lang={lang}
            onClose={() => {
              setMeterMode(false);
              setProbeTarget(null);
            }}
          />
        )}

        {/* Contextual Floating Action Pill for Selected Component or Wire */}
        {!meterMode && (selectedComp || selectedWire) && (
          <div className="inspector-pill" role="toolbar" aria-label="Selected item controls">
            {selectedComp && (() => {
              const telem = sim.componentStates[selectedComp.id];
              return (
                <>
                  <span className="inspector-label">
                    {selectedComp.kind === 'rheostat'
                      ? `${t(lang, 'compDimmer')} (${formatOhms(selectedComp.resistance ?? 330)})`
                      : selectedComp.kind === 'resistor'
                      ? mode === 'kid'
                        ? t(lang, 'compHelper')
                        : `${t(lang, 'compResistor')} (${formatOhms(selectedComp.resistance ?? 220)})`
                      : selectedComp.kind === 'battery'
                      ? `${t(lang, 'compBattery')} ${selectedComp.voltage ?? 3}V`
                      : selectedComp.kind === 'led'
                      ? `${getLedColorLabel(selectedComp.ledColor, lang)} LED`
                      : selectedComp.kind === 'motor'
                      ? t(lang, 'compMotor')
                      : selectedComp.kind === 'buzzer'
                      ? t(lang, 'compBuzzer')
                      : selectedComp.kind === 'switch_push'
                      ? t(lang, 'compPushBtn')
                      : t(lang, 'compToggleSw')}
                  </span>

                  {mode === 'adult' && telem && (
                    <span className="inspector-readout">
                      {formatVoltage(Math.abs(telem.voltageDrop))} • {formatCurrent(telem.current)}
                    </span>
                  )}

                  {selectedComp.kind === 'rheostat' && (
                    <label className="rheostat-slider-wrap">
                      <input
                        className="rheostat-slider"
                        type="range"
                        min={selectedComp.rheostatMin ?? 20}
                        max={selectedComp.rheostatMax ?? 1000}
                        step={10}
                        value={selectedComp.resistance ?? 330}
                        onChange={(e) =>
                          handleRheostatChange(selectedComp.id, Number(e.target.value))
                        }
                      />
                    </label>
                  )}

                  {selectedComp.burnedOut && (
                    <button
                      type="button"
                      className="inspector-btn heal"
                      onClick={() => handleHealComponent(selectedComp.id)}
                    >
                      {mode === 'kid' ? t(lang, 'kidFixBtn') : t(lang, 'adultReplaceBtn')}
                    </button>
                  )}

                  {(selectedComp.kind === 'led' ||
                    selectedComp.kind === 'battery' ||
                    selectedComp.kind === 'motor') && (
                    <button
                      type="button"
                      className="inspector-btn"
                      onClick={() => handleFlipComponent(selectedComp.id)}
                    >
                      {t(lang, 'flipPolarity')}
                    </button>
                  )}

                  {!selectedComp.locked && (
                    <button
                      type="button"
                      className="inspector-btn"
                      onClick={() => handleRotateComponent(selectedComp.id)}
                    >
                      {t(lang, 'rotatePart')}
                    </button>
                  )}

                  {!selectedComp.locked && (
                    <button
                      type="button"
                      className="inspector-btn danger"
                      onClick={handleDeleteSelected}
                    >
                      {t(lang, 'removePart')}
                    </button>
                  )}
                </>
              );
            })()}

            {selectedWire && (
              <>
                <span className="inspector-label">{t(lang, 'jumperWire')}</span>
                {mode === 'adult' && sim.wireStates[selectedWire.id] && (
                  <span className="inspector-readout">
                    {formatCurrent(sim.wireStates[selectedWire.id].current)}
                  </span>
                )}
                {!selectedWire.locked && (
                  <button
                    type="button"
                    className="inspector-btn danger"
                    onClick={handleDeleteSelected}
                  >
                    {t(lang, 'removeWire')}
                  </button>
                )}
              </>
            )}
          </div>
        )}
      </main>

      {/* Bottom Tactile Parts Dock */}
      <PartsTray
        tray={level.tray}
        usedCounts={usedCounts}
        selectedTemplateId={selectedTemplate?.templateId ?? null}
        wireColor={wireColor}
        isKidMode={mode === 'kid'}
        lang={lang}
        onSelectTemplate={(tpl) => {
          setSelectedTemplate(tpl);
          setSelectedItem(null);
          if (tpl) setMeterMode(false);
        }}
        onSelectWireColor={setWireColor}
      />

      {/* Why? (Show Math) Drawer */}
      {showMath && (
        <MathDrawer
          level={level}
          sim={sim}
          lang={lang}
          isSpeaking={isSpeaking}
          onSpeakText={handleSpeakManual}
          onStopSpeaking={() => narrator.stop()}
          onClose={() => {
            narrator.stop();
            setShowMath(false);
          }}
        />
      )}

      {/* Level / Mission Picker Modal */}
      {showLevels && (
        <LevelModal
          mode={mode}
          lang={lang}
          currentLevelId={level.id}
          levels={activeLevels}
          sandbox={activeSandbox}
          completed={completed}
          onSelectLevel={(lvl) => loadLevel(lvl)}
          onClose={() => setShowLevels(false)}
        />
      )}

      {/* Victory Celebration Modal */}
      {!level.isSandbox && evaluation.solved && !victoryDismissed && (
        <div className="sheet-backdrop centered" role="dialog" aria-modal="true" aria-label={t(lang, 'victoryKidTitle')}>
          <div className="sheet-panel victory-panel">
            <div className="victory-stars" aria-label={`${earnedStars} / 3`}>
              {'★'.repeat(earnedStars)}
              {'☆'.repeat(3 - earnedStars)}
            </div>
            <h2 className="sheet-title" style={{ fontSize: 22, marginBottom: 6 }}>
              {mode === 'kid'
                ? t(lang, 'victoryKidTitle')
                : `${pickText(level.title, lang)} — ${t(lang, 'victoryAdultSuffix')}`}
            </h2>
            <p className="formula-body" style={{ marginBottom: 12 }}>
              {pickText(level.lesson.explanation, lang)}
            </p>
            {mode === 'adult' && (
              <div className="formula-box" style={{ textAlign: 'center' }}>
                {pickText(level.lesson.formula, lang)}
              </div>
            )}
            {narrator.isSupported() && (
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: 8 }}>
                <button
                  type="button"
                  className={`speak-pill-btn ${isSpeaking ? 'speaking' : ''}`}
                  onClick={() =>
                    isSpeaking
                      ? narrator.stop()
                      : handleSpeakManual(pickText(level.lesson.explanation, lang))
                  }
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round">
                    <path d="M11 5L6 9H2v6h4l5 4V5z" />
                    <path d="M15.5 8.5a5 5 0 0 1 0 7" />
                  </svg>
                  <span>{isSpeaking ? t(lang, 'stopSpeaking') : t(lang, 'listen')}</span>
                </button>
              </div>
            )}
            <div className="victory-actions">
              <button
                type="button"
                className="secondary-cta"
                onClick={() => {
                  narrator.stop();
                  setVictoryDismissed(true);
                }}
              >
                {t(lang, 'keepTinkering')}
              </button>
              <button
                type="button"
                className="primary-cta"
                onClick={() => loadLevel(nextLevel)}
              >
                {nextLevel.isSandbox
                  ? t(lang, 'openSandbox')
                  : mode === 'kid'
                  ? t(lang, 'nextMission')
                  : t(lang, 'nextLab')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
