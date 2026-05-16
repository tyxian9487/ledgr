import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useApp } from '../../context/AppContext';
import { useTranslation } from '../../context/LanguageContext';
import { TrendingUp, PieChart, ScanLine, Globe } from 'lucide-react-native';

const FEATURE_KEYS = [
  { icon: TrendingUp, label: 'Track every expense' },
  { icon: PieChart, label: 'Budget with smart goals' },
  { icon: ScanLine, label: 'AI-powered receipt scanning' },
  { icon: Globe, label: '5 languages supported' },
];

export default function LoginScreen() {
  const { signIn } = useApp();
  const { t } = useTranslation();

  const handleGoogle = () => signIn('google');
  const handleApple = () => signIn('apple');
  const handleGuest = () => signIn('google'); // guest flow — just authenticate

  return (
    <ScrollView
      className="flex-1 bg-white"
      contentContainerClassName="pb-10"
      showsVerticalScrollIndicator={false}
    >
      {/* Hero / header */}
      <View className="bg-green-600 px-8 pt-20 pb-12 items-center">
        <View className="bg-white/20 rounded-full w-20 h-20 items-center justify-center mb-4">
          <TrendingUp size={40} color="#fff" />
        </View>
        <Text className="text-white text-4xl font-bold tracking-tight">
          Kachingo
        </Text>
        <Text className="text-green-100 text-base mt-2 text-center">
          {t('login.tagline')}
        </Text>
      </View>

      {/* Features */}
      <View className="px-6 pt-8 pb-4">
        <Text className="text-gray-500 text-xs font-semibold uppercase tracking-widest mb-4">
          Everything you need
        </Text>
        {FEATURE_KEYS.map(({ icon: Icon, label }, i) => (
          <View key={i} className="flex-row items-center mb-4">
            <View className="bg-green-50 rounded-xl w-10 h-10 items-center justify-center mr-3">
              <Icon size={20} color="#16a34a" />
            </View>
            <Text className="text-gray-700 text-base flex-1">{label}</Text>
          </View>
        ))}
      </View>

      {/* Buttons */}
      <View className="px-6 pt-4 gap-y-3">
        {/* Google */}
        <TouchableOpacity
          onPress={handleGoogle}
          activeOpacity={0.8}
          className="flex-row items-center justify-center border border-gray-200 rounded-2xl py-4 bg-white shadow-sm"
        >
          <View className="w-6 h-6 rounded-full bg-red-500 items-center justify-center mr-3">
            <Text className="text-white text-xs font-bold">G</Text>
          </View>
          <Text className="text-gray-700 text-base font-medium">
            {t('login.google')}
          </Text>
        </TouchableOpacity>

        {/* Apple */}
        <TouchableOpacity
          onPress={handleApple}
          activeOpacity={0.8}
          className="flex-row items-center justify-center bg-black rounded-2xl py-4 shadow-sm"
        >
          <View className="w-6 h-6 rounded-full bg-white items-center justify-center mr-3">
            <Text className="text-black text-xs font-bold"></Text>
          </View>
          <Text className="text-white text-base font-medium">
            {t('login.apple')}
          </Text>
        </TouchableOpacity>

        {/* Guest */}
        <TouchableOpacity
          onPress={handleGuest}
          activeOpacity={0.7}
          className="items-center py-3"
        >
          <Text className="text-green-600 text-sm font-medium">
            {t('login.guest')}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Legal */}
      <View className="px-8 pt-2">
        <Text className="text-gray-400 text-xs text-center leading-5">
          {t('login.agree')}{' '}
          <Text className="text-green-600">{t('login.terms')}</Text>
          {' '}{t('login.and')}{' '}
          <Text className="text-green-600">{t('login.privacy')}</Text>
          {t('login.agree_suffix') ? ' ' + t('login.agree_suffix') : ''}.
        </Text>
      </View>
    </ScrollView>
  );
}
