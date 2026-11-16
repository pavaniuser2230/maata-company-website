import React, { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { usePublicCms } from '../context/PublicCmsContext';
import { formatMessage } from '../i18n';
import { publicApi } from '../services/cmsApi';
import { COMPANY_INFO } from '../theme/tokens';
import { Button } from './Button';

interface CareerFormState {
  fullName: string;
  email: string;
  areaId: string;
  portfolioOrNote: string;
}

export const CareersSection: React.FC = () => {
  const { dict } = useLanguage();
  const { companySections } = usePublicCms();
  const careersData = companySections.careers;

  const [form, setForm] = useState<CareerFormState>({
    fullName: '',
    email: '',
    areaId: careersData.areas[0]?.id || 'product-engineering',
    portfolioOrNote: '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof CareerFormState, string>>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submittedRef, setSubmittedRef] = useState<string | null>(null);

  const selectedArea =
    careersData.areas.find((a) => a.id === form.areaId) ?? careersData.areas[0];

  const validate = () => {
    const next: Partial<Record<keyof CareerFormState, string>> = {};
    if (!form.fullName.trim() || form.fullName.trim().length < 2) {
      next.fullName = dict.careers.validation.fullName;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      next.email = dict.careers.validation.email;
    }
    if (form.portfolioOrNote.trim().length < 12) {
      next.portfolioOrNote = dict.careers.validation.intro;
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    if (!validate()) return;
    setSubmitting(true);
    try {
      const res = await publicApi.submitEnquiry({
        type: 'careers',
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        subjectContext: selectedArea?.area || form.areaId,
        message: form.portfolioOrNote.trim(),
      });
      setSubmittedRef(res.id);
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : dict.careers.validation.submitError
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:items-start">
      <div className="lg:col-span-6 space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {careersData.areas.map((item) => (
            <article
              key={item.id}
              className="rounded-2xl border border-white/12 bg-[#092F35]/75 p-5"
            >
              <span className="text-xs font-semibold tracking-[0.12em] text-[#FFD84A] tabular-nums">
                {item.index}.
              </span>
              <h3 className="mt-2 text-base font-semibold text-[#F7F4EC]">{item.area}</h3>
              <p className="mt-2 text-xs leading-relaxed text-[#F7F4EC]/75">
                {item.description}
              </p>
              <ul className="mt-3 space-y-1 text-[11px] text-[#F7F4EC]/65">
                {item.focus.map((f, idx) => (
                  <li key={idx}>· {f}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>

        <div className="rounded-2xl border border-[#FFD84A]/25 bg-[#092F35] p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#FFD84A]">
            {dict.careers.futureOpportunitiesLabel}
          </p>
          <p className="mt-2 text-sm leading-relaxed text-[#F7F4EC]/85">
            {careersData.futureOpportunitiesNote}
          </p>
        </div>
      </div>

      <div className="lg:col-span-6">
        {submittedRef ? (
          <div className="rounded-2xl border border-[#0F8A5F]/50 bg-[#092F35] p-7 text-[#F7F4EC]">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-6 w-6 text-[#0F8A5F] shrink-0 mt-0.5" aria-hidden="true" />
              <div>
                <h3 className="text-lg font-semibold">{dict.careers.successTitle}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[#F7F4EC]/80">
                  {formatMessage(dict.careers.successBodyPrefix, { name: form.fullName })}{' '}
                  {dict.careers.successRefLabel}{' '}
                  <span className="font-mono font-semibold text-[#FFD84A]">{submittedRef}</span>.
                </p>
                <div className="mt-6">
                  <Button
                    type="button"
                    variant="ghost-light"
                    size="md"
                    onClick={() => {
                      setSubmittedRef(null);
                      setForm({
                        fullName: '',
                        email: '',
                        areaId: careersData.areas[0]?.id || 'product-engineering',
                        portfolioOrNote: '',
                      });
                      setErrors({});
                    }}
                  >
                    {dict.careers.submitAnotherCta}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            noValidate
            className="rounded-2xl border border-white/15 bg-[#092F35] p-6 md:p-8"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-4 mb-5">
              <h3 className="text-lg font-semibold text-[#F7F4EC]">
                {dict.careers.formTitle}
              </h3>
              <span className="text-[11px] text-[#FFD84A]">{dict.careers.locationBadge}</span>
            </div>

            {submitError && (
              <div className="mb-4 rounded-lg border border-red-400/40 bg-red-950/40 px-4 py-2.5 text-xs text-red-200">
                {submitError}
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="career-name"
                  className="block text-xs font-semibold text-[#F7F4EC]/85 mb-1.5"
                >
                  {dict.careers.fullNameLabel}
                </label>
                <input
                  id="career-name"
                  type="text"
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  placeholder={dict.careers.fullNamePlaceholder}
                  className="w-full rounded-lg border border-white/18 bg-[#0A3A47] px-4 py-2.5 text-sm text-[#F7F4EC] placeholder:text-[#F7F4EC]/45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFD84A]"
                />
                {errors.fullName && (
                  <p className="mt-1 text-xs text-[#FFD84A]">{errors.fullName}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor="career-email"
                  className="block text-xs font-semibold text-[#F7F4EC]/85 mb-1.5"
                >
                  {dict.careers.emailLabel}
                </label>
                <input
                  id="career-email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder={dict.careers.emailPlaceholder}
                  className="w-full rounded-lg border border-white/18 bg-[#0A3A47] px-4 py-2.5 text-sm text-[#F7F4EC] placeholder:text-[#F7F4EC]/45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFD84A]"
                />
                {errors.email && (
                  <p className="mt-1 text-xs text-[#FFD84A]">{errors.email}</p>
                )}
              </div>
            </div>

            <div className="mt-4">
              <label
                htmlFor="career-area"
                className="block text-xs font-semibold text-[#F7F4EC]/85 mb-1.5"
              >
                {dict.careers.areaLabel}
              </label>
              <select
                id="career-area"
                value={selectedArea?.id || form.areaId}
                onChange={(e) => setForm({ ...form, areaId: e.target.value })}
                className="w-full rounded-lg border border-white/18 bg-[#0A3A47] px-4 py-2.5 text-sm text-[#F7F4EC] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFD84A]"
              >
                {careersData.areas.map((area) => (
                  <option key={area.id} value={area.id}>
                    {area.area}
                  </option>
                ))}
              </select>
            </div>

            <div className="mt-4">
              <label
                htmlFor="career-note"
                className="block text-xs font-semibold text-[#F7F4EC]/85 mb-1.5"
              >
                {dict.careers.introLabel}
              </label>
              <textarea
                id="career-note"
                rows={4}
                value={form.portfolioOrNote}
                onChange={(e) => setForm({ ...form, portfolioOrNote: e.target.value })}
                placeholder={dict.careers.introPlaceholder}
                className="w-full rounded-lg border border-white/18 bg-[#0A3A47] px-4 py-2.5 text-sm text-[#F7F4EC] placeholder:text-[#F7F4EC]/45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFD84A]"
              />
              {errors.portfolioOrNote && (
                <p className="mt-1 text-xs text-[#FFD84A]">{errors.portfolioOrNote}</p>
              )}
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
              <p className="text-xs text-[#F7F4EC]/60">
                {dict.careers.directDeskPrefix} {COMPANY_INFO.supportEmail}
              </p>
              <Button type="submit" variant="primary" size="md" disabled={submitting}>
                {submitting ? dict.careers.submittingCta : dict.careers.submitCta}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
