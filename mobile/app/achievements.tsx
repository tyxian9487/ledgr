import { useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image } from 'react-native';

const goalMascotImg = require('../assets/m_goal.png');
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { useApp } from '../context/AppContext';
import { BADGES, computeBadges, computeStreaks, tipsForScore } from '../utils/achievements';
import { useTranslation } from '../context/LanguageContext';
import { useColorScheme } from 'nativewind';

export default function AchievementsScreen() {
  const router = useRouter();
  const { transactions, budget } = useApp();
  const { t } = useTranslation();
  const { colorScheme } = useColorScheme();
  const dark = colorScheme === 'dark';

  const { current: currentStreak, best: bestStreak } = useMemo(
    () => computeStreaks(transactions),
    [transactions],
  );

  const earnedBadges = useMemo(
    () => new Set(computeBadges(transactions, budget).map(b => b.id)),
    [transactions, budget],
  );

  const currentYear = new Date().getFullYear();
  const yearTxs = useMemo(
    () => transactions.filter(tx => new Date(tx.date).getFullYear() === currentYear),
    [transactions, currentYear],
  );
  const yearIncome = yearTxs.filter(tx => tx.type === 'income').reduce((s, tx) => s + tx.amount, 0);
  const yearExpenses = yearTxs.filter(tx => tx.type === 'expense').reduce((s, tx) => s + tx.amount, 0);
  const score = yearIncome > 0
    ? Math.min(100, Math.max(0, Math.round(100 - (yearExpenses / yearIncome) * 100)))
    : 50;

  const tips = useMemo(() => tipsForScore(score), [score]);

  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <View className="flex-row items-center px-5 pt-2 pb-4 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-700 items-center justify-center mr-3"
          activeOpacity={0.7}
        >
          <ChevronLeft size={18} color={dark ? '#e5e7eb' : '#374151'} />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-gray-900 dark:text-white flex-1">{t('achieve.title')}</Text>
        <View className="bg-green-100 dark:bg-green-900/30 rounded-full px-3 py-1">
          <Text className="text-xs font-bold text-green-700 dark:text-green-400">{t('achieve.earned_count', { n: String(earnedBadges.size), total: String(BADGES.length) })}</Text>
        </View>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>

        {/* ── Streak Card ── */}
        <Text className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">{t('achieve.streak_section')}</Text>
        <View className="bg-white dark:bg-gray-800 rounded-3xl p-5 mb-4 border border-gray-100 dark:border-gray-700">
          <View className="flex-row gap-3">
            <View className="flex-1 bg-orange-50 dark:bg-orange-950 rounded-2xl p-4 items-center border border-orange-100 dark:border-orange-900">
              <Text style={{ fontSize: 34 }}>🔥</Text>
              <Text className="text-3xl font-black text-orange-500 mt-1">{currentStreak}</Text>
              <Text className="text-xs text-orange-500 font-bold mt-0.5">{t('achieve.current')}</Text>
              <Text className="text-[10px] text-gray-400">{t('achieve.months')}</Text>
            </View>
            <View className="flex-1 bg-amber-50 dark:bg-amber-950 rounded-2xl p-4 items-center border border-amber-100 dark:border-amber-900">
              <Image source={goalMascotImg} style={{ width: 42, height: 42 }} resizeMode="contain" />
              <Text className="text-3xl font-black text-amber-500 mt-1">{bestStreak}</Text>
              <Text className="text-xs text-amber-500 font-bold mt-0.5">{t('achieve.best')}</Text>
              <Text className="text-[10px] text-gray-400">{t('achieve.months')}</Text>
            </View>
          </View>
          <Text className="text-[11px] text-gray-400 dark:text-gray-500 text-center mt-3 leading-relaxed">
            Consecutive months where expenses stayed under total income
          </Text>
        </View>

        {/* ── Badges ── */}
        <Text className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">{t('achieve.badges_section')}</Text>
        <View className="bg-white dark:bg-gray-800 rounded-3xl p-4 mb-4 border border-gray-100 dark:border-gray-700">
          <View className="flex-row flex-wrap gap-2">
            {BADGES.map(badge => {
              const earned = earnedBadges.has(badge.id);
              return (
                <View
                  key={badge.id}
                  className={`items-center rounded-2xl py-3.5 px-2 ${earned ? 'bg-green-50 dark:bg-green-950' : 'bg-gray-50 dark:bg-gray-700'}`}
                  style={{ width: '30.5%' }}
                >
                  <Text style={{ fontSize: 26, opacity: earned ? 1 : 0.18 }}>{badge.icon}</Text>
                  <Text
                    className={`text-[10px] font-bold text-center mt-1.5 ${earned ? 'text-green-700 dark:text-green-400' : 'text-gray-400 dark:text-gray-500'}`}
                    numberOfLines={2}
                  >
                    {t(`badge.${badge.id}.label` as any)}
                  </Text>
                  {earned ? (
                    <View className="mt-1.5 bg-green-100 dark:bg-green-900 rounded-full px-2 py-0.5">
                      <Text className="text-[9px] text-green-600 dark:text-green-400 font-bold">{t('achieve.earned_badge')}</Text>
                    </View>
                  ) : (
                    <Text className="text-[9px] text-gray-300 dark:text-gray-600 mt-1" numberOfLines={2} style={{ textAlign: 'center' }}>
                      {t(`badge.${badge.id}.desc` as any)}
                    </Text>
                  )}
                </View>
              );
            })}
          </View>
        </View>

        {/* ── All badges earned celebration ── */}
        {earnedBadges.size === BADGES.length && (
          <View className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-900/40 rounded-3xl p-5 mb-4 items-center">
            <Image source={goalMascotImg} style={{ width: 100, height: 100 }} resizeMode="contain" />
            <Text className="text-lg font-black text-green-700 dark:text-green-400 mt-2 text-center">{t('achieve.complete_title')}</Text>
            <Text className="text-xs text-green-600 dark:text-green-300 text-center mt-1 leading-relaxed">
              {t('achieve.complete_msg')}
            </Text>
          </View>
        )}

        {/* ── Knowledge Base ── */}
        <Text className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">
          {t('achieve.tips_section')}
        </Text>
        <View className="gap-3 mb-4">
          {tips.map(tip => (
            <View key={tip.id} className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-100 dark:border-gray-700">
              <View className="flex-row items-start gap-2 mb-2">
                <View className="w-1.5 h-1.5 rounded-full bg-green-500 mt-1.5 flex-shrink-0" />
                <Text className="text-sm font-bold text-gray-900 dark:text-white flex-1">{t(`tip.${tip.id}.title` as any)}</Text>
              </View>
              <Text className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed pl-3.5">{t(`tip.${tip.id}.body` as any)}</Text>
            </View>
          ))}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}
