import * as Haptics from 'expo-haptics';
export function playRewardSound() { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); }
export function playCoinSound() { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); }
export function playWarningSound() { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning); }
