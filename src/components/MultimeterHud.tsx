import React from 'react';
import { type CircuitBoardState, type SimulationResult, coordKey } from '../engine/types';
import { formatCurrent, formatOhms, formatPower, formatVoltage } from '../engine/resistorColors';
import type { ProbeTarget } from './BreadboardView';

interface MultimeterHudProps {
  board: CircuitBoardState;
  sim: SimulationResult;
  probeTarget: ProbeTarget | null;
  onClose: () => void;
}

function getComponentLabel(kind: string): string {
  switch (kind) {
    case 'battery':
      return 'Battery';
    case 'resistor':
      return 'Resistor';
    case 'rheostat':
      return 'Dimmer';
    case 'led':
      return 'LED';
    case 'switch_toggle':
      return 'Toggle Switch';
    case 'switch_push':
      return 'Push Button';
    case 'motor':
      return 'DC Motor';
    case 'buzzer':
      return 'Piezo Buzzer';
    default:
      return 'Part';
  }
}

export const MultimeterHud: React.FC<MultimeterHudProps> = ({
  board,
  sim,
  probeTarget,
  onClose,
}) => {
  let title = 'Tap any part or socket';
  let primary = '0.00 V';
  let vText = '—';
  let iText = '—';
  let pText = '—';
  let rText = '—';
  let status = 'Ready to measure live DC values.';

  if (probeTarget?.kind === 'component') {
    const comp = board.components.find((c) => c.id === probeTarget.id);
    const t = sim.componentStates[probeTarget.id];
    if (comp && t) {
      title = getComponentLabel(comp.kind);
      primary = comp.kind === 'led' || comp.kind === 'resistor' || comp.kind === 'rheostat'
        ? formatCurrent(t.current)
        : formatVoltage(Math.abs(t.voltageDrop));
      vText = formatVoltage(Math.abs(t.voltageDrop));
      iText = formatCurrent(t.current);
      pText = formatPower(t.power);
      rText = t.effectiveResistance > 1e6 ? 'OPEN' : formatOhms(t.effectiveResistance);
      status = t.statusText;
    }
  } else if (probeTarget?.kind === 'wire') {
    const w = sim.wireStates[probeTarget.id];
    if (w) {
      title = 'Jumper Wire';
      primary = formatCurrent(w.current);
      iText = formatCurrent(w.current);
      vText = '~0.00 V';
      rText = '0.02Ω';
      pText = formatPower(w.current * w.current * 0.02);
      status = w.overloaded ? 'OVERLOAD! Short circuit current.' : Math.abs(w.current) > 0.0005 ? 'Carrying current' : 'No current flowing';
    }
  } else if (probeTarget?.kind === 'node') {
    const key = coordKey(probeTarget.coord);
    const v = sim.nodeVoltages[key];
    const colChar = String.fromCharCode(65 + probeTarget.coord.col);
    title = `Socket ${colChar}${probeTarget.coord.row + 1}`;
    if (v !== undefined) {
      primary = formatVoltage(v);
      vText = formatVoltage(v);
      status = 'Voltage relative to Battery − (GND)';
    } else {
      primary = 'FLOAT';
      status = 'Unconnected socket';
    }
  }

  return (
    <aside className="multimeter-hud" aria-label="Digital Multimeter">
      <div className="meter-header">
        <span>DC Multimeter</span>
        <button type="button" className="meter-close" onClick={onClose} aria-label="Close multimeter">
          ×
        </button>
      </div>
      <div className="meter-lcd">
        <div className="meter-target">{title}</div>
        <div className="meter-primary">{primary}</div>
        <div className="meter-grid">
          <span>V: {vText}</span>
          <span>I: {iText}</span>
          <span>P: {pText}</span>
          <span>R: {rText}</span>
        </div>
      </div>
      <div className="meter-hint">{status}</div>
    </aside>
  );
};
