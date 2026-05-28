import { useEffect, useRef } from 'react';
import { useAudioPlayer } from 'expo-audio';
import { addSoundListener, SoundName } from '../utils/soundEvents';

const kachingSource = require('../assets/sounds/kaching.wav');
const rewardSource  = require('../assets/sounds/reward.wav');

export default function SoundPlayer() {
  const kaching = useAudioPlayer(kachingSource);
  const reward  = useAudioPlayer(rewardSource);

  // Keep refs so the listener closure always sees the current player instances.
  const kachingRef = useRef(kaching);
  const rewardRef  = useRef(reward);
  kachingRef.current = kaching;
  rewardRef.current  = reward;

  useEffect(() => {
    return addSoundListener((name: SoundName) => {
      const player = name === 'kaching' ? kachingRef.current : rewardRef.current;
      try {
        player.seekTo(0);
        player.play();
      } catch {
        // Silent — audio errors should never surface to the user.
      }
    });
  }, []);

  return null;
}
