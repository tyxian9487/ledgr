import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useLocation } from 'react-router-dom';
import { useTour, TOUR_STEPS, TourStep } from '../context/TourContext';

const PAD = 12;
const TOOLTIP_GAP = 16;
const TOOLTIP_H = 185;

interface CardProps {
  step: TourStep;
  tourStepIndex: number;
  isLastStep: boolean;
  onNext: () => void;
  onSkip: () => void;
}

function TourCard({ step, tourStepIndex, isLastStep, onNext, onSkip }: CardProps) {
  return (
    <div
      style={{
        background: '#ffffff',
        borderRadius: 20,
        boxShadow: '0 12px 48px rgba(0,0,0,0.5)',
        border: '1px solid rgba(0,0,0,0.06)',
        overflow: 'hidden',
      }}
      onClick={e => e.stopPropagation()}
    >
      <div style={{ height: 4, background: 'linear-gradient(90deg, #16a34a, #34d399)' }} />
      <div style={{ padding: '14px 16px' }}>
        {/* Progress pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 10, flexWrap: 'wrap' }}>
          {TOUR_STEPS.map((_, i) => (
            <div
              key={i}
              style={{
                width: i === tourStepIndex ? 14 : 5,
                height: 5,
                borderRadius: 3,
                flexShrink: 0,
                background: i === tourStepIndex ? '#16a34a' : i < tourStepIndex ? '#86efac' : '#e5e7eb',
                transition: 'all 0.3s',
              }}
            />
          ))}
          <span style={{ fontSize: 10, color: '#9ca3af', marginLeft: 'auto', fontWeight: 500 }}>
            {tourStepIndex + 1}/{TOUR_STEPS.length}
          </span>
        </div>
        <p style={{ fontSize: 14, fontWeight: 700, color: '#111827', margin: '0 0 4px' }}>
          {step.title}
        </p>
        <p style={{ fontSize: 12, color: '#6b7280', lineHeight: 1.55, margin: '0 0 12px' }}>
          {step.body}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <button
            onClick={onSkip}
            style={{ fontSize: 12, color: '#9ca3af', fontWeight: 500, background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0' }}
          >
            Skip tour
          </button>
          {step.isGuide ? (
            <span style={{ fontSize: 11, color: '#16a34a', fontWeight: 600 }}>
              Tap the highlighted item →
            </span>
          ) : (
            <button
              onClick={onNext}
              style={{
                padding: '7px 18px',
                borderRadius: 12,
                fontSize: 12,
                fontWeight: 700,
                background: '#16a34a',
                color: '#fff',
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(22,163,74,0.3)',
              }}
            >
              {isLastStep ? 'Finish 🎉' : 'Next →'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

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
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [tourActive, currentStep, onCorrectPage]);

  if (!tourActive || !currentStep || !onCorrectPage) return null;

  const step = currentStep;
  const isLastStep = tourStepIndex === TOUR_STEPS.length - 1;
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const tooltipW = Math.min(300, vw - 32);

  const DIM: React.CSSProperties = {
    position: 'fixed',
    background: 'rgba(0,0,0,0.65)',
    backdropFilter: 'blur(3px)',
    WebkitBackdropFilter: 'blur(3px)',
    zIndex: 99990,
  };

  if (rect) {
    const spaceAbove = rect.top - PAD - TOOLTIP_GAP;
    const spaceBelow = vh - rect.bottom - PAD - TOOLTIP_GAP;
    const placeBelow = spaceBelow >= TOOLTIP_H || spaceBelow >= spaceAbove;

    const spotlightCx = rect.left + rect.width / 2;
    const cardLeft = Math.max(16, Math.min(vw - tooltipW - 16, spotlightCx - tooltipW / 2));

    let cardTop: number;
    let arrowSide: 'top' | 'bottom';
    if (placeBelow) {
      cardTop = rect.bottom + PAD + TOOLTIP_GAP;
      arrowSide = 'top';
    } else {
      cardTop = rect.top - PAD - TOOLTIP_GAP - TOOLTIP_H;
      arrowSide = 'bottom';
    }
    cardTop = Math.max(8, Math.min(vh - TOOLTIP_H - 8, cardTop));

    const arrowLeft = Math.max(20, Math.min(tooltipW - 36, spotlightCx - cardLeft - 8));

    return createPortal(
      <>
        {/* Four-rect dimmed spotlight */}
        <div style={{ ...DIM, top: 0, left: 0, right: 0, height: Math.max(0, rect.top - PAD) }} onClick={skipTour} />
        <div style={{ ...DIM, top: rect.bottom + PAD, left: 0, right: 0, bottom: 0 }} onClick={skipTour} />
        <div style={{ ...DIM, top: rect.top - PAD, left: 0, width: Math.max(0, rect.left - PAD), height: rect.height + PAD * 2 }} onClick={skipTour} />
        <div style={{ ...DIM, top: rect.top - PAD, left: rect.right + PAD, right: 0, height: rect.height + PAD * 2 }} onClick={skipTour} />

        {/* Spotlight ring */}
        <div style={{
          position: 'fixed', zIndex: 99991, pointerEvents: 'none',
          top: rect.top - PAD, left: rect.left - PAD,
          width: rect.width + PAD * 2, height: rect.height + PAD * 2,
          borderRadius: 18, border: '2px solid rgba(255,255,255,0.65)',
          boxShadow: '0 0 0 1px rgba(255,255,255,0.18)',
        }} />

        {/* Arrow toward spotlight */}
        {arrowSide === 'top' && (
          <div style={{
            position: 'fixed', zIndex: 99997, pointerEvents: 'none',
            top: cardTop - 9, left: cardLeft + arrowLeft,
            width: 0, height: 0,
            borderLeft: '8px solid transparent', borderRight: '8px solid transparent',
            borderBottom: '10px solid #ffffff',
            filter: 'drop-shadow(0 -1px 2px rgba(0,0,0,0.15))',
          }} />
        )}

        {/* Tooltip card */}
        <div style={{ position: 'fixed', zIndex: 99995, top: cardTop, left: cardLeft, width: tooltipW }}>
          <TourCard step={step} tourStepIndex={tourStepIndex} isLastStep={isLastStep} onNext={nextStep} onSkip={skipTour} />
        </div>

        {arrowSide === 'bottom' && (
          <div style={{
            position: 'fixed', zIndex: 99997, pointerEvents: 'none',
            top: cardTop + TOOLTIP_H, left: cardLeft + arrowLeft,
            width: 0, height: 0,
            borderLeft: '8px solid transparent', borderRight: '8px solid transparent',
            borderTop: '10px solid #ffffff',
            filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.15))',
          }} />
        )}
      </>,
      document.body
    );
  }

  // Fallback: element not in DOM yet — centered card
  return createPortal(
    <>
      <div style={{ ...DIM, position: 'fixed', inset: 0 }} onClick={skipTour} />
      <div style={{
        position: 'fixed', zIndex: 99995,
        top: Math.max(80, vh / 2 - TOOLTIP_H / 2),
        left: Math.max(16, vw / 2 - tooltipW / 2),
        width: tooltipW,
      }}>
        <TourCard step={step} tourStepIndex={tourStepIndex} isLastStep={isLastStep} onNext={nextStep} onSkip={skipTour} />
      </div>
    </>,
    document.body
  );
}
