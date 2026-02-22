import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { tourSteps, tourCategories, type TourStep } from './tourSteps';
import { Button } from '@/components/ui/button';
import {
  ArrowRight,
  ArrowLeft,
  X,
  CheckCircle2,
  SkipForward,
  Keyboard,
  Clock,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

/* ─────────────────────────────────────────────────────────
 * Confetti — lightweight canvas particle burst for the
 * completion step. Self-cleaning, no external deps.
 * ───────────────────────────────────────────────────────── */
function useConfetti(trigger: boolean) {
  useEffect(() => {
    if (!trigger) return;

    const canvas = document.createElement('canvas');
    canvas.style.cssText =
      'position:fixed;inset:0;z-index:10010;pointer-events:none;';
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    document.body.appendChild(canvas);
    const ctx = canvas.getContext('2d')!;

    const colors = [
      '#6366f1', '#ec4899', '#f59e0b', '#10b981',
      '#3b82f6', '#ef4444', '#8b5cf6', '#14b8a6',
    ];

    interface Particle {
      x: number; y: number; vx: number; vy: number;
      w: number; h: number; color: string; rotation: number;
      rotSpeed: number; opacity: number; gravity: number;
    }

    const particles: Particle[] = Array.from({ length: 120 }, () => ({
      x: canvas.width / 2 + (Math.random() - 0.5) * 200,
      y: canvas.height / 2 - 100,
      vx: (Math.random() - 0.5) * 16,
      vy: -(Math.random() * 14 + 4),
      w: Math.random() * 10 + 4,
      h: Math.random() * 6 + 2,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * 360,
      rotSpeed: (Math.random() - 0.5) * 12,
      opacity: 1,
      gravity: 0.25 + Math.random() * 0.15,
    }));

    let frame: number;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let alive = false;
      for (const p of particles) {
        p.vy += p.gravity;
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.rotSpeed;
        p.opacity -= 0.006;
        if (p.opacity <= 0) continue;
        alive = true;
        ctx.save();
        ctx.globalAlpha = Math.max(0, p.opacity);
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      }
      if (alive) frame = requestAnimationFrame(animate);
      else canvas.remove();
    };
    frame = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(frame);
      canvas.remove();
    };
  }, [trigger]);
}

/* ─────────────────────────────────────────────────────────
 * Helper: animated number counter (for metric chips)
 * ───────────────────────────────────────────────────────── */
function AnimatedValue({ value }: { value: string }) {
  const numMatch = value.match(/^([\d,]+)/);
  const [display, setDisplay] = useState(numMatch ? '0' : value);

  useEffect(() => {
    if (!numMatch) { setDisplay(value); return; }
    const target = parseInt(numMatch[1].replace(/,/g, ''), 10);
    const suffix = value.slice(numMatch[0].length);
    const duration = 800;
    const start = performance.now();
    let raf: number;

    const tick = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(eased * target);
      setDisplay(current.toLocaleString() + suffix);
      if (progress < 1) raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, numMatch]);

  return <span className="font-bold tabular-nums">{display}</span>;
}

/* ─────────────────────────────────────────────────────────
 * Mini step-map component for tour overview
 * ───────────────────────────────────────────────────────── */
