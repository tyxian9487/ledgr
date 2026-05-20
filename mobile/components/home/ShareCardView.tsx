import { forwardRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, Path, Text as SvgText } from 'react-native-svg';

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
  slices: Array<{ id: string; label: string; color: string; amount: number; pct: number }>;
  labels: {
    financialStatus: string;
    score: string;
    noExpenses: string;
    income: string;
    remaining: string;
  };
}

const ShareCardView = forwardRef<View, Props>(function ShareCardView(
  { score, statusLabel, totalIncome, totalExpenses, remaining, month, year, formatCurrency, slices, labels },
  ref,
) {
  const dateStr = new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  const monthYear = `${MONTH_NAMES[month]} ${year}`;
  const scoreText = score >= 80 ? '90+' : score >= 60 ? '60-79' : '<60';
  const statusColor = score >= 80 ? '#fbbf24' : score >= 60 ? '#cbd5e1' : '#f97316';
  const legendRows = slices.slice(0, 5);

  return (
    <View ref={ref} style={s.card} collapsable={false}>
      <View style={s.header}>
        <Text style={s.appName}>Kachingo</Text>
        <Text style={s.monthYear}>{monthYear}</Text>
      </View>

      <View style={s.statusBox}>
        <View style={s.coin}>
          <Text style={s.coinText}>$</Text>
        </View>
        <View style={s.statusCopy}>
          <Text style={[s.statusLabel, { color: statusColor }]}>{statusLabel}</Text>
          <Text style={s.statusSub}>{labels.financialStatus}</Text>
        </View>
        <View style={s.scoreBadge}>
          <Text style={s.scoreLabel}>{labels.score}</Text>
          <Text style={s.scoreNum}>{scoreText}</Text>
        </View>
      </View>

      <View style={s.middle}>
        <DonutPreview
          slices={slices.map(slice => ({ id: slice.id, color: slice.color, pct: slice.pct }))}
          centerLabel="Expenses"
          centerValue={formatCurrency(totalExpenses)}
        />
        <View style={s.legend}>
          {legendRows.length > 0 ? legendRows.map(slice => (
            <View key={slice.id} style={s.legendRow}>
              <View style={[s.legendDot, { backgroundColor: slice.color }]} />
              <Text style={s.legendLabel}>{slice.label}</Text>
              <Text style={s.legendAmount}>{formatCurrency(slice.amount)}</Text>
            </View>
          )) : (
            <Text style={s.noExpenses}>{labels.noExpenses}</Text>
          )}
        </View>
      </View>

      <View style={s.bottomRow}>
        <View style={s.statBox}>
          <Text style={s.statLabel}>{labels.income}</Text>
          <Text style={s.statValue}>{formatCurrency(totalIncome)}</Text>
        </View>
        <View style={[s.statBox, { marginLeft: 12 }]}>
          <Text style={s.statLabel}>{labels.remaining}</Text>
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

function DonutPreview({
  slices,
  centerLabel,
  centerValue,
}: {
  slices: Array<{ id: string; color: string; pct: number }>;
  centerLabel: string;
  centerValue: string;
}) {
  const size = 260;
  const outerR = 100;
  const innerR = 62;
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
  const segments = slices.map(slice => {
    const start = angle;
    angle += (slice.pct / 100) * 360;
    return { ...slice, start, end: angle };
  });

  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <Circle
        cx={cx}
        cy={cy}
        r={(outerR + innerR) / 2}
        fill="none"
        stroke="rgba(255,255,255,0.16)"
        strokeWidth={outerR - innerR}
      />
      {segments.map(segment => (
        <Path key={segment.id} d={arcPath(segment.start, segment.end)} fill={segment.color} />
      ))}
      <SvgText x={cx} y={cy - 12} textAnchor="middle" fontSize={15} fill="rgba(255,255,255,0.62)">
        {centerLabel}
      </SvgText>
      <SvgText x={cx} y={cy + 20} textAnchor="middle" fontSize={28} fontWeight="bold" fill="white">
        {centerValue}
      </SvgText>
    </Svg>
  );
}

const s = StyleSheet.create({
  card: {
    width: 1024,
    backgroundColor: '#166534',
    borderRadius: 24,
    padding: 32,
    paddingBottom: 18,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  appName: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 18,
    fontWeight: '600',
    width: 180,
  },
  monthYear: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
    flex: 1,
  },
  statusBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 26,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 18,
    paddingVertical: 24,
    paddingHorizontal: 26,
  },
  coin: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#d97706',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 22,
  },
  coinText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '900',
  },
  statusCopy: {
    flex: 1,
  },
  statusLabel: {
    fontSize: 28,
    fontWeight: '800',
  },
  statusSub: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 16,
    marginTop: 6,
  },
  scoreBadge: {
    alignItems: 'flex-end',
  },
  scoreLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 15,
  },
  scoreNum: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '900',
    marginTop: 4,
  },
  middle: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 28,
  },
  legend: {
    flex: 1,
    paddingLeft: 28,
    gap: 22,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginRight: 16,
  },
  legendLabel: {
    flex: 1,
    color: 'rgba(255,255,255,0.7)',
    fontSize: 20,
  },
  legendAmount: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '800',
  },
  noExpenses: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 18,
  },
  bottomRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  statBox: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 18,
    padding: 20,
  },
  statLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  statValue: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '800',
  },
  footer: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 15,
    textAlign: 'center',
  },
});
