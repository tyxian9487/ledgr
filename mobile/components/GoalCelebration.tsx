import { useEffect } from 'react';
import { Modal, View, Text, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { playRewardSound } from '../utils/sounds';
import { useTranslation } from '../context/LanguageContext';

interface Props {
  goalName: string;
  totalAmount: number;
  color: string;
  isMonthly?: boolean;
  onContinue?: () => void;
  onDone?: () => void;
  onClose?: () => void;
  formatCurrency: (n: number) => string;
}

export default function GoalCelebration({ goalName, totalAmount, color, isMonthly, onContinue, onDone, onClose, formatCurrency }: Props) {
  const { t } = useTranslation();
  const { bottom } = useSafeAreaInsets();

  useEffect(() => {
    playRewardSound();
  }, []);

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" transparent onRequestClose={onClose || onDone}>
      <View className="flex-1 bg-black/70 items-end justify-end">
        <View className="w-full bg-white dark:bg-gray-900 rounded-t-3xl overflow-hidden">
          {/* Color stripe */}
          <View style={{ height: 5, backgroundColor: color }} />

          <View className="px-6 pt-7 items-center" style={{ paddingBottom: Math.max(40, bottom + 24) }}>
            {/* Big emoji */}
            <View
              className="w-20 h-20 rounded-full items-center justify-center mb-4"
              style={{ backgroundColor: color + '20' }}
            >
              <Text style={{ fontSize: 40 }}>🎉</Text>
            </View>

            <Text className="text-2xl font-black text-gray-900 dark:text-white mb-1">
              {isMonthly ? t('cel.monthly_hit') : t('cel.complete')}
            </Text>
            <Text className="text-sm text-gray-500 dark:text-gray-400 mb-1">{goalName}</Text>
            <Text className="text-3xl font-black mb-7" style={{ color }}>
              {t('cel.saved', { amount: formatCurrency(totalAmount) })}
            </Text>

            {isMonthly ? (
              <TouchableOpacity
                onPress={onClose}
                className="w-full py-4 rounded-2xl items-center"
                style={{ backgroundColor: color }}
              >
                <Text className="text-white font-bold text-base">{t('cel.awesome')}</Text>
              </TouchableOpacity>
            ) : (
              <View className="w-full gap-3">
                <TouchableOpacity
                  onPress={onContinue}
                  className="w-full py-4 rounded-2xl items-center"
                  style={{ backgroundColor: color }}
                >
                  <Text className="text-white font-bold text-base">{t('goal.keep_saving')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={onDone}
                  className="w-full py-4 rounded-2xl items-center border-2"
                  style={{ borderColor: color + '60' }}
                >
                  <Text className="font-bold text-base" style={{ color }}>{t('goal.im_done')}</Text>
                </TouchableOpacity>
                <Text className="text-xs text-gray-400 dark:text-gray-500 text-center px-2">
                  {t('cel.done_hint')}
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}
