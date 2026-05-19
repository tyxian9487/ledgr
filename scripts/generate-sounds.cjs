#!/usr/bin/env node
// Generates minimal WAV placeholder files for kaching (coin) and reward (fanfare) sounds.
// Replace the output files with your own audio to customize.
// Usage: node scripts/generate-sounds.js

const fs = require('fs');
const path = require('path');

const SAMPLE_RATE = 22050;
const NUM_CHANNELS = 1;
const BITS_PER_SAMPLE = 16;

function buildWav(samples) {
  const byteRate = SAMPLE_RATE * NUM_CHANNELS * (BITS_PER_SAMPLE / 8);
  const blockAlign = NUM_CHANNELS * (BITS_PER_SAMPLE / 8);
  const dataBytes = samples.length * (BITS_PER_SAMPLE / 8);
  const buf = Buffer.alloc(44 + dataBytes);

  buf.write('RIFF', 0);
  buf.writeUInt32LE(36 + dataBytes, 4);
  buf.write('WAVE', 8);
  buf.write('fmt ', 12);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20);            // PCM
  buf.writeUInt16LE(NUM_CHANNELS, 22);
  buf.writeUInt32LE(SAMPLE_RATE, 24);
  buf.writeUInt32LE(byteRate, 28);
  buf.writeUInt16LE(blockAlign, 32);
  buf.writeUInt16LE(BITS_PER_SAMPLE, 34);
  buf.write('data', 36);
  buf.writeUInt32LE(dataBytes, 40);

  for (let i = 0; i < samples.length; i++) {
    const clamped = Math.max(-1, Math.min(1, samples[i]));
    buf.writeInt16LE(Math.round(clamped * 32767), 44 + i * 2);
  }
  return buf;
}

function tone(freq, durationSec, volume, envelope) {
  const n = Math.round(SAMPLE_RATE * durationSec);
  const out = [];
  for (let i = 0; i < n; i++) {
    const t = i / SAMPLE_RATE;
    const env = envelope ? envelope(t, durationSec) : 1;
    out.push(volume * env * Math.sin(2 * Math.PI * freq * t));
  }
  return out;
}

function fadeOut(t, dur) {
  return Math.max(0, 1 - t / dur);
}

function adsrEnv(t, dur) {
  const attack = 0.005, decay = 0.03, sustain = 0.6;
  if (t < attack) return t / attack;
  if (t < attack + decay) return 1 - (1 - sustain) * (t - attack) / decay;
  return sustain * fadeOut(t, dur);
}

// Kaching: quick descending two-tone chirp
function makeKaching() {
  const s1 = tone(1200, 0.08, 0.7, adsrEnv);
  const s2 = tone(900, 0.12, 0.5, (t, d) => fadeOut(t, d));
  const gap = new Array(Math.round(SAMPLE_RATE * 0.02)).fill(0);
  return [...s1, ...gap, ...s2];
}

// Reward: 3-note ascending fanfare (C-E-G)
function makeReward() {
  const notes = [523.25, 659.25, 783.99];
  const segs = notes.map((f, i) => {
    const vol = i === 2 ? 0.65 : 0.5;
    return tone(f, i === 2 ? 0.25 : 0.12, vol, adsrEnv);
  });
  const gap = new Array(Math.round(SAMPLE_RATE * 0.03)).fill(0);
  return [...segs[0], ...gap, ...segs[1], ...gap, ...segs[2]];
}

const outDir = path.join(__dirname, '..', 'mobile', 'assets', 'sounds');
fs.mkdirSync(outDir, { recursive: true });

fs.writeFileSync(path.join(outDir, 'kaching.wav'), buildWav(makeKaching()));
fs.writeFileSync(path.join(outDir, 'reward.wav'), buildWav(makeReward()));

console.log('Generated:');
console.log(' ', path.join(outDir, 'kaching.wav'));
console.log(' ', path.join(outDir, 'reward.wav'));
console.log('\nReplace these files with your own audio to customise the sounds.');
