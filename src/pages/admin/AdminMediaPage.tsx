import React, { useEffect, useState } from 'react';
import {
  Check,
  Edit3,
  Languages,
  Lock,
  RefreshCw,
  Search,
  Shield,
  Trash2,
  Upload,
} from 'lucide-react';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { usePublicCms } from '../../context/PublicCmsContext';
import {
  adminApi,
  type CmsMediaAsset,
  type TranslationSummaryItem,
} from '../../services/cmsApi';
import {
  ConfirmModal,
  formatAdminDate,
  formatBytes,
} from '../../components/admin/AdminUi';
import { TranslationModal } from '../../components/admin/TranslationModal';

const MEDIA_CATEGORIES: { value: CmsMediaAsset['category']; label: string }[] = [
  { value: 'founder_gallery', label: 'Founder Gallery (Company Page)' },
  { value: 'company_logo', label: 'Company Logo' },
  { value: 'founder_photo', label: 'Founder Portrait (Individual)' },
  { value: 'product_screenshot', label: 'Product Screenshot' },
  { value: 'article_cover', label: 'Article Cover' },
  { value: 'banner', label: 'Banner' },
  { value: 'approved_media', label: 'Approved Media' },
];

const FOCAL_PRESETS = [
  { value: '50% 25%', label: 'Upper-Center (Faces & Heads)' },
  { value: '50% 50%', label: 'Exact Center' },
  { value: '60% 24%', label: 'Right-Weighted Studio Framing' },
  { value: '50% 46%', label: 'Balanced Full Card Framing' },
  { value: '50% 15%', label: 'Top-Aligned Framing' },
];

