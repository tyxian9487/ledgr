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
  const vh = window.innerHeight;
  const cardW = Math.min(300, vw - 32);

  // ── Card always anchored at bottom so it's never occluded ──────────────────
  const CARD_BOTTOM_OFFSET = 24; // px from bottom of viewport
  const cardLeft = Math.max(16, (vw - cardW) / 2);

  // ── SVG overlay: single element with a mask-based spotlight hole ────────────
  // This avoids the backdrop-filter stacking-context issue on mobile Chrome
  // that made sibling fixed elements invisible even at higher z-index.
  const overlayEl = rect ? (
    <svg
      style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', display: 'block' }}
      onClick={skipTour}
    >
      <defs>
        <mask id="ledgr-tour-mask">
          {/* White = show overlay; black rect = transparent hole */}
          <rect x="0" y="0" width={vw} height={vh} fill="white" />
          <rect
            x={rect.left - PAD} y={rect.top - PAD}
            width={rect.width + PAD * 2} height={rect.height + PAD * 2}
            rx={16} fill="black"
          />
        </mask>
      </defs>
      {/* Dark overlay with spotlight hole */}
      <rect x="0" y="0" width={vw} height={vh} fill="rgba(0,0,0,0.72)" mask="url(#ledgr-tour-mask)" />
      {/* Spotlight border ring */}
      <rect
        x={rect.left - PAD} y={rect.top - PAD}
        width={rect.width + PAD * 2} height={rect.height + PAD * 2}
        rx={16} fill="none"
        stroke="rgba(255,255,255,0.65)" strokeWidth={2}
        style={{ pointerEvents: 'none' }}
      />
    </svg>
  ) : (
    <svg
      style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', display: 'block' }}
      onClick={skipTour}
    >
      <rect x="0" y="0" width={vw} height={vh} fill="rgba(0,0,0,0.72)" />
    </svg>
  );

  // ── Tooltip card ────────────────────────────────────────────────────────────
  const cardEl = (
    <div
      style={{
        position: 'fixed',
        bottom: CARD_BOTTOM_OFFSET,
        left: cardLeft,
        width: cardW,
        zIndex: 99999,
        pointerEvents: 'all',
      }}
      onClick={e => e.stopPropagation()}
    >
      <div style={{
        background: '#fff',
        borderRadius: 20,
        overflow: 'hidden',
        boxShadow: '0 -4px 32px rgba(0,0,0,0.35), 0 8px 32px rgba(0,0,0,0.25)',
        border: '1px solid rgba(0,0,0,0.06)',
      }}>
        {/* Green accent stripe */}
        <div style={{ height: 4, background: 'linear-gradient(90deg,#16a34a,#34d399)' }} />

        <div style={{ padding: '14px 16px' }}>
          {/* Progress pills + counter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 10, flexWrap: 'wrap' }}>
            {TOUR_STEPS.map((_, i) => (
              <div key={i} style={{
                flexShrink: 0, height: 5, borderRadius: 3,
                width: i === tourStepIndex ? 14 : 5,
                background: i === tourStepIndex ? '#16a34a' : i < tourStepIndex ? '#86efac' : '#e5e7eb',
                transition: 'width 0.25s',
              }} />
            ))}
            <span style={{ fontSize: 10, color: '#9ca3af', marginLeft: 'auto', fontWeight: 600 }}>
              {tourStepIndex + 1} / {TOUR_STEPS.length}
            </span>
          </div>

          <p style={{ margin: '0 0 4px', fontSize: 14, fontWeight: 700, color: '#111827', lineHeight: 1.35 }}>
            {step.title}
          </p>
          <p style={{ margin: '0 0 14px', fontSize: 12, color: '#6b7280', lineHeight: 1.6 }}>
            {step.body}
          </p>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
            <button
              onClick={skipTour}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: '#9ca3af', fontWeight: 500, padding: '4px 0' }}
            >
              Skip tour
            </button>
            {step.isGuide ? (
              <span style={{ fontSize: 11, color: '#16a34a', fontWeight: 700 }}>
                Tap the highlighted item →
              </span>
            ) : (
              <button
                onClick={nextStep}
                style={{
                  background: '#16a34a', color: '#fff', border: 'none', cursor: 'pointer',
                  fontSize: 13, fontWeight: 700, padding: '8px 20px',
                  borderRadius: 12, boxShadow: '0 2px 8px rgba(22,163,74,0.35)',
                }}
              >
                {isLastStep ? 'Finish 🎉' : 'Next →'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(
    <>
      {/* z-index 99990: SVG overlay (single element, no stacking-context conflicts) */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 99990 }}>
        {overlayEl}
      </div>
      {/* z-index 99999: tooltip card — separate layer, always on top */}
      {cardEl}
    </>,
    document.body
  );
}
