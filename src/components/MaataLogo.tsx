import React, { useState } from 'react';
import { BRAND_ASSETS } from '../config/brandAssets';

interface MaataLogoProps {
  tone?: 'light' | 'dark';
  size?: 'sm' | 'md' | 'lg';
  showWordmark?: boolean;
  className?: string;
}

/**
 * Displays the exact uploaded original MAATA logo asset directly without
 * redrawing, regenerating, or altering the mark.
 */
export const MaataLogo: React.FC<MaataLogoProps> = ({
  tone = 'light',
  size = 'md',
  showWordmark = true,
  className = '',
}) => {
  const [imageError, setImageError] = useState(false);
  const logoConfig = BRAND_ASSETS.logo;

  const sizeMap = {
    sm: { img: 'h-8 w-8', px: 32, text: 'text-base' },
    md: { img: 'h-10 w-10', px: 40, text: 'text-lg' },
    lg: { img: 'h-14 w-14', px: 56, text: 'text-2xl' },
  }[size];

  return (
    <span className={`inline-flex items-center gap-2.5 whitespace-nowrap shrink-0 ${className}`}>
      {!imageError && (
        <img
          src={logoConfig.src}
          alt={logoConfig.alt}
          width={sizeMap.px}
          height={sizeMap.px}
          referrerPolicy="no-referrer"
          loading="eager"
          decoding="async"
          onError={() => setImageError(true)}
          className={`${sizeMap.img} rounded-full bg-white object-contain p-0.5 shadow-sm select-none shrink-0`}
        />
      )}
      {showWordmark && (
        <span
          className={`font-semibold tracking-tight ${sizeMap.text} ${
            tone === 'light' ? 'text-[#F7F4EC]' : 'text-[#092F35]'
          }`}
        >
          MAATA
        </span>
      )}
    </span>
  );
};
