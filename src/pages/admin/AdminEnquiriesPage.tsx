import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  CheckCircle2,
  Download,
  Lock,
  Mail,
  Search,
  X,
} from 'lucide-react';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { adminApi, type CmsEnquiry } from '../../services/cmsApi';
import { formatAdminDate, StatusBadge } from '../../components/admin/AdminUi';

const TYPE_TABS: { value: string; label: string }[] = [
  { value: 'all', label: 'All Submissions' },
  { value: 'general', label: 'General' },
  { value: 'business', label: 'Business' },
  { value: 'partnership', label: 'Partnerships' },
  { value: 'careers', label: 'Careers' },
  { value: 'feedback', label: 'Feedback' },
];

export const AdminEnquiriesPage: React.FC = () => {
  const { user } = useAdminAuth();
  const [searchParams] = useSearchParams();

  const canAccess = user?.role === 'super_admin' || user?.role === 'support_manager';

  const [typeFilter, setTypeFilter] = useState(searchParams.get('type') || 'all');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'all');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);

  const [items, setItems] = useState<CmsEnquiry[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<CmsEnquiry | null>(null);
  const [notesDraft, setNotesDraft] = useState('');
  const [statusDraft, setStatusDraft] = useState<CmsEnquiry['status']>('pending');
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const loadEnquiries = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getEnquiries({
        type: typeFilter !== 'all' ? typeFilter : undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        search: searchQuery.trim() || undefined,
        page,
      });
      setItems(res.items);
      setTotal(res.total);
    } catch (err: any) {
      setFeedback({ type: 'err', text: err?.message || 'Failed to load enquiries.' });
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
  }, [canAccess, typeFilter, statusFilter, searchQuery, page]);

  if (!canAccess) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900">
        <div className="flex items-center gap-2 font-semibold">
          <Lock className="h-4 w-4" />
          <span>Restricted Module</span>
        </div>
        <p className="mt-1">
          Customer enquiries, career applications, and feedback records contain personal contact
          details and are restricted to Support Managers and Super Administrators.
        </p>
      </div>
    );
  }

  const openDetail = (enq: CmsEnquiry) => {
    setSelected(enq);
    setNotesDraft(enq.internal_notes || '');
    setStatusDraft(enq.status);
    setFeedback(null);
  };

  const handleSaveEnquiry = async (overrideStatus?: CmsEnquiry['status']) => {
    if (!selected) return;
    const targetStatus = overrideStatus || statusDraft;
    setSaving(true);
    setFeedback(null);
    try {
      await adminApi.updateEnquiry(selected.id, {
        status: targetStatus,
        internalNotes: notesDraft,
      });
      setStatusDraft(targetStatus);
      setSelected((prev) =>
        prev
          ? {
              ...prev,
              status: targetStatus,
              internal_notes: notesDraft,
            }
          : null
      );
      await loadEnquiries();
      setFeedback({
        type: 'ok',
        text: `Enquiry ${selected.id} updated (${targetStatus.replace(/_/g, ' ')}).`,
      });
    } catch (err: any) {
      setFeedback({ type: 'err', text: err?.message || 'Failed to update enquiry.' });
    } finally {
      setSaving(false);
    }
  };

  const exportUrl = `/api/admin/enquiries/export${
    typeFilter !== 'all' ? `?type=${encodeURIComponent(typeFilter)}` : ''
  }`;

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

      {/* Type Tabs */}
      <div className="flex flex-wrap gap-2 rounded-xl border border-slate-200 bg-white p-2">
        {TYPE_TABS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => {
              setPage(1);
              setTypeFilter(tab.value);
            }}
            className={`rounded-lg px-3.5 py-2 text-xs font-medium transition ${
              typeFilter === tab.value
                ? 'bg-[#092F35] text-white'
                : 'text-slate-600 hover:bg-slate-100 hover:text-[#092F35]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filters & CSV Export */}
      <div className="flex flex-col justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center">
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
              placeholder="Search name, email, ref ID..."
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
            aria-label="Filter enquiries by status"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="in_review">In Review</option>
            <option value="resolved">Resolved</option>
            <option value="archived">Archived</option>
          </select>
        </div>

        <a
          href={exportUrl}
          className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-[#0F4C5C] bg-white px-4 py-2 text-xs font-semibold text-[#0F4C5C] hover:bg-slate-50"
        >
          <Download className="h-3.5 w-3.5" />
          <span>Export CSV</span>
        </a>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Enquiries List */}
        <div
          className={`overflow-hidden rounded-xl border border-slate-200 bg-white ${
            selected ? 'lg:col-span-2' : 'lg:col-span-3'
          }`}
        >
          {loading ? (
            <div className="space-y-2 p-6">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-12 animate-pulse rounded bg-slate-100" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-sm font-medium text-[#092F35]">No enquiries found.</p>
              <p className="mt-1 text-xs text-slate-500">
                Public contact, partnership, careers, and feedback submissions will appear here.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-200 bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-4 py-3 font-medium">Reference / Sender</th>
                    <th className="px-4 py-3 font-medium">Category</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 text-right font-medium">Submitted</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((enq) => {
                    const isSelected = selected?.id === enq.id;
                    return (
                      <tr
                        key={enq.id}
                        onClick={() => openDetail(enq)}
                        className={`cursor-pointer transition ${
                          isSelected ? 'bg-[#F7F4EC]' : 'hover:bg-slate-50/70'
                        }`}
                      >
                        <td className="px-4 py-3">
                          <p className="font-semibold text-[#092F35]">{enq.full_name}</p>
                          <p className="text-[11px] text-slate-500">
                            {enq.email} · <span className="font-mono">{enq.id}</span>
                          </p>
                        </td>
                        <td className="px-4 py-3 capitalize text-slate-600">{enq.type}</td>
                        <td className="px-4 py-3">
                          <StatusBadge status={enq.status} />
                        </td>
                        <td className="px-4 py-3 text-right text-slate-500 tabular-nums whitespace-nowrap">
                          {formatAdminDate(enq.created_at)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {total > 25 && (
            <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3 text-xs text-slate-600">
              <span className="tabular-nums">Total records: {total}</span>
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
                  disabled={page * 25 >= total}
                  onClick={() => setPage((p) => p + 1)}
                  className="rounded border border-slate-300 px-3 py-1 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Detail Drawer */}
        {selected && (
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="flex items-start justify-between gap-2 border-b border-slate-200 pb-3">
              <div>
                <p className="font-mono text-[11px] text-slate-500">{selected.id}</p>
                <h3 className="text-base font-semibold text-[#092F35]">{selected.full_name}</h3>
                <a
                  href={`mailto:${selected.email}`}
                  className="mt-0.5 inline-flex items-center gap-1 text-xs text-[#0F4C5C] hover:underline"
                >
                  <Mail className="h-3 w-3" />
                  <span>{selected.email}</span>
                </a>
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="rounded p-1 text-slate-400 hover:bg-slate-100"
                aria-label="Close enquiry detail"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Type:</span>
                <span className="font-medium capitalize text-[#092F35]">{selected.type}</span>
              </div>
              {selected.organisation && (
                <div className="flex items-center justify-between gap-4">
                  <span className="text-slate-500">Organisation:</span>
                  <span className="text-right font-medium text-[#092F35]">
                    {selected.organisation}
                  </span>
                </div>
              )}
              {selected.subject_context && (
                <div className="flex items-center justify-between gap-4">
                  <span className="text-slate-500">Subject:</span>
                  <span className="text-right font-medium text-[#092F35]">
                    {selected.subject_context}
                  </span>
                </div>
              )}
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs leading-relaxed text-slate-800 whitespace-pre-wrap">
                {selected.message}
              </div>

              <div>
                <label className="block font-medium text-slate-700">Workflow Status</label>
                <select
                  value={statusDraft}
                  onChange={(e) => setStatusDraft(e.target.value as CmsEnquiry['status'])}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs"
                >
                  <option value="pending">Pending</option>
                  <option value="in_review">In Review</option>
                  <option value="resolved">Resolved</option>
                  <option value="archived">Archived</option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-700">Internal Notes</label>
                <textarea
                  rows={4}
                  value={notesDraft}
                  onChange={(e) => setNotesDraft(e.target.value)}
                  placeholder="Record internal follow-up or verification notes..."
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs"
                />
              </div>

              <div className="flex flex-wrap gap-2 pt-2">
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => handleSaveEnquiry()}
                  className="flex-1 rounded-lg bg-[#092F35] px-3 py-2 text-xs font-semibold text-white hover:bg-[#0F4C5C] disabled:opacity-50"
                >
                  Save Notes & Status
                </button>
                {selected.status !== 'resolved' && (
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => handleSaveEnquiry('resolved')}
                    className="inline-flex items-center gap-1 rounded-lg bg-[#0F8A5F] px-3 py-2 text-xs font-semibold text-white hover:bg-[#0B5D4B] disabled:opacity-50"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>Resolve</span>
                  </button>
                )}
              </div>

              {selected.resolved_at && (
                <p className="pt-1 text-[11px] text-slate-500 tabular-nums">
                  Resolved by {selected.resolved_by} on {formatAdminDate(selected.resolved_at)}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
