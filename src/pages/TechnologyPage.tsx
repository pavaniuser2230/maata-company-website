import React from 'react';
import { ArrowUpRight, Bot, Cpu, Lock, MapPin, ShieldCheck, Smartphone } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { COMPANY_INFO, TYPOGRAPHY_SCALE } from '../theme/tokens';
import { usePageSeo } from '../hooks/usePageSeo';
import { AnimatedBackground } from '../components/AnimatedBackground';
import { Button } from '../components/Button';
import { MaataConnectionCanvas } from '../components/MaataConnectionCanvas';
import { SectionHeading } from '../components/SectionHeading';

const PILLAR_ICONS = [Smartphone, MapPin, Bot, Lock];

export const TechnologyPage: React.FC = () => {
  const { dict, localizePath } = useLanguage();
  usePageSeo(dict.meta.technology);

  return (
    <>
      <section className="relative overflow-hidden bg-[#092F35] text-[#F7F4EC] py-16 md:py-22">
        <AnimatedBackground variant="hero" />
        <div className="relative z-10 mx-auto max-w-[1280px] px-6">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:items-center">
            <div className="lg:col-span-6">
              <p className="text-xs font-medium tracking-[0.12em] uppercase text-[#FFD84A]">
                {dict.technology.heroEyebrow}
              </p>
              <h1 className={`${TYPOGRAPHY_SCALE.heroHeadline} mt-4`}>
                {dict.technology.heroTitle}{' '}
                <span className="font-editorial italic font-medium text-[#FFD84A]">
                  {dict.technology.heroSerifAccent}
                </span>
              </h1>
              <p className="mt-6 text-base md:text-[17px] leading-[1.75] text-[#F7F4EC]/85">
                {dict.technology.heroDescription}
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Button to={localizePath('/app')} variant="primary" size="md">
                  <span>{dict.technology.explore16Cta}</span>
                </Button>
                <Button
                  href={COMPANY_INFO.appUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  variant="ghost-light"
                  size="md"
                >
                  <span>{dict.technology.visitAppCta}</span>
                  <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                </Button>
              </div>
            </div>
            <div className="lg:col-span-6">
              <MaataConnectionCanvas />
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#F7F4EC] text-[#092F35] py-20 border-b border-[#092F35]/10">
        <div className="mx-auto max-w-[1280px] px-6">
          <SectionHeading
            kicker={dict.technology.foundationsKicker}
            title={dict.technology.foundationsTitle}
            serifAccent={dict.technology.foundationsSerifAccent}
            tone="dark"
          />

          <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2">
            {dict.technology.pillars.map((pillar, idx) => {
              const Icon = PILLAR_ICONS[idx] ?? Smartphone;
              return (
                <article
                  key={pillar.index}
                  className="rounded-2xl border border-[#092F35]/12 bg-white p-7"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#092F35] text-[#FFD84A]">
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <span className="text-xs font-semibold tracking-[0.12em] text-[#0F8A5F] tabular-nums">
                      {pillar.index}.
                    </span>
                  </div>
                  <h2 className="mt-4 text-xl font-semibold text-[#092F35]">{pillar.title}</h2>
                  <p className="mt-2.5 text-[15px] leading-[1.7] text-[#092F35]/75">
                    {pillar.description}
                  </p>
                </article>
              );
            })}
          </div>

          <div className="mt-12 rounded-2xl border border-[#092F35]/12 bg-[#092F35] p-8 md:p-10 text-[#F7F4EC] grid grid-cols-1 gap-6 md:grid-cols-12 md:items-center">
            <div className="md:col-span-8">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#FFD84A]">
                <Cpu className="h-4 w-4" aria-hidden="true" />
                <span>{dict.technology.separationKicker}</span>
              </div>
              <h3 className="mt-2 text-2xl font-semibold">
                {dict.technology.separationTitle}
              </h3>
              <p className="mt-3 text-sm md:text-[15px] leading-relaxed text-[#F7F4EC]/80">
                {dict.technology.separationBody}
              </p>
            </div>
            <div className="md:col-span-4 flex md:justify-end">
              <div className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-[#0A3A47] px-4 py-3 text-xs font-medium text-[#FFD84A]">
                <ShieldCheck className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>{dict.technology.taglineBadge}</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};
