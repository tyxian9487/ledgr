import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Modal,
  Image,
  StyleSheet,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { useApp } from '../../context/AppContext';
import { useTranslation } from '../../context/LanguageContext';
import { CURRENCIES } from '../../types';
import { getCurrencyDisplayName } from '../../utils/currency';
import { ChevronRight, ChevronLeft, Check, Search, X, Camera } from 'lucide-react-native';

const defaultAvatar = require('../../assets/m_expression_wink.png');

// ─── Data ────────────────────────────────────────────────────────────────────

const SPEND_ON_OPTIONS = [
  { id: 'self',     labelKey: 'onboard.myself'   as const, emoji: '🙋' },
  { id: 'family',   labelKey: 'onboard.family'   as const, emoji: '👨‍👩‍👧' },
  { id: 'partner',  labelKey: 'onboard.partner'  as const, emoji: '💑' },
  { id: 'children', labelKey: 'onboard.children' as const, emoji: '🧒' },
  { id: 'friends',  labelKey: 'onboard.friends'  as const, emoji: '👫' },
  { id: 'others',   labelKey: 'onboard.others'   as const, emoji: '🌍' },
];

const SPEND_WHAT_OPTIONS = [
  { id: 'food',          emoji: '🍽️', catKey: 'cat.food'          as const },
  { id: 'housing',       emoji: '🏠', catKey: 'cat.housing'       as const },
  { id: 'transport',     emoji: '🚗', catKey: 'cat.transport'     as const },
  { id: 'shopping',      emoji: '🛍️', catKey: 'cat.shopping'      as const },
  { id: 'entertainment', emoji: '🎬', catKey: 'cat.entertainment' as const },
  { id: 'health',        emoji: '💪', catKey: 'cat.health'        as const },
  { id: 'education',     emoji: '📚', catKey: 'cat.education'     as const },
  { id: 'subscriptions', emoji: '📱', catKey: 'cat.subscriptions' as const },
  { id: 'travel',        emoji: '✈️', catKey: 'cat.travel'        as const },
  { id: 'investments',   emoji: '💰', catKey: 'cat.investments'   as const },
  { id: 'personal',      emoji: '💆', catKey: 'cat.personal'      as const },
];

const SAT_OPTIONS = [
  { val: 1, emoji: '😟', labelKey: 'onboard.sat.1' as const, subKey: 'onboard.sat.1.sub' as const },
  { val: 2, emoji: '😕', labelKey: 'onboard.sat.2' as const, subKey: 'onboard.sat.2.sub' as const },
  { val: 3, emoji: '😐', labelKey: 'onboard.sat.3' as const, subKey: 'onboard.sat.3.sub' as const },
  { val: 4, emoji: '😊', labelKey: 'onboard.sat.4' as const, subKey: 'onboard.sat.4.sub' as const },
  { val: 5, emoji: '😄', labelKey: 'onboard.sat.5' as const, subKey: 'onboard.sat.5.sub' as const },
];

const DISC_OPTIONS = [
  { val: true,  emoji: '🎯', labelKey: 'onboard.disc.yes' as const, subKey: 'onboard.disc.yes.sub' as const },
  { val: false, emoji: '💪', labelKey: 'onboard.disc.no'  as const, subKey: 'onboard.disc.no.sub'  as const },
];

const TOTAL_STEPS = 5;

// ─── Main Component ───────────────────────────────────────────────────────────

