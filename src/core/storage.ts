import type { AppMode } from '../engine/types';
import { detectInitialLanguage, type Language } from './i18n';

export interface SavedProgress {
  mode: AppMode;
  lang: Language;
  muted: boolean;
  voiceEnabled: boolean;
  /** Map from levelId -> best stars earned (1..3) */
  completed: Record<string, number>;
}

const STORAGE_KEY = 'ecircutry_progress_v1';

export function loadProgress(): SavedProgress {
  const fallbackLang = detectInitialLanguage();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {
        mode: 'adult',
        lang: fallbackLang,
        muted: false,
        voiceEnabled: true,
        completed: {},
      };
    }
    const parsed = JSON.parse(raw) as Partial<SavedProgress>;
    return {
      mode: parsed.mode === 'kid' ? 'kid' : 'adult',
      lang: parsed.lang === 'pl' || parsed.lang === 'en' ? parsed.lang : fallbackLang,
      muted: Boolean(parsed.muted),
      voiceEnabled: parsed.voiceEnabled === undefined ? true : Boolean(parsed.voiceEnabled),
      completed: parsed.completed && typeof parsed.completed === 'object' ? parsed.completed : {},
    };
  } catch {
    return {
      mode: 'adult',
      lang: fallbackLang,
      muted: false,
      voiceEnabled: true,
      completed: {},
    };
  }
}

export function saveProgress(progress: SavedProgress): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch {
    // Ignore storage quota / private-mode errors
  }
}
