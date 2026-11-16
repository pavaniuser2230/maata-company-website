import React, { useEffect, useState } from 'react';
import { Download, Search } from 'lucide-react';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { adminApi, type CmsEnquiry } from '../../services/cmsApi';
import { formatAdminDate } from '../../components/admin/AdminUi';

export const LeadershipEnquiriesPage: React.FC = () => {
  const { user } = useAdminAuth();
  const perms = new Set(user?.permissions || []);
  const canAccess = user?.role === 'super_admin' || perms.has('leadership.enquiries');

  const [items, setItems] = useState<CmsEnquiry[]>([]);
  const [total, setTotal] = useState(0);
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');

  const [selected, setSelected] = useState<CmsEnquiry | null>(null);
  const [nextStatus, setNextStatus] = useState<CmsEnquiry['status']>('in_review');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const loadEnquiries = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await adminApi.getEnquiries({
        type: typeFilter !== 'all' ? typeFilter : undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        search: search.trim() || undefined,
        page: 1,
      });
      setItems(res.items);
      setTotal(res.total);
    } catch (err: any) {
      setError(err?.message || 'Unable to load enquiries.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (canAccess) {
      void loadEnquiries();
    } else {
      setLoading(false);
    }
  }, [canAccess, typeFilter, statusFilter, search]);

  if (!canAccess) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-950">
        Your current account permissions do not include Enquiries &amp; Partnerships.
      </div>
    );
  }

  const handleSaveEnquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) return;
    setSaving(true);
    setError('');
    setFeedback('');
    try {
      await adminApi.updateEnquiry(selected.id, {
        status: nextStatus,
        internalNotes: notes,
      });
      setFeedback(`Updated status for ${selected.full_name} to ${nextStatus.replace(/_/g, ' ')}.`);
      setSelected(null);
      await loadEnquiries();
    } catch (err: any) {
      setError(err?.message || 'Unable to update enquiry.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-[#092F35]">Enquiries &amp; Partnerships</h2>
          <p className="mt-1 text-xs text-slate-600 tabular-nums">
            Executive triage across partnership requests, merchant enquiries, and feedback ({total}{' '}
            total matching).
          </p>
        </div>

        <a
          href={`/api/admin/enquiries/export${typeFilter !== 'all' ? `?type=${encodeURIComponent(typeFilter)}` : ''}`}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-medium text-[#092F35] hover:bg-slate-50 whitespace-nowrap"
        >
          <Download className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Export CSV</span>
        </a>
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

      {/* Filters */}
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            aria-label="Filter enquiry type"
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5"
          >
            <option value="all">All Types</option>
            <option value="partnership">Partnership</option>
            <option value="business">Business / Merchant</option>
            <option value="general">General</option>
            <option value="feedback">Feedback</option>
            <option value="careers">Careers</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            aria-label="Filter enquiry status"
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="in_review">In Review</option>
            <option value="resolved">Resolved</option>
            <option value="archived">Archived</option>
          </select>
        </div>

        <div className="relative w-full sm:w-64">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, organisation, text..."
            className="w-full rounded-lg border border-slate-300 py-1.5 pl-8 pr-3 text-xs"
          />
        </div>
      </div>

      {/* Table + Side Review */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div
          className={`overflow-hidden rounded-xl border border-slate-200 bg-white ${
            selected ? 'lg:col-span-7' : 'lg:col-span-12'
          }`}
        >
          {loading ? (
            <div className="space-y-2 p-5">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-12 animate-pulse rounded bg-slate-100" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <p className="p-8 text-center text-sm text-slate-500">
              No corporate enquiries match the selected filters.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-200 bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-4 py-3 font-medium">Contact</th>
                    <th className="px-4 py-3 font-medium">Type</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 text-right font-medium">Received</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((item) => (
                    <tr
                      key={item.id}
                      onClick={() => {
                        setSelected(item);
                        setNextStatus(item.status);
                        setNotes(item.internal_notes || '');
                      }}
                      className={`cursor-pointer hover:bg-slate-50 ${
                        selected?.id === item.id ? 'bg-[#F7F4EC]' : ''
                      }`}
                    >
                      <td className="px-4 py-3">
                        <p className="font-semibold text-[#092F35]">{item.full_name}</p>
                        <p className="text-[11px] text-slate-500">
                          {item.organisation || item.email}
                        </p>
                      </td>
                      <td className="px-4 py-3 capitalize text-slate-700">{item.type}</td>
                      <td className="px-4 py-3 capitalize text-slate-700">
                        {item.status.replace(/_/g, ' ')}
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
        </div>

        {selected && (
          <form
            onSubmit={handleSaveEnquiry}
            className="rounded-xl border border-slate-200 bg-white p-5 space-y-4 text-xs lg:col-span-5"
          >
            <div className="flex items-start justify-between border-b border-slate-200 pb-3">
              <div>
                <p className="text-[11px] uppercase tracking-wider text-[#0F8A5F] font-semibold">
                  {selected.type} enquiry
                </p>
                <h3 className="text-base font-semibold text-[#092F35]">{selected.full_name}</h3>
                <p className="text-slate-500">{selected.email}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="text-xs text-slate-500 hover:underline"
              >
                Close
              </button>
            </div>

            {selected.organisation && (
              <p>
                <span className="font-medium text-slate-700">Organisation / Location: </span>
                {selected.organisation}
              </p>
            )}

            <div className="rounded-lg bg-slate-50 p-3 text-slate-700 whitespace-pre-line leading-relaxed">
              {selected.message}
            </div>

            <div>
              <label className="block font-medium text-slate-700">Status</label>
              <select
                value={nextStatus}
                onChange={(e) => setNextStatus(e.target.value as CmsEnquiry['status'])}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2"
              >
                <option value="pending">Pending</option>
                <option value="in_review">In Review</option>
                <option value="resolved">Resolved</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            <div>
              <label className="block font-medium text-slate-700">Executive Notes</label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-lg bg-[#092F35] px-4 py-2 font-semibold text-white hover:bg-[#0F4C5C] disabled:opacity-50"
            >
              {saving ? 'Updating...' : 'Save Review Decision'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
