import { useState } from 'react';
import { View, Text } from 'react-native';
import Svg, { Circle, Text as SvgText } from 'react-native-svg';
import { useTranslation } from '../../context/LanguageContext';

export interface Slice {
  id: string;
  label: string;
  color: string;
  value: number;
}

interface Props {
  slices: Slice[];
  size?: number;
  centerLabel?: string;
  centerValue?: string;
}

export default function DonutChart({ slices, size = 160, centerLabel, centerValue }: Props) {
  const { t } = useTranslation();
  const [activeId, setActiveId] = useState<string | null>(null);

  const radius = size * 0.38;
  const strokeWidth = size * 0.12;
  const circumference = 2 * Math.PI * radius;
  const cx = size / 2;
  const cy = size / 2;

  const total = slices.reduce((sum, s) => sum + s.value, 0);

  let offset = 0;
  const segments = slices.map((s) => {
    const pct = total > 0 ? (s.value / total) * 100 : 0;
    const dash = (pct / 100) * circumference;
    const gap = circumference - dash;
    const rotation = (offset / 100) * 360 - 90;
    offset += pct;
    return { ...s, pct, dash, gap, rotation };
  });

  const active = segments.find((s) => s.id === activeId);

  return (
    <View className="items-center gap-1">
      <View style={{ width: size, height: size }}>
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {/* Background ring */}
          <Circle
            cx={cx}
            cy={cy}
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.2)"
            strokeWidth={strokeWidth}
          />
          {/* Segments */}
          {segments.length === 0 ? null : segments.length === 1 ? (
            <Circle
              cx={cx}
              cy={cy}
              r={radius}
              fill="none"
              stroke={segments[0].color}
              strokeWidth={strokeWidth}
              opacity={1}
              onPress={() => setActiveId(activeId === segments[0].id ? null : segments[0].id)}
            />
          ) : (
            segments.map((s) => (
              <Circle
                key={s.id}
                cx={cx}
                cy={cy}
                r={radius}
                fill="none"
                stroke={s.color}
                strokeWidth={strokeWidth}
                strokeDasharray={`${s.dash} ${s.gap}`}
                strokeDashoffset={0}
                transform={`rotate(${s.rotation}, ${cx}, ${cy})`}
                opacity={activeId && activeId !== s.id ? 0.4 : 1}
                onPress={() => setActiveId(activeId === s.id ? null : s.id)}
              />
            ))
          )}
          {/* Center text via SVG */}
          <SvgText
            x={cx}
            y={cy - 6}
            textAnchor="middle"
            fontSize={size * 0.07}
            fill="rgba(255,255,255,0.7)"
          >
            {centerLabel ?? t('card.total_expenses')}
          </SvgText>
          <SvgText
            x={cx}
            y={cy + 10}
            textAnchor="middle"
            fontSize={size * 0.09}
            fontWeight="bold"
            fill="white"
          >
            {centerValue ?? ''}
          </SvgText>
        </Svg>
      </View>

      {/* Active slice tooltip */}
      {active && (
        <View className="flex-row items-center gap-2 rounded-full px-3 py-1 bg-white/20">
          <View
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: active.color }}
          />
          <Text className="text-white text-xs font-medium">{active.label}</Text>
          <Text className="text-white/80 text-xs">{active.value.toLocaleString()}</Text>
        </View>
      )}
    </View>
  );
}
