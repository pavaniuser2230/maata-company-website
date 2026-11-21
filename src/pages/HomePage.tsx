import React from 'react';
import { ArrowRight, ArrowUpRight, Mail, MapPin } from 'lucide-react';
import { motion } from 'motion/react';
import { COMPANY_INFO } from '../theme/tokens';
import { EDITORIAL_SCENES } from '../config/brandAssets';
import { useLanguage } from '../context/LanguageContext';
import { usePublicCms } from '../context/PublicCmsContext';
import { formatMessage } from '../i18n';
import { usePageSeo } from '../hooks/usePageSeo';
import { AnimatedBackground } from '../components/AnimatedBackground';
import { AppEcosystemExplorer } from '../components/AppEcosystemExplorer';
import { BrandAssetImage } from '../components/BrandAssetImage';
import { Button } from '../components/Button';
import { CareersSection } from '../components/CareersSection';
import { CommunityHero } from '../components/CommunityHero';
import { ContactForm } from '../components/ContactForm';
import { FounderProfileCard } from '../components/FounderProfileCard';
import { JourneyTimeline } from '../components/JourneyTimeline';
import { LocalIndiaNetwork } from '../components/LocalIndiaNetwork';
import { MaataBusinessShowcase } from '../components/MaataBusinessShowcase';
import { NewsroomSection } from '../components/NewsroomSection';
import { SectionHeading } from '../components/SectionHeading';
import { SocialPlatformIcon } from '../components/SocialPlatformIcon';
import { StayConnectedSection } from '../components/StayConnectedSection';

