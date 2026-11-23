import React from 'react';
import type { LevelDefinition, SimulationResult } from '../engine/types';

interface MathDrawerProps {
  level: LevelDefinition;
  sim: SimulationResult;
  onClose: () => void;
}

export const MathDrawer: React.FC<MathDrawerProps> = ({ level, sim, onClose }) => {
  return (
    <div className="sheet-backdrop" onClick={onClose} role="dialog" aria-modal="true" aria-label="Circuit explanation and math">
      <div className="sheet-panel" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-header">
          <h2 className="sheet-title">Why? — Live Circuit Math</h2>
          <button type="button" className="close-btn" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        {/* Live Diagnostics from the user's current board */}
        {sim.diagnostics.length > 0 && (
          <div>
            {sim.diagnostics.map((d) => (
              <div key={d.id} className={`formula-card ${d.severity}`}>
                <div className="formula-tag">{d.formulaLabel ?? 'Live Diagnosis'}</div>
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
                    Try this: {d.tip}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Core Principle for this puzzle */}
        <div className="formula-card">
          <div className="formula-tag">Core Principle • {level.conceptTag}</div>
          <strong style={{ fontSize: 15, display: 'block', marginBottom: 4 }}>
            {level.lesson.principle}
          </strong>
          <div className="formula-box">{level.lesson.formula}</div>
          <p className="formula-body">{level.lesson.explanation}</p>
        </div>

        {/* Quick Pocket Cheat Sheet */}
        <div className="formula-card" style={{ marginBottom: 0 }}>
          <div className="formula-tag">Pocket Cheat Sheet</div>
          <p className="formula-body">
            <strong>Voltage (V)</strong> = electrical push • <strong>Current (A / mA)</strong> = flow rate •{' '}
            <strong>Resistance (Ω)</strong> = flow squeeze.
            <br />
            Standard 5mm LEDs glow happiest around <strong>10–25 mA</strong> and pop above <strong>35 mA</strong>.
          </p>
        </div>
      </div>
    </div>
  );
};
