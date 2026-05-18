import { useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { Camera, X, ImageIcon, RefreshCw } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Stage = 'preview' | 'processing' | 'review';

interface ParsedReceipt {
  type: 'expense' | 'income';
  amount: number;
  category: string;
  description: string;
}

const PENDING_RECEIPT_KEY = 'kachingo_pending_receipt';

async function parseReceiptWithClaude(base64: string, mediaType: string): Promise<ParsedReceipt> {
  const workerUrl = process.env.EXPO_PUBLIC_WORKER_URL;
  if (!workerUrl) throw new Error('EXPO_PUBLIC_WORKER_URL is not set');

  const res = await fetch(`${workerUrl}/api/scan-receipt`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ base64, mediaType }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as any).error || 'Scan failed');
  }
  return res.json();
}

export default function CaptureScreen() {
  const router = useRouter();
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();

  const [stage, setStage] = useState<Stage>('preview');
  const [capturedUri, setCapturedUri] = useState<string | null>(null);
  const [parsed, setParsed] = useState<ParsedReceipt | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);

  // ── Core: process an image (base64 string + mediaType) ────────────────────
  const processImage = useCallback(async (base64: string, mediaType: string, uri: string) => {
    setCapturedUri(uri);
    setScanError(null);
    setStage('processing');

    try {
      const result = await parseReceiptWithClaude(base64, mediaType);
      setParsed(result);
      setStage('review');
    } catch (err) {
      setScanError(err instanceof Error ? err.message : 'Scan failed');
      setStage('preview');
    }
  }, []);

  // ── Camera capture ─────────────────────────────────────────────────────────
  const capturePhoto = useCallback(async () => {
    if (!cameraRef.current) return;
    try {
      const photo = await cameraRef.current.takePictureAsync({ base64: true, quality: 0.7 });
      if (!photo?.base64) return;
      await processImage(photo.base64, 'image/jpeg', photo.uri);
    } catch {
      setScanError('Failed to capture photo. Please try again.');
      setStage('preview');
    }
  }, [processImage]);

  // ── Gallery picker ─────────────────────────────────────────────────────────
  const pickFromGallery = useCallback(async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
      base64: true,
    });

    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    if (!asset.base64) {
      setScanError('Could not read image. Please try another photo.');
      return;
    }
    const ext = (asset.mimeType || 'image/jpeg') as string;
    await processImage(asset.base64, ext, asset.uri);
  }, [processImage]);

  // ── Reset ──────────────────────────────────────────────────────────────────
  const reset = useCallback(() => {
    setCapturedUri(null);
    setParsed(null);
    setScanError(null);
    setStage('preview');
  }, []);

  // ── Save result → AsyncStorage → navigate home ────────────────────────────
  const saveAndGoHome = useCallback(async () => {
    if (!parsed) return;
    try {
      await AsyncStorage.setItem(PENDING_RECEIPT_KEY, JSON.stringify(parsed));
      router.replace('/(tabs)');
      // The home screen should read PENDING_RECEIPT_KEY on focus and offer to add the transaction.
    } catch {
      Alert.alert('Error', 'Could not save receipt data. Please try again.');
    }
  }, [parsed, router]);

  // ── Permission not yet determined ──────────────────────────────────────────
  if (!permission) {
    return (
      <View className="flex-1 bg-black items-center justify-center">
        <ActivityIndicator color="#fff" />
      </View>
    );
  }

  // ── Permission denied ──────────────────────────────────────────────────────
  if (!permission.granted) {
    return (
      <SafeAreaView className="flex-1 bg-black items-center justify-center px-8">
        <Camera size={48} color="rgba(255,255,255,0.6)" />
        <Text className="text-white font-semibold text-lg text-center mt-4 mb-2">
          Camera Access Required
        </Text>
        <Text className="text-white/60 text-sm text-center leading-relaxed mb-8">
          Allow camera access to scan receipts and automatically extract transaction details.
        </Text>
        <TouchableOpacity
          onPress={requestPermission}
          className="w-full py-4 rounded-2xl bg-green-600 items-center mb-3"
          activeOpacity={0.8}
        >
          <Text className="text-white font-bold">Allow Camera</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={pickFromGallery}
          className="w-full py-4 rounded-2xl bg-white/15 border border-white/20 items-center mb-3"
          activeOpacity={0.8}
        >
          <Text className="text-white font-semibold">Use Gallery Instead</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.back()} className="py-3">
          <Text className="text-white/50 text-sm">Cancel</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // ── Review stage ───────────────────────────────────────────────────────────
  if (stage === 'review' && parsed) {
    return (
      <SafeAreaView className="flex-1 bg-black">
        {/* Header */}
        <View className="flex-row items-center justify-between px-5 py-4">
          <TouchableOpacity
            onPress={reset}
            className="w-10 h-10 rounded-full bg-white/15 items-center justify-center"
          >
            <X size={20} color="#fff" />
          </TouchableOpacity>
          <Text className="text-white font-bold text-base">Receipt Scanned</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Captured image thumbnail */}
        {capturedUri ? (
          <View className="mx-5 rounded-2xl overflow-hidden mb-5" style={{ height: 200 }}>
            <Image source={{ uri: capturedUri }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
            <View style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(0,0,0,0.35)' }]} />
          </View>
        ) : null}

        {/* Parsed fields */}
        <View className="mx-5 bg-white/10 rounded-2xl p-5 gap-4">
          <Text className="text-white/60 text-xs font-semibold uppercase tracking-wider mb-1">
            Review Details
          </Text>

          <View className="flex-row items-center justify-between">
            <Text className="text-white/70 text-sm">Type</Text>
            <View className={`px-3 py-1 rounded-full ${parsed.type === 'expense' ? 'bg-red-500/30' : 'bg-green-500/30'}`}>
              <Text className={`text-sm font-semibold capitalize ${parsed.type === 'expense' ? 'text-red-300' : 'text-green-300'}`}>
                {parsed.type}
              </Text>
            </View>
          </View>

          <View className="flex-row items-center justify-between">
            <Text className="text-white/70 text-sm">Amount</Text>
            <Text className="text-white font-bold text-lg">{parsed.amount.toFixed(2)}</Text>
          </View>

          <View className="flex-row items-center justify-between">
            <Text className="text-white/70 text-sm">Category</Text>
            <Text className="text-white font-semibold capitalize">{parsed.category}</Text>
          </View>

          <View>
            <Text className="text-white/70 text-sm mb-1">Description</Text>
            <Text className="text-white font-medium">{parsed.description}</Text>
          </View>
        </View>

        {/* Actions */}
        <View className="mx-5 mt-auto mb-6 gap-3">
          <TouchableOpacity
            onPress={saveAndGoHome}
            className="w-full py-4 rounded-2xl bg-green-600 items-center shadow-lg"
            activeOpacity={0.85}
          >
            <Text className="text-white font-bold text-base">Save Transaction</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={reset}
            className="w-full py-3.5 rounded-2xl bg-white/15 border border-white/20 items-center"
            activeOpacity={0.8}
          >
            <Text className="text-white font-semibold">Scan Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── Processing stage ───────────────────────────────────────────────────────
  if (stage === 'processing') {
    return (
      <SafeAreaView className="flex-1 bg-black items-center justify-center gap-5">
        {capturedUri ? (
          <Image
            source={{ uri: capturedUri }}
            className="w-3/4 rounded-2xl opacity-40"
            style={{ height: 240 }}
            resizeMode="contain"
          />
        ) : null}
        <ActivityIndicator size="large" color="#fff" />
        <Text className="text-white font-medium text-sm">Analyzing receipt...</Text>
        <Text className="text-white/60 text-xs">AI is reading your receipt</Text>
      </SafeAreaView>
    );
  }

  // ── Preview / camera stage ─────────────────────────────────────────────────
  return (
    <View className="flex-1 bg-black">
      {/* Camera viewfinder */}
      <View className="flex-1 relative overflow-hidden">
        <CameraView
          ref={cameraRef}
          className="flex-1"
          facing="back"
        />

        {/* Receipt frame overlay */}
        <View
          className="absolute inset-0 items-center justify-center"
          pointerEvents="none"
        >
          <View
            style={{
              width: '78%',
              height: '62%',
              borderWidth: 2,
              borderColor: 'rgba(255,255,255,0.65)',
              borderRadius: 16,
              shadowColor: '#000',
              shadowOpacity: 0.6,
              shadowRadius: 0,
              shadowOffset: { width: 0, height: 0 },
            }}
          />
        </View>

        {/* Align hint */}
        <View className="absolute bottom-36 left-0 right-0 items-center" pointerEvents="none">
          <Text className="text-white/80 text-xs">Align receipt within frame</Text>
        </View>

        {/* Error banner */}
        {scanError ? (
          <View className="absolute top-16 left-5 right-5 bg-red-500/80 rounded-2xl px-4 py-3">
            <Text className="text-white text-xs text-center font-medium">{scanError}</Text>
          </View>
        ) : null}
      </View>

      {/* Controls bar */}
      <View
        className="px-8 py-6 flex-row items-center justify-between"
        style={{ backgroundColor: 'rgba(0,0,0,0.85)', paddingBottom: 40 }}
      >
        {/* Close */}
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-14 h-14 rounded-full bg-red-500/20 border-2 border-red-500/60 items-center justify-center"
          activeOpacity={0.8}
        >
          <X size={22} color="#f87171" />
        </TouchableOpacity>

        {/* Shutter */}
        <TouchableOpacity
          onPress={capturePhoto}
          className="w-20 h-20 rounded-full bg-white items-center justify-center shadow-2xl"
          activeOpacity={0.9}
        >
          <View className="w-16 h-16 rounded-full border-4 border-black/20 bg-white" />
        </TouchableOpacity>

        {/* Gallery */}
        <TouchableOpacity
          onPress={pickFromGallery}
          className="w-14 h-14 rounded-full bg-white/10 border border-white/20 items-center justify-center"
          activeOpacity={0.8}
        >
          <ImageIcon size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}
