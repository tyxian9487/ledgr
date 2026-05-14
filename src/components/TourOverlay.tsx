import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useTour, TOUR_STEPS } from '../context/TourContext';

const PAD = 12;          // padding around spotlight hole
const TOOLTIP_GAP = 14;  // gap between spotlight and tooltip card
const TOOLTIP_H = 172;   // estimated tooltip height for space calculation

function rectsChanged(a: DOMRect | null, b: DOMRect | null): boolean {
  if (!a && !b) return false;
  if (!a || !b) return true;
  return Math.abs(a.top - b.top) > 2 || Math.abs(a.left - b.left) > 2 ||
         Math.abs(a.width - b.width) > 2 || Math.abs(a.height - b.height) > 2;
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
        setRect(newRect ? { ...newRect } as DOMRect : null);
      }
      rafRef.current = requestAnimationFrame(poll);
    }
    rafRef.current = requestAnimationFrame(poll);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [tourActive, currentStep, onCorrectPage]);

  if (!tourActive || !currentStep || !onCorrectPage) return null;

  const isLastStep = tourStepIndex === TOUR_STEPS.length - 1;
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const tooltipW = Math.min(296, vw - 32);

  // Determine tooltip placement based on available blank space
  let placeBelow = true;
  let tooltipTop = 0;
  let arrowSide: 'top' | 'bottom' | null = null;
  let arrowLeft = tooltipW / 2 - 8;

  if (rect) {
    const spaceAbove = rect.top - PAD - TOOLTIP_GAP;
    const spaceBelow = vh - rect.bottom - PAD - TOOLTIP_GAP;
    placeBelow = spaceBelow >= TOOLTIP_H || spaceBelow >= spaceAbove;

    const spotlightCx = rect.left + rect.width / 2;
    const tooltipLeft = Math.max(16, Math.min(vw - tooltipW - 16, spotlightCx - tooltipW / 2));

    if (placeBelow) {
      tooltipTop = rect.bottom + PAD + TOOLTIP_GAP;
      arrowSide = 'top';
    } else {
      tooltipTop = Math.max(8, rect.top - PAD - TOOLTIP_GAP - TOOLTIP_H);
      arrowSide = 'bottom';
    }

    // Arrow horizontal position relative to tooltip card
    arrowLeft = Math.max(20, Math.min(tooltipW - 36, spotlightCx - tooltipLeft - 8));
    tooltipTop = Math.max(8, Math.min(vh - TOOLTIP_H - 8, tooltipTop));

    return (
      <>
        {/* Four-rect blurred overlay creating a clear spotlight hole */}
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, height: Math.max(0, rect.top - PAD), background: 'rgba(0,0,0,0.62)', backdropFilter: 'blur(3px)', WebkitBackdropFilter: 'blur(3px)', zIndex: 9990 }} onClick={skipTour} />
        <div style={{ position: 'fixed', top: rect.bottom + PAD, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.62)', backdropFilter: 'blur(3px)', WebkitBackdropFilter: 'blur(3px)', zIndex: 9990 }} onClick={skipTour} />
        <div style={{ position: 'fixed', top: rect.top - PAD, left: 0, width: Math.max(0, rect.left - PAD), height: rect.height + PAD * 2, background: 'rgba(0,0,0,0.62)', backdropFilter: 'blur(3px)', WebkitBackdropFilter: 'blur(3px)', zIndex: 9990 }} onClick={skipTour} />
        <div style={{ position: 'fixed', top: rect.top - PAD, left: rect.right + PAD, right: 0, height: rect.height + PAD * 2, background: 'rgba(0,0,0,0.62)', backdropFilter: 'blur(3px)', WebkitBackdropFilter: 'blur(3px)', zIndex: 9990 }} onClick={skipTour} />
        {/* Spotlight border glow */}
        <div style={{ position: 'fixed', top: rect.top - PAD, left: rect.left - PAD, width: rect.width + PAD * 2, height: rect.height + PAD * 2, borderRadius: 18, border: '2px solid rgba(255,255,255,0.55)', boxShadow: '0 0 0 1px rgba(255,255,255,0.12), inset 0 0 0 1px rgba(255,255,255,0.08)', zIndex: 9991, pointerEvents: 'none' }} />

        {/* Tooltip card — positioned in blank space away from spotlight */}
        <div
          style={{
            position: 'fixed',
            zIndex: 9995,
            top: tooltipTop,
            left: Math.max(16, Math.min(vw - tooltipW - 16, (rect.left + rect.width / 2) - tooltipW / 2)),
            width: tooltipW,
            pointerEvents: 'all',
          }}
          onClick={e => e.stopPropagation()}
        >
          {/* Arrow pointing toward spotlight */}
          {arrowSide === 'top' && (
            <div style={{ position: 'relative', height: 10, marginBottom: -1 }}>
              <div style={{
                position: 'absolute', left: arrowLeft, top: 2,
                width: 0, height: 0,
                borderLeft: '8px solid transparent',
                borderRight: '8px solid transparent',
                borderBottom: '10px solid white',
                filter: 'drop-shadow(0 -1px 1px rgba(0,0,0,0.08))',
              }} />
            </div>
          )}

          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
            {/* Green accent bar */}
            <div className="h-1 w-full bg-gradient-to-r from-green-500 to-emerald-400" />
            <div className="p-4">
              {/* Progress pills */}
              <div className="flex items-center gap-1 mb-3 flex-wrap">
                {TOUR_STEPS.map((_, i) => (
                  <div key={i} style={{ width: i === tourStepIndex ? 14 : 5, height: 5, borderRadius: 3, background: i === tourStepIndex ? '#16a34a' : i < tourStepIndex ? '#86efac' : '#e5e7eb', transition: 'all 0.3s', flexShrink: 0 }} />
                ))}
                <span className="text-[10px] text-gray-400 ml-auto font-medium">{tourStepIndex + 1}/{TOUR_STEPS.length}</span>
              </div>
              <p className="text-sm font-bold dark:text-white mb-1">{currentStep.title}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed mb-3">{currentStep.body}</p>
              <div className="flex items-center justify-between gap-2">
                <button onClick={skipTour} className="text-xs text-gray-400 font-medium shrink-0 py-1">
                  Skip tour
                </button>
                {currentStep.isGuide ? (
                  <span className="text-[11px] text-green-600 dark:text-green-400 font-semibold">
                    Tap the highlighted item →
                  </span>
                ) : (
                  <button
                    onClick={nextStep}
                    className="px-4 py-1.5 rounded-xl text-xs font-bold bg-green-600 text-white active:scale-95 transition-transform shadow-sm shadow-green-600/30"
                  >
                    {isLastStep ? 'Finish 🎉' : 'Next →'}
                  </button>
                )}
              </div>
            </div>
          </div>

          {arrowSide === 'bottom' && (
            <div style={{ position: 'relative', height: 10, marginTop: -1 }}>
              <div style={{
                position: 'absolute', left: arrowLeft, bottom: 2,
                width: 0, height: 0,
                borderLeft: '8px solid transparent',
                borderRight: '8px solid transparent',
                borderTop: '10px solid white',
                filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.08))',
              }} />
            </div>
          )}
        </div>
      </>
    );
  }

  // No element found — centered card
  return (
    <>
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.62)', backdropFilter: 'blur(3px)', WebkitBackdropFilter: 'blur(3px)', zIndex: 9990 }} onClick={skipTour} />
      <div
        style={{ position: 'fixed', zIndex: 9995, top: vh / 2 - TOOLTIP_H / 2, left: vw / 2 - tooltipW / 2, width: tooltipW, pointerEvents: 'all' }}
        className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="h-1 w-full bg-gradient-to-r from-green-500 to-emerald-400" />
        <div className="p-4">
          <div className="flex items-center gap-1 mb-3">
            {TOUR_STEPS.map((_, i) => (
              <div key={i} style={{ width: i === tourStepIndex ? 14 : 5, height: 5, borderRadius: 3, background: i === tourStepIndex ? '#16a34a' : i < tourStepIndex ? '#86efac' : '#e5e7eb', transition: 'all 0.3s', flexShrink: 0 }} />
            ))}
            <span className="text-[10px] text-gray-400 ml-auto font-medium">{tourStepIndex + 1}/{TOUR_STEPS.length}</span>
          </div>
          <p className="text-sm font-bold dark:text-white mb-1">{currentStep.title}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed mb-3">{currentStep.body}</p>
          <div className="flex items-center justify-between gap-2">
            <button onClick={skipTour} className="text-xs text-gray-400 font-medium shrink-0">Skip tour</button>
            {currentStep.isGuide ? (
              <span className="text-[11px] text-green-600 font-semibold">Tap the highlighted item →</span>
            ) : (
              <button onClick={nextStep} className="px-4 py-1.5 rounded-xl text-xs font-bold bg-green-600 text-white active:scale-95 transition-transform">
                {isLastStep ? 'Finish 🎉' : 'Next →'}
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
