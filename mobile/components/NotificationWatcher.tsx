import { useEffect, useRef, useState } from 'react';
import { Modal, View, Text, TouchableOpacity, Animated } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useApp } from '../context/AppContext';
import { useTranslation } from '../context/LanguageContext';
import { computeBadges } from '../utils/achievements';
import { sendBudgetAlertOnce } from '../utils/notifications';
import { playBadgeSound } from '../utils/sounds';

interface BadgeRef {
  id: string;
  icon: string;
}

const SEEN_BADGES_KEY = 'kachingo_seen_badges';

export default function NotificationWatcher() {
  const { transactions, budget, isAuthenticated } = useApp();
  const { t } = useTranslation();
  const router = useRouter();
  const [pendingBadge, setPendingBadge] = useState<BadgeRef | null>(null);
  const [seenLoaded, setSeenLoaded] = useState(false);
  const seenRef = useRef<Set<string>>(new Set());
  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let sub: { remove: () => void } | undefined;
    (async () => {
      const Notifications = await import('expo-notifications');
      sub = Notifications.addNotificationResponseReceivedListener(response => {
        const route = (response.notification.request.content.data?.route as string) ?? '/(tabs)';
        router.replace(route as any);
      });
    })();
    return () => { sub?.remove(); };
  }, [router]);

  useEffect(() => {
    if (!isAuthenticated) {
      setSeenLoaded(false);
      seenRef.current = new Set();
      return;
    }
    AsyncStorage.getItem(SEEN_BADGES_KEY)
      .then(raw => {
        if (raw) seenRef.current = new Set(JSON.parse(raw));
      })
      .finally(() => setSeenLoaded(true));
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated || !seenLoaded) return;
    const earned = computeBadges(transactions, budget);
    const newlyEarned = earned.filter(badge => !seenRef.current.has(badge.id));
    if (newlyEarned.length === 0) return;

    newlyEarned.forEach(badge => seenRef.current.add(badge.id));
    AsyncStorage.setItem(SEEN_BADGES_KEY, JSON.stringify([...seenRef.current])).catch(() => {});

    const shouldCelebrate = seenRef.current.size > newlyEarned.length;
    if (shouldCelebrate) {
      const badge = newlyEarned[newlyEarned.length - 1];
      setPendingBadge({ id: badge.id, icon: badge.icon });
      playBadgeSound();
    }
  }, [transactions, budget, isAuthenticated, seenLoaded]);

  useEffect(() => {
    if (!isAuthenticated || budget.expectedIncome <= 0 || budget.allocations.length === 0) return;
    const now = new Date();
    const monthKey = `${now.getFullYear()}-${now.getMonth()}`;
    const monthExpenses = transactions
      .filter(tx => {
        const d = new Date(tx.date);
        return tx.type === 'expense' && d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
      })
      .reduce((sum, tx) => sum + tx.amount, 0);
    const totalBudget = budget.allocations.reduce(
      (sum, allocation) => sum + (budget.expectedIncome * allocation.percentage) / 100,
      0,
    );
    if (totalBudget <= 0) return;

    if (monthExpenses > totalBudget) {
      sendBudgetAlertOnce(`${monthKey}-over`, t('notif.budget_alerts'), t('notif.budget_over_body')).catch(() => {});
    } else if (monthExpenses >= totalBudget * 0.9) {
      sendBudgetAlertOnce(`${monthKey}-near`, t('notif.budget_alerts'), t('notif.budget_near_body')).catch(() => {});
    }
  }, [transactions, budget, isAuthenticated, t]);

  useEffect(() => {
    if (pendingBadge) {
      Animated.parallel([
        Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }),
        Animated.timing(opacityAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
      ]).start();
    } else {
      scaleAnim.setValue(0.5);
      opacityAnim.setValue(0);
    }
  }, [pendingBadge]);

  if (!pendingBadge) return null;

  return (
    <Modal transparent animationType="fade" visible={!!pendingBadge} onRequestClose={() => setPendingBadge(null)}>
      <TouchableOpacity
        className="flex-1 bg-black/50 items-center justify-center px-8"
        activeOpacity={1}
        onPress={() => setPendingBadge(null)}
      >
        <Animated.View
          style={{ transform: [{ scale: scaleAnim }], opacity: opacityAnim }}
          className="bg-white dark:bg-gray-900 rounded-3xl p-8 items-center w-full max-w-xs shadow-2xl"
        >
          <Text className="text-4xl mb-4">{pendingBadge.icon}</Text>
          <Text className="text-xs font-bold text-green-600 uppercase tracking-widest mb-2">
            {t('badge.unlocked')}
          </Text>
          <Text className="text-lg font-bold dark:text-white text-center mb-2">
            {t(`badge.${pendingBadge.id}.label` as any)}
          </Text>
          <Text className="text-sm text-gray-500 dark:text-gray-400 text-center leading-relaxed">
            {t(`badge.${pendingBadge.id}.desc` as any)}
          </Text>
          <TouchableOpacity
            onPress={() => setPendingBadge(null)}
            className="mt-6 bg-green-600 rounded-2xl px-8 py-3"
          >
            <Text className="text-white font-bold text-sm">
              {t('badge.tap_continue')}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </TouchableOpacity>
    </Modal>
  );
}
