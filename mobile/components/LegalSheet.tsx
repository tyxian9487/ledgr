import { Modal, View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { X } from 'lucide-react-native';
import { useTranslation } from '../context/LanguageContext';

interface Props {
  visible: boolean;
  type: 'terms' | 'privacy';
  onClose: () => void;
}

export default function LegalSheet({ visible, type, onClose }: Props) {
  const { t } = useTranslation();
  const isTerms = type === 'terms';

  const TERMS = [
    { title: t('terms.t1'), body: t('terms.b1') },
    { title: t('terms.t2'), body: t('terms.b2') },
    { title: t('terms.t3'), body: t('terms.b3') },
    { title: t('terms.t4'), body: t('terms.b4') },
    { title: t('terms.t5'), body: t('terms.b5') },
    { title: t('terms.t6'), body: t('terms.b6') },
    { title: t('terms.t7'), body: t('terms.b7') },
    { title: t('terms.t8'), body: t('terms.b8') },
  ];

  const PRIVACY = [
    { title: t('privacy.t1'), body: t('privacy.b1') },
    { title: t('privacy.t2'), body: t('privacy.b2') },
    { title: t('privacy.t3'), body: t('privacy.b3') },
    { title: t('privacy.t4'), body: t('privacy.b4') },
    { title: t('privacy.t5'), body: t('privacy.b5') },
    { title: t('privacy.t6'), body: t('privacy.b6') },
    { title: t('privacy.t7'), body: t('privacy.b7') },
    { title: t('privacy.t8'), body: t('privacy.b8') },
    { title: t('privacy.t9'), body: t('privacy.b9') },
  ];

  const items = isTerms ? TERMS : PRIVACY;
  const title = isTerms ? t('profile.terms') : t('profile.privacy');

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-white dark:bg-gray-900">
        {/* Header */}
        <View className="flex-row items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100 dark:border-gray-800">
          <View>
            <Text className="text-lg font-bold dark:text-white">{title}</Text>
            <Text className="text-[11px] text-gray-400 mt-0.5">{t('legal.last_updated')}</Text>
          </View>
          <TouchableOpacity
            onPress={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 items-center justify-center"
            activeOpacity={0.7}
          >
            <X size={16} color="#6b7280" />
          </TouchableOpacity>
        </View>

        {/* Scrollable content */}
        <ScrollView
          className="flex-1 px-6 py-4"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 8 }}
        >
          {items.map((item) => (
            <View key={item.title} className="mb-4">
              <Text className="text-sm font-bold dark:text-white mb-1">{item.title}</Text>
              <Text className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                {item.body}
              </Text>
            </View>
          ))}
        </ScrollView>

        {/* Footer button */}
        <View className="px-6 pt-3 pb-8 border-t border-gray-100 dark:border-gray-800">
          <TouchableOpacity
            onPress={onClose}
            className="w-full py-3 rounded-2xl bg-green-600 items-center"
            activeOpacity={0.8}
          >
            <Text className="text-white font-bold text-sm">{t('legal.i_understand')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
