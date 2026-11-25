import React from 'react';
import { type Language, t } from '../core/i18n';
import type { EnvironmentState } from '../engine/types';

interface EnvironmentControlsProps {
  hasLdr: boolean;
  hasThermistor: boolean;
  env: EnvironmentState;
  lang: Language;
  isKidMode: boolean;
  onChange: (next: EnvironmentState) => void;
}

export const EnvironmentControls: React.FC<EnvironmentControlsProps> = ({
  hasLdr,
  hasThermistor,
  env,
  lang,
  isKidMode,
  onChange,
}) => {
  if (!hasLdr && !hasThermistor) return null;

  return (
    <div className="env-controls" role="region" aria-label={lang === 'pl' ? 'Warunki otoczenia' : 'Environment sensors'}>
      {hasLdr && (
        <label className="env-slider-pill">
          <span className="env-end-label" title={t(lang, 'envNight')}>
            🌙 {!isKidMode && <span>{t(lang, 'envNight')}</span>}
          </span>
          <input
            type="range"
            className="env-range light-range"
            min={0}
            max={1}
            step={0.02}
            value={env.lightLevel}
            onChange={(e) => onChange({ ...env, lightLevel: Number(e.target.value) })}
          />
          <span className="env-end-label" title={t(lang, 'envSun')}>
            ☀️ {!isKidMode && <span>{t(lang, 'envSun')}</span>}
          </span>
          {!isKidMode && (
            <span className="env-val">{Math.round(env.lightLevel * 100)}%</span>
          )}
        </label>
      )}

      {hasThermistor && (
        <label className="env-slider-pill">
          <span className="env-end-label" title={t(lang, 'envCold')}>
            ❄️ {!isKidMode && <span>{t(lang, 'envCold')}</span>}
          </span>
          <input
            type="range"
            className="env-range temp-range"
            min={0}
            max={1}
            step={0.02}
            value={env.temperature}
            onChange={(e) => onChange({ ...env, temperature: Number(e.target.value) })}
          />
          <span className="env-end-label" title={t(lang, 'envHot')}>
            🔥 {!isKidMode && <span>{t(lang, 'envHot')}</span>}
          </span>
          {!isKidMode && (
            <span className="env-val">{Math.round(env.temperature * 100)}°C</span>
          )}
        </label>
      )}
    </div>
  );
};
