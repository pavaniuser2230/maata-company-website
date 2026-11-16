import React, { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { usePublicCms } from '../context/PublicCmsContext';
import { formatMessage } from '../i18n';
import { publicApi } from '../services/cmsApi';
import { COMPANY_INFO } from '../theme/tokens';
import { Button } from './Button';

type InquiryType = 'general' | 'business' | 'partnership' | 'feedback';

interface ContactFormProps {
  tone?: 'light' | 'dark';
}

interface FormState {
  name: string;
  email: string;
  organisation: string;
  message: string;
}

const TAB_IDS: InquiryType[] = ['general', 'business', 'partnership', 'feedback'];

const INITIAL_STATE: FormState = {
  name: '',
  email: '',
  organisation: '',
  message: '',
};

export const ContactForm: React.FC<ContactFormProps> = ({ tone = 'light' }) => {
  const { dict } = useLanguage();
  const [inquiryType, setInquiryType] = useState<InquiryType>('general');
  const [form, setForm] = useState<FormState>(INITIAL_STATE);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submittedRef, setSubmittedRef] = useState<string | null>(null);
  const { companySections } = usePublicCms();
  const contact = companySections.contact;
  const primaryEmail = contact?.supportEmail || COMPANY_INFO.supportEmail;
  const secondaryEmail = contact?.secondarySupportEmail || COMPANY_INFO.secondarySupportEmail;
  const officeLocation = dict.footer.locationLabel || contact?.location || COMPANY_INFO.location;

  const isDark = tone === 'dark';
  const activeTab = dict.contact.tabs[inquiryType] ?? dict.contact.tabs.general;

  const validate = (): boolean => {
    const nextErrors: Partial<Record<keyof FormState, string>> = {};
    if (!form.name.trim() || form.name.trim().length < 2) {
      nextErrors.name = dict.contact.validation.name;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      nextErrors.email = dict.contact.validation.email;
    }
    if (
      (inquiryType === 'business' || inquiryType === 'partnership') &&
      !form.organisation.trim()
    ) {
      nextErrors.organisation = `${dict.contact.validation.orgRequiredPrefix} ${activeTab.orgLabel.toLowerCase()}.`;
    }
    if (form.message.trim().length < 10) {
      nextErrors.message = dict.contact.validation.message;
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitError(null);
    if (!validate()) return;

    setSubmitting(true);
    try {
      const res = await publicApi.submitEnquiry({
        type: inquiryType,
        fullName: form.name.trim(),
        email: form.email.trim(),
        organisation: form.organisation.trim(),
        subjectContext: activeTab.heading,
        message: form.message.trim(),
      });
      setSubmittedRef(res.id);
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : dict.contact.validation.submitError
      );
    } finally {
      setSubmitting(false);
    }
  };

  const inputClasses = `w-full rounded-lg border px-4 py-2.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 ${
    isDark
      ? 'bg-[#092F35] border-white/18 text-[#F7F4EC] placeholder:text-[#F7F4EC]/45 focus-visible:ring-[#FFD84A] focus-visible:border-[#FFD84A]'
      : 'bg-[#F7F4EC]/60 border-[#092F35]/18 text-[#092F35] placeholder:text-[#092F35]/45 focus-visible:ring-[#0F4C5C] focus-visible:border-[#0F4C5C]'
  }`;

  const labelClasses = `block text-xs font-semibold mb-1.5 ${
    isDark ? 'text-[#F7F4EC]/85' : 'text-[#092F35]/85'
  }`;

  return (
    <div
      className={`rounded-2xl border overflow-hidden ${
        isDark
          ? 'bg-[#0A3A47] border-white/15 text-[#F7F4EC]'
          : 'bg-white border-[#092F35]/12 text-[#092F35]'
      }`}
    >
      <div
        role="tablist"
        aria-label={dict.contact.formTablistAria}
        className={`grid grid-cols-2 sm:grid-cols-4 border-b ${
          isDark ? 'border-white/12 bg-[#092F35]' : 'border-[#092F35]/12 bg-[#F7F4EC]'
        }`}
      >
        {TAB_IDS.map((tabId) => {
          const isSelected = tabId === inquiryType;
          const tab = dict.contact.tabs[tabId];
          return (
            <button
              key={tabId}
              type="button"
              role="tab"
              aria-selected={isSelected}
              onClick={() => {
                setInquiryType(tabId);
                setSubmittedRef(null);
                setErrors({});
                setSubmitError(null);
              }}
              className={`px-3 py-3 text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#FFD84A] ${
                isSelected
                  ? isDark
                    ? 'bg-[#0F4C5C] text-[#FFD84A] border-b-2 border-[#FFD84A]'
                    : 'bg-white text-[#092F35] border-b-2 border-[#0F8A5F]'
                  : isDark
                    ? 'text-[#F7F4EC]/65 hover:text-[#F7F4EC]'
                    : 'text-[#092F35]/65 hover:text-[#092F35]'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {submittedRef ? (
        <div className="p-6 md:p-8">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-6 w-6 text-[#0F8A5F] shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <h3 className="text-lg font-semibold">
                {activeTab.label} {dict.contact.receivedSuffix}
              </h3>
              <p
                className={`mt-2 text-sm leading-relaxed ${
                  isDark ? 'text-[#F7F4EC]/80' : 'text-[#092F35]/75'
                }`}
              >
                {formatMessage(dict.contact.successBodyPrefix, { name: form.name })}{' '}
                {dict.contact.referenceIdLabel}{' '}
                <span className="font-mono font-semibold tabular-nums">{submittedRef}</span>.
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <Button
                  type="button"
                  variant={isDark ? 'ghost-light' : 'ghost-dark'}
                  size="md"
                  onClick={() => {
                    setSubmittedRef(null);
                    setForm(INITIAL_STATE);
                    setErrors({});
                  }}
                >
                  {dict.contact.submitAnotherCta}
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} noValidate className="p-6 md:p-8">
          <div className="flex flex-wrap items-baseline justify-between gap-2 mb-5">
            <h3 className="text-base md:text-lg font-semibold">{activeTab.heading}</h3>
            <span
              className={`text-[11px] font-medium ${
                isDark ? 'text-[#FFD84A]' : 'text-[#0F8A5F]'
              }`}
            >
              {dict.contact.officialEmailTitle} · {primaryEmail}
            </span>
          </div>

          {submitError && (
            <div className="mb-4 rounded-lg border border-red-400/40 bg-red-950/30 px-4 py-2.5 text-xs text-red-200">
              {submitError}
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="contact-name" className={labelClasses}>
                {dict.contact.fullNameLabel}
              </label>
              <input
                id="contact-name"
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder={dict.contact.fullNamePlaceholder}
                className={inputClasses}
                aria-invalid={Boolean(errors.name)}
              />
              {errors.name && (
                <p className="mt-1 text-xs text-[#FFD84A] bg-[#092F35] px-2 py-0.5 rounded w-fit">
                  {errors.name}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="contact-email" className={labelClasses}>
                {dict.contact.emailLabel}
              </label>
              <input
                id="contact-email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder={dict.contact.emailPlaceholder}
                className={inputClasses}
                aria-invalid={Boolean(errors.email)}
              />
              {errors.email && (
                <p className="mt-1 text-xs text-[#FFD84A] bg-[#092F35] px-2 py-0.5 rounded w-fit">
                  {errors.email}
                </p>
              )}
            </div>
          </div>

          <div className="mt-4">
            <label htmlFor="contact-org" className={labelClasses}>
              {activeTab.orgLabel}
            </label>
            <input
              id="contact-org"
              type="text"
              value={form.organisation}
              onChange={(e) => setForm({ ...form, organisation: e.target.value })}
              placeholder={activeTab.orgPlaceholder}
              className={inputClasses}
              aria-invalid={Boolean(errors.organisation)}
            />
            {errors.organisation && (
              <p className="mt-1 text-xs text-[#FFD84A] bg-[#092F35] px-2 py-0.5 rounded w-fit">
                {errors.organisation}
              </p>
            )}
          </div>

          <div className="mt-4">
            <label htmlFor="contact-message" className={labelClasses}>
              {dict.contact.messageLabel}
            </label>
            <textarea
              id="contact-message"
              rows={4}
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              placeholder={activeTab.messagePlaceholder}
              className={inputClasses}
              aria-invalid={Boolean(errors.message)}
            />
            {errors.message && (
              <p className="mt-1 text-xs text-[#FFD84A] bg-[#092F35] px-2 py-0.5 rounded w-fit">
                {errors.message}
              </p>
            )}
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
            <p
              className={`text-xs ${
                isDark ? 'text-[#F7F4EC]/65' : 'text-[#092F35]/60'
              }`}
            >
              {officeLocation} · {primaryEmail} · {secondaryEmail}
            </p>
            <Button type="submit" variant="primary" size="md" disabled={submitting}>
              {submitting
                ? dict.contact.submittingCta
                : `${dict.contact.submitPrefix} ${activeTab.label}`}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
};
