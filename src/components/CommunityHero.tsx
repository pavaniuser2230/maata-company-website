import React, { useState } from 'react';
import {
  ArrowRight,
  Briefcase,
  MapPin,
  MessageCircle,
  PhoneCall,
  PlayCircle,
  ShoppingCart,
  Users,
  Wrench,
} from 'lucide-react';
import { motion } from 'motion/react';
import { EDITORIAL_SCENES } from '../config/brandAssets';
import { useLanguage } from '../context/LanguageContext';
import { usePublicCms } from '../context/PublicCmsContext';
import { Button } from './Button';
import { MaataLogo } from './MaataLogo';

interface ConnectedNode {
  id: 'chat' | 'voice' | 'shopping' | 'jobs' | 'services' | 'maps' | 'communities';
  label: string;
  detail: string;
  icon: React.ComponentType<{ className?: string }>;
  offsetClass: string;
}

const NODE_META: {
  id: ConnectedNode['id'];
  icon: React.ComponentType<{ className?: string }>;
  offsetClass: string;
}[] = [
  { id: 'chat', icon: MessageCircle, offsetClass: 'md:-translate-y-1' },
  { id: 'voice', icon: PhoneCall, offsetClass: 'md:translate-y-4' },
  { id: 'shopping', icon: ShoppingCart, offsetClass: 'md:translate-y-6' },
  { id: 'jobs', icon: Briefcase, offsetClass: 'md:translate-y-4' },
  { id: 'services', icon: Wrench, offsetClass: 'md:translate-y-1' },
  { id: 'maps', icon: MapPin, offsetClass: 'md:-translate-y-4' },
  { id: 'communities', icon: Users, offsetClass: 'md:-translate-y-9' },
];

