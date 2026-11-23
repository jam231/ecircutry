import React from 'react';
import type { CircuitComponent, ComponentTelemetry, LedColor } from '../engine/types';
import { formatOhms, getResistorBands } from '../engine/resistorColors';

interface ComponentArtProps {
  component: CircuitComponent;
  telemetry?: ComponentTelemetry;
  /** Length between terminal A and terminal B in SVG units */
  length: number;
  /** Animated fan blade rotation angle in degrees */
  fanAngle: number;
  isKidMode: boolean;
  isSelected?: boolean;
  /** Render compact preview for bottom parts tray */
  isMini?: boolean;
}

const LED_PALETTE: Record<
  LedColor,
  { off: string; body: string; lit: string; glow: string; core: string }
> = {
  red: { off: '#A63A38', body: '#D93B32', lit: '#FF5B4D', glow: '#FF4133', core: '#FFF0E6' },
  green: { off: '#2D7D4E', body: '#27A35B', lit: '#48E082', glow: '#29D96C', core: '#ECFFF2' },
  amber: { off: '#B8781C', body: '#E59A1F', lit: '#FFC845', glow: '#FFB81F', core: '#FFFBE6' },
  blue: { off: '#2C5C9E', body: '#2E77D0', lit: '#59B4FF', glow: '#369EFF', core: '#EDF8FF' },
};

/**
 * Renders realistic, tactile vector hardware for any component centered at (0,0),
 * with terminal A at (-length/2, 0) and terminal B at (+length/2, 0).
 */