export const HomePage: React.FC = () => {
  const { dict, language, localizePath } = useLanguage();
  const { companySections } = usePublicCms();
  const { about, story, founders, vision_mission, contact } = companySections;

  usePageSeo(dict.meta.home);

  return (
    <>
      {/* A. PEOPLE-FOCUSED CORPORATE HERO (#092F35) */}
      <CommunityHero />

      {/* B. WHY MAATA (#F7F4EC Warm Ivory Editorial) */}
      <motion.section
        initial={{ opacity: 0, y: 14 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.1 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className="bg-[#F7F4EC] text-[#092F35] py-20 md:py-24 border-b border-[#092F35]/10"
      >
        <div className="mx-auto max-w-[1280px] px-6">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:items-center">
            <div className="lg:col-span-6">
              <SectionHeading
                kicker={dict.home.whyMaataKicker}
                teluguAccent={dict.home.whyMaataAccent}
                title={about.whyMaataHeadline}
                tone="dark"
              />

              <div className="mt-6 space-y-5 text-[15px] md:text-base leading-[1.75] text-[#092F35]/80">
                <p>{about.whyMaataBody}</p>
                <p>{dict.home.whyMaataBody2}</p>
              </div>

              {/* Original Vector Illustration: Everyday Bridge */}
              <div className="mt-8 rounded-2xl border border-[#092F35]/12 bg-white p-5">
                <svg
                  viewBox="0 0 540 120"
                  className="w-full h-auto overflow-visible"
                  role="img"
                  aria-label={dict.home.bridgeIllustrationAria}
                >
                  <path
                    d="M 45 64 C 150 22, 240 100, 340 54 C 410 22, 460 72, 495 56"
                    fill="none"
                    stroke="#0F8A5F"
                    strokeWidth="2"
                    strokeDasharray="4 4"
                  />
                  {[
                    { x: 45, y: 64, label: dict.home.bridgeNodes.families },
                    { x: 158, y: 46, label: dict.home.bridgeNodes.shopkeepers },
                    { x: 270, y: 74, label: dict.home.bridgeNodes.workers },
                    { x: 382, y: 42, label: dict.home.bridgeNodes.drivers },
                    { x: 495, y: 56, label: dict.home.bridgeNodes.communities },
                  ].map((node, idx) => (
                    <g key={idx}>
                      <circle cx={node.x} cy={node.y} r="10" fill="#092F35" />
                      <circle cx={node.x} cy={node.y} r="4" fill="#FFD84A" />
                      <text
                        x={node.x}
                        y={node.y + 26}
                        textAnchor="middle"
                        fill="#092F35"
                        fontSize={language === 'en' ? '11' : '9.5'}
                        fontWeight="600"
                        fontFamily="Plus Jakarta Sans, sans-serif"
                      >
                        {node.label}
                      </text>
                    </g>
                  ))}
                </svg>
              </div>
            </div>

            <div className="lg:col-span-6 space-y-5">
              <figure className="rounded-2xl border border-[#092F35]/12 bg-white p-3">
                <div className="overflow-hidden rounded-xl aspect-[16/10] bg-[#EDE8DA]">
                  <img
                    src={EDITORIAL_SCENES.townDawn.src}
                    alt={dict.home.townDawnAlt || EDITORIAL_SCENES.townDawn.alt}
                    referrerPolicy="no-referrer"
                    loading="lazy"
                    className="h-full w-full object-cover"
                  />
                </div>
                <figcaption className="px-2 pt-3 pb-1 text-xs font-editorial italic text-[#092F35]/70">
                  {dict.home.townDawnCaption}
                </figcaption>
              </figure>

              <figure className="rounded-2xl border border-[#092F35]/12 bg-white p-3">
                <div className="overflow-hidden rounded-xl aspect-[16/10] bg-[#EDE8DA]">
                  <img
                    src={EDITORIAL_SCENES.merchantCounter.src}
                    alt={dict.home.merchantCounterAlt || EDITORIAL_SCENES.merchantCounter.alt}
                    referrerPolicy="no-referrer"
                    loading="lazy"
                    className="h-full w-full object-cover"
                  />
                </div>
                <figcaption className="px-2 pt-3 pb-1 text-xs font-editorial italic text-[#092F35]/70">
                  {dict.home.merchantCounterCaption}
                </figcaption>
              </figure>
            </div>
          </div>
        </div>
      </motion.section>

      {/* C. FOUNDER AND LEADERSHIP STORY (#FFFFFF White) */}
      <section className="bg-white text-[#092F35] py-20 md:py-24 border-b border-[#092F35]/10">
        <div className="mx-auto max-w-[1280px] px-6">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:items-center pb-16 border-b border-[#092F35]/10">
            <div className="lg:col-span-7">
              <figure className="rounded-2xl border border-[#092F35]/12 bg-[#092F35] p-3">
                <BrandAssetImage
                  assetId="foundersCombined"
                  altOverride={dict.home.foundersCombinedAlt}
                  tone="dark"
                  priority
                  className="rounded-xl"
                />
                <figcaption className="px-2 pt-3 pb-1 text-xs font-editorial italic text-[#F7F4EC]/75">
                  {dict.home.foundersCombinedCaption}
                </figcaption>
              </figure>
            </div>

            <div className="lg:col-span-5">
              <SectionHeading
                kicker={dict.home.foundersStoryKicker}
                title={story.headline}
                tone="dark"
              />
              <div className="mt-5 space-y-4 text-[15px] md:text-base leading-[1.75] text-[#092F35]/80">
                {story.paragraphs.map((p, idx) => (
                  <p key={idx}>{p}</p>
                ))}
              </div>
              <div className="mt-7">
                <Button to={localizePath('/company#leadership')} variant="dark" size="md">
                  <span>{dict.home.exploreLeadershipCta}</span>
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Button>
              </div>
            </div>
          </div>

          <div className="pt-10 md:pt-12 mx-auto max-w-[980px] grid grid-cols-1 gap-6 md:grid-cols-2">
            {founders.map((founder) => (
              <FounderProfileCard key={founder.id} founder={founder} />
            ))}
          </div>
        </div>
      </section>

      {/* D. MAATA DIGITAL ECOSYSTEM: 16-FEATURE INTERACTIVE EXPLORER (#0F4C5C) */}
      <section
        id="ecosystem"
        className="relative overflow-hidden bg-[#0F4C5C] text-[#F7F4EC] py-20 md:py-24"
      >
        <AnimatedBackground variant="section" />
        <div className="relative z-10 mx-auto max-w-[1280px] px-6">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between mb-12">
            <SectionHeading
              kicker={dict.home.ecosystemKicker}
              title={dict.home.ecosystemTitle}
              serifAccent={dict.home.ecosystemSerifAccent}
              description={dict.home.ecosystemDescription}
              tone="light"
            />
            <Button
              href={COMPANY_INFO.appUrl}
              target="_blank"
              rel="noopener noreferrer"
              variant="primary"
              size="md"
            >
              <span>{dict.home.openMaataAppCta}</span>
              <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>

          <AppEcosystemExplorer />
        </div>
      </section>

      {/* E. MAATA BUSINESS (#F7F4EC Warm Ivory) */}
      <section
        id="business"
        className="overflow-x-clip bg-[#F7F4EC] text-[#092F35] py-14 md:py-16 border-b border-[#092F35]/10"
      >
        <div className="mx-auto max-w-[1140px] px-6">
          <div className="mb-8 md:mb-10 grid grid-cols-1 gap-4 lg:grid-cols-12 lg:items-end lg:gap-8">
            <div className="lg:col-span-7">
              <SectionHeading
                kicker={dict.home.businessKicker}
                title={dict.home.businessTitle}
                serifAccent={dict.home.businessSerifAccent}
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

      {/* F. LOCAL INDIA SECTION (#0A3A47 Dark Teal) */}
      <section className="relative overflow-hidden bg-[#0A3A47] text-[#F7F4EC] py-20 md:py-24">
        <AnimatedBackground variant="section" />
        <div className="relative z-10 mx-auto max-w-[1280px] px-6">
          <div className="mb-12">
            <SectionHeading
              kicker={dict.home.localIndiaKicker}
              teluguAccent={dict.home.localIndiaAccent}
              title={dict.home.localIndiaTitle}
              serifAccent={dict.home.localIndiaSerifAccent}
              description={dict.home.localIndiaDescription}
              tone="light"
            />
          </div>

          <LocalIndiaNetwork />
        </div>
      </section>

      {/* G. COMPANY VISION AND MISSION (#FFFFFF White) */}
      <section className="bg-white text-[#092F35] py-20 md:py-24 border-b border-[#092F35]/10">
        <div className="mx-auto max-w-[1280px] px-6">
          <SectionHeading
            kicker={dict.home.visionKicker}
            title={dict.home.visionTitle}
            serifAccent={dict.home.visionSerifAccent}
            tone="dark"
          />

          <div className="mt-10 grid grid-cols-1 gap-8 md:grid-cols-2">
            <div className="rounded-2xl border border-[#092F35]/12 bg-[#092F35] p-8 md:p-10 text-[#F7F4EC]">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#FFD84A]">
                {vision_mission.vision.label}
              </p>
              <p className="mt-4 font-editorial text-2xl md:text-[28px] leading-[1.4]">
                “{vision_mission.vision.statement}”
              </p>
            </div>

            <div className="rounded-2xl border border-[#092F35]/12 bg-[#F7F4EC] p-8 md:p-10 text-[#092F35]">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#0F8A5F]">
                {vision_mission.mission.label}
              </p>
              <p className="mt-4 font-editorial text-2xl md:text-[28px] leading-[1.4]">
                “{vision_mission.mission.statement}”
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* H. COMPANY JOURNEY (#F7F4EC Warm Ivory) */}
      <section className="bg-[#F7F4EC] text-[#092F35] py-20 md:py-24 border-b border-[#092F35]/10">
        <div className="mx-auto max-w-[1280px] px-6">
          <div className="mb-12 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <SectionHeading
              kicker={dict.home.journeyKicker}
              title={dict.home.journeyTitle}
              serifAccent={dict.home.journeySerifAccent}
              description={dict.home.journeyDescription}
              tone="dark"
            />
          </div>

          <JourneyTimeline />
        </div>
      </section>

      {/* I. NEWSROOM (#FFFFFF White) */}
      <section className="bg-white text-[#092F35] py-20 md:py-24 border-b border-[#092F35]/10">
        <div className="mx-auto max-w-[1280px] px-6">
          <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <SectionHeading
              kicker={dict.home.newsroomKicker}
              title={dict.home.newsroomTitle}
              serifAccent={dict.home.newsroomSerifAccent}
              tone="dark"
            />
            <Button to={localizePath('/news')} variant="ghost-dark" size="md">
              <span>{dict.home.openFullNewsroomCta}</span>
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>

          <NewsroomSection />
        </div>
      </section>

      {/* J. CAREERS (#0F4C5C Deep Teal) */}
      <section className="relative overflow-hidden bg-[#0F4C5C] text-[#F7F4EC] py-20 md:py-24">
        <AnimatedBackground variant="section" />
        <div className="relative z-10 mx-auto max-w-[1280px] px-6">
          <div className="mb-12">
            <SectionHeading
              kicker={dict.home.careersKicker}
              title={dict.home.careersTitle}
              serifAccent={dict.home.careersSerifAccent}
              description={dict.home.careersDescription}
              tone="light"
            />
          </div>

          <CareersSection />
        </div>
      </section>

      {/* K. CONTACT AND COMMUNITY (#F7F4EC Warm Ivory) */}
      <section className="bg-[#F7F4EC] text-[#092F35] py-20 md:py-24">
        <div className="mx-auto max-w-[1280px] px-6">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:items-start">
            <div className="lg:col-span-5">
              <SectionHeading
                kicker={dict.home.contactKicker}
                title={dict.home.contactTitle}
                serifAccent={dict.home.contactSerifAccent}
                description={dict.home.contactDescription}
                tone="dark"
              />

              <div className="mt-8 rounded-2xl border border-[#092F35]/12 bg-white p-6 space-y-5">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#0F8A5F]">
                    {dict.home.headquartersLabel}
                  </p>
                  <p className="mt-1.5 text-base font-semibold text-[#092F35]">
                    {contact.companyName}
                  </p>
                  <p className="mt-1 flex items-center gap-2 text-sm text-[#092F35]/75">
                    <MapPin className="h-4 w-4 text-[#0F8A5F] shrink-0" aria-hidden="true" />
                    <span>{dict.footer.locationLabel || contact.location}</span>
                  </p>
                </div>

                <div className="border-t border-[#092F35]/10 pt-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#0F8A5F]">
                    {dict.home.officialEmailLabel}
                  </p>
                  <div className="mt-2 flex flex-col gap-2">
                    <a
                      href={`mailto:${contact.supportEmail || COMPANY_INFO.supportEmail}`}
                      className="inline-flex items-center gap-2 text-sm font-semibold text-[#0F4C5C] hover:text-[#0F8A5F] hover:underline w-fit"
                    >
                      <Mail className="h-4 w-4 shrink-0" aria-hidden="true" />
                      <span>{contact.supportEmail || COMPANY_INFO.supportEmail}</span>
                    </a>
                    <a
                      href={`mailto:${contact.secondarySupportEmail || COMPANY_INFO.secondarySupportEmail}`}
                      className="inline-flex items-center gap-2 text-sm font-semibold text-[#0F4C5C] hover:text-[#0F8A5F] hover:underline w-fit"
                    >
                      <Mail className="h-4 w-4 shrink-0" aria-hidden="true" />
                      <span>
                        {contact.secondarySupportEmail || COMPANY_INFO.secondarySupportEmail}
                      </span>
                    </a>
                  </div>
                </div>

                <div className="border-t border-[#092F35]/10 pt-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#0F8A5F] mb-2.5">
                    {dict.home.officialSocialLabel}
                  </p>
                  <div className="flex flex-wrap gap-2.5 text-xs font-semibold text-[#092F35]">
                    {(contact.socialLinks && contact.socialLinks.length > 0
                      ? contact.socialLinks
                      : COMPANY_INFO.socialLinks
                    ).map((social) => (
                      <a
                        key={social.label}
                        href={social.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`${formatMessage(dict.a11y.followOnSocial, {
                          platform: social.label,
                        })} (${dict.a11y.opensInNewTab})`}
                        className="group inline-flex items-center gap-2 rounded-lg border border-[#092F35]/15 bg-[#F7F4EC] px-3 py-1.5 transition-all duration-200 hover:-translate-y-0.5 hover:border-[#0F8A5F] hover:bg-white"
                      >
                        <SocialPlatformIcon
                          platform={social.label}
                          className="h-3.5 w-3.5 text-[#0F4C5C] group-hover:text-[#0F8A5F]"
                        />
                        <span>{social.label}</span>
                      </a>
                    ))}
                  </div>
                </div>

                <div className="border-t border-[#092F35]/10 pt-4 flex items-center justify-between gap-2">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#0F8A5F]">
                      {dict.home.existingAppLabel}
                    </p>
                    <a
                      href={contact.appUrl || COMPANY_INFO.appUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 inline-flex items-center gap-1 text-sm font-semibold text-[#0F4C5C] hover:underline"
                    >
                      <span>{contact.appUrl || COMPANY_INFO.appUrl}</span>
                      <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                    </a>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-7">
              <ContactForm tone="light" />
            </div>
          </div>
        </div>
      </section>

      <StayConnectedSection />
    </>
  );
};
