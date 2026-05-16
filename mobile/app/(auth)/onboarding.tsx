import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useApp } from '../../context/AppContext';
import { useTranslation } from '../../context/LanguageContext';
import { CURRENCIES } from '../../types';
import { Check, ChevronRight, ChevronLeft, PartyPopper } from 'lucide-react-native';

const TOTAL_STEPS = 3;

export default function OnboardingScreen() {
  const { updateUserProfile, completeOnboarding } = useApp();
  const { t } = useTranslation();

  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [search, setSearch] = useState('');

  const filteredCurrencies = CURRENCIES.filter(
    (c) =>
      c.code.toLowerCase().includes(search.toLowerCase()) ||
      c.name.toLowerCase().includes(search.toLowerCase()),
  );

  const canNext = step === 1 ? name.trim().length > 0 : true;

  const handleNext = () => {
    if (step === 1) {
      updateUserProfile({ name: name.trim() });
    }
    if (step < TOTAL_STEPS) {
      setStep((s) => s + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) setStep((s) => s - 1);
  };

  const handleFinish = () => {
    updateUserProfile({ currency });
    completeOnboarding();
  };

  // Progress dots
  const renderDots = () => (
    <View className="flex-row justify-center gap-x-2 mb-8">
      {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
        <View
          key={i}
          className={`rounded-full h-2 ${
            i + 1 === step ? 'w-6 bg-green-600' : 'w-2 bg-gray-200'
          }`}
        />
      ))}
    </View>
  );

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-white"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header strip */}
      <View className="bg-green-600 h-2" />

      <View className="flex-1 px-6 pt-12">
        {renderDots()}

        {/* ── Step 1: Name ── */}
        {step === 1 && (
          <View className="flex-1">
            <Text className="text-2xl font-bold text-gray-900 mb-2">
              {t('onboarding.step1.title')}
            </Text>
            <Text className="text-gray-500 mb-8">
              We'll personalise Kachingo for you.
            </Text>
            <TextInput
              className="border border-gray-200 rounded-2xl px-4 py-4 text-base text-gray-900 bg-gray-50"
              placeholder={t('onboarding.step1.placeholder')}
              placeholderTextColor="#9ca3af"
              value={name}
              onChangeText={setName}
              autoFocus
              returnKeyType="next"
              onSubmitEditing={handleNext}
            />
          </View>
        )}

        {/* ── Step 2: Currency ── */}
        {step === 2 && (
          <View className="flex-1">
            <Text className="text-2xl font-bold text-gray-900 mb-2">
              {t('onboarding.step2.title')}
            </Text>
            <Text className="text-gray-500 mb-4">
              This will be your default display currency.
            </Text>

            <TextInput
              className="border border-gray-200 rounded-2xl px-4 py-3 text-base text-gray-900 bg-gray-50 mb-3"
              placeholder={t('onboarding.step2.search')}
              placeholderTextColor="#9ca3af"
              value={search}
              onChangeText={setSearch}
              returnKeyType="search"
            />

            <FlatList
              data={filteredCurrencies}
              keyExtractor={(item) => item.code}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => {
                const selected = item.code === currency;
                return (
                  <TouchableOpacity
                    onPress={() => setCurrency(item.code)}
                    activeOpacity={0.7}
                    className={`flex-row items-center px-4 py-3 mb-1 rounded-xl ${
                      selected ? 'bg-green-50 border border-green-200' : 'bg-gray-50'
                    }`}
                  >
                    <Text
                      className={`text-sm font-bold w-12 ${
                        selected ? 'text-green-700' : 'text-gray-500'
                      }`}
                    >
                      {item.code}
                    </Text>
                    <Text
                      className={`flex-1 text-sm ${
                        selected ? 'text-green-900 font-medium' : 'text-gray-700'
                      }`}
                    >
                      {item.name}
                    </Text>
                    {selected && <Check size={16} color="#16a34a" />}
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        )}

        {/* ── Step 3: Done ── */}
        {step === 3 && (
          <View className="flex-1 items-center justify-center">
            <View className="bg-green-100 rounded-full w-24 h-24 items-center justify-center mb-6">
              <PartyPopper size={48} color="#16a34a" />
            </View>
            <Text className="text-2xl font-bold text-gray-900 mb-3 text-center">
              {t('onboarding.step3.title')}
            </Text>
            <Text className="text-gray-500 text-center text-base px-4">
              {t('onboarding.step3.subtitle')}
            </Text>
            <View className="mt-4 bg-gray-50 rounded-2xl px-6 py-4 w-full">
              <View className="flex-row justify-between mb-2">
                <Text className="text-gray-500 text-sm">Name</Text>
                <Text className="text-gray-900 font-medium text-sm">{name || 'User'}</Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-gray-500 text-sm">Currency</Text>
                <Text className="text-gray-900 font-medium text-sm">{currency}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Navigation buttons */}
        <View className="flex-row items-center pb-10 pt-6 gap-x-3">
          {step > 1 && (
            <TouchableOpacity
              onPress={handleBack}
              activeOpacity={0.8}
              className="flex-row items-center justify-center border border-gray-200 rounded-2xl py-4 px-5"
            >
              <ChevronLeft size={20} color="#374151" />
              <Text className="text-gray-700 font-medium ml-1">
                {t('onboarding.back')}
              </Text>
            </TouchableOpacity>
          )}

          {step < TOTAL_STEPS ? (
            <TouchableOpacity
              onPress={handleNext}
              disabled={!canNext}
              activeOpacity={0.8}
              className={`flex-1 flex-row items-center justify-center rounded-2xl py-4 ${
                canNext ? 'bg-green-600' : 'bg-gray-200'
              }`}
            >
              <Text
                className={`font-semibold text-base mr-1 ${
                  canNext ? 'text-white' : 'text-gray-400'
                }`}
              >
                {t('onboarding.next')}
              </Text>
              <ChevronRight size={20} color={canNext ? '#fff' : '#9ca3af'} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={handleFinish}
              activeOpacity={0.8}
              className="flex-1 flex-row items-center justify-center bg-green-600 rounded-2xl py-4"
            >
              <Text className="text-white font-semibold text-base">
                {t('onboarding.finish')}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
