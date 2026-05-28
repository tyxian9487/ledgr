import * as Haptics from 'expo-haptics';
import { Audio } from 'expo-av';

const kachingAsset = require('../assets/sounds/kaching.wav');
const rewardAsset  = require('../assets/sounds/reward.wav');

async function playAudio(asset: any): Promise<void> {
  const { sound } = await Audio.Sound.createAsync(asset, { shouldPlay: true });
  sound.setOnPlaybackStatusUpdate(status => {
    if (status.isLoaded && status.didJustFinish) sound.unloadAsync();
  });
}

export function playTransactionSound(): void {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  playAudio(kachingAsset).catch(() => {});
}

export function playBadgeSound(): void {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  playAudio(rewardAsset).catch(() => {});
}

export function playGoalSetSound(): void {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  playAudio(kachingAsset).catch(() => {});
}

// Called from GoalCelebration on mount (goal completed).
export function playRewardSound(): void {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  playAudio(rewardAsset).catch(() => {});
}

export function playWarningSound(): void {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
}

export function playCoinSound(): void {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  playAudio(kachingAsset).catch(() => {});
}
