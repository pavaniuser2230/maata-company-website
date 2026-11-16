import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BarChart3,
  CheckSquare,
  FileLock2,
  Inbox,
  Megaphone,
  Rocket,
  TrendingUp,
} from 'lucide-react';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { formatAdminDate } from '../../components/admin/AdminUi';
import { leadershipApi, type LeadershipReport, type LeadershipWorkItem } from '../../services/leadershipApi';

interface OverviewResponse {
  metrics: {
    reportsCount: number;
    documentsCount: number;
    publishedArticles: number;
    activeAnnouncements: number;
    pendingEnquiries: number;
    partnershipEnquiries: number;
    workSummary: { domain: string; status: string; count: number }[];
  };
  recentWorkItems: LeadershipWorkItem[];
  recentReports: LeadershipReport[];
  recentAudit: {
    id: string;
    actor_email: string;
    actor_role: string;
    action: string;
    resource_type: string;
    resource_id: string;
    details_json: string;
    ip_address: string;
    created_at: string;
  }[];
}

export const LeadershipOverviewPage: React.FC = () => {
  const { user } = useAdminAuth();
  const [data, setData] = useState<OverviewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    leadershipApi
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

  const perms = new Set(user?.permissions || []);
  const isSuper = user?.role === 'super_admin';
  const hasPerm = (p: string) => isSuper || perms.has(p as any);

  const countByDomain = (domain: string) =>
    (data?.metrics.workSummary || [])
      .filter((w) => w.domain === domain)
      .reduce((sum, w) => sum + w.count, 0);

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.12em] text-[#0F8A5F]">
              MAATA TECHNOLOGIES · Executive Brief
            </p>
            <h2 className="mt-1 text-xl font-semibold text-[#092F35]">
              Welcome back, {user?.name}
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Private workspace for company governance, product execution, testing, reports, and
              authorised website operations.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {hasPerm('leadership.publishing') && (
              <Link
                to="/leadership/publishing"
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#092F35] px-4 py-2 text-xs font-semibold text-white hover:bg-[#0F4C5C] whitespace-nowrap"
              >
                <Megaphone className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Announcements &amp; Publishing</span>
              </Link>
            )}
            {hasPerm('leadership.reports.read') && (
              <Link
                to="/leadership/reports"
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-[#092F35] hover:bg-slate-50 whitespace-nowrap"
              >
                <BarChart3 className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Business Reports</span>
              </Link>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          {error}
        </div>
      )}

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link
          to="/leadership/product"
          className="rounded-xl border border-slate-200 bg-white p-5 transition hover:border-[#0F4C5C]"
        >
          <div className="flex items-center justify-between text-xs font-medium text-slate-500">
            <span>Product &amp; Dev Initiatives</span>
            <Rocket className="h-4 w-4 text-[#0F8A5F]" aria-hidden="true" />
          </div>
          <p className="mt-3 text-2xl font-semibold text-[#092F35] tabular-nums">
            {loading ? '—' : countByDomain('product')}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {loading ? 'Loading...' : `${countByDomain('testing')} QA & feature testing tracks`}
          </p>
        </Link>

        <Link
          to="/leadership/marketing"
          className="rounded-xl border border-slate-200 bg-white p-5 transition hover:border-[#0F4C5C]"
        >
          <div className="flex items-center justify-between text-xs font-medium text-slate-500">
            <span>Marketing Campaigns</span>
            <TrendingUp className="h-4 w-4 text-[#0F4C5C]" aria-hidden="true" />
          </div>
          <p className="mt-3 text-2xl font-semibold text-[#092F35] tabular-nums">
            {loading ? '—' : countByDomain('marketing')}
          </p>
          <p className="mt-1 text-xs text-slate-500">Regional outreach &amp; brand promotions</p>
        </Link>

        <Link
          to="/leadership/documents"
          className="rounded-xl border border-slate-200 bg-white p-5 transition hover:border-[#0F4C5C]"
        >
          <div className="flex items-center justify-between text-xs font-medium text-slate-500">
            <span>Reports &amp; Documents</span>
            <FileLock2 className="h-4 w-4 text-[#0F4C5C]" aria-hidden="true" />
          </div>
          <p className="mt-3 text-2xl font-semibold text-[#092F35] tabular-nums">
            {loading
              ? '—'
              : (data?.metrics.reportsCount || 0) + (data?.metrics.documentsCount || 0)}
          </p>
          <p className="mt-1 text-xs text-slate-500 tabular-nums">
            {loading
              ? 'Loading...'
              : `${data?.metrics.reportsCount || 0} reports · ${data?.metrics.documentsCount || 0} documents`}
          </p>
        </Link>

        <Link
          to={hasPerm('leadership.enquiries') ? '/leadership/enquiries' : '/leadership/settings'}
          className="rounded-xl border border-slate-200 bg-white p-5 transition hover:border-[#0F4C5C]"
        >
          <div className="flex items-center justify-between text-xs font-medium text-slate-500">
            <span>Pending Enquiries &amp; Partners</span>
            <Inbox className="h-4 w-4 text-amber-600" aria-hidden="true" />
          </div>
          <p className="mt-3 text-2xl font-semibold text-[#092F35] tabular-nums">
            {loading ? '—' : data?.metrics.pendingEnquiries ?? 0}
          </p>
          <p className="mt-1 text-xs text-slate-500 tabular-nums">
            {loading
              ? 'Loading...'
              : `${data?.metrics.partnershipEnquiries || 0} active business/partnership items`}
          </p>
        </Link>
      </div>

      {/* Work Streams & Recent Reports */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white lg:col-span-7">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
            <h3 className="text-sm font-semibold text-[#092F35]">
              Active Product, Marketing &amp; Testing Streams
            </h3>
            <Link
              to="/leadership/testing"
              className="inline-flex items-center gap-1 text-xs font-medium text-[#0F4C5C] hover:underline"
            >
              <span>View QA &amp; Updates</span>
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </div>

          {loading ? (
            <div className="space-y-3 p-5">
              {Array.from({ length: 4 }).map((_, idx) => (
                <div key={idx} className="h-11 animate-pulse rounded bg-slate-100" />
              ))}
            </div>
          ) : !data || data.recentWorkItems.length === 0 ? (
            <p className="p-6 text-sm text-slate-500">No executive work streams recorded yet.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {data.recentWorkItems.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col gap-2 px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-[#092F35]">{item.title}</p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      <span className="capitalize">{item.domain}</span>
                      {' · '}
                      <span>{item.owner_name || 'MAATA Team'}</span>
                      {' · '}
                      <span className="capitalize">{item.status.replace(/_/g, ' ')}</span>
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <span className="font-mono text-xs font-medium text-slate-700 tabular-nums">
                      {item.progress_pct}%
                    </span>
                    <Link
                      to={`/leadership/${item.domain}`}
                      className="text-xs font-medium text-[#0F4C5C] hover:underline"
                    >
                      Open
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white lg:col-span-5">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
            <h3 className="text-sm font-semibold text-[#092F35]">Executive Reports &amp; Website</h3>
            {hasPerm('leadership.reports.read') && (
              <Link
                to="/leadership/reports"
                className="text-xs font-medium text-[#0F4C5C] hover:underline"
              >
                All Reports
              </Link>
            )}
          </div>

          <div className="divide-y divide-slate-100">
            <div className="grid grid-cols-2 divide-x divide-slate-100 bg-slate-50/60 text-xs">
              <div className="p-4">
                <p className="text-slate-500">Published Newsroom Articles</p>
                <p className="mt-1 text-lg font-semibold text-[#092F35] tabular-nums">
                  {loading ? '—' : data?.metrics.publishedArticles ?? 0}
                </p>
              </div>
              <div className="p-4">
                <p className="text-slate-500">Active Website Notices</p>
                <p className="mt-1 text-lg font-semibold text-[#092F35] tabular-nums">
                  {loading ? '—' : data?.metrics.activeAnnouncements ?? 0}
                </p>
              </div>
            </div>

            {loading ? (
              <div className="p-5">
                <div className="h-20 animate-pulse rounded bg-slate-100" />
              </div>
            ) : !data || data.recentReports.length === 0 ? (
              <p className="p-5 text-xs text-slate-500">No executive reports filed yet.</p>
            ) : (
              data.recentReports.map((rep) => (
                <div key={rep.id} className="px-5 py-3.5">
                  <p className="text-sm font-medium text-[#092F35]">{rep.title}</p>
                  <p className="mt-0.5 text-xs text-slate-500 tabular-nums">
                    {rep.period_label || 'Current Cycle'} · {rep.author_name} ·{' '}
                    {formatAdminDate(rep.updated_at)}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Recent Executive & Security Activity */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div className="flex items-center gap-2">
            <CheckSquare className="h-4 w-4 text-[#0F8A5F]" aria-hidden="true" />
            <h3 className="text-sm font-semibold text-[#092F35]">
              Recent Security &amp; Governance Events
            </h3>
          </div>
          <Link
            to="/leadership/settings"
            className="text-xs font-medium text-[#0F4C5C] hover:underline"
          >
            Security &amp; 2FA Settings
          </Link>
        </div>

        {loading ? (
          <div className="p-5">
            <div className="h-24 animate-pulse rounded bg-slate-100" />
          </div>
        ) : !data || data.recentAudit.length === 0 ? (
          <p className="p-5 text-xs text-slate-500">No recent audit entries.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Event</th>
                  <th className="px-4 py-3 font-medium">Account</th>
                  <th className="px-4 py-3 font-medium">Role</th>
                  <th className="px-4 py-3 font-medium">IP Address</th>
                  <th className="px-4 py-3 text-right font-medium">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.recentAudit.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/60">
                    <td className="px-4 py-2.5 font-medium text-[#092F35]">
                      {row.action.replace(/_/g, ' ')}
                    </td>
                    <td className="px-4 py-2.5 text-slate-700">{row.actor_email}</td>
                    <td className="px-4 py-2.5 text-slate-600">
                      {row.actor_role.replace(/_/g, ' ')}
                    </td>
                    <td className="px-4 py-2.5 font-mono text-[11px] text-slate-500 tabular-nums">
                      {row.ip_address || '—'}
                    </td>
                    <td className="px-4 py-2.5 text-right text-slate-500 tabular-nums whitespace-nowrap">
                      {formatAdminDate(row.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
