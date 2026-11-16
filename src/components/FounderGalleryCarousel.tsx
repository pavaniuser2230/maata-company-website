import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import {
  FOUNDER_GALLERY_FALLBACK,
  type FounderGallerySlide,
} from '../config/brandAssets';
import { usePublicCms } from '../context/PublicCmsContext';
import { useLanguage } from '../context/LanguageContext';
import { formatMessage } from '../i18n';

const AUTOPLAY_INTERVAL_MS = 5000;
const INTERACTION_COOLDOWN_MS = 9000;
const SWIPE_THRESHOLD_PX = 40;

export const FounderGalleryCarousel: React.FC = () => {
  const { founderGallery } = usePublicCms();
  const { dict } = useLanguage();
  const shouldReduceMotion = useReducedMotion();

  const slides: FounderGallerySlide[] =
    founderGallery.length > 0 ? founderGallery : FOUNDER_GALLERY_FALLBACK;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [isHovered, setIsHovered] = useState(false);
  const [isFocusedWithin, setIsFocusedWithin] = useState(false);
  const [isManuallyPaused, setIsManuallyPaused] = useState(false);
  const [isCoolingDown, setIsCoolingDown] = useState(false);
  const [failedUrls, setFailedUrls] = useState<Record<string, boolean>>({});
  const [naturalRatios, setNaturalRatios] = useState<Record<string, number>>({});

  const cooldownTimerRef = useRef<number | null>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  const safeIndex = currentIndex >= slides.length ? 0 : currentIndex;
  const activeSlide = slides[safeIndex];
  const hasMultipleSlides = slides.length > 1;

  // Keep index in bounds if media items are added/removed via CMS
  useEffect(() => {
    if (currentIndex >= slides.length) {
      setCurrentIndex(0);
    }
  }, [currentIndex, slides.length]);

  const clearCooldown = useCallback(() => {
    if (cooldownTimerRef.current !== null) {
      window.clearTimeout(cooldownTimerRef.current);
      cooldownTimerRef.current = null;
    }
  }, []);

  useEffect(() => clearCooldown, [clearCooldown]);

  const pauseTemporarilyAfterInteraction = useCallback(() => {
    clearCooldown();
    setIsCoolingDown(true);
    cooldownTimerRef.current = window.setTimeout(() => {
      setIsCoolingDown(false);
      cooldownTimerRef.current = null;
    }, INTERACTION_COOLDOWN_MS);
  }, [clearCooldown]);

  const goToSlide = useCallback(
    (nextIdx: number, dir?: 1 | -1, fromUser = true) => {
      if (slides.length <= 1) return;
      const wrapped = ((nextIdx % slides.length) + slides.length) % slides.length;
      if (dir) {
        setDirection(dir);
      } else {
        setDirection(wrapped >= safeIndex ? 1 : -1);
      }
      setCurrentIndex(wrapped);
      if (fromUser) {
        pauseTemporarilyAfterInteraction();
      }
    },
    [pauseTemporarilyAfterInteraction, safeIndex, slides.length]
  );

  const goNext = useCallback(
    (fromUser = true) => {
      goToSlide(safeIndex + 1, 1, fromUser);
    },
    [goToSlide, safeIndex]
  );

  const goPrev = useCallback(
    (fromUser = true) => {
      goToSlide(safeIndex - 1, -1, fromUser);
    },
    [goToSlide, safeIndex]
  );

  const isAutoplayPaused =
    Boolean(shouldReduceMotion) ||
    !hasMultipleSlides ||
    isHovered ||
    isFocusedWithin ||
    isManuallyPaused ||
    isCoolingDown;

  useEffect(() => {
    if (isAutoplayPaused) return;
    const timer = window.setInterval(() => {
      goNext(false);
    }, AUTOPLAY_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [goNext, isAutoplayPaused]);

  // Preload adjacent slide images smoothly for zero-jitter transitions
  useEffect(() => {
    if (slides.length <= 1) return;
    const nextUrl = slides[(safeIndex + 1) % slides.length]?.url;
    if (nextUrl) {
      const img = new Image();
      img.src = nextUrl;
    }
  }, [safeIndex, slides]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!hasMultipleSlides) return;
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      goPrev(true);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      goNext(true);
    } else if (e.key === 'Home') {
      e.preventDefault();
      goToSlide(0, -1, true);
    } else if (e.key === 'End') {
      e.preventDefault();
      goToSlide(slides.length - 1, 1, true);
    }
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length !== 1) return;
    touchStartRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
    };
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!touchStartRef.current || e.changedTouches.length !== 1 || !hasMultipleSlides) return;
    const dx = e.changedTouches[0].clientX - touchStartRef.current.x;
    const dy = e.changedTouches[0].clientY - touchStartRef.current.y;
    touchStartRef.current = null;

    if (Math.abs(dx) >= SWIPE_THRESHOLD_PX && Math.abs(dx) > Math.abs(dy)) {
      if (dx < 0) {
        goNext(true);
      } else {
        goPrev(true);
      }
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLDivElement>) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
      setIsFocusedWithin(false);
    }
  };

  const formatSlideNumber = (num: number) => String(num).padStart(2, '0');
  const activeRatio = naturalRatios[activeSlide.url];
  const isSquareOrPortrait = typeof activeRatio === 'number' && activeRatio < 1.25;

  return (
    <div className="mx-auto w-full max-w-[1060px] space-y-5">
      {/* Section Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#0F8A5F]">
            {dict.gallery.eyebrow}
          </p>
          <h2 className="mt-1.5 text-2xl sm:text-3xl font-semibold tracking-tight text-[#092F35] text-balance">
            {dict.gallery.heading}
          </h2>
          <p className="mt-1.5 font-editorial italic text-base text-[#0F4C5C]">
            {dict.gallery.subline}
          </p>
        </div>

        <p className="text-xs font-medium text-[#092F35]/65 tabular-nums">
          {formatSlideNumber(safeIndex + 1)} / {formatSlideNumber(slides.length)}
        </p>
      </div>

      {/* Centered Medium-Sized Gallery Frame */}
      <div
        role="region"
        aria-roledescription="carousel"
        aria-label={dict.gallery.carouselAria}
        tabIndex={0}
        onKeyDown={handleKeyDown}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onFocus={() => setIsFocusedWithin(true)}
        onBlur={handleBlur}
        className="group relative overflow-hidden rounded-2xl border border-[#0F4C5C]/25 bg-gradient-to-br from-[#092F35] via-[#0B3B47] to-[#0F4C5C] p-3 sm:p-4 shadow-[0_20px_50px_-16px_rgba(9,47,53,0.32)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFD84A]"
      >
        {/* Subtle top gold hairline accent */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-[#FFD84A]/65 to-transparent"
        />

        <div className="grid grid-cols-1 gap-3 lg:grid-cols-12 lg:items-stretch lg:gap-4">
          {/* Photograph Viewport — balanced heights across mobile / tablet / desktop */}
          <div
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            className="relative h-[240px] sm:h-[320px] md:h-[340px] lg:h-[400px] lg:col-span-8 w-full overflow-hidden rounded-xl border border-[#0F8A5F]/25 bg-[#072328] touch-pan-y"
          >
            <AnimatePresence initial={false} mode="sync" custom={direction}>
              <motion.div
                key={activeSlide.id}
                custom={direction}
                initial={
                  shouldReduceMotion
                    ? { opacity: 1, x: 0 }
                    : { opacity: 0, x: direction > 0 ? 28 : -28 }
                }
                animate={{ opacity: 1, x: 0 }}
                exit={
                  shouldReduceMotion
                    ? { opacity: 1, x: 0 }
                    : { opacity: 0, x: direction > 0 ? -28 : 28 }
                }
                transition={
                  shouldReduceMotion
                    ? { duration: 0 }
                    : { duration: 0.42, ease: [0.16, 1, 0.3, 1] }
                }
                className="absolute inset-0 flex items-center justify-center"
              >
                {!failedUrls[activeSlide.url] ? (
                  <img
                    src={activeSlide.url}
                    alt={activeSlide.alt_text}
                    referrerPolicy="no-referrer"
                    draggable={false}
                    loading={safeIndex === 0 ? 'eager' : 'lazy'}
                    decoding="async"
                    style={
                      isSquareOrPortrait
                        ? undefined
                        : { objectPosition: activeSlide.focal_position || '50% 25%' }
                    }
                    onLoad={(e) => {
                      const img = e.currentTarget;
                      if (img.naturalWidth > 0 && img.naturalHeight > 0) {
                        const ratio = img.naturalWidth / img.naturalHeight;
                        setNaturalRatios((prev) =>
                          prev[activeSlide.url] === ratio
                            ? prev
                            : { ...prev, [activeSlide.url]: ratio }
                        );
                      }
                    }}
                    onError={() =>
                      setFailedUrls((prev) => ({
                        ...prev,
                        [activeSlide.url]: true,
                      }))
                    }
                    className={`h-full w-full select-none ${
                      isSquareOrPortrait ? 'object-contain bg-[#072328]' : 'object-cover'
                    }`}
                  />
                ) : (
                  <div
                    className="flex h-full w-full flex-col items-center justify-center bg-[#092F35] p-6 text-center text-[#F7F4EC]"
                    role="img"
                    aria-label={activeSlide.alt_text}
                  >
                    <p className="text-base font-medium text-[#FFD84A]">MAATA Technologies</p>
                    <p className="mt-2 max-w-md text-sm text-[#F7F4EC]/80">
                      {activeSlide.alt_text}
                    </p>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            {/* Previous / Next Controls */}
            {hasMultipleSlides && (
              <>
                <button
                  type="button"
                  onClick={() => goPrev(true)}
                  aria-label={dict.gallery.prevPhotoAria}
                  className="absolute left-2.5 sm:left-3 top-1/2 z-10 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-xl border border-[#FFD84A]/35 bg-[#092F35]/80 text-[#F7F4EC] backdrop-blur-sm transition-colors duration-150 hover:bg-[#0F8A5F] hover:border-[#FFD84A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFD84A]"
                >
                  <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                </button>

                <button
                  type="button"
                  onClick={() => goNext(true)}
                  aria-label={dict.gallery.nextPhotoAria}
                  className="absolute right-2.5 sm:right-3 top-1/2 z-10 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-xl border border-[#FFD84A]/35 bg-[#092F35]/80 text-[#F7F4EC] backdrop-blur-sm transition-colors duration-150 hover:bg-[#0F8A5F] hover:border-[#FFD84A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFD84A]"
                >
                  <ChevronRight className="h-5 w-5" aria-hidden="true" />
                </button>
              </>
            )}
          </div>

          {/* Caption & Controls Panel */}
          <div className="flex flex-col justify-between gap-4 rounded-xl border border-white/10 bg-[#072328]/55 px-4 py-3.5 sm:px-5 sm:py-4 lg:col-span-4 lg:p-6">
            <div className="space-y-2.5">
              <div className="flex items-center justify-between gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#FFD84A]/90">
                <span>{dict.gallery.momentsLabel}</span>
                <span className="tabular-nums text-[#F7F4EC]/70">
                  {formatSlideNumber(safeIndex + 1)} / {formatSlideNumber(slides.length)}
                </span>
              </div>
              <p
                aria-live="polite"
                className="text-sm lg:text-[15px] font-editorial italic leading-relaxed text-[#F7F4EC]/90"
              >
                {activeSlide.caption || activeSlide.alt_text}
              </p>
            </div>

            {hasMultipleSlides && (
              <div className="flex items-center justify-between gap-3 border-t border-white/10 pt-3">
                <div
                  className="flex items-center gap-1"
                  role="tablist"
                  aria-label={dict.gallery.slidesTabAria}
                >
                  {slides.map((slide, idx) => {
                    const isActive = idx === safeIndex;
                    return (
                      <button
                        key={slide.id}
                        type="button"
                        role="tab"
                        aria-selected={isActive}
                        aria-label={formatMessage(dict.gallery.showPhotoAria, {
                          index: idx + 1,
                          total: slides.length,
                          title: slide.original_name || slide.alt_text,
                        })}
                        onClick={() => goToSlide(idx, idx >= safeIndex ? 1 : -1, true)}
                        className="flex h-9 min-w-[22px] items-center justify-center rounded px-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFD84A]"
                      >
                        <span
                          aria-hidden="true"
                          className={`block h-1.5 rounded-full transition-all duration-200 ${
                            isActive
                              ? 'w-6 bg-[#FFD84A]'
                              : 'w-2.5 bg-[#F7F4EC]/30 hover:bg-[#F7F4EC]/65'
                          }`}
                        />
                      </button>
                    );
                  })}
                </div>

                {!shouldReduceMotion && (
                  <button
                    type="button"
                    onClick={() => setIsManuallyPaused((prev) => !prev)}
                    aria-label={
                      isManuallyPaused
                        ? dict.gallery.resumeSlideshowAria
                        : dict.gallery.pauseSlideshowAria
                    }
                    aria-pressed={isManuallyPaused}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/15 bg-white/5 text-[#F7F4EC]/85 transition-colors hover:border-[#FFD84A]/50 hover:bg-[#0F8A5F]/40 hover:text-[#FFD84A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFD84A]"
                  >
                    {isManuallyPaused ? (
                      <Play className="h-3.5 w-3.5" aria-hidden="true" />
                    ) : (
                      <Pause className="h-3.5 w-3.5" aria-hidden="true" />
                    )}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
