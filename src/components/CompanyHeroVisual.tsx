import React, { useState } from 'react';
import { MessageCircle, Store, Users, Wrench } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { EDITORIAL_SCENES } from '../config/brandAssets';
import { useLanguage } from '../context/LanguageContext';

interface DigitalNode {
  id: 'businesses' | 'communication' | 'services' | 'community';
  label: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  cx: number;
  cy: number;
  positionClass: string;
}

const NODE_COORDS: {
  id: DigitalNode['id'];
  icon: React.ComponentType<{ className?: string }>;
  cx: number;
  cy: number;
  positionClass: string;
}[] = [
  { id: 'businesses', icon: Store, cx: 68, cy: 56, positionClass: 'left-[3%] top-[8%]' },
  {
    id: 'communication',
    icon: MessageCircle,
    cx: 220,
    cy: 34,
    positionClass: 'left-[36%] sm:left-[38%] top-[4%]',
  },
  { id: 'services', icon: Wrench, cx: 372, cy: 62, positionClass: 'right-[3%] top-[10%]' },
  {
    id: 'community',
    icon: Users,
    cx: 220,
    cy: 292,
    positionClass: 'left-[34%] sm:left-[36%] bottom-[5%]',
  },
];

export const CompanyHeroVisual: React.FC = () => {
  const [imageError, setImageError] = useState(false);
  const [activeNodeId, setActiveNodeId] = useState<DigitalNode['id']>('businesses');
  const shouldReduceMotion = useReducedMotion();
  const { dict } = useLanguage();

  const digitalNodes: DigitalNode[] = NODE_COORDS.map((c) => ({
    ...c,
    label: dict.companyHeroVisual.nodes[c.id].label,
    subtitle: dict.companyHeroVisual.nodes[c.id].subtitle,
  }));

  const activeNode =
    digitalNodes.find((node) => node.id === activeNodeId) || digitalNodes[0];

  return (
    <motion.div
      initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="relative mx-auto w-full max-w-[520px] lg:max-w-none select-none"
    >
      {/* Subtle emerald & warm gold ambient illumination behind visual */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -inset-6 rounded-full opacity-45 blur-3xl"
        style={{
          background:
            'radial-gradient(circle at 52% 48%, rgba(15,138,95,0.42) 0%, rgba(255,216,74,0.14) 42%, rgba(9,47,53,0) 74%)',
        }}
      />

      {/* Visual stage blended naturally into #092F35 (no rectangular frame or card border) */}
      <div className="relative aspect-[4/3] w-full overflow-hidden">
        {/* Subtle India-inspired radial lotus-geometric motif */}
        <svg
          aria-hidden="true"
          viewBox="0 0 440 330"
          className="pointer-events-none absolute inset-0 h-full w-full opacity-25"
        >
          <defs>
            <radialGradient id="indiaMotifGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#FFD84A" stopOpacity="0.35" />
              <stop offset="65%" stopColor="#0F8A5F" stopOpacity="0.16" />
              <stop offset="100%" stopColor="#092F35" stopOpacity="0" />
            </radialGradient>
          </defs>
          <circle cx="220" cy="165" r="142" fill="url(#indiaMotifGlow)" />
          <circle
            cx="220"
            cy="165"
            r="134"
            fill="none"
            stroke="#FFD84A"
            strokeOpacity="0.22"
            strokeWidth="0.9"
            strokeDasharray="3 6"
          />
          <circle
            cx="220"
            cy="165"
            r="102"
            fill="none"
            stroke="#0F8A5F"
            strokeOpacity="0.35"
            strokeWidth="0.9"
          />
          {/* Delicate 8-petal geometric contour */}
          <path
            d="M220 26 Q248 92 220 165 Q192 92 220 26 Z M220 304 Q248 238 220 165 Q192 238 220 304 Z M82 165 Q150 138 220 165 Q150 192 82 165 Z M358 165 Q290 138 220 165 Q290 192 358 165 Z"
            fill="none"
            stroke="#FFD84A"
            strokeOpacity="0.14"
            strokeWidth="0.8"
          />
        </svg>

        {/* Feathered photographic composition */}
        {!imageError ? (
          <img
            src={EDITORIAL_SCENES.companyHeroCommunity.src}
            alt={dict.companyHeroVisual.imageAlt}
            referrerPolicy="no-referrer"
            loading="eager"
            decoding="async"
            onError={() => setImageError(true)}
            className="h-full w-full object-cover object-center"
            style={{
              WebkitMaskImage:
                'radial-gradient(ellipse 84% 80% at 52% 50%, #000 50%, rgba(0,0,0,0.6) 72%, transparent 98%)',
              maskImage:
                'radial-gradient(ellipse 84% 80% at 52% 50%, #000 50%, rgba(0,0,0,0.6) 72%, transparent 98%)',
            }}
          />
        ) : (
          <div className="h-full w-full rounded-full bg-gradient-to-br from-[#0F4C5C]/60 via-[#0F8A5F]/25 to-transparent" />
        )}

        {/* Cinematic soft colour grading & edge dissolve into #092F35 */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 92% 88% at 52% 50%, transparent 45%, rgba(9,47,53,0.72) 82%, #092F35 100%)',
          }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#092F35]/90 via-transparent via-35% to-[#092F35]/55"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#092F35] via-transparent via-30% to-[#092F35]/60"
        />

        {/* Connected Glowing Lines & Gentle Travelling Pulses */}
        <svg
          aria-hidden="true"
          viewBox="0 0 440 330"
          className="pointer-events-none absolute inset-0 h-full w-full"
        >
          <defs>
            <linearGradient id="companyLineGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFD84A" stopOpacity="0.9" />
              <stop offset="50%" stopColor="#0F8A5F" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#FFD84A" stopOpacity="0.9" />
            </linearGradient>
            <filter id="companySoftGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Outer perimeter connecting arc framing the community scene */}
          <path
            d="M 68 56 Q 140 24 220 34 T 372 62 C 425 148, 360 278, 220 292 C 80 278, 20 148, 68 56 Z"
            fill="none"
            stroke="url(#companyLineGrad)"
            strokeOpacity="0.55"
            strokeWidth="1.4"
            filter="url(#companySoftGlow)"
          />
          <path
            d="M 68 56 Q 220 96 372 62"
            fill="none"
            stroke="#FFD84A"
            strokeOpacity="0.32"
            strokeWidth="1"
            strokeDasharray="4 6"
          />

          {/* Lightweight animated pulse along the connecting arc when motion is allowed */}
          {!shouldReduceMotion && (
            <motion.path
              d="M 68 56 Q 140 24 220 34 T 372 62 C 425 148, 360 278, 220 292 C 80 278, 20 148, 68 56 Z"
              fill="none"
              stroke="#FFD84A"
              strokeWidth="2"
              strokeLinecap="round"
              strokeDasharray="22 260"
              animate={{ strokeDashoffset: [0, -282] }}
              transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
              opacity="0.85"
            />
          )}

          {/* Subtle glowing anchor dots on SVG path */}
          {digitalNodes.map((node, index) => (
            <g key={node.id}>
              {!shouldReduceMotion && (
                <motion.circle
                  cx={node.cx}
                  cy={node.cy}
                  r="11"
                  fill="none"
                  stroke="#FFD84A"
                  strokeWidth="1"
                  initial={{ opacity: 0.2, scale: 0.85 }}
                  animate={{ opacity: [0.18, 0.52, 0.18], scale: [0.85, 1.15, 0.85] }}
                  transition={{
                    duration: 3.6,
                    delay: index * 0.7,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                  style={{ transformOrigin: `${node.cx}px ${node.cy}px` }}
                />
              )}
              <circle cx={node.cx} cy={node.cy} r="3.2" fill="#FFD84A" />
            </g>
          ))}
        </svg>

        {/* Interactive Subtle Digital Nodes */}
        {digitalNodes.map((node) => {
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
              aria-label={`${node.label}: ${node.subtitle}`}
              className={`absolute ${node.positionClass} z-20 flex items-center gap-1.5 sm:gap-2 rounded-full p-1 sm:px-2.5 sm:py-1.5 backdrop-blur-md transition-all duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFD84A] ${
                isActive
                  ? 'bg-[#092F35]/90 border border-[#FFD84A]/80 text-[#FFD84A] shadow-[0_0_20px_rgba(255,216,74,0.28)]'
                  : 'bg-[#092F35]/72 border border-white/20 text-[#F7F4EC]/90 hover:border-[#FFD84A]/60 hover:text-[#FFD84A]'
              }`}
            >
              <span
                className={`flex h-6 w-6 items-center justify-center rounded-full ${
                  isActive ? 'bg-[#FFD84A] text-[#092F35]' : 'bg-[#0F8A5F]/40 text-[#FFD84A]'
                }`}
              >
                <Icon className="h-3.5 w-3.5" aria-hidden="true" />
              </span>
              <span className="hidden sm:inline text-[11px] font-medium whitespace-nowrap pr-1">
                {node.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Subtle Unboxed Caption Under Visual */}
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 px-2 text-xs text-[#F7F4EC]/75">
        <p className="flex items-center gap-2">
          <span className="font-medium text-[#FFD84A]">{activeNode.label}</span>
          <span aria-hidden="true">·</span>
          <span>{activeNode.subtitle}</span>
        </p>
        <span className="font-telugu text-xs text-[#FFD84A]/85">
          మాట · {dict.companyHeroVisual.captionSuffix}
        </span>
      </div>
    </motion.div>
  );
};