export const CommunityHero: React.FC = () => {
  const [imageError, setImageError] = useState(false);
  const [activeNodeId, setActiveNodeId] = useState<ConnectedNode['id']>('chat');
  const { dict, localizePath, language } = useLanguage();
  const { companySections } = usePublicCms();

  const connectedNodes: ConnectedNode[] = NODE_META.map((m) => ({
    ...m,
    label: dict.hero.nodes[m.id].label,
    detail: dict.hero.nodes[m.id].detail,
  }));

  const activeNode =
    connectedNodes.find((node) => node.id === activeNodeId) || connectedNodes[0];

  const heroSupportingText =
    language === 'en'
      ? companySections.about.heroSupportingText || dict.hero.supportingText
      : companySections.about.heroSupportingText || dict.hero.supportingText;

  return (
    <section
      aria-label={dict.hero.sectionAria}
      className="relative overflow-hidden bg-[#092F35] text-[#F7F4EC]"
    >
      {/* Layered Cinematic Gradient Backdrop & Radial Glows */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_72%_38%,rgba(15,138,95,0.28)_0%,rgba(15,76,92,0.14)_45%,rgba(9,47,53,0)_75%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 left-[18%] h-80 w-80 rounded-full opacity-20 blur-3xl"
        style={{
          background:
            'radial-gradient(circle, rgba(255,216,74,0.22) 0%, rgba(15,76,92,0.05) 70%, transparent 100%)',
        }}
      />

      {/* Desktop Full-Bleed Right Human-Centered Community Composition */}
      <div
        aria-hidden="true"
        className="pointer-events-none hidden lg:block absolute inset-y-0 right-0 w-[62%] overflow-hidden"
      >
        {!imageError ? (
          <img
            src={EDITORIAL_SCENES.communityHero.src}
            alt=""
            referrerPolicy="no-referrer"
            loading="eager"
            decoding="async"
            onError={() => setImageError(true)}
            className="h-full w-full object-cover object-[58%_20%]"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-[#0F4C5C] via-[#0B5D4B] to-[#092F35]" />
        )}

        {/* Feathered edge blending into #092F35 midnight teal canvas */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#092F35] via-[#092F35]/65 via-25% to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#092F35] via-[#092F35]/20 via-25% to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#092F35]/65 via-transparent via-18% to-transparent" />
      </div>

      {/* Subtle Indian Small-Town & Coconut Palm Silhouette Layer (Bottom Left) */}
      <svg
        aria-hidden="true"
        viewBox="0 0 720 150"
        preserveAspectRatio="xMinYMax meet"
        className="pointer-events-none hidden md:block absolute bottom-0 left-0 z-10 w-[56%] max-w-[680px] h-auto opacity-35"
      >
        <defs>
          <linearGradient id="townSilhouetteGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#041A1E" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#041A1E" stopOpacity="1" />
          </linearGradient>
        </defs>
        {/* Distant hills */}
        <path
          d="M0 150 L0 108 Q95 72 195 102 T410 92 T620 112 L720 132 L720 150 Z"
          fill="#062328"
        />
        {/* Tiled houses and neighbourhood roofs */}
        <g fill="url(#townSilhouetteGrad)">
          <path d="M58 122 L78 102 L98 122 L98 145 L58 145 Z" />
          <path d="M126 116 L154 96 L182 116 L182 145 L126 145 Z" />
          <path d="M236 124 L256 108 L276 124 L276 145 L236 145 Z" />
          <path d="M312 120 L338 100 L364 120 L364 145 L312 145 Z" />
          {/* Coconut palms */}
          <path d="M36 145 Q38 102 32 74" stroke="#041A1E" strokeWidth="3.5" fill="none" />
          <path d="M32 74 Q14 68 8 82 M32 74 Q18 58 24 48 M32 74 Q46 58 54 68 M32 74 Q50 76 54 88" stroke="#041A1E" strokeWidth="2.2" fill="none" />
          <path d="M206 145 Q212 108 208 82" stroke="#041A1E" strokeWidth="3" fill="none" />
          <path d="M208 82 Q192 76 186 88 M208 82 Q200 66 206 58 M208 82 Q222 68 230 78 M208 82 Q224 84 228 96" stroke="#041A1E" strokeWidth="2" fill="none" />
          <path d="M394 145 Q400 114 396 92" stroke="#041A1E" strokeWidth="2.8" fill="none" />
          <path d="M396 92 Q382 88 377 98 M396 92 Q392 78 398 72 M396 92 Q410 80 416 88" stroke="#041A1E" strokeWidth="1.9" fill="none" />
        </g>
      </svg>

      {/* Main Split Content Container */}
      <div className="relative z-20 mx-auto max-w-[1280px] px-6 pt-12 pb-8 lg:pt-16 lg:pb-16">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-center">
          {/* Left Column: Corporate Identity, Headline, Supporting Copy & CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-6 lg:pr-6"
          >
            {/* Untouched Original MAATA Logo + Requested Eyebrow */}
            <div className="flex flex-wrap items-center gap-3.5">
              <MaataLogo tone="light" size="md" showWordmark={false} />
              <p className="flex flex-wrap items-center gap-2 text-xs font-medium tracking-[0.13em] uppercase text-[#FFD84A]">
                <span className="font-telugu text-base tracking-normal normal-case font-semibold">
                  మాట
                </span>
                <span aria-hidden="true">·</span>
                <span>{dict.hero.corporateIdentity}</span>
                <span aria-hidden="true">·</span>
                <span>{dict.hero.location}</span>
              </p>
            </div>

            {/* Hero Headline */}
            <h1 className="mt-6 max-w-xl text-[clamp(2.05rem,3.9vw,3.45rem)] leading-[1.12] tracking-tight font-semibold text-[#F7F4EC] [text-wrap:balance]">
              <span className="block tracking-tight">{dict.hero.headlineBrand}</span>
              <span className="mt-1.5 block font-editorial italic font-medium text-[#FFD84A]">
                {dict.hero.headlineItalic}
              </span>
            </h1>

            {/* Signature Warm Golden Accent Curve Under Headline */}
            <svg
              aria-hidden="true"
              viewBox="0 0 360 18"
              className="mt-3 w-64 sm:w-80 h-auto overflow-visible"
            >
              <path
                d="M 2 14 Q 145 2, 354 6"
                fill="none"
                stroke="#FFD84A"
                strokeWidth="2.8"
                strokeLinecap="round"
                opacity="0.92"
              />
            </svg>

            {/* Supporting Text */}
            <p className="mt-5 max-w-lg text-base md:text-[17px] leading-[1.72] text-[#F7F4EC]/90">
              {heroSupportingText}
            </p>

            {/* Dual CTA Buttons */}
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Button to={localizePath('/company')} variant="primary" size="lg">
                <span>{dict.hero.exploreCompanyCta}</span>
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Button>
              <Button to={localizePath('/app')} variant="ghost-light" size="lg">
                <PlayCircle className="h-4 w-4 text-[#FFD84A]" aria-hidden="true" />
                <span>{dict.hero.discoverMaataCta}</span>
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Button>
            </div>

            {/* Live Selected Connection Readout */}
            <div className="mt-8 max-w-lg border-t border-white/15 pt-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#FFD84A]">
                    {dict.hero.everydayConnectionPrefix} · {activeNode.label}
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-[#F7F4EC]/85">
                    {activeNode.detail}
                  </p>
                </div>
                <span className="text-xs font-medium text-[#F7F4EC]/60 whitespace-nowrap shrink-0 tabular-nums">
                  {String(connectedNodes.findIndex((n) => n.id === activeNode.id) + 1).padStart(
                    2,
                    '0'
                  )}{' '}
                  / {String(connectedNodes.length).padStart(2, '0')}
                </span>
              </div>
            </div>
          </motion.div>

          {/* Mobile / Tablet Human-Centered Image Frame */}
          <div className="lg:hidden relative rounded-2xl overflow-hidden border border-white/15 bg-[#0A3A47] aspect-[4/3]">
            {!imageError ? (
              <img
                src={EDITORIAL_SCENES.communityHero.src}
                alt={dict.hero.imageAlt}
                referrerPolicy="no-referrer"
                loading="eager"
                decoding="async"
                onError={() => setImageError(true)}
                className="h-full w-full object-cover object-[58%_20%]"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#0F4C5C] to-[#092F35] p-6 text-center">
                <p className="text-sm text-[#F7F4EC]/80">
                  {dict.hero.mobileFallbackCaption}
                </p>
              </div>
            )}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#092F35] via-transparent to-transparent opacity-80"
            />
          </div>

          {/* Desktop Right Spacer Preserving Unobstructed Faces & Scenery */}
          <div className="hidden lg:block lg:col-span-6 lg:min-h-[450px]" aria-hidden="true" />
        </div>

        {/* Connected Glowing Line + 7 Interactive Community Capability Icons */}
        <div className="relative mt-6 lg:mt-4 pt-4">
          {/* Glowing Golden-Emerald Curve SVG (Desktop Span) */}
          <svg
            aria-hidden="true"
            viewBox="0 0 1200 110"
            preserveAspectRatio="none"
            className="pointer-events-none hidden md:block absolute left-0 right-0 bottom-4 h-24 w-full overflow-visible"
          >
            <defs>
              <linearGradient id="heroCurveGlow" x1="0%" y1="50%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#0F8A5F" stopOpacity="0" />
                <stop offset="18%" stopColor="#0F8A5F" stopOpacity="0.65" />
                <stop offset="48%" stopColor="#FFD84A" stopOpacity="0.95" />
                <stop offset="85%" stopColor="#FFF6C9" stopOpacity="0.95" />
                <stop offset="100%" stopColor="#FFD84A" stopOpacity="0.7" />
              </linearGradient>
              <filter id="heroSoftGlow" x="-10%" y="-40%" width="120%" height="180%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            <path
              d="M 40 94 C 310 66, 560 98, 820 74 C 985 58, 1110 24, 1196 2"
              fill="none"
              stroke="url(#heroCurveGlow)"
              strokeWidth="2.5"
              filter="url(#heroSoftGlow)"
            />
            <path
              d="M 40 94 C 310 66, 560 98, 820 74 C 985 58, 1110 24, 1196 2"
              fill="none"
              stroke="#FFF8D6"
              strokeOpacity="0.6"
              strokeWidth="1"
            />
          </svg>

          {/* 7 Interactive Icon Nodes */}
          <div className="relative z-20 flex flex-wrap items-center justify-center md:justify-end gap-3 sm:gap-4 md:gap-5 lg:gap-7">
            {connectedNodes.map((node) => {
              const Icon = node.icon;
              const isActive = node.id === activeNodeId;
              return (
                <button
                  key={node.id}
                  type="button"
                  onMouseEnter={() => setActiveNodeId(node.id)}
                  onFocus={() => setActiveNodeId(node.id)}
                  onClick={() => setActiveNodeId(node.id)}
                  aria-pressed={isActive}
                  aria-label={`${node.label}: ${node.detail}`}
                  className={`group flex flex-col items-center gap-1.5 cursor-pointer transition-transform duration-200 focus-visible:outline-none ${node.offsetClass}`}
                >
                  <span
                    className={`flex h-12 w-12 items-center justify-center rounded-full border-2 transition-all duration-200 ${
                      isActive
                        ? 'scale-110 border-[#FFD84A] bg-[#0F4C5C] text-[#FFD84A] shadow-[0_0_22px_rgba(255,216,74,0.48)]'
                        : 'border-white/75 bg-[#092F35]/95 text-[#F7F4EC] shadow-[0_0_16px_rgba(15,138,95,0.45)] group-hover:scale-105 group-hover:border-[#FFD84A] group-hover:text-[#FFD84A]'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                  <span
                    className={`text-[11px] font-medium whitespace-nowrap transition-colors duration-200 ${
                      isActive ? 'text-[#FFD84A]' : 'text-[#F7F4EC]/75 group-hover:text-[#F7F4EC]'
                    }`}
                  >
                    {node.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};
