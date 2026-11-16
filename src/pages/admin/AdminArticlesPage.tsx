import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  CalendarClock,
  Edit3,
  Eye,
  Globe,
  Image as ImageIcon,
  Languages,
  Lock,
  Plus,
  Save,
  Search,
  Trash2,
  UploadCloud,
} from 'lucide-react';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { usePublicCms } from '../../context/PublicCmsContext';
import {
  adminApi,
  type CmsArticle,
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

const CATEGORIES: CmsArticle['category'][] = [
  'Announcements',
  'Product Updates',
  'Company News',
  'Articles & Insights',
  'Featured Stories',
];

function slugifyTitle(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 120);
}

interface ArticleFormState {
  id?: string;
  title: string;
  slug: string;
  coverImageUrl: string;
  shortSummary: string;
  content: string;
  author: string;
  category: CmsArticle['category'];
  tagsText: string;
  seoTitle: string;
  seoDescription: string;
  publishAtLocal: string;
  status: CmsArticle['status'];
}

const EMPTY_FORM: ArticleFormState = {
  title: '',
  slug: '',
  coverImageUrl: '',
  shortSummary: '',
  content: '',
  author: 'MAATA Editorial Desk',
  category: 'Announcements',
  tagsText: '',
  seoTitle: '',
  seoDescription: '',
  publishAtLocal: '',
  status: 'draft',
};

