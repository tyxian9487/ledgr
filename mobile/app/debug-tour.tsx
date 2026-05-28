/**
 * debug-tour.tsx — Spotlight coordinate-system diagnostics (DEV only)
 *
 * Accessible via: router.push('/debug-tour') from home screen in __DEV__ builds.
 *
 * ANSWERS ONE QUESTION PER STAGE
 * ───────────────────────────────
 * "Does measureInWindow() + statusBarTranslucent Modal land in the right place?"
 *
 * THREE SIMULTANEOUS RECTANGLES
 * ──────────────────────────────
 *  🟩 GREEN  — the actual View (border on the View itself — ground truth)
 *  🟥 RED    — Modal border at measureInWindow() coords (statusBarTranslucent=true)
 *  🟦 BLUE   — Direct absolute border at measureInWindow() coords (no Modal)
 *
 * If RED ≠ GREEN but BLUE = GREEN → Modal coordinate space is wrong
 * If BLUE ≠ GREEN but RED = GREEN → root absolute positioning is wrong
 * If both ≠ GREEN by the SAME delta → measureInWindow() returns wrong coords
 *                                    (wrong native node, parent transform, etc.)
 *
 * STAGES
 * ───────
 *  A — Plain View, NO SafeAreaView, NO ScrollView (pure coordinate baseline)
 *  B — View inside SafeAreaView edges={['top']}
 *  C — View inside ScrollView, measured while scrolled to known offset
 */

import { useRef, useState, useCallback } from 'react';
import {
  Dimensions,
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

// ─── Shared types ─────────────────────────────────────────────────────────────

interface Rect { x: number; y: number; width: number; height: number; }
interface MeasureResult { label: string; x: number; y: number; width: number; height: number; }
type Stage = 'A' | 'B' | 'C';

// ─── TargetBox ─────────────────────────────────────────────────────────────────
// The green reference box that gets measured.  collapsable={false} is mandatory —
// without it Android may flatten the node and hand back a wrong native ref.

function TargetBox({ onMeasure }: { onMeasure: (r: MeasureResult[], lr: Rect) => void }) {
  const ref = useRef<View>(null);
  const [lr, setLr] = useState<Rect | null>(null);

  const measure = useCallback(() => {
    const v = ref.current;
    if (!v || !lr) return;
    const results: MeasureResult[] = [];
    let pending = 2;
    const done = () => { if (--pending === 0) onMeasure(results, lr); };

    v.measureInWindow((x, y, w, h) => {
      results.push({ label: 'measureInWindow', x, y, width: w, height: h });
      done();
    });
    v.measure((_rx, _ry, rw, rh, px, py) => {
      results.push({ label: 'measure(pageX/Y)', x: px, y: py, width: rw, height: rh });
      done();
    });
  }, [onMeasure, lr]);

  return (
    <View
      ref={ref}
      collapsable={false}
      style={styles.targetBox}
      onLayout={e => {
        const { x, y, width, height } = e.nativeEvent.layout;
        setLr({ x, y, width, height });
      }}
    >
      <Text style={styles.targetLabel}>TARGET</Text>
      <TouchableOpacity onPress={measure} style={styles.measureBtn}>
        <Text style={styles.measureBtnTxt}>Measure</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── DirectOverlay ─────────────────────────────────────────────────────────────
// Renders a border as a regular absolute-positioned View (no Modal).

function DirectOverlay({ rect, color }: { rect: Rect; color: string }) {
  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute', top: rect.y, left: rect.x,
        width: rect.width, height: rect.height,
        borderWidth: 3, borderColor: color, borderRadius: 4,
      }}
    />
  );
}

// ─── ModalOverlay ──────────────────────────────────────────────────────────────
// Renders the same border inside a transparent statusBarTranslucent Modal.

function ModalOverlay({ rect, color, onClose }: { rect: Rect; color: string; onClose: () => void }) {
  return (
    <Modal visible transparent statusBarTranslucent animationType="none">
      <View pointerEvents="none" style={StyleSheet.absoluteFillObject}>
        <View
          style={{
            position: 'absolute', top: rect.y, left: rect.x,
            width: rect.width, height: rect.height,
            borderWidth: 3, borderColor: color, borderRadius: 4,
          }}
        />
      </View>
      <TouchableOpacity style={StyleSheet.absoluteFillObject} onPress={onClose} activeOpacity={0} />
    </Modal>
  );
}

// ─── ResultsPanel ─────────────────────────────────────────────────────────────

