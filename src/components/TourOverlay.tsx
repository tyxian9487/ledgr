import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useTour, TOUR_STEPS } from '../context/TourContext';

export default function TourOverlay() {
  const { tourActive, currentStep, tourStepIndex, nextStep, skipTour } = useTour();
  const location = useLocation();
  const [rect, setRect] = useState<DOMRect | null>(null);
  const rafRef = useRef<number>();

  const onCorrectPage = currentStep ? location.pathname === currentStep.page : false;

  useEffect(() => {
    if (!tourActive || !currentStep || !onCorrectPage) {
      setRect(null);
      return;
    }
    function update() {
      if (!currentStep) return;
      const el = document.querySelector(currentStep.selector);
      if (el) {
        setRect(el.getBoundingClientRect());
      } else {
        setRect(null);
      }
      rafRef.current = requestAnimationFrame(update);
    }
    rafRef.current = requestAnimationFrame(update);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [tourActive, currentStep, onCorrectPage]);

  if (!tourActive || !currentStep || !onCorrectPage) return null;

  const isLastStep = tourStepIndex === TOUR_STEPS.length - 1;
  const pad = 10;
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const tooltipW = Math.min(300, vw - 32);

  let tooltipTop: number;
  if (rect) {
    tooltipTop = currentStep.tooltipPos === 'top'
      ? Math.max(8, rect.top - 160)
      : Math.min(vh - 180, rect.bottom + 14);
  } else {
    tooltipTop = vh / 2 - 80;
  }
  const tooltipLeft = rect
    ? Math.max(16, Math.min(vw - tooltipW - 16, rect.left + rect.width / 2 - tooltipW / 2))
    : vw / 2 - tooltipW / 2;

  return (
    <>
      {/* Four-rect blurred overlay with spotlight hole */}
      {rect ? (
        <>
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, height: Math.max(0, rect.top - pad), background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(3px)', WebkitBackdropFilter: 'blur(3px)', zIndex: 9990, pointerEvents: 'all' }} onClick={skipTour} />
          <div style={{ position: 'fixed', top: rect.bottom + pad, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(3px)', WebkitBackdropFilter: 'blur(3px)', zIndex: 9990, pointerEvents: 'all' }} onClick={skipTour} />
          <div style={{ position: 'fixed', top: rect.top - pad, left: 0, width: Math.max(0, rect.left - pad), height: rect.height + pad * 2, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(3px)', WebkitBackdropFilter: 'blur(3px)', zIndex: 9990, pointerEvents: 'all' }} onClick={skipTour} />
          <div style={{ position: 'fixed', top: rect.top - pad, left: rect.right + pad, right: 0, height: rect.height + pad * 2, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(3px)', WebkitBackdropFilter: 'blur(3px)', zIndex: 9990, pointerEvents: 'all' }} onClick={skipTour} />
          <div style={{ position: 'fixed', top: rect.top - pad, left: rect.left - pad, width: rect.width + pad * 2, height: rect.height + pad * 2, borderRadius: 16, border: '2px solid rgba(255,255,255,0.5)', boxShadow: '0 0 0 1px rgba(255,255,255,0.15)', zIndex: 9991, pointerEvents: 'none' }} />
        </>
      ) : (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(3px)', WebkitBackdropFilter: 'blur(3px)', zIndex: 9990, pointerEvents: 'all' }} onClick={skipTour} />
      )}

      {/* Tooltip card */}
      <div
        style={{ position: 'fixed', zIndex: 9995, left: tooltipLeft, top: tooltipTop, width: tooltipW, pointerEvents: 'all' }}
        className="bg-white dark:bg-gray-900 rounded-2xl p-4 shadow-2xl border border-gray-100 dark:border-gray-700"
        onClick={e => e.stopPropagation()}
      >
        {/* Progress pills */}
        <div className="flex items-center gap-1 mb-3">
          {TOUR_STEPS.map((_, i) => (
            <div key={i} style={{ width: i === tourStepIndex ? 16 : 6, height: 6, borderRadius: 3, background: i === tourStepIndex ? '#16a34a' : i < tourStepIndex ? '#86efac' : '#e5e7eb', transition: 'all 0.3s' }} />
          ))}
        </div>
        <p className="text-sm font-bold dark:text-white mb-1">{currentStep.title}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed mb-3">{currentStep.body}</p>
        <div className="flex items-center justify-between gap-2">
          <button onClick={skipTour} className="text-xs text-gray-400 font-medium shrink-0">
            Skip tour
          </button>
          {currentStep.isGuide ? (
            <span className="text-[11px] text-green-600 dark:text-green-400 font-semibold">
              Tap the highlighted item ↑
            </span>
          ) : (
            <button
              onClick={nextStep}
              className="px-4 py-1.5 rounded-xl text-xs font-bold bg-green-600 text-white active:scale-95 transition-transform"
            >
              {isLastStep ? 'Finish 🎉' : 'Next →'}
            </button>
          )}
        </div>
      </div>
    </>
  );
}
