import React from 'react';
import { ArrowUpRight } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { COMPANY_INFO, TYPOGRAPHY_SCALE } from '../theme/tokens';
import { usePageSeo } from '../hooks/usePageSeo';
import { AnimatedBackground } from '../components/AnimatedBackground';
import { AppEcosystemExplorer } from '../components/AppEcosystemExplorer';
import { Button } from '../components/Button';
import { LocalIndiaNetwork } from '../components/LocalIndiaNetwork';
import { MaataBusinessShowcase } from '../components/MaataBusinessShowcase';
import { SectionHeading } from '../components/SectionHeading';

export const AppEcosystemPage: React.FC = () => {
  const { dict } = useLanguage();
  usePageSeo(dict.meta.app);

  return (
    <>
      <section className="relative overflow-hidden bg-[#0F4C5C] text-[#F7F4EC] py-16 md:py-22">
        <AnimatedBackground variant="hero" />
        <div className="relative z-10 mx-auto max-w-[1280px] px-6">
          <p className="text-xs font-medium tracking-[0.12em] uppercase text-[#FFD84A]">
            {dict.appPage.heroEyebrow}
          </p>
          <h1 className={`${TYPOGRAPHY_SCALE.heroHeadline} mt-4 max-w-4xl`}>
            {dict.appPage.heroTitle}{' '}
            <span className="font-editorial italic font-medium text-[#FFD84A]">
              {dict.appPage.heroSerifAccent}
            </span>
          </h1>
          <p className="mt-6 max-w-2xl text-base md:text-[17px] leading-[1.75] text-[#F7F4EC]/85">
            {dict.appPage.heroDescription}
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Button
              href={COMPANY_INFO.appUrl}
              target="_blank"
              rel="noopener noreferrer"
              variant="primary"
              size="lg"
            >
              <span>{dict.appPage.visitAppCta}</span>
              <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        </div>
      </section>

      <section id="ecosystem" className="bg-[#0F4C5C] text-[#F7F4EC] pb-20 pt-8 border-t border-white/10">
        <div className="mx-auto max-w-[1280px] px-6">
          <AppEcosystemExplorer />
        </div>
      </section>

      <section
        id="business"
        className="overflow-x-clip bg-[#F7F4EC] text-[#092F35] py-14 md:py-16 border-b border-[#092F35]/10"
      >
        <div className="mx-auto max-w-[1140px] px-6">
          <div className="mb-8 md:mb-10 grid grid-cols-1 gap-4 lg:grid-cols-12 lg:items-end lg:gap-8">
            <div className="lg:col-span-7">
              <SectionHeading
                kicker={dict.appPage.businessKicker}
                title={dict.appPage.businessTitle}
                serifAccent={dict.appPage.businessSerifAccent}
                tone="dark"
                className="max-w-none"
              />
            </div>
            <div className="lg:col-span-5 lg:pb-1">
              <p className="text-[15px] leading-[1.68] text-[#092F35]/78">
                {dict.home.businessDescription}
              </p>
            </div>
          </div>
          <MaataBusinessShowcase />
        </div>
      </section>

      <section id="local-india" className="bg-[#0A3A47] text-[#F7F4EC] py-20">
        <div className="mx-auto max-w-[1280px] px-6">
          <div className="mb-12">
            <SectionHeading
              kicker={dict.appPage.localIndiaKicker}
              title={dict.appPage.localIndiaTitle}
              serifAccent={dict.appPage.localIndiaSerifAccent}
              tone="light"
            />
          </div>
          <LocalIndiaNetwork />
        </div>
      </section>
    </>
  );
};
