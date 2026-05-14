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

export function playWarningSound(): void {
  try {
    const ac = makeAC();
    if (!ac) return;
    // Descending minor: A4 F4 D4
    [440, 349.23, 293.66].forEach((f, i) => note(ac, f, ac.currentTime + i * 0.18, 0.46));
  } catch { /* ignore */ }
}
