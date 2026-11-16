import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Archive,
  ArrowLeft,
  Edit3,
  Eye,
  Image as ImageIcon,
  Languages,
  Lock,
  Pin,
  Plus,
  Save,
  Trash2,
  UploadCloud,
} from 'lucide-react';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { usePublicCms } from '../../context/PublicCmsContext';
import {
  adminApi,
  type CmsAnnouncement,
  type TranslationSummaryItem,
} from '../../services/cmsApi';
import {
  ConfirmModal,
  formatAdminDate,
  fromDatetimeLocalValue,
  MediaPickerModal,
  PreviewModal,
  StatusBadge,
  toDatetimeLocalValue,
} from '../../components/admin/AdminUi';
import { TranslationModal } from '../../components/admin/TranslationModal';

const KINDS: { value: CmsAnnouncement['kind']; label: string }[] = [
  { value: 'company_announcement', label: 'Company Announcement' },
  { value: 'product_update', label: 'Product Update' },
  { value: 'new_feature', label: 'New Feature' },
  { value: 'service_notification', label: 'Service Notification' },
  { value: 'important_notice', label: 'Important Notice' },
];

interface AnnouncementFormState {
  id?: string;
  kind: CmsAnnouncement['kind'];
  title: string;
  summary: string;
  body: string;
  imageUrl: string;
  isPinned: boolean;
  visibility: 'public' | 'hidden';
  status: CmsAnnouncement['status'];
  showAsBanner: boolean;
  publishAtLocal: string;
  startsAtLocal: string;
  expiresAtLocal: string;
}

const EMPTY_FORM: AnnouncementFormState = {
  kind: 'company_announcement',
  title: '',
  summary: '',
  body: '',
  imageUrl: '',
  isPinned: false,
  visibility: 'public',
  status: 'draft',
  showAsBanner: false,
  publishAtLocal: '',
  startsAtLocal: '',
  expiresAtLocal: '',
};

