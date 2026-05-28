export type SoundName = 'kaching' | 'reward';

type Listener = (name: SoundName) => void;
const listeners: Listener[] = [];

export function addSoundListener(fn: Listener): () => void {
  listeners.push(fn);
  return () => {
    const i = listeners.indexOf(fn);
    if (i >= 0) listeners.splice(i, 1);
  };
}

export function emitSound(name: SoundName): void {
  listeners.forEach(fn => fn(name));
}
