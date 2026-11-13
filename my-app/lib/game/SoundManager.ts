import { loadMutedPreference, saveMutedPreference } from "./storage";

type OscillatorKind = OscillatorType;

interface ToneOptions {
  type?: OscillatorKind;
  gain?: number;
  endFrequency?: number;
  delay?: number;
  attack?: number;
}

interface NoiseOptions {
  gain?: number;
  freqStart?: number;
  freqEnd?: number;
  q?: number;
  delay?: number;
  filter?: BiquadFilterType;
}

const NOISE_SECONDS = 1;

function midiToFrequency(note: number): number {
  return 440 * Math.pow(2, (note - 69) / 12);
}

class SoundManager {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private noiseBuffer: AudioBuffer | null = null;
  private muted = false;
  private musicTimer: number | null = null;
  private musicStep = 0;
  private nextNoteTime = 0;

  loadPrefs(): void {
    this.muted = loadMutedPreference();
    if (this.master && this.ctx) {
      this.master.gain.setTargetAtTime(this.muted ? 0 : 0.85, this.ctx.currentTime, 0.02);
    }
  }

  isMuted(): boolean {
    return this.muted;
  }

  toggle(): boolean {
    this.setMuted(!this.muted);
    return this.muted;
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
    saveMutedPreference(muted);
    if (this.ctx && this.master) {
      this.master.gain.setTargetAtTime(muted ? 0 : 0.85, this.ctx.currentTime, 0.03);
    }
  }

  private ensure(): AudioContext | null {
    if (typeof window === "undefined") return null;

    if (!this.ctx) {
      const AudioContextCtor =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

      if (!AudioContextCtor) return null;

      this.ctx = new AudioContextCtor();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.muted ? 0 : 0.85;
      this.master.connect(this.ctx.destination);

      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = 0.16;
      this.musicGain.connect(this.master);

      this.noiseBuffer = this.createNoiseBuffer(this.ctx);
    }

    if (this.ctx.state === "suspended") {
      void this.ctx.resume();
    }

    return this.ctx;
  }

