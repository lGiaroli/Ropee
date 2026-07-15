import { Buffer } from 'node:buffer';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const output = resolve(root, 'assets/audio/ropee-cue.wav');
const sampleRate = 22050;
const durationSeconds = 0.18;
const sampleCount = Math.floor(sampleRate * durationSeconds);
const dataSize = sampleCount * 2;
const buffer = Buffer.alloc(44 + dataSize);

buffer.write('RIFF', 0);
buffer.writeUInt32LE(36 + dataSize, 4);
buffer.write('WAVE', 8);
buffer.write('fmt ', 12);
buffer.writeUInt32LE(16, 16);
buffer.writeUInt16LE(1, 20);
buffer.writeUInt16LE(1, 22);
buffer.writeUInt32LE(sampleRate, 24);
buffer.writeUInt32LE(sampleRate * 2, 28);
buffer.writeUInt16LE(2, 32);
buffer.writeUInt16LE(16, 34);
buffer.write('data', 36);
buffer.writeUInt32LE(dataSize, 40);

for (let index = 0; index < sampleCount; index += 1) {
  const time = index / sampleRate;
  const attack = Math.min(1, time / 0.018);
  const release = Math.min(1, (durationSeconds - time) / 0.055);
  const envelope = Math.max(0, Math.min(attack, release));
  const fundamental = Math.sin(2 * Math.PI * 660 * time);
  const harmonic = Math.sin(2 * Math.PI * 1320 * time) * 0.18;
  const sample = Math.round((fundamental + harmonic) * envelope * 0.23 * 32767);
  buffer.writeInt16LE(Math.max(-32768, Math.min(32767, sample)), 44 + index * 2);
}

mkdirSync(dirname(output), { recursive: true });
writeFileSync(output, buffer);
