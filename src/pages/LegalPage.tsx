import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { COMPANY_INFO, TYPOGRAPHY_SCALE } from '../theme/tokens';
import { usePageSeo } from '../hooks/usePageSeo';
import { usePublicCms } from '../context/PublicCmsContext';
import { AnimatedBackground } from '../components/AnimatedBackground';

interface LegalPageProps {
  mode: 'privacy' | 'terms';
}

export const LegalPage: React.FC<LegalPageProps> = ({ mode }) => {
  const isPrivacy = mode === 'privacy';
  const { dict } = useLanguage();
  const { companySections } = usePublicCms();
  const contact = companySections.contact;
  const primaryEmail = contact?.supportEmail || COMPANY_INFO.supportEmail;
  const secondaryEmail = contact?.secondarySupportEmail || COMPANY_INFO.secondarySupportEmail;

  usePageSeo(isPrivacy ? dict.meta.privacy : dict.meta.terms);

  return (
    <>
      <section className="relative overflow-hidden bg-[#092F35] text-[#F7F4EC] py-14 md:py-18">
        <AnimatedBackground variant="hero" />
        <div className="relative z-10 mx-auto max-w-[960px] px-6">
          <p className="text-xs font-medium tracking-[0.12em] uppercase text-[#FFD84A]">
            {dict.legal.kickerPrefix} · {COMPANY_INFO.companyName}
          </p>
          <h1 className={`${TYPOGRAPHY_SCALE.heroHeadline} mt-4`}>
            {isPrivacy ? dict.legal.privacyTitle : dict.legal.termsTitle}
          </h1>
          <p className="mt-4 text-sm text-[#F7F4EC]/75">
            {dict.legal.appliesToPrefix} {COMPANY_INFO.companyDisplay} ({dict.footer.locationLabel}).
          </p>
        </div>
      </section>

      <section className="bg-[#F7F4EC] text-[#092F35] py-16">
        <div className="mx-auto max-w-[960px] px-6">
          <div className="rounded-2xl border border-[#092F35]/12 bg-white p-8 md:p-10 space-y-6 text-[15px] leading-[1.75] text-[#092F35]/85">
            {isPrivacy ? (
              <>
                <div>
                  <h2 className="text-xl font-semibold text-[#092F35]">
                    {dict.legal.privacy.s1Title}
                  </h2>
                  <p className="mt-2">
                    {dict.legal.privacy.s1BodyPre}{' '}
                    <a
                      href={COMPANY_INFO.appUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#0F4C5C] font-medium underline"
                    >
                      {COMPANY_INFO.appUrl}
                    </a>{' '}
                    {dict.legal.privacy.s1BodyPost}
                  </p>
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-[#092F35]">
                    {dict.legal.privacy.s2Title}
                  </h2>
                  <p className="mt-2">
                    {dict.legal.privacy.s2BodyPre}{' '}
                    <a
                      href={`mailto:${primaryEmail}`}
                      className="text-[#0F4C5C] font-medium underline"
                    >
                      {primaryEmail}
                    </a>{' '}
                    {dict.legal.privacy.s2Or}{' '}
                    <a
                      href={`mailto:${secondaryEmail}`}
                      className="text-[#0F4C5C] font-medium underline"
                    >
                      {secondaryEmail}
                    </a>
                    .
                  </p>
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-[#092F35]">
                    {dict.legal.privacy.s3Title}
                  </h2>
                  <p className="mt-2">
                    {dict.legal.privacy.s3BodyPre}{' '}
                    <a
                      href={`mailto:${primaryEmail}`}
                      className="text-[#0F4C5C] font-medium underline"
                    >
                      {primaryEmail}
                    </a>{' '}
                    {dict.legal.privacy.s3Or}{' '}
                    <a
                      href={`mailto:${secondaryEmail}`}
                      className="text-[#0F4C5C] font-medium underline"
                    >
                      {secondaryEmail}
                    </a>
                    .
                  </p>
                </div>
              </>
            ) : (
              <>
                <div>
                  <h2 className="text-xl font-semibold text-[#092F35]">
                    {dict.legal.terms.s1Title}
                  </h2>
                  <p className="mt-2">{dict.legal.terms.s1Body}</p>
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-[#092F35]">
                    {dict.legal.terms.s2Title}
                  </h2>
                  <p className="mt-2">{dict.legal.terms.s2Body}</p>
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-[#092F35]">
                    {dict.legal.terms.s3Title}
                  </h2>
                  <p className="mt-2">
                    {dict.legal.terms.s3BodyPre}{' '}
                    <a
                      href={COMPANY_INFO.appUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#0F4C5C] font-medium underline"
                    >
                      {COMPANY_INFO.appUrl}
                    </a>{' '}
                    {dict.legal.terms.s3BodyMid}{' '}
                    <a
                      href={`mailto:${primaryEmail}`}
                      className="text-[#0F4C5C] font-medium underline"
                    >
                      {primaryEmail}
                    </a>{' '}
                    {dict.legal.terms.s3Or}{' '}
                    <a
                      href={`mailto:${secondaryEmail}`}
                      className="text-[#0F4C5C] font-medium underline"
                    >
                      {secondaryEmail}
                    </a>
                    .
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </section>
    </>
  );
};
