/**
 * Browser-native Sound Synthesizer using AudioContext.
 * Emulates scribbling on paper, ballpoint clicks, dings, and buzzers.
 */

class SoundEngine {
  private ctx: AudioContext | null = null;
  private muted: boolean = false;

  constructor() {
    // Lazy-loaded context on user interaction to abide by autoplay rules
  }

  private initCtx() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  get isMuted(): boolean {
    return this.muted;
  }

  toggleMuted(): boolean {
    this.muted = !this.muted;
    return this.muted;
  }

  /**
   * Play a pen/pencil scribble drawing sound
   */
  playScribble() {
    if (this.muted) return;
    try {
      this.initCtx();
      const context = this.ctx!;
      
      const bufferSize = context.sampleRate * 0.12; // 120ms scribble
      const buffer = context.createBuffer(1, bufferSize, context.sampleRate);
      const data = buffer.getChannelData(0);
      
      // Generate bandpass white-noise like bursts to simulate graphite scratch
      for (let i = 0; i < bufferSize; i++) {
        // High frequency noise
        const noise = Math.random() * 2 - 1;
        // Modulate amplitude to simulate quick pencil stroke
        const progress = i / bufferSize;
        const env = Math.sin(progress * Math.PI) * (1 - progress);
        data[i] = noise * env * 0.15;
      }

      const noiseNode = context.createBufferSource();
      noiseNode.buffer = buffer;

      // Filter to emulate the dry rasp of paper
      const filter = context.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(2200, context.currentTime);
      filter.Q.setValueAtTime(3.0, context.currentTime);

      const gain = context.createGain();
      gain.gain.setValueAtTime(1.0, context.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.11);

      noiseNode.connect(filter);
      filter.connect(gain);
      gain.connect(context.destination);

      noiseNode.start();
    } catch (e) {
      console.warn('Audio Context error playing scribble:', e);
    }
  }

  /**
   * Play a ballpoint pen click
   */
  playPenClick() {
    if (this.muted) return;
    try {
      this.initCtx();
      const context = this.ctx!;
      const t = context.currentTime;

      // Very high frequency snap + small low decay resonance
      const osc = context.createOscillator();
      const gain = context.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(1800, t);
      osc.frequency.exponentialRampToValueAtTime(300, t + 0.03);

      gain.gain.setValueAtTime(0.12, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);

      osc.connect(gain);
      gain.connect(context.destination);

      osc.start(t);
      osc.stop(t + 0.05);
    } catch (e) {
      console.warn(e);
    }
  }

  /**
   * Play a cute bell chime for correct answers
   */
  playSuccess() {
    if (this.muted) return;
    try {
      this.initCtx();
      const context = this.ctx!;
      const t = context.currentTime;

      // Harmonious double-chime (C5 and E5 / G5 arpeggio)
      const osc1 = context.createOscillator();
      const osc2 = context.createOscillator();
      const gain1 = context.createGain();
      const gain2 = context.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(523.25, t); // C5
      osc1.frequency.exponentialRampToValueAtTime(530, t + 0.15);

      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(659.25, t + 0.05); // E5
      osc2.frequency.exponentialRampToValueAtTime(665, t + 0.25);

      gain1.gain.setValueAtTime(0.12, t);
      gain1.gain.exponentialRampToValueAtTime(0.001, t + 0.2);

      gain2.gain.setValueAtTime(0.12, t + 0.05);
      gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.3);

      osc1.connect(gain1);
      gain1.connect(context.destination);

      osc2.connect(gain2);
      gain2.connect(context.destination);

      osc1.start(t);
      osc1.stop(t + 0.25);

      osc2.start(t + 0.05);
      osc2.stop(t + 0.45);
    } catch (e) {
      console.warn(e);
    }
  }

  /**
   * Play a sad buzzy scratch for wrong answers
   */
  playFailure() {
    if (this.muted) return;
    try {
      this.initCtx();
      const context = this.ctx!;
      const t = context.currentTime;

      const osc = context.createOscillator();
      const filter = context.createBiquadFilter();
      const gain = context.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(140, t);
      osc.frequency.linearRampToValueAtTime(80, t + 0.25);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(350, t);

      gain.gain.setValueAtTime(0.15, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(context.destination);

      osc.start(t);
      osc.stop(t + 0.35);
    } catch (e) {
      console.warn(e);
    }
  }

  /**
   * Speed countdown tick mark
   */
  playTick() {
    if (this.muted) return;
    try {
      this.initCtx();
      const context = this.ctx!;
      const t = context.currentTime;

      const osc = context.createOscillator();
      const gain = context.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, t); // clean tick

      gain.gain.setValueAtTime(0.08, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);

      osc.connect(gain);
      gain.connect(context.destination);

      osc.start(t);
      osc.stop(t + 0.08);
    } catch (e) {
      console.warn(e);
    }
  }

  /**
   * Triumph arpeggio celebrating advancement
   */
  playRoundUnlock() {
    if (this.muted) return;
    try {
      this.initCtx();
      const context = this.ctx!;
      const t = context.currentTime;

      // Unlocks a rising major scale sequence (C5 -> E5 -> G5 -> C6)
      const freqs = [523.25, 659.25, 783.99, 1046.50];
      
      freqs.forEach((freq, idx) => {
        const osc = context.createOscillator();
        const gain = context.createGain();
        const noteStart = t + idx * 0.12;

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, noteStart);

        gain.gain.setValueAtTime(0.1, noteStart);
        gain.gain.exponentialRampToValueAtTime(0.001, noteStart + 0.25);

        osc.connect(gain);
        gain.connect(context.destination);

        osc.start(noteStart);
        osc.stop(noteStart + 0.3);
      });
    } catch (e) {
      console.warn(e);
    }
  }
}

export const soundEngine = new SoundEngine();
