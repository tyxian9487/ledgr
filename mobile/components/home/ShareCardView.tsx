import { forwardRef } from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';

const happyImg = require('../../assets/m_expression_happy.png');
const winkImg  = require('../../assets/m_expression_wink.png');
// m_expression_sad.png is user-provided; fall back to wink if absent
let sadImg: number;
try { sadImg = require('../../assets/m_expression_sad.png'); }
catch { sadImg = winkImg; }

const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

interface Props {
  score: number;
  statusLabel: string;
  totalIncome: number;
  totalExpenses: number;
  remaining: number;
  month: number;
  year: number;
  formatCurrency: (n: number) => string;
}

const ShareCardView = forwardRef<View, Props>(function ShareCardView(
  { score, statusLabel, totalIncome, totalExpenses, remaining, month, year, formatCurrency },
  ref,
) {
  const mascot = score >= 80 ? happyImg : score >= 60 ? winkImg : sadImg;
  const dateStr = new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  const monthYear = `${MONTH_NAMES[month]} ${year}`;
  const scoreColor = score >= 80 ? '#86efac' : score >= 60 ? '#fde68a' : '#fca5a5';

  return (
    <View ref={ref} style={s.card} collapsable={false}>
      {/* Header row */}
      <View style={s.header}>
        <Text style={s.appName}>Kachingo</Text>
        <Text style={s.monthYear}>{monthYear}</Text>
        <View style={{ width: 60 }} />
      </View>

      {/* Status + mascot row */}
      <View style={s.statusRow}>
        <View style={s.statusChip}>
          <Text style={s.statusLabel}>{statusLabel}</Text>
          <Text style={s.statusSub}>Financial Status</Text>
        </View>
        <Image source={mascot} style={s.mascot} resizeMode="contain" />
        <View style={s.scoreBadge}>
          <Text style={s.scoreLabel}>Score</Text>
          <Text style={[s.scoreNum, { color: scoreColor }]}>{score}</Text>
        </View>
      </View>

      {/* Expenses display */}
      <View style={s.expensesBox}>
        <View style={s.expCircle}>
          <Text style={s.expCircleLabel}>Expenses</Text>
          <Text style={s.expCircleValue}>{formatCurrency(totalExpenses)}</Text>
        </View>
        {totalExpenses === 0 && (
          <Text style={s.noExpenses}>No expenses recorded</Text>
        )}
      </View>

      {/* Income / Remaining row */}
      <View style={s.bottomRow}>
        <View style={s.statBox}>
          <Text style={s.statLabel}>INCOME</Text>
          <Text style={s.statValue}>{formatCurrency(totalIncome)}</Text>
        </View>
        <View style={[s.statBox, { marginLeft: 12 }]}>
          <Text style={s.statLabel}>REMAINING</Text>
          <Text style={[s.statValue, remaining < 0 && { color: '#fca5a5' }]}>
            {formatCurrency(Math.abs(remaining))}
          </Text>
        </View>
      </View>

      {/* Footer */}
      <Text style={s.footer}>Generated with Kachingo · {dateStr}</Text>
    </View>
  );
});

export default ShareCardView;

const s = StyleSheet.create({
  card: {
    width: 360,
    backgroundColor: '#166534',
    borderRadius: 20,
    padding: 20,
    paddingBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  appName: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
    width: 60,
  },
  monthYear: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '800',
    textAlign: 'center',
    flex: 1,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  statusChip: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  statusLabel: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
  },
  statusSub: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 10,
    marginTop: 2,
  },
  mascot: {
    width: 72,
    height: 72,
    flexShrink: 0,
  },
  scoreBadge: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
    minWidth: 56,
  },
  scoreLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 10,
  },
  scoreNum: {
    fontSize: 22,
    fontWeight: '900',
    marginTop: 2,
  },
  expensesBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 16,
    padding: 12,
    minHeight: 72,
  },
  expCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  expCircleLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 8,
    textAlign: 'center',
  },
  expCircleValue: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '800',
    textAlign: 'center',
  },
  noExpenses: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 13,
    flex: 1,
    textAlign: 'center',
  },
  bottomRow: {
    flexDirection: 'row',
    marginBottom: 14,
  },
  statBox: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 14,
    padding: 12,
  },
  statLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  statValue: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
  footer: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 9,
    textAlign: 'center',
  },
});
