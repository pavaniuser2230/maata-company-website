import React from 'react';
import { FounderProfile } from '../data/corporateContent';
import { useLanguage } from '../context/LanguageContext';
import { BrandAssetImage } from './BrandAssetImage';

interface FounderProfileCardProps {
  founder: FounderProfile;
}

export const FounderProfileCard: React.FC<FounderProfileCardProps> = ({ founder }) => {
  const { dict } = useLanguage();
  const isCircularPortrait = founder.assetId === 'founderPavani';

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-[#092F35]/12 bg-white shadow-[0_8px_24px_-18px_rgba(9,47,53,0.22)]">
      {/* Compact, consistent portrait showcase band matching the co-founder medallion canvas */}
      <div className="flex items-center justify-center border-b border-[#092F35]/10 bg-[#F4F1ED] px-5 py-4 sm:py-5">
        <div className="h-[196px] w-[196px] sm:h-[212px] sm:w-[212px] md:h-[224px] md:w-[224px] lg:h-[256px] lg:w-[256px] shrink-0">
          <BrandAssetImage
            assetId={founder.assetId}
            tone="light"
            borderless={isCircularPortrait}
            className={isCircularPortrait ? 'h-full w-full rounded-full' : 'h-full w-full rounded-xl'}
          />
        </div>
      </div>

      {/* Compact, balanced editorial profile body */}
      <div className="flex flex-1 flex-col justify-between p-5 md:p-6">
        <div>
          <p className="text-xs font-medium text-[#0F8A5F]">
            {founder.originNote}
          </p>

          <h3 className="mt-1 text-[24px] lg:text-[26px] font-semibold tracking-tight leading-snug text-[#092F35]">
            {founder.name}
          </h3>
          <p className="mt-0.5 text-[15px] md:text-[16px] font-medium text-[#0F4C5C]">
            {founder.role}
          </p>

          <p className="mt-3 text-[15px] leading-[1.65] text-[#092F35]/80">
            {founder.bio}
          </p>

          <blockquote className="mt-4 border-y border-[#092F35]/10 py-3 font-editorial italic text-[15px] md:text-[16px] leading-[1.55] text-[#092F35]">
            “{founder.perspectiveQuote}”
          </blockquote>
        </div>

        <div className="mt-4">
          <p className="mb-2 text-xs font-semibold tracking-[0.06em] text-[#092F35]/60">
            {dict.founders.keyResponsibilities}
          </p>
          <ul className="grid grid-cols-1 gap-x-4 gap-y-1.5 sm:grid-cols-2 text-[14px] md:text-[14.5px] leading-[1.45] text-[#092F35]/82">
            {founder.responsibilities.map((item) => (
              <li key={item} className="flex items-start gap-2">
                <span
                  className="mt-[0.52em] h-1 w-2.5 rounded-xs bg-[#0F8A5F] shrink-0"
                  aria-hidden="true"
                />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </article>
  );
};
