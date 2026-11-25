import React, { useState } from 'react';
import { type Language, pickText, t } from '../core/i18n';
import type { AppMode, LevelDefinition, TierId } from '../engine/types';
import { TIER_METADATA } from '../data/electronicsLevels';
import { stemRegistry } from '../core/stemModule';

interface LevelModalProps {
  mode: AppMode;
  lang: Language;
  currentLevel: LevelDefinition;
  levels: LevelDefinition[];
  sandbox: LevelDefinition;
  completed: Record<string, number>;
  onSelectLevel: (level: LevelDefinition) => void;
  onClose: () => void;
}

export const LevelModal: React.FC<LevelModalProps> = ({
  mode,
  lang,
  currentLevel,
  levels,
  sandbox,
  completed,
  onSelectLevel,
  onClose,
}) => {
  const [activeTier, setActiveTier] = useState<TierId>(currentLevel.isSandbox ? 1 : currentLevel.tier);
  const modules = stemRegistry.list();
  const filteredLevels = levels.filter((l) => l.tier === activeTier);
  const activeMeta = TIER_METADATA.find((m) => m.id === activeTier) ?? TIER_METADATA[0];

  return (
    <div
      className="sheet-backdrop centered"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={mode === 'kid' ? t(lang, 'kidMissionsHeader') : t(lang, 'adultCampaignHeader')}
    >
      <div className="sheet-panel level-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-header">
          <h2 className="sheet-title">
            {mode === 'kid' ? t(lang, 'kidMissionsHeader') : t(lang, 'adultCampaignHeader')}
          </h2>
          <button type="button" className="close-btn" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        {/* Tier 1–4 Chapter Tabs */}
        <div className="tier-tabs" role="tablist">
          {TIER_METADATA.map((tm) => {
            const tierLevels = levels.filter((l) => l.tier === tm.id);
            const doneCount = tierLevels.filter((l) => (completed[l.id] ?? 0) > 0).length;
            return (
              <button
                key={tm.id}
                type="button"
                role="tab"
                aria-selected={activeTier === tm.id}
                className={`tier-tab ${activeTier === tm.id ? 'active' : ''}`}
                style={activeTier === tm.id ? { borderColor: tm.accent, color: tm.accent } : undefined}
                onClick={() => setActiveTier(tm.id)}
              >
                <span className="tier-tab-num">{pickText(tm.shortLabel, lang)}</span>
                <span className="tier-tab-prog">
                  {doneCount}/{tierLevels.length}
                </span>
              </button>
            );
          })}
        </div>

        <div className="tier-heading">
          <span className="tier-dot" style={{ background: activeMeta.accent }} />
          <strong>{pickText(mode === 'kid' ? activeMeta.kidTitle : activeMeta.adultTitle, lang)}</strong>
        </div>

        <div className="level-grid">
          {filteredLevels.map((lvl) => {
            const stars = completed[lvl.id] ?? 0;
            const isCurrent = lvl.id === currentLevel.id;
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
                    {mode === 'kid'
                      ? `${t(lang, 'missionPrefix')}${lvl.order}`
                      : `${t(lang, 'labPrefix')} ${String(lvl.order).padStart(2, '0')}`}
                  </span>
                  <span className="star-row" aria-label={`${stars} / 3`}>
                    {stars > 0 ? '★'.repeat(stars) + '☆'.repeat(3 - stars) : '☆☆☆'}
                  </span>
                </div>
                <div className="level-tile-title">{pickText(lvl.title, lang)}</div>
                <div className="level-tile-tag">{pickText(lvl.conceptTag, lang)}</div>
              </button>
            );
          })}

          {/* Free-Build Sandbox Tile always reachable */}
          <button
            type="button"
            className={`level-tile sandbox-tile ${currentLevel.id === sandbox.id ? 'current' : ''}`}
            onClick={() => {
              onSelectLevel(sandbox);
              onClose();
            }}
          >
            <div className="level-tile-top">
              <span className="level-num">{t(lang, 'sandboxBadge')}</span>
              <span className="star-row">∞</span>
            </div>
            <div className="level-tile-title">{pickText(sandbox.title, lang)}</div>
            <div className="level-tile-tag">{pickText(sandbox.conceptTag, lang)}</div>
          </button>
        </div>

        <div className="module-roadmap">
          <span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--ink-tertiary)' }}>
            {t(lang, 'stemModulesLabel')}
          </span>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {modules.map((m) => (
              <span key={m.id} className={`module-chip ${m.status === 'active' ? 'active' : ''}`}>
                {pickText(m.name, lang)} {m.status === 'coming-soon' ? t(lang, 'nextBadge') : ''}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
