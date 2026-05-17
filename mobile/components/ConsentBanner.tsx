import { View, Text, TouchableOpacity, Modal } from 'react-native';
import { useApp } from '../context/AppContext';

export default function ConsentBanner() {
  const { analyticsConsent, isAuthenticated, hasCompletedOnboarding, grantAnalyticsConsent, denyAnalyticsConsent } = useApp();

  const visible = isAuthenticated && hasCompletedOnboarding && analyticsConsent === null;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View className="flex-1 justify-end bg-black/40">
        <View className="bg-white rounded-t-3xl px-6 pt-6 pb-10">
          <View className="w-10 h-1 bg-gray-200 rounded-full self-center mb-6" />

          <View className="bg-green-100 rounded-2xl w-14 h-14 items-center justify-center mb-4">
            <Text style={{ fontSize: 28 }}>📊</Text>
          </View>

          <Text className="text-xl font-bold text-gray-900 mb-2">
            Help improve Kachingo
          </Text>
          <Text className="text-gray-500 text-sm leading-relaxed mb-6">
            We'd like to collect anonymous usage data to understand how people use the app and make it better. No personal financial data is ever shared.
          </Text>

          <TouchableOpacity
            onPress={grantAnalyticsConsent}
            activeOpacity={0.8}
            className="bg-green-600 rounded-2xl py-4 items-center mb-3"
          >
            <Text className="text-white font-semibold text-base">Accept</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={denyAnalyticsConsent}
            activeOpacity={0.8}
            className="rounded-2xl py-4 items-center"
          >
            <Text className="text-gray-400 text-base">No thanks</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
