import React, { useMemo, useRef, useState } from 'react';
import type { Language } from '../core/i18n';
import {
  type CircuitBoardState,
  type CircuitComponent,
  type GridCoord,
  type JumperWire,
  type SimulationResult,
  type TrayItemTemplate,
  type WireColor,
  coordKey,
  coordsEqual,
  edgeKey,
  isAdjacent,
} from '../engine/types';
import { ComponentArt, ComponentSvgDefs } from './ComponentArt';

export type ProbeTarget =
  | { kind: 'component'; id: string }
  | { kind: 'wire'; id: string }
  | { kind: 'node'; coord: GridCoord };

interface BreadboardViewProps {
  board: CircuitBoardState;
  sim: SimulationResult;
  fanAngles: Record<string, number>;
  isKidMode: boolean;
  lang: Language;
  xrayMode: boolean;
  meterMode: boolean;
  wireColor: WireColor;
  selectedTemplate: TrayItemTemplate | null;
  selectedItem: { kind: 'component' | 'wire'; id: string } | null;
  probeTarget: ProbeTarget | null;
  guideWire?: { a: GridCoord; b: GridCoord }[];
  onAddWire: (a: GridCoord, b: GridCoord) => void;
  onPlaceComponent: (template: TrayItemTemplate, a: GridCoord, b: GridCoord) => void;
  onToggleSwitch: (id: string) => void;
  onPushButtonChange: (id: string, pressed: boolean) => void;
  onSelectItem: (item: { kind: 'component' | 'wire'; id: string } | null) => void;
  onProbe: (target: ProbeTarget) => void;
}

const PITCH = 94;
const PAD_X = 68;
const PAD_Y = 62;

const WIRE_HEX: Record<WireColor, { main: string; hi: string; dark: string }> = {
  red: { main: '#D94436', hi: '#F57A6E', dark: '#9B241A' },
  black: { main: '#2C333B', hi: '#59636E', dark: '#15191D' },
  blue: { main: '#2D72C8', hi: '#68A5F0', dark: '#1B4B8A' },
  amber: { main: '#E09A1F', hi: '#F7C65E', dark: '#9E680D' },
  green: { main: '#2A9158', hi: '#5EC48B', dark: '#196139' },
};

function socketPos(c: GridCoord): { x: number; y: number } {
  return {
    x: PAD_X + c.col * PITCH,
    y: PAD_Y + c.row * PITCH,
  };
}

/** Smooth organic arched jumper wire path between two points */
function buildWirePath(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  archIndex = 0
): { d: string; mx: number; my: number } {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const dist = Math.hypot(dx, dy) || 1;
  // Perpendicular normal
  const nx = -dy / dist;
  const ny = dx / dist;
  // Gentle arch scaled by length so overlapping/long jumper wires stay super legible
  const sign = archIndex % 2 === 0 ? -1 : 1;
  const lift = Math.min(34, 10 + dist * 0.12) * sign;
  const mx = (x1 + x2) / 2 + nx * lift;
  const my = (y1 + y2) / 2 + ny * lift;
  return {
    d: `M ${x1} ${y1} Q ${mx} ${my} ${x2} ${y2}`,
    mx,
    my,
  };
}

function voltageToXrayColor(v: number): string {
  if (v >= 5.5) return '#E8523F';
  if (v >= 2.2) return '#E89B24';
  if (v >= 0.4) return '#2CA68C';
  return '#4E6780';
}

