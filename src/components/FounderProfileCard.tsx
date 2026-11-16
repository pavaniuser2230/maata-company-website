import React from 'react';
import { FounderProfile } from '../data/corporateContent';
import { useLanguage } from '../context/LanguageContext';
import { BrandAssetImage } from './BrandAssetImage';

interface FounderProfileCardProps {
  founder: FounderProfile;
}

export const FounderProfileCard: React.FC<FounderProfileCardProps> = ({ founder }) => {
  const { dict } = useLanguage();

  return (
    <article className="flex flex-col rounded-2xl border border-[#092F35]/12 bg-white overflow-hidden">
      <div className="p-4 pb-0">
        <BrandAssetImage
          assetId={founder.assetId}
          tone="light"
          className="rounded-xl"
        />
      </div>

      <div className="flex flex-1 flex-col justify-between p-6 md:p-7">
        <div>
          <p className="text-xs font-medium text-[#0F8A5F]">
            {founder.originNote}
          </p>

          <h3 className="mt-2 text-2xl font-semibold tracking-tight text-[#092F35]">
            {founder.name}
          </h3>
          <p className="mt-0.5 text-sm font-medium text-[#0F4C5C]">
            {founder.role}
          </p>

          <p className="mt-4 text-[15px] leading-[1.7] text-[#092F35]/80">
            {founder.bio}
          </p>

          <blockquote className="mt-6 border-y border-[#092F35]/10 py-4 font-editorial italic text-base leading-relaxed text-[#092F35]">
            “{founder.perspectiveQuote}”
          </blockquote>
        </div>

        <div className="mt-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#092F35]/55 mb-3">
            {dict.founders.keyResponsibilities}
          </p>
          <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 text-xs md:text-[13px] text-[#092F35]/80">
            {founder.responsibilities.map((item) => (
              <li key={item} className="flex items-start gap-2">
                <span
                  className="mt-1.5 h-1.5 w-1.5 rounded-full bg-[#0F8A5F] shrink-0"
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