export const AdminMediaPage: React.FC = () => {
  const { user } = useAdminAuth();
  const { refreshPublicCms } = usePublicCms();
  const canEdit = user?.role === 'super_admin' || user?.role === 'content_manager';

  const [items, setItems] = useState<CmsMediaAsset[]>([]);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadCategory, setUploadCategory] =
    useState<CmsMediaAsset['category']>('founder_gallery');
  const [uploadAlt, setUploadAlt] = useState('');
  const [uploadCaption, setUploadCaption] = useState('');
  const [uploadFocal, setUploadFocal] = useState('50% 25%');
  const [uploading, setUploading] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editAlt, setEditAlt] = useState('');
  const [editCaption, setEditCaption] = useState('');
  const [editFocal, setEditFocal] = useState('50% 25%');
  const [editOrder, setEditOrder] = useState(0);
  const [editCategory, setEditCategory] =
    useState<CmsMediaAsset['category']>('approved_media');

  const [deleteTarget, setDeleteTarget] = useState<CmsMediaAsset | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [translationTarget, setTranslationTarget] = useState<{
    id: string;
    label: string;
    source: any;
  } | null>(null);
  const [translationSummary, setTranslationSummary] = useState<
    Record<string, TranslationSummaryItem>
  >({});
  const [totalTargetLocales, setTotalTargetLocales] = useState(9);
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const loadTranslationSummary = async () => {
    try {
      const res = await adminApi.getTranslationsSummary('media_asset');
      setTranslationSummary(res.summary || {});
      setTotalTargetLocales(res.totalTargetLocales || 9);
    } catch {
      // Non-blocking summary load
    }
  };

  const loadMedia = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getMedia({
        category: categoryFilter !== 'all' ? categoryFilter : undefined,
        search: searchQuery.trim() || undefined,
      });
      setItems(res.items);
      void loadTranslationSummary();
    } catch (err: any) {
      setFeedback({ type: 'err', text: err?.message || 'Failed to load media library.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (canEdit) {
      void loadMedia();
    } else {
      setLoading(false);
    }
  }, [canEdit, categoryFilter, searchQuery]);

  if (!canEdit) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900">
        <div className="flex items-center gap-2 font-semibold">
          <Lock className="h-4 w-4" />
          <span>Restricted Module</span>
        </div>
        <p className="mt-1">
          Media Library uploads and asset management are restricted to Super Administrators and
          Content Managers.
        </p>
      </div>
    );
  }

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) {
      setFeedback({ type: 'err', text: 'Select a PNG, JPEG, or WebP image file first.' });
      return;
    }
    if (uploadAlt.trim().length < 2) {
      setFeedback({ type: 'err', text: 'Descriptive alt text is required.' });
      return;
    }

    setUploading(true);
    setFeedback(null);
    try {
      await adminApi.uploadMedia(uploadFile, uploadCategory, uploadAlt.trim(), {
        caption: uploadCaption.trim(),
        focalPosition: uploadFocal,
      });
      setUploadFile(null);
      setUploadAlt('');
      setUploadCaption('');
      const inputEl = document.getElementById('media-upload-input') as HTMLInputElement | null;
      if (inputEl) inputEl.value = '';
      await Promise.all([loadMedia(), refreshPublicCms()]);
      setFeedback({ type: 'ok', text: 'Image uploaded and synced to the Media Library.' });
    } catch (err: any) {
      setFeedback({ type: 'err', text: err?.message || 'Image upload failed.' });
    } finally {
      setUploading(false);
    }
  };

  const handleSaveMeta = async (id: string) => {
    setFeedback(null);
    try {
      await adminApi.updateMediaMeta(id, {
        altText: editAlt.trim(),
        category: editCategory,
        caption: editCaption.trim(),
        focalPosition: editFocal,
        displayOrder: editOrder,
      });
      setEditingId(null);
      await Promise.all([loadMedia(), refreshPublicCms()]);
      setFeedback({ type: 'ok', text: 'Media details updated.' });
    } catch (err: any) {
      setFeedback({ type: 'err', text: err?.message || 'Failed to update metadata.' });
    }
  };

  const handleReplaceFile = async (asset: CmsMediaAsset, file: File | undefined) => {
    if (!file) return;
    setFeedback(null);
    try {
      await adminApi.replaceMediaFile(asset.id, file);
      await Promise.all([loadMedia(), refreshPublicCms()]);
      setFeedback({ type: 'ok', text: `Replaced image file for "${asset.original_name}".` });
    } catch (err: any) {
      setFeedback({ type: 'err', text: err?.message || 'Failed to replace media file.' });
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    setFeedback(null);
    try {
      await adminApi.deleteMedia(deleteTarget.id);
      setDeleteTarget(null);
      await Promise.all([loadMedia(), refreshPublicCms()]);
      setFeedback({ type: 'ok', text: 'Media asset deleted.' });
    } catch (err: any) {
      setDeleteTarget(null);
      setFeedback({ type: 'err', text: err?.message || 'Cannot delete media asset.' });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
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

      {/* Upload Form */}
      <form
        onSubmit={handleUpload}
        className="rounded-xl border border-slate-200 bg-white p-5"
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-[#092F35]">Upload Approved Image</h2>
            <p className="text-xs text-slate-500">
              Supports PNG, JPEG, and WebP up to 5 MB. Files are validated by signature on the
              server.
            </p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-12">
          <div className="md:col-span-4">
            <label className="block text-xs font-medium text-slate-700" htmlFor="media-upload-input">
              Image File *
            </label>
            <input
              id="media-upload-input"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={(e) => {
                const file = e.target.files?.[0] || null;
                setUploadFile(file);
                if (file && !uploadAlt) {
                  setUploadAlt(file.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' '));
                }
              }}
              className="mt-1 block w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-1.5 text-xs file:mr-3 file:rounded file:border-0 file:bg-[#092F35] file:px-2.5 file:py-1 file:text-xs file:font-medium file:text-white"
            />
          </div>

          <div className="md:col-span-3">
            <label className="block text-xs font-medium text-slate-700">Category *</label>
            <select
              value={uploadCategory}
              onChange={(e) => setUploadCategory(e.target.value as CmsMediaAsset['category'])}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs"
            >
              {MEDIA_CATEGORIES.filter((c) => c.value !== 'company_logo').map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-3">
            <label className="block text-xs font-medium text-slate-700">Alt Text *</label>
            <input
              type="text"
              required
              value={uploadAlt}
              onChange={(e) => setUploadAlt(e.target.value)}
              placeholder="Descriptive accessibility alt text"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs"
            />
          </div>

          <div className="flex items-end md:col-span-2">
            <button
              type="submit"
              disabled={uploading}
              className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-[#0F8A5F] px-4 py-2 text-xs font-semibold text-white hover:bg-[#0B5D4B] disabled:opacity-50"
            >
              <Upload className="h-3.5 w-3.5" />
              <span>{uploading ? 'Uploading...' : 'Upload'}</span>
            </button>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-12">
          <div className="md:col-span-7">
            <label className="block text-xs font-medium text-slate-700">
              Caption (Displayed in Founder Gallery &amp; Editorial Frames)
            </label>
            <input
              type="text"
              value={uploadCaption}
              onChange={(e) => setUploadCaption(e.target.value)}
              placeholder="Optional warm editorial caption for this photograph"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs"
            />
          </div>

          <div className="md:col-span-5">
            <label className="block text-xs font-medium text-slate-700">
              Focal Positioning (Preserves Faces)
            </label>
            <select
              value={uploadFocal}
              onChange={(e) => setUploadFocal(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs"
            >
              {FOCAL_PRESETS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label} ({p.value})
                </option>
              ))}
            </select>
          </div>
        </div>
      </form>

      {/* Search & Category Filter */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search media name or alt text..."
            className="w-64 rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-xs"
          />
        </div>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs"
          aria-label="Filter media by category"
        >
          <option value="all">All Media Categories</option>
          {MEDIA_CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
      </div>

      {/* Media Grid */}
      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-64 animate-pulse rounded-xl border border-slate-200 bg-white" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center text-sm text-slate-500">
          No media assets match your filter.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((asset) => {
            const isEditing = editingId === asset.id;
            const isProtectedLogo =
              asset.is_protected === 1 && asset.category === 'company_logo';

            return (
              <div
                key={asset.id}
                className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white"
              >
                <div className="relative aspect-video w-full bg-slate-100">
                  <img
                    src={asset.url}
                    alt={asset.alt_text}
                    style={{ objectPosition: asset.focal_position || '50% 25%' }}
                    className={`h-full w-full ${
                      asset.category === 'company_logo' ? 'object-contain p-4 bg-white' : 'object-cover'
                    }`}
                  />
                  {asset.is_protected === 1 && (
                    <span className="absolute left-2.5 top-2.5 inline-flex items-center gap-1 rounded border border-[#092F35]/20 bg-[#092F35] px-2 py-0.5 text-[10px] font-semibold text-[#FFD84A]">
                      <Shield className="h-3 w-3" /> Protected Brand Asset
                    </span>
                  )}
                </div>

                <div className="flex flex-1 flex-col p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-[#092F35]">
                        {asset.original_name}
                      </p>
                      <p className="mt-0.5 font-mono text-[11px] text-slate-400 truncate">
                        {asset.url}
                      </p>
                    </div>
                    <span className="shrink-0 text-[11px] text-slate-500 tabular-nums">
                      {formatBytes(asset.size_bytes)}
                    </span>
                  </div>

                  {isEditing ? (
                    <div className="mt-3 space-y-2.5 rounded-lg border border-slate-200 bg-slate-50 p-3">
                      <div>
                        <label className="block text-[11px] font-medium text-slate-700">
                          Alt Text
                        </label>
                        <input
                          type="text"
                          value={editAlt}
                          onChange={(e) => setEditAlt(e.target.value)}
                          className="mt-1 w-full rounded border border-slate-300 bg-white px-2.5 py-1.5 text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-medium text-slate-700">
                          Caption
                        </label>
                        <input
                          type="text"
                          value={editCaption}
                          onChange={(e) => setEditCaption(e.target.value)}
                          placeholder="Optional gallery caption"
                          className="mt-1 w-full rounded border border-slate-300 bg-white px-2.5 py-1.5 text-xs"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[11px] font-medium text-slate-700">
                            Focal Point
                          </label>
                          <select
                            value={
                              FOCAL_PRESETS.some((p) => p.value === editFocal) ? editFocal : 'custom'
                            }
                            onChange={(e) => {
                              if (e.target.value !== 'custom') setEditFocal(e.target.value);
                            }}
                            className="mt-1 w-full rounded border border-slate-300 bg-white px-2 py-1.5 text-xs"
                          >
                            {FOCAL_PRESETS.map((p) => (
                              <option key={p.value} value={p.value}>
                                {p.label}
                              </option>
                            ))}
                            {!FOCAL_PRESETS.some((p) => p.value === editFocal) && (
                              <option value="custom">Custom ({editFocal})</option>
                            )}
                          </select>
                        </div>
                        <div>
                          <label className="block text-[11px] font-medium text-slate-700">
                            Slide Order
                          </label>
                          <input
                            type="number"
                            min={0}
                            value={editOrder}
                            onChange={(e) => setEditOrder(Number(e.target.value) || 0)}
                            className="mt-1 w-full rounded border border-slate-300 bg-white px-2.5 py-1.5 text-xs"
                          />
                        </div>
                      </div>
                      {asset.is_protected !== 1 && (
                        <div>
                          <label className="block text-[11px] font-medium text-slate-700">
                            Category
                          </label>
                          <select
                            value={editCategory}
                            onChange={(e) =>
                              setEditCategory(e.target.value as CmsMediaAsset['category'])
                            }
                            className="mt-1 w-full rounded border border-slate-300 bg-white px-2.5 py-1.5 text-xs"
                          >
                            {MEDIA_CATEGORIES.filter((c) => c.value !== 'company_logo').map(
                              (c) => (
                                <option key={c.value} value={c.value}>
                                  {c.label}
                                </option>
                              )
                            )}
                          </select>
                        </div>
                      )}
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                          className="rounded border border-slate-300 bg-white px-2.5 py-1 text-xs"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSaveMeta(asset.id)}
                          className="inline-flex items-center gap-1 rounded bg-[#0F8A5F] px-2.5 py-1 text-xs font-semibold text-white"
                        >
                          <Check className="h-3 w-3" /> Save
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="mt-2 line-clamp-2 text-xs text-slate-600">
                        <span className="font-medium text-slate-700">Alt:</span> {asset.alt_text}
                      </p>
                      {asset.caption && (
                        <p className="mt-1 line-clamp-2 text-xs italic text-slate-500">
                          “{asset.caption}”
                        </p>
                      )}
                      <p className="mt-1 text-[11px] text-slate-400 tabular-nums">
                        {asset.category.replace(/_/g, ' ')}
                        {asset.category === 'founder_gallery' && ` · Slide #${asset.display_order || 0}`}
                        {' · Added '}
                        {formatAdminDate(asset.created_at)}
                      </p>
                    </>
                  )}

                  <div className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3 mt-4">
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingId(asset.id);
                          setEditAlt(asset.alt_text);
                          setEditCaption(asset.caption || '');
                          setEditFocal(asset.focal_position || '50% 25%');
                          setEditOrder(asset.display_order || 0);
                          setEditCategory(asset.category);
                        }}
                        className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                      >
                        <Edit3 className="h-3 w-3" /> Edit Details
                      </button>

                      {asset.category === 'founder_gallery' && (
                        <button
                          type="button"
                          onClick={() =>
                            setTranslationTarget({
                              id: asset.id,
                              label: asset.original_name || 'Founder Gallery Slide',
                              source: asset,
                            })
                          }
                          className="inline-flex items-center gap-1 rounded-md border border-[#0F8A5F]/30 bg-emerald-50/70 px-2.5 py-1 text-xs font-medium text-[#0B5D4B] hover:bg-emerald-100/70 tabular-nums"
                        >
                          <Languages className="h-3 w-3" />
                          <span>
                            {translationSummary[asset.id]?.publishedCount || 0}/{totalTargetLocales}
                          </span>
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      {!isProtectedLogo && (
                        <label className="inline-flex cursor-pointer items-center gap-1 rounded-md border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50">
                          <RefreshCw className="h-3 w-3" />
                          <span>Replace</span>
                          <input
                            type="file"
                            accept="image/png,image/jpeg,image/webp"
                            className="sr-only"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              void handleReplaceFile(asset, file);
                              e.target.value = '';
                            }}
                          />
                        </label>
                      )}

                      {asset.is_protected !== 1 && (
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(asset)}
                          className="inline-flex items-center gap-1 rounded-md border border-rose-200 px-2.5 py-1 text-xs font-medium text-rose-700 hover:bg-rose-50"
                        >
                          <Trash2 className="h-3 w-3" /> Delete
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ConfirmModal
        open={Boolean(deleteTarget)}
        title="Delete Media Asset?"
        description={`Delete "${deleteTarget?.original_name}" from the Media Library? Assets currently referenced by articles or announcements cannot be deleted.`}
        confirmLabel="Delete Asset"
        destructive
        loading={deleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      {translationTarget && (
        <TranslationModal
          open={Boolean(translationTarget)}
          entityType="media_asset"
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
