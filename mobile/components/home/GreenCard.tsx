import { useState, useRef } from 'react';
import { Alert, View, Text, TouchableOpacity } from 'react-native';
import Svg, { Circle, Circle as SvgCircle, Path, Text as SvgText } from 'react-native-svg';
import { ChevronLeft, ChevronRight, ChevronDown, Share2 } from 'lucide-react-native';
import { captureRef } from 'react-native-view-shot';
import { useApp } from '../../context/AppContext';
import { useTranslation } from '../../context/LanguageContext';
import { EXPENSE_CATEGORIES, FinancialStatus } from '../../types';
import ShareCardView from './ShareCardView';

interface Props {
  year: number;
  month: number;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onYearChange?: (year: number) => void;
}

const MONTH_KEYS = [
  'month.jan', 'month.feb', 'month.mar', 'month.apr',
  'month.may', 'month.jun', 'month.jul', 'month.aug',
  'month.sep', 'month.oct', 'month.nov', 'month.dec',
] as const;

const MONTH_SHORT_KEYS = [
  'month.jan.short', 'month.feb.short', 'month.mar.short', 'month.apr.short',
  'month.may.short', 'month.jun.short', 'month.jul.short', 'month.aug.short',
  'month.sep.short', 'month.oct.short', 'month.nov.short', 'month.dec.short',
] as const;

function GoldCoin({ size = 28 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 28 28">
      <SvgCircle cx="14" cy="14" r="13" fill="#f59e0b" stroke="#d97706" strokeWidth="1.5"/>
      <SvgCircle cx="14" cy="14" r="9" fill="none" stroke="#fbbf24" strokeWidth="1" opacity={0.6}/>
      <SvgText x="14" y="18.5" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#92400e">$</SvgText>
    </Svg>
  );
}
function SilverCoin({ size = 28 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 28 28">
      <SvgCircle cx="14" cy="14" r="13" fill="#94a3b8" stroke="#64748b" strokeWidth="1.5"/>
      <SvgCircle cx="14" cy="14" r="9" fill="none" stroke="#cbd5e1" strokeWidth="1" opacity={0.6}/>
      <SvgText x="14" y="18.5" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#1e293b">$</SvgText>
    </Svg>
  );
}
function CopperCoin({ size = 28 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 28 28">
      <SvgCircle cx="14" cy="14" r="13" fill="#b45309" stroke="#92400e" strokeWidth="1.5"/>
      <SvgCircle cx="14" cy="14" r="9" fill="none" stroke="#d97706" strokeWidth="1" opacity={0.6}/>
      <SvgText x="14" y="18.5" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#fef3c7">$</SvgText>
    </Svg>
  );
}

function getStatus(income: number, expenses: number): FinancialStatus {
  if (income === 0) return expenses === 0 ? 'excellent' : 'critical';
  const ratio = expenses / income;
  if (ratio < 0.5) return 'excellent';
  if (ratio < 0.8) return 'sustained';
  return 'critical';
}

interface DonutRingProps {
  slices: { id: string; color: string; pct: number }[];
  size?: number;
  centerLabel?: string;
  centerValue?: string;
  selectedId?: string | null;
  onSlicePress?: (id: string) => void;
}

function DonutRing({ slices, size = 200, centerLabel, centerValue, selectedId, onSlicePress }: DonutRingProps) {
  const outerR = size * 0.42;
  const innerR = size * 0.27;
  const cx = size / 2;
  const cy = size / 2;

  function pt(angle: number, r: number) {
    const rad = (angle - 90) * Math.PI / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  }

  function arcPath(startAngle: number, endAngle: number): string {
    const delta = Math.min(endAngle - startAngle, 359.9);
    const ea = startAngle + delta;
    const p1 = pt(startAngle, outerR);
    const p2 = pt(ea, outerR);
    const p3 = pt(ea, innerR);
    const p4 = pt(startAngle, innerR);
    const large = delta > 180 ? 1 : 0;
    return `M ${p1.x} ${p1.y} A ${outerR} ${outerR} 0 ${large} 1 ${p2.x} ${p2.y} L ${p3.x} ${p3.y} A ${innerR} ${innerR} 0 ${large} 0 ${p4.x} ${p4.y} Z`;
  }

  let angle = 0;
  const segments = slices.map(s => {
    const start = angle;
    angle += (s.pct / 100) * 360;
    return { ...s, start, end: angle };
  });

  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <Circle
        cx={cx} cy={cy}
        r={(outerR + innerR) / 2}
        fill="none"
        stroke="rgba(255,255,255,0.15)"
        strokeWidth={outerR - innerR}
      />
      {segments.length === 0 ? null : segments.map(s => (
        <Path
          key={s.id}
          d={arcPath(s.start, s.end)}
          fill={s.color}
          opacity={selectedId && selectedId !== s.id ? 0.3 : 1}
          onPress={() => onSlicePress?.(s.id)}
        />
      ))}
      {centerLabel ? (
        <SvgText x={cx} y={cy - 6} textAnchor="middle" fontSize={size * 0.065} fill="rgba(255,255,255,0.65)">
          {centerLabel}
        </SvgText>
      ) : null}
      {centerValue ? (
        <SvgText x={cx} y={cy + 13} textAnchor="middle" fontSize={size * 0.09} fontWeight="bold" fill="white">
          {centerValue}
        </SvgText>
      ) : null}
    </Svg>
  );
}

