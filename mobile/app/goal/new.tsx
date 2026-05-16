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

const DURATION_PRESETS = [
  { label: '1M', days: 30, key: 'gform.dur_1m' },
  { label: '3M', days: 90, key: 'gform.dur_3m' },
  { label: '6M', days: 180, key: 'gform.dur_6m' },
  { label: '1Y', days: 365, key: 'gform.dur_1y' },
] as const;

const EMOJI_OPTIONS = [
  '🎯', '🏠', '✈️', '🚗', '💻', '📱', '🎓', '👶', '💍', '🏋️',
  '📚', '🎸', '🌴', '⛵', '🎨', '🏕️', '💰', '🐕', '🌿', '🛋️',
];

export default function NewGoalScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { addCustomGoal, formatCurrency } = useApp();

  const [name, setName] = useState('');
  const [icon, setIcon] = useState(EMOJI_OPTIONS[0]);
  const [color, setColor] = useState(COLOR_OPTIONS[0]);
  const [targetAmount, setTargetAmount] = useState('');
  const [durationDays, setDurationDays] = useState<number | null>(null);
  const [customDays, setCustomDays] = useState('');
  const [showCustomDuration, setShowCustomDuration] = useState(false);
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [useEmoji, setUseEmoji] = useState(true);

  const resolvedDays = showCustomDuration
    ? parseInt(customDays, 10) || 0
    : durationDays ?? 0;

  const targetNum = parseFloat(targetAmount) || 0;
  const monthlyRate = resolvedDays > 0 && targetNum > 0
    ? targetNum / (resolvedDays / 30)
    : 0;

  function validate(): string | null {
    if (!name.trim()) return t('gform.enter_name');
    if (!targetNum || targetNum <= 0) return t('gform.enter_target');
    if (resolvedDays <= 0) return t('gform.choose_duration');
    return null;
  }

  function handleSave() {
    const err = validate();
    if (err) { Alert.alert('Validation', err); return; }

    addCustomGoal({
      name: name.trim(),
      icon,
      color,
      targetAmount: targetNum,
      savedAmount: 0,
      durationDays: resolvedDays,
      startDate: new Date().toISOString(),
    });
    router.back();
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="flex-row items-center justify-between px-5 py-4">
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-9 h-9 rounded-full bg-white items-center justify-center shadow-sm border border-gray-100"
        >
          <ChevronLeft size={20} color="#374151" />
        </TouchableOpacity>
        <View className="items-center">
          <Text className="text-base font-bold text-gray-900">{t('gform.title')}</Text>
          <Text className="text-xs text-gray-400">{t('gform.subtitle')}</Text>
        </View>
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-9 h-9 rounded-full bg-white items-center justify-center shadow-sm border border-gray-100"
        >
          <X size={16} color="#9ca3af" />
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>

        {/* Preview card */}
        <View className="rounded-2xl p-5 mb-5 items-center shadow-sm" style={{ backgroundColor: color }}>
          <Text style={{ fontSize: 40 }}>{icon}</Text>
          <Text className="text-white font-black text-lg mt-2">
            {name || 'My Goal'}
          </Text>
          <Text className="text-white/70 text-sm mt-1">
            {targetNum > 0 ? formatCurrency(targetNum) : '—'}
          </Text>
          {monthlyRate > 0 ? (
            <Text className="text-white/60 text-xs mt-1">
              {formatCurrency(monthlyRate)}/mo · {resolvedDays}d
            </Text>
          ) : null}
        </View>

        {/* Goal Name */}
        <Text className="text-xs font-semibold text-gray-500 mb-1.5">{t('gform.name')}</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder={t('gform.name_ph')}
          placeholderTextColor="#9ca3af"
          className="bg-white border-2 border-gray-100 rounded-2xl px-4 py-3.5 text-sm text-gray-900 mb-5 focus:border-green-500"
          returnKeyType="next"
        />

        {/* Icon picker */}
        <Text className="text-xs font-semibold text-gray-500 mb-2">{t('gform.icon')}</Text>
        <TouchableOpacity
          onPress={() => setShowIconPicker(v => !v)}
          className="bg-white border-2 border-gray-100 rounded-2xl px-4 py-3.5 flex-row items-center mb-3"
        >
          <Text style={{ fontSize: 24 }}>{icon}</Text>
          <Text className="flex-1 text-sm text-gray-400 ml-3">
            {showIconPicker ? t('gform.tap_select') : t('gform.tap_change')}
          </Text>
        </TouchableOpacity>
        {showIconPicker ? (
          <View className="bg-white border border-gray-100 rounded-2xl p-3 mb-5 flex-row flex-wrap gap-2">
            {EMOJI_OPTIONS.map(em => (
              <TouchableOpacity
                key={em}
                onPress={() => { setIcon(em); setShowIconPicker(false); }}
                className={`w-12 h-12 rounded-xl items-center justify-center border-2 ${
                  icon === em ? 'border-green-500 bg-green-50' : 'border-transparent'
                }`}
              >
                <Text style={{ fontSize: 22 }}>{em}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : <View className="mb-4" />}

        {/* Color picker */}
        <Text className="text-xs font-semibold text-gray-500 mb-2">{t('gform.color')}</Text>
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
                borderColor: '#111',
              }}
            />
          ))}
        </View>

        {/* Target Amount */}
        <Text className="text-xs font-semibold text-gray-500 mb-1.5">{t('gform.target')}</Text>
        <TextInput
          value={targetAmount}
          onChangeText={setTargetAmount}
          placeholder={t('gform.amount_ph')}
          placeholderTextColor="#9ca3af"
          keyboardType="decimal-pad"
          className="bg-white border-2 border-gray-100 rounded-2xl px-4 py-3.5 text-sm text-gray-900 mb-5 focus:border-green-500"
          returnKeyType="next"
        />

        {/* Duration */}
        <Text className="text-xs font-semibold text-gray-500 mb-2">{t('gform.duration')}</Text>
        <View className="flex-row gap-2 mb-3">
          {DURATION_PRESETS.map(p => (
            <TouchableOpacity
              key={p.days}
              onPress={() => {
                setDurationDays(p.days);
                setShowCustomDuration(false);
                setCustomDays('');
              }}
              className={`flex-1 py-2.5 rounded-xl items-center border-2 ${
                !showCustomDuration && durationDays === p.days
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200 bg-white'
              }`}
            >
              <Text
                className={`text-sm font-bold ${
                  !showCustomDuration && durationDays === p.days ? 'text-green-700' : 'text-gray-600'
                }`}
              >
                {p.label}
              </Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            onPress={() => { setShowCustomDuration(true); setDurationDays(null); }}
            className={`flex-1 py-2.5 rounded-xl items-center border-2 ${
              showCustomDuration
                ? 'border-green-500 bg-green-50'
                : 'border-gray-200 bg-white'
            }`}
          >
            <Text
              className={`text-sm font-bold ${showCustomDuration ? 'text-green-700' : 'text-gray-600'}`}
            >
              {t('gform.custom')}
            </Text>
          </TouchableOpacity>
        </View>

        {showCustomDuration ? (
          <TextInput
            value={customDays}
            onChangeText={setCustomDays}
            placeholder="Number of days (e.g. 120)"
            placeholderTextColor="#9ca3af"
            keyboardType="number-pad"
            className="bg-white border-2 border-green-200 rounded-2xl px-4 py-3.5 text-sm text-gray-900 mb-5 focus:border-green-500"
          />
        ) : <View className="mb-3" />}

        {/* Monthly rate hint */}
        {monthlyRate > 0 ? (
          <View className="bg-green-50 border border-green-100 rounded-2xl px-4 py-3.5 mb-6">
            <Text className="text-sm text-green-700 font-medium text-center">
              Save{' '}
              <Text className="font-black">{formatCurrency(monthlyRate)}</Text>
              /month to reach your goal
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
            className="w-full py-3.5 rounded-2xl bg-gray-100 items-center"
            activeOpacity={0.8}
          >
            <Text className="text-gray-600 font-semibold">{t('common.cancel')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
