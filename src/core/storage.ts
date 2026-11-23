import type { AppMode } from '../engine/types';

export interface SavedProgress {
  mode: AppMode;
  muted: boolean;
  /** Map from levelId -> best stars earned (1..3) */
  completed: Record<string, number>;
}

const STORAGE_KEY = 'ecircutry_progress_v1';

const DEFAULT_PROGRESS: SavedProgress = {
  mode: 'adult',
  muted: false,
  completed: {},
};

export function loadProgress(): SavedProgress {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_PROGRESS, completed: {} };
    const parsed = JSON.parse(raw) as Partial<SavedProgress>;
    return {
      mode: parsed.mode === 'kid' ? 'kid' : 'adult',
      muted: Boolean(parsed.muted),
      completed: parsed.completed && typeof parsed.completed === 'object' ? parsed.completed : {},
    };
  } catch {
    return { ...DEFAULT_PROGRESS, completed: {} };
  }
}

export function saveProgress(progress: SavedProgress): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch {
    // Ignore storage quota / private-mode errors
  }
}
