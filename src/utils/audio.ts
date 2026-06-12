// Web Audio API Synthesizer for alerts (no external MP3 required)
class AudioSynth {
  private ctx: AudioContext | null = null;

  private init() {
    if (!this.ctx) {
      // @ts-ignore
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // Play a beautiful dual-tone chime for general alerts/warnings
  playChime() {
    try {
      this.init();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      
      // Tone 1: High crisp notification pitch (880Hz - A5)
      const osc1 = this.ctx.createOscillator();
      const gain1 = this.ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(880, now);
      
      // Tone 2: Harmonious third (1109.73Hz - C#6)
      const osc2 = this.ctx.createOscillator();
      const gain2 = this.ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(1109.73, now + 0.08);

      // Connect components and define clean volume envelope
      gain1.gain.setValueAtTime(0.15, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
      
      gain2.gain.setValueAtTime(0.12, now + 0.08);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.8);

      osc1.connect(gain1);
      gain1.connect(this.ctx.destination);
      
      osc2.connect(gain2);
      gain2.connect(this.ctx.destination);

      osc1.start(now);
      osc1.stop(now + 0.6);

      osc2.start(now + 0.08);
      osc2.stop(now + 0.8);
    } catch (e) {
      console.warn('Audio Synth output failed:', e);
    }
  }

  // Play success tone
  playSuccess() {
    try {
      this.init();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.setValueAtTime(659.25, now + 0.1); // E5
      osc.frequency.setValueAtTime(783.99, now + 0.2); // G5
      osc.frequency.setValueAtTime(1046.50, now + 0.3); // C6

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.6);
    } catch (e) {
      console.warn('Audio Synth output failed:', e);
    }
  }

  // Play warning / danger low frequency buzzer
  playWarning() {
    try {
      this.init();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, now); // A3
      osc.frequency.setValueAtTime(196, now + 0.15); // G3

      // Lowpass filter to make the buzzer warmer and premium, not too aggressive
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1000, now);

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.5);
    } catch (e) {
      console.warn('Audio Synth output failed:', e);
    }
  }
}

export const synth = new AudioSynth();
