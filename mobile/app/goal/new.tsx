import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { X, ChevronLeft } from 'lucide-react-native';
import { useApp } from '../../context/AppContext';
import { useTranslation } from '../../context/LanguageContext';
import { COLOR_OPTIONS, ICON_OPTIONS } from '../../types';
import CategoryIcon, { CategoryIconRaw } from '../../components/home/CategoryIcon';
import { durationDaysFromMonths } from '../../utils/goals';
import { playGoalSetSound } from '../../utils/sounds';

const DURATION_PRESETS = [
  { label: '1M', months: 1, key: 'gform.dur_1m' },
  { label: '3M', months: 3, key: 'gform.dur_3m' },
  { label: '6M', months: 6, key: 'gform.dur_6m' },
  { label: '1Y', months: 12, key: 'gform.dur_1y' },
] as const;

export default function NewGoalScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { addCustomGoal, formatCurrency, darkMode } = useApp();

  const [name, setName] = useState('');
  const [icon, setIcon] = useState('Star');
  const [color, setColor] = useState(COLOR_OPTIONS[0]);
  const [targetAmount, setTargetAmount] = useState('');
  const [durationMonths, setDurationMonths] = useState<number | null>(null);
  const [customMonths, setCustomMonths] = useState('');
  const [showCustomDuration, setShowCustomDuration] = useState(false);
  const [showIconPicker, setShowIconPicker] = useState(false);

  const resolvedMonths = showCustomDuration
    ? parseInt(customMonths, 10) || 0
    : durationMonths ?? 0;

  const targetNum = parseFloat(targetAmount) || 0;
  const monthlyRate = resolvedMonths > 0 && targetNum > 0
    ? targetNum / resolvedMonths
    : 0;

  const phColor = darkMode ? '#6b7280' : '#9ca3af';

  function validate(): string | null {
    if (!name.trim()) return t('gform.enter_name');
    if (!targetNum || targetNum <= 0) return t('gform.enter_target');
    if (resolvedMonths <= 0) return t('gform.choose_duration');
    return null;
  }

  function handleSave() {
    const err = validate();
    if (err) { Alert.alert(t('gform.validation'), err); return; }

    addCustomGoal({
      name: name.trim(),
      icon,
      color,
      targetAmount: targetNum,
      savedAmount: 0,
      durationDays: durationDaysFromMonths(resolvedMonths),
      startDate: new Date().toISOString(),
    });
    playGoalSetSound();
    router.back();
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <View className="flex-row items-center justify-between px-5 py-4">
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-9 h-9 rounded-full bg-white dark:bg-gray-800 items-center justify-center shadow-sm border border-gray-100 dark:border-gray-700"
        >
          <ChevronLeft size={20} color={darkMode ? '#d1d5db' : '#374151'} />
        </TouchableOpacity>
        <View className="items-center">
          <Text className="text-base font-bold text-gray-900 dark:text-white">{t('gform.title')}</Text>
          <Text className="text-xs text-gray-400 dark:text-gray-500">{t('gform.subtitle')}</Text>
        </View>
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-9 h-9 rounded-full bg-white dark:bg-gray-800 items-center justify-center shadow-sm border border-gray-100 dark:border-gray-700"
        >
          <X size={16} color={darkMode ? '#6b7280' : '#9ca3af'} />
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>

        {/* Goal Name */}
        <Text className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1.5 mt-2">{t('gform.name')}</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder={t('gform.name_ph')}
          placeholderTextColor={phColor}
          className="bg-white dark:bg-gray-900 border-2 border-gray-100 dark:border-gray-800 rounded-2xl px-4 py-3.5 text-sm text-gray-900 dark:text-white mb-5 focus:border-green-500"
          returnKeyType="next"
        />

        {/* Icon picker */}
        <Text className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">{t('gform.icon')}</Text>
        <TouchableOpacity
          onPress={() => setShowIconPicker(v => !v)}
          className="bg-white dark:bg-gray-900 border-2 border-gray-100 dark:border-gray-800 rounded-2xl px-4 py-3.5 flex-row items-center mb-3"
        >
          <CategoryIcon icon={icon} color={color} size={18} />
          <Text className="flex-1 text-sm text-gray-400 dark:text-gray-500 ml-3">
            {showIconPicker ? t('gform.tap_select') : t('gform.tap_change')}
          </Text>
        </TouchableOpacity>
        {showIconPicker ? (
          <View className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-3 mb-5 flex-row flex-wrap gap-2">
            {ICON_OPTIONS.map(ico => (
              <TouchableOpacity
                key={ico}
                onPress={() => { setIcon(ico); setShowIconPicker(false); }}
                className={`w-12 h-12 rounded-xl items-center justify-center border-2 ${
                  icon === ico ? 'border-green-500 bg-green-50 dark:bg-green-900/20' : 'border-transparent bg-gray-50 dark:bg-gray-800'
                }`}
              >
                <CategoryIconRaw icon={ico} color={icon === ico ? color : '#9ca3af'} size={18} />
              </TouchableOpacity>
            ))}
          </View>
        ) : <View className="mb-4" />}

        {/* Color picker */}
        <Text className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">{t('gform.color')}</Text>
        <View className="flex-row flex-wrap gap-2 mb-5">
          {COLOR_OPTIONS.map(c => (
            <TouchableOpacity
              key={c}
              onPress={() => setColor(c)}
              style={{
                width: 34,
                height: 34,
                borderRadius: 17,
                backgroundColor: c,
                borderWidth: color === c ? 3 : 0,
                borderColor: darkMode ? '#f9fafb' : '#111',
              }}
            />
          ))}
        </View>

        {/* Target Amount */}
        <Text className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1.5">{t('gform.target')}</Text>
        <TextInput
          value={targetAmount}
          onChangeText={setTargetAmount}
          placeholder={t('gform.amount_ph')}
          placeholderTextColor={phColor}
          keyboardType="decimal-pad"
          className="bg-white dark:bg-gray-900 border-2 border-gray-100 dark:border-gray-800 rounded-2xl px-4 py-3.5 text-sm text-gray-900 dark:text-white mb-5 focus:border-green-500"
          returnKeyType="next"
        />

        {/* Duration */}
        <Text className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">{t('gform.duration')}</Text>
        <View className="flex-row flex-wrap gap-2 mb-3">
          {DURATION_PRESETS.map(p => (
            <TouchableOpacity
              key={p.months}
              onPress={() => {
                setDurationMonths(p.months);
                setShowCustomDuration(false);
                setCustomMonths('');
              }}
              className={`px-4 py-2.5 rounded-xl items-center border-2 ${
                !showCustomDuration && durationMonths === p.months
                  ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900'
              }`}
            >
              <Text
                className={`text-sm font-bold ${
                  !showCustomDuration && durationMonths === p.months ? 'text-green-700 dark:text-green-400' : 'text-gray-600 dark:text-gray-400'
                }`}
              >
                {t(p.key as any)}
              </Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            onPress={() => { setShowCustomDuration(true); setDurationMonths(null); }}
            className={`flex-1 py-2.5 rounded-xl items-center border-2 ${
              showCustomDuration
                ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900'
            }`}
          >
            <Text
              className={`text-sm font-bold ${showCustomDuration ? 'text-green-700 dark:text-green-400' : 'text-gray-600 dark:text-gray-400'}`}
            >
              {t('gform.custom')}
            </Text>
          </TouchableOpacity>
        </View>

        {showCustomDuration ? (
          <TextInput
            value={customMonths}
            onChangeText={setCustomMonths}
            placeholder={t('gform.custom_months_ph')}
            placeholderTextColor={phColor}
            keyboardType="number-pad"
            className="bg-white dark:bg-gray-900 border-2 border-green-200 dark:border-green-900 rounded-2xl px-4 py-3.5 text-sm text-gray-900 dark:text-white mb-5 focus:border-green-500"
          />
        ) : <View className="mb-3" />}

        {/* Monthly rate hint */}
        {monthlyRate > 0 ? (
          <View className="bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-900 rounded-2xl px-4 py-3.5 mb-6">
            <Text className="text-sm text-green-700 dark:text-green-400 font-medium text-center">
              {t('gform.monthly_rate', { amount: formatCurrency(monthlyRate) })}
            </Text>
          </View>
        ) : <View className="mb-4" />}

        {/* Buttons */}
        <View className="gap-3 pb-8">
          <TouchableOpacity
            onPress={handleSave}
            className="w-full py-4 rounded-2xl bg-green-600 items-center shadow-lg"
            activeOpacity={0.85}
          >
            <Text className="text-white font-bold text-base">{t('gform.save')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-full py-3.5 rounded-2xl bg-gray-100 dark:bg-gray-800 items-center"
            activeOpacity={0.8}
          >
            <Text className="text-gray-600 dark:text-gray-300 font-semibold">{t('common.cancel')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
