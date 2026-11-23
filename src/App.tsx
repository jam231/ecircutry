import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  type AppMode,
  type CircuitBoardState,
  type CircuitComponent,
  type GridCoord,
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

export function App() {
  const initialProgress = useMemo(() => loadProgress(), []);
  const [mode, setMode] = useState<AppMode>(initialProgress.mode);
  const [muted, setMuted] = useState<boolean>(initialProgress.muted);
  const [completed, setCompleted] = useState<Record<string, number>>(initialProgress.completed);

  const activeLevels = mode === 'kid' ? KID_MISSIONS : ADULT_LEVELS;
  const activeSandbox = mode === 'kid' ? KID_SANDBOX : ADULT_SANDBOX;

  const [level, setLevel] = useState<LevelDefinition>(() =>
    initialProgress.mode === 'kid' ? KID_MISSIONS[0] : ADULT_LEVELS[0]
  );
  const [board, setBoard] = useState<CircuitBoardState>(() =>
    createInitialBoard(initialProgress.mode === 'kid' ? KID_MISSIONS[0] : ADULT_LEVELS[0])
  );
  // Track which tray template produced each user-placed component id so limits stay exact
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

  // Smooth spinning animation angles for active DC motors
  const [fanAngles, setFanAngles] = useState<Record<string, number>>({});
  const solvedForLevelRef = useRef<string | null>(null);
  const shortSoundCooldownRef = useRef<number>(0);

  // Sync mute & persistence
  useEffect(() => {
    soundEngine.setMuted(muted);
    saveProgress({ mode, muted, completed });
  }, [mode, muted, completed]);

  const loadLevel = useCallback((nextLvl: LevelDefinition) => {
    setLevel(nextLvl);
    setBoard(createInitialBoard(nextLvl));
    setComponentTemplateMap({});
    setHistory({ flags: {}, burnoutCount: 0 });
    setSelectedTemplate(null);
    setSelectedItem(null);
    setProbeTarget(null);
    setVictoryDismissed(false);
    solvedForLevelRef.current = null;
  }, []);

  const switchMode = (nextMode: AppMode) => {
    if (nextMode === mode) return;
    setMode(nextMode);
    const nextList = nextMode === 'kid' ? KID_MISSIONS : ADULT_LEVELS;
    if (nextMode === 'kid') {
      setMeterMode(false);
      setProbeTarget(null);
    }
    loadLevel(nextList[0]);
  };

  // Real-time MNA DC circuit solve
  const sim = useMemo(() => solveCircuit(board), [board]);

  // Evaluate level goals
  const evaluation = useMemo(() => level.evaluate(board, sim, history), [level, board, sim, history]);

  // Continuous voltage-reactive Web Audio (motor whirr + piezo buzzer)
  useEffect(() => {
    let maxMotor = 0;
    let maxBuzzer = 0;
    for (const comp of board.components) {
      const t = sim.componentStates[comp.id];
      if (!t || !t.active || comp.burnedOut) continue;
      if (comp.kind === 'motor') {
        maxMotor = Math.max(maxMotor, Math.abs(t.motorSpeed));
      } else if (comp.kind === 'buzzer') {
        maxBuzzer = Math.max(maxBuzzer, t.intensity);
      }
    }
    soundEngine.updateContinuousLoads(maxMotor, maxBuzzer);

    if (sim.shortCircuit) {
      const now = Date.now();
      if (now - shortSoundCooldownRef.current > 1200) {
        shortSoundCooldownRef.current = now;
        soundEngine.playShortSpark();
      }
    }
  }, [board.components, sim]);

  // Clean up continuous audio on unmount
  useEffect(() => () => soundEngine.silenceContinuousLoads(), []);

  // Thermal burnout timer: overloaded LED flashes bright then pops cleanly after 450ms
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
    }, 440);

    return () => window.clearTimeout(timer);
  }, [board.components, sim.componentStates, mode]);

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

  // Celebrate puzzle solve & save star rating
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
  }, [evaluation.solved, level, board.components.length, board.wires.length, history.burnoutCount, mode]);

  // Count used tray items
  const usedCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const comp of board.components) {
      const tid = componentTemplateMap[comp.id];
      if (tid) counts[tid] = (counts[tid] ?? 0) + 1;
    }
    return counts;
  }, [board.components, componentTemplateMap]);

  // Helper: in Kid Mode, editing the board gently heals any popped LEDs so kids never get stuck
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
      // Auto-return to wire tool if that part's inventory ran out
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
    // Try rotating 90 degrees around terminal A
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
            aria-label="Open level selector"
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
              <span className="brand-sub">DC Electronics Lab</span>
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
              <span>Adult Lab</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'kid'}
              className={`mode-btn ${mode === 'kid' ? 'active kid-active' : ''}`}
              onClick={() => switchMode('kid')}
            >
              <span>Kid Mode</span>
            </button>
          </div>
        </div>

        <div className="top-actions">
          {/* X-Ray Current Flow Overlay Toggle */}
          <button
            type="button"
            className={`icon-btn ${xrayMode ? 'active-xray' : ''}`}
            onClick={() => {
              soundEngine.playSwitchClick(!xrayMode);
              setXrayMode((v) => !v);
            }}
            title="Toggle X-Ray live current flow & node voltages"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z" />
            </svg>
            <span className="btn-text">X-Ray</span>
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
              title="Tap any part or socket to measure Voltage, Current & Power"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <rect x="4" y="3" width="16" height="18" rx="3" />
                <path d="M8 7h8v4H8z" />
                <circle cx="12" cy="15.5" r="2" />
              </svg>
              <span className="btn-text">Meter</span>
            </button>
          )}

          {/* Why? (Show Math) Drawer */}
          {mode === 'adult' && (
            <button
              type="button"
              className={`icon-btn btn-why ${topDiagnostic?.severity === 'danger' ? 'pulse-alert' : ''}`}
              onClick={() => setShowMath(true)}
              title="See live Ohm's Law math and diagnosis"
            >
              <span className="btn-text">Why?</span>
            </button>
          )}

          {/* Reset Level */}
          <button
            type="button"
            className="icon-btn"
            onClick={() => {
              soundEngine.playUnplug();
              loadLevel(level);
            }}
            title="Reset breadboard"
            aria-label="Reset breadboard"
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
            title={muted ? 'Unmute sound effects' : 'Mute sound effects'}
            aria-label={muted ? 'Unmute sound effects' : 'Mute sound effects'}
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
      <section className="mission-strip" aria-label="Current mission">
        <div className="mission-meta">
          <button
            type="button"
            className="level-picker-trigger"
            onClick={() => setShowLevels(true)}
            title="Switch puzzle or open sandbox"
          >
            <span>
              {level.isSandbox
                ? 'SANDBOX'
                : mode === 'kid'
                ? `M${level.order}`
                : `LAB ${String(level.order).padStart(2, '0')}`}
            </span>
            <span aria-hidden="true">▾</span>
          </button>

          <div className="mission-copy">
            <div className="mission-title-row">
              <h2 className="mission-title">{level.title}</h2>
            </div>
            {mode === 'adult' && <p className="mission-subtitle">{level.subtitle}</p>}
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
        {/* Live Diagnosis Toast when an error occurs */}
        {topDiagnostic && (topDiagnostic.severity === 'danger' || topDiagnostic.severity === 'warn') && (
          <div className={`status-banner ${topDiagnostic.severity}`} role="status">
            <span>
              {mode === 'kid'
                ? hasBurnedLed
                  ? 'Poof! Too much power! Add a Helper piece!'
                  : topDiagnostic.severity === 'danger'
                  ? 'Oops! Sparks! Try moving a wire.'
                  : 'Flip the light around!'
                : topDiagnostic.title}
            </span>
            {hasBurnedLed && (
              <button type="button" className="status-banner-action" onClick={handleHealAll}>
                {mode === 'kid' ? 'Fix Light ✨' : 'Replace LED'}
              </button>
            )}
            {mode === 'adult' && (
              <button
                type="button"
                className="status-banner-action"
                onClick={() => setShowMath(true)}
              >
                Why?
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
              const t = sim.componentStates[selectedComp.id];
              return (
                <>
                  <span className="inspector-label">
                    {selectedComp.kind === 'rheostat'
                      ? `Dimmer (${formatOhms(selectedComp.resistance ?? 330)})`
                      : selectedComp.kind === 'resistor'
                      ? `Resistor (${formatOhms(selectedComp.resistance ?? 220)})`
                      : selectedComp.kind === 'battery'
                      ? `${selectedComp.voltage ?? 3}V Battery`
                      : selectedComp.kind === 'led'
                      ? `${(selectedComp.ledColor ?? 'red').toUpperCase()} LED`
                      : selectedComp.kind === 'motor'
                      ? 'DC Fan'
                      : selectedComp.kind === 'buzzer'
                      ? 'Piezo Buzzer'
                      : selectedComp.kind === 'switch_push'
                      ? 'Push Button'
                      : 'Toggle Switch'}
                  </span>

                  {mode === 'adult' && t && (
                    <span className="inspector-readout">
                      {formatVoltage(Math.abs(t.voltageDrop))} • {formatCurrent(t.current)}
                    </span>
                  )}

                  {/* Live Resistance Slider for Rheostat / Dimmer */}
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
                      {mode === 'kid' ? 'Fix ✨' : 'Replace'}
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
                      ⇄ Flip +/−
                    </button>
                  )}

                  {!selectedComp.locked && (
                    <button
                      type="button"
                      className="inspector-btn"
                      onClick={() => handleRotateComponent(selectedComp.id)}
                    >
                      ↻ Rotate
                    </button>
                  )}

                  {!selectedComp.locked && (
                    <button
                      type="button"
                      className="inspector-btn danger"
                      onClick={handleDeleteSelected}
                    >
                      Remove
                    </button>
                  )}
                </>
              );
            })()}

            {selectedWire && (
              <>
                <span className="inspector-label">Jumper Wire</span>
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
                    Remove Wire
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
        onSelectTemplate={(tpl) => {
          setSelectedTemplate(tpl);
          setSelectedItem(null);
          if (tpl) setMeterMode(false);
        }}
        onSelectWireColor={setWireColor}
      />

      {/* Why? (Show Math) Drawer */}
      {showMath && <MathDrawer level={level} sim={sim} onClose={() => setShowMath(false)} />}

      {/* Level / Mission Picker Modal */}
      {showLevels && (
        <LevelModal
          mode={mode}
          currentLevelId={level.id}
          levels={activeLevels}
          sandbox={activeSandbox}
          completed={completed}
          onSelectLevel={loadLevel}
          onClose={() => setShowLevels(false)}
        />
      )}

      {/* Victory Celebration Modal */}
      {!level.isSandbox && evaluation.solved && !victoryDismissed && (
        <div className="sheet-backdrop centered" role="dialog" aria-modal="true" aria-label="Level complete">
          <div className="sheet-panel victory-panel">
            <div className="victory-stars" aria-label={`${earnedStars} stars`}>
              {'★'.repeat(earnedStars)}
              {'☆'.repeat(3 - earnedStars)}
            </div>
            <h2 className="sheet-title" style={{ fontSize: 22, marginBottom: 6 }}>
              {mode === 'kid' ? 'Awesome Invention!' : `${level.title} — Solved!`}
            </h2>
            <p className="formula-body" style={{ marginBottom: 12 }}>
              {level.lesson.explanation}
            </p>
            {mode === 'adult' && (
              <div className="formula-box" style={{ textAlign: 'center' }}>
                {level.lesson.formula}
              </div>
            )}
            <div className="victory-actions">
              <button
                type="button"
                className="secondary-cta"
                onClick={() => setVictoryDismissed(true)}
              >
                Keep Tinkering
              </button>
              <button
                type="button"
                className="primary-cta"
                onClick={() => loadLevel(nextLevel)}
              >
                {nextLevel.isSandbox ? 'Open Free Sandbox →' : mode === 'kid' ? 'Next Mission →' : 'Next Lab →'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
