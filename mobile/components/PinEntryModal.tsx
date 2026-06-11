import { useState, useEffect, useRef } from 'react';
import {
  Modal, View, Text, TouchableOpacity, StyleSheet,
  TextInput, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Delete, ShieldCheck, Fingerprint } from 'lucide-react-native';
import {
  verifyPin, getPinLength, isBiometricEnabled,
  getSecurityQuestionIndex, hasSecurityQuestion,
  verifySecurityAnswer, savePin, savePinLength,
} from '../utils/pin';
import { useTranslation } from '../context/LanguageContext';
import { useApp } from '../context/AppContext';
import * as LocalAuthentication from 'expo-local-authentication';

type Screen = 'pin' | 'forgot_q' | 'reset_enter' | 'reset_confirm';

interface Props {
  visible: boolean;
  onSuccess: () => void;
  onCancel?: () => void;
}

const MAX_ATTEMPTS = 5;
const SECURITY_QUESTION_KEYS = [
  'pin.security_q_1',
  'pin.security_q_2',
  'pin.security_q_3',
] as const;

export default function PinEntryModal({ visible, onSuccess, onCancel }: Props) {
  const { t } = useTranslation();
  const { darkMode } = useApp();
  const insets = useSafeAreaInsets();

  const [screen, setScreen] = useState<Screen>('pin');
  const [pinLength, setPinLength] = useState<4 | 6>(4);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [bioEnabled, setBioEnabled] = useState(false);
  const bioTriggered = useRef(false);

  // Forgot PIN state
  const [sqIndex, setSqIndex] = useState<number | null>(null);
  const [sqAnswer, setSqAnswer] = useState('');
  const [sqError, setSqError] = useState('');
  const [hasSQ, setHasSQ] = useState(false);

  // Reset PIN state
  const [newPinLength] = useState<4 | 6>(4);
  const [newFirstPin, setNewFirstPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [newError, setNewError] = useState('');

  useEffect(() => {
    if (!visible) {
      setScreen('pin');
      setPin('');
      setError('');
      setAttempts(0);
      setSqAnswer('');
      setSqError('');
      setNewFirstPin('');
      setNewPin('');
      setNewError('');
      bioTriggered.current = false;
    }
  }, [visible]);

  // Load PIN length + biometric state when shown
  useEffect(() => {
    if (!visible) return;
    getPinLength().then(setPinLength);
    isBiometricEnabled().then(setBioEnabled);
    hasSecurityQuestion().then(setHasSQ);
    getSecurityQuestionIndex().then(setSqIndex);
  }, [visible]);

  // Auto-trigger biometric on first show
  useEffect(() => {
    if (!visible || !bioEnabled || bioTriggered.current) return;
    bioTriggered.current = true;
    triggerBiometric();
  }, [visible, bioEnabled]);

  async function triggerBiometric() {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: t('pin.biometric_title'),
        cancelLabel: t('pin.entry_cancel'),
        disableDeviceFallback: true,
      });
      if (result.success) {
        onSuccess();
      }
    } catch {}
  }

  // Auto-verify PIN once full length reached
  useEffect(() => {
    if (screen !== 'pin') return;
    if (pin.length !== pinLength) return;
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
  }, [pin, screen]);

  // Auto-advance reset PIN
  useEffect(() => {
    if (screen !== 'reset_enter' && screen !== 'reset_confirm') return;
    if (newPin.length !== pinLength) return;
    const timer = setTimeout(() => {
      if (screen === 'reset_enter') {
        setNewFirstPin(newPin);
        setNewPin('');
        setScreen('reset_confirm');
        setNewError('');
      } else {
        if (newPin === newFirstPin) {
          savePin(newPin);
          savePinLength(pinLength);
          setNewPin('');
          onSuccess();
        } else {
          setNewError(t('pin.setup_mismatch'));
          setNewPin('');
          setScreen('reset_enter');
          setNewFirstPin('');
        }
      }
    }, 150);
    return () => clearTimeout(timer);
  }, [newPin, screen]);

  function pressDigit(d: string) {
    const active = (screen === 'pin' || screen === 'reset_enter' || screen === 'reset_confirm');
    if (!active) return;
    const target = screen === 'pin' ? pin : newPin;
    if (target.length < pinLength && attempts < MAX_ATTEMPTS) {
      if (screen === 'pin') setPin(p => p + d);
      else setNewPin(p => p + d);
    }
  }

  function pressBack() {
    if (screen === 'pin') setPin(p => p.slice(0, -1));
    else setNewPin(p => p.slice(0, -1));
  }

  async function handleSQSubmit() {
    if (!sqAnswer.trim()) return;
    const ok = await verifySecurityAnswer(sqAnswer.trim());
    if (ok) {
      setSqError('');
      setScreen('reset_enter');
    } else {
      setSqError(t('pin.security_q_wrong'));
    }
  }

  const locked = attempts >= MAX_ATTEMPTS;
  const bg = darkMode ? '#111827' : '#ffffff';
  const surface = darkMode ? '#1f2937' : '#f9fafb';
  const textPrimary = darkMode ? '#f9fafb' : '#111827';
  const textSec = darkMode ? '#9ca3af' : '#6b7280';
  const dotFill = '#16a34a';
  const dotEmpty = darkMode ? '#374151' : '#e5e7eb';
  const btnBg = darkMode ? '#1f2937' : '#f3f4f6';
  const accent = '#16a34a';

  const activePin = (screen === 'reset_enter' || screen === 'reset_confirm') ? newPin : pin;

  return (
    <Modal visible={visible} animationType="fade" transparent={false} onRequestClose={onCancel}>
      <View style={[s.root, { backgroundColor: bg, paddingTop: Math.max(16, insets.top), paddingBottom: insets.bottom + 16 }]}>

        {/* ── Main PIN entry screen ── */}
        {(screen === 'pin' || screen === 'reset_enter' || screen === 'reset_confirm') && (
          <>
            <View style={s.body}>
              <Text style={[s.appName, { color: accent }]}>Kachingo</Text>
              <Text style={[s.pinTitle, { color: textPrimary }]}>
                {screen === 'pin'
                  ? t('pin.entry_title')
                  : screen === 'reset_enter'
                  ? t('pin.reset_pin')
                  : t('pin.setup_confirm')}
              </Text>

              {/* Dots */}
              <View style={s.dotsRow}>
                {Array.from({ length: pinLength }).map((_, i) => (
                  <View key={i} style={[s.dot, { backgroundColor: i < activePin.length ? dotFill : dotEmpty }]} />
                ))}
              </View>

              {error || newError ? (
                <Text style={[s.errorTxt, locked && { color: '#d97706' }]}>{error || newError}</Text>
              ) : null}

              {/* Biometric button */}
              {screen === 'pin' && bioEnabled && !locked && (
                <TouchableOpacity onPress={triggerBiometric} style={[s.bioBtn, { backgroundColor: surface }]} activeOpacity={0.75}>
                  <Fingerprint size={18} color={accent} />
                  <Text style={[s.bioBtnTxt, { color: accent }]}>{t('pin.biometric_title')}</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Numpad */}
            <View style={s.pad}>
              {['1','2','3','4','5','6','7','8','9'].map(d => (
                <TouchableOpacity
                  key={d}
                  onPress={() => pressDigit(d)}
                  style={[s.key, { backgroundColor: btnBg }]}
                  activeOpacity={0.6}
                  disabled={locked && screen === 'pin'}
                >
                  <Text style={[s.keyTxt, { color: textPrimary }, locked && screen === 'pin' && { opacity: 0.3 }]}>{d}</Text>
                </TouchableOpacity>
              ))}

              {/* Bottom row: cancel / forgot | 0 | delete */}
              {screen === 'pin' ? (
                onCancel ? (
                  <TouchableOpacity onPress={onCancel} style={s.key} activeOpacity={0.6}>
                    <Text style={[s.cancelTxt, { color: textSec }]}>{t('pin.entry_cancel')}</Text>
                  </TouchableOpacity>
                ) : (
                  hasSQ ? (
                    <TouchableOpacity onPress={() => setScreen('forgot_q')} style={s.key} activeOpacity={0.6}>
                      <Text style={[s.cancelTxt, { color: textSec, fontSize: 11 }]}>{t('pin.forgot_pin')}</Text>
                    </TouchableOpacity>
                  ) : (
                    <View style={s.key} />
                  )
                )
              ) : (
                <View style={s.key} />
              )}

              <TouchableOpacity
                onPress={() => pressDigit('0')}
                style={[s.key, { backgroundColor: btnBg }]}
                activeOpacity={0.6}
                disabled={locked && screen === 'pin'}
              >
                <Text style={[s.keyTxt, { color: textPrimary }, locked && screen === 'pin' && { opacity: 0.3 }]}>0</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={pressBack} style={[s.key, { backgroundColor: btnBg }]} activeOpacity={0.6}>
                <Delete size={20} color={textSec} />
              </TouchableOpacity>
            </View>

            {/* Forgot PIN link when locked (shows below numpad) */}
            {locked && hasSQ && (
              <TouchableOpacity onPress={() => { setAttempts(0); setScreen('forgot_q'); }} style={{ alignItems: 'center', paddingTop: 16 }}>
                <Text style={{ color: accent, fontSize: 14, fontWeight: '600' }}>{t('pin.forgot_pin')}</Text>
              </TouchableOpacity>
            )}
          </>
        )}

        {/* ── Forgot PIN — security question screen ── */}
        {screen === 'forgot_q' && (
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
            <ScrollView contentContainerStyle={s.sqContainer} keyboardShouldPersistTaps="handled">
              <TouchableOpacity onPress={() => setScreen('pin')} style={{ marginBottom: 16 }}>
                <Text style={{ color: accent, fontSize: 14 }}>← {t('common.back')}</Text>
              </TouchableOpacity>

              <ShieldCheck size={40} color={accent} style={{ marginBottom: 12 }} />
              <Text style={[s.pinTitle, { color: textPrimary, marginBottom: 4 }]}>{t('pin.security_q_title')}</Text>

              {sqIndex !== null && (
                <Text style={[s.sqQuestion, { color: textSec, backgroundColor: surface }]}>
                  {t(SECURITY_QUESTION_KEYS[sqIndex] as any)}
                </Text>
              )}

              <Text style={[s.answerLabel, { color: textSec }]}>{t('pin.security_q_answer')}</Text>
              <TextInput
                value={sqAnswer}
                onChangeText={v => { setSqAnswer(v); setSqError(''); }}
                placeholder={t('pin.security_q_answer')}
                placeholderTextColor={textSec}
                style={[s.answerInput, { backgroundColor: surface, color: textPrimary, borderColor: sqError ? '#ef4444' : 'transparent' }]}
                autoCapitalize="none"
                autoFocus
              />
              {sqError ? <Text style={s.errorTxt}>{sqError}</Text> : null}

              <TouchableOpacity onPress={handleSQSubmit} style={[s.nextBtn, { backgroundColor: accent }]} activeOpacity={0.8}>
                <Text style={s.nextBtnTxt}>{t('common.confirm')}</Text>
              </TouchableOpacity>
            </ScrollView>
          </KeyboardAvoidingView>
        )}

      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  body: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  appName: { fontSize: 32, fontWeight: '900', letterSpacing: -1, marginBottom: 6 },
  pinTitle: { fontSize: 18, fontWeight: '600', marginBottom: 32 },
  dotsRow: { flexDirection: 'row', gap: 12, marginBottom: 16, flexWrap: 'wrap', justifyContent: 'center' },
  dot: { width: 18, height: 18, borderRadius: 9 },
  errorTxt: { color: '#ef4444', fontSize: 14, fontWeight: '500', marginTop: 8 },
  bioBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 10, marginTop: 20 },
  bioBtnTxt: { fontSize: 14, fontWeight: '600' },
  pad: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 32, gap: 12 },
  key: { width: '30%', aspectRatio: 1.6, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  keyTxt: { fontSize: 24, fontWeight: '500' },
  cancelTxt: { fontSize: 14, fontWeight: '500' },
  // Security question
  sqContainer: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 20, paddingBottom: 32 },
  sqQuestion: { fontSize: 15, fontWeight: '600', padding: 14, borderRadius: 12, marginBottom: 20, marginTop: 8 },
  answerLabel: { fontSize: 13, marginBottom: 8 },
  answerInput: { borderRadius: 12, padding: 14, fontSize: 15, borderWidth: 1.5, marginBottom: 4 },
  nextBtn: { borderRadius: 16, padding: 16, alignItems: 'center', marginTop: 12 },
  nextBtnTxt: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
