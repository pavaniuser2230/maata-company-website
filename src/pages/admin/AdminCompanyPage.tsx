import React, { useEffect, useState } from 'react';
import { Eye, Globe, Languages, Lock, Plus, Save, Trash2, UploadCloud } from 'lucide-react';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { usePublicCms } from '../../context/PublicCmsContext';
import {
  adminApi,
  type CompanySectionRecord,
  type TranslationSummaryItem,
} from '../../services/cmsApi';
import {
  ConfirmModal,
  formatAdminDate,
  PreviewModal,
  StatusBadge,
} from '../../components/admin/AdminUi';
import { TranslationModal } from '../../components/admin/TranslationModal';

const SECTION_TABS = [
  { key: 'about', label: 'About & Hero' },
  { key: 'story', label: 'Company Story' },
  { key: 'founders', label: 'Founders & Leadership' },
  { key: 'vision_mission', label: 'Vision & Mission' },
  { key: 'journey', label: 'Journey & Milestones' },
  { key: 'careers', label: 'Careers Info' },
  { key: 'contact', label: 'Contact Details' },
] as const;

type SectionKey = (typeof SECTION_TABS)[number]['key'];

export const AdminCompanyPage: React.FC = () => {
  const { user } = useAdminAuth();
  const { refreshPublicCms } = usePublicCms();

  const [sections, setSections] = useState<Record<string, CompanySectionRecord>>({});
  const [activeKey, setActiveKey] = useState<SectionKey>('about');
  const [draftState, setDraftState] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [translationOpen, setTranslationOpen] = useState(false);
  const [translationSummary, setTranslationSummary] = useState<
    Record<string, TranslationSummaryItem>
  >({});
  const [totalTargetLocales, setTotalTargetLocales] = useState(9);
  const [unpublishTarget, setUnpublishTarget] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const canEdit = user?.role === 'super_admin' || user?.role === 'content_manager';

  const loadTranslationSummary = async () => {
    try {
      const res = await adminApi.getTranslationsSummary('company_section');
      setTranslationSummary(res.summary || {});
      setTotalTargetLocales(res.totalTargetLocales || 9);
    } catch {
      // Non-blocking summary load
    }
  };

  const loadSections = async (selectKey?: SectionKey) => {
    setLoading(true);
    try {
      const res = await adminApi.getCompanySections();
      const map: Record<string, CompanySectionRecord> = {};
      for (const s of res.sections) {
        map[s.sectionKey] = s;
      }
      setSections(map);
      const targetKey = selectKey || activeKey;
      if (map[targetKey]) {
        setDraftState(structuredClone(map[targetKey].draftData));
      }
      void loadTranslationSummary();
    } catch (err: any) {
      setFeedback({ type: 'err', text: err?.message || 'Failed to load company content.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (canEdit) {
      void loadSections('about');
    } else {
      setLoading(false);
    }
  }, [canEdit]);

  if (!canEdit) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900">
        <div className="flex items-center gap-2 font-semibold">
          <Lock className="h-4 w-4" />
          <span>Restricted Module</span>
        </div>
        <p className="mt-1">
          Company Content Management is restricted to Super Administrators and Content Managers.
        </p>
      </div>
    );
  }

  const handleSelectTab = (key: SectionKey) => {
    setActiveKey(key);
    setFeedback(null);
    if (sections[key]) {
      setDraftState(structuredClone(sections[key].draftData));
    }
  };

  const handleSaveDraft = async () => {
    setSaving(true);
    setFeedback(null);
    try {
      await adminApi.saveCompanyDraft(activeKey, {
        title: sections[activeKey]?.title,
        data: draftState,
      });
      await loadSections(activeKey);
      setFeedback({ type: 'ok', text: 'Draft saved securely to database.' });
    } catch (err: any) {
      setFeedback({ type: 'err', text: err?.message || 'Failed to save draft.' });
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    setPublishing(true);
    setFeedback(null);
    try {
      // Persist current draft edits first, then publish
      await adminApi.saveCompanyDraft(activeKey, {
        title: sections[activeKey]?.title,
        data: draftState,
      });
      await adminApi.publishCompanySection(activeKey);
      await loadSections(activeKey);
      await refreshPublicCms();
      setFeedback({
        type: 'ok',
        text: 'Section published and live on the public MAATA corporate website.',
      });
    } catch (err: any) {
      setFeedback({ type: 'err', text: err?.message || 'Failed to publish section.' });
    } finally {
      setPublishing(false);
    }
  };

  const handleConfirmUnpublish = async () => {
    if (!unpublishTarget) return;
    setPublishing(true);
    try {
      await adminApi.unpublishCompanySection(unpublishTarget);
      await loadSections(activeKey);
      await refreshPublicCms();
      setFeedback({
        type: 'ok',
        text: 'Section unpublished from live CMS (public site reverts to safe fallback defaults).',
      });
    } catch (err: any) {
      setFeedback({ type: 'err', text: err?.message || 'Failed to unpublish section.' });
    } finally {
      setPublishing(false);
      setUnpublishTarget(null);
    }
  };

  const currentRecord = sections[activeKey];

  return (
    <div className="space-y-6">
      {/* Section Tabs */}
      <div className="flex flex-wrap gap-2 rounded-xl border border-slate-200 bg-white p-2">
        {SECTION_TABS.map((tab) => {
          const rec = sections[tab.key];
          const isActive = activeKey === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => handleSelectTab(tab.key)}
              className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-medium transition ${
                isActive
                  ? 'bg-[#092F35] text-white'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-[#092F35]'
              }`}
            >
              <span>{tab.label}</span>
              {rec && (
                <span
                  className={`h-2 w-2 rounded-full ${
                    rec.status === 'published' ? 'bg-emerald-400' : 'bg-amber-400'
                  }`}
                  title={rec.status}
                />
              )}
            </button>
          );
        })}
      </div>

      {feedback && (
        <div
          className={`rounded-xl border px-4 py-3 text-sm ${
            feedback.type === 'ok'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
              : 'border-rose-200 bg-rose-50 text-rose-800'
          }`}
        >
          {feedback.text}
        </div>
      )}

      {loading || !draftState ? (
        <div className="h-80 animate-pulse rounded-xl border border-slate-200 bg-white" />
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white">
          {/* Header & Actions */}
          <div className="flex flex-col justify-between gap-4 border-b border-slate-200 px-6 py-4 md:flex-row md:items-center">
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-base font-semibold text-[#092F35]">
                  {currentRecord?.title || activeKey}
                </h2>
                {currentRecord && <StatusBadge status={currentRecord.status} />}
              </div>
              <p className="mt-1 text-xs text-slate-500 tabular-nums">
                Last updated: {formatAdminDate(currentRecord?.updatedAt)} · Published:{' '}
                {formatAdminDate(currentRecord?.publishedAt)}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {activeKey !== 'contact' && (
                <button
                  type="button"
                  onClick={() => setTranslationOpen(true)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[#0F8A5F]/40 bg-emerald-50/70 px-3.5 py-2 text-xs font-semibold text-[#0B5D4B] hover:bg-emerald-100/70"
                >
                  <Languages className="h-3.5 w-3.5" />
                  <span>
                    Translations ({translationSummary[activeKey]?.publishedCount || 0}/
                    {totalTargetLocales})
                  </span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setPreviewOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                <Eye className="h-3.5 w-3.5" />
                <span>Preview</span>
              </button>
              <button
                type="button"
                onClick={handleSaveDraft}
                disabled={saving || publishing}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#0F4C5C] bg-white px-3.5 py-2 text-xs font-semibold text-[#0F4C5C] hover:bg-slate-50 disabled:opacity-50"
              >
                <Save className="h-3.5 w-3.5" />
                <span>{saving ? 'Saving...' : 'Save Draft'}</span>
              </button>
              <button
                type="button"
                onClick={handlePublish}
                disabled={saving || publishing}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#0F8A5F] px-4 py-2 text-xs font-semibold text-white hover:bg-[#0B5D4B] disabled:opacity-50"
              >
                <UploadCloud className="h-3.5 w-3.5" />
                <span>{publishing ? 'Publishing...' : 'Publish Live'}</span>
              </button>
              {currentRecord?.status === 'published' && (
                <button
                  type="button"
                  onClick={() => setUnpublishTarget(activeKey)}
                  disabled={saving || publishing}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-amber-300 bg-amber-50 px-3.5 py-2 text-xs font-medium text-amber-900 hover:bg-amber-100 disabled:opacity-50"
                >
                  <Globe className="h-3.5 w-3.5" />
                  <span>Unpublish</span>
                </button>
              )}
            </div>
          </div>

          {/* Structured Editors */}
          <div className="p-6">
            {activeKey === 'about' && (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-slate-700">Company Name</label>
                  <input
                    type="text"
                    value={draftState.companyName || ''}
                    onChange={(e) => setDraftState({ ...draftState, companyName: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700">Public Brand</label>
                  <input
                    type="text"
                    value={draftState.publicBrand || ''}
                    onChange={(e) => setDraftState({ ...draftState, publicBrand: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700">Tagline</label>
                  <input
                    type="text"
                    value={draftState.tagline || ''}
                    onChange={(e) => setDraftState({ ...draftState, tagline: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700">
                    Central Hero Headline
                  </label>
                  <input
                    type="text"
                    value={draftState.centralConcept || ''}
                    onChange={(e) =>
                      setDraftState({ ...draftState, centralConcept: e.target.value })
                    }
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-slate-700">
                    Hero Supporting Text
                  </label>
                  <textarea
                    rows={2}
                    value={draftState.heroSupportingText || ''}
                    onChange={(e) =>
                      setDraftState({ ...draftState, heroSupportingText: e.target.value })
                    }
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-slate-700">
                    Why MAATA Headline
                  </label>
                  <input
                    type="text"
                    value={draftState.whyMaataHeadline || ''}
                    onChange={(e) =>
                      setDraftState({ ...draftState, whyMaataHeadline: e.target.value })
                    }
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-slate-700">
                    Why MAATA Narrative Body
                  </label>
                  <textarea
                    rows={4}
                    value={draftState.whyMaataBody || ''}
                    onChange={(e) =>
                      setDraftState({ ...draftState, whyMaataBody: e.target.value })
                    }
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
              </div>
            )}

            {activeKey === 'story' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700">Story Headline</label>
                  <input
                    type="text"
                    value={draftState.headline || ''}
                    onChange={(e) => setDraftState({ ...draftState, headline: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-medium text-slate-700">
                      Story Paragraphs
                    </label>
                    <button
                      type="button"
                      onClick={() =>
                        setDraftState({
                          ...draftState,
                          paragraphs: [...(draftState.paragraphs || []), ''],
                        })
                      }
                      className="inline-flex items-center gap-1 text-xs font-medium text-[#0F8A5F] hover:underline"
                    >
                      <Plus className="h-3.5 w-3.5" /> Add Paragraph
                    </button>
                  </div>
                  <div className="mt-2 space-y-3">
                    {(draftState.paragraphs || []).map((para: string, idx: number) => (
                      <div key={idx} className="flex gap-2">
                        <textarea
                          rows={3}
                          value={para}
                          onChange={(e) => {
                            const next = [...draftState.paragraphs];
                            next[idx] = e.target.value;
                            setDraftState({ ...draftState, paragraphs: next });
                          }}
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const next = draftState.paragraphs.filter(
                              (_: string, i: number) => i !== idx
                            );
                            setDraftState({ ...draftState, paragraphs: next });
                          }}
                          className="self-start rounded-lg border border-slate-200 p-2 text-slate-500 hover:bg-rose-50 hover:text-rose-700"
                          aria-label="Remove paragraph"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeKey === 'founders' && Array.isArray(draftState) && (
              <div className="space-y-6">
                <p className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs text-slate-600">
                  Official founder portraits are preserved directly from the approved MAATA brand
                  assets. Edit biographies, titles, quotes, and responsibilities below.
                </p>
                {draftState.map((founder: any, fIdx: number) => (
                  <div
                    key={founder.id || fIdx}
                    className="rounded-xl border border-slate-200 bg-slate-50/40 p-5"
                  >
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div>
                        <label className="block text-xs font-medium text-slate-700">Name</label>
                        <input
                          type="text"
                          value={founder.name || ''}
                          onChange={(e) => {
                            const next = [...draftState];
                            next[fIdx] = { ...founder, name: e.target.value };
                            setDraftState(next);
                          }}
                          className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-700">Role / Title</label>
                        <input
                          type="text"
                          value={founder.role || ''}
                          onChange={(e) => {
                            const next = [...draftState];
                            next[fIdx] = { ...founder, role: e.target.value };
                            setDraftState(next);
                          }}
                          className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-xs font-medium text-slate-700">
                          Origin / Focus Note
                        </label>
                        <input
                          type="text"
                          value={founder.originNote || ''}
                          onChange={(e) => {
                            const next = [...draftState];
                            next[fIdx] = { ...founder, originNote: e.target.value };
                            setDraftState(next);
                          }}
                          className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-xs font-medium text-slate-700">Biography</label>
                        <textarea
                          rows={3}
                          value={founder.bio || ''}
                          onChange={(e) => {
                            const next = [...draftState];
                            next[fIdx] = { ...founder, bio: e.target.value };
                            setDraftState(next);
                          }}
                          className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-xs font-medium text-slate-700">
                          Leadership Perspective Quote
                        </label>
                        <textarea
                          rows={2}
                          value={founder.perspectiveQuote || ''}
                          onChange={(e) => {
                            const next = [...draftState];
                            next[fIdx] = { ...founder, perspectiveQuote: e.target.value };
                            setDraftState(next);
                          }}
                          className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-xs font-medium text-slate-700">
                          Responsibilities (one per line)
                        </label>
                        <textarea
                          rows={4}
                          value={(founder.responsibilities || []).join('\n')}
                          onChange={(e) => {
                            const next = [...draftState];
                            next[fIdx] = {
                              ...founder,
                              responsibilities: e.target.value
                                .split('\n')
                                .map((l) => l.trim())
                                .filter(Boolean),
                            };
                            setDraftState(next);
                          }}
                          className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeKey === 'vision_mission' && (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="space-y-3 rounded-xl border border-slate-200 p-4">
                  <h3 className="text-sm font-semibold text-[#092F35]">Vision Statement</h3>
                  <div>
                    <label className="block text-xs font-medium text-slate-700">Label</label>
                    <input
                      type="text"
                      value={draftState.vision?.label || ''}
                      onChange={(e) =>
                        setDraftState({
                          ...draftState,
                          vision: { ...draftState.vision, label: e.target.value },
                        })
                      }
                      className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700">Statement</label>
                    <textarea
                      rows={4}
                      value={draftState.vision?.statement || ''}
                      onChange={(e) =>
                        setDraftState({
                          ...draftState,
                          vision: { ...draftState.vision, statement: e.target.value },
                        })
                      }
                      className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-3 rounded-xl border border-slate-200 p-4">
                  <h3 className="text-sm font-semibold text-[#092F35]">Mission Statement</h3>
                  <div>
                    <label className="block text-xs font-medium text-slate-700">Label</label>
                    <input
                      type="text"
                      value={draftState.mission?.label || ''}
                      onChange={(e) =>
                        setDraftState({
                          ...draftState,
                          mission: { ...draftState.mission, label: e.target.value },
                        })
                      }
                      className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700">Statement</label>
                    <textarea
                      rows={4}
                      value={draftState.mission?.statement || ''}
                      onChange={(e) =>
                        setDraftState({
                          ...draftState,
                          mission: { ...draftState.mission, statement: e.target.value },
                        })
                      }
                      className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeKey === 'journey' && Array.isArray(draftState) && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-slate-600">
                    Manage MAATA Technologies milestones displayed on the public Company Journey
                    timeline.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      const nextIdx = String(draftState.length + 1).padStart(2, '0');
                      setDraftState([
                        ...draftState,
                        {
                          id: `milestone-${Date.now()}`,
                          step: nextIdx,
                          dateLabel: 'New Milestone',
                          isPlaceholder: false,
                          title: '',
                          description: '',
                        },
                      ]);
                    }}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-[#0F8A5F] px-3 py-1.5 text-xs font-semibold text-[#0F8A5F] hover:bg-emerald-50"
                  >
                    <Plus className="h-3.5 w-3.5" /> Add Milestone
                  </button>
                </div>

                {draftState.map((item: any, idx: number) => (
                  <div
                    key={item.id || idx}
                    className="rounded-xl border border-slate-200 bg-slate-50/40 p-4"
                  >
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
                      <div className="md:col-span-2">
                        <label className="block text-xs font-medium text-slate-700">Step</label>
                        <input
                          type="text"
                          value={item.step || ''}
                          onChange={(e) => {
                            const next = [...draftState];
                            next[idx] = { ...item, step: e.target.value };
                            setDraftState(next);
                          }}
                          className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm tabular-nums"
                        />
                      </div>
                      <div className="md:col-span-4">
                        <label className="block text-xs font-medium text-slate-700">
                          Date / Chapter Label
                        </label>
                        <input
                          type="text"
                          value={item.dateLabel || ''}
                          onChange={(e) => {
                            const next = [...draftState];
                            next[idx] = { ...item, dateLabel: e.target.value };
                            setDraftState(next);
                          }}
                          className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                        />
                      </div>
                      <div className="md:col-span-5">
                        <label className="block text-xs font-medium text-slate-700">Title</label>
                        <input
                          type="text"
                          value={item.title || ''}
                          onChange={(e) => {
                            const next = [...draftState];
                            next[idx] = { ...item, title: e.target.value };
                            setDraftState(next);
                          }}
                          className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                        />
                      </div>
                      <div className="flex items-end justify-end md:col-span-1">
                        <button
                          type="button"
                          onClick={() =>
                            setDraftState(draftState.filter((_: any, i: number) => i !== idx))
                          }
                          className="rounded-lg border border-slate-200 bg-white p-2 text-slate-500 hover:bg-rose-50 hover:text-rose-700"
                          aria-label="Remove milestone"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="md:col-span-12">
                        <label className="block text-xs font-medium text-slate-700">
                          Description
                        </label>
                        <textarea
                          rows={2}
                          value={item.description || ''}
                          onChange={(e) => {
                            const next = [...draftState];
                            next[idx] = { ...item, description: e.target.value };
                            setDraftState(next);
                          }}
                          className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                        />
                      </div>
                      <div className="md:col-span-12">
                        <label className="inline-flex items-center gap-2 text-xs text-slate-600">
                          <input
                            type="checkbox"
                            checked={Boolean(item.isPlaceholder)}
                            onChange={(e) => {
                              const next = [...draftState];
                              next[idx] = { ...item, isPlaceholder: e.target.checked };
                              setDraftState(next);
                            }}
                          />
                          <span>Mark as editable placeholder milestone</span>
                        </label>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeKey === 'careers' && (
              <div className="space-y-5">
                <div>
                  <label className="block text-xs font-medium text-slate-700">
                    Careers Introduction
                  </label>
                  <textarea
                    rows={3}
                    value={draftState.intro || ''}
                    onChange={(e) => setDraftState({ ...draftState, intro: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700">
                    Future Opportunities Notice (Honesty Policy)
                  </label>
                  <textarea
                    rows={3}
                    value={draftState.futureOpportunitiesNote || ''}
                    onChange={(e) =>
                      setDraftState({ ...draftState, futureOpportunitiesNote: e.target.value })
                    }
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                      Work & Collaboration Areas
                    </h3>
                    <button
                      type="button"
                      onClick={() =>
                        setDraftState({
                          ...draftState,
                          areas: [
                            ...(draftState.areas || []),
                            {
                              id: `area-${Date.now()}`,
                              index: String((draftState.areas?.length || 0) + 1).padStart(2, '0'),
                              area: '',
                              description: '',
                              focus: [],
                            },
                          ],
                        })
                      }
                      className="inline-flex items-center gap-1 text-xs font-medium text-[#0F8A5F] hover:underline"
                    >
                      <Plus className="h-3.5 w-3.5" /> Add Area
                    </button>
                  </div>

                  {(draftState.areas || []).map((area: any, idx: number) => (
                    <div key={area.id || idx} className="rounded-xl border border-slate-200 p-4">
                      <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
                        <div className="md:col-span-2">
                          <label className="block text-xs font-medium text-slate-700">Index</label>
                          <input
                            type="text"
                            value={area.index || ''}
                            onChange={(e) => {
                              const next = [...draftState.areas];
                              next[idx] = { ...area, index: e.target.value };
                              setDraftState({ ...draftState, areas: next });
                            }}
                            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm tabular-nums"
                          />
                        </div>
                        <div className="md:col-span-9">
                          <label className="block text-xs font-medium text-slate-700">
                            Area Name
                          </label>
                          <input
                            type="text"
                            value={area.area || ''}
                            onChange={(e) => {
                              const next = [...draftState.areas];
                              next[idx] = { ...area, area: e.target.value };
                              setDraftState({ ...draftState, areas: next });
                            }}
                            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                          />
                        </div>
                        <div className="flex items-end justify-end md:col-span-1">
                          <button
                            type="button"
                            onClick={() => {
                              const next = draftState.areas.filter(
                                (_: any, i: number) => i !== idx
                              );
                              setDraftState({ ...draftState, areas: next });
                            }}
                            className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:bg-rose-50 hover:text-rose-700"
                            aria-label="Remove area"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                        <div className="md:col-span-12">
                          <label className="block text-xs font-medium text-slate-700">
                            Description
                          </label>
                          <textarea
                            rows={2}
                            value={area.description || ''}
                            onChange={(e) => {
                              const next = [...draftState.areas];
                              next[idx] = { ...area, description: e.target.value };
                              setDraftState({ ...draftState, areas: next });
                            }}
                            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                          />
                        </div>
                        <div className="md:col-span-12">
                          <label className="block text-xs font-medium text-slate-700">
                            Focus Areas (comma-separated)
                          </label>
                          <input
                            type="text"
                            value={(area.focus || []).join(', ')}
                            onChange={(e) => {
                              const next = [...draftState.areas];
                              next[idx] = {
                                ...area,
                                focus: e.target.value
                                  .split(',')
                                  .map((s) => s.trim())
                                  .filter(Boolean),
                              };
                              setDraftState({ ...draftState, areas: next });
                            }}
                            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeKey === 'contact' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="block text-xs font-medium text-slate-700">Company Name</label>
                    <input
                      type="text"
                      value={draftState.companyName || ''}
                      onChange={(e) =>
                        setDraftState({ ...draftState, companyName: e.target.value })
                      }
                      className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700">
                      Headquarters Location
                    </label>
                    <input
                      type="text"
                      value={draftState.location || ''}
                      onChange={(e) => setDraftState({ ...draftState, location: e.target.value })}
                      className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700">
                      Primary Support Email
                    </label>
                    <input
                      type="email"
                      value={draftState.supportEmail || ''}
                      onChange={(e) =>
                        setDraftState({ ...draftState, supportEmail: e.target.value })
                      }
                      className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700">
                      Secondary Support Email
                    </label>
                    <input
                      type="email"
                      value={draftState.secondarySupportEmail || ''}
                      onChange={(e) =>
                        setDraftState({ ...draftState, secondarySupportEmail: e.target.value })
                      }
                      className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-slate-700">
                      Official App URL
                    </label>
                    <input
                      type="url"
                      value={draftState.appUrl || ''}
                      onChange={(e) => setDraftState({ ...draftState, appUrl: e.target.value })}
                      className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                      Social Channels
                    </h3>
                    <button
                      type="button"
                      onClick={() =>
                        setDraftState({
                          ...draftState,
                          socialLinks: [
                            ...(draftState.socialLinks || []),
                            { label: '', handle: '', href: '' },
                          ],
                        })
                      }
                      className="inline-flex items-center gap-1 text-xs font-medium text-[#0F8A5F] hover:underline"
                    >
                      <Plus className="h-3.5 w-3.5" /> Add Social Link
                    </button>
                  </div>
                  {(draftState.socialLinks || []).map((link: any, idx: number) => (
                    <div key={idx} className="grid grid-cols-1 gap-2 md:grid-cols-12">
                      <input
                        type="text"
                        placeholder="Platform (e.g. LinkedIn)"
                        value={link.label || ''}
                        onChange={(e) => {
                          const next = [...draftState.socialLinks];
                          next[idx] = { ...link, label: e.target.value };
                          setDraftState({ ...draftState, socialLinks: next });
                        }}
                        className="rounded-lg border border-slate-300 px-3 py-2 text-sm md:col-span-3"
                      />
                      <input
                        type="text"
                        placeholder="Handle"
                        value={link.handle || ''}
                        onChange={(e) => {
                          const next = [...draftState.socialLinks];
                          next[idx] = { ...link, handle: e.target.value };
                          setDraftState({ ...draftState, socialLinks: next });
                        }}
                        className="rounded-lg border border-slate-300 px-3 py-2 text-sm md:col-span-3"
                      />
                      <input
                        type="url"
                        placeholder="https://..."
                        value={link.href || ''}
                        onChange={(e) => {
                          const next = [...draftState.socialLinks];
                          next[idx] = { ...link, href: e.target.value };
                          setDraftState({ ...draftState, socialLinks: next });
                        }}
                        className="rounded-lg border border-slate-300 px-3 py-2 text-sm md:col-span-5"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const next = draftState.socialLinks.filter(
                            (_: any, i: number) => i !== idx
                          );
                          setDraftState({ ...draftState, socialLinks: next });
                        }}
                        className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:bg-rose-50 hover:text-rose-700 md:col-span-1"
                        aria-label="Remove social link"
                      >
                        <Trash2 className="mx-auto h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Preview Modal */}
      <PreviewModal
        open={previewOpen}
        title={currentRecord?.title || 'Section Preview'}
        subtitle={`Previewing draft state for section "${activeKey}"`}
        onClose={() => setPreviewOpen(false)}
      >
        {activeKey === 'about' && draftState && (
          <div className="space-y-4 text-[#092F35]">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#0F8A5F]">
              {draftState.tagline}
            </p>
            <h2 className="text-2xl font-semibold">{draftState.centralConcept}</h2>
            <p className="text-sm text-slate-700">{draftState.heroSupportingText}</p>
            <hr className="border-slate-200" />
            <h3 className="text-lg font-semibold">{draftState.whyMaataHeadline}</h3>
            <p className="text-sm leading-relaxed text-slate-700">{draftState.whyMaataBody}</p>
          </div>
        )}
        {activeKey === 'story' && draftState && (
          <div className="space-y-4 text-[#092F35]">
            <h2 className="text-2xl font-semibold">{draftState.headline}</h2>
            {(draftState.paragraphs || []).map((p: string, i: number) => (
              <p key={i} className="text-sm leading-relaxed text-slate-700">
                {p}
              </p>
            ))}
          </div>
        )}
        {activeKey === 'founders' && Array.isArray(draftState) && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {draftState.map((f: any) => (
              <div key={f.id} className="rounded-xl border border-slate-200 p-4">
                <h3 className="text-lg font-semibold text-[#092F35]">{f.name}</h3>
                <p className="text-xs font-medium text-[#0F8A5F]">{f.role}</p>
                <p className="mt-2 text-xs text-slate-600">{f.bio}</p>
                <ul className="mt-3 list-disc space-y-1 pl-4 text-xs text-slate-700">
                  {(f.responsibilities || []).map((r: string, i: number) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
        {activeKey === 'vision_mission' && draftState && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-[#F7F4EC] p-5">
              <p className="text-xs font-semibold uppercase text-[#0F8A5F]">
                {draftState.vision?.label}
              </p>
              <p className="mt-2 text-base font-medium text-[#092F35]">
                {draftState.vision?.statement}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-[#F7F4EC] p-5">
              <p className="text-xs font-semibold uppercase text-[#0F8A5F]">
                {draftState.mission?.label}
              </p>
              <p className="mt-2 text-base font-medium text-[#092F35]">
                {draftState.mission?.statement}
              </p>
            </div>
          </div>
        )}
        {activeKey === 'journey' && Array.isArray(draftState) && (
          <div className="space-y-3">
            {draftState.map((m: any) => (
              <div key={m.id} className="rounded-lg border border-slate-200 p-4">
                <p className="text-xs font-semibold text-[#0F8A5F] tabular-nums">
                  {m.step} · {m.dateLabel}
                </p>
                <h4 className="mt-1 font-semibold text-[#092F35]">{m.title}</h4>
                <p className="mt-1 text-xs text-slate-600">{m.description}</p>
              </div>
            ))}
          </div>
        )}
        {activeKey === 'careers' && draftState && (
          <div className="space-y-4">
            <p className="text-sm text-slate-700">{draftState.intro}</p>
            <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-950">
              {draftState.futureOpportunitiesNote}
            </p>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {(draftState.areas || []).map((a: any) => (
                <div key={a.id} className="rounded-lg border border-slate-200 p-3">
                  <p className="text-xs font-semibold text-[#0F8A5F]">{a.index}</p>
                  <h4 className="font-semibold text-[#092F35]">{a.area}</h4>
                  <p className="mt-1 text-xs text-slate-600">{a.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}
        {activeKey === 'contact' && draftState && (
          <div className="space-y-3 text-sm text-[#092F35]">
            <p>
              <strong>Company:</strong> {draftState.companyName}
            </p>
            <p>
              <strong>Location:</strong> {draftState.location}
            </p>
            <p>
              <strong>Support Email:</strong> {draftState.supportEmail}
            </p>
            <p>
              <strong>App URL:</strong> {draftState.appUrl}
            </p>
          </div>
        )}
      </PreviewModal>

      <ConfirmModal
        open={Boolean(unpublishTarget)}
        title="Unpublish Company Section?"
        description="Unpublishing removes this section's custom CMS data from the public website bootstrap endpoint. The site will revert to built-in default copy until you publish again."
        confirmLabel="Unpublish Section"
        loading={publishing}
        onConfirm={handleConfirmUnpublish}
        onCancel={() => setUnpublishTarget(null)}
      />

      <TranslationModal
        open={translationOpen}
        entityType="company_section"
        entityId={activeKey}
        entityLabel={currentRecord?.title || activeKey}
        sourceData={draftState}
        onClose={() => setTranslationOpen(false)}
        onSaved={() => void loadTranslationSummary()}
      />
    </div>
  );
};
