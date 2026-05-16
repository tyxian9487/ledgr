import { useEffect, useRef, useState } from 'react';
import { Modal, View, Text, TouchableOpacity, Animated } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useApp } from '../context/AppContext';
import { useTranslation } from '../context/LanguageContext';
import { computeBadges } from '../utils/achievements';

interface Badge {
  id: string;
  label: string;
  desc: string;
  icon: string;
}

export default function NotificationWatcher() {
  const { transactions, budget, userProfile } = useApp();
  const { t } = useTranslation();
  const [pendingBadge, setPendingBadge] = useState<Badge | null>(null);
  const seenRef = useRef<Set<string>>(new Set());
  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const earned = computeBadges(transactions, budget, userProfile);
    earned.forEach(badge => {
      if (!seenRef.current.has(badge.id)) {
        seenRef.current.add(badge.id);
        if (seenRef.current.size > 1) {
          // Only trigger notification for badges earned after initial load
          setPendingBadge(badge);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      }
    });
  }, [transactions, budget]);

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
            {pendingBadge.label}
          </Text>
          <Text className="text-sm text-gray-500 dark:text-gray-400 text-center leading-relaxed">
            {pendingBadge.desc}
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
