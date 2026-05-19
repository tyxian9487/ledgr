import { useState } from 'react';
import { View, Text, TouchableOpacity, Image, Dimensions, ActivityIndicator, Platform, Alert, Modal, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X } from 'lucide-react-native';
import { useTranslation } from '../../context/LanguageContext';
import { supabase, exchangeOAuthCode } from '../../utils/supabase';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';
import * as AppleAuthentication from 'expo-apple-authentication';

WebBrowser.maybeCompleteAuthSession();

const { width } = Dimensions.get('window');

// Inline legal sheet for login page
function LegalModal({ type, onClose }: { type: 'terms' | 'privacy'; onClose: () => void }) {
  const { t } = useTranslation();
  const sections = type === 'terms'
    ? [1, 2, 3, 4, 5, 6, 7, 8].map(n => ({ title: t(`terms.t${n}` as any), body: t(`terms.b${n}` as any) }))
    : [1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => ({ title: t(`privacy.t${n}` as any), body: t(`privacy.b${n}` as any) }));
  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' }}>
          <Text style={{ fontSize: 17, fontWeight: '700', color: '#111827' }}>
            {type === 'terms' ? t('profile.terms') : t('profile.privacy')}
          </Text>
          <TouchableOpacity onPress={onClose} style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#f3f4f6', alignItems: 'center', justifyContent: 'center' }}>
            <X size={16} color="#6b7280" />
          </TouchableOpacity>
        </View>
        <ScrollView style={{ flex: 1, padding: 20 }}>
          <Text style={{ fontSize: 12, color: '#9ca3af', marginBottom: 16 }}>{t('legal.last_updated')}</Text>
          {sections.map((s, i) => (
            <View key={i} style={{ marginBottom: 20 }}>
              <Text style={{ fontSize: 13, fontWeight: '700', color: '#111827', marginBottom: 6 }}>{s.title}</Text>
              <Text style={{ fontSize: 13, color: '#4b5563', lineHeight: 20 }}>{s.body}</Text>
            </View>
          ))}
        </ScrollView>
        <View style={{ padding: 20, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#f3f4f6' }}>
          <TouchableOpacity onPress={onClose} style={{ backgroundColor: '#16a34a', borderRadius: 16, paddingVertical: 14, alignItems: 'center' }}>
            <Text style={{ color: '#fff', fontWeight: '700' }}>{t('legal.i_understand')}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

export default function LoginScreen() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState<'google' | 'apple' | null>(null);
  const [legal, setLegal] = useState<'terms' | 'privacy' | null>(null);

  const FEATURE_ITEMS = [
    { emoji: '📊', text: t('login.track') },
    { emoji: '🎯', text: t('login.budget_goals') },
    { emoji: '📸', text: t('login.watch_savings') },
    { emoji: '🌍', text: '5 languages supported' },
  ];

  const handleGoogleSignIn = async () => {
    setLoading('google');
    try {
      const redirectTo = makeRedirectUri({ scheme: 'kachingo', path: 'auth/callback' });
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo, skipBrowserRedirect: true },
      });
      if (error) throw error;
      if (!data.url) throw new Error('No auth URL returned');

      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);

      if (result.type === 'success') {
        // On some Android devices, Chrome Custom Tab's BrowserResultActivity strips
        // the query string — result.url = 'kachingo://auth/callback' with no ?code=.
        // The full URL with the code arrives via OAuthCallbackHandler.addEventListener
        // (OS Linking intent). Only exchange here if the code is actually present.
        let hasCode = false;
        try {
          hasCode = !!new URL(result.url).searchParams.get('code');
        } catch {
          hasCode = result.url?.includes('code=') ?? false;
        }

        if (hasCode) {
          const { data: { session: existing } } = await supabase.auth.getSession();
          if (!existing) {
            const err = await exchangeOAuthCode(result.url);
            if (err) throw err;
          }
        } else {
          // URL has no code — OAuthCallbackHandler will exchange via Linking event.
          // Poll for the session it establishes (typically completes in < 2s).
          let session = null;
          for (let i = 0; i < 10; i++) {
            await new Promise(r => setTimeout(r, 500));
            const { data } = await supabase.auth.getSession();
            if (data.session) { session = data.session; break; }
          }
          if (!session) throw new Error('Sign in timed out. Please try again.');
        }
      }
      // If 'cancel': OAuthCallbackHandler (Linking event) or auth/callback.tsx handles it.
    } catch (err) {
      Alert.alert('Sign in failed', err instanceof Error ? err.message : 'Please try again.');
    } finally {
      setLoading(null);
    }
  };

  const handleAppleSignIn = async () => {
    setLoading('apple');
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });
      if (!credential.identityToken) throw new Error('No identity token from Apple');
      const { error } = await supabase.auth.signInWithIdToken({
        provider: 'apple',
        token: credential.identityToken,
      });
      if (error) throw error;
    } catch (err: any) {
      if (err?.code !== 'ERR_REQUEST_CANCELED') {
        Alert.alert('Sign in failed', err instanceof Error ? err.message : 'Please try again.');
      }
    } finally {
      setLoading(null);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#052e16' }} edges={['top', 'bottom']}>

      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}>
        <View style={{ alignItems: 'center', justifyContent: 'center', marginBottom: 8, width: width * 0.5, height: width * 0.5 }}>
          <Image
            source={require('../../assets/mascot.png')}
            style={{ width: '100%', height: '100%' }}
            resizeMode="contain"
          />
        </View>

        <Text style={{ fontSize: 36, fontWeight: '900', color: '#fff', letterSpacing: -0.5 }}>
          Kachingo
        </Text>
        <Text style={{ fontSize: 15, color: 'rgba(255,255,255,0.65)', marginTop: 8, textAlign: 'center', lineHeight: 22 }}>
          {t('login.tagline')}
        </Text>

        {/* Feature chips */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8, marginTop: 24 }}>
          {FEATURE_ITEMS.map(({ emoji, text }) => (
            <View
              key={text}
              style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, gap: 6 }}
            >
              <Text style={{ fontSize: 13 }}>{emoji}</Text>
              <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.85)', fontWeight: '600' }}>{text}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={{ paddingHorizontal: 24, paddingBottom: 24, gap: 12 }}>
        {/* Google */}
        <TouchableOpacity
          onPress={handleGoogleSignIn}
          disabled={loading !== null}
          activeOpacity={0.85}
          style={{
            flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
            backgroundColor: '#fff', borderRadius: 18, paddingVertical: 16,
            shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 3,
          }}
        >
          {loading === 'google' ? (
            <ActivityIndicator size="small" color="#4B5563" style={{ marginRight: 10 }} />
          ) : (
            <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: '#ef4444', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
              <Text style={{ color: '#fff', fontSize: 12, fontWeight: '900' }}>G</Text>
            </View>
          )}
          <Text style={{ color: '#111827', fontSize: 15, fontWeight: '700' }}>
            {t('login.google')}
          </Text>
        </TouchableOpacity>

        {/* Apple — iOS only */}
        {Platform.OS === 'ios' && (
          <TouchableOpacity
            onPress={handleAppleSignIn}
            disabled={loading !== null}
            activeOpacity={0.85}
            style={{
              flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
              backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 18, paddingVertical: 16,
              borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)',
            }}
          >
            {loading === 'apple' ? (
              <ActivityIndicator size="small" color="#fff" style={{ marginRight: 10 }} />
            ) : (
              <Text style={{ color: '#fff', marginRight: 12, fontSize: 18, lineHeight: 22 }}></Text>
            )}
            <Text style={{ color: '#fff', fontSize: 15, fontWeight: '700' }}>
              {t('login.apple')}
            </Text>
          </TouchableOpacity>
        )}

        {/* Legal text with tappable links */}
        <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, textAlign: 'center', lineHeight: 20, marginTop: 4 }}>
          {t('login.agree')}{' '}
          <Text
            onPress={() => setLegal('terms')}
            style={{ color: 'rgba(255,255,255,0.7)', fontWeight: '600', textDecorationLine: 'underline' }}
          >
            {t('login.terms')}
          </Text>
          {' '}{t('login.and')}{' '}
          <Text
            onPress={() => setLegal('privacy')}
            style={{ color: 'rgba(255,255,255,0.7)', fontWeight: '600', textDecorationLine: 'underline' }}
          >
            {t('login.privacy')}
          </Text>
          {t('login.agree_suffix') ? ` ${t('login.agree_suffix')}` : ''}.
        </Text>
      </View>

      {legal ? <LegalModal type={legal} onClose={() => setLegal(null)} /> : null}
    </SafeAreaView>
  );
}