export const AdminAnnouncementsPage: React.FC = () => {
  const { user } = useAdminAuth();
  const { refreshPublicCms } = usePublicCms();
  const [searchParams, setSearchParams] = useSearchParams();

  const canEdit = user?.role === 'super_admin' || user?.role === 'content_manager';

  const [items, setItems] = useState<CmsAnnouncement[]>([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<'list' | 'edit'>(
    searchParams.get('new') === '1' ? 'edit' : 'list'
  );
  const [form, setForm] = useState<AnnouncementFormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<CmsAnnouncement | null>(null);
  const [translationTarget, setTranslationTarget] = useState<{
    id: string;
    label: string;
    source: any;
  } | null>(null);
  const [translationSummary, setTranslationSummary] = useState<
    Record<string, TranslationSummaryItem>
  >({});
  const [totalTargetLocales, setTotalTargetLocales] = useState(9);

  const loadTranslationSummary = async () => {
    try {
      const res = await adminApi.getTranslationsSummary('announcement');
      setTranslationSummary(res.summary || {});
      setTotalTargetLocales(res.totalTargetLocales || 9);
    } catch {
      // Non-blocking summary load
    }
  };

  const loadItems = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getAnnouncements(
        statusFilter !== 'all' ? statusFilter : undefined
      );
      setItems(res.items);
      void loadTranslationSummary();
    } catch (err: any) {
      setFeedback({ type: 'err', text: err?.message || 'Failed to load announcements.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (canEdit) {
      void loadItems();
    } else {
      setLoading(false);
    }
  }, [canEdit, statusFilter]);

  if (!canEdit) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900">
        <div className="flex items-center gap-2 font-semibold">
          <Lock className="h-4 w-4" />
          <span>Restricted Module</span>
        </div>
        <p className="mt-1">
          Announcements and website notification banners are managed by Super Administrators and
          Content Managers.
        </p>
      </div>
    );
  }

  const openEdit = (item: CmsAnnouncement) => {
    setForm({
      id: item.id,
      kind: item.kind,
      title: item.title,
      summary: item.summary,
      body: item.body || '',
      imageUrl: item.image_url || '',
      isPinned: item.is_pinned === 1,
      visibility: item.visibility,
      status: item.status,
      showAsBanner: item.show_as_banner === 1,
      publishAtLocal: toDatetimeLocalValue(item.publish_at),
      startsAtLocal: toDatetimeLocalValue(item.starts_at),
      expiresAtLocal: toDatetimeLocalValue(item.expires_at),
    });
    setFeedback(null);
    setMode('edit');
  };

  const saveAnnouncement = async (targetStatus: CmsAnnouncement['status']) => {
    setFeedback(null);
    if (targetStatus === 'scheduled' && !form.publishAtLocal) {
      setFeedback({
        type: 'err',
        text: 'Select a Publish Date & Time before scheduling.',
      });
      return;
    }

    const payload = {
      kind: form.kind,
      title: form.title.trim(),
      summary: form.summary.trim(),
      body: form.body.trim(),
      imageUrl: form.imageUrl.trim(),
      isPinned: form.isPinned,
      visibility: form.visibility,
      status: targetStatus,
      showAsBanner: form.showAsBanner,
      publishAt: fromDatetimeLocalValue(form.publishAtLocal),
      startsAt: fromDatetimeLocalValue(form.startsAtLocal),
      expiresAt: fromDatetimeLocalValue(form.expiresAtLocal),
    };

    setSaving(true);
    try {
      if (form.id) {
        await adminApi.updateAnnouncement(form.id, payload);
      } else {
        const res = await adminApi.createAnnouncement(payload);
        setForm((prev) => ({ ...prev, id: res.id }));
      }
      setForm((prev) => ({ ...prev, status: targetStatus }));
      await loadItems();
      await refreshPublicCms();
      setFeedback({
        type: 'ok',
        text: `Announcement saved with status "${targetStatus}".`,
      });
    } catch (err: any) {
      setFeedback({ type: 'err', text: err?.message || 'Unable to save announcement.' });
    } finally {
      setSaving(false);
    }
  };

  const quickTogglePin = async (item: CmsAnnouncement) => {
    try {
      await adminApi.updateAnnouncement(item.id, {
        kind: item.kind,
        title: item.title,
        summary: item.summary,
        body: item.body || '',
        imageUrl: item.image_url || '',
        isPinned: item.is_pinned !== 1,
        visibility: item.visibility,
        status: item.status,
        showAsBanner: item.show_as_banner === 1,
        publishAt: item.publish_at,
        startsAt: item.starts_at,
        expiresAt: item.expires_at,
      });
      await loadItems();
      await refreshPublicCms();
    } catch (err: any) {
      setFeedback({ type: 'err', text: err?.message || 'Failed to update pin status.' });
    }
  };

  const quickArchive = async (item: CmsAnnouncement) => {
    try {
      await adminApi.updateAnnouncement(item.id, {
        kind: item.kind,
        title: item.title,
        summary: item.summary,
        body: item.body || '',
        imageUrl: item.image_url || '',
        isPinned: false,
        visibility: item.visibility,
        status: 'archived',
        showAsBanner: false,
        publishAt: item.publish_at,
        startsAt: item.starts_at,
        expiresAt: item.expires_at,
      });
      await loadItems();
      await refreshPublicCms();
      setFeedback({ type: 'ok', text: `"${item.title}" moved to archive.` });
    } catch (err: any) {
      setFeedback({ type: 'err', text: err?.message || 'Failed to archive announcement.' });
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      await adminApi.deleteAnnouncement(deleteTarget.id);
      setDeleteTarget(null);
      await loadItems();
      await refreshPublicCms();
      setFeedback({ type: 'ok', text: 'Announcement deleted.' });
    } catch (err: any) {
      setFeedback({ type: 'err', text: err?.message || 'Failed to delete announcement.' });
    } finally {
      setSaving(false);
    }
  };

  if (mode === 'edit') {
    return (
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => {
              setMode('list');
              setSearchParams({});
            }}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Announcements</span>
          </button>

          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={form.status} />
            {form.id && (
              <button
                type="button"
                onClick={() =>
                  setTranslationTarget({
                    id: form.id!,
                    label: form.title || 'Announcement Translations',
                    source: {
                      title: form.title,
                      summary: form.summary,
                      body: form.body,
                    },
                  })
                }
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#0F8A5F]/40 bg-emerald-50/70 px-3.5 py-2 text-xs font-semibold text-[#0B5D4B] hover:bg-emerald-100/70"
              >
                <Languages className="h-3.5 w-3.5" />
                <span>
                  Translations ({translationSummary[form.id]?.publishedCount || 0}/
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
              disabled={saving}
              onClick={() => saveAnnouncement('draft')}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#0F4C5C] bg-white px-3.5 py-2 text-xs font-semibold text-[#0F4C5C] hover:bg-slate-50 disabled:opacity-50"
            >
              <Save className="h-3.5 w-3.5" />
              <span>Save Draft</span>
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={() => saveAnnouncement('scheduled')}
              className="inline-flex items-center gap-1.5 rounded-lg border border-amber-300 bg-amber-50 px-3.5 py-2 text-xs font-semibold text-amber-900 hover:bg-amber-100 disabled:opacity-50"
            >
              <span>Schedule</span>
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={() => saveAnnouncement('published')}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#0F8A5F] px-4 py-2 text-xs font-semibold text-white hover:bg-[#0B5D4B] disabled:opacity-50"
            >
              <UploadCloud className="h-3.5 w-3.5" />
              <span>Publish Live</span>
            </button>
          </div>
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

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 lg:col-span-2">
            <div>
              <label className="block text-xs font-medium text-slate-700">Announcement Kind *</label>
              <select
                value={form.kind}
                onChange={(e) =>
                  setForm({ ...form, kind: e.target.value as CmsAnnouncement['kind'] })
                }
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
              >
                {KINDS.map((k) => (
                  <option key={k.value} value={k.value}>
                    {k.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700">Title *</label>
              <input
                type="text"
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g., MAATA Business Billing Update"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700">
                Short Summary * (shown on website banners & update cards)
              </label>
              <textarea
                rows={3}
                required
                value={form.summary}
                onChange={(e) => setForm({ ...form, summary: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700">
                Detailed Notice Body (optional)
              </label>
              <textarea
                rows={6}
                value={form.body}
                onChange={(e) => setForm({ ...form, body: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm"
              />
            </div>
          </div>

          <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-5">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-600">
              Visibility & Website Banner Controls
            </h3>

            <div>
              <label className="block text-xs font-medium text-slate-700">Public Visibility</label>
              <select
                value={form.visibility}
                onChange={(e) =>
                  setForm({ ...form, visibility: e.target.value as 'public' | 'hidden' })
                }
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
              >
                <option value="public">Public (Visible when published)</option>
                <option value="hidden">Hidden (Internal only)</option>
              </select>
            </div>

            <label className="flex items-start gap-2.5 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs">
              <input
                type="checkbox"
                checked={form.showAsBanner}
                onChange={(e) => setForm({ ...form, showAsBanner: e.target.checked })}
                className="mt-0.5"
              />
              <span>
                <strong className="block text-[#092F35]">
                  Display as Public Website Notification Banner
                </strong>
                <span className="text-slate-500">
                  Shows as a dismissible announcement bar across public website pages while active.
                </span>
              </span>
            </label>

            <label className="flex items-center gap-2.5 rounded-lg border border-slate-200 p-3 text-xs">
              <input
                type="checkbox"
                checked={form.isPinned}
                onChange={(e) => setForm({ ...form, isPinned: e.target.checked })}
              />
              <span className="font-medium text-[#092F35]">Pin announcement to top</span>
            </label>

            <div>
              <label className="block text-xs font-medium text-slate-700">Publish At</label>
              <input
                type="datetime-local"
                value={form.publishAtLocal}
                onChange={(e) => setForm({ ...form, publishAtLocal: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs tabular-nums"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700">
                Banner / Notice Start Date (optional)
              </label>
              <input
                type="datetime-local"
                value={form.startsAtLocal}
                onChange={(e) => setForm({ ...form, startsAtLocal: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs tabular-nums"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700">
                Banner / Notice Expiry Date (optional)
              </label>
              <input
                type="datetime-local"
                value={form.expiresAtLocal}
                onChange={(e) => setForm({ ...form, expiresAtLocal: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs tabular-nums"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700">Image (optional)</label>
              <div className="mt-1 flex gap-2">
                <input
                  type="text"
                  value={form.imageUrl}
                  onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                  placeholder="/media/..."
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs"
                />
                <button
                  type="button"
                  onClick={() => setMediaPickerOpen(true)}
                  className="shrink-0 rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-slate-700 hover:bg-slate-100"
                  title="Pick from Media Library"
                >
                  <ImageIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <MediaPickerModal
          open={mediaPickerOpen}
          selectedUrl={form.imageUrl}
          onSelect={(url) => setForm((prev) => ({ ...prev, imageUrl: url }))}
          onClose={() => setMediaPickerOpen(false)}
        />

        <PreviewModal
          open={previewOpen}
          title={form.title || 'Announcement Preview'}
          subtitle={KINDS.find((k) => k.value === form.kind)?.label}
          onClose={() => setPreviewOpen(false)}
        >
          {form.showAsBanner && (
            <div className="mb-4 rounded-lg bg-[#092F35] px-4 py-2.5 text-xs text-white">
              <span className="mr-2 font-semibold text-[#FFD84A]">[Website Banner Preview]</span>
              <span className="font-semibold">{form.title}:</span> {form.summary}
            </div>
          )}
          <p className="text-sm font-medium text-slate-700">{form.summary}</p>
          {form.body && <p className="mt-3 whitespace-pre-line text-sm text-slate-600">{form.body}</p>}
        </PreviewModal>

        {translationTarget && (
          <TranslationModal
            open={Boolean(translationTarget)}
            entityType="announcement"
            entityId={translationTarget.id}
            entityLabel={translationTarget.label}
            sourceData={translationTarget.source}
            onClose={() => setTranslationTarget(null)}
            onSaved={() => void loadTranslationSummary()}
          />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-5">
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

      <div className="flex flex-col justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs"
            aria-label="Filter announcements by status"
          >
            <option value="all">All Statuses</option>
            <option value="published">Published</option>
            <option value="scheduled">Scheduled</option>
            <option value="draft">Draft</option>
            <option value="archived">Archived</option>
          </select>
          <span className="text-xs text-slate-500">
            Manage announcements, product updates, and public website notification banners.
          </span>
        </div>

        <button
          type="button"
          onClick={() => {
            setForm(EMPTY_FORM);
            setFeedback(null);
            setMode('edit');
          }}
          className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-[#092F35] px-4 py-2 text-xs font-semibold text-white hover:bg-[#0F4C5C]"
        >
          <Plus className="h-4 w-4" />
          <span>New Announcement</span>
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        {loading ? (
          <div className="space-y-2 p-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-12 animate-pulse rounded bg-slate-100" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-sm font-medium text-[#092F35]">No announcements found.</p>
            <p className="mt-1 text-xs text-slate-500">
              Create a company announcement, product update, or website banner notice.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Announcement</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium">Display</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Translations</th>
                  <th className="px-4 py-3 font-medium">Schedule / Expiry</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((item) => {
                  const pubCount = translationSummary[item.id]?.publishedCount || 0;
                  return (
                  <tr key={item.id} className="hover:bg-slate-50/70">
                    <td className="max-w-xs px-4 py-3">
                      <p className="truncate font-semibold text-[#092F35]">{item.title}</p>
                      <p className="truncate text-[11px] text-slate-500">{item.summary}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                      {KINDS.find((k) => k.value === item.kind)?.label || item.kind}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        {item.show_as_banner === 1 && (
                          <span className="rounded border border-[#0F8A5F]/30 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-[#0B5D4B]">
                            Website Banner
                          </span>
                        )}
                        {item.is_pinned === 1 && (
                          <span className="rounded border border-amber-300 bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-900">
                            Pinned
                          </span>
                        )}
                        {item.visibility === 'hidden' && (
                          <span className="rounded border border-slate-300 bg-slate-100 px-2 py-0.5 text-[10px] text-slate-600">
                            Hidden
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={item.status} />
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() =>
                          setTranslationTarget({
                            id: item.id,
                            label: item.title,
                            source: item,
                          })
                        }
                        className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-medium tabular-nums ${
                          pubCount > 0
                            ? 'border-emerald-300 bg-emerald-50 text-emerald-900'
                            : 'border-amber-300 bg-amber-50 text-amber-900'
                        }`}
                      >
                        <Languages className="h-3 w-3" />
                        <span>
                          {pubCount}/{totalTargetLocales}
                        </span>
                      </button>
                    </td>
                    <td className="px-4 py-3 text-[11px] text-slate-500 tabular-nums whitespace-nowrap">
                      <div>Start: {formatAdminDate(item.starts_at || item.publish_at)}</div>
                      <div>Exp: {formatAdminDate(item.expires_at)}</div>
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => quickTogglePin(item)}
                          title={item.is_pinned === 1 ? 'Unpin' : 'Pin'}
                          className={`rounded-md border p-1.5 ${
                            item.is_pinned === 1
                              ? 'border-amber-300 bg-amber-50 text-amber-800'
                              : 'border-slate-200 text-slate-500 hover:bg-slate-100'
                          }`}
                        >
                          <Pin className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setTranslationTarget({
                              id: item.id,
                              label: item.title,
                              source: item,
                            })
                          }
                          className="rounded-md border border-[#0F8A5F]/30 bg-emerald-50/60 px-2.5 py-1 text-xs font-medium text-[#0B5D4B] hover:bg-emerald-100/70"
                        >
                          <Languages className="inline h-3.5 w-3.5 mr-1" />
                          Translate
                        </button>
                        <button
                          type="button"
                          onClick={() => openEdit(item)}
                          className="rounded-md border border-slate-200 px-2.5 py-1 text-xs font-medium text-[#092F35] hover:bg-slate-100"
                        >
                          <Edit3 className="inline h-3.5 w-3.5 mr-1" />
                          Edit
                        </button>
                        {item.status !== 'archived' && (
                          <button
                            type="button"
                            onClick={() => quickArchive(item)}
                            title="Archive"
                            className="rounded-md border border-slate-200 p-1.5 text-slate-500 hover:bg-slate-100"
                          >
                            <Archive className="h-3.5 w-3.5" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(item)}
                          title="Delete"
                          className="rounded-md border border-rose-200 p-1.5 text-rose-700 hover:bg-rose-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmModal
        open={Boolean(deleteTarget)}
        title="Delete Announcement?"
        description={`Delete "${deleteTarget?.title}" permanently?`}
        confirmLabel="Delete"
        destructive
        loading={saving}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      {translationTarget && (
        <TranslationModal
          open={Boolean(translationTarget)}
          entityType="announcement"
          entityId={translationTarget.id}
          entityLabel={translationTarget.label}
          sourceData={translationTarget.source}
          onClose={() => setTranslationTarget(null)}
          onSaved={() => void loadTranslationSummary()}
        />
      )}
    </div>
  );
};
