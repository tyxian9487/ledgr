import { useState, useEffect } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, Delete } from 'lucide-react-native';
import { savePin } from '../utils/pin';
import { useTranslation } from '../context/LanguageContext';
import { useApp } from '../context/AppContext';

interface Props {
  visible: boolean;
  onSuccess: () => void;
  onClose: () => void;
}

const PIN_LENGTH = 4;

export default function PinSetupModal({ visible, onSuccess, onClose }: Props) {
  const { t } = useTranslation();
  const { darkMode } = useApp();
  const insets = useSafeAreaInsets();

  const [step, setStep] = useState<'enter' | 'confirm'>('enter');
  const [firstPin, setFirstPin] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!visible) {
      setStep('enter');
      setFirstPin('');
      setPin('');
      setError('');
    }
  }, [visible]);

  useEffect(() => {
    if (pin.length !== PIN_LENGTH) return;
    const timer = setTimeout(async () => {
      if (step === 'enter') {
        setFirstPin(pin);
        setPin('');
        setStep('confirm');
        setError('');
      } else {
        if (pin === firstPin) {
          await savePin(pin);
          onSuccess();
        } else {
          setError(t('pin.setup_mismatch'));
          setPin('');
          setStep('enter');
          setFirstPin('');
        }
      }
    }, 150);
    return () => clearTimeout(timer);
  }, [pin]);

  function pressDigit(d: string) {
    if (pin.length < PIN_LENGTH) setPin(p => p + d);
  }

  function pressBack() {
    setPin(p => p.slice(0, -1));
  }

  const bg = darkMode ? '#111827' : '#ffffff';
  const textPrimary = darkMode ? '#f9fafb' : '#111827';
  const textSec = darkMode ? '#9ca3af' : '#6b7280';
  const dotFill = '#16a34a';
  const dotEmpty = darkMode ? '#374151' : '#e5e7eb';
  const btnBg = darkMode ? '#1f2937' : '#f3f4f6';

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[s.root, { backgroundColor: bg, paddingTop: Math.max(16, insets.top), paddingBottom: insets.bottom + 16 }]}>
        <View style={s.header}>
          <Text style={[s.title, { color: textPrimary }]}>{t('pin.setup_title')}</Text>
          <TouchableOpacity onPress={onClose} style={[s.closeBtn, { backgroundColor: btnBg }]}>
            <X size={16} color={textSec} />
          </TouchableOpacity>
        </View>

        <View style={s.body}>
          <Text style={[s.prompt, { color: textSec }]}>
            {step === 'enter' ? t('pin.setup_enter') : t('pin.setup_confirm')}
          </Text>

          {/* Dots */}
          <View style={s.dotsRow}>
            {Array.from({ length: PIN_LENGTH }).map((_, i) => (
              <View
                key={i}
                style={[s.dot, { backgroundColor: i < pin.length ? dotFill : dotEmpty }]}
              />
            ))}
          </View>

          {error ? <Text style={s.errorTxt}>{error}</Text> : null}
        </View>

        {/* Numpad */}
        <View style={s.pad}>
          {['1','2','3','4','5','6','7','8','9'].map(d => (
            <TouchableOpacity key={d} onPress={() => pressDigit(d)} style={[s.key, { backgroundColor: btnBg }]} activeOpacity={0.6}>
              <Text style={[s.keyTxt, { color: textPrimary }]}>{d}</Text>
            </TouchableOpacity>
          ))}
          <View style={s.key} />
          <TouchableOpacity onPress={() => pressDigit('0')} style={[s.key, { backgroundColor: btnBg }]} activeOpacity={0.6}>
            <Text style={[s.keyTxt, { color: textPrimary }]}>0</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={pressBack} style={[s.key, { backgroundColor: btnBg }]} activeOpacity={0.6}>
            <Delete size={20} color={textSec} />
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 8 },
  title: { fontSize: 18, fontWeight: '700' },
  closeBtn: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  body: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  prompt: { fontSize: 16, marginBottom: 32, textAlign: 'center' },
  dotsRow: { flexDirection: 'row', gap: 16, marginBottom: 16 },
  dot: { width: 18, height: 18, borderRadius: 9 },
  errorTxt: { color: '#ef4444', fontSize: 14, fontWeight: '500', marginTop: 8 },
  pad: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 32, gap: 12 },
  key: { width: '30%', aspectRatio: 1.6, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  keyTxt: { fontSize: 24, fontWeight: '500' },
});
