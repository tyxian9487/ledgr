function makeAC(): AudioContext | null {
  try {
    return new (window.AudioContext || (window as any).webkitAudioContext)();
  } catch {
    return null;
  }
}

function note(ac: AudioContext, freq: number, start: number, dur: number, vol = 0.26) {
  try {
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.connect(gain);
    gain.connect(ac.destination);
    osc.type = 'sine';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(vol, start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, start + dur);
    osc.start(start);
    osc.stop(start + dur + 0.05);
  } catch { /* ignore */ }
}

export function playRewardSound(): void {
  try {
    const ac = makeAC();
    if (!ac) return;
    // Ascending C-major arpeggio: C5 E5 G5 C6
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => note(ac, f, ac.currentTime + i * 0.11, 0.36));
  } catch { /* ignore */ }
}

export function playCoinSound(): void {
  try {
    const ac = makeAC();
    if (!ac) return;
    const now = ac.currentTime;

    // "Ka" — short mechanical click
    const bufLen = Math.floor(ac.sampleRate * 0.04);
    const buf = ac.createBuffer(1, bufLen, ac.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufLen; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufLen * 0.15));
    }
    const noise = ac.createBufferSource();
    noise.buffer = buf;
    const noiseGain = ac.createGain();
    noiseGain.gain.setValueAtTime(0.18, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
    noise.connect(noiseGain);
    noiseGain.connect(ac.destination);
    noise.start(now);
    noise.stop(now + 0.05);

    // "CHING" — bright metallic ring with harmonics and long decay
    [1568, 2093, 3136, 4186].forEach((freq, i) => {
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.type = i === 0 ? 'triangle' : 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, now + 0.04);
      gain.gain.linearRampToValueAtTime(0.28 / (i + 1), now + 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06 + 0.55 / (i * 0.4 + 1));
      osc.connect(gain);
      gain.connect(ac.destination);
      osc.start(now + 0.04);
      osc.stop(now + 0.75);
    });
  } catch { /* ignore */ }
}

export function playWarningSound(): void {
  try {
    const ac = makeAC();
    if (!ac) return;
    // Descending minor: A4 F4 D4
    [440, 349.23, 293.66].forEach((f, i) => note(ac, f, ac.currentTime + i * 0.18, 0.46));
  } catch { /* ignore */ }
}
