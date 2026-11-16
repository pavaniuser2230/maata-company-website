import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  Eye,
  Globe,
  Languages,
  Save,
  UploadCloud,
  X,
} from 'lucide-react';
import {
  adminApi,
  type TranslationEntityType,
  type TranslationEntryRecord,
} from '../../services/cmsApi';
import { usePublicCms } from '../../context/PublicCmsContext';
import { TRANSLATION_TARGET_LANGUAGES } from '../../i18n/languages';

interface TranslationModalProps {
  open: boolean;
  entityType: TranslationEntityType;
  entityId: string;
  entityLabel: string;
  sourceData: any;
  onClose: () => void;
  onSaved?: () => void;
}

function buildInitialDraft(
  entityType: TranslationEntityType,
  entityId: string,
  sourceData: any,
  existing: Record<string, any> | null | undefined
): Record<string, any> {
  const tr = existing && typeof existing === 'object' ? existing : {};

  if (entityType === 'article') {
    const tags = Array.isArray(tr.tags)
      ? tr.tags.map(String)
      : [];
    return {
      title: typeof tr.title === 'string' ? tr.title : '',
      shortSummary: typeof tr.shortSummary === 'string' ? tr.shortSummary : '',
      content: typeof tr.content === 'string' ? tr.content : '',
      author: typeof tr.author === 'string' ? tr.author : '',
      tags,
      seoTitle: typeof tr.seoTitle === 'string' ? tr.seoTitle : '',
      seoDescription: typeof tr.seoDescription === 'string' ? tr.seoDescription : '',
    };
  }

  if (entityType === 'announcement') {
    return {
      title: typeof tr.title === 'string' ? tr.title : '',
      summary: typeof tr.summary === 'string' ? tr.summary : '',
      body: typeof tr.body === 'string' ? tr.body : '',
    };
  }

  if (entityType === 'media_asset') {
    return {
      caption: typeof tr.caption === 'string' ? tr.caption : '',
      altText: typeof tr.altText === 'string' ? tr.altText : '',
    };
  }

  // company_section
  if (entityId === 'about') {
    return {
      tagline: typeof tr.tagline === 'string' ? tr.tagline : '',
      centralConcept: typeof tr.centralConcept === 'string' ? tr.centralConcept : '',
      heroSupportingText:
        typeof tr.heroSupportingText === 'string' ? tr.heroSupportingText : '',
      whyMaataHeadline: typeof tr.whyMaataHeadline === 'string' ? tr.whyMaataHeadline : '',
      whyMaataBody: typeof tr.whyMaataBody === 'string' ? tr.whyMaataBody : '',
    };
  }

  if (entityId === 'story') {
    const srcParas: string[] = Array.isArray(sourceData?.paragraphs)
      ? sourceData.paragraphs
      : ['', ''];
    const trParas: unknown[] = Array.isArray(tr.paragraphs) ? tr.paragraphs : [];
    return {
      headline: typeof tr.headline === 'string' ? tr.headline : '',
      paragraphs: srcParas.map((_, idx) =>
        typeof trParas[idx] === 'string' ? (trParas[idx] as string) : ''
      ),
    };
  }

  if (entityId === 'founders') {
    const srcList: any[] = Array.isArray(sourceData) ? sourceData : [];
    const trList: any[] = Array.isArray(tr.items)
      ? tr.items
      : Array.isArray(tr)
      ? tr
      : [];
    return {
      items: srcList.map((f, idx) => {
        const match =
          trList.find((item) => item && item.id === f.id) || trList[idx] || {};
        const srcResp: string[] = Array.isArray(f.responsibilities)
          ? f.responsibilities
          : [];
        const trResp: unknown[] = Array.isArray(match.responsibilities)
          ? match.responsibilities
          : [];
        return {
          id: f.id,
          role: typeof match.role === 'string' ? match.role : '',
          originNote: typeof match.originNote === 'string' ? match.originNote : '',
          bio: typeof match.bio === 'string' ? match.bio : '',
          perspectiveQuote:
            typeof match.perspectiveQuote === 'string' ? match.perspectiveQuote : '',
          responsibilities: srcResp.map((_, rIdx) =>
            typeof trResp[rIdx] === 'string' ? (trResp[rIdx] as string) : ''
          ),
        };
      }),
    };
  }

  if (entityId === 'vision_mission') {
    return {
      vision: {
        label: typeof tr.vision?.label === 'string' ? tr.vision.label : '',
        statement:
          typeof tr.vision?.statement === 'string' ? tr.vision.statement : '',
      },
      mission: {
        label: typeof tr.mission?.label === 'string' ? tr.mission.label : '',
        statement:
          typeof tr.mission?.statement === 'string' ? tr.mission.statement : '',
      },
    };
  }

  if (entityId === 'journey') {
    const srcList: any[] = Array.isArray(sourceData) ? sourceData : [];
    const trList: any[] = Array.isArray(tr.items)
      ? tr.items
      : Array.isArray(tr)
      ? tr
      : [];
    return {
      items: srcList.map((m, idx) => {
        const match =
          trList.find((item) => item && item.id === m.id) || trList[idx] || {};
        return {
          id: m.id,
          dateLabel: typeof match.dateLabel === 'string' ? match.dateLabel : '',
          title: typeof match.title === 'string' ? match.title : '',
          description: typeof match.description === 'string' ? match.description : '',
        };
      }),
    };
  }

  if (entityId === 'careers') {
    const srcAreas: any[] = Array.isArray(sourceData?.areas) ? sourceData.areas : [];
    const trAreas: any[] = Array.isArray(tr.areas) ? tr.areas : [];
    return {
      intro: typeof tr.intro === 'string' ? tr.intro : '',
      futureOpportunitiesNote:
        typeof tr.futureOpportunitiesNote === 'string'
          ? tr.futureOpportunitiesNote
          : '',
      areas: srcAreas.map((a, idx) => {
        const match =
          trAreas.find((item) => item && item.id === a.id) || trAreas[idx] || {};
        const srcFocus: string[] = Array.isArray(a.focus) ? a.focus : [];
        const trFocus: unknown[] = Array.isArray(match.focus) ? match.focus : [];
        return {
          id: a.id,
          area: typeof match.area === 'string' ? match.area : '',
          description: typeof match.description === 'string' ? match.description : '',
          focus: srcFocus.map((_, fIdx) =>
            typeof trFocus[fIdx] === 'string' ? (trFocus[fIdx] as string) : ''
          ),
        };
      }),
    };
  }

  return tr;
}

