import React from 'react';

interface AnimatedBackgroundProps {
  variant?: 'hero' | 'section';
  className?: string;
}

/**
 * Reusable atmospheric backdrop inspired by "THE MAATA CONNECTION":
 * subtle glowing points and fine connection arcs without heavy clutter.
 */
export const AnimatedBackground: React.FC<AnimatedBackgroundProps> = ({
  variant = 'section',
  className = '',
}) => {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
    >
      <div
        className="absolute -top-24 -right-24 h-96 w-96 rounded-full opacity-25 blur-3xl"
        style={{
          background:
            variant === 'hero'
              ? 'radial-gradient(circle, rgba(15,138,95,0.45) 0%, rgba(15,76,92,0.1) 65%, transparent 100%)'
              : 'radial-gradient(circle, rgba(255,216,74,0.16) 0%, rgba(15,76,92,0.06) 65%, transparent 100%)',
        }}
      />
      <div
        className="absolute -bottom-32 -left-24 h-80 w-80 rounded-full opacity-20 blur-3xl"
        style={{
          background:
            'radial-gradient(circle, rgba(255,216,74,0.22) 0%, rgba(11,93,75,0.12) 65%, transparent 100%)',
        }}
      />

      <svg
        className="absolute inset-0 h-full w-full opacity-[0.14]"
        viewBox="0 0 1200 600"
        preserveAspectRatio="xMidYMid slice"
        fill="none"
      >
        <path
          d="M-60 440 C 240 310, 480 510, 760 300 C 940 165, 1080 220, 1260 120"
          stroke="#FFD84A"
          strokeWidth="1"
          strokeDasharray="4 6"
        />
        <path
          d="M-40 210 C 260 110, 520 340, 820 190 C 990 105, 1110 210, 1250 280"
          stroke="#0F8A5F"
          strokeWidth="1.2"
        />
        <circle cx="240" cy="365" r="2.5" fill="#FFD84A" />
        <circle cx="760" cy="300" r="3" fill="#FFD84A" />
        <circle cx="820" cy="190" r="2.5" fill="#0F8A5F" />
        <circle cx="480" cy="245" r="2" fill="#F7F4EC" />
      </svg>
    </div>
  );
};