export const ComponentArt: React.FC<ComponentArtProps> = ({
  component,
  telemetry,
  length,
  fanAngle,
  isKidMode,
  isSelected,
  isMini = false,
}) => {
  const half = length / 2;
  const active = Boolean(telemetry?.active && !component.burnedOut);
  const overloaded = Boolean(telemetry?.overloaded || component.burnedOut);

  // Common metallic tin-plated leads extending from body to sockets at ±half
  const renderLeads = (bodyHalfW: number, showPolarity?: boolean) => (
    <g>
      {/* Shadow under leads */}
      <line
        x1={-half}
        y1={2.5}
        x2={-bodyHalfW}
        y2={2.5}
        stroke="rgba(25,30,36,0.22)"
        strokeWidth={4.5}
        strokeLinecap="round"
      />
      <line
        x1={bodyHalfW}
        y1={2.5}
        x2={half}
        y2={2.5}
        stroke="rgba(25,30,36,0.22)"
        strokeWidth={4.5}
        strokeLinecap="round"
      />
      {/* Metallic tin-plated wire */}
      <line
        x1={-half}
        y1={0}
        x2={-bodyHalfW}
        y2={0}
        stroke="url(#metalLeadGrad)"
        strokeWidth={4.2}
        strokeLinecap="round"
      />
      <line
        x1={bodyHalfW}
        y1={0}
        x2={half}
        y2={0}
        stroke="url(#metalLeadGrad)"
        strokeWidth={4.2}
        strokeLinecap="round"
      />
      {/* Specular highlight */}
      <line
        x1={-half + 3}
        y1={-1}
        x2={-bodyHalfW}
        y2={-1}
        stroke="rgba(255,255,255,0.68)"
        strokeWidth={1.1}
        strokeLinecap="round"
      />
      <line
        x1={bodyHalfW}
        y1={-1}
        x2={half - 3}
        y2={-1}
        stroke="rgba(255,255,255,0.68)"
        strokeWidth={1.1}
        strokeLinecap="round"
      />
      {/* Socket pin caps */}
      <circle cx={-half} cy={0} r={4.2} fill="#8C96A0" stroke="#4D5660" strokeWidth={1} />
      <circle cx={half} cy={0} r={4.2} fill="#8C96A0" stroke="#4D5660" strokeWidth={1} />
      {showPolarity && !isMini && (
        <g fontFamily="var(--font-mono)" fontWeight={700} fontSize={10.5}>
          <circle cx={-half + 11} cy={-12} r={7.2} fill="#D94538" opacity={0.92} />
          <text x={-half + 11} y={-8.5} textAnchor="middle" fill="#FFFFFF">
            +
          </text>
          <circle cx={half - 11} cy={-12} r={7.2} fill="#313942" opacity={0.86} />
          <text x={half - 11} y={-8.5} textAnchor="middle" fill="#FFFFFF">
            −
          </text>
        </g>
      )}
    </g>
  );

  const selectionHalo = isSelected && !isMini ? (
    <rect
      x={-half + 2}
      y={-27}
      width={length - 4}
      height={54}
      rx={16}
      fill="rgba(217, 93, 38, 0.1)"
      stroke="#D95D26"
      strokeWidth={2}
      strokeDasharray="5 4"
    />
  ) : null;

  switch (component.kind) {
    case 'battery': {
      const v = component.voltage ?? 3;
      const bw = Math.min(length - 20, 68);
      const bh = 36;
      const accent = v >= 9 ? '#C96D28' : v >= 6 ? '#2B7A78' : '#356699';
      return (
        <g>
          {selectionHalo}
          {renderLeads(bw / 2, true)}
          {/* Drop shadow */}
          <rect x={-bw / 2} y={-bh / 2 + 3.5} width={bw} height={bh} rx={7} fill="rgba(20,25,30,0.22)" />
          {/* Positive copper cap button */}
          <rect x={-bw / 2 - 4.5} y={-8} width={6} height={16} rx={2} fill="#D5A64A" stroke="#7E5E1E" strokeWidth={0.9} />
          {/* Main matte battery body */}
          <rect x={-bw / 2} y={-bh / 2} width={bw} height={bh} rx={6.5} fill="#2A3138" stroke="#181D22" strokeWidth={1.2} />
          {/* Colored copper/brand band on positive side */}
          <path
            d={`M ${-bw / 2 + 6} ${-bh / 2} H ${-bw / 2 + 22} V ${bh / 2} H ${-bw / 2 + 6} A 6 6 0 0 1 ${-bw / 2} ${bh / 2 - 6} V ${-bh / 2 + 6} A 6 6 0 0 1 ${-bw / 2 + 6} ${-bh / 2} Z`}
            fill={accent}
          />
          {/* Subtle cylindrical highlight */}
          <rect x={-bw / 2 + 3} y={-bh / 2 + 3} width={bw - 6} height={6} rx={3} fill="rgba(255,255,255,0.18)" />
          {/* Voltage label */}
          <text
            x={8}
            y={4.5}
            textAnchor="middle"
            fontFamily="var(--font-mono)"
            fontWeight={800}
            fontSize={isMini ? 13 : 14}
            fill="#F6F2E8"
          >
            {v}V
          </text>
          {/* Short circuit thermal warning glow */}
          {telemetry?.shorted && !isMini && (
            <rect
              x={-bw / 2 - 3}
              y={-bh / 2 - 3}
              width={bw + 6}
              height={bh + 6}
              rx={9}
              fill="none"
              stroke="#FF4433"
              strokeWidth={3}
              opacity={0.85}
            />
          )}
        </g>
      );
    }

    case 'resistor': {
      const ohms = component.resistance ?? 220;
      const [b1, b2, b3, b4] = getResistorBands(ohms);
      const bw = Math.min(length - 22, 54);
      const bh = 21;
      return (
        <g>
          {selectionHalo}
          {renderLeads(bw / 2)}
          {/* Drop shadow */}
          <rect x={-bw / 2} y={-bh / 2 + 3} width={bw} height={bh} rx={9} fill="rgba(20,25,30,0.2)" />
          {/* Realistic ceramic beige resistor body */}
          <path
            d={`M ${-bw / 2 + 6} ${-bh / 2}
                C ${-bw / 2 + 12} ${-bh / 2}, ${-bw / 2 + 14} ${-bh / 2 + 2.5}, 0 ${-bh / 2 + 2.5}
                C ${bw / 2 - 14} ${-bh / 2 + 2.5}, ${bw / 2 - 12} ${-bh / 2}, ${bw / 2 - 6} ${-bh / 2}
                A 6 6 0 0 1 ${bw / 2} ${-bh / 2 + 6}
                V ${bh / 2 - 6}
                A 6 6 0 0 1 ${bw / 2 - 6} ${bh / 2}
                C ${bw / 2 - 12} ${bh / 2}, ${bw / 2 - 14} ${bh / 2 - 2.5}, 0 ${bh / 2 - 2.5}
                C ${-bw / 2 + 14} ${bh / 2 - 2.5}, ${-bw / 2 + 12} ${bh / 2}, ${-bw / 2 + 6} ${bh / 2}
                A 6 6 0 0 1 ${-bw / 2} ${bh / 2 - 6}
                V ${-bh / 2 + 6}
                A 6 6 0 0 1 ${-bw / 2 + 6} ${-bh / 2} Z`}
            fill="url(#resistorBodyGrad)"
            stroke="#9C8458"
            strokeWidth={1.1}
          />
          {/* Authentic 4-band EIA color stripes */}
          <rect x={-bw * 0.31} y={-bh / 2 + 1.5} width={4.8} height={bh - 3} rx={1} fill={b1} />
          <rect x={-bw * 0.12} y={-bh / 2 + 2.2} width={4.8} height={bh - 4.4} rx={1} fill={b2} />
          <rect x={bw * 0.07} y={-bh / 2 + 2.2} width={4.8} height={bh - 4.4} rx={1} fill={b3} />
          <rect x={bw * 0.27} y={-bh / 2 + 1.5} width={3.6} height={bh - 3} rx={1} fill={b4} />
          {/* Gloss sheen */}
          <rect x={-bw / 2 + 6} y={-bh / 2 + 3.5} width={bw - 12} height={3.5} rx={2} fill="rgba(255,255,255,0.4)" />
          {/* Crisp value pill in adult mode */}
          {!isMini && !isKidMode && (
            <g transform="translate(0, 21)">
              <rect x={-21} y={-7.5} width={42} height={14.5} rx={7} fill="rgba(30,38,45,0.82)" />
              <text
                x={0}
                y={3}
                textAnchor="middle"
                fontFamily="var(--font-mono)"
                fontSize={9.5}
                fontWeight={700}
                fill="#F7F4EC"
              >
                {formatOhms(ohms)}
              </text>
            </g>
          )}
        </g>
      );
    }

    case 'rheostat': {
      const ohms = component.resistance ?? 330;
      const min = component.rheostatMin ?? 20;
      const max = component.rheostatMax ?? 1000;
      const ratio = Math.max(0, Math.min(1, (ohms - min) / Math.max(1, max - min)));
      const dialAngle = -135 + ratio * 270;
      const bw = Math.min(length - 18, 48);
      return (
        <g>
          {selectionHalo}
          {renderLeads(bw / 2)}
          <rect x={-bw / 2} y={-20} width={bw} height={42} rx={8} fill="rgba(20,25,30,0.22)" />
          {/* Precision trimmer blue housing */}
          <rect x={-bw / 2} y={-22} width={bw} height={42} rx={8} fill="#2867A1" stroke="#18436B" strokeWidth={1.3} />
          <rect x={-bw / 2 + 3} y={-19} width={bw - 6} height={6} rx={3} fill="rgba(255,255,255,0.2)" />
          {/* Brass rotary trimmer dial */}
          <circle cx={0} cy={-1} r={14} fill="#E4EEF7" stroke="#1D4B75" strokeWidth={1.2} />
          <g transform={`translate(0, -1) rotate(${dialAngle})`}>
            <circle cx={0} cy={0} r={10.5} fill="#D8A93E" stroke="#8C6718" strokeWidth={1} />
            <rect x={-1.8} y={-9.5} width={3.6} height={11} rx={1.5} fill="#2A3138" />
          </g>
          {!isMini && (
            <g transform="translate(0, 26)">
              <rect x={-23} y={-7.5} width={46} height={14.5} rx={7} fill="#204D78" />
              <text
                x={0}
                y={3}
                textAnchor="middle"
                fontFamily="var(--font-mono)"
                fontSize={9.5}
                fontWeight={700}
                fill="#FFFFFF"
              >
                {formatOhms(ohms)}
              </text>
            </g>
          )}
        </g>
      );
    }

    case 'led': {
      const color = component.ledColor ?? 'red';
      const pal = LED_PALETTE[color];
      const intensity = active ? Math.max(0.25, Math.min(1.2, telemetry?.intensity ?? 0)) : 0;
      const r = 17;
      return (
        <g>
          {selectionHalo}
          {renderLeads(r + 2, true)}
          {/* Radiant optical bloom when powered */}
          {active && !component.burnedOut && !isMini && (
            <g>
              <circle cx={0} cy={0} r={r + 18 * intensity} fill={pal.glow} opacity={0.2 * intensity} />
              <circle cx={0} cy={0} r={r + 8 * intensity} fill={pal.lit} opacity={0.34 * intensity} />
            </g>
          )}
          {/* Shadow */}
          <circle cx={0} cy={3} r={r} fill="rgba(20,25,30,0.22)" />
          {/* LED epoxy rim with authentic flat cathode notch on right (+x = terminal B) */}
          <path
            d={`M ${r - 3} ${-11}
                A ${r} ${r} 0 1 0 ${r - 3} ${11}
                L ${r - 3} ${-11} Z`}
            fill={component.burnedOut ? '#3D3735' : active ? pal.lit : pal.body}
            stroke={component.burnedOut ? '#1E1A18' : pal.off}
            strokeWidth={1.6}
          />
          {/* Inner translucent core */}
          <circle
            cx={-1}
            cy={0}
            r={r - 4.5}
            fill={component.burnedOut ? '#262120' : active ? pal.core : pal.off}
            opacity={component.burnedOut ? 0.9 : active ? 0.4 + 0.55 * Math.min(1, intensity) : 0.35}
          />
          {/* Internal anvil / cup silhouette */}
          {!component.burnedOut && (
            <g opacity={active ? 0.25 : 0.45}>
              <rect x={-7} y={-2.5} width={5} height={5} rx={1} fill="#1E262D" />
              <polygon points="1,-4 7,-5 7,5 1,4" fill="#1E262D" />
            </g>
          )}
          {/* Epoxy glass highlight */}
          <ellipse cx={-5.5} cy={-6.5} rx={5.2} ry={3} transform="rotate(-25 -5.5 -6.5)" fill="rgba(255,255,255,0.65)" />
          {/* Burned out / overloaded smoke puffs */}
          {overloaded && !isMini && (
            <g>
              <circle className="smoke-puff" cx={-4} cy={-10} r={6} fill="#6F747A" />
              <circle className="smoke-puff" cx={5} cy={-14} r={5} fill="#8C9197" style={{ animationDelay: '0.5s' }} />
              {component.burnedOut && (
                <text x={0} y={4.5} textAnchor="middle" fontSize={13} fontWeight={900} fill="#FFCC44">
                  ✕
                </text>
              )}
            </g>
          )}
        </g>
      );
    }

    case 'switch_toggle': {
      const closed = Boolean(component.closed);
      const bw = Math.min(length - 20, 52);
      return (
        <g>
          {selectionHalo}
          {renderLeads(bw / 2)}
          {/* Drop shadow */}
          <rect x={-bw / 2} y={-15} width={bw} height={34} rx={8} fill="rgba(20,25,30,0.22)" />
          {/* Brushed housing */}
          <rect x={-bw / 2} y={-17} width={bw} height={34} rx={8} fill="#363F48" stroke="#1E242B" strokeWidth={1.3} />
          {/* Recessed switch slot */}
          <rect x={-bw / 2 + 7} y={-7} width={bw - 14} height={14} rx={7} fill="#1A2026" />
          {/* Status indicator dot */}
          <circle cx={-bw / 2 + 12} cy={0} r={3} fill={closed ? '#2ED47A' : '#535E69'} />
          {/* Mechanical toggle bat that shifts cleanly */}
          <g transform={`translate(${closed ? 9 : -9}, 0)`}>
            <circle cx={0} cy={1.5} r={10.5} fill="rgba(0,0,0,0.3)" />
            <circle cx={0} cy={0} r={10.5} fill="url(#metalKnobGrad)" stroke="#6B747E" strokeWidth={1.1} />
            <circle cx={-2.5} cy={-2.5} r={3.5} fill="rgba(255,255,255,0.6)" />
          </g>
          {!isMini && (
            <text
              x={0}
              y={28}
              textAnchor="middle"
              fontFamily="var(--font-mono)"
              fontSize={9.5}
              fontWeight={800}
              fill={closed ? '#1B7F4B' : '#67737E'}
            >
              {closed ? 'ON' : 'OFF'}
            </text>
          )}
        </g>
      );
    }

    case 'switch_push': {
      const pressed = Boolean(component.closed);
      const size = 34;
      return (
        <g>
          {selectionHalo}
          {renderLeads(size / 2)}
          <rect x={-size / 2} y={-size / 2 + 3} width={size} height={size} rx={7} fill="rgba(20,25,30,0.22)" />
          {/* Square tactile micro-switch frame */}
          <rect x={-size / 2} y={-size / 2} width={size} height={size} rx={7} fill="#D9DDE2" stroke="#7E8893" strokeWidth={1.3} />
          {/* Corner brass pins */}
          <circle cx={-11} cy={-11} r={2} fill="#5C6670" />
          <circle cx={11} cy={-11} r={2} fill="#5C6670" />
          <circle cx={-11} cy={11} r={2} fill="#5C6670" />
          <circle cx={11} cy={11} r={2} fill="#5C6670" />
          {/* Red plunger button */}
          <circle cx={0} cy={pressed ? 1 : 2.5} r={11.5} fill="rgba(0,0,0,0.25)" />
          <circle
            cx={0}
            cy={pressed ? 1 : 0}
            r={pressed ? 10.2 : 11.2}
            fill={pressed ? '#C73126' : '#EB463A'}
            stroke="#941E16"
            strokeWidth={1.2}
          />
          <ellipse
            cx={-3}
            cy={pressed ? -2 : -3.5}
            rx={4.5}
            ry={2.5}
            fill="rgba(255,255,255,0.45)"
          />
          {!isMini && (
            <text
              x={0}
              y={29}
              textAnchor="middle"
              fontFamily="var(--font-mono)"
              fontSize={9}
              fontWeight={800}
              fill={pressed ? '#C73126' : '#67737E'}
            >
              {pressed ? 'HELD' : 'HOLD'}
            </text>
          )}
        </g>
      );
    }

    case 'motor': {
      const r = 22;
      return (
        <g>
          {selectionHalo}
          {renderLeads(r - 1)}
          {/* Motor housing shadow */}
          <circle cx={0} cy={3.5} r={r} fill="rgba(20,25,30,0.24)" />
          {/* Brushed aluminum casing */}
          <circle cx={0} cy={0} r={r} fill="url(#motorBodyGrad)" stroke="#626D78" strokeWidth={1.4} />
          <circle cx={0} cy={0} r={r - 4} fill="#2A343E" />
          {/* Spinning 4-blade fan rotor */}
          <g transform={`rotate(${fanAngle})`}>
            {[0, 90, 180, 270].map((deg) => (
              <path
                key={deg}
                d="M 0 0 C 5 -4, 14 -6, 15.5 -1 C 16.5 4, 8 6, 0 2 Z"
                fill={active ? '#2AB3A1' : '#4E8C84'}
                stroke="#185C53"
                strokeWidth={0.8}
                transform={`rotate(${deg})`}
              />
            ))}
            {/* Brass motor shaft hub */}
            <circle cx={0} cy={0} r={4.8} fill="#E1B854" stroke="#85651A" strokeWidth={1} />
          </g>
          {active && !isMini && (
            <circle
              cx={0}
              cy={0}
              r={r + 3}
              fill="none"
              stroke={telemetry?.overloaded ? '#E8483B' : '#2AB3A1'}
              strokeWidth={1.8}
              strokeDasharray="6 6"
              opacity={0.7}
            />
          )}
        </g>
      );
    }

    case 'buzzer': {
      const r = 19;
      return (
        <g>
          {selectionHalo}
          {renderLeads(r - 1)}
          {/* Animated acoustic sound ripples when buzzing */}
          {active && !isMini && (
            <g>
              <circle className="sound-wave" cx={0} cy={0} r={r + 4} fill="none" stroke="#DF9A1A" strokeWidth={2.2} />
              <circle
                className="sound-wave"
                cx={0}
                cy={0}
                r={r + 4}
                fill="none"
                stroke="#DF9A1A"
                strokeWidth={2}
                style={{ animationDelay: '0.45s' }}
              />
            </g>
          )}
          <circle cx={0} cy={3} r={r} fill="rgba(20,25,30,0.24)" />
          {/* Matte black piezo cylinder */}
          <circle cx={0} cy={0} r={r} fill="#262C33" stroke="#14181C" strokeWidth={1.4} />
          <circle cx={0} cy={0} r={r - 3.5} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth={1} />
          {/* Brass resonant sound port */}
          <circle cx={0} cy={0} r={6.5} fill={active ? '#F2B830' : '#B58D36'} stroke="#171A1E" strokeWidth={1.5} />
          <circle cx={0} cy={0} r={2.8} fill="#1B2026" />
        </g>
      );
    }
  }
};

