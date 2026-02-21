import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { tourSteps, type TourStep } from './tourSteps';
import { Button } from '@/components/ui/button';
import {
  ArrowRight,
  ArrowLeft,
  X,
  CheckCircle2,
  SkipForward,
} from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * OnboardingTour — comprehensive interactive platform walkthrough.
 *
 * Renders a spotlight overlay + tooltip that walks the user through
 * key platform features across 12 steps. Steps that target a DOM
 * element (via `data-tour` attributes) get a spotlight highlight;
 * steps without a target show a centered info card.
 *
 * Lifecycle:
 *   - Auto-starts for authenticated users who haven't completed onboarding
 *   - "Maybe Later" / X = defer (shows again next page load)
 *   - "Skip Tour" = mark complete (won't show again unless replayed)
 *   - Finishing all steps = mark complete
 *   - "Replay Tour" from Profile resets and restarts
 */
export function OnboardingTour() {
  const { user, onboardingCompleted, completeOnboarding } = useAuth();
  const location = useLocation();

  // ── State ────────────────────────────────────────────────
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [transitioning, setTransitioning] = useState(false);
  const [deferred, setDeferred] = useState(
    () =>
      typeof window !== 'undefined' &&
      sessionStorage.getItem('thynk_tour_deferred') === 'true'
  );

  // ── Refs ─────────────────────────────────────────────────
  const tooltipRef = useRef<HTMLDivElement>(null);
  const prevOnboardingRef = useRef(onboardingCompleted);
  const handlersRef = useRef({
    next: () => {},
    prev: () => {},
    defer: () => {},
  });

  // ── Derived ──────────────────────────────────────────────
  const step = tourSteps[currentStep] as TourStep;
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === tourSteps.length - 1;
  const hasTarget = !!step.target && !!targetRect;
  const isCentered = !hasTarget;

  // ── Auto-start for new users ────────────────────────────
  useEffect(() => {
    if (user && !onboardingCompleted && !isActive && !deferred) {
      const timer = setTimeout(() => {
        setIsActive(true);
        setCurrentStep(0);
        requestAnimationFrame(() => setIsVisible(true));
      }, 1000);
      return () => clearTimeout(timer);
    }
    return undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, onboardingCompleted, deferred]);

  // ── Detect onboarding reset (replay from Profile) ──────
  useEffect(() => {
    if (prevOnboardingRef.current === true && onboardingCompleted === false) {
      setDeferred(false);
      sessionStorage.removeItem('thynk_tour_deferred');
      setIsActive(true);
      setCurrentStep(0);
      requestAnimationFrame(() => setIsVisible(true));
    }
    prevOnboardingRef.current = onboardingCompleted;
  }, [onboardingCompleted]);

  // ── Find and track target element ──────────────────────
  useEffect(() => {
    if (!isActive || !step.target) {
      setTargetRect(null);
      return;
    }

    let scrollTimer: ReturnType<typeof setTimeout>;
    let retryTimer: ReturnType<typeof setTimeout>;
    let retryCount = 0;
    let cancelled = false;

    const findElement = () => {
      if (cancelled) return;
      const el = document.querySelector(step.target!) as HTMLElement;
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        scrollTimer = setTimeout(() => {
          if (cancelled) return;
          setTargetRect(el.getBoundingClientRect());
        }, 450);
      } else if (retryCount < 8) {
        retryCount++;
        retryTimer = setTimeout(findElement, 300);
      } else {
        setTargetRect(null); // fallback to centered card
      }
    };

    findElement();

    // Keep rect up-to-date on scroll / resize
    const handleUpdate = () => {
      if (cancelled) return;
      const el = document.querySelector(step.target!) as HTMLElement;
      if (el) setTargetRect(el.getBoundingClientRect());
    };

    window.addEventListener('scroll', handleUpdate, true);
    window.addEventListener('resize', handleUpdate);

    return () => {
      cancelled = true;
      clearTimeout(scrollTimer);
      clearTimeout(retryTimer);
      window.removeEventListener('scroll', handleUpdate, true);
      window.removeEventListener('resize', handleUpdate);
    };
  }, [isActive, currentStep, step.target, location.pathname]);

  // ── Elevate & highlight target element ─────────────────
  useEffect(() => {
    if (!isActive || !step.target || !targetRect) return;

    const el = document.querySelector(step.target) as HTMLElement;
    if (!el) return;

    // Save originals
    const orig = {
      zIndex: el.style.zIndex,
      position: el.style.position,
      boxShadow: el.style.boxShadow,
      borderRadius: el.style.borderRadius,
      transition: el.style.transition,
    };

    // Elevate above overlay
    el.style.zIndex = '10000';
    if (getComputedStyle(el).position === 'static') {
      el.style.position = 'relative';
    }
    el.style.boxShadow =
      '0 0 0 4px rgba(99, 102, 241, 0.5), 0 0 24px rgba(99, 102, 241, 0.15)';
    el.style.borderRadius = '12px';
    el.style.transition =
      'box-shadow 0.3s ease, border-radius 0.3s ease';

    return () => {
      el.style.zIndex = orig.zIndex;
      el.style.position = orig.position;
      el.style.boxShadow = orig.boxShadow;
      el.style.borderRadius = orig.borderRadius;
      el.style.transition = orig.transition;
    };
  }, [isActive, currentStep, step.target, targetRect]);

  // ── Keyboard navigation ────────────────────────────────
  useEffect(() => {
    if (!isActive) return;

    const handler = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          handlersRef.current.defer();
          break;
        case 'ArrowRight':
        case 'Enter':
          e.preventDefault();
          handlersRef.current.next();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          handlersRef.current.prev();
          break;
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isActive]);

  // ── Handlers ───────────────────────────────────────────
  const goToStep = (next: number) => {
    setTransitioning(true);
    setTimeout(() => {
      setCurrentStep(next);
      setTransitioning(false);
    }, 150);
  };

  const handleNext = () => {
    if (currentStep === tourSteps.length - 1) {
      handleComplete();
    } else {
      goToStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      goToStep(currentStep - 1);
    }
  };

  const handleDefer = () => {
    setIsVisible(false);
    setTimeout(() => {
      setIsActive(false);
      setCurrentStep(0);
      setTargetRect(null);
      setDeferred(true);
      sessionStorage.setItem('thynk_tour_deferred', 'true');
    }, 300);
  };

  const handleSkip = async () => {
    setIsVisible(false);
    setTimeout(async () => {
      setIsActive(false);
      setCurrentStep(0);
      setTargetRect(null);
      await completeOnboarding();
    }, 300);
  };

  const handleComplete = async () => {
    setIsVisible(false);
    setTimeout(async () => {
      setIsActive(false);
      setCurrentStep(0);
      setTargetRect(null);
      await completeOnboarding();
    }, 300);
  };

  // Keep refs fresh for keyboard handler
  handlersRef.current = {
    next: handleNext,
    prev: handlePrev,
    defer: handleDefer,
  };

  // ── Tooltip positioning ────────────────────────────────
  const getTooltipStyle = (): React.CSSProperties => {
    if (isCentered || !targetRect) return {};

    const gap = 16;
    const tooltipWidth = 400;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const pad = 16;
    const style: React.CSSProperties = { width: tooltipWidth };

    switch (step.position) {
      case 'bottom':
        style.top = Math.min(
          targetRect.bottom + gap,
          vh - 320
        );
        style.left = Math.max(
          pad,
          Math.min(
            targetRect.left + targetRect.width / 2 - tooltipWidth / 2,
            vw - tooltipWidth - pad
          )
        );
        break;
      case 'top':
        style.bottom = vh - targetRect.top + gap;
        style.left = Math.max(
          pad,
          Math.min(
            targetRect.left + targetRect.width / 2 - tooltipWidth / 2,
            vw - tooltipWidth - pad
          )
        );
        break;
      case 'left':
        style.top = Math.max(
          pad,
          targetRect.top + targetRect.height / 2 - 160
        );
        style.right = vw - targetRect.left + gap;
        break;
      case 'right':
        style.top = Math.max(
          pad,
          targetRect.top + targetRect.height / 2 - 160
        );
        style.left = Math.min(
          targetRect.right + gap,
          vw - tooltipWidth - pad
        );
        break;
      default:
        break;
    }

    return style;
  };

  // ── Early return ───────────────────────────────────────
  if (!isActive) return null;

  const StepIcon = step.icon;

  return (
    <>
      {/* ─── Click blocker (invisible) ─── */}
      <div
        className={cn(
          'fixed inset-0 z-[9998] transition-opacity duration-300',
          isVisible ? 'opacity-100' : 'opacity-0',
          isCentered ? 'bg-black/60 backdrop-blur-sm' : ''
        )}
        onClick={handleDefer}
        aria-hidden="true"
      />

      {/* ─── Spotlight overlay (targeting an element) ─── */}
      {!isCentered && targetRect && (
        <div
          className={cn(
            'fixed rounded-xl pointer-events-none z-[9999] transition-all duration-300',
            isVisible ? 'opacity-100' : 'opacity-0'
          )}
          style={{
            top: targetRect.top - 8,
            left: targetRect.left - 8,
            width: targetRect.width + 16,
            height: targetRect.height + 16,
            boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.6)',
          }}
          aria-hidden="true"
        />
      )}

      {/* ─── Pulsing ring around target ─── */}
      {!isCentered && targetRect && (
        <div
          className="fixed rounded-xl z-[10000] pointer-events-none transition-all duration-300"
          style={{
            top: targetRect.top - 12,
            left: targetRect.left - 12,
            width: targetRect.width + 24,
            height: targetRect.height + 24,
            border: '2px solid rgba(255, 255, 255, 0.4)',
            animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
          }}
          aria-hidden="true"
        />
      )}

      {/* ─── Tooltip Card ─── */}
      <div
        ref={tooltipRef}
        role="dialog"
        aria-modal="true"
        aria-label={`Tour step ${currentStep + 1} of ${tourSteps.length}: ${step.title}`}
        className={cn(
          'fixed z-[10001] transition-all duration-300',
          isVisible && !transitioning
            ? 'opacity-100 scale-100'
            : 'opacity-0 scale-95',
          isCentered &&
            'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-[520px]'
        )}
        style={!isCentered ? getTooltipStyle() : undefined}
      >
        <div className="bg-white rounded-xl shadow-2xl overflow-hidden border border-gray-200/50">
          {/* Progress bar */}
          <div className="w-full h-1.5 bg-gray-100">
            <div
              className={`h-full bg-gradient-to-r ${step.color} transition-all duration-500 ease-out`}
              style={{
                width: `${((currentStep + 1) / tourSteps.length) * 100}%`,
              }}
            />
          </div>

          {/* Header */}
          <div className={`bg-gradient-to-r ${step.color} p-5 text-white`}>
            <div className="flex items-center justify-between mb-3">
              <div className="bg-white/20 rounded-full p-2.5">
                <StepIcon className="w-6 h-6" />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs bg-white/20 px-2.5 py-1 rounded-full font-medium">
                  {currentStep + 1} / {tourSteps.length}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDefer();
                  }}
                  className="bg-white/20 rounded-full p-1.5 hover:bg-white/30 transition-colors"
                  aria-label="Dismiss tour"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <h2 className="text-xl font-bold mb-1">{step.title}</h2>
            <p className="text-white/90 text-sm leading-relaxed">
              {step.description}
            </p>
          </div>

          {/* Features list (centered info cards) */}
          {step.features && (
            <div className="px-5 py-4">
              <ul className="space-y-2.5">
                {step.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0 text-green-500" />
                    <span className="text-sm text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Interactive hint */}
          {step.interactive && (
            <div className="mx-5 mb-3 px-3 py-2 bg-indigo-50 border border-indigo-200 rounded-lg">
              <p className="text-xs text-indigo-700 font-medium flex items-center gap-1.5">
                <span className="text-base">💡</span> {step.interactive}
              </p>
            </div>
          )}

          {/* Step dots */}
          <div className="flex justify-center gap-1.5 pb-3 px-5">
            {tourSteps.map((_, i) => (
              <div
                key={i}
                className={cn(
                  'h-1.5 rounded-full transition-all duration-300',
                  i === currentStep
                    ? `bg-gradient-to-r ${step.color} w-6`
                    : i < currentStep
                    ? 'bg-gray-400 w-1.5'
                    : 'bg-gray-200 w-1.5'
                )}
              />
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 bg-gray-50/50">
            <div>
              {isFirstStep ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDefer();
                  }}
                  className="text-gray-500 hover:text-gray-700 text-xs h-8"
                >
                  Maybe Later
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSkip();
                  }}
                  className="text-gray-500 hover:text-gray-700 text-xs gap-1 h-8"
                >
                  <SkipForward className="w-3 h-3" />
                  Skip Tour
                </Button>
              )}
            </div>

            <div className="flex gap-2">
              {!isFirstStep && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePrev();
                  }}
                  className="gap-1 h-8"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Back
                </Button>
              )}
              <Button
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleNext();
                }}
                className={`gap-1 bg-gradient-to-r ${step.color} hover:opacity-90 text-white border-0 h-8`}
              >
                {isLastStep ? (
                  <>
                    Get Started!
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </>
                ) : isFirstStep ? (
                  <>
                    Start Tour
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                ) : (
                  <>
                    Next
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Keyboard hint (first step only) */}
      {isFirstStep && isVisible && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[10001] pointer-events-none">
          <p className="text-xs text-white/60 bg-black/30 px-3 py-1.5 rounded-full backdrop-blur-sm">
            Use arrow keys to navigate · Esc to dismiss
          </p>
        </div>
      )}
    </>
  );
}
