import React, { useState } from 'react';
import { BRAND_ASSETS, BrandAssetConfig } from '../config/brandAssets';

interface BrandAssetImageProps {
  assetId: Exclude<BrandAssetConfig['id'], 'logo'>;
  altOverride?: string;
  className?: string;
  priority?: boolean;
  tone?: 'light' | 'dark';
  borderless?: boolean;
}

/**
 * Displays the exact uploaded founder photographs without distortion or cropping
 * facial identities. Uses object-fit: cover / contain with curated focal points.
 */
export const BrandAssetImage: React.FC<BrandAssetImageProps> = ({
  assetId,
  altOverride,
  className = '',
  priority = false,
  tone = 'light',
  borderless = false,
}) => {
  const [failed, setFailed] = useState(false);
  const asset = BRAND_ASSETS[assetId];
  const resolvedAlt = altOverride || asset.alt;

  const isContain = asset.fitMode === 'contain';

  const frameClass = borderless
    ? 'bg-transparent'
    : tone === 'dark'
      ? 'bg-[#0A3A47] border border-white/12'
      : isContain
        ? 'bg-[#F7F4EC] border border-[#092F35]/10'
        : 'bg-[#092F35] border border-[#092F35]/12';

  return (
    <div className={`relative overflow-hidden ${asset.aspectClass} ${frameClass} ${className}`}>
      {!failed ? (
        <img
          src={asset.src}
          alt={resolvedAlt}
          referrerPolicy="no-referrer"
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          style={{ objectPosition: asset.objectPosition }}
          onError={() => setFailed(true)}
          className={`h-full w-full ${
            isContain ? 'object-contain p-2' : 'object-cover'
          } transition-transform duration-500 ease-out`}
        />
      ) : (
        <div
          className={`flex h-full w-full flex-col items-center justify-center p-8 text-center ${
            tone === 'dark'
              ? 'bg-[#0A3A47] text-[#F7F4EC]'
              : 'bg-[#F7F4EC] text-[#092F35]'
          }`}
          role="img"
          aria-label={resolvedAlt}
        >
          <p className="text-sm font-medium">{asset.caption}</p>
        </div>
      )}
    </div>
  );
};
