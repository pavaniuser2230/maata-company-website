import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Building2,
  Clock,
  FilePlus2,
  FileText,
  Image as ImageIcon,
  Inbox,
  Megaphone,
  MessageSquare,
} from 'lucide-react';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { adminApi } from '../../services/cmsApi';
import { formatAdminDate, StatusBadge } from '../../components/admin/AdminUi';

type OverviewData = Awaited<ReturnType<typeof adminApi.getOverview>>;

export const AdminOverviewPage: React.FC = () => {
  const { user } = useAdminAuth();
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    adminApi
      .getOverview()
      .then((res) => {
        if (active) setData(res);
      })
      .catch((err: Error) => {
        if (active) setError(err.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const canEditContent = user?.role === 'super_admin' || user?.role === 'content_manager';
  const canViewEnquiries = user?.role === 'super_admin' || user?.role === 'support_manager';

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-xl border border-slate-200 bg-white" />
          ))}
        </div>
        <div className="h-64 animate-pulse rounded-xl border border-slate-200 bg-white" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-800">
        {error || 'Unable to load dashboard overview.'}
      </div>
    );
  }

  const metricCards = [
    {
      label: 'Published Articles',
      value: data.metrics.publishedArticles,
      sub: 'Live on public Newsroom',
      icon: FileText,
      to: canEditContent ? '/admin/articles?status=published' : undefined,
      accent: 'text-[#0F8A5F]',
    },
    {
      label: 'Draft & Scheduled',
      value: data.metrics.draftArticles,
      sub: 'Pending publication',
      icon: Clock,
      to: canEditContent ? '/admin/articles?status=draft' : undefined,
      accent: 'text-amber-600',
    },
    {
      label: 'Active Announcements',
      value: data.metrics.activeAnnouncements,
      sub: 'Updates & website notices',
      icon: Megaphone,
      to: canEditContent ? '/admin/announcements' : undefined,
      accent: 'text-[#0F4C5C]',
    },
    {
      label: 'Pending Enquiries',
      value: data.metrics.pendingEnquiries,
      sub: 'Awaiting support review',
      icon: Inbox,
      to: canViewEnquiries ? '/admin/enquiries?status=pending' : undefined,
      accent: 'text-sky-700',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Real Database Metrics */}
      <section aria-label="Content and enquiry metrics">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {metricCards.map((card) => {
            const Icon = card.icon;
            const inner = (
              <div className="flex h-full flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 transition hover:border-slate-300">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
                    {card.label}
                  </span>
                  <Icon className={`h-4 w-4 ${card.accent}`} />
                </div>
                <div className="mt-3">
                  <p className="text-3xl font-semibold tracking-tight text-[#092F35] tabular-nums">
                    {card.value}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">{card.sub}</p>
                </div>
              </div>
            );

            return card.to ? (
              <Link key={card.label} to={card.to} className="block">
                {inner}
              </Link>
            ) : (
              <div key={card.label}>{inner}</div>
            );
          })}
        </div>
      </section>

      {/* Quick Publishing Actions */}
      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-[#092F35]">Quick Actions</h2>
        <div className="mt-3 flex flex-wrap gap-3">
          {canEditContent && (
            <>
              <Link
                to="/admin/articles?new=1"
                className="inline-flex items-center gap-2 rounded-lg bg-[#092F35] px-4 py-2 text-xs font-semibold text-white hover:bg-[#0F4C5C]"
              >
                <FilePlus2 className="h-4 w-4" />
                <span>Write News Article</span>
              </Link>
              <Link
                to="/admin/announcements?new=1"
                className="inline-flex items-center gap-2 rounded-lg bg-[#0F8A5F] px-4 py-2 text-xs font-semibold text-white hover:bg-[#0B5D4B]"
              >
                <Megaphone className="h-4 w-4" />
                <span>Post Announcement / Banner</span>
              </Link>
              <Link
                to="/admin/company"
                className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                <Building2 className="h-4 w-4" />
                <span>Edit Company Content</span>
              </Link>
              <Link
                to="/admin/media"
                className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                <ImageIcon className="h-4 w-4" />
                <span>Upload Media</span>
              </Link>
            </>
          )}
          {canViewEnquiries && (
            <Link
              to="/admin/enquiries"
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              <Inbox className="h-4 w-4" />
              <span>Review Pending Enquiries</span>
            </Link>
          )}
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Recent Content Activity */}
        <section className="rounded-xl border border-slate-200 bg-white lg:col-span-2">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
            <h2 className="text-sm font-semibold text-[#092F35]">Recent Content & System Activity</h2>
            {user?.role === 'super_admin' && (
              <Link to="/admin/users" className="text-xs font-medium text-[#0F4C5C] hover:underline">
                Full Audit Log
              </Link>
            )}
          </div>
          {data.recentActivity.length === 0 ? (
            <p className="p-6 text-sm text-slate-500">No recorded activity yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-200 bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-4 py-3 font-medium">Action</th>
                    <th className="px-4 py-3 font-medium">Actor</th>
                    <th className="px-4 py-3 font-medium">Resource</th>
                    <th className="px-4 py-3 text-right font-medium">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.recentActivity.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/70">
                      <td className="px-4 py-3 font-medium text-[#092F35]">
                        {item.action.replace(/_/g, ' ')}
                      </td>
                      <td className="px-4 py-3 text-slate-600">{item.actor_email}</td>
                      <td className="px-4 py-3 text-slate-500">
                        {item.resource_type}
                        {item.resource_id ? ` · ${item.resource_id}` : ''}
                      </td>
                      <td className="px-4 py-3 text-right text-slate-500 tabular-nums whitespace-nowrap">
                        {formatAdminDate(item.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Recent Feedback */}
        <section className="rounded-xl border border-slate-200 bg-white">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-[#0F8A5F]" />
              <h2 className="text-sm font-semibold text-[#092F35]">Recent Feedback</h2>
            </div>
            {data.canViewFeedback && (
              <Link
                to="/admin/enquiries?type=feedback"
                className="text-xs font-medium text-[#0F4C5C] hover:underline"
              >
                View All
              </Link>
            )}
          </div>

          <div className="p-5">
            {!data.canViewFeedback ? (
              <p className="text-xs leading-relaxed text-slate-500">
                Feedback and personal enquiry details are restricted to Support Managers and Super
                Administrators.
              </p>
            ) : data.recentFeedback.length === 0 ? (
              <p className="text-xs leading-relaxed text-slate-500">
                No user feedback submissions have been received yet. Submissions from the public
                Contact / Feedback form will appear here.
              </p>
            ) : (
              <ul className="space-y-3">
                {data.recentFeedback.map((fb) => (
                  <li
                    key={fb.id}
                    className="rounded-lg border border-slate-200 bg-slate-50/70 p-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-xs font-semibold text-[#092F35]">
                        {fb.full_name}
                      </p>
                      <StatusBadge status={fb.status} />
                    </div>
                    <p className="mt-1 line-clamp-2 text-xs text-slate-600">{fb.message}</p>
                    <p className="mt-1.5 text-[11px] text-slate-400 tabular-nums">
                      {formatAdminDate(fb.created_at)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};
