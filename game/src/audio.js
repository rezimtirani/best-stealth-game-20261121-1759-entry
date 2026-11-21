// Synthesised sound for The Lantern Thief — no audio files, no network.
// One clear job: every sound the game makes, built from WebAudio
// oscillators and filtered noise, so footsteps tell you where a guard is.
export function createAudio() {
  let ctx = null;
  let muted = false;
  let noiseBuffer = null;

  function ensure() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
      const len = ctx.sampleRate * 0.2;
      noiseBuffer = ctx.createBuffer(1, len, ctx.sampleRate);
      const data = noiseBuffer.getChannelData(0);
      for (let i = 0; i < len; i += 1) data[i] = Math.random() * 2 - 1;
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function tone(freq, dur, type, gain, when = 0, slideTo = null) {
    const ac = ensure();
    if (!ac || muted) return;
    const t0 = ac.currentTime + when;
    const osc = ac.createOscillator();
    const g = ac.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo !== null) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(gain, t0 + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g).connect(ac.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  }

  function noise(dur, freq, gain, when = 0) {
    const ac = ensure();
    if (!ac || muted) return;
    const t0 = ac.currentTime + when;
    const src = ac.createBufferSource();
    src.buffer = noiseBuffer;
    const filter = ac.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = freq;
    const g = ac.createGain();
    g.gain.setValueAtTime(gain, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(filter).connect(g).connect(ac.destination);
    src.start(t0);
    src.stop(t0 + dur + 0.05);
  }

  return {
    unlock() { ensure(); },
    toggleMute() {
      muted = !muted;
      return muted;
    },
    isMuted() { return muted; },
    step(sneaking) {
      if (sneaking) noise(0.05, 900, 0.02);
      else noise(0.07, 500, 0.06);
    },
    pickup() {
      tone(880, 0.12, 'sine', 0.12);
      tone(1318, 0.18, 'sine', 0.10, 0.08);
    },
    suspicious() {
      tone(520, 0.14, 'triangle', 0.10, 0, 380);
    },
    heard() {
      tone(340, 0.12, 'triangle', 0.08, 0, 300);
    },
    alarm() {
      tone(220, 0.16, 'square', 0.07);
      tone(330, 0.16, 'square', 0.07, 0.16);
      tone(220, 0.22, 'square', 0.07, 0.32);
    },
    caught() {
      tone(392, 0.2, 'sawtooth', 0.08, 0, 196);
      tone(196, 0.4, 'sawtooth', 0.08, 0.2, 98);
    },
    levelComplete() {
      [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.16, 'sine', 0.11, i * 0.09));
    },
    win() {
      [523, 659, 784, 1046, 1318].forEach((f, i) => tone(f, 0.22, 'sine', 0.11, i * 0.11));
    },
  };
}
