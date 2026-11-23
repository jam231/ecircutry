const DIGIT_COLORS: Record<number, { hex: string; name: string }> = {
  0: { hex: '#1F1F22', name: 'Black' },
  1: { hex: '#7A421D', name: 'Brown' },
  2: { hex: '#D6382E', name: 'Red' },
  3: { hex: '#E67B24', name: 'Orange' },
  4: { hex: '#E6C229', name: 'Yellow' },
  5: { hex: '#2F8F4E', name: 'Green' },
  6: { hex: '#2A6BC9', name: 'Blue' },
  7: { hex: '#7A4BA8', name: 'Violet' },
  8: { hex: '#7E8690', name: 'Gray' },
  9: { hex: '#F3F1EA', name: 'White' },
};

const MULTIPLIER_COLORS: Record<number, { hex: string; name: string }> = {
  [-1]: { hex: '#CFA442', name: 'Gold' },
  0: { hex: '#1F1F22', name: 'Black' },
  1: { hex: '#7A421D', name: 'Brown' },
  2: { hex: '#D6382E', name: 'Red' },
  3: { hex: '#E67B24', name: 'Orange' },
  4: { hex: '#E6C229', name: 'Yellow' },
  5: { hex: '#2F8F4E', name: 'Green' },
  6: { hex: '#2A6BC9', name: 'Blue' },
};

/**
 * Computes authentic 4-band EIA resistor color bands for any positive resistance in Ohms.
 * Band 4 is Gold (±5% tolerance), standard for carbon-film lab resistors.
 */
export function getResistorBands(ohms: number): [string, string, string, string] {
  const safe = Math.max(1, Math.round(ohms));
  let exp = Math.floor(Math.log10(safe)) - 1;
  if (exp < -1) exp = -1;

  let sig = Math.round(safe / Math.pow(10, exp));
  if (sig >= 100) {
    sig = Math.round(sig / 10);
    exp += 1;
  }
  if (sig < 10) {
    sig *= 10;
    exp -= 1;
  }

  const d1 = Math.floor(sig / 10) % 10;
  const d2 = sig % 10;
  const b1 = DIGIT_COLORS[d1]?.hex ?? '#7A421D';
  const b2 = DIGIT_COLORS[d2]?.hex ?? '#1F1F22';
  const b3 = MULTIPLIER_COLORS[exp]?.hex ?? '#1F1F22';
  const tolerance = '#CFA442'; // Gold ±5%

  return [b1, b2, b3, tolerance];
}

export function formatOhms(ohms: number): string {
  if (!Number.isFinite(ohms)) return '∞ Ω';
  if (ohms >= 1_000_000) return `${(ohms / 1_000_000).toFixed(1).replace(/\.0$/, '')}MΩ`;
  if (ohms >= 1_000) return `${(ohms / 1_000).toFixed(1).replace(/\.0$/, '')}kΩ`;
  return `${Math.round(ohms)}Ω`;
}

export function formatCurrent(amps: number): string {
  const abs = Math.abs(amps);
  if (abs < 0.00005) return '0.0 mA';
  if (abs >= 1) return `${abs.toFixed(2)} A`;
  if (abs >= 0.01) return `${(abs * 1000).toFixed(1)} mA`;
  return `${(abs * 1000).toFixed(2)} mA`;
}

export function formatVoltage(volts: number): string {
  if (Math.abs(volts) < 0.005) return '0.00 V';
  return `${volts.toFixed(2)} V`;
}

export function formatPower(watts: number): string {
  const abs = Math.abs(watts);
  if (abs < 0.0001) return '0 mW';
  if (abs >= 1) return `${abs.toFixed(2)} W`;
  return `${(abs * 1000).toFixed(0)} mW`;
}