function ResultsPanel({
  results, layoutRect, showModal, setShowModal,
}: {
  results: MeasureResult[];
  layoutRect: Rect | null;
  showModal: boolean;
  setShowModal: (v: boolean) => void;
}) {
  const { width: W, height: H } = Dimensions.get('window');
  const insets = useSafeAreaInsets();
  const sbH = StatusBar.currentHeight ?? 0;

  const miw = results.find(r => r.label === 'measureInWindow');
  const mp  = results.find(r => r.label === 'measure(pageX/Y)');

  return (
    <View style={styles.panel}>
      <Row label="Dimensions.window" value={`${W.toFixed(0)} × ${H.toFixed(0)}`} />
      <Row label="StatusBar.currentHeight" value={`${sbH}`} />
      <Row label="safeArea.top/bottom" value={`${insets.top.toFixed(0)} / ${insets.bottom.toFixed(0)}`} />

      {layoutRect && (
        <Row
          label="onLayout (local coords)"
          value={`(${layoutRect.x.toFixed(0)},${layoutRect.y.toFixed(0)}) ${layoutRect.width.toFixed(0)}×${layoutRect.height.toFixed(0)}`}
          color="#4ade80"
        />
      )}
      {miw && (
        <Row
          label="measureInWindow"
          value={`(${miw.x.toFixed(0)},${miw.y.toFixed(0)}) ${miw.width.toFixed(0)}×${miw.height.toFixed(0)}`}
          color="#f87171"
        />
      )}
      {mp && (
        <Row
          label="measure(pageX/Y)"
          value={`(${mp.x.toFixed(0)},${mp.y.toFixed(0)}) ${mp.width.toFixed(0)}×${mp.height.toFixed(0)}`}
          color="#60a5fa"
        />
      )}

      {miw && mp && (
        <Row
          label="miW − measure delta"
          value={`dx=${(miw.x - mp.x).toFixed(0)} dy=${(miw.y - mp.y).toFixed(0)}`}
          color="#a78bfa"
        />
      )}
      {miw && layoutRect && (
        <Row
          label="miW − onLayout delta"
          value={`dx=${(miw.x - layoutRect.x).toFixed(0)} dy=${(miw.y - layoutRect.y).toFixed(0)}`}
          color="#a78bfa"
        />
      )}

      <TouchableOpacity
        style={[styles.measureBtn, { marginTop: 8, alignSelf: 'stretch', opacity: results.length ? 1 : 0.4 }]}
        onPress={() => results.length && setShowModal(!showModal)}
      >
        <Text style={styles.measureBtnTxt}>
          {showModal ? '✕ Hide Modal overlay (RED)' : '▶ Show Modal overlay (RED)'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

function Row({ label, value, color = '#94a3b8' }: { label: string; value: string; color?: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={[styles.rowValue, { color }]}>{value}</Text>
    </View>
  );
}

// ─── Stages ───────────────────────────────────────────────────────────────────

function StageA() {
  const [results, setResults] = useState<MeasureResult[]>([]);
  const [layoutRect, setLayoutRect] = useState<Rect | null>(null);
  const [showModal, setShowModal] = useState(false);
  const miw = results.find(r => r.label === 'measureInWindow');

  return (
    <View style={{ flex: 1, backgroundColor: '#0f172a' }}>
      {/* No SafeAreaView — raw position */}
      <View style={{ alignItems: 'center', paddingTop: 60 }}>
        <TargetBox onMeasure={(r, lr) => { setResults(r); setLayoutRect(lr); }} />
      </View>
      <ResultsPanel results={results} layoutRect={layoutRect} showModal={showModal} setShowModal={setShowModal} />
      {/* BLUE — direct (no Modal) */}
      {miw && <DirectOverlay rect={miw} color="#60a5fa" />}
      {/* RED — inside Modal */}
      {showModal && miw && <ModalOverlay rect={miw} color="#f87171" onClose={() => setShowModal(false)} />}
    </View>
  );
}

function StageB() {
  const [results, setResults] = useState<MeasureResult[]>([]);
  const [layoutRect, setLayoutRect] = useState<Rect | null>(null);
  const [showModal, setShowModal] = useState(false);
  const miw = results.find(r => r.label === 'measureInWindow');

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0f172a' }} edges={['top']}>
      <View style={{ alignItems: 'center', paddingTop: 20 }}>
        <TargetBox onMeasure={(r, lr) => { setResults(r); setLayoutRect(lr); }} />
      </View>
      <ResultsPanel results={results} layoutRect={layoutRect} showModal={showModal} setShowModal={setShowModal} />
      {miw && <DirectOverlay rect={miw} color="#60a5fa" />}
      {showModal && miw && <ModalOverlay rect={miw} color="#f87171" onClose={() => setShowModal(false)} />}
    </SafeAreaView>
  );
}

function StageC() {
  const [results, setResults] = useState<MeasureResult[]>([]);
  const [layoutRect, setLayoutRect] = useState<Rect | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const miw = results.find(r => r.label === 'measureInWindow');

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0f172a' }} edges={['top']}>
      <Text style={styles.scrollInfo}>scrollY: {scrollY.toFixed(0)}</Text>
      <ScrollView
        style={{ flex: 1 }}
        onScroll={e => setScrollY(e.nativeEvent.contentOffset.y)}
        scrollEventThrottle={16}
      >
        <View style={styles.spacer}>
          <Text style={{ color: '#475569', fontSize: 11 }}>↓ Scroll 150 px, then press Measure</Text>
        </View>
        <TargetBox onMeasure={(r, lr) => { setResults(r); setLayoutRect(lr); }} />
        <View style={{ height: 400 }} />
      </ScrollView>
      <ResultsPanel results={results} layoutRect={layoutRect} showModal={showModal} setShowModal={setShowModal} />
      {miw && <DirectOverlay rect={miw} color="#60a5fa" />}
      {showModal && miw && <ModalOverlay rect={miw} color="#f87171" onClose={() => setShowModal(false)} />}
    </SafeAreaView>
  );
}

// ─── Root screen ──────────────────────────────────────────────────────────────

export default function DebugTourScreen() {
  const [stage, setStage] = useState<Stage>('A');

  return (
    <View style={{ flex: 1, backgroundColor: '#020617' }}>
      {/* Header + stage tabs */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Spotlight Debug</Text>
        <View style={styles.stageTabs}>
          {(['A', 'B', 'C'] as Stage[]).map(s => (
            <TouchableOpacity
              key={s}
              onPress={() => setStage(s)}
              style={[styles.stageTab, stage === s && styles.stageTabActive]}
            >
              <Text style={[styles.stageTabTxt, stage === s && styles.stageTabTxtActive]}>
                {s === 'A' ? 'A: Plain' : s === 'B' ? 'B: SafeArea' : 'C: Scroll'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        <Dot color="#4ade80" label="target view" />
        <Dot color="#f87171" label="miW → Modal" />
        <Dot color="#60a5fa" label="miW → Direct" />
      </View>

      {stage === 'A' && <StageA />}
      {stage === 'B' && <StageB />}
      {stage === 'C' && <StageC />}
    </View>
  );
}

function Dot({ color, label }: { color: string; label: string }) {
  return (
    <>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={styles.dotLabel}>{label}</Text>
    </>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const SB_TOP = Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) : 44;

const styles = StyleSheet.create({
  header: {
    paddingTop: SB_TOP + 4, paddingHorizontal: 12, paddingBottom: 8,
    backgroundColor: '#0f172a', gap: 8,
  },
  headerTitle: { color: '#f1f5f9', fontWeight: '800', fontSize: 14 },
  stageTabs: { flexDirection: 'row', gap: 6 },
  stageTab: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 6, backgroundColor: '#1e293b' },
  stageTabActive: { backgroundColor: '#16a34a' },
  stageTabTxt: { color: '#64748b', fontSize: 12, fontWeight: '600' },
  stageTabTxtActive: { color: '#fff' },

  legend: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingBottom: 6, backgroundColor: '#0f172a' },
  dot: { width: 10, height: 10, borderRadius: 5 },
  dotLabel: { color: '#64748b', fontSize: 10, marginRight: 8 },

  targetBox: {
    width: 160, height: 80, backgroundColor: '#14532d',
    borderWidth: 2, borderColor: '#4ade80', borderRadius: 8,
    alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  targetLabel: { color: '#4ade80', fontWeight: '700', fontSize: 12 },
  measureBtn: {
    backgroundColor: '#065f46', borderRadius: 6, paddingHorizontal: 12, paddingVertical: 6,
  },
  measureBtnTxt: { color: '#6ee7b7', fontSize: 11, fontWeight: '700' },

  panel: {
    margin: 12, padding: 12, backgroundColor: '#0f172a',
    borderRadius: 10, borderWidth: 1, borderColor: '#1e293b',
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 2 },
  rowLabel: { color: '#64748b', fontSize: 11, flex: 1 },
  rowValue: { color: '#d1d5db', fontSize: 11, fontFamily: 'monospace', flexShrink: 1, textAlign: 'right' },

  scrollInfo: {
    color: '#475569', fontSize: 11, paddingHorizontal: 12, paddingVertical: 4,
    backgroundColor: '#1e293b',
  },
  spacer: {
    height: 150, backgroundColor: '#1e293b', justifyContent: 'flex-end',
    alignItems: 'center', paddingBottom: 16,
  },
});