const STATUS_CONFIG = {
  excellent: { Coin: GoldCoin, textColor: '#fbbf24', score: '90+' },
  sustained: { Coin: SilverCoin, textColor: '#cbd5e1', score: '60-79' },
  critical:  { Coin: CopperCoin, textColor: '#f97316', score: '<60' },
} as const;

export default function GreenCard({ year, month, onPrevMonth, onNextMonth, onYearChange }: Props) {
  const { getMonthTransactions, getMonthIncome, getMonthExpenses, formatCurrency } = useApp();
  const { t } = useTranslation();
  const shareCardRef = useRef<View>(null);

  const txs = getMonthTransactions(year, month);
  const totalIncome = getMonthIncome(year, month);
  const totalExpenses = getMonthExpenses(year, month);
  const remaining = totalIncome - totalExpenses;

  const status = getStatus(totalIncome, totalExpenses);
  const { Coin, textColor, score } = STATUS_CONFIG[status];

  // Numeric score for share card (matches same formula as profile page)
  const numericScore = totalIncome > 0
    ? Math.min(100, Math.max(0, Math.round(100 - (totalExpenses / totalIncome) * 100)))
    : totalExpenses === 0 ? 85 : 10;

  const now = new Date();
  const isFuture = new Date(year, month) >= new Date(now.getFullYear(), now.getMonth());

  const todayLabel = String(new Date().getDate()).padStart(2, '0');
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 6 }, (_, idx) => currentYear - idx);
  const [showYearPicker, setShowYearPicker] = useState(false);
  const [selectedSliceId, setSelectedSliceId] = useState<string | null>(null);

  function handleSlicePress(id: string) {
    setSelectedSliceId(prev => prev === id ? null : id);
  }

  const statusLabel =
    status === 'excellent'
      ? t('card.status_excellent')
      : status === 'sustained'
      ? t('card.status_sustained')
      : t('card.status_critical');

  // Build category slices
  const categoryTotals: Record<string, number> = {};
  txs.filter((tx) => tx.type === 'expense').forEach((tx) => {
    categoryTotals[tx.category] = (categoryTotals[tx.category] || 0) + tx.amount;
  });

  const slices = EXPENSE_CATEGORIES.filter((c) => categoryTotals[c.id]).map((c) => ({
    id: c.id,
    label: c.label,
    color: c.color,
    amount: categoryTotals[c.id],
    pct: totalExpenses > 0 ? (categoryTotals[c.id] / totalExpenses) * 100 : 0,
  }));

  return (
    <>
    <View className="bg-green-700 rounded-3xl mx-4 overflow-hidden">
      {/* Header row: month navigation */}
      <View className="flex-row items-center px-5 pt-4 pb-2 gap-2">
        {/* Left: today's date pill */}
        <View className="bg-white/20 rounded-xl px-3 py-1.5">
          <Text className="text-white font-bold text-sm">{todayLabel}</Text>
        </View>

        {/* Center: month navigation */}
        <View className="flex-1 flex-row items-center justify-center gap-3">
          <TouchableOpacity onPress={onPrevMonth} className="w-7 h-7 rounded-full bg-white/20 items-center justify-center" activeOpacity={0.7}>
            <ChevronLeft size={16} color="white" />
          </TouchableOpacity>
          <Text className="text-white font-semibold text-sm tracking-widest uppercase">
            {t(MONTH_SHORT_KEYS[month] as any)}
          </Text>
          <TouchableOpacity onPress={onNextMonth} disabled={isFuture} className="w-7 h-7 rounded-full bg-white/20 items-center justify-center" activeOpacity={0.7} style={{ opacity: isFuture ? 0.3 : 1 }}>
            <ChevronRight size={16} color="white" />
          </TouchableOpacity>
        </View>

        {/* Right: year selector */}
        <TouchableOpacity onPress={() => setShowYearPicker(v => !v)} className="bg-white/20 rounded-xl px-3 py-1.5 flex-row items-center gap-1">
          <Text className="text-white font-bold text-sm">{year}</Text>
          <ChevronDown size={12} color="white" />
        </TouchableOpacity>
      </View>

      {showYearPicker && (
        <View className="mx-4 mb-2 bg-white/10 rounded-2xl overflow-hidden">
          {yearOptions.map(y => (
            <TouchableOpacity
              key={y}
              onPress={() => { onYearChange?.(y); setShowYearPicker(false); }}
              className={`px-4 py-2.5 flex-row items-center justify-between ${y === year ? 'bg-white/20' : ''}`}
            >
              <Text className={`text-sm font-semibold ${y === year ? 'text-white' : 'text-white/60'}`}>{y}</Text>
              {y === year && <Text className="text-white text-xs">✓</Text>}
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Financial status glass box */}
      <View className="mx-4 mb-3 rounded-2xl bg-white/15 p-3 flex-row items-center gap-3">
        <Coin size={36} />

        <View className="flex-1">
          <Text className="text-white/60 text-[10px] uppercase tracking-wider font-medium">
            {t('card.financial_status')}
          </Text>
          <Text className="font-bold text-base leading-tight" style={{ color: textColor }}>
            {statusLabel}
          </Text>
        </View>

        <View className="items-end mr-0">
          <Text className="text-white/60 text-[10px]">{t('card.score')}</Text>
          <Text className="text-white font-semibold text-sm">{score}</Text>
        </View>
        <TouchableOpacity
          onPress={async () => {
            try {
              const uri = await captureRef(shareCardRef, { format: 'png', quality: 1.0 });
              const FileSystem = await import('expo-file-system/legacy');
              const Sharing = await import('expo-sharing');
              const available = await Sharing.isAvailableAsync();
              if (!available) {
                Alert.alert(t('card.share_dialog'), 'Sharing is not available on this device.');
                return;
              }
              const dest = `${FileSystem.cacheDirectory ?? ''}kachingo_card_${Date.now()}.png`;
              await FileSystem.copyAsync({ from: uri, to: dest });
              await Sharing.shareAsync(dest, { mimeType: 'image/png', dialogTitle: t('card.share_dialog') });
            } catch (error) {
              console.warn('[GreenCard] Share failed:', error);
              Alert.alert(t('card.share_dialog'), 'Unable to generate the PNG right now.');
            }
          }}
          className="w-8 h-8 rounded-full bg-white/20 items-center justify-center ml-1"
        >
          <Share2 size={14} color="white" />
        </TouchableOpacity>
      </View>

      {/* Donut — centered, tappable segments */}
      <View className="items-center pb-1">
        <DonutRing
          slices={slices.map((s) => ({ id: s.id, color: s.color, pct: s.pct }))}
          size={200}
          centerLabel={t('card.total_expenses')}
          centerValue={formatCurrency(totalExpenses)}
          selectedId={selectedSliceId}
          onSlicePress={handleSlicePress}
        />
        {/* Segment detail chip */}
        {(() => {
          const sel = slices.find(s => s.id === selectedSliceId);
          if (sel) {
            return (
              <View className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-white/15 mb-3 -mt-1 max-w-[88%]">
                <View className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: sel.color }} />
                <Text className="text-white/90 text-xs font-semibold flex-shrink" numberOfLines={1}>{sel.label}</Text>
                <Text className="text-white font-bold text-xs">{formatCurrency(sel.amount)}</Text>
                <Text className="text-white/50 text-[10px]">({sel.pct.toFixed(0)}%)</Text>
              </View>
            );
          }
          if (slices.length === 0) {
            return <Text className="text-white/40 text-xs mb-3 -mt-1">{t('card.no_expenses')}</Text>;
          }
          return <Text className="text-white/35 text-xs mb-3 -mt-1">{t('card.tap_segment')}</Text>;
        })()}
      </View>

      {/* Income / Remaining row */}
      <View className="mx-4 mb-4 flex-row gap-3">
        <View className="flex-1 bg-white/15 rounded-2xl p-3">
          <Text className="text-white/60 text-[10px] uppercase tracking-wider mb-1">
            {t('common.income')}
          </Text>
          <Text className="text-white font-bold text-base">{formatCurrency(totalIncome)}</Text>
        </View>
        <View className="flex-1 bg-white/15 rounded-2xl p-3">
          <Text className="text-white/60 text-[10px] uppercase tracking-wider mb-1">
            {t('card.remaining')}
          </Text>
          <View className="flex-row items-baseline gap-1">
            <Text
              className="font-bold text-base"
              style={{ color: remaining >= 0 ? 'white' : '#fca5a5' }}
            >
              {formatCurrency(Math.abs(remaining))}
            </Text>
            {remaining < 0 && (
              <Text className="text-red-300 text-[10px]">{t('card.deficit')}</Text>
            )}
          </View>
        </View>
      </View>
    </View>

    {/* Off-screen share card — captured as PNG when share button is pressed */}
    <View style={{ position: 'absolute', top: -9999, left: 0 }} pointerEvents="none">
      <ShareCardView
        ref={shareCardRef}
        score={numericScore}
        statusLabel={statusLabel}
        totalIncome={totalIncome}
        totalExpenses={totalExpenses}
        remaining={remaining}
        month={month}
        year={year}
        formatCurrency={formatCurrency}
        slices={slices}
        labels={{
          financialStatus: t('card.financial_status'),
          score: t('card.score'),
          noExpenses: t('card.no_expenses'),
          income: t('common.income').toUpperCase(),
          remaining: t('card.remaining').toUpperCase(),
        }}
      />
    </View>
    </>
  );
}
