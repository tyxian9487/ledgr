import { useState, useEffect } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Delete } from 'lucide-react-native';
import { verifyPin } from '../utils/pin';
import { useTranslation } from '../context/LanguageContext';
import { useApp } from '../context/AppContext';

interface Props {
  visible: boolean;
  onSuccess: () => void;
  /** If provided, shown as a cancel/skip button. Omit to make PIN mandatory. */
  onCancel?: () => void;
}

const PIN_LENGTH = 4;
const MAX_ATTEMPTS = 5;

export default function PinEntryModal({ visible, onSuccess, onCancel }: Props) {
  const { t } = useTranslation();
  const { darkMode } = useApp();
  const insets = useSafeAreaInsets();

  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [attempts, setAttempts] = useState(0);

  useEffect(() => {
    if (!visible) {
      setPin('');
      setError('');
      setAttempts(0);
    }
  }, [visible]);

  useEffect(() => {
    if (pin.length !== PIN_LENGTH) return;
    const timer = setTimeout(async () => {
      const ok = await verifyPin(pin);
      if (ok) {
        setPin('');
        setError('');
        setAttempts(0);
        onSuccess();
      } else {
        const next = attempts + 1;
        setAttempts(next);
        setError(next >= MAX_ATTEMPTS ? t('pin.too_many_attempts') : t('pin.entry_wrong'));
        setPin('');
      }
    }, 150);
    return () => clearTimeout(timer);
  }, [pin]);

  function pressDigit(d: string) {
    if (pin.length < PIN_LENGTH && attempts < MAX_ATTEMPTS) setPin(p => p + d);
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
  const locked = attempts >= MAX_ATTEMPTS;

  return (
    <Modal visible={visible} animationType="fade" transparent={false} onRequestClose={onCancel}>
      <View style={[s.root, { backgroundColor: bg, paddingTop: Math.max(16, insets.top), paddingBottom: insets.bottom + 16 }]}>
        <View style={s.body}>
          <Text style={[s.appName, { color: '#16a34a' }]}>Ledgr</Text>
          <Text style={[s.title, { color: textPrimary }]}>{t('pin.entry_title')}</Text>

          {/* Dots */}
          <View style={s.dotsRow}>
            {Array.from({ length: PIN_LENGTH }).map((_, i) => (
              <View
                key={i}
                style={[s.dot, { backgroundColor: i < pin.length ? dotFill : dotEmpty }]}
              />
            ))}
          </View>

          {error ? <Text style={[s.errorTxt, locked && { color: '#d97706' }]}>{error}</Text> : null}
        </View>

        {/* Numpad */}
        <View style={s.pad}>
          {['1','2','3','4','5','6','7','8','9'].map(d => (
            <TouchableOpacity
              key={d}
              onPress={() => pressDigit(d)}
              style={[s.key, { backgroundColor: btnBg }]}
              activeOpacity={0.6}
              disabled={locked}
            >
              <Text style={[s.keyTxt, { color: textPrimary }, locked && { opacity: 0.3 }]}>{d}</Text>
            </TouchableOpacity>
          ))}

          {/* Cancel / empty */}
          {onCancel ? (
            <TouchableOpacity onPress={onCancel} style={s.key} activeOpacity={0.6}>
              <Text style={[s.cancelTxt, { color: textSec }]}>{t('pin.entry_cancel')}</Text>
            </TouchableOpacity>
          ) : (
            <View style={s.key} />
          )}

          <TouchableOpacity
            onPress={() => pressDigit('0')}
            style={[s.key, { backgroundColor: btnBg }]}
            activeOpacity={0.6}
            disabled={locked}
          >
            <Text style={[s.keyTxt, { color: textPrimary }, locked && { opacity: 0.3 }]}>0</Text>
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
  body: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  appName: { fontSize: 32, fontWeight: '900', letterSpacing: -1, marginBottom: 8 },
  title: { fontSize: 18, fontWeight: '600', marginBottom: 36 },
  dotsRow: { flexDirection: 'row', gap: 16, marginBottom: 16 },
  dot: { width: 18, height: 18, borderRadius: 9 },
  errorTxt: { color: '#ef4444', fontSize: 14, fontWeight: '500', marginTop: 8 },
  pad: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 32, gap: 12 },
  key: { width: '30%', aspectRatio: 1.6, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  keyTxt: { fontSize: 24, fontWeight: '500' },
  cancelTxt: { fontSize: 14, fontWeight: '500' },
});
