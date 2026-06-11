import AsyncStorage from '@react-native-async-storage/async-storage';

const LAST_RATED_KEY = 'kachingo_last_rated_at';
const REVIEW_COOLDOWN_MS = 90 * 24 * 60 * 60 * 1000;

export async function requestReview(): Promise<void> {
  try {
    const lastRated = await AsyncStorage.getItem(LAST_RATED_KEY);
    if (lastRated) {
      const elapsed = Date.now() - parseInt(lastRated, 10);
      if (elapsed < REVIEW_COOLDOWN_MS) return;
    }
    const StoreReview = await import('expo-store-review');
    if (!(await StoreReview.isAvailableAsync())) return;
    await StoreReview.requestReview();
    await AsyncStorage.setItem(LAST_RATED_KEY, Date.now().toString());
  } catch {
    // Non-critical — never crash the app over a review prompt
  }
}