function StepMap({
  steps,
  current,
  onJump,
}: {
  steps: TourStep[];
  current: number;
  onJump: (i: number) => void;
}) {
  return (
    <div className="flex items-center gap-0.5 flex-wrap justify-center py-1">
      {steps.map((s, i) => {
        const Icon = s.icon;
        const isActive = i === current;
        const isDone = i < current;
        const category = s.category ? tourCategories[s.category] : null;

        return (
          <button
            key={s.id}
            onClick={(e) => { e.stopPropagation(); onJump(i); }}
            className={cn(
              'group relative flex items-center justify-center rounded-full transition-all duration-300',
              isActive
                ? 'w-8 h-8 ring-2 ring-white/60 shadow-lg'
                : 'w-5 h-5 hover:w-6 hover:h-6',
              isActive
                ? `bg-gradient-to-br ${s.color}`
                : isDone
                ? 'bg-white/30'
                : 'bg-white/10 hover:bg-white/20'
            )}
            title={s.title}
            aria-label={`Go to step ${i + 1}: ${s.title}`}
          >
            {isActive ? (
              <Icon className="w-4 h-4 text-white" />
            ) : isDone ? (
              <CheckCircle2 className="w-3 h-3 text-white/80" />
            ) : (
              <div className="w-1.5 h-1.5 rounded-full bg-white/40" />
            )}
            {/* Hover tooltip */}
            <span className="absolute -bottom-7 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-[10px] text-white/80 whitespace-nowrap pointer-events-none bg-black/40 px-1.5 py-0.5 rounded">
              {category ? `${category.emoji} ` : ''}{s.title}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/* ═════════════════════════════════════════════════════════
 * OnboardingTour — comprehensive interactive walkthrough
 *
 * Renders a spotlight overlay + tooltip that walks the user
 * through key platform features. Steps that target a DOM
 * element (via `data-tour` attributes) get a spotlight
 * highlight; steps without a target show a centered card.
 *
 * Lifecycle:
 *   - Auto-starts for authenticated users who haven't
 *     completed onboarding
 *   - "Maybe Later" / X = defer (shows again next load)
 *   - "Skip Tour" = mark complete (won't show again)
 *   - Finishing all steps = mark complete + confetti
 *   - "Replay Tour" from Profile resets and restarts
 * ═════════════════════════════════════════════════════════ */
export function OnboardingTour() {
  const { user, onboardingCompleted, completeOnboarding } = useAuth();
  const location = useLocation();

  // ── State ────────────────────────────────────────────────
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [transitioning, setTransitioning] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [highestSeen, setHighestSeen] = useState(0);
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

  // ── Confetti ─────────────────────────────────────────────
  useConfetti(showConfetti);

  // ── Derived ──────────────────────────────────────────────
  const step = tourSteps[currentStep] as TourStep;
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === tourSteps.length - 1;
  const hasTarget = !!step.target && !!targetRect;
  const isCentered = !hasTarget;

  const progressPercent = useMemo(
    () => ((currentStep + 1) / tourSteps.length) * 100,
    [currentStep]
  );

  // ── Auto-start for new users ────────────────────────────
  useEffect(() => {
    if (user && !onboardingCompleted && !isActive && !deferred) {
      const timer = setTimeout(() => {
        setIsActive(true);
        setCurrentStep(0);
        setHighestSeen(0);
        requestAnimationFrame(() => setIsVisible(true));
      }, 800);
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
      setHighestSeen(0);
      setShowConfetti(false);
      requestAnimationFrame(() => setIsVisible(true));
    }
    prevOnboardingRef.current = onboardingCompleted;
  }, [onboardingCompleted]);

  // Track highest seen step for progress ring
  useEffect(() => {
    setHighestSeen((prev) => Math.max(prev, currentStep));
  }, [currentStep]);

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

    const orig = {
      zIndex: el.style.zIndex,
      position: el.style.position,
      boxShadow: el.style.boxShadow,
      borderRadius: el.style.borderRadius,
      transition: el.style.transition,
    };

    el.style.zIndex = '10000';
    if (getComputedStyle(el).position === 'static') {
      el.style.position = 'relative';
    }
    el.style.boxShadow =
      '0 0 0 4px rgba(99, 102, 241, 0.5), 0 0 32px rgba(99, 102, 241, 0.2)';
    el.style.borderRadius = '12px';
    el.style.transition =
      'box-shadow 0.4s ease, border-radius 0.4s ease';

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
  const goToStep = useCallback((next: number) => {
    setTransitioning(true);
    setTimeout(() => {
      setCurrentStep(next);
      setTransitioning(false);
    }, 180);
  }, []);

  const handleNext = useCallback(() => {
    if (currentStep === tourSteps.length - 1) {
      handleComplete();
    } else {
      goToStep(currentStep + 1);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep, goToStep]);

  const handlePrev = useCallback(() => {
    if (currentStep > 0) goToStep(currentStep - 1);
  }, [currentStep, goToStep]);

  const handleDefer = useCallback(() => {
    setIsVisible(false);
    setTimeout(() => {
      setIsActive(false);
      setCurrentStep(0);
      setTargetRect(null);
      setDeferred(true);
      sessionStorage.setItem('thynk_tour_deferred', 'true');
    }, 300);
  }, []);

  const handleSkip = useCallback(async () => {
    setIsVisible(false);
    setTimeout(async () => {
      setIsActive(false);
      setCurrentStep(0);
      setTargetRect(null);
      await completeOnboarding();
    }, 300);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [completeOnboarding]);

  const handleComplete = useCallback(async () => {
    setShowConfetti(true);
    // Small delay to let confetti fire before closing
    setTimeout(async () => {
      setIsVisible(false);
      setTimeout(async () => {
        setIsActive(false);
        setCurrentStep(0);
        setTargetRect(null);
        await completeOnboarding();
      }, 600);
    }, 1200);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [completeOnboarding]);

  const handleJumpToStep = useCallback((index: number) => {
    if (index >= 0 && index < tourSteps.length) {
      goToStep(index);
    }
  }, [goToStep]);

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
    const tooltipWidth = 420;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const pad = 16;
    const style: React.CSSProperties = { width: tooltipWidth };

    switch (step.position) {
      case 'bottom':
        style.top = Math.min(targetRect.bottom + gap, vh - 360);
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
  const category = step.category ? tourCategories[step.category] : null;

  return (
    <>
      {/* ─── Backdrop ─── */}
      <div
        className={cn(
          'fixed inset-0 z-[9998] transition-all duration-500',
          isVisible ? 'opacity-100' : 'opacity-0',
          isCentered ? 'bg-black/65 backdrop-blur-md' : 'bg-transparent'
        )}
        onClick={handleDefer}
        aria-hidden="true"
      />

      {/* ─── Spotlight overlay (targeting an element) ─── */}
      {!isCentered && targetRect && (
        <div
          className={cn(
            'fixed rounded-2xl pointer-events-none z-[9999] transition-all duration-500',
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
          className="fixed rounded-2xl z-[10000] pointer-events-none transition-all duration-500"
          style={{
            top: targetRect.top - 14,
            left: targetRect.left - 14,
            width: targetRect.width + 28,
            height: targetRect.height + 28,
            border: '2px solid rgba(255, 255, 255, 0.3)',
            animation: 'pulse 2.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
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
          'fixed z-[10001] transition-all duration-[400ms]',
          isVisible && !transitioning
            ? 'opacity-100 scale-100 translate-y-0'
            : 'opacity-0 scale-95 translate-y-2',
          isCentered &&
            'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[92vw] max-w-[540px]'
        )}
        style={!isCentered ? getTooltipStyle() : undefined}
      >
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden border border-gray-200/60 dark:border-gray-700/60">
          {/* ── Progress bar ── */}
          <div className="w-full h-1 bg-gray-100 dark:bg-gray-800">
            <div
              className={`h-full bg-gradient-to-r ${step.color} transition-all duration-700 ease-out`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* ── Header gradient ── */}
          <div className={`bg-gradient-to-br ${step.color} p-6 text-white relative overflow-hidden`}>
            {/* Decorative circles */}
            <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-white/10" aria-hidden="true" />
            <div className="absolute -bottom-4 -left-4 w-16 h-16 rounded-full bg-white/5" aria-hidden="true" />

            <div className="relative">
              {/* Top row: icon, category, step counter, close */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="bg-white/20 backdrop-blur-sm rounded-xl p-2.5 shadow-lg">
                    <StepIcon className="w-6 h-6" />
                  </div>
                  {category && (
                    <span className="text-[11px] uppercase tracking-wider font-semibold bg-white/15 backdrop-blur-sm px-2.5 py-1 rounded-full">
                      {category.emoji} {category.label}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs bg-white/15 backdrop-blur-sm px-2.5 py-1 rounded-full font-medium tabular-nums">
                    {currentStep + 1} / {tourSteps.length}
                  </span>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDefer(); }}
                    className="bg-white/15 backdrop-blur-sm rounded-full p-1.5 hover:bg-white/25 transition-colors"
                    aria-label="Dismiss tour"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Title + description */}
              <h2 className="text-2xl font-bold mb-2 leading-tight">{step.title}</h2>
              <p className="text-white/90 text-sm leading-relaxed max-w-md">
                {step.description}
              </p>

              {/* Metric chip */}
              {step.metric && (
                <div className="mt-3 inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-lg px-3 py-1.5">
                  <span className="text-xs text-white/70">{step.metric.label}:</span>
                  <span className="text-sm font-bold">
                    <AnimatedValue value={step.metric.value} />
                  </span>
                </div>
              )}

              {/* Estimated time (welcome step) */}
              {step.estimatedTime && (
                <div className="mt-3 inline-flex items-center gap-1.5 bg-white/15 backdrop-blur-sm rounded-lg px-3 py-1.5 ml-2">
                  <Clock className="w-3.5 h-3.5 text-white/70" />
                  <span className="text-xs font-medium">{step.estimatedTime}</span>
                </div>
              )}
            </div>
          </div>

          {/* ── Body content ── */}
          <div className="px-6 py-4 space-y-3">
            {/* Features list */}
            {step.features && (
              <ul className="space-y-2">
                {step.features.map((feature, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-3 group"
                    style={{
                      animationDelay: `${i * 80}ms`,
                      animation: isVisible && !transitioning
                        ? `fadeSlideIn 0.4s ease forwards ${i * 80}ms`
                        : 'none',
                      opacity: 0,
                    }}
                  >
                    <div className={`flex-shrink-0 mt-0.5 rounded-full p-0.5 bg-gradient-to-br ${step.color}`}>
                      <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                    </div>
                    <span className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{feature}</span>
                  </li>
                ))}
              </ul>
            )}

            {/* Interactive hint */}
            {step.interactive && (
              <div className="flex items-start gap-3 px-3.5 py-2.5 bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200/60 dark:border-indigo-800/40 rounded-xl">
                <span className="text-lg flex-shrink-0 mt-0.5" aria-hidden="true">💡</span>
                <div>
                  <p className="text-xs font-semibold text-indigo-700 dark:text-indigo-300">
                    {step.interactive}
                  </p>
                  {step.shortcut && (
                    <p className="text-[10px] text-indigo-500 dark:text-indigo-400 mt-0.5 flex items-center gap-1">
                      <Keyboard className="w-3 h-3" /> Shortcut: <kbd className="bg-indigo-100 dark:bg-indigo-900 px-1.5 py-0.5 rounded text-[10px] font-mono">{step.shortcut}</kbd>
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Shortcut hint (when no interactive message) */}
            {step.shortcut && !step.interactive && (
              <div className="flex items-center gap-1.5 text-[11px] text-gray-400 dark:text-gray-500">
                <Keyboard className="w-3 h-3" /> Keyboard shortcut: <kbd className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded font-mono text-[10px]">{step.shortcut}</kbd>
              </div>
            )}
          </div>

          {/* ── Step map (click-to-jump navigation) ── */}
          <div className={`mx-6 mb-1 px-3 py-2 bg-gradient-to-r ${step.color} rounded-xl`}>
            <StepMap steps={tourSteps} current={currentStep} onJump={handleJumpToStep} />
          </div>

          {/* ── Actions ── */}
          <div className="flex items-center justify-between px-6 py-3.5 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50">
            <div>
              {isFirstStep ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => { e.stopPropagation(); handleDefer(); }}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-xs h-8"
                >
                  Maybe Later
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => { e.stopPropagation(); handleSkip(); }}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-xs gap-1 h-8"
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
                  onClick={(e) => { e.stopPropagation(); handlePrev(); }}
                  className="gap-1 h-8 dark:border-gray-700"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Back
                </Button>
              )}
              <Button
                size="sm"
                onClick={(e) => { e.stopPropagation(); handleNext(); }}
                className={`gap-1.5 bg-gradient-to-r ${step.color} hover:opacity-90 text-white border-0 h-8 shadow-lg shadow-indigo-500/20`}
              >
                {isLastStep ? (
                  <>
                    Get Started!
                    <ChevronRight className="w-3.5 h-3.5" />
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

      {/* ── Keyboard hint (welcome step only) ── */}
      {isFirstStep && isVisible && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[10001] pointer-events-none">
          <div className="flex items-center gap-2 text-xs text-white/60 bg-black/30 px-4 py-2 rounded-full backdrop-blur-sm">
            <Keyboard className="w-3.5 h-3.5" />
            <span>Arrow keys to navigate</span>
            <span className="text-white/30">·</span>
            <span>Esc to dismiss</span>
            <span className="text-white/30">·</span>
            <span>Click dots to jump</span>
          </div>
        </div>
      )}

      {/* ── Animation keyframes ── */}
      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateX(-8px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </>
  );
}
