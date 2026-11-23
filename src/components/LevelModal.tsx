import React from 'react';
import type { AppMode, LevelDefinition } from '../engine/types';
import { stemRegistry } from '../core/stemModule';

interface LevelModalProps {
  mode: AppMode;
  currentLevelId: string;
  levels: LevelDefinition[];
  sandbox: LevelDefinition;
  completed: Record<string, number>;
  onSelectLevel: (level: LevelDefinition) => void;
  onClose: () => void;
}

export const LevelModal: React.FC<LevelModalProps> = ({
  mode,
  currentLevelId,
  levels,
  sandbox,
  completed,
  onSelectLevel,
  onClose,
}) => {
  const modules = stemRegistry.list();

  return (
    <div className="sheet-backdrop centered" onClick={onClose} role="dialog" aria-modal="true" aria-label="Select level">
      <div className="sheet-panel" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-header">
          <h2 className="sheet-title">
            {mode === 'kid' ? 'Little Inventor Missions' : 'Practical DC Lab — Campaign'}
          </h2>
          <button type="button" className="close-btn" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        <div className="level-grid">
          {levels.map((lvl) => {
            const stars = completed[lvl.id] ?? 0;
            const isCurrent = lvl.id === currentLevelId;
            return (
              <button
                key={lvl.id}
                type="button"
                className={`level-tile ${isCurrent ? 'current' : ''}`}
                onClick={() => {
                  onSelectLevel(lvl);
                  onClose();
                }}
              >
                <div className="level-tile-top">
                  <span className="level-num">
                    {mode === 'kid' ? `M${lvl.order}` : `LAB ${String(lvl.order).padStart(2, '0')}`}
                  </span>
                  <span className="star-row" aria-label={`${stars} of 3 stars`}>
                    {stars > 0 ? '★'.repeat(stars) + '☆'.repeat(3 - stars) : '☆☆☆'}
                  </span>
                </div>
                <div className="level-tile-title">{lvl.title}</div>
                <div className="level-tile-tag">{lvl.conceptTag}</div>
              </button>
            );
          })}

          {/* Free-Build Sandbox Tile */}
          <button
            type="button"
            className={`level-tile ${currentLevelId === sandbox.id ? 'current' : ''}`}
            onClick={() => {
              onSelectLevel(sandbox);
              onClose();
            }}
          >
            <div className="level-tile-top">
              <span className="level-num">SANDBOX</span>
              <span className="star-row">∞</span>
            </div>
            <div className="level-tile-title">{sandbox.title}</div>
            <div className="level-tile-tag">{sandbox.conceptTag}</div>
          </button>
        </div>

        {/* Modular STEM Platform Strip */}
        <div className="module-roadmap">
          <span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--ink-tertiary)' }}>
            STEM Modules:
          </span>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {modules.map((m) => (
              <span key={m.id} className={`module-chip ${m.status === 'active' ? 'active' : ''}`}>
                {m.name} {m.status === 'coming-soon' ? '• Next' : ''}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
