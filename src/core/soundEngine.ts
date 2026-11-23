/**
 * Procedural Web Audio synthesizer for tactile electronics sound effects.
 * Zero external audio assets required; works offline in PWA mode and reacts live
 * to physical circuit voltages and currents.
 */
class SoundEngine {
  private ctx: AudioContext | null = null;
  private muted = false;

  // Continuous voltage-reactive load oscillators
  private buzzerOsc: OscillatorNode | null = null;
  private buzzerGain: GainNode | null = null;
  private motorOsc: OscillatorNode | null = null;
  private motorSubOsc: OscillatorNode | null = null;
  private motorGain: GainNode | null = null;

  setMuted(muted: boolean): void {
    this.muted = muted;
    if (muted) {
      this.silenceContinuousLoads();
    }
  }

  isMuted(): boolean {
    return this.muted;
  }

  private ensureContext(): AudioContext | null {
    if (this.muted) return null;
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  /** Crisp breadboard socket pin insertion snap */
  playPinSnap(pitchScale = 1): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(520 * pitchScale, now);
    osc.frequency.exponentialRampToValueAtTime(190 * pitchScale, now + 0.045);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.16, now + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.055);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.06);
  }

  /** Tactile mechanical toggle/push switch click */
  playSwitchClick(closed: boolean): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    const startFreq = closed ? 1150 : 780;
    const endFreq = closed ? 460 : 320;
    osc.frequency.setValueAtTime(startFreq, now);
    osc.frequency.exponentialRampToValueAtTime(endFreq, now + 0.025);

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = closed ? 1600 : 1100;
    filter.Q.value = 2.2;

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.035);
  }

  /** Soft remove / unplug thock */
  playUnplug(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(280, now);
    osc.frequency.exponentialRampToValueAtTime(120, now + 0.055);
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.065);
  }

  /** Clean digital multimeter probe blip */
  playProbeBeep(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(2048, now);
    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.065);
  }

  /** Crisp LED pop + sizzle (or playful cartoon poof in Kid Mode) */
  playLedPop(isKidMode: boolean): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    // Pop transient
    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();
    osc.type = isKidMode ? 'sine' : 'sawtooth';
    osc.frequency.setValueAtTime(isKidMode ? 480 : 620, now);
    osc.frequency.exponentialRampToValueAtTime(isKidMode ? 120 : 65, now + (isKidMode ? 0.14 : 0.07));
    oscGain.gain.setValueAtTime(0.24, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + (isKidMode ? 0.16 : 0.08));
    osc.connect(oscGain);
    oscGain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.17);

    // Filtered noise puff/sizzle
    const bufLen = Math.floor(ctx.sampleRate * 0.22);
    const buffer = ctx.createBuffer(1, bufLen, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufLen; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufLen * 0.35));
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = isKidMode ? 'lowpass' : 'highpass';
    filter.frequency.value = isKidMode ? 900 : 1800;

    const nGain = ctx.createGain();
    nGain.gain.setValueAtTime(0.18, now);
    nGain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

    noise.connect(filter);
    filter.connect(nGain);
    nGain.connect(ctx.destination);
    noise.start(now);
  }

  /** Short circuit electric crackle warning */
  playShortSpark(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.linearRampToValueAtTime(95, now + 0.14);
    gain.gain.setValueAtTime(0.14, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.16);
  }

  /** Warm celebratory chime when a puzzle or mission is solved */
  playSuccessChime(isKidMode: boolean): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const notes = isKidMode ? [523.25, 659.25, 783.99, 1046.5] : [440, 554.37, 659.25, 880];

    notes.forEach((freq, idx) => {
      const t = now + idx * 0.085;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(0.15, t + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.36);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.38);
    });
  }

  /**
   * Smoothly updates continuous motor whirr and piezo buzzer tone based on live simulation.
   */
  updateContinuousLoads(motorSpeedAbs: number, buzzerIntensity: number): void {
    if (this.muted || !this.ctx || this.ctx.state !== 'running') {
      this.silenceContinuousLoads();
      return;
    }
    const ctx = this.ctx;
    const now = ctx.currentTime;

    // Piezo buzzer tone
    if (buzzerIntensity > 0.05) {
      if (!this.buzzerOsc || !this.buzzerGain) {
        this.buzzerOsc = ctx.createOscillator();
        this.buzzerGain = ctx.createGain();
        this.buzzerOsc.type = 'triangle';
        this.buzzerGain.gain.setValueAtTime(0.0001, now);
        this.buzzerOsc.connect(this.buzzerGain);
        this.buzzerGain.connect(ctx.destination);
        this.buzzerOsc.start(now);
      }
      const targetFreq = 720 + Math.min(1, buzzerIntensity) * 260;
      const targetGain = Math.min(0.075, 0.025 + buzzerIntensity * 0.045);
      this.buzzerOsc.frequency.setTargetAtTime(targetFreq, now, 0.04);
      this.buzzerGain.gain.setTargetAtTime(targetGain, now, 0.04);
    } else if (this.buzzerGain) {
      this.buzzerGain.gain.setTargetAtTime(0.0001, now, 0.03);
    }

    // Hobby DC motor gentle mechanical whirr
    if (motorSpeedAbs > 0.08) {
      if (!this.motorOsc || !this.motorSubOsc || !this.motorGain) {
        this.motorOsc = ctx.createOscillator();
        this.motorSubOsc = ctx.createOscillator();
        this.motorGain = ctx.createGain();
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 340;

        this.motorOsc.type = 'sawtooth';
        this.motorSubOsc.type = 'triangle';
        this.motorGain.gain.setValueAtTime(0.0001, now);

        this.motorOsc.connect(filter);
        this.motorSubOsc.connect(filter);
        filter.connect(this.motorGain);
        this.motorGain.connect(ctx.destination);
        this.motorOsc.start(now);
        this.motorSubOsc.start(now);
      }
      const baseHz = 78 + Math.min(1.5, motorSpeedAbs) * 95;
      this.motorOsc.frequency.setTargetAtTime(baseHz, now, 0.06);
      this.motorSubOsc.frequency.setTargetAtTime(baseHz * 1.5, now, 0.06);
      this.motorGain.gain.setTargetAtTime(Math.min(0.05, 0.015 + motorSpeedAbs * 0.028), now, 0.06);
    } else if (this.motorGain) {
      this.motorGain.gain.setTargetAtTime(0.0001, now, 0.04);
    }
  }

  silenceContinuousLoads(): void {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    if (this.buzzerGain) {
      this.buzzerGain.gain.setTargetAtTime(0.0001, now, 0.02);
    }
    if (this.motorGain) {
      this.motorGain.gain.setTargetAtTime(0.0001, now, 0.02);
    }
  }
}

export const soundEngine = new SoundEngine();