  private createNoiseBuffer(ctx: AudioContext): AudioBuffer {
    const buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * NOISE_SECONDS), ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i += 1) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  private tone(frequency: number, duration: number, options: ToneOptions = {}): void {
    const ctx = this.ensure();
    if (!ctx || !this.master) return;

    const {
      type = "sine",
      gain = 0.18,
      endFrequency,
      delay = 0,
      attack = 0.01,
    } = options;

    const start = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const envelope = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(Math.max(1, frequency), start);
    if (endFrequency !== undefined) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(1, endFrequency), start + duration);
    }

    envelope.gain.setValueAtTime(0.0001, start);
    envelope.gain.exponentialRampToValueAtTime(Math.max(0.0002, gain), start + attack);
    envelope.gain.exponentialRampToValueAtTime(0.0001, start + duration);

    osc.connect(envelope);
    envelope.connect(this.master);
    osc.start(start);
    osc.stop(start + duration + 0.03);
  }

  private noise(duration: number, options: NoiseOptions = {}): void {
    const ctx = this.ensure();
    if (!ctx || !this.master || !this.noiseBuffer) return;

    const {
      gain = 0.2,
      freqStart = 1800,
      freqEnd = 300,
      q = 0.9,
      delay = 0,
      filter = "bandpass",
    } = options;

    const start = ctx.currentTime + delay;
    const source = ctx.createBufferSource();
    source.buffer = this.noiseBuffer;

    const biquad = ctx.createBiquadFilter();
    biquad.type = filter;
    biquad.Q.value = q;
    biquad.frequency.setValueAtTime(Math.max(20, freqStart), start);
    biquad.frequency.exponentialRampToValueAtTime(Math.max(20, freqEnd), start + duration);

    const envelope = ctx.createGain();
    envelope.gain.setValueAtTime(0.0001, start);
    envelope.gain.exponentialRampToValueAtTime(Math.max(0.0002, gain), start + 0.012);
    envelope.gain.exponentialRampToValueAtTime(0.0001, start + duration);

    source.connect(biquad);
    biquad.connect(envelope);
    envelope.connect(this.master);
    source.start(start);
    source.stop(start + duration + 0.03);
  }

  click(): void {
    this.tone(760, 0.07, { type: "triangle", gain: 0.12 });
    this.tone(1180, 0.05, { type: "sine", gain: 0.06, delay: 0.02 });
  }

  slice(): void {
    const base = 500 + Math.random() * 260;
    this.noise(0.14, { gain: 0.22, freqStart: 2600, freqEnd: 700, q: 0.7 });
    this.tone(base, 0.12, {
      type: "triangle",
      gain: 0.13,
      endFrequency: base * 0.42,
    });
    this.tone(base * 1.8, 0.08, {
      type: "sine",
      gain: 0.05,
      endFrequency: base * 0.9,
      delay: 0.01,
    });
  }

  fall(): void {
    this.tone(320, 0.3, { type: "sine", gain: 0.16, endFrequency: 110 });
    this.tone(160, 0.35, { type: "triangle", gain: 0.08, endFrequency: 70, delay: 0.03 });
  }

  combo(): void {
    const notes = [660, 880, 1174];
    notes.forEach((note, index) => {
      this.tone(note, 0.16, {
        type: "triangle",
        gain: 0.12,
        delay: index * 0.055,
      });
    });
  }

  bomb(): void {
    this.noise(0.65, { gain: 0.55, freqStart: 1200, freqEnd: 60, q: 0.4, filter: "lowpass" });
    this.noise(0.32, { gain: 0.32, freqStart: 3200, freqEnd: 220, q: 0.6 });
    this.tone(150, 0.55, { type: "sine", gain: 0.35, endFrequency: 28 });
    this.tone(90, 0.7, { type: "triangle", gain: 0.22, endFrequency: 22, delay: 0.03 });
  }

  gameOver(): void {
    const notes = [523.25, 440, 349.23, 261.63];
    notes.forEach((note, index) => {
      this.tone(note, 0.42, {
        type: "triangle",
        gain: 0.14,
        delay: index * 0.16,
        endFrequency: note * 0.94,
      });
    });
    this.tone(130.81, 0.9, { type: "sine", gain: 0.16, endFrequency: 65, delay: 0.2 });
  }

  startMusic(): void {
    if (this.musicTimer !== null) return;
    const ctx = this.ensure();
    if (!ctx) return;

    this.musicStep = 0;
    this.nextNoteTime = ctx.currentTime + 0.15;

    const tick = () => {
      const activeCtx = this.ctx;
      if (!activeCtx) return;

      while (this.nextNoteTime < activeCtx.currentTime + 0.4) {
        if (!this.muted) {
          this.scheduleMusicStep(this.musicStep, this.nextNoteTime);
        }
        this.musicStep = (this.musicStep + 1) % 32;
        this.nextNoteTime += 0.27;
      }
    };

    tick();
    this.musicTimer = window.setInterval(tick, 120);
  }

  stopMusic(): void {
    if (this.musicTimer !== null) {
      window.clearInterval(this.musicTimer);
      this.musicTimer = null;
    }
  }

  private scheduleMusicStep(step: number, time: number): void {
    const ctx = this.ctx;
    const output = this.musicGain;
    if (!ctx || !output) return;

    const arpeggio = [
      69, 72, 76, 81, 76, 72, 69, 67,
      65, 69, 72, 77, 72, 69, 65, 64,
      67, 71, 74, 79, 74, 71, 67, 65,
      64, 67, 71, 76, 71, 67, 64, 62,
    ];
    const bass = [45, 45, 41, 41, 48, 48, 43, 43];

    const note = arpeggio[step];
    const frequency = midiToFrequency(note);

    const osc = ctx.createOscillator();
    const envelope = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(frequency, time);
    envelope.gain.setValueAtTime(0.0001, time);
    envelope.gain.exponentialRampToValueAtTime(0.055, time + 0.03);
    envelope.gain.exponentialRampToValueAtTime(0.0001, time + 0.24);
    osc.connect(envelope);
    envelope.connect(output);
    osc.start(time);
    osc.stop(time + 0.27);

    if (step % 4 === 0) {
      const bassNote = bass[Math.floor(step / 4)];
      const bassFrequency = midiToFrequency(bassNote);
      const bassOsc = ctx.createOscillator();
      const bassEnvelope = ctx.createGain();
      bassOsc.type = "sine";
      bassOsc.frequency.setValueAtTime(bassFrequency, time);
      bassEnvelope.gain.setValueAtTime(0.0001, time);
      bassEnvelope.gain.exponentialRampToValueAtTime(0.085, time + 0.04);
      bassEnvelope.gain.exponentialRampToValueAtTime(0.0001, time + 0.9);
      bassOsc.connect(bassEnvelope);
      bassEnvelope.connect(output);
      bassOsc.start(time);
      bassOsc.stop(time + 0.95);
    }
  }
}

export const soundManager = new SoundManager();
