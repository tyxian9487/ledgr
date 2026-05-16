import { View, Text, TouchableOpacity, Image, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../../context/AppContext';
import { useTranslation } from '../../context/LanguageContext';

const { width } = Dimensions.get('window');

const FEATURES = [
  { emoji: '📊', text: 'Track every expense instantly' },
  { emoji: '🎯', text: 'Budget with smart savings goals' },
  { emoji: '📸', text: 'AI-powered receipt scanning' },
  { emoji: '🌍', text: '5 languages supported' },
];

export default function LoginScreen() {
  const { signIn } = useApp();
  const { t } = useTranslation();

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'bottom']}>
      {/* ── Top section ───────────────────────────────────────────── */}
      <View className="flex-1 items-center justify-center px-8">
        {/* Mascot */}
        <View className="items-center justify-center mb-2" style={{ width: width * 0.55, height: width * 0.55 }}>
          <Image
            source={require('../../assets/mascot.png')}
            style={{ width: '100%', height: '100%' }}
            resizeMode="contain"
          />
        </View>

        {/* Brand */}
        <Text className="text-4xl font-black text-gray-900 tracking-tight">
          Kachingo
        </Text>
        <Text className="text-base text-gray-400 mt-2 text-center leading-relaxed">
          {t('login.tagline')}
        </Text>

        {/* Feature pills */}
        <View className="flex-row flex-wrap justify-center gap-2 mt-6">
          {FEATURES.map(({ emoji, text }) => (
            <View
              key={text}
              className="flex-row items-center bg-gray-50 rounded-full px-3 py-1.5 gap-1.5"
            >
              <Text style={{ fontSize: 13 }}>{emoji}</Text>
              <Text className="text-xs text-gray-500 font-medium">{text}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* ── Bottom section ─────────────────────────────────────────── */}
      <View className="px-6 pb-6 gap-y-3">
        {/* Google */}
        <TouchableOpacity
          onPress={() => signIn('google')}
          activeOpacity={0.8}
          className="flex-row items-center justify-center border border-gray-200 rounded-2xl py-4 bg-white"
          style={{ shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 2 }}
        >
          <View className="w-6 h-6 rounded-full bg-red-500 items-center justify-center mr-3">
            <Text className="text-white text-xs font-black">G</Text>
          </View>
          <Text className="text-gray-700 text-base font-semibold">
            {t('login.google')}
          </Text>
        </TouchableOpacity>

        {/* Apple */}
        <TouchableOpacity
          onPress={() => signIn('apple')}
          activeOpacity={0.8}
          className="flex-row items-center justify-center bg-gray-900 rounded-2xl py-4"
        >
          <Text className="text-white mr-3 text-lg" style={{ lineHeight: 22 }}>

          </Text>
          <Text className="text-white text-base font-semibold">
            {t('login.apple')}
          </Text>
        </TouchableOpacity>

        {/* Guest */}
        <TouchableOpacity
          onPress={() => signIn('google')}
          activeOpacity={0.7}
          className="items-center py-2"
        >
          <Text className="text-green-600 text-sm font-medium">
            {t('login.guest')}
          </Text>
        </TouchableOpacity>

        {/* Legal */}
        <Text className="text-gray-300 text-xs text-center leading-5">
          {t('login.agree')}{' '}
          <Text className="text-gray-400">{t('login.terms')}</Text>
          {' '}{t('login.and')}{' '}
          <Text className="text-gray-400">{t('login.privacy')}</Text>.
        </Text>
      </View>
    </SafeAreaView>
  );
}
