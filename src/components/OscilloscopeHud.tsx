import React, { useMemo } from 'react';
import { type Language, t } from '../core/i18n';
import { formatFrequency } from '../engine/resistorColors';
import type { AcSweepResult, GridCoord, ScopeSample } from '../engine/types';

interface OscilloscopeHudProps {
  lang: Language;
  isKidMode: boolean;
  mode: 'time' | 'bode';
  samples: ScopeSample[];
  bode: AcSweepResult | null;
  acFreq: number | null;
  paused: boolean;
  timeScale: number;
  ch1: GridCoord | null;
  ch2: GridCoord | null;
  activeAssignChannel: 1 | 2 | null;
  onModeChange: (m: 'time' | 'bode') => void;
  onTogglePause: () => void;
  onTimeScaleChange: (scale: number) => void;
  onSelectAssignChannel: (ch: 1 | 2 | null) => void;
  onClose: () => void;
}

function coordLabel(c: GridCoord | null): string {
  if (!c) return '—';
  return `${String.fromCharCode(65 + c.col)}${c.row + 1}`;
}

export const OscilloscopeHud: React.FC<OscilloscopeHudProps> = ({
  lang,
  isKidMode,
  mode,
  samples,
  bode,
  acFreq,
  paused,
  timeScale,
  ch1,
  ch2,
  activeAssignChannel,
  onModeChange,
  onTogglePause,
  onTimeScaleChange,
  onSelectAssignChannel,
  onClose,
}) => {
  const W = 256;
  const H = 114;

  // Compute time-domain polyline strings & Vpp telemetry
  const timeView = useMemo(() => {
    if (samples.length < 2) {
      return { p1: '', p2: '', v1Min: 0, v1Max: 0, v2Min: 0, v2Max: 0, vMaxScale: 10 };
    }
    let absMax = 6;
    let v1Min = 999;
    let v1Max = -999;
    let v2Min = 999;
    let v2Max = -999;

    for (const s of samples) {
      absMax = Math.max(absMax, Math.abs(s.ch1), Math.abs(s.ch2));
      v1Min = Math.min(v1Min, s.ch1);
      v1Max = Math.max(v1Max, s.ch1);
      v2Min = Math.min(v2Min, s.ch2);
      v2Max = Math.max(v2Max, s.ch2);
    }
    const vScale = Math.ceil(absMax / 2) * 2 + 1;
    const midY = H / 2;
    const pxPerV = (H * 0.44) / vScale;

    const toPts = (pick: (s: ScopeSample) => number) =>
      samples
        .map((s, idx) => {
          const x = (idx / Math.max(1, samples.length - 1)) * W;
          const y = Math.max(4, Math.min(H - 4, midY - pick(s) * pxPerV));
          return `${x.toFixed(1)},${y.toFixed(1)}`;
        })
        .join(' ');

    return {
      p1: ch1 ? toPts((s) => s.ch1) : '',
      p2: ch2 ? toPts((s) => s.ch2) : '',
      v1Min,
      v1Max,
      v2Min,
      v2Max,
      vMaxScale: vScale,
    };
  }, [samples, ch1, ch2]);

  // Compute Bode magnitude (dB) and phase (deg) polylines
  const bodeView = useMemo(() => {
    if (!bode || bode.points.length < 2) return null;
    const pts = bode.points;
    const fMin = pts[0].freq;
    const fMax = pts[pts.length - 1].freq;
    const logMin = Math.log10(fMin);
    const logMax = Math.log10(fMax);

    const freqToX = (f: number) =>
      ((Math.log10(Math.max(fMin, Math.min(fMax, f))) - logMin) / Math.max(0.01, logMax - logMin)) * W;
    // Gain range: +6 dB at top to -36 dB at bottom
    const dbToY = (db: number) => {
      const clamped = Math.max(-36, Math.min(6, db));
      return 8 + ((6 - clamped) / 42) * (H - 18);
    };
    const phaseToY = (deg: number) => {
      const clamped = Math.max(-180, Math.min(180, deg));
      return 8 + ((180 - clamped) / 360) * (H - 18);
    };

    const gainLine = pts.map((p) => `${freqToX(p.freq).toFixed(1)},${dbToY(p.gainDb).toFixed(1)}`).join(' ');
    const phaseLine = pts.map((p) => `${freqToX(p.freq).toFixed(1)},${phaseToY(p.phaseDeg).toFixed(1)}`).join(' ');
    const markerFreq = bode.resonantPeakHz ?? bode.cutoffHz;
    const markerX = markerFreq ? freqToX(markerFreq) : null;
    const curX = acFreq ? freqToX(acFreq) : null;

    return { gainLine, phaseLine, markerX, markerFreq, curX, yZero: dbToY(0), yMinus3: dbToY(-3) };
  }, [bode, acFreq]);

  return (
    <aside className={`scope-hud ${isKidMode ? 'kid-scope' : ''}`} aria-label={isKidMode ? t(lang, 'scopeKidHeader') : t(lang, 'scopeHeader')}>
      <div className="scope-top">
        <span className="scope-title">
          {isKidMode ? t(lang, 'scopeKidHeader') : t(lang, 'scopeHeader')}
        </span>

        {!isKidMode && (
          <div className="scope-tabs">
            <button
              type="button"
              className={`scope-tab ${mode === 'time' ? 'active' : ''}`}
              onClick={() => onModeChange('time')}
            >
              {t(lang, 'scopeTimeTab')}
            </button>
            <button
              type="button"
              className={`scope-tab ${mode === 'bode' ? 'active' : ''}`}
              onClick={() => onModeChange('bode')}
            >
              {t(lang, 'scopeBodeTab')}
            </button>
          </div>
        )}

        <button type="button" className="scope-close" onClick={onClose} aria-label="Close">
          ×
        </button>
      </div>

      {/* Phosphor Oscilloscope Screen */}
      <div className="scope-screen">
        {mode === 'time' || isKidMode ? (
          <svg viewBox={`0 0 ${W} ${H}`} className="scope-svg">
            {/* Subtle graticule grid */}
            {[0.25, 0.5, 0.75].map((f) => (
              <line
                key={`h-${f}`}
                x1={0}
                y1={H * f}
                x2={W}
                y2={H * f}
                stroke={f === 0.5 ? 'rgba(130,220,210,0.28)' : 'rgba(130,220,210,0.1)'}
                strokeWidth={f === 0.5 ? 1.1 : 0.8}
                strokeDasharray={f === 0.5 ? undefined : '3 3'}
              />
            ))}
            {[0.2, 0.4, 0.6, 0.8].map((f) => (
              <line
                key={`v-${f}`}
                x1={W * f}
                y1={0}
                x2={W * f}
                y2={H}
                stroke="rgba(130,220,210,0.1)"
                strokeWidth={0.8}
                strokeDasharray="3 3"
              />
            ))}

            {/* 0V label */}
            {!isKidMode && (
              <>
                <text x={4} y={11} fontSize={8.5} fontFamily="var(--font-mono)" fill="rgba(170,225,220,0.65)">
                  +{timeView.vMaxScale}V
                </text>
                <text x={4} y={H / 2 - 2} fontSize={8} fontFamily="var(--font-mono)" fill="rgba(170,225,220,0.5)">
                  0V
                </text>
              </>
            )}

            {/* Ch1 Trace (Warm Amber) */}
            {timeView.p1 && (
              <polyline
                points={timeView.p1}
                fill="none"
                stroke="#F5B841"
                strokeWidth={isKidMode ? 2.8 : 2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {/* Ch2 Trace (Bright Teal) */}
            {timeView.p2 && (
              <polyline
                points={timeView.p2}
                fill="none"
                stroke="#3BE2C8"
                strokeWidth={isKidMode ? 2.8 : 2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}
          </svg>
        ) : bodeView ? (
          <svg viewBox={`0 0 ${W} ${H}`} className="scope-svg">
            {/* 0 dB and -3 dB guide lines */}
            <line x1={0} y1={bodeView.yZero} x2={W} y2={bodeView.yZero} stroke="rgba(170,225,220,0.25)" strokeWidth={0.9} />
            <line x1={0} y1={bodeView.yMinus3} x2={W} y2={bodeView.yMinus3} stroke="rgba(245,184,65,0.35)" strokeWidth={0.9} strokeDasharray="3 3" />

            {/* Live AC frequency cursor */}
            {bodeView.curX !== null && (
              <line x1={bodeView.curX} y1={0} x2={bodeView.curX} y2={H} stroke="rgba(255,255,255,0.3)" strokeWidth={1.1} strokeDasharray="2 2" />
            )}

            {/* Cutoff / Resonant peak marker */}
            {bodeView.markerX !== null && (
              <line x1={bodeView.markerX} y1={0} x2={bodeView.markerX} y2={H} stroke="#F5B841" strokeWidth={1.3} strokeDasharray="4 3" />
            )}

            {/* Phase trace (dashed violet-blue) */}
            <polyline points={bodeView.phaseLine} fill="none" stroke="#85B8FF" strokeWidth={1.3} strokeDasharray="4 3" opacity={0.8} />

            {/* Gain (dB) trace (bright teal) */}
            <polyline points={bodeView.gainLine} fill="none" stroke="#3BE2C8" strokeWidth={2.2} strokeLinejoin="round" />

            <text x={4} y={11} fontSize={8} fontFamily="var(--font-mono)" fill="#3BE2C8">
              0 dB
            </text>
            <text x={4} y={H - 4} fontSize={8} fontFamily="var(--font-mono)" fill="rgba(170,225,220,0.6)">
              1Hz
            </text>
            <text x={W - 26} y={H - 4} fontSize={8} fontFamily="var(--font-mono)" fill="rgba(170,225,220,0.6)">
              2kHz
            </text>
            {bodeView.markerFreq && (
              <text
                x={Math.min(W - 66, Math.max(28, (bodeView.markerX ?? 100) + 4))}
                y={22}
                fontSize={8.5}
                fontFamily="var(--font-mono)"
                fontWeight={700}
                fill="#F5B841"
              >
                {bode?.resonantPeakHz ? `f₀=${formatFrequency(bodeView.markerFreq)}` : `fc=${formatFrequency(bodeView.markerFreq)}`}
              </text>
            )}
          </svg>
        ) : (
          <div className="scope-empty">{t(lang, 'scopeNoAc')}</div>
        )}
      </div>

      {/* Controls & Readout Footer */}
      {!isKidMode && (
        <div className="scope-footer">
          <div className="scope-probes">
            <button
              type="button"
              className={`scope-probe-btn ch1 ${activeAssignChannel === 1 ? 'assigning' : ''}`}
              onClick={() => onSelectAssignChannel(activeAssignChannel === 1 ? null : 1)}
              title={`${t(lang, 'scopeTapProbe')} CH1`}
            >
              CH1: {coordLabel(ch1)}
            </button>
            <button
              type="button"
              className={`scope-probe-btn ch2 ${activeAssignChannel === 2 ? 'assigning' : ''}`}
              onClick={() => onSelectAssignChannel(activeAssignChannel === 2 ? null : 2)}
              title={`${t(lang, 'scopeTapProbe')} CH2`}
            >
              CH2: {coordLabel(ch2)}
            </button>
          </div>

          {mode === 'time' ? (
            <div className="scope-meta-row">
              <span className="scope-stat">
                {ch1 ? `1:${(timeView.v1Max - timeView.v1Min).toFixed(1)}Vpp` : ''}
                {ch2 ? `  2:${(timeView.v2Max - timeView.v2Min).toFixed(1)}Vpp` : ''}
              </span>
              <div style={{ display: 'flex', gap: 4 }}>
                <button
                  type="button"
                  className="scope-mini-btn"
                  onClick={() => onTimeScaleChange(timeScale >= 0.5 ? 0.1 : 1)}
                  title="Toggle time scale"
                >
                  {timeScale >= 0.5 ? '1×' : '0.1×'}
                </button>
                <button
                  type="button"
                  className={`scope-mini-btn ${paused ? 'paused' : ''}`}
                  onClick={onTogglePause}
                >
                  {paused ? t(lang, 'scopeRun') : t(lang, 'scopePause')}
                </button>
              </div>
            </div>
          ) : (
            bode && (
              <div className="scope-meta-row">
                <span className="scope-stat">
                  {bode.resonantPeakHz
                    ? `${t(lang, 'scopeResonance')}: ${formatFrequency(bode.resonantPeakHz)}`
                    : bode.cutoffHz
                    ? `${t(lang, 'scopeCutoff')}: ${formatFrequency(bode.cutoffHz)}`
                    : `Gain: ${bode.gainAtCurrentFreqDb.toFixed(1)} dB`}
                </span>
                <span className="scope-stat" style={{ color: '#85B8FF' }}>
                  φ: {bode.phaseAtCurrentFreqDeg.toFixed(0)}°
                </span>
              </div>
            )
          )}
        </div>
      )}
    </aside>
  );
};
