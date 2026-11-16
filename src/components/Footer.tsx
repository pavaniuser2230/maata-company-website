import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Lock, Mail, MapPin } from 'lucide-react';
import { usePublicCms } from '../context/PublicCmsContext';
import { useLanguage } from '../context/LanguageContext';
import { formatMessage } from '../i18n';
import { COMPANY_INFO } from '../theme/tokens';
import { MaataLogo } from './MaataLogo';
import { SocialPlatformIcon } from './SocialPlatformIcon';

export const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();
  const { companySections } = usePublicCms();
  const { dict, localizePath } = useLanguage();
  const contact = companySections.contact;
  const about = companySections.about;

  const companyName = contact.companyName || COMPANY_INFO.companyName;
  const location = dict.hero.location === 'CHITTOOR, ANDHRA PRADESH, INDIA'
    ? contact.location || COMPANY_INFO.location
    : dict.careers.locationBadge || contact.location || COMPANY_INFO.location;
  const primaryEmail = contact.supportEmail || COMPANY_INFO.supportEmail;
  const secondaryEmail =
    contact.secondarySupportEmail || COMPANY_INFO.secondarySupportEmail;
  const appUrl = contact.appUrl || COMPANY_INFO.appUrl;
  const socialLinks =
    contact.socialLinks && contact.socialLinks.length > 0
      ? contact.socialLinks
      : COMPANY_INFO.socialLinks;

  return (
    <footer className="bg-[#092F35] text-[#F7F4EC] border-t border-white/10">
      <div className="mx-auto max-w-[1280px] px-6 py-16 md:py-20">
        {/* Connect with MAATA Footer Showcase */}
        <div className="mb-14 rounded-2xl border border-white/12 bg-[#0A3A47]/70 p-6 md:p-8 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <Link
              to={localizePath('/')}
              aria-label={dict.a11y.homeLogoAria}
              className="inline-flex items-center shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFD84A] rounded"
            >
              <MaataLogo tone="light" size="lg" />
            </Link>
            <div className="sm:border-l sm:border-white/14 sm:pl-5">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#FFD84A]">
                {dict.footer.connectLabel}
              </p>
              <p className="mt-1 text-sm text-[#F7F4EC]/85">
                {dict.footer.connectSubtitle}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {socialLinks.map((social) => (
              <a
                key={social.label}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${formatMessage(dict.a11y.connectOnSocial, { platform: social.label })} (${dict.a11y.opensInNewTab})`}
                className="group inline-flex items-center gap-2 rounded-xl border border-white/14 bg-[#092F35]/80 px-3.5 py-2 text-xs font-medium text-[#F7F4EC] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#FFD84A]/60 hover:text-[#FFD84A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFD84A]"
              >
                <SocialPlatformIcon
                  platform={social.label}
                  className="h-4 w-4 text-[#FFD84A] transition-transform duration-200 group-hover:scale-110"
                />
                <span>{social.label}</span>
              </a>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-10 md:grid-cols-12">
          {/* Corporate Brand & Official Email & Support */}
          <div className="md:col-span-5">
            <p className="text-sm font-medium text-[#FFD84A]">
              {about.tagline || COMPANY_INFO.tagline}
            </p>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-[#F7F4EC]/75">
              {companyName} {dict.footer.companyDescriptionPrefix}{' '}
              {about.publicBrand || COMPANY_INFO.publicBrand}{' '}
              {dict.footer.companyDescriptionMid} {dict.footer.companyDescriptionSuffix}
            </p>

            <div className="mt-6 flex flex-col gap-2.5 text-sm text-[#F7F4EC]/80">
              <div className="flex items-center gap-2.5">
                <MapPin className="h-4 w-4 text-[#FFD84A] shrink-0" aria-hidden="true" />
                <span>{contact.location || location}</span>
              </div>
            </div>

            <div className="mt-5">
              <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-[#FFD84A]">
                {dict.footer.officialEmailTitle}
              </h3>
              <div className="mt-2.5 flex flex-col gap-2 text-sm text-[#F7F4EC]/85">
                <a
                  href={`mailto:${primaryEmail}`}
                  className="inline-flex items-center gap-2.5 hover:text-[#FFD84A] transition-colors w-fit"
                >
                  <Mail className="h-4 w-4 text-[#FFD84A] shrink-0" aria-hidden="true" />
                  <span>{primaryEmail}</span>
                </a>
                <a
                  href={`mailto:${secondaryEmail}`}
                  className="inline-flex items-center gap-2.5 hover:text-[#FFD84A] transition-colors w-fit"
                >
                  <Mail className="h-4 w-4 text-[#FFD84A] shrink-0" aria-hidden="true" />
                  <span>{secondaryEmail}</span>
                </a>
              </div>
            </div>
          </div>

          {/* Company Navigation */}
          <div className="md:col-span-2 md:col-start-7">
            <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-[#FFD84A]">
              {dict.footer.companyNavTitle}
            </h3>
            <ul className="mt-4 flex flex-col gap-2.5 text-sm text-[#F7F4EC]/80">
              <li>
                <Link to={localizePath('/company')} className="hover:text-[#FFD84A] transition-colors">
                  {dict.footer.links.whyMaataStory}
                </Link>
              </li>
              <li>
                <Link
                  to={localizePath('/company#leadership')}
                  className="hover:text-[#FFD84A] transition-colors"
                >
                  {dict.footer.links.foundersLeadership}
                </Link>
              </li>
              <li>
                <Link
                  to={localizePath('/company#vision')}
                  className="hover:text-[#FFD84A] transition-colors"
                >
                  {dict.footer.links.visionMission}
                </Link>
              </li>
              <li>
                <Link
                  to={localizePath('/company#journey')}
                  className="hover:text-[#FFD84A] transition-colors"
                >
                  {dict.footer.links.companyJourney}
                </Link>
              </li>
              <li>
                <Link to={localizePath('/news')} className="hover:text-[#FFD84A] transition-colors">
                  {dict.footer.links.newsroom}
                </Link>
              </li>
              <li>
                <Link to={localizePath('/careers')} className="hover:text-[#FFD84A] transition-colors">
                  {dict.footer.links.careers}
                </Link>
              </li>
              <li>
                <Link to={localizePath('/contact')} className="hover:text-[#FFD84A] transition-colors">
                  {dict.footer.links.contactUs}
                </Link>
              </li>
            </ul>
          </div>

          {/* Product Navigation */}
          <div className="md:col-span-2">
            <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-[#FFD84A]">
              {dict.footer.productNavTitle}
            </h3>
            <ul className="mt-4 flex flex-col gap-2.5 text-sm text-[#F7F4EC]/80">
              <li>
                <Link to={localizePath('/app')} className="hover:text-[#FFD84A] transition-colors">
                  {dict.footer.links.maataIndiaApp}
                </Link>
              </li>
              <li>
                <Link
                  to={localizePath('/app#ecosystem')}
                  className="hover:text-[#FFD84A] transition-colors"
                >
                  {dict.footer.links.ecosystem16}
                </Link>
              </li>
              <li>
                <Link
                  to={localizePath('/app#business')}
                  className="hover:text-[#FFD84A] transition-colors"
                >
                  {dict.footer.links.maataBusiness}
                </Link>
              </li>
              <li>
                <Link
                  to={localizePath('/app#local-india')}
                  className="hover:text-[#FFD84A] transition-colors"
                >
                  {dict.footer.links.localIndiaNetwork}
                </Link>
              </li>
              <li>
                <Link
                  to={localizePath('/technology')}
                  className="hover:text-[#FFD84A] transition-colors"
                >
                  {dict.footer.links.technology}
                </Link>
              </li>
              <li>
                <a
                  href={appUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[#FFD84A] hover:underline"
                >
                  <span>maataapp.com</span>
                  <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                </a>
              </li>
            </ul>
          </div>

          {/* Governance & Legal */}
          <div className="md:col-span-2">
            <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-[#FFD84A]">
              {dict.footer.governanceNavTitle}
            </h3>
            <ul className="mt-4 flex flex-col gap-2.5 text-sm text-[#F7F4EC]/80">
              <li>
                <Link
                  to={localizePath('/privacy')}
                  className="hover:text-[#FFD84A] transition-colors"
                >
                  {dict.footer.links.privacyPolicy}
                </Link>
              </li>
              <li>
                <Link to={localizePath('/terms')} className="hover:text-[#FFD84A] transition-colors">
                  {dict.footer.links.termsConditions}
                </Link>
              </li>
              <li>
                <a
                  href={`mailto:${primaryEmail}`}
                  className="hover:text-[#FFD84A] transition-colors"
                >
                  {dict.footer.links.supportDesk}
                </a>
              </li>
              <li>
                <a
                  href={`mailto:${secondaryEmail}`}
                  className="hover:text-[#FFD84A] transition-colors"
                >
                  {dict.footer.links.alternateSupport}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-3 border-t border-white/12 pt-8 text-xs text-[#F7F4EC]/60 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {currentYear} {companyName}. {dict.footer.copyrightSuffix}
          </p>
          <div className="flex items-center gap-3">
            <p className="flex items-center gap-2">
              <span className="font-telugu text-[#FFD84A]/90">{COMPANY_INFO.teluguWord}</span>
              <span aria-hidden="true">·</span>
              <span>{dict.footer.centralConcept}</span>
            </p>
            <Link
              to="/leadership/access"
              aria-label={dict.a11y.privateLeadershipAccess}
              title={dict.a11y.privateLeadershipAccess}
              className="inline-flex h-7 w-7 items-center justify-center rounded-md text-[#F7F4EC]/30 transition-colors hover:text-[#FFD84A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFD84A]"
            >
              <Lock className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
