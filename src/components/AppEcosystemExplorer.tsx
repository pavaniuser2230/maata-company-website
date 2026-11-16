import React, { useState } from 'react';
import {
  ArrowUpRight,
  Bot,
  Briefcase,
  Car,
  CircleDot,
  Coins,
  Compass,
  Film,
  Lock,
  MapPin,
  MessageSquare,
  Navigation,
  PhoneCall,
  ShoppingBag,
  Store,
  Users,
  Wrench,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useLanguage } from '../context/LanguageContext';
import {
  ECOSYSTEM_FEATURES,
  EcosystemCategory,
  EcosystemFeature,
} from '../data/corporateContent';
import type { TranslationDictionary } from '../i18n';
import { Button } from './Button';

const CATEGORIES: EcosystemCategory[] = [
  'All',
  'Communication',
  'Mobility & Services',
  'Commerce & Business',
  'Trust & Utility',
];

const FEATURE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  'chats-messaging': MessageSquare,
  'voice-video-calls': PhoneCall,
  'status-updates': CircleDot,
  reels: Film,
  'groups-communities-channels': Users,
  'maata-ai': Bot,
  'book-a-ride': Car,
  'driver-captain': Navigation,
  'local-services': Wrench,
  'find-work-hire-workers': Briefcase,
  'shops-and-orders': ShoppingBag,
  'maata-business': Store,
  'business-tools': Compass,
  'maps-live-location': MapPin,
  'safety-and-privacy': Lock,
  'settings-coins-help': Coins,
};

