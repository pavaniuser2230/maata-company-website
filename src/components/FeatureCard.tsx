import React from 'react';
import { EcosystemFeature } from '../data/corporateContent';

interface FeatureCardProps {
  feature: EcosystemFeature;
  tone?: 'dark' | 'light';
}

export const FeatureCard: React.FC<FeatureCardProps> = ({
  feature,
  tone = 'dark',
}) => {
  const isDark = tone === 'dark';

  return (
    <article
      className={`flex flex-col justify-between rounded-2xl p-6 md:p-8 border transition-colors duration-200 ${
        isDark
          ? 'bg-[#092F35]/70 border-white/12 hover:border-[#FFD84A]/40'
          : 'bg-white border-[#092F35]/12 hover:border-[#0F8A5F]/40'
      }`}
    >
      <div>
        <div className="flex items-baseline justify-between gap-4">
          <span
            className={`text-xs font-semibold tracking-[0.12em] tabular-nums ${
              isDark ? 'text-[#FFD84A]' : 'text-[#0F8A5F]'
            }`}
          >
            {feature.index}.
          </span>
          <span
            className={`text-xs ${
              isDark ? 'text-[#F7F4EC]/60' : 'text-[#092F35]/60'
            }`}
          >
            {feature.category}
          </span>
        </div>

        <h3
          className={`mt-3 text-xl md:text-2xl font-semibold tracking-tight ${
            isDark ? 'text-[#F7F4EC]' : 'text-[#092F35]'
          }`}
        >
          {feature.title}
        </h3>

        <p
          className={`mt-2 text-sm font-medium ${
            isDark ? 'text-[#FFD84A]/90' : 'text-[#0F4C5C]'
          }`}
        >
          {feature.shortTag}
        </p>

        <p
          className={`mt-4 text-[15px] leading-[1.7] ${
            isDark ? 'text-[#F7F4EC]/80' : 'text-[#092F35]/75'
          }`}
        >
          {feature.description}
        </p>
      </div>
    </article>
  );
};
