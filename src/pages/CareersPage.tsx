import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { usePublicCms } from '../context/PublicCmsContext';
import { TYPOGRAPHY_SCALE } from '../theme/tokens';
import { usePageSeo } from '../hooks/usePageSeo';
import { AnimatedBackground } from '../components/AnimatedBackground';
import { CareersSection } from '../components/CareersSection';

export const CareersPage: React.FC = () => {
  const { dict } = useLanguage();
  const { companySections } = usePublicCms();
  usePageSeo(dict.meta.careers);

  return (
    <>
      <section className="relative overflow-hidden bg-[#092F35] text-[#F7F4EC] py-16 md:py-22">
        <AnimatedBackground variant="hero" />
        <div className="relative z-10 mx-auto max-w-[1280px] px-6">
          <p className="text-xs font-medium tracking-[0.12em] uppercase text-[#FFD84A]">
            {dict.careers.heroEyebrowPrefix} · {dict.footer.locationLabel}
          </p>
          <h1 className={`${TYPOGRAPHY_SCALE.heroHeadline} mt-4 max-w-3xl`}>
            {dict.careers.heroTitlePrefix}{' '}
            <span className="font-editorial italic font-medium text-[#FFD84A]">
              {dict.careers.heroSerifAccent}
            </span>
          </h1>
          <p className="mt-5 max-w-2xl text-base md:text-[17px] leading-[1.75] text-[#F7F4EC]/80">
            {companySections.careers.intro || dict.careers.heroDescription}
          </p>
        </div>
      </section>

      <section className="relative overflow-hidden bg-[#0F4C5C] text-[#F7F4EC] py-20">
        <AnimatedBackground variant="section" />
        <div className="relative z-10 mx-auto max-w-[1280px] px-6">
          <CareersSection />
        </div>
      </section>
    </>
  );
};
