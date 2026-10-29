/**
 * Retro Chiptune Web Audio Synthesizer (Deluxe Edition)
 * Produces 8-bit sound effects, procedural multi-track BGM, and Boss Battle themes.
 */
class SoundEngine {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.bgmPlaying = false;
    this.bgmMode = 'normal'; // 'normal' or 'boss'
    this.bgmInterval = null;
    this.tempo = 145; // BPM
    this.currentStep = 0;
    this.masterGain = null;

    // Load mute preference
    const savedMute = localStorage.getItem('flavio_fuga_muted');
    if (savedMute !== null) {
      this.muted = savedMute === 'true';
    }
  }

  init() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContext();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.muted ? 0 : 0.35, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    localStorage.setItem('flavio_fuga_muted', this.muted);
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.muted ? 0 : 0.35, this.ctx.currentTime);
    }
    return this.muted;
  }

  // --- Sound Effects (SFX) ---

  playShoot() {
    if (this.muted || !this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(850, now);
    osc.frequency.exponentialRampToValueAtTime(140, now + 0.12);

    gain.gain.setValueAtTime(0.28, now);
    gain.gain.linearRampToValueAtTime(0.01, now + 0.12);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.13);
  }

  playOrangePickup() {
    if (this.muted || !this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(523.25, now);
    osc.frequency.setValueAtTime(659.25, now + 0.05);
    osc.frequency.setValueAtTime(783.99, now + 0.10);
    osc.frequency.setValueAtTime(1046.50, now + 0.15);

    gain.gain.setValueAtTime(0.4, now);
    gain.gain.linearRampToValueAtTime(0.01, now + 0.25);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.26);
  }

  playChocPickup() {
    if (this.muted || !this.ctx) return;
    const now = this.ctx.currentTime;
    const notes = [440, 554.37, 659.25, 880, 1108.73];
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, now + idx * 0.05);

      gain.gain.setValueAtTime(0.25, now + idx * 0.05);
      gain.gain.linearRampToValueAtTime(0.01, now + idx * 0.05 + 0.1);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now + idx * 0.05);
      osc.stop(now + idx * 0.05 + 0.11);
    });
  }

  playPassportImmunity() {
    if (this.muted || !this.ctx) return;
    const now = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5, 1318.51, 1567.98];
    notes.forEach((f, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(f, now + i * 0.06);
      gain.gain.setValueAtTime(0.2, now + i * 0.06);
      gain.gain.linearRampToValueAtTime(0.01, now + i * 0.06 + 0.15);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now + i * 0.06);
      osc.stop(now + i * 0.06 + 0.16);
    });
  }

  playHit() {
    if (this.muted || !this.ctx) return;
    const now = this.ctx.currentTime;
    const bufferSize = this.ctx.sampleRate * 0.25;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1000, now);
    filter.frequency.linearRampToValueAtTime(100, now + 0.25);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.5, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    noise.start(now);
    noise.stop(now + 0.25);
  }

  playTurbo() {
    if (this.muted || !this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(950, now + 0.35);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.linearRampToValueAtTime(0.01, now + 0.4);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.4);
  }

  // --- Boss Sound Effects (Janones) ---

  playTweetChime() {
    if (this.muted || !this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1200, now);
    osc.frequency.setValueAtTime(1600, now + 0.08);

    gain.gain.setValueAtTime(0.35, now);
    gain.gain.linearRampToValueAtTime(0.01, now + 0.2);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.21);
  }

  playMegaphoneSiren() {
    if (this.muted || !this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(450, now);
    osc.frequency.linearRampToValueAtTime(800, now + 0.15);
    osc.frequency.linearRampToValueAtTime(450, now + 0.3);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.linearRampToValueAtTime(0.01, now + 0.35);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.36);
  }

  playDanoneSplash() {
    if (this.muted || !this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(280, now);
    osc.frequency.linearRampToValueAtTime(80, now + 0.15);

    gain.gain.setValueAtTime(0.4, now);
    gain.gain.linearRampToValueAtTime(0.01, now + 0.16);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.17);
  }

  playStageClear() {
    if (this.muted || !this.ctx) return;
    const now = this.ctx.currentTime;
    const notes = [
      { f: 523.25, d: 0.1 },
      { f: 659.25, d: 0.1 },
      { f: 783.99, d: 0.1 },
      { f: 1046.50, d: 0.25 },
      { f: 880.00, d: 0.15 },
      { f: 1046.50, d: 0.45 }
    ];
    let t = now;
    notes.forEach(n => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(n.f, t);
      gain.gain.setValueAtTime(0.35, t);
      gain.gain.linearRampToValueAtTime(0.01, t + n.d);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t);
      osc.stop(t + n.d + 0.02);
      t += n.d + 0.04;
    });
  }

  playGameOver() {
    if (this.muted || !this.ctx) return;
    const now = this.ctx.currentTime;
    const notes = [440, 415.3, 392, 349.23, 311.13, 261.63];
    notes.forEach((f, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(f, now + i * 0.15);
      gain.gain.setValueAtTime(0.3, now + i * 0.15);
      gain.gain.linearRampToValueAtTime(0.01, now + i * 0.15 + 0.2);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now + i * 0.15);
      osc.stop(now + i * 0.15 + 0.22);
    });
  }

  playVictory() {
    if (this.muted || !this.ctx) return;
    const now = this.ctx.currentTime;
    const melody = [
      { f: 523.25, d: 0.12 },
      { f: 523.25, d: 0.12 },
      { f: 523.25, d: 0.12 },
      { f: 659.25, d: 0.25 },
      { f: 783.99, d: 0.25 },
      { f: 1046.50, d: 0.45 },
      { f: 783.99, d: 0.15 },
      { f: 1046.50, d: 0.6 }
    ];

    let t = now;
    melody.forEach(item => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(item.f, t);
      gain.gain.setValueAtTime(0.35, t);
      gain.gain.linearRampToValueAtTime(0.01, t + item.d);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t);
      osc.stop(t + item.d + 0.02);
      t += item.d + 0.05;
    });
  }

  // --- Procedural 8-bit Background Music (BGM) ---

  startBGM(mode = 'normal') {
    this.bgmMode = mode;
    if (this.bgmPlaying) {
      this.stopBGM();
    }
    this.bgmPlaying = true;
    this.currentStep = 0;

    // Normal Flight Melody
    const melodyNormal = [
      392.00, 392.00, 0, 392.00, 440.00, 392.00, 523.25, 493.88,
      392.00, 392.00, 0, 392.00, 440.00, 392.00, 587.33, 523.25,
      392.00, 392.00, 0, 783.99, 659.25, 523.25, 493.88, 440.00,
      698.46, 698.46, 0, 659.25, 523.25, 587.33, 523.25, 0
    ];

    const bassNormal = [
      130.81, 130.81, 196.00, 130.81, 174.61, 174.61, 220.00, 174.61,
      130.81, 130.81, 196.00, 130.81, 196.00, 196.00, 246.94, 196.00,
      130.81, 130.81, 196.00, 130.81, 164.81, 164.81, 220.00, 164.81,
      174.61, 174.61, 196.00, 196.00, 130.81, 130.81, 196.00, 130.81
    ];

    // Dramatic Boss Theme (Marechal Janones Battle)
    const melodyBoss = [
      293.66, 311.13, 293.66, 261.63, 293.66, 349.23, 329.63, 293.66,
      311.13, 329.63, 349.23, 392.00, 349.23, 329.63, 311.13, 293.66,
      587.33, 523.25, 493.88, 440.00, 523.25, 493.88, 440.00, 392.00,
      440.00, 493.88, 523.25, 587.33, 622.25, 587.33, 523.25, 493.88
    ];

    const bassBoss = [
      73.42, 73.42, 146.83, 73.42, 82.41, 82.41, 164.81, 82.41,
      87.31, 87.31, 174.61, 87.31, 98.00, 98.00, 196.00, 98.00,
      73.42, 73.42, 146.83, 73.42, 82.41, 82.41, 164.81, 82.41,
      87.31, 87.31, 174.61, 87.31, 98.00, 98.00, 196.00, 98.00
    ];

    const melodyNotes = mode === 'boss' ? melodyBoss : melodyNormal;
    const bassNotes = mode === 'boss' ? bassBoss : bassNormal;
    const effectiveTempo = mode === 'boss' ? 168 : this.tempo;
    const stepDuration = (60 / effectiveTempo) / 2;

    this.bgmInterval = setInterval(() => {
      if (!this.muted && this.ctx && this.bgmPlaying) {
        const now = this.ctx.currentTime;
        const noteIdx = this.currentStep % melodyNotes.length;

        // Lead
        const leadFreq = melodyNotes[noteIdx];
        if (leadFreq > 0) {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = mode === 'boss' ? 'sawtooth' : 'square';
          osc.frequency.setValueAtTime(leadFreq, now);
          gain.gain.setValueAtTime(mode === 'boss' ? 0.16 : 0.12, now);
          gain.gain.exponentialRampToValueAtTime(0.01, now + stepDuration * 0.85);
          osc.connect(gain);
          gain.connect(this.masterGain);
          osc.start(now);
          osc.stop(now + stepDuration * 0.9);
        }

        // Bass
        const bassFreq = bassNotes[noteIdx];
        if (bassFreq > 0) {
          const bassOsc = this.ctx.createOscillator();
          const bassGain = this.ctx.createGain();
          bassOsc.type = 'triangle';
          bassOsc.frequency.setValueAtTime(bassFreq, now);
          bassGain.gain.setValueAtTime(0.2, now);
          bassGain.gain.exponentialRampToValueAtTime(0.01, now + stepDuration * 0.95);
          bassOsc.connect(bassGain);
          bassGain.connect(this.masterGain);
          bassOsc.start(now);
          bassOsc.stop(now + stepDuration);
        }

        // Percussion tick
        if (noteIdx % 2 === 1) {
          const bufferSize = this.ctx.sampleRate * 0.03;
          const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
          const data = buffer.getChannelData(0);
          for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
          }
          const noise = this.ctx.createBufferSource();
          noise.buffer = buffer;
          const noiseGain = this.ctx.createGain();
          noiseGain.gain.setValueAtTime(noteIdx % 4 === 1 ? 0.05 : 0.09, now);
          noise.connect(noiseGain);
          noiseGain.connect(this.masterGain);
          noise.start(now);
          noise.stop(now + 0.03);
        }
      }
      this.currentStep++;
    }, stepDuration * 1000);
  }

  stopBGM() {
    this.bgmPlaying = false;
    if (this.bgmInterval) {
      clearInterval(this.bgmInterval);
      this.bgmInterval = null;
    }
  }
}

// Global Sound Instance
window.sound = new SoundEngine();
