import { useState, useRef } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Svg, { Circle, Circle as SvgCircle, Text as SvgText } from 'react-native-svg';
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
  slices: { color: string; pct: number }[];
  size?: number;
  centerLabel?: string;
  centerValue?: string;
}

function DonutRing({ slices, size = 120, centerLabel, centerValue }: DonutRingProps) {
  const radius = size * 0.38;
  const circumference = 2 * Math.PI * radius;
  const cx = size / 2;
  const cy = size / 2;
  const strokeWidth = size * 0.12;

  let offset = 0;

  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* Background ring */}
      <Circle
        cx={cx}
        cy={cy}
        r={radius}
        fill="none"
        stroke="rgba(255,255,255,0.15)"
        strokeWidth={strokeWidth}
      />
      {/* Segments */}
      {slices.length === 0 ? null : slices.length === 1 ? (
        <Circle
          cx={cx}
          cy={cy}
          r={radius}
          fill="none"
          stroke={slices[0].color}
          strokeWidth={strokeWidth}
        />
      ) : (
        slices.map((s, i) => {
          const dash = (s.pct / 100) * circumference;
          const gap = circumference - dash;
          const rotation = (offset / 100) * 360 - 90;
          offset += s.pct;
          return (
            <Circle
              key={i}
              cx={cx}
              cy={cy}
              r={radius}
              fill="none"
              stroke={s.color}
              strokeWidth={strokeWidth}
              strokeDasharray={`${dash} ${gap}`}
              strokeDashoffset={0}
              transform={`rotate(${rotation}, ${cx}, ${cy})`}
            />
          );
        })
      )}
      {/* Center labels */}
      {centerLabel ? (
        <SvgText
          x={cx}
          y={cy - 5}
          textAnchor="middle"
          fontSize={size * 0.07}
          fill="rgba(255,255,255,0.7)"
        >
          {centerLabel}
        </SvgText>
      ) : null}
      {centerValue ? (
        <SvgText
          x={cx}
          y={cy + 10}
          textAnchor="middle"
          fontSize={size * 0.09}
          fontWeight="bold"
          fill="white"
        >
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

  const topSlices = slices.slice(0, 4);

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
              const FileSystem = await import('expo-file-system');
              const Sharing = await import('expo-sharing');
              const dest = FileSystem.cacheDirectory + 'kachingo_card.png';
              await FileSystem.copyAsync({ from: uri, to: dest });
              await Sharing.shareAsync(dest, { mimeType: 'image/png', dialogTitle: 'Share your financial snapshot' });
            } catch (_) {}
          }}
          className="w-8 h-8 rounded-full bg-white/20 items-center justify-center ml-1"
        >
          <Share2 size={14} color="white" />
        </TouchableOpacity>
      </View>

      {/* Donut + category legend */}
      <View className="flex-row items-center px-4 pb-3 gap-4">
        {/* Donut */}
        <DonutRing
          slices={slices.map((s) => ({ color: s.color, pct: s.pct }))}
          size={130}
          centerLabel={t('card.total_expenses')}
          centerValue={formatCurrency(totalExpenses)}
        />

        {/* Category legend */}
        <View className="flex-1 gap-2">
          {topSlices.length === 0 ? (
            <Text className="text-white/50 text-xs">{t('card.no_expenses')}</Text>
          ) : (
            topSlices.map((s) => (
              <View key={s.id} className="flex-row items-center gap-2">
                <View
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: s.color }}
                />
                <Text className="text-white/80 text-xs flex-1" numberOfLines={1}>
                  {s.label}
                </Text>
                <Text className="text-white text-xs font-bold flex-shrink-0">
                  {formatCurrency(s.amount)}
                </Text>
              </View>
            ))
          )}
        </View>
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
      />
    </View>
    </>
  );
}
