import React, { useState } from 'react';
import { ArrowUpRight, FileSpreadsheet, Package, Receipt, Store, Users } from 'lucide-react';
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
  const { dict } = useLanguage();
  const [selectedId, setSelectedId] = useState<string>(BUSINESS_MODULES[0].id);
  const current = BUSINESS_MODULES.find((m) => m.id === selectedId) ?? BUSINESS_MODULES[0];
  const CurrentIcon = MODULE_ICONS[current.id] ?? Store;

  const localizedCurrent = dict.business.modules[current.id];
  const currentTitle = localizedCurrent?.title || current.title;
  const currentDescription = localizedCurrent?.description || current.description;
  const currentBenefit = localizedCurrent?.practicalBenefit || current.practicalBenefit;
  const currentRows = localizedCurrent?.previewRows || current.previewRows;

  return (
    <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:items-start">
      {/* Left Column: Authentic Local Shop Photo & Value Story */}
      <div className="lg:col-span-5 space-y-6">
        <figure className="rounded-2xl border border-[#092F35]/12 bg-white p-3">
          <div className="overflow-hidden rounded-xl aspect-[4/3] bg-[#EDE8DA]">
            <img
              src={EDITORIAL_SCENES.commerceCraft.src}
              alt={dict.business.commerceCraftAlt || EDITORIAL_SCENES.commerceCraft.alt}
              referrerPolicy="no-referrer"
              loading="lazy"
              className="h-full w-full object-cover"
            />
          </div>
          <figcaption className="px-2 pt-3 pb-1 text-xs font-editorial italic text-[#092F35]/70">
            {dict.business.commerceCraftCaption}
          </figcaption>
        </figure>

        <div className="rounded-2xl border border-[#092F35]/12 bg-white p-6">
          <h3 className="text-lg font-semibold text-[#092F35]">
            {dict.business.cardHeadline}
          </h3>
          <p className="mt-2.5 text-[15px] leading-[1.7] text-[#092F35]/75">
            {dict.business.cardBody}
          </p>
          <div className="mt-5">
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
      <div className="lg:col-span-7">
        <div className="rounded-2xl border border-[#092F35]/15 bg-[#092F35] text-[#F7F4EC] overflow-hidden shadow-xl">
          {/* Interactive Tab Strip */}
          <div
            className="flex flex-wrap border-b border-white/12 bg-[#0A3A47]"
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
                  onClick={() => setSelectedId(mod.id)}
                  className={`flex-1 min-w-[120px] px-4 py-3.5 text-xs font-semibold transition-colors border-b-2 whitespace-nowrap cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#FFD84A] ${
                    isSelected
                      ? 'border-[#FFD84A] bg-[#092F35] text-[#FFD84A]'
                      : 'border-transparent text-[#F7F4EC]/70 hover:text-[#F7F4EC] hover:bg-white/5'
                  }`}
                >
                  <span className="tabular-nums mr-1.5">{mod.index}.</span>
                  <span>{modTitle}</span>
                </button>
              );
            })}
          </div>

          {/* Active Workspace Preview Body */}
          <div className="p-6 md:p-8">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#FFD84A] text-[#092F35] shrink-0">
                  <CurrentIcon className="h-5 w-5" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.12em] text-[#FFD84A]">
                    {dict.business.moduleLabelPrefix} {current.index}
                  </p>
                  <h3 className="text-xl md:text-2xl font-semibold text-[#F7F4EC]">
                    {currentTitle}
                  </h3>
                </div>
              </div>
              <span className="hidden sm:inline-block text-xs text-[#F7F4EC]/60 shrink-0">
                {dict.business.interfacePreview}
              </span>
            </div>

            <p className="mt-5 text-[15px] leading-[1.7] text-[#F7F4EC]/85">
              {currentDescription}
            </p>

            {/* Structured Interface Preview Table */}
            <dl className="mt-6 divide-y divide-white/10 rounded-xl border border-white/12 bg-[#0A3A47] px-5">
              {currentRows.map((row, idx) => (
                <div
                  key={idx}
                  className="grid grid-cols-1 gap-1 py-3.5 sm:grid-cols-12 sm:items-center sm:gap-4"
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

            <div className="mt-6 rounded-xl border border-[#0F8A5F]/40 bg-[#0B5D4B]/35 p-4 text-sm text-[#F7F4EC]/90">
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
