import React from 'react';
import { ArrowUpRight, Mail, MapPin } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { usePublicCms } from '../context/PublicCmsContext';
import { formatMessage } from '../i18n';
import { COMPANY_INFO, TYPOGRAPHY_SCALE } from '../theme/tokens';
import { SocialPlatformIcon } from './SocialPlatformIcon';

export const StayConnectedSection: React.FC = () => {
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

  return (
    <section
      aria-labelledby="stay-connected-heading"
      className="relative overflow-hidden bg-[#092F35] text-[#F7F4EC] py-20 border-t border-white/10"
    >
      {/* Subtle geometric accent */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-28 -top-28 h-80 w-80 rounded-full border border-[#FFD84A]/15"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-24 -bottom-24 h-72 w-72 rounded-full border border-[#0F8A5F]/20"
      />

      <div className="relative z-10 mx-auto max-w-[1280px] px-6">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#FFD84A]">
            {dict.stayConnected.kickerPrefix} · {companyName}
          </p>
          <h2 id="stay-connected-heading" className={`${TYPOGRAPHY_SCALE.sectionHeadline} mt-3`}>
            {dict.stayConnected.headingLead}{' '}
            <span className="font-editorial italic font-medium text-[#FFD84A]">
              {dict.stayConnected.headingAccent}
            </span>
          </h2>
          <p className="mt-3 text-base md:text-[17px] leading-relaxed text-[#F7F4EC]/80">
            {dict.stayConnected.subtitle}
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Official Email & Support + Headquarters Card */}
          <div className="lg:col-span-5 rounded-2xl border border-white/14 bg-[#0A3A47]/80 p-7 flex flex-col justify-between">
            <div className="space-y-6">
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-[#FFD84A]">
                  {dict.stayConnected.officialEmailTitle}
                </h3>
                <div className="mt-3.5 space-y-3">
                  <a
                    href={`mailto:${primaryEmail}`}
                    className="group flex items-center justify-between gap-3 rounded-xl border border-white/12 bg-[#092F35]/80 px-4 py-3 text-sm font-medium text-[#F7F4EC] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#FFD84A]/60 hover:text-[#FFD84A]"
                  >
                    <span className="flex items-center gap-3 min-w-0">
                      <Mail className="h-4 w-4 text-[#FFD84A] shrink-0" aria-hidden="true" />
                      <span className="truncate">{primaryEmail}</span>
                    </span>
                    <ArrowUpRight
                      className="h-4 w-4 text-[#F7F4EC]/50 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-[#FFD84A] shrink-0"
                      aria-hidden="true"
                    />
                  </a>

                  <a
                    href={`mailto:${secondaryEmail}`}
                    className="group flex items-center justify-between gap-3 rounded-xl border border-white/12 bg-[#092F35]/80 px-4 py-3 text-sm font-medium text-[#F7F4EC] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#FFD84A]/60 hover:text-[#FFD84A]"
                  >
                    <span className="flex items-center gap-3 min-w-0">
                      <Mail className="h-4 w-4 text-[#FFD84A] shrink-0" aria-hidden="true" />
                      <span className="truncate">{secondaryEmail}</span>
                    </span>
                    <ArrowUpRight
                      className="h-4 w-4 text-[#F7F4EC]/50 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-[#FFD84A] shrink-0"
                      aria-hidden="true"
                    />
                  </a>
                </div>
              </div>

              <div className="border-t border-white/12 pt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#FFD84A]">
                    {companyName}
                  </p>
                  <p className="mt-1 flex items-center gap-2 text-sm text-[#F7F4EC]/80">
                    <MapPin className="h-4 w-4 text-[#0F8A5F] shrink-0" aria-hidden="true" />
                    <span>{location}</span>
                  </p>
                </div>

                <a
                  href={appUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${dict.a11y.openMaataAppSite} (${dict.a11y.opensInNewTab})`}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#FFD84A] px-3.5 py-2 text-xs font-semibold text-[#092F35] transition-transform duration-200 hover:-translate-y-0.5 hover:bg-[#ffe16e] w-fit shrink-0"
                >
                  <span>maataapp.com</span>
                  <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                </a>
              </div>
            </div>
          </div>

          {/* Official Social Media Channels */}
          <div className="lg:col-span-7 rounded-2xl border border-white/14 bg-[#0A3A47]/60 p-7">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-[#FFD84A]">
                {dict.stayConnected.officialSocialTitle}
              </h3>
              <span className="text-xs text-[#F7F4EC]/65">
                {dict.stayConnected.officialAccountsBadge}
              </span>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={formatMessage(dict.stayConnected.openPlatformAria, {
                    platform: social.label,
                    handle: social.handle,
                  })}
                  className="group flex items-center justify-between gap-3 rounded-xl border border-white/12 bg-[#092F35]/75 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-[#0F8A5F] hover:bg-[#0F4C5C]/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFD84A]"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/12 bg-[#0F4C5C] text-[#FFD84A] transition-colors duration-200 group-hover:bg-[#0F8A5F] group-hover:text-white">
                      <SocialPlatformIcon platform={social.label} className="h-4.5 w-4.5" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[#F7F4EC] group-hover:text-[#FFD84A] transition-colors">
                        {social.label}
                      </p>
                      <p className="truncate text-xs text-[#F7F4EC]/65">{social.handle}</p>
                    </div>
                  </div>
                  <ArrowUpRight
                    className="h-4 w-4 shrink-0 text-[#F7F4EC]/45 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-[#FFD84A]"
                    aria-hidden="true"
                  />
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
