import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useLocation } from 'react-router-dom';
import { useTour, TOUR_STEPS } from '../context/TourContext';

const PAD = 10;

function rectsChanged(a: DOMRect | null, b: DOMRect | null): boolean {
  if (!a && !b) return false;
  if (!a || !b) return true;
  return (
    Math.abs(a.top - b.top) > 2 || Math.abs(a.left - b.left) > 2 ||
    Math.abs(a.width - b.width) > 2 || Math.abs(a.height - b.height) > 2
  );
}

export default function TourOverlay() {
  const { tourActive, currentStep, tourStepIndex, nextStep, skipTour } = useTour();
  const location = useLocation();
  const [rect, setRect] = useState<DOMRect | null>(null);
  const prevRectRef = useRef<DOMRect | null>(null);
  const rafRef = useRef<number>();

  const onCorrectPage = currentStep ? location.pathname === currentStep.page : false;

  useEffect(() => {
    if (!tourActive || !currentStep || !onCorrectPage) {
      prevRectRef.current = null;
      setRect(null);
      return;
    }
    function poll() {
      const el = document.querySelector(currentStep!.selector);
      const newRect = el ? el.getBoundingClientRect() : null;
      if (rectsChanged(prevRectRef.current, newRect)) {
        prevRectRef.current = newRect;
        setRect(newRect ? ({ ...newRect } as DOMRect) : null);
      }
      rafRef.current = requestAnimationFrame(poll);
    }
    rafRef.current = requestAnimationFrame(poll);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [tourActive, currentStep, onCorrectPage]);

  if (!tourActive || !currentStep || !onCorrectPage) return null;

  const step = currentStep;
  const isLastStep = tourStepIndex === TOUR_STEPS.length - 1;
  const vw = window.innerWidth;
  const cardW = Math.min(300, vw - 32);
  const cardLeft = Math.max(16, (vw - cardW) / 2);

  // ── Tooltip card ─────────────────────────────────────────────────────────────
  const card = (
    <div
      style={{ position: 'fixed', bottom: 24, left: cardLeft, width: cardW, zIndex: 99999, pointerEvents: 'all' }}
      onClick={e => e.stopPropagation()}
    >
      <div style={{ background: '#fff', borderRadius: 20, overflow: 'hidden', boxShadow: '0 -4px 24px rgba(0,0,0,0.22), 0 8px 32px rgba(0,0,0,0.15)', border: '1px solid rgba(0,0,0,0.07)' }}>
        <div style={{ height: 4, background: 'linear-gradient(90deg,#16a34a,#34d399)' }} />
        <div style={{ padding: '14px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 10, flexWrap: 'wrap' }}>
            {TOUR_STEPS.map((_, i) => (
              <div key={i} style={{ flexShrink: 0, height: 5, borderRadius: 3, width: i === tourStepIndex ? 14 : 5, background: i === tourStepIndex ? '#16a34a' : i < tourStepIndex ? '#86efac' : '#e5e7eb', transition: 'width 0.25s' }} />
            ))}
            <span style={{ fontSize: 10, color: '#9ca3af', marginLeft: 'auto', fontWeight: 600 }}>{tourStepIndex + 1} / {TOUR_STEPS.length}</span>
          </div>
          <p style={{ margin: '0 0 4px', fontSize: 14, fontWeight: 700, color: '#111827', lineHeight: 1.35 }}>{step.title}</p>
          <p style={{ margin: '0 0 14px', fontSize: 12, color: '#6b7280', lineHeight: 1.6 }}>{step.body}</p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
            <button onClick={skipTour} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: '#9ca3af', fontWeight: 500, padding: '4px 0' }}>
              Skip tour
            </button>
            {step.isGuide ? (
              <span style={{ fontSize: 11, color: '#16a34a', fontWeight: 700 }}>Tap the highlighted item →</span>
            ) : (
              <button onClick={nextStep} style={{ background: '#16a34a', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700, padding: '8px 20px', borderRadius: 12, boxShadow: '0 2px 8px rgba(22,163,74,0.35)' }}>
                {isLastStep ? 'Finish 🎉' : 'Next →'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  // ── Spotlight overlay ─────────────────────────────────────────────────────────
  // Uses CSS compositing: isolation:isolate creates a group, then
  // mix-blend-mode:destination-out on the spotlight div mathematically
  // erases the dark overlay in exactly that region → genuine transparent hole.
  if (rect) {
    const sx = rect.left - PAD;
    const sy = rect.top - PAD;
    const sw = rect.width + PAD * 2;
    const sh = rect.height + PAD * 2;

    return createPortal(
      <>
        {/* ── Compositing group: dark overlay with transparent spotlight hole ── */}
        <div style={{ position: 'fixed', inset: 0, zIndex: 99990, isolation: 'isolate', pointerEvents: 'none' }}>
          {/* Dark overlay — fills entire viewport */}
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.72)' }} />
          {/* destination-out erases the overlay wherever this div sits */}
          <div style={{
            position: 'absolute',
            top: sy, left: sx, width: sw, height: sh,
            borderRadius: 18,
            background: 'black',
            mixBlendMode: 'destination-out' as React.CSSProperties['mixBlendMode'],
          }} />
        </div>

        {/* ── White ring around spotlight (outside compositing group) ── */}
        <div style={{
          position: 'fixed', zIndex: 99991, pointerEvents: 'none',
          top: sy - 1, left: sx - 1, width: sw + 2, height: sh + 2,
          borderRadius: 19, border: '2px solid rgba(255,255,255,0.7)',
          boxShadow: '0 0 0 1px rgba(255,255,255,0.15)',
        }} />

        {/* ── Click-to-dismiss for the four dark quadrants ── */}
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, height: Math.max(0, sy), zIndex: 99992 }} onClick={skipTour} />
        <div style={{ position: 'fixed', top: sy + sh, left: 0, right: 0, bottom: 0, zIndex: 99992 }} onClick={skipTour} />
        <div style={{ position: 'fixed', top: sy, left: 0, width: Math.max(0, sx), height: sh, zIndex: 99992 }} onClick={skipTour} />
        <div style={{ position: 'fixed', top: sy, left: sx + sw, right: 0, height: sh, zIndex: 99992 }} onClick={skipTour} />

        {card}
      </>,
      document.body
    );
  }

  // ── Fallback: element not in DOM yet ────────────────────────────────────────
  return createPortal(
    <>
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.72)', zIndex: 99990 }} onClick={skipTour} />
      {card}
    </>,
    document.body
  );
}
