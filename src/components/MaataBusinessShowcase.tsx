import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet,
  Package,
  Receipt,
  Store,
  Users,
} from 'lucide-react';
import { EDITORIAL_SCENES } from '../config/brandAssets';
import { useLanguage } from '../context/LanguageContext';
import { BUSINESS_MODULES } from '../data/corporateContent';
import { COMPANY_INFO } from '../theme/tokens';
import { Button } from './Button';

const MODULE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  billing: Receipt,
  stock: Package,
  gst: FileSpreadsheet,
  'online-store': Store,
  'customer-tools': Users,
};

export const MaataBusinessShowcase: React.FC = () => {
  const { dict, language } = useLanguage();
  const [selectedId, setSelectedId] = useState<string>(BUSINESS_MODULES[0].id);
  const tablistRef = useRef<HTMLDivElement | null>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const current = BUSINESS_MODULES.find((m) => m.id === selectedId) ?? BUSINESS_MODULES[0];
  const CurrentIcon = MODULE_ICONS[current.id] ?? Store;

  const localizedCurrent = dict.business.modules[current.id];
  const currentTitle = localizedCurrent?.title || current.title;
  const currentDescription = localizedCurrent?.description || current.description;
  const currentBenefit = localizedCurrent?.practicalBenefit || current.practicalBenefit;
  const currentRows = localizedCurrent?.previewRows || current.previewRows;

  const updateScrollAffordances = useCallback(() => {
    const el = tablistRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    updateScrollAffordances();
    const el = tablistRef.current;
    if (!el) return;

    const handleResize = () => updateScrollAffordances();
    window.addEventListener('resize', handleResize);
    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(handleResize);
      ro.observe(el);
    }
    return () => {
      window.removeEventListener('resize', handleResize);
      ro?.disconnect();
    };
  }, [updateScrollAffordances, language]);

  const scrollTabsBy = (delta: number) => {
    const el = tablistRef.current;
    if (!el) return;
    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    el.scrollBy({
      left: delta,
      behavior: prefersReduced ? 'auto' : 'smooth',
    });
  };

  const handleSelectTab = (modId: string, buttonEl: HTMLButtonElement) => {
    setSelectedId(modId);
    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    buttonEl.scrollIntoView({
      behavior: prefersReduced ? 'auto' : 'smooth',
      inline: 'nearest',
      block: 'nearest',
    });
  };

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-12 md:items-start lg:gap-8">
      {/* Left Column: Compact Authentic Local Shop Photo & Value Story */}
      <div className="md:col-span-5 min-w-0 space-y-4">
        <figure className="rounded-2xl border border-[#092F35]/12 bg-white p-2.5">
          <div className="overflow-hidden rounded-xl aspect-[16/10] bg-[#EDE8DA]">
            <img
              src={EDITORIAL_SCENES.commerceCraft.src}
              alt={dict.business.commerceCraftAlt || EDITORIAL_SCENES.commerceCraft.alt}
              referrerPolicy="no-referrer"
              loading="lazy"
              className="h-full w-full object-cover"
            />
          </div>
          <figcaption className="px-1.5 pt-2.5 pb-0.5 text-xs font-editorial italic text-[#092F35]/70">
            {dict.business.commerceCraftCaption}
          </figcaption>
        </figure>

        <div className="rounded-2xl border border-[#092F35]/12 bg-white p-5">
          <h3 className="text-[17px] font-semibold leading-snug text-[#092F35]">
            {dict.business.cardHeadline}
          </h3>
          <p className="mt-2 text-[14.5px] leading-[1.65] text-[#092F35]/75">
            {dict.business.cardBody}
          </p>
          <div className="mt-4">
            <Button
              href={COMPANY_INFO.appUrl}
              target="_blank"
              rel="noopener noreferrer"
              variant="dark"
              size="md"
            >
              <span>{dict.business.exploreBusinessCta}</span>
              <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        </div>
      </div>

      {/* Right Column: Interactive Merchant Workspace Preview */}
      <div className="md:col-span-7 min-w-0">
        <div className="w-full max-w-full rounded-2xl border border-[#092F35]/15 bg-[#092F35] text-[#F7F4EC] overflow-hidden shadow-lg">
          {/* Interactive Horizontally Scrollable Module Navigation */}
          <div className="relative flex w-full max-w-full items-stretch border-b border-white/12 bg-[#0A3A47]">
            {canScrollLeft && (
              <button
                type="button"
                onClick={() => scrollTabsBy(-200)}
                aria-label="Scroll modules left"
                className="shrink-0 z-10 flex w-8 items-center justify-center border-r border-white/10 bg-[#0A3A47] text-[#F7F4EC]/80 transition-colors hover:bg-white/10 hover:text-[#FFD84A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#FFD84A] cursor-pointer"
              >
                <ChevronLeft className="h-4 w-4" aria-hidden="true" />
              </button>
            )}

            <div
              ref={tablistRef}
              onScroll={updateScrollAffordances}
              className="flex min-w-0 flex-1 flex-nowrap items-stretch overflow-x-auto scroll-smooth [&::-webkit-scrollbar]:h-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[#FFD84A]/35 [scrollbar-width:thin] [scrollbar-color:rgba(255,216,74,0.35)_transparent]"
              role="tablist"
              aria-label={dict.business.tablistAria}
            >
              {BUSINESS_MODULES.map((mod) => {
                const isSelected = mod.id === current.id;
                const modTitle = dict.business.modules[mod.id]?.title || mod.title;
                return (
                  <button
                    key={mod.id}
                    type="button"
                    role="tab"
                    aria-selected={isSelected}
                    onClick={(e) => handleSelectTab(mod.id, e.currentTarget)}
                    className={`shrink-0 flex items-center gap-1.5 px-4 py-3 text-xs font-semibold transition-colors border-b-2 whitespace-nowrap cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#FFD84A] ${
                      isSelected
                        ? 'border-[#FFD84A] bg-[#092F35] text-[#FFD84A]'
                        : 'border-transparent text-[#F7F4EC]/75 hover:text-[#F7F4EC] hover:bg-white/5'
                    }`}
                  >
                    <span className="tabular-nums opacity-85">{mod.index}.</span>
                    <span>{modTitle}</span>
                  </button>
                );
              })}
            </div>

            {canScrollRight && (
              <button
                type="button"
                onClick={() => scrollTabsBy(200)}
                aria-label="Scroll modules right"
                className="shrink-0 z-10 flex w-8 items-center justify-center border-l border-white/10 bg-[#0A3A47] text-[#F7F4EC]/80 transition-colors hover:bg-white/10 hover:text-[#FFD84A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#FFD84A] cursor-pointer"
              >
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </button>
            )}
          </div>

          {/* Active Workspace Preview Body */}
          <div className="p-5 md:p-6">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FFD84A] text-[#092F35] shrink-0">
                  <CurrentIcon className="h-5 w-5" aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium uppercase tracking-[0.12em] text-[#FFD84A]">
                    {dict.business.moduleLabelPrefix} {current.index}
                  </p>
                  <h3 className="text-lg md:text-xl font-semibold leading-snug text-[#F7F4EC]">
                    {currentTitle}
                  </h3>
                </div>
              </div>
              <span className="hidden sm:inline-block text-xs text-[#F7F4EC]/60 shrink-0 whitespace-nowrap">
                {dict.business.interfacePreview}
              </span>
            </div>

            <p className="mt-4 text-[14.5px] md:text-[15px] leading-[1.65] text-[#F7F4EC]/85">
              {currentDescription}
            </p>

            {/* Structured Interface Preview Table */}
            <dl className="mt-4 divide-y divide-white/10 rounded-xl border border-white/12 bg-[#0A3A47] px-4">
              {currentRows.map((row, idx) => (
                <div
                  key={idx}
                  className="grid grid-cols-1 gap-1 py-2.5 sm:grid-cols-12 sm:items-center sm:gap-3 sm:py-3"
                >
                  <dt className="sm:col-span-4 text-xs font-semibold uppercase tracking-wider text-[#FFD84A]">
                    {row.label}
                  </dt>
                  <dd className="sm:col-span-8 text-sm text-[#F7F4EC]/90">
                    {row.value}
                  </dd>
                </div>
              ))}
            </dl>

            <div className="mt-4 rounded-xl border border-[#0F8A5F]/40 bg-[#0B5D4B]/35 px-4 py-3 text-[13.5px] md:text-sm leading-relaxed text-[#F7F4EC]/90">
              <span className="font-semibold text-[#FFD84A] mr-1.5">
                {dict.business.practicalValueLabel}
              </span>
              {currentBenefit}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
