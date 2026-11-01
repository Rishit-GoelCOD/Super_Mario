// NES 8-bit Square Wave Audio Synthesizer via Web Audio API

class NESAudioEngine {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.bgmPlaying = false;
    this.bgmTimer = null;
    this.bgmIndex = 0;

    // Classic Super Mario Bros theme melody frequencies & durations
    this.bgmNotes = [
      { f: 659, d: 0.14 }, { f: 659, d: 0.14 }, { f: 0, d: 0.14 }, { f: 659, d: 0.14 },
      { f: 0, d: 0.14 }, { f: 523, d: 0.14 }, { f: 659, d: 0.28 }, { f: 784, d: 0.28 },
      { f: 0, d: 0.28 }, { f: 392, d: 0.28 }, { f: 0, d: 0.28 },
      { f: 523, d: 0.21 }, { f: 0, d: 0.07 }, { f: 392, d: 0.21 }, { f: 0, d: 0.07 }, { f: 330, d: 0.28 },
      { f: 440, d: 0.21 }, { f: 494, d: 0.21 }, { f: 466, d: 0.14 }, { f: 440, d: 0.28 }
    ];
  }

  init() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.ctx = new AudioContext();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    const btn = document.getElementById('btn-audio-toggle');
    if (btn) {
      btn.textContent = `AUDIO: ${this.muted ? 'MUTED' : 'ON'}`;
      btn.style.color = this.muted ? '#ff5555' : '#fff';
    }
    return this.muted;
  }

  playTone(freqStart, freqEnd, duration, volume = 0.2, type = 'square') {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freqStart, this.ctx.currentTime);
      if (freqEnd && freqEnd !== freqStart) {
        osc.frequency.linearRampToValueAtTime(freqEnd, this.ctx.currentTime + duration);
      }

      gain.gain.setValueAtTime(volume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch (err) {
      // Audio autoplay policy catch
    }
  }

  playJump() {
    this.playTone(180, 540, 0.15, 0.22, 'square');
  }

  playCoin() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(988, t);
      osc.frequency.setValueAtTime(1319, t + 0.08);

      gain.gain.setValueAtTime(0.22, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.2);
    } catch (e) {}
  }

  playStomp() {
    this.playTone(420, 140, 0.12, 0.25, 'triangle');
  }

  playSpring() {
    this.playTone(220, 880, 0.24, 0.25, 'square');
  }

  playHurt() {
    this.playTone(500, 110, 0.35, 0.25, 'sawtooth');
  }

  playClear() {
    this.playTone(440, 880, 0.45, 0.26, 'square');
  }

  playSnap() {
    this.playTone(800, 1200, 0.10, 0.22, 'sine');
  }

  startBGM() {
    if (this.bgmPlaying) return;
    this.init();
    this.bgmPlaying = true;
    this.bgmIndex = 0;
    this.scheduleNextBGMNote();
  }

  stopBGM() {
    this.bgmPlaying = false;
    if (this.bgmTimer) {
      clearTimeout(this.bgmTimer);
      this.bgmTimer = null;
    }
  }

  scheduleNextBGMNote() {
    if (!this.bgmPlaying) return;
    const note = this.bgmNotes[this.bgmIndex];
    if (note.f > 0 && !this.muted && this.ctx) {
      try {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(note.f, this.ctx.currentTime);
        gain.gain.setValueAtTime(0.07, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.015, this.ctx.currentTime + note.d * 0.9);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + note.d * 0.9);
      } catch (e) {}
    }

    this.bgmIndex = (this.bgmIndex + 1) % this.bgmNotes.length;
    this.bgmTimer = setTimeout(() => {
      this.scheduleNextBGMNote();
    }, note.d * 1000);
  }
}

const audio = new NESAudioEngine();