export const TranslationModal: React.FC<TranslationModalProps> = ({
  open,
  entityType,
  entityId,
  entityLabel,
  sourceData,
  onClose,
  onSaved,
}) => {
  const { refreshPublicCms } = usePublicCms();

  const [selectedLocale, setSelectedLocale] = useState<string>(
    TRANSLATION_TARGET_LANGUAGES[0].code
  );
  const [entries, setEntries] = useState<Record<string, TranslationEntryRecord>>({});
  const [draft, setDraft] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'err'; text: string } | null>(
    null
  );

  const loadTranslations = async (keepLocale?: string) => {
    if (!entityId) return;
    setLoading(true);
    setFeedback(null);
    try {
      const res = await adminApi.getEntityTranslations(entityType, entityId);
      setEntries(res.translations || {});
      const loc = keepLocale || selectedLocale;
      setDraft(
        buildInitialDraft(
          entityType,
          entityId,
          sourceData,
          res.translations?.[loc]?.draftData
        )
      );
    } catch (err: any) {
      setFeedback({
        type: 'err',
        text: err?.message || 'Failed to load translation records.',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && entityId) {
      setPreviewMode(false);
      void loadTranslations(selectedLocale);
    }
  }, [open, entityType, entityId]);

  const handleSelectLocale = (localeCode: string) => {
    setSelectedLocale(localeCode);
    setPreviewMode(false);
    setFeedback(null);
    setDraft(
      buildInitialDraft(
        entityType,
        entityId,
        sourceData,
        entries[localeCode]?.draftData
      )
    );
  };

  if (!open) return null;

  const activeLocaleOption =
    TRANSLATION_TARGET_LANGUAGES.find((l) => l.code === selectedLocale) ||
    TRANSLATION_TARGET_LANGUAGES[0];
  const currentRecord = entries[selectedLocale];

  const publishedCount = TRANSLATION_TARGET_LANGUAGES.filter(
    (l) => entries[l.code]?.status === 'published'
  ).length;

  const handleSaveDraft = async () => {
    setSaving(true);
    setFeedback(null);
    try {
      await adminApi.saveTranslationDraft(entityType, entityId, selectedLocale, draft);
      await loadTranslations(selectedLocale);
      onSaved?.();
      setFeedback({
        type: 'ok',
        text: `${activeLocaleOption.englishName} (${activeLocaleOption.nativeName}) draft saved.`,
      });
    } catch (err: any) {
      setFeedback({
        type: 'err',
        text: err?.message || 'Failed to save translation draft.',
      });
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    setSaving(true);
    setFeedback(null);
    try {
      await adminApi.saveTranslationDraft(entityType, entityId, selectedLocale, draft);
      await adminApi.publishTranslation(entityType, entityId, selectedLocale);
      await Promise.all([loadTranslations(selectedLocale), refreshPublicCms()]);
      onSaved?.();
      setFeedback({
        type: 'ok',
        text: `${activeLocaleOption.englishName} translation published live to the public website.`,
      });
    } catch (err: any) {
      setFeedback({
        type: 'err',
        text: err?.message || 'Failed to publish translation.',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleUnpublish = async () => {
    setSaving(true);
    setFeedback(null);
    try {
      await adminApi.unpublishTranslation(entityType, entityId, selectedLocale);
      await Promise.all([loadTranslations(selectedLocale), refreshPublicCms()]);
      onSaved?.();
      setFeedback({
        type: 'ok',
        text: `${activeLocaleOption.englishName} translation unpublished (public site falls back safely).`,
      });
    } catch (err: any) {
      setFeedback({
        type: 'err',
        text: err?.message || 'Failed to unpublish translation.',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-label={`Manage Translations for ${entityLabel}`}
    >
      <div className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        {/* Modal Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-[#092F35] px-6 py-4 text-white">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#FFD84A]">
              <Languages className="h-4 w-4" />
              <span>Multilingual CMS Translation Manager</span>
            </div>
            <h2 className="mt-1 truncate text-base font-semibold text-white">
              {entityLabel}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-[#F7F4EC] tabular-nums">
              {publishedCount} / {TRANSLATION_TARGET_LANGUAGES.length} Published
            </span>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close translations modal"
              className="rounded-lg p-1.5 text-white/70 hover:bg-white/10 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Language Tabs */}
        <div className="border-b border-slate-200 bg-slate-50 px-6 py-3">
          <div className="flex flex-wrap items-center gap-2">
            {TRANSLATION_TARGET_LANGUAGES.map((lang) => {
              const rec = entries[lang.code];
              const isSelected = lang.code === selectedLocale;
              const isPublished = rec?.status === 'published';
              const isDraft = rec?.status === 'draft';
              return (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => handleSelectLocale(lang.code)}
                  className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                    isSelected
                      ? 'border-[#092F35] bg-[#092F35] text-white shadow-xs'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <span>
                    {lang.englishName} · {lang.nativeName}
                  </span>
                  <span
                    className={`h-2 w-2 rounded-full ${
                      isPublished
                        ? 'bg-emerald-400'
                        : isDraft
                        ? 'bg-amber-400'
                        : 'bg-slate-300'
                    }`}
                    title={
                      isPublished
                        ? 'Published'
                        : isDraft
                        ? 'Draft saved'
                        : 'Missing translation'
                    }
                  />
                </button>
              );
            })}
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs">
            <div className="flex items-center gap-2 text-slate-700">
              <span className="font-semibold text-[#092F35]">
                Target: {activeLocaleOption.englishName} ({activeLocaleOption.nativeName})
              </span>
              {currentRecord?.status === 'published' ? (
                <span className="inline-flex items-center gap-1 rounded bg-emerald-100 px-2 py-0.5 font-semibold text-emerald-900">
                  <CheckCircle2 className="h-3 w-3" /> Published
                  {currentRecord.hasUnpublishedChanges ? ' (Draft ahead)' : ''}
                </span>
              ) : currentRecord?.status === 'draft' ? (
                <span className="rounded bg-amber-100 px-2 py-0.5 font-semibold text-amber-900">
                  Draft Only
                </span>
              ) : (
                <span className="rounded bg-slate-200 px-2 py-0.5 font-medium text-slate-700">
                  Missing Translation (Public site falls back cleanly)
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={() => setPreviewMode((p) => !p)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1 text-xs font-medium text-[#092F35] hover:bg-slate-100"
            >
              <Eye className="h-3.5 w-3.5" />
              <span>{previewMode ? 'Back to Editor' : 'Preview Localized Output'}</span>
            </button>
          </div>

          {feedback && (
            <div
              className={`mb-4 rounded-xl border px-4 py-3 text-xs font-medium ${
                feedback.type === 'ok'
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
                  : 'border-rose-200 bg-rose-50 text-rose-800'
              }`}
            >
              {feedback.text}
            </div>
          )}

          {loading ? (
            <div className="h-64 animate-pulse rounded-xl bg-slate-100" />
          ) : previewMode ? (
            <div
              lang={activeLocaleOption.code}
              className="space-y-4 rounded-xl border border-slate-200 bg-[#F7F4EC] p-6 text-[#092F35]"
            >
              <p className="text-[11px] font-semibold uppercase tracking-wider text-[#0F8A5F]">
                Live Preview ({activeLocaleOption.englishName} – {activeLocaleOption.nativeName})
              </p>
              {renderLocalizedPreview(entityType, entityId, sourceData, draft)}
            </div>
          ) : (
            <div className="space-y-5">
              <p className="rounded-lg border border-amber-200 bg-amber-50/70 px-3.5 py-2 text-xs text-amber-950">
                Leave any field blank to keep the safe fallback. Official brand names (MAATA, MAATA
                Technologies), founder names (G. Balaji Reddy, G. Pavani), URLs, and emails remain
                locked in their official form.
              </p>

              {renderTranslationFields(
                entityType,
                entityId,
                sourceData,
                draft,
                setDraft,
                activeLocaleOption.nativeName
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100"
          >
            Close
          </button>

          <div className="flex flex-wrap items-center gap-2">
            {currentRecord?.status === 'published' && (
              <button
                type="button"
                disabled={saving}
                onClick={handleUnpublish}
                className="inline-flex items-center gap-1.5 rounded-lg border border-amber-300 bg-amber-50 px-3.5 py-2 text-xs font-medium text-amber-900 hover:bg-amber-100 disabled:opacity-50"
              >
                <Globe className="h-3.5 w-3.5" />
                <span>Unpublish {activeLocaleOption.englishName}</span>
              </button>
            )}

            <button
              type="button"
              disabled={saving}
              onClick={handleSaveDraft}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#0F4C5C] bg-white px-3.5 py-2 text-xs font-semibold text-[#0F4C5C] hover:bg-slate-50 disabled:opacity-50"
            >
              <Save className="h-3.5 w-3.5" />
              <span>{saving ? 'Saving...' : 'Save Translation Draft'}</span>
            </button>

            <button
              type="button"
              disabled={saving}
              onClick={handlePublish}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#0F8A5F] px-4 py-2 text-xs font-semibold text-white hover:bg-[#0B5D4B] disabled:opacity-50"
            >
              <UploadCloud className="h-3.5 w-3.5" />
              <span>Publish {activeLocaleOption.englishName}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

interface SideBySideRowProps {
  label: string;
  englishValue: string;
  translatedValue: string;
  onChange: (val: string) => void;
  multiline?: boolean;
  rows?: number;
  targetName: string;
}

const SideBySideField: React.FC<SideBySideRowProps> = ({
  label,
  englishValue,
  translatedValue,
  onChange,
  multiline = false,
  rows = 3,
  targetName,
}) => (
  <div className="grid grid-cols-1 gap-3 rounded-xl border border-slate-200 bg-white p-4 md:grid-cols-2">
    <div>
      <span className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500">
        English Source · {label}
      </span>
      <div className="mt-1.5 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-xs leading-relaxed text-slate-700 whitespace-pre-line">
        {englishValue || '—'}
      </div>
    </div>
    <div>
      <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#0F8A5F]">
        {targetName} · {label}
      </label>
      {multiline ? (
        <textarea
          rows={rows}
          value={translatedValue}
          onChange={(e) => onChange(e.target.value)}
          placeholder={`Enter ${targetName} translation...`}
          className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs leading-relaxed focus:border-[#0F8A5F] focus:outline-none"
        />
      ) : (
        <input
          type="text"
          value={translatedValue}
          onChange={(e) => onChange(e.target.value)}
          placeholder={`Enter ${targetName} translation...`}
          className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-[#0F8A5F] focus:outline-none"
        />
      )}
    </div>
  </div>
);

function renderTranslationFields(
  entityType: TranslationEntityType,
  entityId: string,
  sourceData: any,
  draft: Record<string, any>,
  setDraft: React.Dispatch<React.SetStateAction<Record<string, any>>>,
  targetName: string
) {
  if (entityType === 'article') {
    const srcTags = Array.isArray(sourceData?.tags) ? sourceData.tags.join(', ') : '';
    const trTags = Array.isArray(draft.tags) ? draft.tags.join(', ') : '';
    return (
      <div className="space-y-3">
        <SideBySideField
          label="Article Title"
          englishValue={sourceData?.title || ''}
          translatedValue={draft.title || ''}
          onChange={(val) => setDraft((d) => ({ ...d, title: val }))}
          targetName={targetName}
        />
        <SideBySideField
          label="Short Summary"
          englishValue={sourceData?.short_summary || sourceData?.shortSummary || ''}
          translatedValue={draft.shortSummary || ''}
          onChange={(val) => setDraft((d) => ({ ...d, shortSummary: val }))}
          multiline
          rows={3}
          targetName={targetName}
        />
        <SideBySideField
          label="Full Article Content"
          englishValue={sourceData?.content || ''}
          translatedValue={draft.content || ''}
          onChange={(val) => setDraft((d) => ({ ...d, content: val }))}
          multiline
          rows={8}
          targetName={targetName}
        />
        <SideBySideField
          label="Author / Desk Label"
          englishValue={sourceData?.author || ''}
          translatedValue={draft.author || ''}
          onChange={(val) => setDraft((d) => ({ ...d, author: val }))}
          targetName={targetName}
        />
        <SideBySideField
          label="Tags (comma-separated)"
          englishValue={srcTags}
          translatedValue={trTags}
          onChange={(val) =>
            setDraft((d) => ({
              ...d,
              tags: val
                .split(',')
                .map((s) => s.trim())
                .filter(Boolean),
            }))
          }
          targetName={targetName}
        />
        <SideBySideField
          label="SEO Title"
          englishValue={sourceData?.seo_title || sourceData?.seoTitle || ''}
          translatedValue={draft.seoTitle || ''}
          onChange={(val) => setDraft((d) => ({ ...d, seoTitle: val }))}
          targetName={targetName}
        />
        <SideBySideField
          label="SEO Description"
          englishValue={sourceData?.seo_description || sourceData?.seoDescription || ''}
          translatedValue={draft.seoDescription || ''}
          onChange={(val) => setDraft((d) => ({ ...d, seoDescription: val }))}
          multiline
          rows={2}
          targetName={targetName}
        />
      </div>
    );
  }

  if (entityType === 'announcement') {
    return (
      <div className="space-y-3">
        <SideBySideField
          label="Title"
          englishValue={sourceData?.title || ''}
          translatedValue={draft.title || ''}
          onChange={(val) => setDraft((d) => ({ ...d, title: val }))}
          targetName={targetName}
        />
        <SideBySideField
          label="Short Summary (Banner & Cards)"
          englishValue={sourceData?.summary || ''}
          translatedValue={draft.summary || ''}
          onChange={(val) => setDraft((d) => ({ ...d, summary: val }))}
          multiline
          rows={3}
          targetName={targetName}
        />
        <SideBySideField
          label="Detailed Body"
          englishValue={sourceData?.body || ''}
          translatedValue={draft.body || ''}
          onChange={(val) => setDraft((d) => ({ ...d, body: val }))}
          multiline
          rows={5}
          targetName={targetName}
        />
      </div>
    );
  }

  if (entityType === 'media_asset') {
    return (
      <div className="space-y-3">
        <SideBySideField
          label="Caption"
          englishValue={sourceData?.caption || ''}
          translatedValue={draft.caption || ''}
          onChange={(val) => setDraft((d) => ({ ...d, caption: val }))}
          multiline
          rows={2}
          targetName={targetName}
        />
        <SideBySideField
          label="Accessibility Alt Text"
          englishValue={sourceData?.alt_text || ''}
          translatedValue={draft.altText || ''}
          onChange={(val) => setDraft((d) => ({ ...d, altText: val }))}
          multiline
          rows={2}
          targetName={targetName}
        />
      </div>
    );
  }

  // company_section editors
  if (entityId === 'about') {
    return (
      <div className="space-y-3">
        <SideBySideField
          label="Tagline"
          englishValue={sourceData?.tagline || ''}
          translatedValue={draft.tagline || ''}
          onChange={(val) => setDraft((d) => ({ ...d, tagline: val }))}
          targetName={targetName}
        />
        <SideBySideField
          label="Central Concept"
          englishValue={sourceData?.centralConcept || ''}
          translatedValue={draft.centralConcept || ''}
          onChange={(val) => setDraft((d) => ({ ...d, centralConcept: val }))}
          targetName={targetName}
        />
        <SideBySideField
          label="Hero Supporting Text"
          englishValue={sourceData?.heroSupportingText || ''}
          translatedValue={draft.heroSupportingText || ''}
          onChange={(val) => setDraft((d) => ({ ...d, heroSupportingText: val }))}
          multiline
          rows={2}
          targetName={targetName}
        />
        <SideBySideField
          label="Why MAATA Headline"
          englishValue={sourceData?.whyMaataHeadline || ''}
          translatedValue={draft.whyMaataHeadline || ''}
          onChange={(val) => setDraft((d) => ({ ...d, whyMaataHeadline: val }))}
          targetName={targetName}
        />
        <SideBySideField
          label="Why MAATA Narrative Body"
          englishValue={sourceData?.whyMaataBody || ''}
          translatedValue={draft.whyMaataBody || ''}
          onChange={(val) => setDraft((d) => ({ ...d, whyMaataBody: val }))}
          multiline
          rows={4}
          targetName={targetName}
        />
      </div>
    );
  }

  if (entityId === 'story') {
    const srcParas: string[] = Array.isArray(sourceData?.paragraphs)
      ? sourceData.paragraphs
      : [];
    const trParas: string[] = Array.isArray(draft.paragraphs) ? draft.paragraphs : [];
    return (
      <div className="space-y-3">
        <SideBySideField
          label="Story Headline"
          englishValue={sourceData?.headline || ''}
          translatedValue={draft.headline || ''}
          onChange={(val) => setDraft((d) => ({ ...d, headline: val }))}
          targetName={targetName}
        />
        {srcParas.map((p, idx) => (
          <SideBySideField
            key={idx}
            label={`Paragraph ${idx + 1}`}
            englishValue={p}
            translatedValue={trParas[idx] || ''}
            onChange={(val) => {
              const next = [...trParas];
              next[idx] = val;
              setDraft((d) => ({ ...d, paragraphs: next }));
            }}
            multiline
            rows={3}
            targetName={targetName}
          />
        ))}
      </div>
    );
  }

  if (entityId === 'vision_mission') {
    return (
      <div className="space-y-3">
        <SideBySideField
          label="Vision Label"
          englishValue={sourceData?.vision?.label || ''}
          translatedValue={draft.vision?.label || ''}
          onChange={(val) =>
            setDraft((d) => ({ ...d, vision: { ...(d.vision || {}), label: val } }))
          }
          targetName={targetName}
        />
        <SideBySideField
          label="Vision Statement"
          englishValue={sourceData?.vision?.statement || ''}
          translatedValue={draft.vision?.statement || ''}
          onChange={(val) =>
            setDraft((d) => ({
              ...d,
              vision: { ...(d.vision || {}), statement: val },
            }))
          }
          multiline
          rows={3}
          targetName={targetName}
        />
        <SideBySideField
          label="Mission Label"
          englishValue={sourceData?.mission?.label || ''}
          translatedValue={draft.mission?.label || ''}
          onChange={(val) =>
            setDraft((d) => ({ ...d, mission: { ...(d.mission || {}), label: val } }))
          }
          targetName={targetName}
        />
        <SideBySideField
          label="Mission Statement"
          englishValue={sourceData?.mission?.statement || ''}
          translatedValue={draft.mission?.statement || ''}
          onChange={(val) =>
            setDraft((d) => ({
              ...d,
              mission: { ...(d.mission || {}), statement: val },
            }))
          }
          multiline
          rows={3}
          targetName={targetName}
        />
      </div>
    );
  }

  if (entityId === 'founders' && Array.isArray(sourceData)) {
    const trItems: any[] = Array.isArray(draft.items) ? draft.items : [];
    return (
      <div className="space-y-5">
        {sourceData.map((f: any, idx: number) => {
          const item = trItems[idx] || { id: f.id, responsibilities: [] };
          const updateItem = (patch: Record<string, any>) => {
            const next = [...trItems];
            next[idx] = { ...item, ...patch };
            setDraft((d) => ({ ...d, items: next }));
          };
          return (
            <div
              key={f.id || idx}
              className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/70 p-4"
            >
              <p className="text-xs font-semibold text-[#092F35]">
                {f.name} (Official Name Preserved)
              </p>
              <SideBySideField
                label="Role / Title"
                englishValue={f.role || ''}
                translatedValue={item.role || ''}
                onChange={(val) => updateItem({ role: val })}
                targetName={targetName}
              />
              <SideBySideField
                label="Origin / Focus Note"
                englishValue={f.originNote || ''}
                translatedValue={item.originNote || ''}
                onChange={(val) => updateItem({ originNote: val })}
                targetName={targetName}
              />
              <SideBySideField
                label="Biography"
                englishValue={f.bio || ''}
                translatedValue={item.bio || ''}
                onChange={(val) => updateItem({ bio: val })}
                multiline
                rows={3}
                targetName={targetName}
              />
              <SideBySideField
                label="Perspective Quote"
                englishValue={f.perspectiveQuote || ''}
                translatedValue={item.perspectiveQuote || ''}
                onChange={(val) => updateItem({ perspectiveQuote: val })}
                multiline
                rows={2}
                targetName={targetName}
              />
              <SideBySideField
                label="Responsibilities (one per line)"
                englishValue={(f.responsibilities || []).join('\n')}
                translatedValue={(item.responsibilities || []).join('\n')}
                onChange={(val) =>
                  updateItem({
                    responsibilities: val.split('\n').map((l) => l.trimEnd()),
                  })
                }
                multiline
                rows={4}
                targetName={targetName}
              />
            </div>
          );
        })}
      </div>
    );
  }

  if (entityId === 'journey' && Array.isArray(sourceData)) {
    const trItems: any[] = Array.isArray(draft.items) ? draft.items : [];
    return (
      <div className="space-y-4">
        {sourceData.map((m: any, idx: number) => {
          const item = trItems[idx] || { id: m.id };
          const updateItem = (patch: Record<string, any>) => {
            const next = [...trItems];
            next[idx] = { ...item, ...patch };
            setDraft((d) => ({ ...d, items: next }));
          };
          return (
            <div
              key={m.id || idx}
              className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/70 p-4"
            >
              <p className="text-xs font-semibold text-[#092F35]">
                Milestone {m.step || idx + 1}
              </p>
              <SideBySideField
                label="Date / Chapter Label"
                englishValue={m.dateLabel || ''}
                translatedValue={item.dateLabel || ''}
                onChange={(val) => updateItem({ dateLabel: val })}
                targetName={targetName}
              />
              <SideBySideField
                label="Title"
                englishValue={m.title || ''}
                translatedValue={item.title || ''}
                onChange={(val) => updateItem({ title: val })}
                targetName={targetName}
              />
              <SideBySideField
                label="Description"
                englishValue={m.description || ''}
                translatedValue={item.description || ''}
                onChange={(val) => updateItem({ description: val })}
                multiline
                rows={2}
                targetName={targetName}
              />
            </div>
          );
        })}
      </div>
    );
  }

  if (entityId === 'careers') {
    const srcAreas: any[] = Array.isArray(sourceData?.areas) ? sourceData.areas : [];
    const trAreas: any[] = Array.isArray(draft.areas) ? draft.areas : [];
    return (
      <div className="space-y-4">
        <SideBySideField
          label="Careers Introduction"
          englishValue={sourceData?.intro || ''}
          translatedValue={draft.intro || ''}
          onChange={(val) => setDraft((d) => ({ ...d, intro: val }))}
          multiline
          rows={3}
          targetName={targetName}
        />
        <SideBySideField
          label="Future Opportunities Notice"
          englishValue={sourceData?.futureOpportunitiesNote || ''}
          translatedValue={draft.futureOpportunitiesNote || ''}
          onChange={(val) =>
            setDraft((d) => ({ ...d, futureOpportunitiesNote: val }))
          }
          multiline
          rows={3}
          targetName={targetName}
        />
        {srcAreas.map((a, idx) => {
          const trA = trAreas[idx] || { id: a.id, focus: [] };
          const updateArea = (patch: Record<string, any>) => {
            const next = [...trAreas];
            next[idx] = { ...trA, ...patch };
            setDraft((d) => ({ ...d, areas: next }));
          };
          return (
            <div
              key={a.id || idx}
              className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/70 p-4"
            >
              <p className="text-xs font-semibold text-[#092F35]">
                Work Area {a.index || idx + 1}
              </p>
              <SideBySideField
                label="Area Name"
                englishValue={a.area || ''}
                translatedValue={trA.area || ''}
                onChange={(val) => updateArea({ area: val })}
                targetName={targetName}
              />
              <SideBySideField
                label="Description"
                englishValue={a.description || ''}
                translatedValue={trA.description || ''}
                onChange={(val) => updateArea({ description: val })}
                multiline
                rows={2}
                targetName={targetName}
              />
              <SideBySideField
                label="Focus Areas (comma-separated)"
                englishValue={(a.focus || []).join(', ')}
                translatedValue={(trA.focus || []).join(', ')}
                onChange={(val) =>
                  updateArea({
                    focus: val
                      .split(',')
                      .map((s) => s.trim())
                      .filter(Boolean),
                  })
                }
                targetName={targetName}
              />
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <p className="text-xs text-slate-500">
      No custom translatable text fields configured for this item. Official contact details, URLs,
      and email addresses stay uniform across languages.
    </p>
  );
}

function renderLocalizedPreview(
  entityType: TranslationEntityType,
  entityId: string,
  sourceData: any,
  draft: Record<string, any>
) {
  if (entityType === 'article') {
    return (
      <div className="space-y-3">
        <h3 className="text-xl font-semibold">
          {draft.title || sourceData?.title}
        </h3>
        <p className="text-xs text-slate-600">
          {draft.author || sourceData?.author}
        </p>
        <p className="text-sm font-medium text-slate-800">
          {draft.shortSummary || sourceData?.short_summary}
        </p>
        <div className="whitespace-pre-line text-sm leading-relaxed text-slate-700">
          {draft.content || sourceData?.content}
        </div>
      </div>
    );
  }

  if (entityType === 'announcement') {
    return (
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">
          {draft.title || sourceData?.title}
        </h3>
        <p className="text-sm font-medium text-slate-800">
          {draft.summary || sourceData?.summary}
        </p>
        {(draft.body || sourceData?.body) && (
          <p className="whitespace-pre-line text-sm text-slate-700">
            {draft.body || sourceData?.body}
          </p>
        )}
      </div>
    );
  }

  if (entityType === 'media_asset') {
    return (
      <div className="space-y-2 text-sm">
        <p>
          <strong>Caption:</strong> {draft.caption || sourceData?.caption || '—'}
        </p>
        <p>
          <strong>Alt Text:</strong> {draft.altText || sourceData?.alt_text || '—'}
        </p>
      </div>
    );
  }

  if (entityId === 'about') {
    return (
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase text-[#0F8A5F]">
          {draft.tagline || sourceData?.tagline}
        </p>
        <h3 className="text-xl font-semibold">
          {draft.centralConcept || sourceData?.centralConcept}
        </h3>
        <p className="text-sm">{draft.heroSupportingText || sourceData?.heroSupportingText}</p>
        <h4 className="pt-2 text-base font-semibold">
          {draft.whyMaataHeadline || sourceData?.whyMaataHeadline}
        </h4>
        <p className="text-sm">{draft.whyMaataBody || sourceData?.whyMaataBody}</p>
      </div>
    );
  }

  if (entityId === 'story') {
    const paras: string[] = Array.isArray(sourceData?.paragraphs)
      ? sourceData.paragraphs
      : [];
    return (
      <div className="space-y-2">
        <h3 className="text-xl font-semibold">
          {draft.headline || sourceData?.headline}
        </h3>
        {paras.map((p, idx) => (
          <p key={idx} className="text-sm">
            {draft.paragraphs?.[idx] || p}
          </p>
        ))}
      </div>
    );
  }

  if (entityId === 'vision_mission') {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase text-[#0F8A5F]">
            {draft.vision?.label || sourceData?.vision?.label}
          </p>
          <p className="mt-1 text-sm">
            {draft.vision?.statement || sourceData?.vision?.statement}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase text-[#0F8A5F]">
            {draft.mission?.label || sourceData?.mission?.label}
          </p>
          <p className="mt-1 text-sm">
            {draft.mission?.statement || sourceData?.mission?.statement}
          </p>
        </div>
      </div>
    );
  }

  return (
    <pre className="whitespace-pre-wrap text-xs text-slate-700">
      {JSON.stringify(draft, null, 2)}
    </pre>
  );
}
