import React from 'react';
import { type Language, t } from '../core/i18n';
import { type CircuitBoardState, type SimulationResult, coordKey } from '../engine/types';
import { formatCurrent, formatOhms, formatPower, formatVoltage } from '../engine/resistorColors';
import type { ProbeTarget } from './BreadboardView';

interface MultimeterHudProps {
  board: CircuitBoardState;
  sim: SimulationResult;
  probeTarget: ProbeTarget | null;
  lang: Language;
  onClose: () => void;
}

function getComponentLabel(kind: string, lang: Language): string {
  switch (kind) {
    case 'battery':
      return t(lang, 'compBattery');
    case 'resistor':
      return t(lang, 'compResistor');
    case 'rheostat':
      return t(lang, 'compDimmer');
    case 'led':
      return t(lang, 'compLed');
    case 'switch_toggle':
      return t(lang, 'compToggleSw');
    case 'switch_push':
      return t(lang, 'compPushBtn');
    case 'switch_spdt':
      return t(lang, 'compSpdtSw');
    case 'motor':
      return t(lang, 'compMotor');
    case 'buzzer':
      return t(lang, 'compBuzzer');
    case 'ldr':
      return t(lang, 'compLdr');
    case 'thermistor':
      return t(lang, 'compThermistor');
    case 'diode':
      return t(lang, 'compDiode');
    case 'transistor_npn':
      return t(lang, 'compNpn');
    case 'capacitor':
      return t(lang, 'compCapacitor');
    case 'inductor':
      return t(lang, 'compInductor');
    case 'ac_source':
      return t(lang, 'compAcSource');
    default:
      return lang === 'pl' ? 'Element' : 'Part';
  }
}

export const MultimeterHud: React.FC<MultimeterHudProps> = ({
  board,
  sim,
  probeTarget,
  lang,
  onClose,
}) => {
  let title = t(lang, 'meterTapPrompt');
  let primary = '0.00 V';
  let vText = '—';
  let iText = '—';
  let pText = '—';
  let rText = '—';
  let status = t(lang, 'meterReady');

  if (probeTarget?.kind === 'component') {
    const comp = board.components.find((c) => c.id === probeTarget.id);
    const telem = sim.componentStates[probeTarget.id];
    if (comp && telem) {
      title = getComponentLabel(comp.kind, lang);
      if (comp.kind === 'transistor_npn') {
        primary = `Ic ${formatCurrent(telem.current)}`;
        vText = `Vce ${formatVoltage(telem.voltageDrop)}`;
        iText = `Ib ${formatCurrent(telem.baseCurrent ?? 0)}`;
        pText = `Vbe ${formatVoltage(telem.vbe ?? 0)}`;
        rText = formatPower(telem.power);
      } else {
        primary =
          comp.kind === 'led' || comp.kind === 'resistor' || comp.kind === 'rheostat' || comp.kind === 'inductor'
            ? formatCurrent(telem.current)
            : formatVoltage(Math.abs(telem.voltageDrop));
        vText = formatVoltage(Math.abs(telem.voltageDrop));
        iText = formatCurrent(telem.current);
        pText = formatPower(telem.power);
        rText = telem.effectiveResistance > 1e6 ? t(lang, 'meterOpen') : formatOhms(telem.effectiveResistance);
      }
      status = telem.statusText;
    }
  } else if (probeTarget?.kind === 'wire') {
    const w = sim.wireStates[probeTarget.id];
    if (w) {
      title = t(lang, 'jumperWire');
      primary = formatCurrent(w.current);
      iText = formatCurrent(w.current);
      vText = '~0.00 V';
      rText = '0.02Ω';
      pText = formatPower(w.current * w.current * 0.02);
      status = w.overloaded
        ? t(lang, 'meterWireOverload')
        : Math.abs(w.current) > 0.0005
        ? t(lang, 'meterWireFlow')
        : t(lang, 'meterWireIdle');
    }
  } else if (probeTarget?.kind === 'node') {
    const key = coordKey(probeTarget.coord);
    const v = sim.nodeVoltages[key];
    const colChar = String.fromCharCode(65 + probeTarget.coord.col);
    title = `${t(lang, 'meterSocket')} ${colChar}${probeTarget.coord.row + 1}`;
    if (v !== undefined) {
      primary = formatVoltage(v);
      vText = formatVoltage(v);
      status = t(lang, 'meterGroundRef');
    } else {
      primary = '---';
      status = t(lang, 'meterFloat');
    }
  }

  return (
    <aside className="multimeter-hud" aria-label={t(lang, 'meterHeader')}>
      <div className="meter-header">
        <span>{t(lang, 'meterHeader')}</span>
        <button type="button" className="meter-close" onClick={onClose} aria-label="Close">
          ×
        </button>
      </div>
      <div className="meter-lcd">
        <div className="meter-target">{title}</div>
        <div className="meter-primary">{primary}</div>
        <div className="meter-grid">
          <span>{lang === 'pl' ? 'U' : 'V'}: {vText}</span>
          <span>I: {iText}</span>
          <span>P: {pText}</span>
          <span>R: {rText}</span>
        </div>
      </div>
      <div className="meter-hint">{status}</div>
    </aside>
  );
};
