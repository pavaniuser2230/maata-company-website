import React from 'react';
import { ArrowUpRight, Mail, MapPin } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { usePublicCms } from '../context/PublicCmsContext';
import { formatMessage } from '../i18n';
import { COMPANY_INFO, TYPOGRAPHY_SCALE } from '../theme/tokens';
import { usePageSeo } from '../hooks/usePageSeo';
import { AnimatedBackground } from '../components/AnimatedBackground';
import { ContactForm } from '../components/ContactForm';
import { SectionHeading } from '../components/SectionHeading';
import { SocialPlatformIcon } from '../components/SocialPlatformIcon';
import { StayConnectedSection } from '../components/StayConnectedSection';

export const ContactPage: React.FC = () => {
  const { dict } = useLanguage();
  const { companySections } = usePublicCms();
  const contact = companySections.contact;

  const companyName = contact.companyName || COMPANY_INFO.companyName;
  const location = dict.footer.locationLabel || contact.location || COMPANY_INFO.location;
  const primaryEmail = contact.supportEmail || COMPANY_INFO.supportEmail;
  const secondaryEmail =
    contact.secondarySupportEmail || COMPANY_INFO.secondarySupportEmail;
  const appUrl = contact.appUrl || COMPANY_INFO.appUrl;
  const socialLinks =
    contact.socialLinks && contact.socialLinks.length > 0
      ? contact.socialLinks
      : COMPANY_INFO.socialLinks;

  usePageSeo(dict.meta.contact);

  return (
    <>
      <section className="relative overflow-hidden bg-[#092F35] text-[#F7F4EC] py-16 md:py-22">
        <AnimatedBackground variant="hero" />
        <div className="relative z-10 mx-auto max-w-[1280px] px-6">
          <p className="text-xs font-medium tracking-[0.12em] uppercase text-[#FFD84A]">
            {dict.contact.heroEyebrowPrefix} · {location}
          </p>
          <h1 className={`${TYPOGRAPHY_SCALE.heroHeadline} mt-4 max-w-3xl`}>
            {dict.contact.heroTitlePrefix}{' '}
            <span className="font-editorial italic font-medium text-[#FFD84A]">
              {dict.contact.heroSerifAccent}
            </span>
          </h1>
          <p className="mt-5 max-w-2xl text-base md:text-[17px] leading-[1.75] text-[#F7F4EC]/80">
            {dict.contact.heroDescription}
          </p>
        </div>
      </section>

      <section className="bg-[#F7F4EC] text-[#092F35] py-20">
        <div className="mx-auto max-w-[1280px] px-6">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:items-start">
            <div className="lg:col-span-5 space-y-5">
              <SectionHeading
                kicker={dict.contact.directChannelsKicker}
                title={companyName}
                tone="dark"
              />

              <div className="rounded-2xl border border-[#092F35]/12 bg-white p-6">
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-[#0F8A5F] mt-0.5 shrink-0" aria-hidden="true" />
                  <div>
                    <h3 className="text-sm font-semibold text-[#092F35]">
                      {dict.contact.headquartersTitle}
                    </h3>
                    <p className="mt-1 text-sm text-[#092F35]/75">{location}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-[#092F35]/12 bg-white p-6">
                <div className="flex items-start gap-3">
                  <Mail className="h-5 w-5 text-[#0F8A5F] mt-0.5 shrink-0" aria-hidden="true" />
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-[#092F35]">
                      {dict.contact.officialEmailTitle}
                    </h3>
                    <div className="mt-2 flex flex-col gap-1.5">
                      <a
                        href={`mailto:${primaryEmail}`}
                        className="inline-block text-sm font-medium text-[#0F4C5C] hover:text-[#0F8A5F] hover:underline break-all"
                      >
                        {primaryEmail}
                      </a>
                      <a
                        href={`mailto:${secondaryEmail}`}
                        className="inline-block text-sm font-medium text-[#0F4C5C] hover:text-[#0F8A5F] hover:underline break-all"
                      >
                        {secondaryEmail}
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-[#092F35]/12 bg-white p-6">
                <h3 className="text-sm font-semibold text-[#092F35] mb-3">
                  {dict.contact.officialSocialTitle}
                </h3>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {socialLinks.map((social) => (
                    <a
                      key={social.label}
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`${formatMessage(dict.a11y.followOnSocial, {
                        platform: social.label,
                      })} (${dict.a11y.opensInNewTab})`}
                      className="group flex items-center justify-between gap-2 rounded-xl border border-[#092F35]/12 bg-[#F7F4EC] px-3 py-2.5 text-xs font-semibold text-[#092F35] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#0F8A5F] hover:bg-white"
                    >
                      <span className="flex items-center gap-2 min-w-0">
                        <SocialPlatformIcon
                          platform={social.label}
                          className="h-4 w-4 text-[#0F4C5C] group-hover:text-[#0F8A5F] shrink-0"
                        />
                        <span className="truncate">{social.label}</span>
                      </span>
                      <ArrowUpRight
                        className="h-3.5 w-3.5 text-[#092F35]/45 group-hover:text-[#0F8A5F] shrink-0"
                        aria-hidden="true"
                      />
                    </a>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-[#092F35]/12 bg-white p-6 flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold text-[#092F35]">
                    {dict.contact.usingAppTitle}
                  </h3>
                  <p className="mt-1 text-sm text-[#092F35]/75">
                    {dict.contact.usingAppPrefix}{' '}
                    <a
                      href={appUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-[#0F4C5C] hover:underline"
                    >
                      maataapp.com
                    </a>
                    .
                  </p>
                </div>
                <a
                  href={appUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${dict.contact.openMaataDomainAria} (${dict.a11y.opensInNewTab})`}
                  className="rounded-lg border border-[#092F35]/15 p-2 text-[#092F35] hover:bg-[#092F35]/5 shrink-0"
                >
                  <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                </a>
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
