import { View, Text, TouchableOpacity, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft, LogOut } from 'lucide-react-native';
import { useApp } from '../context/AppContext';
import { useTranslation } from '../context/LanguageContext';

function providerFromEmail(email: string): { label: string; icon: string } {
  if (!email) return { label: 'Guest', icon: '👤' };
  if (email.endsWith('@privaterelay.appleid.com')) return { label: 'Apple', icon: '🍎' };
  return { label: 'Google', icon: '🔵' };
}

export default function LinkedAccountScreen() {
  const { userProfile, signOut, darkMode } = useApp();
  const { t } = useTranslation();
  const router = useRouter();

  const { label: providerLabel, icon: providerIcon } = providerFromEmail(userProfile.email || '');
  const isGuest = !userProfile.email;

  function confirmSignOut() {
    Alert.alert(t('linked.sign_out'), t('profile.sign_out_confirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('linked.sign_out'), style: 'destructive', onPress: signOut },
    ]);
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-950">
      {/* Nav bar */}
      <View className="flex-row items-center px-2 py-3 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
        <TouchableOpacity onPress={() => router.back()} className="p-2">
          <ChevronLeft size={22} color={darkMode ? '#f9fafb' : '#111827'} />
        </TouchableOpacity>
        <Text className="flex-1 text-base font-bold text-gray-900 dark:text-white ml-1">{t('linked.title')}</Text>
      </View>

      {/* Account card */}
      <View className="mx-4 mt-6 bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-50 dark:border-gray-800 overflow-hidden">
        {/* Avatar + name */}
        <View className="items-center py-6 px-5 border-b border-gray-50 dark:border-gray-800">
          {userProfile.avatar ? (
            <Image
              source={{ uri: userProfile.avatar }}
              style={{ width: 80, height: 80, borderRadius: 40, marginBottom: 12 }}
            />
          ) : (
            <View className="w-20 h-20 rounded-full bg-green-600 items-center justify-center mb-3">
              <Text className="text-white font-black text-3xl">
                {(userProfile.name || 'U').charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          <Text className="font-bold text-lg text-gray-900 dark:text-white">{userProfile.name || 'User'}</Text>
          {userProfile.email ? (
            <Text className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{userProfile.email}</Text>
          ) : (
            <Text className="text-sm text-gray-400 dark:text-gray-500 mt-0.5 italic">{t('linked.no_email')}</Text>
          )}
        </View>

        {/* Details */}
        <View className="px-5 py-4 gap-3">
          <View className="flex-row items-center justify-between py-1">
            <Text className="text-sm text-gray-500 dark:text-gray-400">{t('linked.provider')}</Text>
            <View className="flex-row items-center gap-2">
              <Text style={{ fontSize: 16 }}>{providerIcon}</Text>
              <Text className="text-sm font-semibold text-gray-900 dark:text-white">{providerLabel}</Text>
            </View>
          </View>
          {!isGuest && (
            <View className="flex-row items-center justify-between py-1">
              <Text className="text-sm text-gray-500 dark:text-gray-400">{t('linked.email_label')}</Text>
              <Text className="text-sm text-gray-700 dark:text-gray-300 flex-1 text-right ml-4" numberOfLines={1}>
                {userProfile.email}
              </Text>
            </View>
          )}
        </View>
      </View>

      {isGuest && (
        <View className="mx-4 mt-3 bg-amber-50 dark:bg-amber-900/20 rounded-2xl px-4 py-3 border border-amber-100 dark:border-amber-900/40">
          <Text className="text-xs text-amber-700 dark:text-amber-300 text-center leading-relaxed">
            {t('linked.guest_note')}
          </Text>
        </View>
      )}

      {/* Sign out */}
      <View className="mx-4 mt-6">
        <TouchableOpacity
          onPress={confirmSignOut}
          className="flex-row items-center justify-center gap-2.5 bg-red-50 dark:bg-red-900/20 rounded-2xl py-4 border border-red-100 dark:border-red-900/40"
          activeOpacity={0.75}
        >
          <LogOut size={16} color="#ef4444" />
          <Text className="text-red-500 font-semibold text-sm">{t('linked.sign_out')}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
