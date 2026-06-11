import { useState, useEffect } from 'react';
import {
  Modal, View, Text, TouchableOpacity, StyleSheet,
  TextInput, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, Delete, ShieldCheck, Fingerprint } from 'lucide-react-native';
import {
  savePin, savePinLength, saveSecurityQuestion,
  setBiometricEnabled,
} from '../utils/pin';
import { useTranslation } from '../context/LanguageContext';
import { useApp } from '../context/AppContext';
import * as LocalAuthentication from 'expo-local-authentication';

type Step = 'length' | 'enter' | 'confirm' | 'security_q' | 'security_a' | 'biometric';

interface Props {
  visible: boolean;
  onSuccess: () => void;
  onClose: () => void;
}

export default function PinSetupModal({ visible, onSuccess, onClose }: Props) {
  const { t } = useTranslation();
  const { darkMode } = useApp();
  const insets = useSafeAreaInsets();

  const [step, setStep] = useState<Step>('length');
  const [pinLength, setPinLength] = useState<4 | 6>(4);
  const [firstPin, setFirstPin] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [selectedQ, setSelectedQ] = useState<number | null>(null);
  const [answer, setAnswer] = useState('');
  const [answerError, setAnswerError] = useState('');
  const [bioAvailable, setBioAvailable] = useState(false);

  useEffect(() => {
    if (!visible) {
      setStep('length');
      setPinLength(4);
      setFirstPin('');
      setPin('');
      setError('');
      setSelectedQ(null);
      setAnswer('');
      setAnswerError('');
    }
  }, [visible]);

  // Check biometric availability once when mounting
  useEffect(() => {
    LocalAuthentication.hasHardwareAsync().then(has => {
      if (!has) return;
      LocalAuthentication.isEnrolledAsync().then(enrolled => setBioAvailable(enrolled));
    }).catch(() => {});
  }, []);

  // Auto-advance when PIN digits are complete
  useEffect(() => {
    if (step !== 'enter' && step !== 'confirm') return;
    if (pin.length !== pinLength) return;
    const timer = setTimeout(() => {
      if (step === 'enter') {
        setFirstPin(pin);
        setPin('');
        setStep('confirm');
        setError('');
      } else {
        if (pin === firstPin) {
          savePin(pin);
          savePinLength(pinLength);
          setPin('');
          setStep('security_q');
        } else {
          setError(t('pin.setup_mismatch'));
          setPin('');
          setStep('enter');
          setFirstPin('');
        }
      }
    }, 150);
    return () => clearTimeout(timer);
  }, [pin, step, pinLength, firstPin]);

  function pressDigit(d: string) {
    if (pin.length < pinLength) setPin(p => p + d);
  }

  function pressBack() {
    setPin(p => p.slice(0, -1));
  }

  async function handleSecurityNext() {
    if (selectedQ === null) return;
    if (answer.trim().length === 0) {
      setAnswerError(t('pin.security_q_wrong'));
      return;
    }
    await saveSecurityQuestion(selectedQ, answer.trim());
    if (bioAvailable) {
      setStep('biometric');
    } else {
      onSuccess();
    }
  }

  async function handleEnableBiometric() {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: t('pin.biometric_title'),
        cancelLabel: t('pin.biometric_skip'),
        disableDeviceFallback: true,
      });
      if (result.success) {
        await setBiometricEnabled(true);
      }
    } catch {}
    onSuccess();
  }

  const bg = darkMode ? '#111827' : '#ffffff';
  const surface = darkMode ? '#1f2937' : '#f9fafb';
  const textPrimary = darkMode ? '#f9fafb' : '#111827';
  const textSec = darkMode ? '#9ca3af' : '#6b7280';
  const dotFill = '#16a34a';
  const dotEmpty = darkMode ? '#374151' : '#e5e7eb';
  const btnBg = darkMode ? '#1f2937' : '#f3f4f6';
  const accent = '#16a34a';

  const SECURITY_QUESTIONS = [
    t('pin.security_q_1'),
    t('pin.security_q_2'),
    t('pin.security_q_3'),
  ];

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[s.root, { backgroundColor: bg, paddingTop: Math.max(16, insets.top), paddingBottom: insets.bottom + 16 }]}>

        {/* Header */}
        <View style={s.header}>
          <Text style={[s.title, { color: textPrimary }]}>{t('pin.setup_title')}</Text>
          <TouchableOpacity onPress={onClose} style={[s.closeBtn, { backgroundColor: btnBg }]}>
            <X size={16} color={textSec} />
          </TouchableOpacity>
        </View>

        {/* ── Step: choose length ── */}
        {step === 'length' && (
          <View style={s.body}>
            <Text style={[s.prompt, { color: textSec }]}>{t('pin.length_title')}</Text>
            <View style={s.lengthRow}>
              {([4, 6] as const).map(len => (
                <TouchableOpacity
                  key={len}
                  onPress={() => { setPinLength(len); setStep('enter'); }}
                  style={[s.lengthBtn, { backgroundColor: len === pinLength ? accent : btnBg }]}
                  activeOpacity={0.75}
                >
                  <Text style={[s.lengthBtnTxt, { color: len === pinLength ? '#fff' : textPrimary }]}>
                    {len === 4 ? t('pin.length_4') : t('pin.length_6')}
                  </Text>
                  <View style={[s.lengthDots, { marginTop: 10 }]}>
                    {Array.from({ length: len }).map((_, i) => (
                      <View key={i} style={[s.lengthDot, { backgroundColor: len === pinLength ? 'rgba(255,255,255,0.7)' : dotEmpty }]} />
                    ))}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* ── Step: enter / confirm PIN ── */}
        {(step === 'enter' || step === 'confirm') && (
          <>
            <View style={s.body}>
              <Text style={[s.prompt, { color: textSec }]}>
                {step === 'enter'
                  ? t('pin.setup_enter').replace('{n}', String(pinLength))
                  : t('pin.setup_confirm')}
              </Text>
              <View style={s.dotsRow}>
                {Array.from({ length: pinLength }).map((_, i) => (
                  <View key={i} style={[s.dot, { backgroundColor: i < pin.length ? dotFill : dotEmpty }]} />
                ))}
              </View>
              {error ? <Text style={s.errorTxt}>{error}</Text> : null}
            </View>
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
          </>
        )}

        {/* ── Step: choose security question ── */}
        {step === 'security_q' && (
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
            <ScrollView contentContainerStyle={s.sqContainer} keyboardShouldPersistTaps="handled">
              <ShieldCheck size={40} color={accent} style={{ marginBottom: 16 }} />
              <Text style={[s.prompt, { color: textPrimary, fontWeight: '700', fontSize: 17 }]}>
                {t('pin.security_q_title')}
              </Text>
              <Text style={[s.sqSub, { color: textSec }]}>{t('pin.security_q_choose')}</Text>

              {SECURITY_QUESTIONS.map((q, idx) => (
                <TouchableOpacity
                  key={idx}
                  onPress={() => setSelectedQ(idx)}
                  style={[s.qOption, {
                    backgroundColor: selectedQ === idx ? `${accent}22` : surface,
                    borderColor: selectedQ === idx ? accent : 'transparent',
                    borderWidth: 1.5,
                  }]}
                  activeOpacity={0.75}
                >
                  <View style={[s.radioCircle, { borderColor: selectedQ === idx ? accent : textSec }]}>
                    {selectedQ === idx && <View style={[s.radioDot, { backgroundColor: accent }]} />}
                  </View>
                  <Text style={[s.qTxt, { color: textPrimary }]}>{q}</Text>
                </TouchableOpacity>
              ))}

              {selectedQ !== null && (
                <>
                  <Text style={[s.answerLabel, { color: textSec }]}>{t('pin.security_q_answer')}</Text>
                  <TextInput
                    value={answer}
                    onChangeText={v => { setAnswer(v); setAnswerError(''); }}
                    placeholder={t('pin.security_q_answer')}
                    placeholderTextColor={textSec}
                    style={[s.answerInput, { backgroundColor: surface, color: textPrimary, borderColor: answerError ? '#ef4444' : 'transparent' }]}
                    autoCapitalize="none"
                  />
                  {answerError ? <Text style={s.errorTxt}>{answerError}</Text> : null}

                  <TouchableOpacity onPress={handleSecurityNext} style={[s.nextBtn, { backgroundColor: accent }]} activeOpacity={0.8}>
                    <Text style={s.nextBtnTxt}>{t('common.save')}</Text>
                  </TouchableOpacity>
                </>
              )}
            </ScrollView>
          </KeyboardAvoidingView>
        )}

        {/* ── Step: biometric ── */}
        {step === 'biometric' && (
          <View style={[s.body, { gap: 16 }]}>
            <Fingerprint size={56} color={accent} />
            <Text style={[s.prompt, { color: textPrimary, fontWeight: '700', fontSize: 18, textAlign: 'center' }]}>
              {t('pin.biometric_title')}
            </Text>
            <Text style={[s.sqSub, { color: textSec, textAlign: 'center' }]}>
              {t('pin.biometric_desc')}
            </Text>
            <TouchableOpacity onPress={handleEnableBiometric} style={[s.nextBtn, { backgroundColor: accent, marginTop: 8 }]} activeOpacity={0.8}>
              <Text style={s.nextBtnTxt}>{t('pin.biometric_btn')}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onSuccess} activeOpacity={0.7}>
              <Text style={[s.sqSub, { color: textSec }]}>{t('pin.biometric_skip')}</Text>
            </TouchableOpacity>
          </View>
        )}

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
  prompt: { fontSize: 16, marginBottom: 28, textAlign: 'center' },
  dotsRow: { flexDirection: 'row', gap: 12, marginBottom: 16, flexWrap: 'wrap', justifyContent: 'center' },
  dot: { width: 18, height: 18, borderRadius: 9 },
  errorTxt: { color: '#ef4444', fontSize: 14, fontWeight: '500', marginTop: 8 },
  pad: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 32, gap: 12 },
  key: { width: '30%', aspectRatio: 1.6, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  keyTxt: { fontSize: 24, fontWeight: '500' },
  // Length chooser
  lengthRow: { flexDirection: 'row', gap: 16, width: '100%' },
  lengthBtn: { flex: 1, borderRadius: 20, padding: 20, alignItems: 'center' },
  lengthBtnTxt: { fontSize: 15, fontWeight: '700' },
  lengthDots: { flexDirection: 'row', gap: 6, flexWrap: 'wrap', justifyContent: 'center' },
  lengthDot: { width: 10, height: 10, borderRadius: 5 },
  // Security question
  sqContainer: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 32, alignItems: 'stretch' },
  sqSub: { fontSize: 13, marginBottom: 20, marginTop: 4 },
  qOption: { flexDirection: 'row', alignItems: 'center', borderRadius: 14, padding: 14, marginBottom: 10, gap: 12 },
  radioCircle: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  radioDot: { width: 10, height: 10, borderRadius: 5 },
  qTxt: { fontSize: 14, flex: 1 },
  answerLabel: { fontSize: 13, marginBottom: 8, marginTop: 12 },
  answerInput: { borderRadius: 12, padding: 14, fontSize: 15, borderWidth: 1.5, marginBottom: 4 },
  nextBtn: { borderRadius: 16, padding: 16, alignItems: 'center', marginTop: 12, width: '100%' },
  nextBtnTxt: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