export const AdminArticlesPage: React.FC = () => {
  const { user } = useAdminAuth();
  const { refreshPublicCms } = usePublicCms();
  const [searchParams, setSearchParams] = useSearchParams();

  const canEdit = user?.role === 'super_admin' || user?.role === 'content_manager';

  const [articles, setArticles] = useState<CmsArticle[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'all');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<'list' | 'edit'>(
    searchParams.get('new') === '1' ? 'edit' : 'list'
  );
  const [form, setForm] = useState<ArticleFormState>(EMPTY_FORM);
  const [slugLocked, setSlugLocked] = useState(false);

  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<CmsArticle | null>(null);
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
      const res = await adminApi.getTranslationsSummary('article');
      setTranslationSummary(res.summary || {});
      setTotalTargetLocales(res.totalTargetLocales || 9);
    } catch {
      // Non-blocking summary load
    }
  };

  const loadArticles = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getArticles({
        status: statusFilter !== 'all' ? statusFilter : undefined,
        category: categoryFilter !== 'All' ? categoryFilter : undefined,
        search: searchQuery.trim() || undefined,
        page,
      });
      setArticles(res.items);
      setTotal(res.total);
      void loadTranslationSummary();
    } catch (err: any) {
      setFeedback({ type: 'err', text: err?.message || 'Failed to load articles.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (canEdit) {
      void loadArticles();
    } else {
      setLoading(false);
    }
  }, [canEdit, statusFilter, categoryFilter, searchQuery, page]);

  useEffect(() => {
    if (searchParams.get('new') === '1') {
      setForm(EMPTY_FORM);
      setSlugLocked(false);
      setMode('edit');
    }
  }, [searchParams]);

  if (!canEdit) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900">
        <div className="flex items-center gap-2 font-semibold">
          <Lock className="h-4 w-4" />
          <span>Restricted Module</span>
        </div>
        <p className="mt-1">
          News & Articles management is restricted to Super Administrators and Content Managers.
        </p>
      </div>
    );
  }

  const openNewEditor = () => {
    setForm(EMPTY_FORM);
    setSlugLocked(false);
    setFeedback(null);
    setMode('edit');
  };

  const openEditArticle = (art: CmsArticle) => {
    setForm({
      id: art.id,
      title: art.title,
      slug: art.slug,
      coverImageUrl: art.cover_image_url || '',
      shortSummary: art.short_summary,
      content: art.content,
      author: art.author,
      category: art.category,
      tagsText: (art.tags || []).join(', '),
      seoTitle: art.seo_title || '',
      seoDescription: art.seo_description || '',
      publishAtLocal: toDatetimeLocalValue(art.publish_at),
      status: art.status,
    });
    setSlugLocked(true);
    setFeedback(null);
    setMode('edit');
  };

  const submitArticle = async (targetStatus: CmsArticle['status']) => {
    setFeedback(null);
    if (targetStatus === 'scheduled' && !form.publishAtLocal) {
      setFeedback({
        type: 'err',
        text: 'Select a Publication Date & Time before scheduling an article.',
      });
      return;
    }

    const payload = {
      title: form.title.trim(),
      slug: form.slug.trim(),
      coverImageUrl: form.coverImageUrl.trim(),
      shortSummary: form.shortSummary.trim(),
      content: form.content.trim(),
      author: form.author.trim(),
      category: form.category,
      tags: form.tagsText
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
      seoTitle: form.seoTitle.trim(),
      seoDescription: form.seoDescription.trim(),
      publishAt: fromDatetimeLocalValue(form.publishAtLocal),
      status: targetStatus,
    };

    setSaving(true);
    try {
      if (form.id) {
        await adminApi.updateArticle(form.id, payload);
      } else {
        const created = await adminApi.createArticle(payload);
        setForm((prev) => ({ ...prev, id: created.id, status: targetStatus }));
      }
      setForm((prev) => ({ ...prev, status: targetStatus }));
      await loadArticles();
      await refreshPublicCms();
      setFeedback({
        type: 'ok',
        text:
          targetStatus === 'published'
            ? 'Article published and live on the public Newsroom.'
            : `Article saved with status "${targetStatus}".`,
      });
    } catch (err: any) {
      setFeedback({ type: 'err', text: err?.message || 'Unable to save article.' });
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      await adminApi.deleteArticle(deleteTarget.id);
      if (form.id === deleteTarget.id) {
        setMode('list');
      }
      setDeleteTarget(null);
      await loadArticles();
      await refreshPublicCms();
      setFeedback({ type: 'ok', text: 'Article deleted permanently.' });
    } catch (err: any) {
      setFeedback({ type: 'err', text: err?.message || 'Failed to delete article.' });
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
            <span>Back to Articles</span>
          </button>

          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={form.status} />
            {form.id && (
              <button
                type="button"
                onClick={() =>
                  setTranslationTarget({
                    id: form.id!,
                    label: form.title || 'Article Translations',
                    source: {
                      title: form.title,
                      short_summary: form.shortSummary,
                      content: form.content,
                      author: form.author,
                      tags: form.tagsText
                        .split(',')
                        .map((t) => t.trim())
                        .filter(Boolean),
                      seo_title: form.seoTitle,
                      seo_description: form.seoDescription,
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
              onClick={() => submitArticle('draft')}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#0F4C5C] bg-white px-3.5 py-2 text-xs font-semibold text-[#0F4C5C] hover:bg-slate-50 disabled:opacity-50"
            >
              <Save className="h-3.5 w-3.5" />
              <span>Save Draft</span>
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={() => submitArticle('scheduled')}
              className="inline-flex items-center gap-1.5 rounded-lg border border-amber-300 bg-amber-50 px-3.5 py-2 text-xs font-semibold text-amber-900 hover:bg-amber-100 disabled:opacity-50"
            >
              <CalendarClock className="h-3.5 w-3.5" />
              <span>Schedule</span>
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={() => submitArticle('published')}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#0F8A5F] px-4 py-2 text-xs font-semibold text-white hover:bg-[#0B5D4B] disabled:opacity-50"
            >
              <UploadCloud className="h-3.5 w-3.5" />
              <span>Publish Now</span>
            </button>
            {form.id && form.status === 'published' && (
              <button
                type="button"
                disabled={saving}
                onClick={() => submitArticle('unpublished')}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-slate-100 px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-200 disabled:opacity-50"
              >
                <Globe className="h-3.5 w-3.5" />
                <span>Unpublish</span>
              </button>
            )}
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
          {/* Primary Editorial Fields */}
          <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 lg:col-span-2">
            <div>
              <label className="block text-xs font-medium text-slate-700">Article Title *</label>
              <input
                type="text"
                required
                value={form.title}
                onChange={(e) => {
                  const nextTitle = e.target.value;
                  setForm((prev) => ({
                    ...prev,
                    title: nextTitle,
                    slug: slugLocked ? prev.slug : slugifyTitle(nextTitle),
                  }));
                }}
                placeholder="Enter clear newsroom headline"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700">
                URL Slug * (lowercase letters, numbers, hyphens)
              </label>
              <input
                type="text"
                required
                value={form.slug}
                onChange={(e) => {
                  setSlugLocked(true);
                  setForm({ ...form, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') });
                }}
                placeholder="maata-product-update-2026"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3.5 py-2 font-mono text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700">
                Short Summary * (min 10 characters)
              </label>
              <textarea
                rows={3}
                required
                value={form.shortSummary}
                onChange={(e) => setForm({ ...form, shortSummary: e.target.value })}
                placeholder="Concise editorial summary shown on public Newsroom cards"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700">
                Full Article Content * (min 20 characters; separate paragraphs with blank lines)
              </label>
              <textarea
                rows={12}
                required
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                placeholder="Write the complete article body here..."
                className="mt-1 w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm leading-relaxed"
              />
            </div>
          </div>

          {/* Metadata & SEO Sidebar */}
          <div className="space-y-4">
            <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-5">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                Publishing & Classification
              </h3>

              <div>
                <label className="block text-xs font-medium text-slate-700">Author *</label>
                <input
                  type="text"
                  required
                  value={form.author}
                  onChange={(e) => setForm({ ...form, author: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700">Category *</label>
                <select
                  value={form.category}
                  onChange={(e) =>
                    setForm({ ...form, category: e.target.value as CmsArticle['category'] })
                  }
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700">
                  Tags (comma-separated)
                </label>
                <input
                  type="text"
                  value={form.tagsText}
                  onChange={(e) => setForm({ ...form, tagsText: e.target.value })}
                  placeholder="MAATA App, Chittoor, Local Commerce"
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700">
                  Publication / Schedule Date
                </label>
                <input
                  type="datetime-local"
                  value={form.publishAtLocal}
                  onChange={(e) => setForm({ ...form, publishAtLocal: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs tabular-nums"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700">Cover Image</label>
                <div className="mt-1 flex gap-2">
                  <input
                    type="text"
                    value={form.coverImageUrl}
                    onChange={(e) => setForm({ ...form, coverImageUrl: e.target.value })}
                    placeholder="/media/... or /src/assets/..."
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => setMediaPickerOpen(true)}
                    className="shrink-0 rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100"
                    title="Select from Media Library"
                  >
                    <ImageIcon className="h-4 w-4" />
                  </button>
                </div>
                {form.coverImageUrl && (
                  <img
                    src={form.coverImageUrl}
                    alt="Cover preview"
                    className="mt-2 aspect-video w-full rounded-lg border border-slate-200 object-cover"
                  />
                )}
              </div>
            </div>

            <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-5">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                SEO Metadata
              </h3>
              <div>
                <label className="block text-xs font-medium text-slate-700">SEO Title</label>
                <input
                  type="text"
                  value={form.seoTitle}
                  onChange={(e) => setForm({ ...form, seoTitle: e.target.value })}
                  placeholder="Search engine title"
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700">SEO Description</label>
                <textarea
                  rows={3}
                  value={form.seoDescription}
                  onChange={(e) => setForm({ ...form, seoDescription: e.target.value })}
                  placeholder="Meta description for search previews"
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
            </div>
          </div>
        </div>

        <MediaPickerModal
          open={mediaPickerOpen}
          selectedUrl={form.coverImageUrl}
          onSelect={(url) => setForm((prev) => ({ ...prev, coverImageUrl: url }))}
          onClose={() => setMediaPickerOpen(false)}
        />

        <PreviewModal
          open={previewOpen}
          title={form.title || 'Untitled Article'}
          subtitle={`${form.category} · By ${form.author || 'MAATA'}`}
          onClose={() => setPreviewOpen(false)}
        >
          {form.coverImageUrl && (
            <img
              src={form.coverImageUrl}
              alt={form.title}
              className="mb-5 aspect-video w-full rounded-xl object-cover"
            />
          )}
          <p className="text-sm font-medium text-slate-600">{form.shortSummary}</p>
          <div className="mt-4 space-y-3 text-sm leading-relaxed text-slate-800">
            {form.content.split(/\n\n+/).map((p, idx) => (
              <p key={idx}>{p}</p>
            ))}
          </div>
        </PreviewModal>

        {translationTarget && (
          <TranslationModal
            open={Boolean(translationTarget)}
            entityType="article"
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

      {/* Filter & Action Toolbar */}
      <div className="flex flex-col justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 md:flex-row md:items-center">
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => {
                setPage(1);
                setSearchQuery(e.target.value);
              }}
              placeholder="Search title, slug, author..."
              className="w-60 rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-xs"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => {
              setPage(1);
              setStatusFilter(e.target.value);
            }}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs"
            aria-label="Filter by status"
          >
            <option value="all">All Statuses</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
            <option value="scheduled">Scheduled</option>
            <option value="unpublished">Unpublished</option>
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => {
              setPage(1);
              setCategoryFilter(e.target.value);
            }}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs"
            aria-label="Filter by category"
          >
            <option value="All">All Categories</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={openNewEditor}
          className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-[#092F35] px-4 py-2 text-xs font-semibold text-white hover:bg-[#0F4C5C]"
        >
          <Plus className="h-4 w-4" />
          <span>New Article</span>
        </button>
      </div>

      {/* Articles Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        {loading ? (
          <div className="space-y-2 p-6">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-12 animate-pulse rounded bg-slate-100" />
            ))}
          </div>
        ) : articles.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-sm font-medium text-[#092F35]">No articles match your filter.</p>
            <p className="mt-1 text-xs text-slate-500">
              Create a new Newsroom article or adjust your status/category filters.
            </p>
            <button
              type="button"
              onClick={openNewEditor}
              className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-[#0F8A5F] px-4 py-2 text-xs font-semibold text-white"
            >
              <Plus className="h-4 w-4" /> Create First Article
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Article Title</th>
                  <th className="px-4 py-3 font-medium">Category</th>
                  <th className="px-4 py-3 font-medium">Author</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Translations</th>
                  <th className="px-4 py-3 font-medium">Publish Date</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {articles.map((art) => {
                  const trSum = translationSummary[art.id];
                  const pubCount = trSum?.publishedCount || 0;
                  return (
                  <tr key={art.id} className="hover:bg-slate-50/70">
                    <td className="max-w-xs px-4 py-3">
                      <p className="truncate font-semibold text-[#092F35]">{art.title}</p>
                      <p className="truncate font-mono text-[11px] text-slate-400">/{art.slug}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{art.category}</td>
                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{art.author}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={art.status} />
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() =>
                          setTranslationTarget({
                            id: art.id,
                            label: art.title,
                            source: art,
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
                    <td className="px-4 py-3 text-slate-500 tabular-nums whitespace-nowrap">
                      {formatAdminDate(art.publish_at || art.updated_at)}
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() =>
                            setTranslationTarget({
                              id: art.id,
                              label: art.title,
                              source: art,
                            })
                          }
                          className="rounded-md border border-[#0F8A5F]/30 bg-emerald-50/60 px-2.5 py-1 text-xs font-medium text-[#0B5D4B] hover:bg-emerald-100/70"
                        >
                          <Languages className="inline h-3.5 w-3.5 mr-1" />
                          Translate
                        </button>
                        <button
                          type="button"
                          onClick={() => openEditArticle(art)}
                          className="rounded-md border border-slate-200 px-2.5 py-1 text-xs font-medium text-[#092F35] hover:bg-slate-100"
                        >
                          <Edit3 className="inline h-3.5 w-3.5 mr-1" />
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(art)}
                          className="rounded-md border border-rose-200 px-2 py-1 text-rose-700 hover:bg-rose-50"
                          aria-label={`Delete ${art.title}`}
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

        {total > 20 && (
          <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3 text-xs text-slate-600">
            <span className="tabular-nums">Total articles: {total}</span>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="rounded border border-slate-300 px-3 py-1 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={page * 20 >= total}
                onClick={() => setPage((p) => p + 1)}
                className="rounded border border-slate-300 px-3 py-1 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      <ConfirmModal
        open={Boolean(deleteTarget)}
        title="Delete Article Permanently?"
        description={`Are you sure you want to delete "${deleteTarget?.title}"? This action cannot be undone.`}
        confirmLabel="Delete Article"
        destructive
        loading={saving}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      {translationTarget && (
        <TranslationModal
          open={Boolean(translationTarget)}
          entityType="article"
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
