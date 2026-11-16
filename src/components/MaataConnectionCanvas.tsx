import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { EDITORIAL_SCENES } from '../config/brandAssets';
import { useLanguage } from '../context/LanguageContext';

const NETWORK_NODE_COORDS = [
  { id: 'shops' as const, x: 76, y: 82 },
  { id: 'people' as const, x: 324, y: 78 },
  { id: 'services' as const, x: 84, y: 244 },
  { id: 'towns' as const, x: 318, y: 242 },
];

export const MaataConnectionCanvas: React.FC = () => {
  const { dict, language } = useLanguage();
  const [activeStage, setActiveStage] = useState<number>(3);
  const [autoPlay, setAutoPlay] = useState<boolean>(true);
  const [sceneLoaded, setSceneLoaded] = useState<boolean>(true);

  const stages = dict.technology.canvas.stages;

  useEffect(() => {
    if (!autoPlay) return;
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mediaQuery.matches) return;

    const timer = window.setInterval(() => {
      setActiveStage((prev) => (prev + 1) % stages.length);
    }, 4200);

    return () => window.clearInterval(timer);
  }, [autoPlay, stages.length]);

  const current = stages[activeStage] ?? stages[0];

  const handleSelectStage = (stageId: number) => {
    setAutoPlay(false);
    setActiveStage(stageId);
  };

  return (
    <div className="relative flex flex-col justify-between h-full rounded-2xl overflow-hidden border border-white/15 bg-[#0A3A47] shadow-2xl">
      {/* Atmospheric photographic backdrop with deep measured scrim */}
      <div className="relative flex-1 min-h-[340px] flex flex-col justify-between p-6 md:p-7">
        {sceneLoaded && (
          <img
            src={EDITORIAL_SCENES.townDawn.src}
            alt={dict.home.townDawnAlt || EDITORIAL_SCENES.townDawn.alt}
            referrerPolicy="no-referrer"
            onError={() => setSceneLoaded(false)}
            className="absolute inset-0 h-full w-full object-cover opacity-25 mix-blend-luminosity"
          />
        )}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-b from-[#092F35]/90 via-[#0A3A47]/85 to-[#092F35]/95"
        />

        {/* Top header of visual stage */}
        <div className="relative z-10 flex items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div>
            <span className="text-[11px] font-medium tracking-[0.14em] uppercase text-[#FFD84A]">
              {dict.technology.canvas.title}
            </span>
            <p className="mt-0.5 text-xs text-[#F7F4EC]/70">
              {dict.technology.canvas.narrativeSubtitle}
            </p>
          </div>
          <span className="font-telugu text-lg font-semibold text-[#FFD84A] tabular-nums">
            {current.nativeAccent}
          </span>
        </div>

        {/* Central Interactive SVG Visualisation */}
        <div className="relative z-10 my-4 flex items-center justify-center">
          <svg
            viewBox="0 0 400 310"
            className="w-full max-w-[400px] h-auto overflow-visible"
            role="img"
            aria-label={`${dict.technology.canvas.title} ${current.index}: ${current.title}`}
          >
            <defs>
              <radialGradient id="maataWordGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#FFD84A" stopOpacity="0.95" />
                <stop offset="45%" stopColor="#FFD84A" stopOpacity="0.28" />
                <stop offset="100%" stopColor="#0F8A5F" stopOpacity="0" />
              </radialGradient>
              <linearGradient id="maataArcGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FFD84A" stopOpacity="0.85" />
                <stop offset="100%" stopColor="#0F8A5F" stopOpacity="0.75" />
              </linearGradient>
            </defs>

            {/* Ambient concentric rings (Expression waves) */}
            <motion.circle
              cx="200"
              cy="158"
              r="52"
              fill="none"
              stroke="#FFD84A"
              strokeWidth="0.9"
              strokeDasharray="3 5"
              initial={false}
              animate={{
                opacity: activeStage >= 1 ? 0.45 : 0.12,
                scale: activeStage >= 1 ? 1 : 0.72,
              }}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              style={{ transformOrigin: '200px 158px' }}
            />

            <motion.circle
              cx="200"
              cy="158"
              r="98"
              fill="none"
              stroke="#0F8A5F"
              strokeWidth="1"
              initial={false}
              animate={{
                opacity: activeStage >= 2 ? 0.55 : 0.08,
                scale: activeStage >= 2 ? 1 : 0.8,
              }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              style={{ transformOrigin: '200px 158px' }}
            />

            {/* Speech Bubble Contour (Stage 1+) */}
            <motion.path
              d="M 148 118 H 252 C 266 118 276 128 276 142 V 176 C 276 190 266 200 252 200 H 192 L 166 218 L 172 200 H 148 C 134 200 124 190 124 176 V 142 C 124 128 134 118 148 118 Z"
              fill="rgba(9, 47, 53, 0.55)"
              stroke="#FFD84A"
              strokeWidth="1.4"
              initial={false}
              animate={{
                opacity: activeStage >= 1 ? 1 : 0,
                scale: activeStage >= 1 ? 1 : 0.85,
              }}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              style={{ transformOrigin: '200px 158px' }}
            />

            {/* Flowing Connection Lines to Community Nodes (Stage 2+) */}
            {NETWORK_NODE_COORDS.map((node, idx) => {
              const ctrlX = node.x < 200 ? 135 : 265;
              const ctrlY = node.y < 158 ? 110 : 215;
              const nodeLabel = dict.technology.canvas.networkNodes[node.id];
              return (
                <g key={node.id}>
                  <motion.path
                    d={`M 200 158 Q ${ctrlX} ${ctrlY} ${node.x} ${node.y}`}
                    fill="none"
                    stroke="url(#maataArcGrad)"
                    strokeWidth="1.5"
                    initial={false}
                    animate={{
                      opacity: activeStage >= 2 ? 0.9 : 0,
                    }}
                    transition={{
                      duration: 0.4,
                      delay: idx * 0.06,
                      ease: [0.16, 1, 0.3, 1],
                    }}
                  />

                  {/* Outer Community Nodes (Stage 3) */}
                  <motion.g
                    initial={false}
                    animate={{
                      opacity: activeStage >= 3 ? 1 : activeStage === 2 ? 0.45 : 0,
                      scale: activeStage >= 3 ? 1 : 0.85,
                    }}
                    transition={{
                      duration: 0.35,
                      delay: idx * 0.05,
                      ease: [0.16, 1, 0.3, 1],
                    }}
                    style={{ transformOrigin: `${node.x}px ${node.y}px` }}
                  >
                    <circle
                      cx={node.x}
                      cy={node.y}
                      r="17"
                      fill="#092F35"
                      stroke="#0F8A5F"
                      strokeWidth="1.4"
                    />
                    <circle cx={node.x} cy={node.y} r="4.5" fill="#FFD84A" />
                    <text
                      x={node.x}
                      y={node.y < 158 ? node.y - 26 : node.y + 32}
                      textAnchor="middle"
                      fill="#F7F4EC"
                      fontSize={language === 'en' ? '11' : '10'}
                      fontWeight="500"
                      fontFamily="Plus Jakarta Sans, sans-serif"
                    >
                      {nodeLabel}
                    </text>
                  </motion.g>
                </g>
              );
            })}

            {/* Inter-node horizontal links at Ecosystem stage */}
            <motion.path
              d="M 76 82 C 160 44, 240 44, 324 78 M 84 244 C 160 282, 240 282, 318 242"
              fill="none"
              stroke="#F7F4EC"
              strokeOpacity="0.22"
              strokeWidth="1"
              strokeDasharray="3 4"
              initial={false}
              animate={{ opacity: activeStage >= 3 ? 1 : 0 }}
              transition={{ duration: 0.4 }}
            />

            {/* Central Glowing Spoken-Word Point */}
            <circle cx="200" cy="158" r="34" fill="url(#maataWordGlow)" />
            <circle cx="200" cy="158" r="6.5" fill="#FFD84A" />
            <text
              x="200"
              y="148"
              textAnchor="middle"
              fill="#F7F4EC"
              fontSize="14"
              fontWeight="600"
              fontFamily="Noto Sans Telugu, Plus Jakarta Sans, sans-serif"
              opacity={activeStage >= 1 ? 1 : 0.9}
            >
              మాట
            </text>
            <text
              x="200"
              y="182"
              textAnchor="middle"
              fill="#F7F4EC"
              fillOpacity="0.75"
              fontSize={language === 'en' ? '10' : '9'}
              letterSpacing={language === 'en' ? '1.6' : '0.4'}
              fontFamily="Plus Jakarta Sans, sans-serif"
            >
              {activeStage === 0
                ? dict.technology.canvas.spokenWordSvg
                : dict.technology.canvas.connectedIndiaSvg}
            </text>
          </svg>
        </div>

        {/* Stage Caption */}
        <div className="relative z-10 border-t border-white/10 pt-4">
          <div className="flex items-baseline justify-between gap-4">
            <h3 className="text-sm md:text-base font-semibold text-[#F7F4EC]">
              {current.index}. {current.title}
            </h3>
            <span className="text-xs font-medium text-[#FFD84A] whitespace-nowrap shrink-0">
              {current.label}
            </span>
          </div>
          <p className="mt-1.5 text-xs md:text-sm leading-relaxed text-[#F7F4EC]/75">
            {current.description}
          </p>
        </div>
      </div>

      {/* Interactive Stage Selector Bar */}
      <div
        className="grid grid-cols-2 sm:grid-cols-4 border-t border-white/12 bg-[#092F35]"
        role="tablist"
        aria-label={dict.technology.canvas.tablistAria}
      >
        {stages.map((stage) => {
          const isActive = stage.id === activeStage;
          return (
            <button
              key={stage.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => handleSelectStage(stage.id)}
              className={`px-2 py-3 text-center text-xs font-medium transition-colors duration-200 border-r last:border-r-0 border-white/10 whitespace-nowrap cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#FFD84A] ${
                isActive
                  ? 'bg-[#0F4C5C] text-[#FFD84A]'
                  : 'text-[#F7F4EC]/65 hover:text-[#F7F4EC] hover:bg-white/5'
              }`}
            >
              <span className="tabular-nums mr-1">{stage.index}.</span>
              <span>{stage.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
