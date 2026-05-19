import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';

// ── Swap these requires to use your own audio files ──────────────────────────
const KACHING_SOUND = require('../assets/sounds/kaching.wav');
const REWARD_SOUND  = require('../assets/sounds/reward.wav');

async function playSound(source: number) {
  try {
    await Audio.setAudioModeAsync({ playsInSilentModeIOS: false });
    const { sound } = await Audio.Sound.createAsync(source);
    await sound.playAsync();
    sound.setOnPlaybackStatusUpdate(status => {
      if (status.isLoaded && status.didJustFinish) sound.unloadAsync();
    });
  } catch {}
}

export function playRewardSound() {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  playSound(REWARD_SOUND);
}

export function playCoinSound() {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  playSound(KACHING_SOUND);
}

export function playWarningSound() {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
}
