import React from 'react';
import { type Language, pickText, t } from '../core/i18n';
import type { LevelDefinition, SimulationResult } from '../engine/types';

interface MathDrawerProps {
  level: LevelDefinition;
  sim: SimulationResult;
  lang: Language;
  isSpeaking: boolean;
  onSpeakText: (text: string) => void;
  onStopSpeaking: () => void;
  onClose: () => void;
}

export const MathDrawer: React.FC<MathDrawerProps> = ({
  level,
  sim,
  lang,
  isSpeaking,
  onSpeakText,
  onStopSpeaking,
  onClose,
}) => {
  const buildNarration = (): string => {
    const parts: string[] = [];
    if (sim.diagnostics.length > 0) {
      const top = sim.diagnostics[0];
      parts.push(`${top.title}. ${top.summary}`);
      if (top.tip) parts.push(top.tip);
    }
    parts.push(`${pickText(level.lesson.principle, lang)}. ${pickText(level.lesson.explanation, lang)}`);
    return parts.join(' ');
  };

  return (
    <div className="sheet-backdrop" onClick={onClose} role="dialog" aria-modal="true" aria-label={t(lang, 'mathTitle')}>
      <div className="sheet-panel" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-header">
          <h2 className="sheet-title">{t(lang, 'mathTitle')}</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              type="button"
              className={`speak-pill-btn ${isSpeaking ? 'speaking' : ''}`}
              onClick={() => (isSpeaking ? onStopSpeaking() : onSpeakText(buildNarration()))}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round">
                <path d="M11 5L6 9H2v6h4l5 4V5z" />
                <path d="M15.5 8.5a5 5 0 0 1 0 7" />
              </svg>
              <span>{isSpeaking ? t(lang, 'stopSpeaking') : t(lang, 'listen')}</span>
            </button>
            <button type="button" className="close-btn" onClick={onClose} aria-label="Close">
              ×
            </button>
          </div>
        </div>

        {/* Live Diagnostics from the user's current board */}
        {sim.diagnostics.length > 0 && (
          <div>
            {sim.diagnostics.map((d) => (
              <div key={d.id} className={`formula-card ${d.severity}`}>
                <div className="formula-tag">{d.formulaLabel ?? t(lang, 'liveDiagnosis')}</div>
                <strong style={{ fontSize: 15, display: 'block', marginBottom: 4 }}>{d.title}</strong>
                <p className="formula-body">{d.summary}</p>
                {d.formulaEquation && (
                  <div className="formula-box">
                    <div>{d.formulaEquation}</div>
                    {d.formulaPluggedIn && (
                      <span className="formula-plugged">{d.formulaPluggedIn}</span>
                    )}
                  </div>
                )}
                {d.tip && (
                  <p className="formula-body" style={{ fontWeight: 700, color: 'var(--ink-primary)' }}>
                    {t(lang, 'tryThis')} {d.tip}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Core Principle for this puzzle */}
        <div className="formula-card">
          <div className="formula-tag">
            {t(lang, 'corePrinciple')} • {pickText(level.conceptTag, lang)}
          </div>
          <strong style={{ fontSize: 15, display: 'block', marginBottom: 4 }}>
            {pickText(level.lesson.principle, lang)}
          </strong>
          <div className="formula-box">{pickText(level.lesson.formula, lang)}</div>
          <p className="formula-body">{pickText(level.lesson.explanation, lang)}</p>
        </div>

        {/* Quick Pocket Cheat Sheet */}
        <div className="formula-card" style={{ marginBottom: 0 }}>
          <div className="formula-tag">{t(lang, 'cheatSheetTag')}</div>
          <p className="formula-body">
            {t(lang, 'cheatSheetLine1')}
            <br />
            {t(lang, 'cheatSheetLine2')}
          </p>
        </div>
      </div>
    </div>
  );
};
