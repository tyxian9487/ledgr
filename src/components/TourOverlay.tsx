import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useLocation } from 'react-router-dom';
import { useTour, TOUR_STEPS } from '../context/TourContext';

const PAD = 10;
const RADIUS = 16;
const OVL = 'rgba(0,0,0,0.72)';
const RING = '2px solid rgba(255,255,255,0.75)';

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
        setRect(newRect ? { top: newRect.top, left: newRect.left, width: newRect.width, height: newRect.height, right: newRect.right, bottom: newRect.bottom, x: newRect.x, y: newRect.y, toJSON: newRect.toJSON.bind(newRect) } as DOMRect : null);
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
  const cardLeft = Math.max(16, (vw - cardW) / 2);

  // If spotlight is in the bottom 45% of the screen, float the card near the top
  // so it doesn't cover bottom nav or the highlighted element.
  const cardAtTop = rect ? rect.top > vh * 0.55 : false;
  const cardPos = cardAtTop
    ? { top: 80, bottom: 'auto' as const }
    : { bottom: 24, top: 'auto' as const };

  // Spotlight geometry
  const sl = rect ? rect.left - PAD : 0;
  const st = rect ? rect.top - PAD : 0;
  const sr = rect ? rect.right + PAD : vw;
  const sb = rect ? rect.bottom + PAD : vh;
  const sw = sr - sl;
  const sh = sb - st;

  const overlay = (
    <>
      {/* Four dark panels surrounding the spotlight — no canvas, no blend modes */}
      {rect ? (
        <>
          {/* top strip */}
          <div onClick={skipTour} style={{ position: 'fixed', top: 0, left: 0, right: 0, height: Math.max(0, st), background: OVL, zIndex: 99990 }} />
          {/* bottom strip */}
          <div onClick={skipTour} style={{ position: 'fixed', top: Math.max(0, sb), left: 0, right: 0, bottom: 0, background: OVL, zIndex: 99990 }} />
          {/* left strip */}
          <div onClick={skipTour} style={{ position: 'fixed', top: st, left: 0, width: Math.max(0, sl), height: sh, background: OVL, zIndex: 99990 }} />
          {/* right strip */}
          <div onClick={skipTour} style={{ position: 'fixed', top: st, left: sr, right: 0, height: sh, background: OVL, zIndex: 99990 }} />
          {/* white highlight ring — pointer events off so the element inside is tappable */}
          <div style={{ position: 'fixed', top: st, left: sl, width: sw, height: sh, border: RING, borderRadius: RADIUS, zIndex: 99991, pointerEvents: 'none' }} />
        </>
      ) : (
        /* no element found yet — full dark overlay */
        <div onClick={skipTour} style={{ position: 'fixed', inset: 0, background: OVL, zIndex: 99990 }} />
      )}

      {/* Tour card — floats top or bottom depending on where the spotlight is */}
      <div
        style={{ position: 'fixed', ...cardPos, left: cardLeft, width: cardW, zIndex: 99999, pointerEvents: 'all' }}
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
    </>
  );

  return createPortal(overlay, document.body);
}
