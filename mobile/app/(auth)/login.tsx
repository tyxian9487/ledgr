import { useState } from 'react';
import { View, Text, TouchableOpacity, Image, Dimensions, ActivityIndicator, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from '../../context/LanguageContext';
import { supabase } from '../../utils/supabase';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';
import * as AppleAuthentication from 'expo-apple-authentication';

WebBrowser.maybeCompleteAuthSession();

const { width } = Dimensions.get('window');

const FEATURES = [
  { emoji: '📊', text: 'Track every expense instantly' },
  { emoji: '🎯', text: 'Budget with smart savings goals' },
  { emoji: '📸', text: 'AI-powered receipt scanning' },
  { emoji: '🌍', text: '5 languages supported' },
];

export default function LoginScreen() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState<'google' | 'apple' | null>(null);

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
        await supabase.auth.exchangeCodeForSession(result.url);
      }
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
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'bottom']}>
      <View className="flex-1 items-center justify-center px-8">
        <View className="items-center justify-center mb-2" style={{ width: width * 0.55, height: width * 0.55 }}>
          <Image
            source={require('../../assets/mascot.png')}
            style={{ width: '100%', height: '100%' }}
            resizeMode="contain"
          />
        </View>

        <Text className="text-4xl font-black text-gray-900 tracking-tight">
          Kachingo
        </Text>
        <Text className="text-base text-gray-400 mt-2 text-center leading-relaxed">
          {t('login.tagline')}
        </Text>

        <View className="flex-row flex-wrap justify-center gap-2 mt-6">
          {FEATURES.map(({ emoji, text }) => (
            <View
              key={text}
              className="flex-row items-center bg-gray-50 rounded-full px-3 py-1.5 gap-1.5"
            >
              <Text style={{ fontSize: 13 }}>{emoji}</Text>
              <Text className="text-xs text-gray-500 font-medium">{text}</Text>
            </View>
          ))}
        </View>
      </View>

      <View className="px-6 pb-6 gap-y-3">
        {/* Google */}
        <TouchableOpacity
          onPress={handleGoogleSignIn}
          disabled={loading !== null}
          activeOpacity={0.8}
          className="flex-row items-center justify-center border border-gray-200 rounded-2xl py-4 bg-white"
          style={{ shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 2 }}
        >
          {loading === 'google' ? (
            <ActivityIndicator size="small" color="#4B5563" style={{ marginRight: 10 }} />
          ) : (
            <View className="w-6 h-6 rounded-full bg-red-500 items-center justify-center mr-3">
              <Text className="text-white text-xs font-black">G</Text>
            </View>
          )}
          <Text className="text-gray-700 text-base font-semibold">
            {t('login.google')}
          </Text>
        </TouchableOpacity>

        {/* Apple — iOS only */}
        {Platform.OS === 'ios' && (
          <TouchableOpacity
            onPress={handleAppleSignIn}
            disabled={loading !== null}
            activeOpacity={0.8}
            className="flex-row items-center justify-center bg-gray-900 rounded-2xl py-4"
          >
            {loading === 'apple' ? (
              <ActivityIndicator size="small" color="#fff" style={{ marginRight: 10 }} />
            ) : (
              <Text className="text-white mr-3 text-lg" style={{ lineHeight: 22 }}></Text>
            )}
            <Text className="text-white text-base font-semibold">
              {t('login.apple')}
            </Text>
          </TouchableOpacity>
        )}

        <Text className="text-gray-300 text-xs text-center leading-5 mt-1">
          {t('login.agree')}{' '}
          <Text className="text-gray-400">{t('login.terms')}</Text>
          {' '}{t('login.and')}{' '}
          <Text className="text-gray-400">{t('login.privacy')}</Text>.
        </Text>
      </View>
    </SafeAreaView>
  );
}
