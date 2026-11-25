import type { LocalizedText } from '../core/i18n';
import type { LevelDefinition, TierId } from '../engine/types';
import { stemRegistry } from '../core/stemModule';
import { TIER1_LEVELS } from './levels/tier1';
import { TIER2_LEVELS } from './levels/tier2';
import { TIER3_LEVELS } from './levels/tier3';
import { TIER4_LEVELS } from './levels/tier4';
import { KID_MISSIONS } from './levels/kidMissions';
import { ADULT_SANDBOX, KID_SANDBOX } from './levels/sandboxes';

export interface TierMeta {
  id: TierId;
  shortLabel: LocalizedText;
  adultTitle: LocalizedText;
  kidTitle: LocalizedText;
  accent: string;
}

export const TIER_METADATA: TierMeta[] = [
  {
    id: 1,
    shortLabel: { en: 'Tier 1', pl: 'Poziom 1' },
    adultTitle: { en: 'DC Foundations', pl: 'Podstawy DC' },
    kidTitle: { en: 'First Sparks', pl: 'Pierwsze Iskry' },
    accent: '#D95D26',
  },
  {
    id: 2,
    shortLabel: { en: 'Tier 2', pl: 'Poziom 2' },
    adultTitle: { en: 'Dividers, Power & Sensors', pl: 'Dzielniki, Moc i Czujniki' },
    kidTitle: { en: 'Smart Gadgets', pl: 'Mądre Gadżety' },
    accent: '#2A7B9B',
  },
  {
    id: 3,
    shortLabel: { en: 'Tier 3', pl: 'Poziom 3' },
    adultTitle: { en: 'Transistors & Logic', pl: 'Tranzystory i Logika' },
    kidTitle: { en: 'Magic Boosters', pl: 'Magiczne Wzmacniacze' },
    accent: '#6E52A8',
  },
  {
    id: 4,
    shortLabel: { en: 'Tier 4', pl: 'Poziom 4' },
    adultTitle: { en: 'Time, AC & RF Resonance', pl: 'Czas, AC i Rezonans RF' },
    kidTitle: { en: 'Glows & Waves', pl: 'Świetliki i Fale' },
    accent: '#1C8A7C',
  },
];

export const ADULT_LEVELS: LevelDefinition[] = [
  ...TIER1_LEVELS,
  ...TIER2_LEVELS,
  ...TIER3_LEVELS,
  ...TIER4_LEVELS,
];

export { KID_MISSIONS, ADULT_SANDBOX, KID_SANDBOX };

// Register Electronics as the first active STEM module + placeholder roadmap modules
stemRegistry.register({
  id: 'electronics',
  name: { en: 'DC/AC Electronics', pl: 'Elektronika DC/AC' },
  tagline: {
    en: 'Tiers 1–4: DC, Sensors, Transistors, Timers & RF',
    pl: 'Poziomy 1–4: DC, Czujniki, Tranzystory, Timery i RF',
  },
  status: 'active',
  accentColor: '#D96528',
  adultLevels: ADULT_LEVELS,
  kidMissions: KID_MISSIONS,
  adultSandbox: ADULT_SANDBOX,
  kidSandbox: KID_SANDBOX,
});

stemRegistry.register({
  id: 'chemistry',
  name: { en: 'Reaction Lab', pl: 'Laboratorium Chemii' },
  tagline: {
    en: 'Molecules, Energy & Reactions (Planned)',
    pl: 'Cząsteczki, Energia i Reakcje (W planach)',
  },
  status: 'coming-soon',
  accentColor: '#2B8A78',
  adultLevels: [],
  kidMissions: [],
  adultSandbox: ADULT_SANDBOX,
  kidSandbox: KID_SANDBOX,
});
