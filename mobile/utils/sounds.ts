import * as Haptics from 'expo-haptics';
import { emitSound } from './soundEvents';

export function playTransactionSound(): void {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  emitSound('kaching');
}

export function playBadgeSound(): void {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  emitSound('reward');
}

export function playGoalSetSound(): void {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  emitSound('kaching');
}

// Called from GoalCelebration on mount (goal completed).
export function playRewardSound(): void {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  emitSound('reward');
}

export function playWarningSound(): void {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
}

export function playCoinSound(): void {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  emitSound('kaching');
}
