import React from 'react';
import type { CircuitComponent, TrayItemTemplate, WireColor } from '../engine/types';
import { ComponentArt, ComponentSvgDefs } from './ComponentArt';

interface PartsTrayProps {
  tray: TrayItemTemplate[];
  usedCounts: Record<string, number>;
  selectedTemplateId: string | null;
  wireColor: WireColor;
  isKidMode: boolean;
  onSelectTemplate: (template: TrayItemTemplate | null) => void;
  onSelectWireColor: (color: WireColor) => void;
}

const WIRE_SWATCHES: { color: WireColor; hex: string; label: string }[] = [
  { color: 'red', hex: '#D94436', label: 'Red wire' },
  { color: 'black', hex: '#2C333B', label: 'Black wire' },
  { color: 'blue', hex: '#2D72C8', label: 'Blue wire' },
  { color: 'amber', hex: '#E09A1F', label: 'Yellow wire' },
  { color: 'green', hex: '#2A9158', label: 'Green wire' },
];

function previewComponent(t: TrayItemTemplate): CircuitComponent {
  return {
    id: `mini-${t.templateId}`,
    kind: t.kind,
    a: { col: 0, row: 0 },
    b: { col: 1, row: 0 },
    voltage: t.voltage,
    resistance: t.resistance,
    rheostatMin: t.rheostatMin,
    rheostatMax: t.rheostatMax,
    ledColor: t.ledColor,
    closed: false,
  };
}

export const PartsTray: React.FC<PartsTrayProps> = ({
  tray,
  usedCounts,
  selectedTemplateId,
  wireColor,
  isKidMode,
  onSelectTemplate,
  onSelectWireColor,
}) => {
  const isWireMode = selectedTemplateId === null;

  return (
    <footer className="parts-dock" aria-label="Circuit parts tray">
      <div className="dock-row">
        {/* Jumper Wire Tool & Color Swatches */}
        <div className="wire-tool-group">
          <button
            type="button"
            className={`wire-tool-btn ${isWireMode ? 'active' : ''}`}
            onClick={() => onSelectTemplate(null)}
            title="Drag between any two sockets to snap a jumper wire"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
              <path d="M4 17C8 7 16 7 20 17" />
              <circle cx="4" cy="17" r="2.2" fill="currentColor" />
              <circle cx="20" cy="17" r="2.2" fill="currentColor" />
            </svg>
            <span>{isKidMode ? 'Wire' : 'Wire'}</span>
          </button>

          {WIRE_SWATCHES.map((s) => (
            <button
              key={s.color}
              type="button"
              className={`wire-swatch ${wireColor === s.color && isWireMode ? 'selected' : ''}`}
              style={{ background: s.hex }}
              aria-label={s.label}
              onClick={() => {
                onSelectWireColor(s.color);
                onSelectTemplate(null);
              }}
            />
          ))}
        </div>

        {tray.length > 0 && <div className="dock-divider" />}

        {/* Available Component Parts */}
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
              title={item.name}
            >
              <span className="part-count-badge">
                {remaining === null ? '∞' : `×${remaining}`}
              </span>
              <svg width="64" height="34" viewBox="-46 -26 92 52" aria-hidden="true">
                <ComponentSvgDefs />
                <ComponentArt
                  component={previewComponent(item)}
                  length={76}
                  fanAngle={20}
                  isKidMode={isKidMode}
                  isMini
                />
              </svg>
              <span className="part-card-label">
                {isKidMode && item.kind === 'resistor' ? 'Helper' : item.shortLabel}
              </span>
            </button>
          );
        })}

        {tray.length === 0 && (
          <span className="tray-hint-text">
            {isKidMode
              ? 'Drag from one hole to another to plug in a wire!'
              : 'Swipe between any two sockets to snap a jumper wire.'}
          </span>
        )}
      </div>
    </footer>
  );
};