const FeatureUniqueVisual: React.FC<{
  feature: EcosystemFeature;
  dict: TranslationDictionary;
}> = ({ feature, dict }) => {
  const w = dict.ecosystem.visualWidgets;

  switch (feature.id) {
    case 'chats-messaging':
      return (
        <div className="space-y-2.5 text-xs">
          <div className="rounded-lg bg-[#092F35] p-3 text-[#F7F4EC]/90 border border-white/10 max-w-[85%]">
            {w.chatIncoming}
          </div>
          <div className="ml-auto rounded-lg bg-[#0F8A5F] p-3 text-white max-w-[85%]">
            {w.chatReply}
          </div>
        </div>
      );

    case 'voice-video-calls':
      return (
        <div className="rounded-xl bg-[#092F35] border border-white/12 p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-[#FFD84A] font-medium">{w.voiceReady}</p>
            <p className="mt-1 text-sm font-semibold text-[#F7F4EC]">{w.directCall}</p>
          </div>
          <div className="flex items-center gap-1.5" aria-hidden="true">
            <span className="h-3 w-1 rounded-full bg-[#FFD84A]" />
            <span className="h-6 w-1 rounded-full bg-[#0F8A5F]" />
            <span className="h-4 w-1 rounded-full bg-[#FFD84A]" />
            <span className="h-7 w-1 rounded-full bg-[#0F8A5F]" />
            <span className="h-3 w-1 rounded-full bg-[#FFD84A]" />
          </div>
        </div>
      );

    case 'status-updates':
      return (
        <div className="grid grid-cols-3 gap-2.5">
          {w.statusItems.map((label, i) => (
            <div
              key={i}
              className={`rounded-xl border p-3 text-center ${
                i === 0
                  ? 'border-[#FFD84A] bg-[#092F35]'
                  : 'border-white/12 bg-[#092F35]/60'
              }`}
            >
              <div className="mx-auto h-7 w-7 rounded-full border-2 border-[#FFD84A] bg-[#0F8A5F]/40" />
              <p className="mt-2 text-[11px] font-medium text-[#F7F4EC]/90">{label}</p>
            </div>
          ))}
        </div>
      );

    case 'reels':
      return (
        <div className="rounded-xl border border-white/15 bg-gradient-to-br from-[#092F35] via-[#0B5D4B] to-[#0F4C5C] p-4 flex items-end justify-between min-h-[96px] gap-2">
          <div>
            <p className="text-[11px] uppercase tracking-wider text-[#FFD84A]">{w.shortVideo}</p>
            <p className="mt-1 text-sm font-semibold text-[#F7F4EC]">
              {w.regionalCreators}
            </p>
          </div>
          <span className="rounded-lg bg-white/15 px-2.5 py-1 text-xs font-semibold text-[#F7F4EC] shrink-0">
            9:16
          </span>
        </div>
      );

    case 'groups-communities-channels':
      return (
        <div className="space-y-2 text-xs">
          {w.groupNames.map((g, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between gap-2 rounded-lg border border-white/10 bg-[#092F35] px-3 py-2 text-[#F7F4EC]/90"
            >
              <span>{g}</span>
              <span className="text-[#FFD84A] shrink-0">{w.activeLabel}</span>
            </div>
          ))}
        </div>
      );

    case 'maata-ai':
      return (
        <div className="rounded-xl border border-[#FFD84A]/30 bg-[#092F35] p-4 space-y-2.5 text-xs">
          <div className="text-[#FFD84A] font-semibold">{w.maataAiTitle}</div>
          <p className="text-[#F7F4EC]/85">
            {w.maataAiBody}
          </p>
        </div>
      );

    case 'book-a-ride':
      return (
        <div className="rounded-xl border border-white/12 bg-[#092F35] p-4 space-y-2 text-xs">
          <div className="flex items-center justify-between gap-2 text-[#F7F4EC]/85">
            <span>{w.pickupLabel}</span>
            <span className="text-[#FFD84A] shrink-0">{w.routeReady}</span>
          </div>
          <div className="h-px bg-white/12" />
          <div className="text-[#F7F4EC]">{w.destinationLabel}</div>
        </div>
      );

    case 'driver-captain':
      return (
        <div className="rounded-xl border border-white/12 bg-[#092F35] p-4 flex items-center justify-between gap-3 text-xs">
          <div>
            <p className="text-[#FFD84A] font-semibold">{w.driverModeTitle}</p>
            <p className="mt-1 text-[#F7F4EC]/80">{w.driverModeSub}</p>
          </div>
          <span className="rounded-md bg-[#0F8A5F] px-2.5 py-1 font-semibold text-white shrink-0">
            {w.readyBadge}
          </span>
        </div>
      );

    case 'local-services':
      return (
        <div className="grid grid-cols-2 gap-2 text-xs">
          {w.servicesList.map((s, idx) => (
            <div
              key={idx}
              className="rounded-lg border border-white/10 bg-[#092F35] px-3 py-2 text-[#F7F4EC]/90"
            >
              {s}
            </div>
          ))}
        </div>
      );

    case 'find-work-hire-workers':
      return (
        <div className="grid grid-cols-2 gap-2.5 text-xs">
          <div className="rounded-lg border border-[#0F8A5F]/50 bg-[#092F35] p-3">
            <p className="font-semibold text-[#FFD84A]">{w.findWorkTitle}</p>
            <p className="mt-1 text-[#F7F4EC]/75">{w.findWorkSub}</p>
          </div>
          <div className="rounded-lg border border-white/12 bg-[#092F35] p-3">
            <p className="font-semibold text-[#F7F4EC]">{w.hireWorkersTitle}</p>
            <p className="mt-1 text-[#F7F4EC]/75">{w.hireWorkersSub}</p>
          </div>
        </div>
      );

    case 'shops-and-orders':
      return (
        <div className="rounded-xl border border-white/12 bg-[#092F35] p-4 space-y-2 text-xs">
          <div className="flex justify-between gap-2 text-[#F7F4EC]">
            <span>{w.localStoreTitle}</span>
            <span className="text-[#FFD84A] shrink-0">{w.directOrder}</span>
          </div>
          <p className="text-[#F7F4EC]/70">{w.localStoreSub}</p>
        </div>
      );

    case 'maata-business':
      return (
        <div className="rounded-xl border border-[#FFD84A]/30 bg-[#092F35] p-4 space-y-2 text-xs">
          <p className="font-semibold text-[#FFD84A]">{w.merchantStorefront}</p>
          <p className="text-[#F7F4EC]/85">
            {w.merchantStorefrontSub}
          </p>
        </div>
      );

    case 'business-tools':
      return (
        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          {w.businessToolsList.map((tool, idx) => (
            <div
              key={idx}
              className="rounded-lg border border-white/12 bg-[#092F35] py-2.5 px-2 font-medium text-[#F7F4EC]"
            >
              {tool}
            </div>
          ))}
        </div>
      );

    case 'maps-live-location':
      return (
        <div className="rounded-xl border border-white/12 bg-[#092F35] p-4 flex items-center justify-between gap-3 text-xs">
          <div>
            <p className="font-semibold text-[#F7F4EC]">{w.regionalMapTitle}</p>
            <p className="mt-1 text-[#F7F4EC]/70">{w.regionalMapSub}</p>
          </div>
          <MapPin className="h-5 w-5 text-[#FFD84A] shrink-0" aria-hidden="true" />
        </div>
      );

    case 'safety-and-privacy':
      return (
        <div className="rounded-xl border border-white/12 bg-[#092F35] p-4 space-y-2 text-xs">
          <div className="flex justify-between gap-2 text-[#F7F4EC]">
            <span>{w.privacyTitle}</span>
            <span className="text-[#0F8A5F] font-semibold shrink-0">{w.protectedBadge}</span>
          </div>
          <p className="text-[#F7F4EC]/70">{w.privacySub}</p>
        </div>
      );

    default:
      return (
        <div className="rounded-xl border border-white/12 bg-[#092F35] p-4 flex items-center justify-between gap-3 text-xs">
          <div>
            <p className="font-semibold text-[#F7F4EC]">{w.settingsCoinsTitle}</p>
            <p className="mt-1 text-[#F7F4EC]/70">{w.settingsCoinsSub}</p>
          </div>
          <Coins className="h-5 w-5 text-[#FFD84A] shrink-0" aria-hidden="true" />
        </div>
      );
  }
};

export const AppEcosystemExplorer: React.FC = () => {
  const { dict } = useLanguage();
  const [selectedCategory, setSelectedCategory] = useState<EcosystemCategory>('All');
  const [activeId, setActiveId] = useState<string>(ECOSYSTEM_FEATURES[0].id);

  const visibleFeatures =
    selectedCategory === 'All'
      ? ECOSYSTEM_FEATURES
      : ECOSYSTEM_FEATURES.filter((f) => f.category === selectedCategory);

  const activeFeature =
    visibleFeatures.find((f) => f.id === activeId) ?? visibleFeatures[0] ?? ECOSYSTEM_FEATURES[0];

  const ActiveIcon = FEATURE_ICONS[activeFeature.id] ?? Compass;

  const getLocalizedFeature = (feature: EcosystemFeature) => {
    const t = dict.ecosystem.features[feature.id];
    if (!t) return feature;
    return {
      ...feature,
      title: t.title || feature.title,
      shortTag: t.shortTag || feature.shortTag,
      description: t.description || feature.description,
      highlightNote: t.highlightNote || feature.highlightNote,
      previewHeadline: t.previewHeadline || feature.previewHeadline,
      previewItems: t.previewItems || feature.previewItems,
      actionLabel: t.actionLabel || feature.actionLabel,
    };
  };

  const activeLocalized = getLocalizedFeature(activeFeature);
  const activeCategoryLabel =
    dict.ecosystem.categories[activeFeature.category] ?? activeFeature.category;

  const handleCategoryChange = (cat: EcosystemCategory) => {
    setSelectedCategory(cat);
    const matching =
      cat === 'All'
        ? ECOSYSTEM_FEATURES
        : ECOSYSTEM_FEATURES.filter((f) => f.category === cat);
    if (matching.length > 0 && !matching.some((m) => m.id === activeId)) {
      setActiveId(matching[0].id);
    }
  };

  return (
    <div className="space-y-8">
      {/* Interactive Category Filter Controls */}
      <div
        className="flex flex-wrap items-center gap-2"
        role="tablist"
        aria-label={dict.ecosystem.categoryTablistAria}
      >
        {CATEGORIES.map((category) => {
          const isSelected = selectedCategory === category;
          const label = dict.ecosystem.categories[category] ?? category;
          return (
            <button
              key={category}
              type="button"
              role="tab"
              aria-selected={isSelected}
              onClick={() => handleCategoryChange(category)}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFD84A] ${
                isSelected
                  ? 'bg-[#FFD84A] text-[#092F35]'
                  : 'bg-[#092F35]/70 text-[#F7F4EC]/80 border border-white/12 hover:text-[#F7F4EC] hover:border-white/25'
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Main Split Explorer: 16-Feature Directory + Live Preview Panel */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-start">
        {/* Feature Selector Grid */}
        <div className="lg:col-span-7 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          {visibleFeatures.map((feature) => {
            const Icon = FEATURE_ICONS[feature.id] ?? Compass;
            const isActive = feature.id === activeFeature.id;
            const localized = getLocalizedFeature(feature);
            const catLabel = dict.ecosystem.categories[feature.category] ?? feature.category;

            return (
              <button
                key={feature.id}
                type="button"
                onClick={() => setActiveId(feature.id)}
                aria-pressed={isActive}
                className={`group flex items-start gap-3.5 rounded-xl border p-4 text-left transition-colors duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFD84A] ${
                  isActive
                    ? 'bg-[#092F35] border-[#FFD84A] text-[#F7F4EC]'
                    : 'bg-[#092F35]/45 border-white/12 text-[#F7F4EC]/85 hover:bg-[#092F35]/80 hover:border-white/25'
                }`}
              >
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-lg shrink-0 transition-colors ${
                    isActive
                      ? 'bg-[#FFD84A] text-[#092F35]'
                      : 'bg-white/10 text-[#FFD84A]'
                  }`}
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2 text-[11px]">
                    <span className="font-semibold tabular-nums text-[#FFD84A]">
                      {feature.index}
                    </span>
                    <span className="text-[#F7F4EC]/55 truncate">{catLabel}</span>
                  </div>
                  <h3 className="mt-1 text-sm font-semibold text-[#F7F4EC] truncate">
                    {localized.title}
                  </h3>
                  <p className="mt-0.5 text-xs text-[#F7F4EC]/65 truncate">
                    {localized.shortTag}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Interactive Preview Panel */}
        <div className="lg:col-span-5 lg:sticky lg:top-24">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeFeature.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="rounded-2xl border border-white/15 bg-[#092F35] p-6 md:p-7 shadow-2xl"
            >
              <div className="flex items-center justify-between gap-4 border-b border-white/12 pb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FFD84A] text-[#092F35] shrink-0">
                    <ActiveIcon className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#FFD84A] tabular-nums">
                      {dict.ecosystem.featurePrefix} {activeFeature.index} · {activeCategoryLabel}
                    </p>
                    <h3 className="text-lg md:text-xl font-semibold text-[#F7F4EC]">
                      {activeLocalized.title}
                    </h3>
                  </div>
                </div>
              </div>

              <p className="mt-5 text-[15px] leading-[1.7] text-[#F7F4EC]/85">
                {activeLocalized.description}
              </p>

              {/* Unique Feature Preview Visual State */}
              <div className="mt-5 rounded-xl border border-white/12 bg-[#0A3A47] p-4">
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="text-xs font-semibold text-[#F7F4EC]">
                    {activeLocalized.previewHeadline}
                  </span>
                  <span className="text-[11px] text-[#F7F4EC]/60 shrink-0">
                    {dict.ecosystem.interactivePreview}
                  </span>
                </div>

                <FeatureUniqueVisual feature={activeFeature} dict={dict} />

                <ul className="mt-4 space-y-1.5 border-t border-white/10 pt-3 text-xs text-[#F7F4EC]/75">
                  {activeLocalized.previewItems.map((item, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      <span
                        className="h-1 w-1 rounded-full bg-[#FFD84A] shrink-0"
                        aria-hidden="true"
                      />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <p className="mt-4 text-xs text-[#FFD84A]/90">{activeLocalized.highlightNote}</p>

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <Button
                  href={activeFeature.actionHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  variant="primary"
                  size="md"
                  className="w-full sm:w-auto"
                >
                  <span>{activeLocalized.actionLabel}</span>
                  <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                </Button>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
