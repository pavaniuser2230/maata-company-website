import React from 'react';
import { ArrowUpRight } from 'lucide-react';
import { COMPANY_INFO, TYPOGRAPHY_SCALE } from '../theme/tokens';
import { EDITORIAL_SCENES } from '../config/brandAssets';
import { useLanguage } from '../context/LanguageContext';
import { usePublicCms } from '../context/PublicCmsContext';
import { usePageSeo } from '../hooks/usePageSeo';
import { AnimatedBackground } from '../components/AnimatedBackground';
import { Button } from '../components/Button';
import { CompanyHeroVisual } from '../components/CompanyHeroVisual';
import { FounderGalleryCarousel } from '../components/FounderGalleryCarousel';
import { FounderProfileCard } from '../components/FounderProfileCard';
import { JourneyTimeline } from '../components/JourneyTimeline';
import { SectionHeading } from '../components/SectionHeading';

export const CompanyPage: React.FC = () => {
  const { dict } = useLanguage();
  const { companySections } = usePublicCms();
  const { about, founders, vision_mission } = companySections;

  usePageSeo(dict.meta.company);

  return (
    <>
      <section className="relative overflow-hidden bg-[#092F35] text-[#F7F4EC] py-14 md:py-20">
        <AnimatedBackground variant="hero" />
        <div className="relative z-10 mx-auto max-w-[1280px] px-6">
          <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-12">
            <div className="lg:col-span-7">
              <p className="text-xs font-medium tracking-[0.12em] uppercase text-[#FFD84A]">
                <span className="font-telugu text-sm normal-case mr-2">{COMPANY_INFO.teluguWord}</span>
                · {dict.companyPage.heroEyebrowSuffix}
              </p>
              <h1 className={`${TYPOGRAPHY_SCALE.heroHeadline} mt-4 max-w-4xl`}>
                {about.companyName}:{' '}
                <span className="font-editorial italic font-medium text-[#FFD84A]">
                  {dict.companyPage.heroHeadlineItalic}
                </span>
              </h1>
              <p className="mt-6 max-w-2xl text-base md:text-[17px] leading-[1.75] text-[#F7F4EC]/80">
                {about.heroSupportingText || dict.companyPage.heroSupportingText}
              </p>
            </div>

            <div className="lg:col-span-5">
              <CompanyHeroVisual />
            </div>
          </div>
        </div>
      </section>

      {/* Why MAATA */}
      <section id="why-maata" className="bg-[#F7F4EC] text-[#092F35] py-20 border-b border-[#092F35]/10">
        <div className="mx-auto max-w-[1280px] px-6">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:items-center">
            <div className="lg:col-span-6">
              <SectionHeading
                kicker={dict.companyPage.whyMaataKicker}
                title={about.whyMaataHeadline}
                tone="dark"
              />
              <p className="mt-5 text-[15px] md:text-base leading-[1.75] text-[#092F35]/80">
                {about.whyMaataBody}
              </p>
            </div>
            <div className="lg:col-span-6">
              <figure className="rounded-2xl border border-[#092F35]/12 bg-white p-3">
                <img
                  src={EDITORIAL_SCENES.merchantCounter.src}
                  alt={dict.home.merchantCounterAlt || EDITORIAL_SCENES.merchantCounter.alt}
                  referrerPolicy="no-referrer"
                  className="aspect-[16/10] w-full rounded-xl object-cover"
                />
                <figcaption className="px-2 pt-3 pb-1 text-xs font-editorial italic text-[#092F35]/70">
                  {dict.home.merchantCounterCaption}
                </figcaption>
              </figure>
            </div>
          </div>
        </div>
      </section>

      {/* Leadership & Founders */}
      <section id="leadership" className="bg-white text-[#092F35] py-20 border-b border-[#092F35]/10">
        <div className="mx-auto max-w-[1280px] px-6">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-end pb-12 border-b border-[#092F35]/10">
            <div className="lg:col-span-6">
              <SectionHeading
                kicker={dict.companyPage.partnershipKicker}
                title={dict.companyPage.partnershipTitle}
                serifAccent={dict.companyPage.partnershipSerifAccent}
                tone="dark"
              />
            </div>
            <div className="lg:col-span-6">
              <p className="text-[15px] md:text-base leading-[1.75] text-[#092F35]/80">
                {dict.companyPage.partnershipSummary}
              </p>
            </div>
          </div>

          <div className="mt-12 pb-16 border-b border-[#092F35]/10">
            <FounderGalleryCarousel />
          </div>

          <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-2">
            {founders.map((founder) => (
              <FounderProfileCard key={founder.id} founder={founder} />
            ))}
          </div>
        </div>
      </section>

      {/* Vision, Mission & Journey */}
      <section id="vision" className="bg-[#F7F4EC] text-[#092F35] py-20">
        <div className="mx-auto max-w-[1280px] px-6 space-y-16">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            <div className="rounded-2xl border border-[#092F35]/12 bg-[#092F35] p-8 text-[#F7F4EC]">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#FFD84A]">
                {vision_mission.vision.label}
              </p>
              <p className="mt-4 font-editorial text-2xl leading-relaxed">
                “{vision_mission.vision.statement}”
              </p>
            </div>
            <div className="rounded-2xl border border-[#092F35]/12 bg-white p-8 text-[#092F35]">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#0F8A5F]">
                {vision_mission.mission.label}
              </p>
              <p className="mt-4 font-editorial text-2xl leading-relaxed">
                “{vision_mission.mission.statement}”
              </p>
            </div>
          </div>

          <div id="journey" className="space-y-8">
            <SectionHeading
              kicker={dict.companyPage.journeyKicker}
              title={dict.companyPage.journeyTitle}
              serifAccent={dict.companyPage.journeySerifAccent}
              tone="dark"
            />
            <JourneyTimeline />
            <div>
              <Button
                href={COMPANY_INFO.appUrl}
                target="_blank"
                rel="noopener noreferrer"
                variant="dark"
                size="md"
              >
                <span>{dict.companyPage.exploreAppCta}</span>
                <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
              </Button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};
