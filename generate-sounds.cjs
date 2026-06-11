/**
 * Generates kaching.wav and reward.wav by replicating the exact Web Audio API
 * synthesis in mobile/src/utils/sounds.ts, but offline in Node.js.
 *
 * Run from repo root:  node generate-sounds.js
 */
const fs   = require('fs');
const path = require('path');

const SR  = 44100;  // sample rate
const OUT = path.join(__dirname, 'mobile/assets/sounds');

// ── WAV writer ────────────────────────────────────────────────────────────────
function writeWAV(file, samples) {
  const data = Buffer.alloc(samples.length * 2);
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    data.writeInt16LE(Math.round(s * 32767), i * 2);
  }
  const hdr = Buffer.alloc(44);
  hdr.write('RIFF', 0);
  hdr.writeUInt32LE(36 + data.length, 4);
  hdr.write('WAVE', 8);
  hdr.write('fmt ', 12);
  hdr.writeUInt32LE(16, 16);
  hdr.writeUInt16LE(1, 20);   // PCM
  hdr.writeUInt16LE(1, 22);   // mono
  hdr.writeUInt32LE(SR, 24);
  hdr.writeUInt32LE(SR * 2, 28);
  hdr.writeUInt16LE(2, 32);
  hdr.writeUInt16LE(16, 34);
  hdr.write('data', 36);
  hdr.writeUInt32LE(data.length, 40);
  fs.writeFileSync(file, Buffer.concat([hdr, data]));
  console.log(`wrote ${path.basename(file)} (${samples.length} samples, ${(samples.length/SR).toFixed(2)}s)`);
}

// ── Web Audio API–style note ──────────────────────────────────────────────────
// Matches note(ac, freq, start, dur, vol=0.26) exactly:
//   gain: 0 → vol over 20 ms (linear ramp), then vol → 0.001 over dur (exp ramp)
function addNote(buf, freq, startSec, durSec, vol = 0.26) {
  const ATTACK = 0.02;
  const s0 = Math.floor(startSec * SR);

  for (let i = s0; i < buf.length; i++) {
    const t = (i - s0) / SR;
    if (t > durSec + 0.05) break;

    // envelope
    let gain;
    if (t <= ATTACK) {
      gain = vol * (t / ATTACK);                              // linear ramp in
    } else if (t <= durSec) {
      const p = (t - ATTACK) / (durSec - ATTACK);
      gain = vol * Math.pow(0.001 / vol, p);                  // exponential ramp to 0.001
    } else {
      break;
    }

    buf[i] += Math.sin(2 * Math.PI * freq * i / SR) * gain;
  }
}

// ── reward.wav — ascending C-major arpeggio C5 E5 G5 C6 ──────────────────────
function genReward() {
  const total = 0.33 + 0.36 + 0.08;
  const buf   = new Float64Array(Math.ceil(total * SR));
  [[523.25, 0.00], [659.25, 0.11], [783.99, 0.22], [1046.5, 0.33]].forEach(
    ([f, t]) => addNote(buf, f, t, 0.36, 0.32),  // slightly higher vol for speaker
  );
  return buf;
}

// ── kaching.wav — mechanical click + metallic ring ───────────────────────────
// Matches playCoinSound() exactly (web utils/sounds.ts)
function genKaching() {
  const dur = 0.85;
  const buf = new Float64Array(Math.ceil(dur * SR));

  // "Ka" — exponentially-decaying white noise burst (40 ms)
  const kaDur = Math.floor(0.04 * SR);
  for (let i = 0; i < kaDur && i < buf.length; i++) {
    const noise = (Math.random() * 2 - 1);
    const env   = 0.22 * Math.exp(-i / (kaDur * 0.15));
    buf[i] += noise * env;
  }

  // "CHING" — four harmonics starting at 40 ms
  const ringStart = Math.floor(0.04 * SR);
  [1568, 2093, 3136, 4186].forEach((freq, idx) => {
    const decayTime = 0.55 / (idx * 0.4 + 1);  // seconds
    const peakAmp   = 0.32 / (idx + 1);         // slightly louder for speaker
    const RAMP      = 0.02;                      // 20 ms ramp

    for (let i = ringStart; i < buf.length; i++) {
      const t = (i - ringStart) / SR;
      if (t > decayTime * 4) break;             // early exit when silent

      const ramp  = Math.min(1, t / RAMP);
      const decay = Math.exp(-t / decayTime * 3);

      // idx 0 = triangle, rest = sine  (matches web)
      const phase = 2 * Math.PI * freq * i / SR;
      const wave  = idx === 0
        ? (2 / Math.PI) * Math.asin(Math.min(1, Math.max(-1, Math.sin(phase))))
        : Math.sin(phase);

      buf[i] += wave * peakAmp * ramp * decay;
    }
  });

  return buf;
}

writeWAV(path.join(OUT, 'reward.wav'),  genReward());
writeWAV(path.join(OUT, 'kaching.wav'), genKaching());
