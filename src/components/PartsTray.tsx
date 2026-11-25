import React from 'react';
import { type Language, pickText, t } from '../core/i18n';
import type { CircuitComponent, TrayItemTemplate, WireColor } from '../engine/types';
import { ComponentArt, ComponentSvgDefs } from './ComponentArt';

interface PartsTrayProps {
  tray: TrayItemTemplate[];
  usedCounts: Record<string, number>;
  selectedTemplateId: string | null;
  wireColor: WireColor;
  isKidMode: boolean;
  lang: Language;
  onSelectTemplate: (template: TrayItemTemplate | null) => void;
  onSelectWireColor: (color: WireColor) => void;
}

const WIRE_SWATCHES: { color: WireColor; hex: string; label: Record<Language, string> }[] = [
  { color: 'red', hex: '#D94436', label: { en: 'Red wire', pl: 'Czerwony przewód' } },
  { color: 'black', hex: '#2C333B', label: { en: 'Black wire', pl: 'Czarny przewód' } },
  { color: 'blue', hex: '#2D72C8', label: { en: 'Blue wire', pl: 'Niebieski przewód' } },
  { color: 'amber', hex: '#E09A1F', label: { en: 'Yellow wire', pl: 'Żółty przewód' } },
  { color: 'green', hex: '#2A9158', label: { en: 'Green wire', pl: 'Zielony przewód' } },
];

function previewComponent(tItem: TrayItemTemplate): CircuitComponent {
  return {
    id: `mini-${tItem.templateId}`,
    kind: tItem.kind,
    a: { col: 0, row: 0 },
    b: { col: 1, row: 0 },
    voltage: tItem.voltage,
    resistance: tItem.resistance,
    maxPower: tItem.maxPower,
    rheostatMin: tItem.rheostatMin,
    rheostatMax: tItem.rheostatMax,
    ledColor: tItem.ledColor,
    capacitance: tItem.capacitance,
    inductance: tItem.inductance,
    waveform: tItem.waveform,
    frequency: tItem.frequency,
    amplitude: tItem.amplitude,
    closed: false,
  };
}

export const PartsTray: React.FC<PartsTrayProps> = ({
  tray,
  usedCounts,
  selectedTemplateId,
  wireColor,
  isKidMode,
  lang,
  onSelectTemplate,
  onSelectWireColor,
}) => {
  const isWireMode = selectedTemplateId === null;

  return (
    <footer className="parts-dock" aria-label={lang === 'pl' ? 'Zasobnik części' : 'Circuit parts tray'}>
      <div className="dock-row">
        <div className="wire-tool-group">
          <button
            type="button"
            className={`wire-tool-btn ${isWireMode ? 'active' : ''}`}
            onClick={() => onSelectTemplate(null)}
            title={t(lang, 'wireDragTitle')}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
              <path d="M4 17C8 7 16 7 20 17" />
              <circle cx="4" cy="17" r="2.2" fill="currentColor" />
              <circle cx="20" cy="17" r="2.2" fill="currentColor" />
            </svg>
            <span>{t(lang, 'wireTool')}</span>
          </button>

          {WIRE_SWATCHES.map((s) => (
            <button
              key={s.color}
              type="button"
              className={`wire-swatch ${wireColor === s.color && isWireMode ? 'selected' : ''}`}
              style={{ background: s.hex }}
              aria-label={s.label[lang]}
              onClick={() => {
                onSelectWireColor(s.color);
                onSelectTemplate(null);
              }}
            />
          ))}
        </div>

        {tray.length > 0 && <div className="dock-divider" />}

        {tray.map((item) => {
          const used = usedCounts[item.templateId] ?? 0;
          const remaining = item.limit === null ? null : Math.max(0, item.limit - used);
          const depleted = remaining === 0;
          const selected = selectedTemplateId === item.templateId;

          return (
            <button
              key={item.templateId}
              type="button"
              className={`part-card ${selected ? 'selected' : ''}`}
              disabled={depleted}
              onClick={() => onSelectTemplate(selected ? null : item)}
              title={pickText(item.name, lang)}
            >
              <span className="part-count-badge">
                {remaining === null ? '∞' : `×${remaining}`}
              </span>
              <svg width="66" height="34" viewBox="-46 -26 92 52" aria-hidden="true">
                <ComponentSvgDefs />
                <ComponentArt
                  component={previewComponent(item)}
                  length={76}
                  fanAngle={20}
                  isKidMode={isKidMode}
                  lang={lang}
                  isMini
                />
              </svg>
              <span className="part-card-label">
                {pickText(item.shortLabel, lang)}
              </span>
            </button>
          );
        })}

        {tray.length === 0 && (
          <span className="tray-hint-text">
            {isKidMode ? t(lang, 'wireHintKid') : t(lang, 'wireHintAdult')}
          </span>
        )}
      </div>
    </footer>
  );
};