export default function OnboardingScreen() {
  const { updateUserProfile, completeOnboarding, darkMode } = useApp();
  const { t, language } = useTranslation();

  const bg = darkMode ? '#111827' : '#f9fafb';
  const card = darkMode ? '#1f2937' : '#ffffff';
  const border = darkMode ? '#374151' : '#f3f4f6';
  const textPrimary = darkMode ? '#f9fafb' : '#111827';
  const textSecondary = darkMode ? '#9ca3af' : '#6b7280';
  const inputBg = darkMode ? '#1f2937' : '#ffffff';
  const infoBoxBg = darkMode ? 'rgba(22,163,74,0.1)' : '#f0fdf4';
  const infoBoxBorder = darkMode ? '#166534' : '#bbf7d0';

  const s = makeStyles(bg, card, border, textPrimary, textSecondary, inputBg, infoBoxBg, infoBoxBorder);

  const [step, setStep] = useState(1);
  const [showWelcome, setShowWelcome] = useState(false);
  const [touched, setTouched] = useState(false);

  // Step 1 state
  const [name, setName] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);
  const [currencySearch, setCurrencySearch] = useState('');

  async function pickAvatar() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setAvatarUri(result.assets[0].uri);
    }
  }

  // Survey state
  const [satisfaction, setSatisfaction] = useState<number | null>(null);
  const [disciplined, setDisciplined] = useState<boolean | null>(null);
  const [spendOn, setSpendOn] = useState<string[]>([]);
  const [spendWhat, setSpendWhat] = useState<string[]>([]);

  const hasName = name.trim().length > 0;
  const initial = hasName ? name.trim().charAt(0).toUpperCase() : '?';

  const selectedCurrency = CURRENCIES.find(c => c.code === currency);
  const filteredCurrencies = CURRENCIES.filter(c => {
    if (!currencySearch) return true;
    const q = currencySearch.toLowerCase();
    const localized = getCurrencyDisplayName(c.code, language).toLowerCase();
    return (
      c.code.toLowerCase().includes(q) ||
      c.name.toLowerCase().includes(q) ||
      localized.includes(q)
    );
  });

  const STEP_TITLES = [
    t('onboard.setup'),
    t('onboard.financial_state'),
    t('onboard.discipline'),
    t('onboard.spend_on'),
    t('onboard.spend_what'),
  ];

  const canProceed =
    step === 1 ? hasName :
    step === 2 ? satisfaction !== null :
    step === 3 ? disciplined !== null :
    step === 4 ? spendOn.length > 0 :
    step === 5 ? spendWhat.length > 0 :
    false;

  function handleNext() {
    if (!canProceed) {
      if (step === 1) setTouched(true);
      return;
    }
    if (step === 1) {
      updateUserProfile({ name: name.trim(), currency, ...(avatarUri ? { avatar: avatarUri } : {}) });
      setShowWelcome(true);
      return;
    }
    if (step < TOTAL_STEPS) {
      setStep(s => s + 1);
      return;
    }
    // Final step — complete onboarding
    completeOnboarding();
  }

  function handleBack() {
    if (step > 1) setStep(s => s - 1);
  }

  // ── Welcome screen ──────────────────────────────────────────────────────────
  if (showWelcome) {
    return (
      <View style={s.welcomeRoot}>
        <View style={s.welcomeAvatar}>
          <Text style={s.welcomeInitial}>{initial}</Text>
        </View>
        <Text style={s.welcomeTitle}>{t('onboard.welcome', { name: name.trim() })}</Text>
        <Text style={s.welcomeBody}>{t('onboard.intro')}</Text>
        <TouchableOpacity
          onPress={() => { setShowWelcome(false); setStep(2); }}
          activeOpacity={0.85}
          style={s.primaryBtn}
        >
          <Text style={s.primaryBtnTxt}>{t('onboard.lets_go')}</Text>
          <ChevronRight size={18} color="#fff" />
        </TouchableOpacity>
      </View>
    );
  }

  // ── Main onboarding ─────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={s.root} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        {/* Progress bar */}
        <View style={s.progressRow}>
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <View
              key={i}
              style={[s.progressSegment, { backgroundColor: i < step ? '#16a34a' : '#e5e7eb' }]}
            />
          ))}
        </View>

        {/* Header: back button + title */}
        <View style={s.header}>
          {step > 1 ? (
            <TouchableOpacity onPress={handleBack} style={s.backBtn} activeOpacity={0.7}>
              <ChevronLeft size={16} color="#374151" />
            </TouchableOpacity>
          ) : (
            <View style={{ width: 32 }} />
          )}
          <Text style={s.stepTitle}>{STEP_TITLES[step - 1]}</Text>
        </View>

        {/* Scrollable content */}
        <ScrollView style={{ flex: 1 }} contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

          {/* ── Step 1: Profile setup ── */}
          {step === 1 && (
            <View style={s.section}>
              {/* Avatar picker */}
              <TouchableOpacity onPress={pickAvatar} activeOpacity={0.85} style={s.avatarWrap}>
                <Image
                  source={avatarUri ? { uri: avatarUri } : defaultAvatar}
                  style={s.avatarImg}
                />
                <View style={s.cameraBadge}>
                  <Camera size={14} color="#fff" />
                </View>
              </TouchableOpacity>
              <Text style={s.avatarHint}>Tap to upload photo</Text>

              <Text style={[s.fieldLabel, { marginTop: 20 }]}>{t('onboard.your_name')}</Text>
              <TextInput
                style={[s.input, touched && !hasName ? s.inputError : undefined]}
                placeholder={t('onboard.name_placeholder')}
                placeholderTextColor="#9ca3af"
                value={name}
                onChangeText={v => { setName(v); setTouched(false); }}
                onBlur={() => setTouched(true)}
                autoFocus
                returnKeyType="next"
              />
              {touched && !hasName && (
                <Text style={s.errorText}>{t('onboard.name_required')}</Text>
              )}

              <Text style={[s.fieldLabel, { marginTop: 20 }]}>{t('onboard.currency')}</Text>
              <TouchableOpacity
                onPress={() => setShowCurrencyPicker(true)}
                activeOpacity={0.8}
                style={s.currencyBtn}
              >
                <View>
                  <Text style={s.currencyCode}>{selectedCurrency?.code ?? 'USD'}</Text>
                  <Text style={s.currencyName}>{getCurrencyDisplayName(selectedCurrency?.code ?? 'USD', language)}</Text>
                </View>
                <ChevronRight size={16} color="#9ca3af" />
              </TouchableOpacity>

              {/* What to expect */}
              <View style={s.infoBox}>
                <Text style={s.infoBoxTitle}>{t('onboard.what_expect')}</Text>
                {[
                  t('onboard.sample_data'),
                  t('onboard.replace_real'),
                  t('onboard.data_stays'),
                ].map(item => (
                  <View key={item} style={s.infoRow}>
                    <Check size={13} color="#16a34a" strokeWidth={3} />
                    <Text style={s.infoRowText}>{item}</Text>
                  </View>
                ))}
              </View>

              <Text style={s.hint}>{t('onboard.update_anytime')}</Text>
            </View>
          )}

          {/* ── Step 2: Financial satisfaction ── */}
          {step === 2 && (
            <View style={s.section}>
              <Text style={s.stepSub}>{t('onboard.how_satisfied')}</Text>
              {SAT_OPTIONS.map(opt => {
                const sel = satisfaction === opt.val;
                return (
                  <TouchableOpacity
                    key={opt.val}
                    onPress={() => setSatisfaction(opt.val)}
                    activeOpacity={0.8}
                    style={[s.radioCard, sel && s.radioCardSel]}
                  >
                    <Text style={s.radioEmoji}>{opt.emoji}</Text>
                    <View style={s.radioBody}>
                      <Text style={[s.radioLabel, sel && s.radioLabelSel]}>{t(opt.labelKey)}</Text>
                      <Text style={s.radioSub}>{t(opt.subKey)}</Text>
                    </View>
                    <View style={[s.radioCircle, sel && s.radioCircleSel]}>
                      {sel && <View style={s.radioInner} />}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {/* ── Step 3: Discipline ── */}
          {step === 3 && (
            <View style={s.section}>
              <Text style={s.stepSub}>{t('onboard.describe')}</Text>
              {DISC_OPTIONS.map(opt => {
                const sel = disciplined === opt.val;
                return (
                  <TouchableOpacity
                    key={String(opt.val)}
                    onPress={() => setDisciplined(opt.val)}
                    activeOpacity={0.8}
                    style={[s.radioCard, sel && s.radioCardSel, { paddingVertical: 20 }]}
                  >
                    <Text style={[s.radioEmoji, { fontSize: 36 }]}>{opt.emoji}</Text>
                    <View style={s.radioBody}>
                      <Text style={[s.radioLabel, sel && s.radioLabelSel]}>{t(opt.labelKey)}</Text>
                      <Text style={[s.radioSub, { marginTop: 4 }]}>{t(opt.subKey)}</Text>
                    </View>
                    <View style={[s.radioCircle, sel && s.radioCircleSel]}>
                      {sel && <View style={s.radioInner} />}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {/* ── Step 4: Who do you spend on? ── */}
          {step === 4 && (
            <View style={s.section}>
              <View style={s.grid}>
                {SPEND_ON_OPTIONS.map(opt => {
                  const sel = spendOn.includes(opt.id);
                  return (
                    <TouchableOpacity
                      key={opt.id}
                      onPress={() =>
                        setSpendOn(prev => sel ? prev.filter(x => x !== opt.id) : [...prev, opt.id])
                      }
                      activeOpacity={0.8}
                      style={[s.gridCard, sel && s.gridCardSel]}
                    >
                      {sel && (
                        <View style={s.gridCheckBadge}>
                          <Check size={11} color="#fff" strokeWidth={3} />
                        </View>
                      )}
                      <Text style={s.gridEmoji}>{opt.emoji}</Text>
                      <Text style={[s.gridLabel, sel && s.gridLabelSel]}>{t(opt.labelKey)}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {/* ── Step 5: What do you spend on? ── */}
          {step === 5 && (
            <View style={s.section}>
              <View style={s.grid2col}>
                {SPEND_WHAT_OPTIONS.map(opt => {
                  const sel = spendWhat.includes(opt.id);
                  return (
                    <TouchableOpacity
                      key={opt.id}
                      onPress={() =>
                        setSpendWhat(prev => sel ? prev.filter(x => x !== opt.id) : [...prev, opt.id])
                      }
                      activeOpacity={0.8}
                      style={[s.grid2Card, sel && s.gridCardSel]}
                    >
                      {sel && (
                        <View style={[s.gridCheckBadge, { width: 18, height: 18 }]}>
                          <Check size={9} color="#fff" strokeWidth={3} />
                        </View>
                      )}
                      <Text style={[s.gridEmoji, { fontSize: 24 }]}>{opt.emoji}</Text>
                      <Text style={[s.grid2Label, sel && s.gridLabelSel]}>{t(opt.catKey)}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

        </ScrollView>

        {/* CTA button */}
        <View style={s.ctaArea}>
          <TouchableOpacity
            onPress={handleNext}
            activeOpacity={0.85}
            style={[s.ctaBtn, !canProceed && s.ctaBtnDisabled]}
          >
            <Text style={[s.ctaBtnTxt, !canProceed && s.ctaBtnTxtDisabled]}>
              {step === TOTAL_STEPS ? t('onboard.get_started') : t('onboard.continue')}
            </Text>
          </TouchableOpacity>
          {step === TOTAL_STEPS && (
            <Text style={s.legalText}>
              {t('onboard.legal_agree')}{' '}
              <Text
                style={s.legalLink}
                onPress={() => Linking.openURL('https://kachingo.app/terms')}
              >
                {t('onboard.terms_link')}
              </Text>
              {' & '}
              <Text
                style={s.legalLink}
                onPress={() => Linking.openURL(process.env.EXPO_PUBLIC_PRIVACY_URL ?? 'https://kachingo.app/privacy')}
              >
                {t('onboard.privacy_link')}
              </Text>
            </Text>
          )}
        </View>
      </KeyboardAvoidingView>

      {/* Currency picker bottom sheet */}
      <Modal
        visible={showCurrencyPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCurrencyPicker(false)}
      >
        <TouchableOpacity
          style={s.pickerBackdrop}
          activeOpacity={1}
          onPress={() => setShowCurrencyPicker(false)}
        />
        <View style={s.pickerSheet}>
          <View style={s.pickerHandle} />
          <View style={s.pickerHeader}>
            <Text style={s.pickerTitle}>{t('onboard.select_currency')}</Text>
            <TouchableOpacity onPress={() => setShowCurrencyPicker(false)} style={s.pickerClose}>
              <X size={16} color="#6b7280" />
            </TouchableOpacity>
          </View>
          <View style={s.pickerSearch}>
            <Search size={14} color="#9ca3af" />
            <TextInput
              style={s.pickerSearchInput}
              placeholder={t('onboard.search_currency')}
              placeholderTextColor="#9ca3af"
              value={currencySearch}
              onChangeText={setCurrencySearch}
              autoFocus
            />
            {currencySearch.length > 0 && (
              <TouchableOpacity onPress={() => setCurrencySearch('')}>
                <X size={14} color="#9ca3af" />
              </TouchableOpacity>
            )}
          </View>
          <FlatList
            data={filteredCurrencies}
            keyExtractor={item => item.code}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => {
              const sel = item.code === currency;
              return (
                <TouchableOpacity
                  onPress={() => { setCurrency(item.code); setShowCurrencyPicker(false); setCurrencySearch(''); }}
                  activeOpacity={0.7}
                  style={[s.currencyRow, sel && s.currencyRowSel]}
                >
                  <Text style={s.currencyRowCode}>{item.code}</Text>
                  <Text style={[s.currencyRowName, sel && s.currencyRowNameSel]}>{getCurrencyDisplayName(item.code, language)}</Text>
                  {sel && <Check size={15} color="#16a34a" />}
                </TouchableOpacity>
              );
            }}
          />
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

function makeStyles(bg: string, card: string, border: string, textPrimary: string, textSecondary: string, inputBg: string, infoBoxBg: string, infoBoxBorder: string) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: bg },

    // Avatar picker
    avatarWrap: { alignSelf: 'center', marginTop: 12, marginBottom: 4, position: 'relative' },
    avatarImg: { width: 96, height: 96, borderRadius: 48, backgroundColor: border },
    cameraBadge: {
      position: 'absolute', bottom: 0, right: 0,
      width: 28, height: 28, borderRadius: 14,
      backgroundColor: '#16a34a', alignItems: 'center', justifyContent: 'center',
      borderWidth: 2, borderColor: bg,
    },
    avatarHint: { textAlign: 'center', fontSize: 12, color: textSecondary, marginBottom: 8 },

    // Welcome
    welcomeRoot: { flex: 1, backgroundColor: bg, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
    welcomeAvatar: {
      width: 96, height: 96, borderRadius: 48, backgroundColor: '#16a34a',
      alignItems: 'center', justifyContent: 'center', marginBottom: 24,
      shadowColor: '#16a34a', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.35, shadowRadius: 16, elevation: 8,
    },
    welcomeInitial: { color: '#fff', fontSize: 36, fontWeight: '900' },
    welcomeTitle: { fontSize: 24, fontWeight: '800', color: textPrimary, textAlign: 'center', marginBottom: 10 },
    welcomeBody: { fontSize: 14, color: textSecondary, textAlign: 'center', lineHeight: 21, marginBottom: 32 },

    // Progress
    progressRow: { flexDirection: 'row', gap: 6, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 4 },
    progressSegment: { flex: 1, height: 4, borderRadius: 2 },

    // Header
    header: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 20, paddingVertical: 14 },
    backBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: border, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    stepTitle: { flex: 1, fontSize: 22, fontWeight: '800', color: textPrimary },

    // Scroll
    scrollContent: { paddingBottom: 16 },
    section: { paddingHorizontal: 20, paddingTop: 4 },
    stepSub: { fontSize: 13, color: textSecondary, marginBottom: 16, lineHeight: 18 },

    // Form fields
    fieldLabel: { fontSize: 11, fontWeight: '700', color: textSecondary, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
    input: { backgroundColor: inputBg, borderWidth: 2, borderColor: border, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: textPrimary },
    inputError: { borderColor: '#ef4444' },
    errorText: { fontSize: 12, color: '#ef4444', marginTop: 6, marginLeft: 4 },

    // Currency button
    currencyBtn: { backgroundColor: inputBg, borderWidth: 2, borderColor: border, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    currencyCode: { fontSize: 14, fontWeight: '700', color: textPrimary },
    currencyName: { fontSize: 12, color: textSecondary, marginTop: 2 },

    // Info box
    infoBox: { marginTop: 20, backgroundColor: infoBoxBg, borderWidth: 1, borderColor: infoBoxBorder, borderRadius: 16, padding: 16 },
    infoBoxTitle: { fontSize: 11, fontWeight: '800', color: '#16a34a', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 },
    infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginTop: 6 },
    infoRowText: { fontSize: 12, color: '#166534', flex: 1, lineHeight: 17 },
    hint: { fontSize: 11, color: textSecondary, textAlign: 'center', marginTop: 16 },

    // Radio cards
    radioCard: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: card, borderWidth: 2, borderColor: border, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14, marginBottom: 10 },
    radioCardSel: { borderColor: '#16a34a', backgroundColor: infoBoxBg },
    radioEmoji: { fontSize: 28, lineHeight: 34 },
    radioBody: { flex: 1 },
    radioLabel: { fontSize: 14, fontWeight: '700', color: textPrimary },
    radioLabelSel: { color: '#15803d' },
    radioSub: { fontSize: 12, color: textSecondary, marginTop: 2 },
    radioCircle: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: border, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    radioCircleSel: { borderColor: '#16a34a', backgroundColor: '#16a34a' },
    radioInner: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#fff' },

    // Grid
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    gridCard: { width: '47%', backgroundColor: card, borderWidth: 2, borderColor: border, borderRadius: 16, paddingVertical: 20, alignItems: 'center', gap: 8, position: 'relative' },
    gridCardSel: { borderColor: '#16a34a', backgroundColor: infoBoxBg },
    gridCheckBadge: { position: 'absolute', top: 10, right: 10, width: 22, height: 22, borderRadius: 11, backgroundColor: '#16a34a', alignItems: 'center', justifyContent: 'center' },
    gridEmoji: { fontSize: 32 },
    gridLabel: { fontSize: 13, fontWeight: '600', color: textPrimary, textAlign: 'center' },
    gridLabelSel: { color: '#15803d' },

    // Grid 2-col
    grid2col: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    grid2Card: { width: '47%', backgroundColor: card, borderWidth: 2, borderColor: border, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', gap: 10, position: 'relative' },
    grid2Label: { fontSize: 12, fontWeight: '600', color: textPrimary, flex: 1 },

    // CTA
    ctaArea: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 },
    legalText: { textAlign: 'center', fontSize: 11, color: textSecondary, marginTop: 10, lineHeight: 16 },
    legalLink: { color: '#16a34a', fontWeight: '600' },
    primaryBtn: { backgroundColor: '#16a34a', borderRadius: 16, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, alignSelf: 'stretch', shadowColor: '#16a34a', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
    primaryBtnTxt: { color: '#fff', fontSize: 16, fontWeight: '700' },
    ctaBtn: { backgroundColor: '#16a34a', borderRadius: 16, paddingVertical: 16, alignItems: 'center', shadowColor: '#16a34a', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
    ctaBtnDisabled: { backgroundColor: border, shadowOpacity: 0, elevation: 0 },
    ctaBtnTxt: { color: '#fff', fontSize: 16, fontWeight: '700' },
    ctaBtnTxtDisabled: { color: textSecondary },

    // Currency picker
    pickerBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)' },
    pickerSheet: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: card, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '80%', paddingBottom: 32 },
    pickerHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: border, alignSelf: 'center', marginTop: 12 },
    pickerHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: border },
    pickerTitle: { fontSize: 17, fontWeight: '700', color: textPrimary },
    pickerClose: { width: 32, height: 32, borderRadius: 16, backgroundColor: border, alignItems: 'center', justifyContent: 'center' },
    pickerSearch: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: bg, marginHorizontal: 16, marginVertical: 10, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10 },
    pickerSearchInput: { flex: 1, fontSize: 14, color: textPrimary },
    currencyRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: bg },
    currencyRowSel: { backgroundColor: infoBoxBg },
    currencyRowCode: { fontSize: 12, fontWeight: '700', color: textSecondary, width: 48 },
    currencyRowName: { flex: 1, fontSize: 14, color: textPrimary },
    currencyRowNameSel: { fontWeight: '600', color: '#15803d' },
  });
}