export const BreadboardView: React.FC<BreadboardViewProps> = ({
  board,
  sim,
  fanAngles,
  isKidMode,
  lang,
  xrayMode,
  meterMode,
  wireColor,
  selectedTemplate,
  selectedItem,
  probeTarget,
  guideWire,
  onAddWire,
  onPlaceComponent,
  onToggleSwitch,
  onPushButtonChange,
  onSelectItem,
  onProbe,
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);

  // Live wire-dragging state
  const [wireDrag, setWireDrag] = useState<{
    from: GridCoord;
    pointer: { x: number; y: number };
    hoverCoord: GridCoord | null;
  } | null>(null);

  const width = PAD_X * 2 + (board.cols - 1) * PITCH;
  const height = PAD_Y * 2 + (board.rows - 1) * PITCH;

  // Map occupied component edges so placement slots stay clean & non-overlapping
  const occupiedComponentEdges = useMemo(() => {
    const set = new Set<string>();
    for (const c of board.components) {
      set.add(edgeKey(c.a, c.b));
    }
    return set;
  }, [board.components]);

  // All valid adjacent placement slots when a part from the tray is selected
  const placementSlots = useMemo(() => {
    if (!selectedTemplate) return [];
    const slots: { a: GridCoord; b: GridCoord; key: string }[] = [];
    for (let r = 0; r < board.rows; r++) {
      for (let c = 0; c < board.cols; c++) {
        if (c + 1 < board.cols) {
          const a = { col: c, row: r };
          const b = { col: c + 1, row: r };
          const key = edgeKey(a, b);
          if (!occupiedComponentEdges.has(key)) slots.push({ a, b, key });
        }
        if (r + 1 < board.rows) {
          const a = { col: c, row: r };
          const b = { col: c, row: r + 1 };
          const key = edgeKey(a, b);
          if (!occupiedComponentEdges.has(key)) slots.push({ a, b, key });
        }
      }
    }
    return slots;
  }, [board.cols, board.rows, occupiedComponentEdges, selectedTemplate]);

  // Helper to convert client pointer coordinates into SVG viewBox coordinates
  const clientToSvg = (clientX: number, clientY: number): { x: number; y: number } => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const pt = svg.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;
    const ctm = svg.getScreenCTM();
    if (!ctm) return { x: 0, y: 0 };
    const res = pt.matrixTransform(ctm.inverse());
    return { x: res.x, y: res.y };
  };

  // Find nearest socket within magnetic snap radius
  const findNearestSocket = (x: number, y: number, maxDist = 42): GridCoord | null => {
    let best: GridCoord | null = null;
    let bestD = maxDist;
    for (let r = 0; r < board.rows; r++) {
      for (let c = 0; c < board.cols; c++) {
        const p = socketPos({ col: c, row: r });
        const d = Math.hypot(x - p.x, y - p.y);
        if (d < bestD) {
          bestD = d;
          best = { col: c, row: r };
        }
      }
    }
    return best;
  };

  const handleSocketPointerDown = (coord: GridCoord, e: React.PointerEvent) => {
    e.stopPropagation();
    if (meterMode) {
      onProbe({ kind: 'node', coord });
      return;
    }
    // If placing a component, allow swipe between two adjacent sockets too!
    const svgPt = clientToSvg(e.clientX, e.clientY);
    (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
    setWireDrag({ from: coord, pointer: svgPt, hoverCoord: coord });
  };

  const handleSvgPointerMove = (e: React.PointerEvent) => {
    if (!wireDrag) return;
    const pt = clientToSvg(e.clientX, e.clientY);
    const nearest = findNearestSocket(pt.x, pt.y, 44);
    setWireDrag((prev) => (prev ? { ...prev, pointer: pt, hoverCoord: nearest } : null));
  };

  const handleSvgPointerUp = () => {
    if (!wireDrag) return;
    const { from, hoverCoord } = wireDrag;
    setWireDrag(null);
    if (!hoverCoord || coordsEqual(from, hoverCoord)) {
      return;
    }
    if (selectedTemplate && isAdjacent(from, hoverCoord) && !occupiedComponentEdges.has(edgeKey(from, hoverCoord))) {
      onPlaceComponent(selectedTemplate, from, hoverCoord);
    } else if (!selectedTemplate) {
      onAddWire(from, hoverCoord);
    } else {
      // Even when a part is selected, dragging >1 socket draws a convenient jumper wire!
      onAddWire(from, hoverCoord);
    }
  };

  const handleComponentClick = (comp: CircuitComponent, e: React.MouseEvent) => {
    e.stopPropagation();
    if (meterMode) {
      onProbe({ kind: 'component', id: comp.id });
      return;
    }
    if (comp.kind === 'switch_toggle') {
      onToggleSwitch(comp.id);
      onSelectItem({ kind: 'component', id: comp.id });
      return;
    }
    if (comp.kind === 'switch_push') {
      onSelectItem({ kind: 'component', id: comp.id });
      return;
    }
    onSelectItem({ kind: 'component', id: comp.id });
  };

  const handleWireClick = (wire: JumperWire, e: React.MouseEvent) => {
    e.stopPropagation();
    if (meterMode) {
      onProbe({ kind: 'wire', id: wire.id });
      return;
    }
    onSelectItem({ kind: 'wire', id: wire.id });
  };

  // Connected socket counts (for subtle brass contact glow)
  const socketConnections = useMemo(() => {
    const counts = new Map<string, number>();
    const inc = (c: GridCoord) => {
      const k = coordKey(c);
      counts.set(k, (counts.get(k) ?? 0) + 1);
    };
    board.components.forEach((c) => {
      inc(c.a);
      inc(c.b);
    });
    board.wires.forEach((w) => {
      inc(w.a);
      inc(w.b);
    });
    return counts;
  }, [board.components, board.wires]);

  return (
    <svg
      ref={svgRef}
      className="breadboard-svg"
      viewBox={`0 0 ${width} ${height}`}
      onPointerMove={handleSvgPointerMove}
      onPointerUp={handleSvgPointerUp}
      onPointerCancel={() => setWireDrag(null)}
      onClick={() => onSelectItem(null)}
      role="application"
      aria-label="Interactive electronics breadboard"
    >
      <ComponentSvgDefs />

      {/* Realistic Satin Ivory ABS Breadboard Base */}
      <rect
        x={10}
        y={10}
        width={width - 20}
        height={height - 20}
        rx={22}
        fill="url(#boardSurfaceGrad)"
        stroke="#D4CEC0"
        strokeWidth={2}
      />
      {/* Subtle inner bevel highlight */}
      <rect
        x={14}
        y={14}
        width={width - 28}
        height={height - 28}
        rx={19}
        fill="none"
        stroke="rgba(255,255,255,0.85)"
        strokeWidth={1.5}
      />

      {/* Subtle Red (+) and Blue (−) top/bottom breadboard rail trim lines */}
      <line
        x1={PAD_X - 18}
        y1={28}
        x2={width - PAD_X + 18}
        y2={28}
        stroke="#DF5A4A"
        strokeWidth={2.2}
        strokeLinecap="round"
        opacity={0.42}
      />
      <line
        x1={PAD_X - 18}
        y1={height - 28}
        x2={width - PAD_X + 18}
        y2={height - 28}
        stroke="#3D78B8"
        strokeWidth={2.2}
        strokeLinecap="round"
        opacity={0.42}
      />

      {/* Corner stainless mounting screws */}
      {[
        { x: 29, y: 29 },
        { x: width - 29, y: 29 },
        { x: 29, y: height - 29 },
        { x: width - 29, y: height - 29 },
      ].map((s, idx) => (
        <g key={idx} transform={`translate(${s.x}, ${s.y})`}>
          <circle cx={0} cy={1} r={6.5} fill="rgba(30,38,45,0.12)" />
          <circle cx={0} cy={0} r={6.2} fill="#D2D7DC" stroke="#A6AEB7" strokeWidth={1} />
          <line x1={-3.5} y1={-2} x2={3.5} y2={2} stroke="#828B95" strokeWidth={1.4} strokeLinecap="round" />
        </g>
      ))}

      {/* Subtle Silkscreen Column & Row Coordinates */}
      {!isKidMode &&
        Array.from({ length: board.cols }).map((_, c) => (
          <text
            key={`col-${c}`}
            x={PAD_X + c * PITCH}
            y={43}
            textAnchor="middle"
            fontFamily="var(--font-mono)"
            fontSize={10.5}
            fontWeight={700}
            fill="#9BA3AB"
          >
            {String.fromCharCode(65 + c)}
          </text>
        ))}
      {!isKidMode &&
        Array.from({ length: board.rows }).map((_, r) => (
          <text
            key={`row-${r}`}
            x={34}
            y={PAD_Y + r * PITCH + 4}
            textAnchor="middle"
            fontFamily="var(--font-mono)"
            fontSize={10.5}
            fontWeight={700}
            fill="#9BA3AB"
          >
            {r + 1}
          </text>
        ))}

      {/* Guided Wire Hints (starter puzzle / Kid missions) */}
      {guideWire &&
        guideWire.map((g, idx) => {
          const alreadyWired = board.wires.some(
            (w) =>
              (coordsEqual(w.a, g.a) && coordsEqual(w.b, g.b)) ||
              (coordsEqual(w.a, g.b) && coordsEqual(w.b, g.a))
          );
          if (alreadyWired) return null;
          const p1 = socketPos(g.a);
          const p2 = socketPos(g.b);
          const { d } = buildWirePath(p1.x, p1.y, p2.x, p2.y, idx);
          return (
            <path
              key={`guide-${idx}`}
              d={d}
              fill="none"
              stroke={isKidMode ? '#1C8A7C' : '#D95D26'}
              strokeWidth={6}
              strokeDasharray="9 8"
              strokeLinecap="round"
              style={{ animation: 'guidePulse 1.8s ease-in-out infinite', pointerEvents: 'none' }}
            />
          );
        })}

      {/* Placement Slots when a Tray Part is Selected */}
      {selectedTemplate &&
        placementSlots.map((slot) => {
          const p1 = socketPos(slot.a);
          const p2 = socketPos(slot.b);
          const mx = (p1.x + p2.x) / 2;
          const my = (p1.y + p2.y) / 2;
          const isHoriz = slot.a.row === slot.b.row;
          return (
            <g
              key={slot.key}
              transform={`translate(${mx}, ${my})`}
              style={{ cursor: 'pointer' }}
              onClick={(e) => {
                e.stopPropagation();
                onPlaceComponent(selectedTemplate, slot.a, slot.b);
              }}
            >
              <rect
                x={isHoriz ? -34 : -18}
                y={isHoriz ? -18 : -34}
                width={isHoriz ? 68 : 36}
                height={isHoriz ? 36 : 68}
                rx={12}
                fill={isKidMode ? 'rgba(28, 138, 124, 0.08)' : 'rgba(217, 93, 38, 0.08)'}
                stroke={isKidMode ? 'rgba(28, 138, 124, 0.45)' : 'rgba(217, 93, 38, 0.45)'}
                strokeWidth={1.6}
                strokeDasharray="5 4"
              />
              <circle
                cx={0}
                cy={0}
                r={7}
                fill={isKidMode ? '#1C8A7C' : '#D95D26'}
                opacity={0.78}
              />
              <text
                x={0}
                y={3.5}
                textAnchor="middle"
                fill="#FFFFFF"
                fontSize={12}
                fontWeight={800}
                style={{ pointerEvents: 'none' }}
              >
                +
              </text>
            </g>
          );
        })}

      {/* Recessed Brass-Lined Breadboard Sockets */}
      {Array.from({ length: board.rows }).map((_, r) =>
        Array.from({ length: board.cols }).map((__, c) => {
          const coord = { col: c, row: r };
          const key = coordKey(coord);
          const pos = socketPos(coord);
          const connCount = socketConnections.get(key) ?? 0;
          const voltage = sim.nodeVoltages[key];
          const hasVoltage = voltage !== undefined && connCount > 0;
          const isDragTarget =
            wireDrag?.hoverCoord && coordsEqual(wireDrag.hoverCoord, coord);
          const isDragOrigin = wireDrag && coordsEqual(wireDrag.from, coord);
          const isProbed =
            probeTarget?.kind === 'node' && coordsEqual(probeTarget.coord, coord);

          return (
            <g
              key={key}
              transform={`translate(${pos.x}, ${pos.y})`}
              style={{ cursor: meterMode ? 'crosshair' : 'pointer' }}
              onPointerDown={(e) => handleSocketPointerDown(coord, e)}
            >
              {/* Generous invisible thumb touch hit target */}
              <circle cx={0} cy={0} r={26} fill="transparent" />

              {/* X-Ray node voltage halo */}
              {xrayMode && hasVoltage && (
                <circle
                  cx={0}
                  cy={0}
                  r={18}
                  fill={voltageToXrayColor(voltage)}
                  opacity={0.22}
                />
              )}

              {/* Magnetic drag ring */}
              {(isDragTarget || isDragOrigin || isProbed) && (
                <circle
                  cx={0}
                  cy={0}
                  r={17}
                  fill="none"
                  stroke={isProbed ? '#E5A923' : isKidMode ? '#1C8A7C' : '#D95D26'}
                  strokeWidth={2.6}
                />
              )}

              {/* Molded plastic socket bevel */}
              <rect
                x={-11.5}
                y={-11.5}
                width={23}
                height={23}
                rx={6}
                fill="#E3DED2"
                stroke="#C9C2B3"
                strokeWidth={1.1}
              />
              {/* Dark recessed cavity */}
              <rect x={-7.5} y={-7.5} width={15} height={15} rx={3.5} fill="url(#socketHoleGrad)" />
              {/* Inner brass spring clips */}
              <rect
                x={-5.2}
                y={-2}
                width={2.2}
                height={4}
                rx={0.8}
                fill={connCount > 0 ? '#E3BE62' : '#9B854E'}
              />
              <rect
                x={3}
                y={-2}
                width={2.2}
                height={4}
                rx={0.8}
                fill={connCount > 0 ? '#E3BE62' : '#9B854E'}
              />

              {/* X-Ray voltage badge */}
              {xrayMode && hasVoltage && (
                <g transform="translate(0, -20)" style={{ pointerEvents: 'none' }}>
                  <rect
                    x={-18}
                    y={-8}
                    width={36}
                    height={14}
                    rx={6}
                    fill={voltageToXrayColor(voltage)}
                  />
                  <text
                    x={0}
                    y={2.5}
                    textAnchor="middle"
                    fontFamily="var(--font-mono)"
                    fontSize={8.8}
                    fontWeight={700}
                    fill="#FFFFFF"
                  >
                    {voltage.toFixed(1)}V
                  </text>
                </g>
              )}
            </g>
          );
        })
      )}

      {/* Realistic Curved PVC Jumper Wires */}
      {board.wires.map((wire, idx) => {
        const p1 = socketPos(wire.a);
        const p2 = socketPos(wire.b);
        const { d } = buildWirePath(p1.x, p1.y, p2.x, p2.y, idx);
        const colors = WIRE_HEX[wire.color];
        const wState = sim.wireStates[wire.id];
        const current = wState?.current ?? 0;
        const absI = Math.abs(current);
        const isFlowing = absI > 0.0008;
        const isSelected = selectedItem?.kind === 'wire' && selectedItem.id === wire.id;
        const isProbed = probeTarget?.kind === 'wire' && probeTarget.id === wire.id;
        const flowDuration = Math.max(0.28, Math.min(2.2, 0.06 / Math.max(absI, 0.004)));

        return (
          <g
            key={wire.id}
            style={{ cursor: meterMode ? 'crosshair' : 'pointer' }}
            onClick={(e) => handleWireClick(wire, e)}
          >
            {/* Fat transparent hit target for easy mobile tap */}
            <path d={d} fill="none" stroke="transparent" strokeWidth={24} strokeLinecap="round" />

            {/* Selection / Probe / Overload outer halo */}
            {(isSelected || isProbed || wState?.overloaded) && (
              <path
                d={d}
                fill="none"
                stroke={
                  wState?.overloaded
                    ? '#FF3B2F'
                    : isProbed
                    ? '#E5A923'
                    : '#D95D26'
                }
                strokeWidth={14}
                strokeLinecap="round"
                opacity={0.35}
              />
            )}

            {/* Cast drop shadow onto ivory breadboard */}
            <path
              d={d}
              transform="translate(0, 4)"
              fill="none"
              stroke="rgba(24, 30, 36, 0.22)"
              strokeWidth={7.5}
              strokeLinecap="round"
            />

            {/* Main insulated PVC wire jacket */}
            <path
              d={d}
              fill="none"
              stroke={colors.dark}
              strokeWidth={8.2}
              strokeLinecap="round"
            />
            <path
              d={d}
              fill="none"
              stroke={colors.main}
              strokeWidth={6.4}
              strokeLinecap="round"
            />
            {/* Glossy specular sheen along top of wire */}
            <path
              d={d}
              transform="translate(0, -1.2)"
              fill="none"
              stroke={colors.hi}
              strokeWidth={1.8}
              strokeLinecap="round"
              opacity={0.72}
            />

            {/* Exposed jumper pin collars */}
            <circle cx={p1.x} cy={p1.y} r={5.4} fill={colors.dark} stroke="#1B2026" strokeWidth={1} />
            <circle cx={p2.x} cy={p2.y} r={5.4} fill={colors.dark} stroke="#1B2026" strokeWidth={1} />
            <circle cx={p1.x} cy={p1.y} r={2.2} fill="#DCE2E8" />
            <circle cx={p2.x} cy={p2.y} r={2.2} fill="#DCE2E8" />

            {/* X-Ray animated current flow pulses */}
            {xrayMode && isFlowing && (
              <path
                d={d}
                fill="none"
                stroke={wState?.overloaded ? '#FFE066' : '#8EF7FF'}
                strokeWidth={3.4}
                strokeDasharray="6 18"
                strokeLinecap="round"
                style={{
                  animation: `currentFlow ${flowDuration}s linear infinite`,
                  animationDirection: current >= 0 ? 'normal' : 'reverse',
                  pointerEvents: 'none',
                }}
              />
            )}
          </g>
        );
      })}

      {/* Live Jumper Wire Being Dragged */}
      {wireDrag && (() => {
        const p1 = socketPos(wireDrag.from);
        const p2 = wireDrag.hoverCoord ? socketPos(wireDrag.hoverCoord) : wireDrag.pointer;
        const { d } = buildWirePath(p1.x, p1.y, p2.x, p2.y, 0);
        const colors = WIRE_HEX[wireColor];
        return (
          <g style={{ pointerEvents: 'none' }}>
            <path
              d={d}
              fill="none"
              stroke={colors.main}
              strokeWidth={7}
              strokeLinecap="round"
              opacity={0.85}
            />
            <circle cx={p2.x} cy={p2.y} r={7} fill={colors.main} stroke="#FFFFFF" strokeWidth={2} />
          </g>
        );
      })()}

      {/* Placed Electronic Components */}
      {board.components.map((comp) => {
        const pA = socketPos(comp.a);
        const pB = socketPos(comp.b);
        const mx = (pA.x + pB.x) / 2;
        const my = (pA.y + pB.y) / 2;
        const dx = pB.x - pA.x;
        const dy = pB.y - pA.y;
        const dist = Math.hypot(dx, dy);
        const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
        const telemetry = sim.componentStates[comp.id];
        const isSelected = selectedItem?.kind === 'component' && selectedItem.id === comp.id;
        const isProbed = probeTarget?.kind === 'component' && probeTarget.id === comp.id;
        const absI = Math.abs(telemetry?.current ?? 0);
        const flowDuration = Math.max(0.28, Math.min(2.2, 0.06 / Math.max(absI, 0.004)));

        return (
          <g
            key={comp.id}
            transform={`translate(${mx}, ${my}) rotate(${angle})`}
            style={{ cursor: meterMode ? 'crosshair' : 'pointer' }}
            onClick={(e) => handleComponentClick(comp, e)}
            onPointerDown={(e) => {
              if (!meterMode && comp.kind === 'switch_push') {
                e.stopPropagation();
                (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
                onPushButtonChange(comp.id, true);
              }
            }}
            onPointerUp={(e) => {
              if (!meterMode && comp.kind === 'switch_push') {
                e.stopPropagation();
                onPushButtonChange(comp.id, false);
              }
            }}
            onPointerCancel={() => {
              if (comp.kind === 'switch_push') {
                onPushButtonChange(comp.id, false);
              }
            }}
          >
            {/* Generous touch target around component body */}
            <rect
              x={-dist / 2 + 12}
              y={-28}
              width={Math.max(36, dist - 24)}
              height={56}
              rx={14}
              fill="transparent"
            />

            {/* Multimeter probe ring */}
            {isProbed && (
              <rect
                x={-dist / 2 + 4}
                y={-27}
                width={dist - 8}
                height={54}
                rx={16}
                fill="rgba(229, 169, 35, 0.14)"
                stroke="#E5A923"
                strokeWidth={2.5}
              />
            )}

            <ComponentArt
              component={comp}
              telemetry={telemetry}
              length={dist}
              fanAngle={fanAngles[comp.id] ?? 0}
              isKidMode={isKidMode}
              lang={lang}
              isSelected={isSelected}
            />

            {/* X-Ray current flow pulse along component axis */}
            {xrayMode && absI > 0.0008 && !comp.burnedOut && (
              <line
                x1={-dist / 2}
                y1={0}
                x2={dist / 2}
                y2={0}
                stroke="#8EF7FF"
                strokeWidth={3.2}
                strokeDasharray="6 18"
                strokeLinecap="round"
                style={{
                  animation: `currentFlow ${flowDuration}s linear infinite`,
                  animationDirection: (telemetry?.current ?? 0) >= 0 ? 'normal' : 'reverse',
                  pointerEvents: 'none',
                }}
              />
            )}
          </g>
        );
      })}
    </svg>
  );
};
