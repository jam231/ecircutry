import type { Language } from './i18n';

type Listener = (speaking: boolean) => void;

const PREFERRED_VOICES: Record<Language, string[]> = {
  pl: ['zosia', 'paulina', 'ewa', 'maja', 'agnieszka', 'krzysztof', 'google polski', 'pl-pl'],
  en: ['samantha', 'karen', 'daniel', 'moira', 'google us english', 'google uk english', 'en-us', 'en-gb'],
};

/**
 * Bilingual Web Speech API narrator supporting natural Polish (pl-PL) and English (en-US)
 * voice selection, iOS/iPadOS gesture unlocking, speaking-state subscriptions, and cooldowns.
 */
class VoiceNarrator {
  private enabled = true;
  private muted = false;
  private speaking = false;
  private voices: SpeechSynthesisVoice[] = [];
  private listeners = new Set<Listener>();
  private lastAutoKey = '';
  private lastAutoTime = 0;

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.refreshVoices();
      window.speechSynthesis.addEventListener?.('voiceschanged', () => this.refreshVoices());
    }
  }

  isSupported(): boolean {
    return typeof window !== 'undefined' && 'speechSynthesis' in window && typeof SpeechSynthesisUtterance !== 'undefined';
  }

  private refreshVoices(): void {
    if (!this.isSupported()) return;
    const list = window.speechSynthesis.getVoices();
    if (list.length > 0) {
      this.voices = list;
    }
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (!enabled) {
      this.stop();
    }
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
    if (muted) {
      this.stop();
    }
  }

  isSpeaking(): boolean {
    return this.speaking;
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private setSpeaking(val: boolean): void {
    if (this.speaking === val) return;
    this.speaking = val;
    this.listeners.forEach((fn) => fn(val));
  }

  private selectVoice(lang: Language): SpeechSynthesisVoice | null {
    if (this.voices.length === 0) {
      this.refreshVoices();
    }
    const prefix = lang === 'pl' ? 'pl' : 'en';
    const matching = this.voices.filter((v) => v.lang.toLowerCase().startsWith(prefix));
    if (matching.length === 0) return null;

    const prefs = PREFERRED_VOICES[lang];
    // Score each candidate voice so enhanced / natural voices win on iOS, macOS, Android, Chrome
    let best = matching[0];
    let bestScore = -1;

    for (const v of matching) {
      const lowerName = v.name.toLowerCase();
      const lowerLang = v.lang.toLowerCase();
      let score = 0;
      if (lowerName.includes('enhanced') || lowerName.includes('premium') || lowerName.includes('natural')) {
        score += 40;
      }
      if (v.localService) score += 10;
      const prefIdx = prefs.findIndex((p) => lowerName.includes(p) || lowerLang.includes(p));
      if (prefIdx >= 0) {
        score += 30 - prefIdx * 2;
      }
      if (lang === 'pl' && lowerLang === 'pl-pl') score += 15;
      if (lang === 'en' && (lowerLang === 'en-us' || lowerLang === 'en-gb')) score += 10;
      if (score > bestScore) {
        bestScore = score;
        best = v;
      }
    }

    return best;
  }

  /**
   * Speaks text immediately in the selected language.
   * `manual: true` bypasses the auto-narration toggle (still respects global mute).
   */
  speak(
    text: string,
    lang: Language,
    options: { isKidMode?: boolean; manual?: boolean; dedupeKey?: string; cooldownMs?: number } = {}
  ): void {
    if (!this.isSupported() || this.muted) return;
    if (!options.manual && !this.enabled) return;

    const clean = text.trim();
    if (!clean) return;

    // Prevent rapid repeated auto-narration of the same diagnostic event
    if (!options.manual && options.dedupeKey) {
      const now = Date.now();
      const cooldown = options.cooldownMs ?? 3500;
      if (this.lastAutoKey === options.dedupeKey && now - this.lastAutoTime < cooldown) {
        return;
      }
      this.lastAutoKey = options.dedupeKey;
      this.lastAutoTime = now;
    }

    try {
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(clean);
      utter.lang = lang === 'pl' ? 'pl-PL' : 'en-US';
      const voice = this.selectVoice(lang);
      if (voice) {
        utter.voice = voice;
      }
      utter.rate = options.isKidMode ? 0.94 : 1.02;
      utter.pitch = options.isKidMode ? 1.08 : 1.0;
      utter.volume = 1.0;

      utter.onstart = () => this.setSpeaking(true);
      utter.onend = () => this.setSpeaking(false);
      utter.onerror = () => this.setSpeaking(false);

      window.speechSynthesis.speak(utter);
    } catch {
      this.setSpeaking(false);
    }
  }

  stop(): void {
    if (!this.isSupported()) return;
    try {
      window.speechSynthesis.cancel();
    } catch {
      // Ignore browser quirks
    }
    this.setSpeaking(false);
  }
}

export const narrator = new VoiceNarrator();