/** Shared SVG gradient definitions mounted once inside the breadboard SVG */
export const ComponentSvgDefs: React.FC = () => (
  <defs>
    <linearGradient id="boardSurfaceGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="#FCFBF7" />
      <stop offset="100%" stopColor="#EFECE3" />
    </linearGradient>
    <linearGradient id="metalLeadGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="#DDE3E9" />
      <stop offset="50%" stopColor="#9FA9B3" />
      <stop offset="100%" stopColor="#6D7782" />
    </linearGradient>
    <linearGradient id="resistorBodyGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="#F2DFB8" />
      <stop offset="55%" stopColor="#DEC28E" />
      <stop offset="100%" stopColor="#BC9D68" />
    </linearGradient>
    <linearGradient id="metalKnobGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="#F0F3F6" />
      <stop offset="55%" stopColor="#B8C2CC" />
      <stop offset="100%" stopColor="#7F8A96" />
    </linearGradient>
    <linearGradient id="motorBodyGrad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stopColor="#DCE3EA" />
      <stop offset="50%" stopColor="#A6B1BC" />
      <stop offset="100%" stopColor="#7A8692" />
    </linearGradient>
    <radialGradient id="socketHoleGrad" cx="40%" cy="35%" r="65%">
      <stop offset="0%" stopColor="#3B424A" />
      <stop offset="65%" stopColor="#22272D" />
      <stop offset="100%" stopColor="#161A1E" />
    </radialGradient>
  </defs>
);
