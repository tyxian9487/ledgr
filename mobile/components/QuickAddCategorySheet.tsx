import { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Pressable,
} from 'react-native';
import { X, Check } from 'lucide-react-native';
import { useApp } from '../context/AppContext';
import { useTranslation } from '../context/LanguageContext';
import { ICON_OPTIONS, COLOR_OPTIONS, CustomCategory } from '../types';
import CategoryIcon, { CategoryIconRaw } from './home/CategoryIcon';

interface Props {
  visible: boolean;
  defaultType: 'expense' | 'income';
  onSave: (cat: CustomCategory) => void;
  onClose: () => void;
}

export default function QuickAddCategorySheet({ visible, defaultType, onSave, onClose }: Props) {
  const { addCustomCategory } = useApp();
  const { t } = useTranslation();

  const [label, setLabel] = useState('');
  const [icon, setIcon] = useState('Star');
  const [color, setColor] = useState('#f97316');

  function handleSave() {
    if (!label.trim()) return;
    const newCat = addCustomCategory({ label: label.trim(), icon, color, type: defaultType });
    onSave(newCat);
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-white dark:bg-gray-900">
        {/* Drag pill */}
        <View className="items-center pt-3 pb-1">
          <View className="w-10 h-1 rounded-full bg-gray-200 dark:bg-gray-700" />
        </View>

        {/* Header */}
        <View className="flex-row items-center justify-between px-5 pt-2 pb-3 border-b border-gray-100 dark:border-gray-800">
          <Text className="text-base font-bold text-gray-900 dark:text-white">{t('catmgr.new')}</Text>
          <TouchableOpacity
            onPress={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 items-center justify-center"
          >
            <X size={15} color="#6b7280" />
          </TouchableOpacity>
        </View>

        <ScrollView
          className="flex-1 px-5"
          contentContainerStyle={{ paddingVertical: 16, gap: 20 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Name */}
          <View>
            <Text className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">{t('catmgr.name')}</Text>
            <TextInput
              placeholder={t('catmgr.name_ph')}
              placeholderTextColor="#d1d5db"
              value={label}
              onChangeText={setLabel}
              maxLength={24}
              className="border-2 border-gray-100 dark:border-gray-800 rounded-2xl px-4 py-3 text-sm bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white"
            />
          </View>

          {/* Color */}
          <View>
            <Text className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">{t('catmgr.color')}</Text>
            <View className="flex-row flex-wrap gap-2.5">
              {COLOR_OPTIONS.map(c => (
                <TouchableOpacity
                  key={c}
                  onPress={() => setColor(c)}
                  style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: c, alignItems: 'center', justifyContent: 'center' }}
                >
                  {color === c && <Check size={14} color="#ffffff" strokeWidth={3} />}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Icon picker */}
          <View>
            <View className="flex-row items-center mb-3">
              <Text className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t('catmgr.icon')}</Text>
              <View className="flex-row items-center gap-2 ml-auto">
                <CategoryIcon icon={icon} color={color} size={16} />
                <Text className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                  {label || t('gform.preview')}
                </Text>
              </View>
            </View>
            <View className="flex-row flex-wrap gap-2">
              {ICON_OPTIONS.map(ico => (
                <TouchableOpacity
                  key={ico}
                  onPress={() => setIcon(ico)}
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    backgroundColor: icon === ico ? color + '25' : '#f3f4f6',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderWidth: icon === ico ? 2 : 0,
                    borderColor: icon === ico ? color : 'transparent',
                  }}
                >
                  <CategoryIconRaw icon={ico} color={icon === ico ? color : '#9ca3af'} size={18} />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>

        {/* Save button */}
        <View className="px-5 pt-3 pb-8 border-t border-gray-100 dark:border-gray-800">
          <TouchableOpacity
            onPress={handleSave}
            disabled={!label.trim()}
            className={`w-full py-4 rounded-2xl items-center ${label.trim() ? 'bg-green-600' : 'bg-green-600 opacity-40'}`}
          >
            <Text className="text-white font-bold text-sm">{t('catmgr.save')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
