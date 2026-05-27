import { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Star, X, Settings, ChevronRight, RotateCcw, Check } from 'lucide-react-native';
import { usePurchases } from '../context/PurchasesContext';
import { useTranslation } from '../context/LanguageContext';

export default function SubscriptionSheet({ onClose }: { onClose: () => void }) {
  const { isPro, isLoading, currentOffering, purchasePackage,
          presentCustomerCenter, restorePurchases } = usePurchases();
  const { t } = useTranslation();
  const [working, setWorking] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'annual' | 'monthly'>('annual');

  const annualPkg  = currentOffering?.annual  ?? null;
  const monthlyPkg = currentOffering?.monthly ?? null;
  const selectedPkg = selectedPlan === 'annual' ? annualPkg : monthlyPkg;

  const annualPrice  = annualPkg?.product.priceString  ?? '$29.99';
  const monthlyPrice = monthlyPkg?.product.priceString ?? '$4.99';

  async function handleManage() {
    try {
      await presentCustomerCenter();
    } catch (e) {
      console.warn('[RevenueCat] Customer Center error:', e);
    }
  }

  const handlePurchase = useCallback(async () => {
    if (!selectedPkg || working) return;
    setWorking(true);
    try {
      const success = await purchasePackage(selectedPkg);
      if (success) onClose();
    } catch (e: any) {
      if (e?.code !== 1) {
        Alert.alert(t('common.error'), e.message ?? t('sub.restore_failed'));
      }
    } finally {
      setWorking(false);
    }
  }, [selectedPkg, working, purchasePackage, onClose, t]);

  async function handleRestore() {
    setWorking(true);
    try {
      const hasPro = await restorePurchases();
      Alert.alert(
        hasPro ? t('profile.restored_title') : t('profile.nothing_to_restore'),
        hasPro
          ? t('profile.pro_restored_msg')
          : t('profile.no_purchases_msg'),
      );
    } catch {
      Alert.alert(t('profile.restore_failed'), t('profile.something_wrong'));
    } finally {
      setWorking(false);
    }
  }

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView className="flex-1 bg-white dark:bg-gray-900">
        <View className="flex-row items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
          <Text className="text-lg font-bold text-gray-900 dark:text-white">{t('profile.subscription')}</Text>
          <TouchableOpacity
            onPress={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 items-center justify-center"
          >
            <X size={16} color="#6b7280" />
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="small" color="#16a34a" />
          </View>
        ) : isPro ? (
          <ScrollView className="flex-1">
            <View className="mx-4 mt-6 rounded-2xl overflow-hidden shadow-sm">
              <View className="px-5 py-5 items-center" style={{ backgroundColor: '#052e16' }}>
                <View className="flex-row items-center gap-2 mb-1">
                  <Star size={16} color="#4ade80" fill="#4ade80" />
                  <Text className="text-green-400 font-black text-sm uppercase tracking-widest">
                    {t('profile.pro_title')}
                  </Text>
                </View>
                <Text className="text-white/60 text-xs text-center">
                  {t('profile.pro_access')}
                </Text>
              </View>
              <View className="bg-white border-t border-gray-50 dark:border-gray-900">
                <TouchableOpacity
                  onPress={handleManage}
                  className="flex-row items-center gap-3 px-5 py-3.5 border-b border-gray-50 dark:border-gray-900"
                  activeOpacity={0.7}
                >
                  <View className="w-8 h-8 rounded-xl bg-green-50 items-center justify-center">
                    <Settings size={15} color="#16a34a" />
                  </View>
                  <Text className="flex-1 text-sm font-medium text-gray-900 dark:text-white">
                    {t('profile.manage_sub')}
                  </Text>
                  <ChevronRight size={14} color="#d1d5db" />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleRestore}
                  disabled={working}
                  className="flex-row items-center gap-3 px-5 py-3.5"
                  activeOpacity={0.7}
                >
                  <View className="w-8 h-8 rounded-xl bg-gray-100 dark:bg-gray-800 items-center justify-center">
                    <RotateCcw size={15} color="#6b7280" />
                  </View>
                  <Text className="flex-1 text-sm font-medium text-gray-900 dark:text-white">
                    {t('profile.restore_purchases')}
                  </Text>
                  {working ? (
                    <ActivityIndicator size="small" color="#6b7280" />
                  ) : (
                    <ChevronRight size={14} color="#d1d5db" />
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        ) : (
          <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
            {/* ── Hero ── */}
            <View className="mx-4 mt-6 rounded-2xl overflow-hidden" style={{ backgroundColor: '#052e16' }}>
              <View className="px-5 pt-6 pb-5 items-center">
                <Image
                  source={require('../assets/m_payment.png')}
                  style={{ width: 88, height: 88, marginBottom: 8 }}
                  resizeMode="contain"
                />
                <Text className="text-white font-black text-xl mb-1">{t('profile.pro_title')}</Text>
                <Text className="text-white/60 text-xs text-center leading-relaxed">{t('profile.pro_subtitle')}</Text>
              </View>
            </View>

            {/* ── Plan selector ── */}
            <View className="mx-4 mt-4">
              <View className="flex-row bg-gray-100 dark:bg-gray-800 rounded-2xl p-1 gap-1">
                <TouchableOpacity
                  onPress={() => setSelectedPlan('annual')}
                  activeOpacity={0.8}
                  className={`flex-1 py-3.5 rounded-xl items-center ${selectedPlan === 'annual' ? 'bg-white dark:bg-gray-700' : ''}`}
                  style={selectedPlan === 'annual' ? { shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 } : {}}
                >
                  <Text className="text-[9px] font-black text-green-600 uppercase tracking-widest mb-0.5">{t('sub.best_value')}</Text>
                  <Text className={`text-xl font-black ${selectedPlan === 'annual' ? 'text-gray-900 dark:text-white' : 'text-gray-400'}`}>{annualPrice}</Text>
                  <Text className={`text-xs mt-0.5 ${selectedPlan === 'annual' ? 'text-gray-500 dark:text-gray-400' : 'text-gray-400'}`}>{t('sub.per_year')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setSelectedPlan('monthly')}
                  activeOpacity={0.8}
                  className={`flex-1 py-3.5 rounded-xl items-center ${selectedPlan === 'monthly' ? 'bg-white dark:bg-gray-700' : ''}`}
                  style={selectedPlan === 'monthly' ? { shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 } : {}}
                >
                  <Text className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5"> </Text>
                  <Text className={`text-xl font-black ${selectedPlan === 'monthly' ? 'text-gray-900 dark:text-white' : 'text-gray-400'}`}>{monthlyPrice}</Text>
                  <Text className={`text-xs mt-0.5 ${selectedPlan === 'monthly' ? 'text-gray-500 dark:text-gray-400' : 'text-gray-400'}`}>{t('sub.per_month')}</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* ── Features ── */}
            <View className="mx-4 mt-3 bg-white dark:bg-gray-900 rounded-2xl px-5 py-4 border border-gray-100 dark:border-gray-800">
              {([
                t('profile.pro_feature1'),
                t('profile.pro_feature2'),
                t('profile.pro_feature3'),
                t('profile.pro_feature4'),
              ] as string[]).map(feat => (
                <View key={feat} className="flex-row items-center gap-3 py-2">
                  <View className="w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/30 items-center justify-center flex-shrink-0">
                    <Check size={11} color="#16a34a" strokeWidth={3} />
                  </View>
                  <Text className="text-sm text-gray-700 dark:text-gray-300 flex-1">{feat}</Text>
                </View>
              ))}
            </View>

            {/* ── CTA button ── */}
            <View className="mx-4 mt-4">
              <TouchableOpacity
                onPress={handlePurchase}
                disabled={working || !selectedPkg}
                className="w-full bg-green-600 rounded-2xl py-4 items-center"
                activeOpacity={0.85}
                style={{ elevation: 4, shadowColor: '#16a34a', shadowOpacity: 0.3, shadowRadius: 8, opacity: working || !selectedPkg ? 0.6 : 1 }}
              >
                {working ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Text className="text-white font-black text-base">
                      {selectedPlan === 'annual'
                        ? `${t('sub.get_annual')} — ${annualPrice}/yr`
                        : `${t('sub.get_monthly')} — ${monthlyPrice}/mo`}
                    </Text>
                    <Text className="text-white/70 text-xs mt-0.5">
                      {selectedPlan === 'annual'
                        ? t('sub.billed_annually', { price: annualPrice })
                        : t('sub.billed_monthly', { price: monthlyPrice })}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            {/* ── Restore ── */}
            <TouchableOpacity
              onPress={handleRestore}
              disabled={working}
              className="items-center pt-4"
              activeOpacity={0.7}
            >
              {working ? (
                <ActivityIndicator size="small" color="#9ca3af" />
              ) : (
                <Text className="text-xs text-gray-400">{t('profile.restore_prev')}</Text>
              )}
            </TouchableOpacity>

            {/* ── Maybe later ── */}
            <TouchableOpacity
              onPress={onClose}
              className="items-center py-4 mb-4"
              activeOpacity={0.6}
            >
              <Text className="text-xs text-gray-300 dark:text-gray-600">{t('sub.maybe_later')}</Text>
            </TouchableOpacity>
          </ScrollView>
        )}
      </SafeAreaView>
    </Modal>
  );
}
