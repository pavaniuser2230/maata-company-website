import React, { useEffect, useMemo, useState } from 'react';
import { Pencil, Plus, Search, Trash2, X } from 'lucide-react';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { ConfirmModal, formatAdminDate } from '../../components/admin/AdminUi';
import {
  leadershipApi,
  type LeadershipWorkItem,
  type WorkItemDomain,
  type WorkItemPriority,
  type WorkItemStatus,
} from '../../services/leadershipApi';

interface LeadershipTrackerPageProps {
  domain: WorkItemDomain;
  title: string;
  description: string;
  defaultCategory: string;
}

const STATUS_LABELS: Record<WorkItemStatus, string> = {
  planned: 'Planned',
  in_progress: 'In Progress',
  in_review: 'In Review',
  completed: 'Completed',
  blocked: 'Blocked',
};

const EMPTY_FORM = {
  title: '',
  category: '',
  summary: '',
  ownerName: '',
  priority: 'medium' as WorkItemPriority,
  status: 'planned' as WorkItemStatus,
  progressPct: 0,
  targetDate: '',
  notes: '',
};

export const LeadershipTrackerPage: React.FC<LeadershipTrackerPageProps> = ({
  domain,
  title,
  description,
  defaultCategory,
}) => {
  const { user } = useAdminAuth();
  const perms = new Set(user?.permissions || []);
  const canWrite =
    user?.role === 'super_admin' || perms.has(`leadership.${domain}.write` as any);

  const [items, setItems] = useState<LeadershipWorkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<LeadershipWorkItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadItems = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await leadershipApi.getWorkItems(domain, statusFilter);
      setItems(res.items);
    } catch (err: any) {
      setError(err?.message || 'Unable to load work items.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadItems();
  }, [domain, statusFilter]);

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (i) =>
        i.title.toLowerCase().includes(q) ||
        i.category.toLowerCase().includes(q) ||
        i.owner_name.toLowerCase().includes(q) ||
        i.summary.toLowerCase().includes(q)
    );
  }, [items, search]);

  const openCreate = () => {
    setEditingId(null);
    setForm({
      ...EMPTY_FORM,
      category: defaultCategory,
      ownerName: user?.name || '',
    });
    setModalOpen(true);
  };

  const openEdit = (item: LeadershipWorkItem) => {
    setEditingId(item.id);
    setForm({
      title: item.title,
      category: item.category,
      summary: item.summary,
      ownerName: item.owner_name,
      priority: item.priority,
      status: item.status,
      progressPct: item.progress_pct,
      targetDate: item.target_date || '',
      notes: item.notes,
    });
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setFeedback('');
    try {
      const payload = {
        domain,
        title: form.title.trim(),
        category: form.category.trim(),
        summary: form.summary.trim(),
        ownerName: form.ownerName.trim(),
        priority: form.priority,
        status: form.status,
        progressPct: Number(form.progressPct) || 0,
        targetDate: form.targetDate.trim() || null,
        notes: form.notes.trim(),
      };
      if (editingId) {
        await leadershipApi.updateWorkItem(editingId, payload);
        setFeedback('Initiative updated.');
      } else {
        await leadershipApi.createWorkItem(payload);
        setFeedback('Initiative added.');
      }
      setModalOpen(false);
      await loadItems();
    } catch (err: any) {
      setError(err?.message || 'Unable to save item.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await leadershipApi.deleteWorkItem(deleteTarget.id);
      setDeleteTarget(null);
      setFeedback('Item removed.');
      await loadItems();
    } catch (err: any) {
      setError(err?.message || 'Unable to delete item.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-[#092F35]">{title}</h2>
          <p className="mt-1 text-xs text-slate-600">{description}</p>
        </div>
        {canWrite ? (
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#092F35] px-4 py-2 text-xs font-semibold text-white hover:bg-[#0F4C5C] whitespace-nowrap shrink-0"
          >
            <Plus className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Add Entry</span>
          </button>
        ) : (
          <span className="text-xs font-medium text-slate-500 whitespace-nowrap">
            Read-only executive view
          </span>
        )}
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

      {/* Filter & Search Bar */}
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-1 rounded-lg bg-slate-100 p-1">
          {(['all', 'planned', 'in_progress', 'in_review', 'completed', 'blocked'] as const).map(
            (st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition whitespace-nowrap ${
                  statusFilter === st
                    ? 'bg-white text-[#092F35] shadow-xs'
                    : 'text-slate-600 hover:text-[#092F35]'
                }`}
              >
                {st === 'all' ? 'All' : STATUS_LABELS[st]}
              </button>
            )
          )}
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
            placeholder="Filter items..."
            className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-8 pr-3 text-xs text-slate-800 focus:border-[#0F4C5C] focus:outline-none"
          />
        </div>
      </div>

      {/* Data Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        {loading ? (
          <div className="space-y-3 p-5">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-12 animate-pulse rounded bg-slate-100" />
            ))}
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-sm font-medium text-slate-700">No items match your current filter.</p>
            {canWrite && (
              <button
                type="button"
                onClick={openCreate}
                className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3.5 py-2 text-xs font-medium text-[#092F35] hover:bg-slate-50"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Log First Entry</span>
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Initiative</th>
                  <th className="px-4 py-3 font-medium">Owner</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Priority</th>
                  <th className="px-4 py-3 text-right font-medium">Progress</th>
                  <th className="px-4 py-3 text-right font-medium">Updated</th>
                  {canWrite && <th className="px-4 py-3 text-right font-medium">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-[#092F35]">{item.title}</p>
                      <p className="mt-0.5 text-[11px] text-slate-500">
                        {item.category || defaultCategory}
                        {item.summary ? ` · ${item.summary}` : ''}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-slate-700 whitespace-nowrap">
                      {item.owner_name || '—'}
                    </td>
                    <td className="px-4 py-3 text-slate-700 whitespace-nowrap">
                      {STATUS_LABELS[item.status]}
                    </td>
                    <td className="px-4 py-3 capitalize text-slate-700">{item.priority}</td>
                    <td className="px-4 py-3 text-right font-mono font-medium text-[#092F35] tabular-nums">
                      {item.progress_pct}%
                    </td>
                    <td className="px-4 py-3 text-right text-slate-500 tabular-nums whitespace-nowrap">
                      {formatAdminDate(item.updated_at)}
                    </td>
                    {canWrite && (
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => openEdit(item)}
                            className="rounded border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-100 hover:text-[#092F35]"
                            aria-label={`Edit ${item.title}`}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(item)}
                            className="rounded border border-slate-200 p-1.5 text-rose-600 hover:bg-rose-50"
                            aria-label={`Delete ${item.title}`}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#092F35]/60 p-4 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
        >
          <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-base font-semibold text-[#092F35]">
                {editingId ? 'Update Entry' : `New ${title} Entry`}
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded p-1 text-slate-400 hover:bg-slate-100"
                aria-label="Close modal"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-medium text-slate-700">Title *</label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="block font-medium text-slate-700">Workstream / Area</label>
                  <input
                    type="text"
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700">Lead / Owner</label>
                  <input
                    type="text"
                    value={form.ownerName}
                    onChange={(e) => setForm({ ...form, ownerName: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div>
                  <label className="block font-medium text-slate-700">Status</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value as WorkItemStatus })}
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs"
                  >
                    {Object.entries(STATUS_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-slate-700">Priority</label>
                  <select
                    value={form.priority}
                    onChange={(e) =>
                      setForm({ ...form, priority: e.target.value as WorkItemPriority })
                    }
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs"
                  >
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-slate-700">Progress (%)</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={form.progressPct}
                    onChange={(e) => setForm({ ...form, progressPct: Number(e.target.value) })}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-xs tabular-nums"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700">Summary</label>
                <textarea
                  rows={2}
                  value={form.summary}
                  onChange={(e) => setForm({ ...form, summary: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700">Internal Executive Notes</label>
                <textarea
                  rows={3}
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-[#092F35] px-4 py-2 text-xs font-semibold text-white hover:bg-[#0F4C5C] disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Entry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        open={Boolean(deleteTarget)}
        title="Delete Executive Entry"
        description={`Remove "${deleteTarget?.title}" from ${title}?`}
        confirmLabel="Delete"
        destructive
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};
