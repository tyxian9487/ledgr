import { useEffect } from 'react';
import { Modal, View, Text, TouchableOpacity } from 'react-native';
import { playRewardSound } from '../utils/sounds';
import { BADGES, BadgeDef } from '../utils/achievements';
import { useTranslation } from '../context/LanguageContext';

interface Props {
  badge: BadgeDef;
  earnedCount: number;
  onClose: () => void;
}

export default function BadgeCelebration({ badge, earnedCount, onClose }: Props) {
  const { t } = useTranslation();
  useEffect(() => {
    playRewardSound();
  }, []);

  const remaining = BADGES.length - earnedCount;

  return (
    <Modal visible animationType="fade" transparent onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.88)', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        {/* Ambient glow dots */}
        {[[-90, -70], [90, -90], [-70, 90], [110, 70]].map(([x, y], i) => (
          <View
            key={i}
            style={{
              position: 'absolute', left: '50%', top: '50%',
              width: 12, height: 12, borderRadius: 6,
              backgroundColor: '#22c55e', opacity: 0.25,
              transform: [{ translateX: x as number }, { translateY: y as number }],
            }}
          />
        ))}

        <View style={{ backgroundColor: '#fff', borderRadius: 28, padding: 32, width: '100%', maxWidth: 320, alignItems: 'center' }}>
          {/* Badge icon */}
          <View style={{
            width: 96, height: 96, borderRadius: 48,
            backgroundColor: '#f0fdf4', alignItems: 'center', justifyContent: 'center',
            marginBottom: 16, shadowColor: '#22c55e', shadowOpacity: 0.35, shadowRadius: 20, shadowOffset: { width: 0, height: 0 },
          }}>
            <Text style={{ fontSize: 50 }}>{badge.icon}</Text>
          </View>

          {/* "Badge Unlocked" label */}
          <View style={{ backgroundColor: '#dcfce7', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 4, marginBottom: 12 }}>
            <Text style={{ color: '#15803d', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.2 }}>
              {t('badge.unlocked')}
            </Text>
          </View>

          <Text style={{ fontSize: 20, fontWeight: '900', color: '#111827', textAlign: 'center', marginBottom: 6 }}>
            {t(`badge.${badge.id}.label` as any)}
          </Text>
          <Text style={{ fontSize: 13, color: '#6b7280', textAlign: 'center', lineHeight: 20, marginBottom: 20 }}>
            {t(`badge.${badge.id}.desc` as any)}
          </Text>

          {/* Remaining pill */}
          {remaining > 0 && (
            <View style={{ backgroundColor: '#f3f4f6', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6, marginBottom: 20 }}>
              <Text style={{ color: '#6b7280', fontSize: 12, fontWeight: '600' }}>
                {t('badge.remaining', { n: String(remaining), s: remaining !== 1 ? 's' : '' })}
              </Text>
            </View>
          )}

          <TouchableOpacity
            onPress={onClose}
            style={{ width: '100%', backgroundColor: '#16a34a', borderRadius: 16, paddingVertical: 14, alignItems: 'center' }}
            activeOpacity={0.8}
          >
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>{t('badge.continue')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
