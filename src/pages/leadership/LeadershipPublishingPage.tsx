import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink, FileText, Megaphone, Plus } from 'lucide-react';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { adminApi, type CmsAnnouncement, type CmsArticle } from '../../services/cmsApi';
import { formatAdminDate } from '../../components/admin/AdminUi';

export const LeadershipPublishingPage: React.FC = () => {
  const { user } = useAdminAuth();
  const perms = new Set(user?.permissions || []);
  const canPublish = user?.role === 'super_admin' || perms.has('leadership.publishing');

  const [announcements, setAnnouncements] = useState<CmsAnnouncement[]>([]);
  const [articles, setArticles] = useState<CmsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');

  const [quickTitle, setQuickTitle] = useState('');
  const [quickSummary, setQuickSummary] = useState('');
  const [quickKind, setQuickKind] = useState<CmsAnnouncement['kind']>('company_announcement');
  const [quickBanner, setQuickBanner] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [annRes, artRes] = await Promise.all([
        adminApi.getAnnouncements(),
        adminApi.getArticles({ page: 1 }),
      ]);
      setAnnouncements(annRes.items);
      setArticles(artRes.items);
    } catch (err: any) {
      setError(err?.message || 'Unable to load corporate publishing tools.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (canPublish) {
      void loadData();
    } else {
      setLoading(false);
    }
  }, [canPublish]);

  if (!canPublish) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-950">
        Your current account permissions do not include public website announcements and
        publishing. Contact a Super Admin in Leadership Settings if publishing clearance is required.
      </div>
    );
  }

  const handleQuickPublish = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setFeedback('');
    try {
      await adminApi.createAnnouncement({
        kind: quickKind,
        title: quickTitle.trim(),
        summary: quickSummary.trim(),
        body: quickSummary.trim(),
        imageUrl: '',
        isPinned: false,
        visibility: 'public',
        status: 'published',
        showAsBanner: quickBanner,
        publishAt: null,
        startsAt: null,
        expiresAt: null,
      });
      setQuickTitle('');
      setQuickSummary('');
      setQuickBanner(false);
      setFeedback('Corporate announcement published to the public website.');
      await loadData();
    } catch (err: any) {
      setError(err?.message || 'Failed to publish announcement.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-[#092F35]">
            Announcements &amp; Public Publishing
          </h2>
          <p className="mt-1 text-xs text-slate-600">
            Authorised leadership bridge to publish corporate announcements and manage public
            newsroom articles.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            to="/admin/articles"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-[#092F35] hover:bg-slate-50 whitespace-nowrap"
          >
            <FileText className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Full Articles CMS</span>
            <ExternalLink className="h-3 w-3" aria-hidden="true" />
          </Link>
          <Link
            to="/admin/announcements"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-[#092F35] hover:bg-slate-50 whitespace-nowrap"
          >
            <Megaphone className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Full Announcements CMS</span>
            <ExternalLink className="h-3 w-3" aria-hidden="true" />
          </Link>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          {error}
        </div>
      )}

      {feedback && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          {feedback}
        </div>
      )}

      {/* Quick Executive Announcement Publisher */}
      <form
        onSubmit={handleQuickPublish}
        className="rounded-xl border border-slate-200 bg-white p-6 space-y-4 text-xs"
      >
        <h3 className="text-sm font-semibold text-[#092F35]">
          Quick Publish Corporate Announcement
        </h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="sm:col-span-2">
            <label className="block font-medium text-slate-700">Announcement Headline *</label>
            <input
              type="text"
              required
              value={quickTitle}
              onChange={(e) => setQuickTitle(e.target.value)}
              placeholder="Headline shown in Newsroom / Website Banner"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block font-medium text-slate-700">Announcement Type</label>
            <select
              value={quickKind}
              onChange={(e) => setQuickKind(e.target.value as CmsAnnouncement['kind'])}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs"
            >
              <option value="company_announcement">Company Announcement</option>
              <option value="product_update">Product Update</option>
              <option value="new_feature">New Feature</option>
              <option value="service_notification">Service Notification</option>
              <option value="important_notice">Important Notice</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block font-medium text-slate-700">Summary *</label>
          <textarea
            rows={2}
            required
            value={quickSummary}
            onChange={(e) => setQuickSummary(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs"
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-700">
            <input
              type="checkbox"
              checked={quickBanner}
              onChange={(e) => setQuickBanner(e.target.checked)}
              className="rounded border-slate-300"
            />
            <span>Display as top website notification banner</span>
          </label>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#0F8A5F] px-4 py-2 text-xs font-semibold text-white hover:bg-[#0B5D4B] disabled:opacity-50"
          >
            <Plus className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{submitting ? 'Publishing...' : 'Publish Announcement'}</span>
          </button>
        </div>
      </form>

      {/* Current Announcements & Articles */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
            <h3 className="text-sm font-semibold text-[#092F35]">Recent Announcements</h3>
            <Link to="/admin/announcements" className="text-xs font-medium text-[#0F4C5C] hover:underline">
              Manage All
            </Link>
          </div>
          {loading ? (
            <div className="p-5">
              <div className="h-24 animate-pulse rounded bg-slate-100" />
            </div>
          ) : announcements.length === 0 ? (
            <p className="p-5 text-xs text-slate-500">No announcements created yet.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {announcements.slice(0, 6).map((a) => (
                <div key={a.id} className="px-5 py-3.5">
                  <p className="text-sm font-medium text-[#092F35]">{a.title}</p>
                  <p className="mt-0.5 text-xs text-slate-500 tabular-nums">
                    {a.kind.replace(/_/g, ' ')} · {a.status.toUpperCase()} ·{' '}
                    {formatAdminDate(a.updated_at)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
            <h3 className="text-sm font-semibold text-[#092F35]">Newsroom Articles</h3>
            <Link to="/admin/articles" className="text-xs font-medium text-[#0F4C5C] hover:underline">
              Open Editor
            </Link>
          </div>
          {loading ? (
            <div className="p-5">
              <div className="h-24 animate-pulse rounded bg-slate-100" />
            </div>
          ) : articles.length === 0 ? (
            <p className="p-5 text-xs text-slate-500">No articles found.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {articles.slice(0, 6).map((art) => (
                <div key={art.id} className="px-5 py-3.5">
                  <p className="text-sm font-medium text-[#092F35]">{art.title}</p>
                  <p className="mt-0.5 text-xs text-slate-500 tabular-nums">
                    {art.category} · {art.status.toUpperCase()} · {art.author}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
