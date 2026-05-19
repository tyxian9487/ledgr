import { useEffect } from 'react';
import { Modal, View, Text, TouchableOpacity, Share } from 'react-native';
import { playRewardSound, playWarningSound } from '../utils/sounds';

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
    title: 'Excellent Health!',
    msg: 'Your finances are in excellent shape. Keep up the great work and stay consistent!',
  },
  sustained: {
    color: '#eab308',
    bgColor: '#1c1917',
    accentColor: '#fbbf24',
    icon: '🥈',
    title: 'Fair Health',
    msg: "You're managing well. A few targeted adjustments and you'll reach excellent health.",
  },
  critical: {
    color: '#ef4444',
    bgColor: '#1c0a0a',
    accentColor: '#f87171',
    icon: '⚠️',
    title: 'Needs Attention',
    msg: 'Expenses are high relative to income. Focus on reducing your biggest spending categories.',
  },
};

export default function StatusCelebration({ status, score, onClose }: Props) {
  const cfg = STATUS_CONFIG[status];

  useEffect(() => {
    if (status === 'critical') playWarningSound();
    else playRewardSound();
  }, []);

  async function handleShare() {
    try {
      await Share.share({
        message: `My financial health score is ${score}/100 — ${cfg.title} 💰 Tracked with Kachingo!`,
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
            {cfg.title}
          </Text>
          <Text style={{ color: 'rgba(255,255,255,0.65)', fontSize: 14, textAlign: 'center', lineHeight: 22, marginBottom: 36, paddingHorizontal: 8 }}>
            {cfg.msg}
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
              Share My Score
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
            <Text style={{ color: 'rgba(255,255,255,0.6)', fontWeight: '600', fontSize: 15 }}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
