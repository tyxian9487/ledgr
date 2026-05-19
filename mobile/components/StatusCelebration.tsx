import { useEffect } from 'react';
import { Modal, View, Text, TouchableOpacity, Share } from 'react-native';
import { playRewardSound, playWarningSound } from '../utils/sounds';
import { useTranslation } from '../context/LanguageContext';

type Status = 'excellent' | 'sustained' | 'critical';

interface Props {
  status: Status;
  score: number;
  onClose: () => void;
}

const STATUS_CONFIG = {
  excellent: {
    color: '#22c55e',
    bgColor: '#052e16',
    accentColor: '#4ade80',
    icon: '🥇',
  },
  sustained: {
    color: '#eab308',
    bgColor: '#1c1917',
    accentColor: '#fbbf24',
    icon: '🥈',
  },
  critical: {
    color: '#ef4444',
    bgColor: '#1c0a0a',
    accentColor: '#f87171',
    icon: '⚠️',
  },
};

export default function StatusCelebration({ status, score, onClose }: Props) {
  const cfg = STATUS_CONFIG[status];
  const { t } = useTranslation();

  useEffect(() => {
    if (status === 'critical') playWarningSound();
    else playRewardSound();
  }, []);

  async function handleShare() {
    const title = t(`status.${status}.title` as any);
    try {
      await Share.share({
        message: t('status.share_msg', { score: String(score), title }),
      });
    } catch {}
  }

  return (
    <Modal visible animationType="fade" transparent onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: `${cfg.bgColor}f0`, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        {/* Sparkle dots */}
        {[
          { x: -100, y: -80 }, { x: 100, y: -100 },
          { x: -80, y: 100 }, { x: 120, y: 80 },
          { x: -50, y: -130 }, { x: 60, y: 130 },
        ].map((pos, i) => (
          <View
            key={i}
            style={{
              position: 'absolute', left: '50%', top: '50%',
              width: i % 2 === 0 ? 8 : 5, height: i % 2 === 0 ? 8 : 5,
              borderRadius: 4, backgroundColor: cfg.accentColor, opacity: 0.4,
              transform: [{ translateX: pos.x }, { translateY: pos.y }],
            }}
          />
        ))}

        <View style={{ width: '100%', maxWidth: 320, alignItems: 'center' }}>
          {/* Coin / status icon */}
          <View style={{
            width: 108, height: 108, borderRadius: 54,
            backgroundColor: `${cfg.color}25`,
            borderWidth: 3, borderColor: `${cfg.color}55`,
            alignItems: 'center', justifyContent: 'center',
            marginBottom: 20,
          }}>
            <Text style={{ fontSize: 54 }}>{cfg.icon}</Text>
          </View>

          {/* Score pill */}
          <View style={{
            backgroundColor: `${cfg.color}30`, borderRadius: 20,
            paddingHorizontal: 18, paddingVertical: 7, marginBottom: 18,
            borderWidth: 1, borderColor: `${cfg.color}50`,
          }}>
            <Text style={{ color: cfg.accentColor, fontWeight: '900', fontSize: 18 }}>{score} / 100</Text>
          </View>

          <Text style={{ color: '#fff', fontWeight: '900', fontSize: 24, textAlign: 'center', marginBottom: 10 }}>
            {t(`status.${status}.title` as any)}
          </Text>
          <Text style={{ color: 'rgba(255,255,255,0.65)', fontSize: 14, textAlign: 'center', lineHeight: 22, marginBottom: 36, paddingHorizontal: 8 }}>
            {t(`status.${status}.msg` as any)}
          </Text>

          {/* Share */}
          <TouchableOpacity
            onPress={handleShare}
            style={{
              width: '100%', backgroundColor: cfg.color,
              borderRadius: 18, paddingVertical: 15, alignItems: 'center', marginBottom: 12,
            }}
            activeOpacity={0.85}
          >
            <Text style={{ color: status === 'excellent' ? '#052e16' : '#fff', fontWeight: '700', fontSize: 15 }}>
              {t('status.share_btn')}
            </Text>
          </TouchableOpacity>

          {/* Dismiss */}
          <TouchableOpacity
            onPress={onClose}
            style={{
              width: '100%', borderRadius: 18, paddingVertical: 15,
              alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
            }}
            activeOpacity={0.7}
          >
            <Text style={{ color: 'rgba(255,255,255,0.6)', fontWeight: '600', fontSize: 15 }}>{t('status.close')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
