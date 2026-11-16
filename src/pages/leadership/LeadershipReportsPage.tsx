import React, { useEffect, useState } from 'react';
import { Download, FileText, Pencil, Plus, Trash2, X } from 'lucide-react';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { ConfirmModal, formatAdminDate } from '../../components/admin/AdminUi';
import {
  leadershipApi,
  type LeadershipReport,
  type ReportMetric,
} from '../../services/leadershipApi';

const REPORT_TYPE_LABELS: Record<LeadershipReport['report_type'], string> = {
  executive_summary: 'Executive Summary',
  operations: 'Operations Report',
  merchant_growth: 'Merchant & Local Network',
  financial: 'Financial & Investment',
  product_metrics: 'Product & QA Metrics',
};

export const LeadershipReportsPage: React.FC = () => {
  const { user } = useAdminAuth();
  const perms = new Set(user?.permissions || []);
  const canWrite = user?.role === 'super_admin' || perms.has('leadership.reports.write');

  const [reports, setReports] = useState<LeadershipReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [reportType, setReportType] =
    useState<LeadershipReport['report_type']>('executive_summary');
  const [periodLabel, setPeriodLabel] = useState('');
  const [summary, setSummary] = useState('');
  const [highlights, setHighlights] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [status, setStatus] = useState<'draft' | 'final'>('final');
  const [metrics, setMetrics] = useState<ReportMetric[]>([{ label: '', value: '', note: '' }]);
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<LeadershipReport | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadReports = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await leadershipApi.getReports();
      setReports(res.items);
    } catch (err: any) {
      setError(err?.message || 'Unable to load business reports.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadReports();
  }, []);

  const openCreate = () => {
    setEditingId(null);
    setTitle('');
    setReportType('executive_summary');
    setPeriodLabel('');
    setSummary('');
    setHighlights('');
    setAuthorName(user?.name || '');
    setStatus('final');
    setMetrics([{ label: '', value: '', note: '' }]);
    setModalOpen(true);
  };

  const openEdit = (rep: LeadershipReport) => {
    setEditingId(rep.id);
    setTitle(rep.title);
    setReportType(rep.report_type);
    setPeriodLabel(rep.period_label);
    setSummary(rep.summary);
    setHighlights(rep.highlights);
    setAuthorName(rep.author_name);
    setStatus(rep.status);
    setMetrics(
      rep.metrics && rep.metrics.length > 0 ? rep.metrics : [{ label: '', value: '', note: '' }]
    );
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setFeedback('');
    try {
      const cleanMetrics = metrics
        .filter((m) => m.label.trim() && m.value.trim())
        .map((m) => ({
          label: m.label.trim(),
          value: m.value.trim(),
          note: (m.note || '').trim(),
        }));

      const payload = {
        title: title.trim(),
        reportType,
        periodLabel: periodLabel.trim(),
        summary: summary.trim(),
        metrics: cleanMetrics,
        highlights: highlights.trim(),
        authorName: authorName.trim() || user?.name || 'Leadership',
        status,
      };

      if (editingId) {
        await leadershipApi.updateReport(editingId, payload);
        setFeedback('Business report updated.');
      } else {
        await leadershipApi.createReport(payload);
        setFeedback('Business report created.');
      }
      setModalOpen(false);
      await loadReports();
    } catch (err: any) {
      setError(err?.message || 'Unable to save report.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await leadershipApi.deleteReport(deleteTarget.id);
      setDeleteTarget(null);
      setFeedback('Report removed.');
      await loadReports();
    } catch (err: any) {
      setError(err?.message || 'Failed to delete report.');
    } finally {
      setDeleting(false);
    }
  };

  const downloadReportBrief = (rep: LeadershipReport) => {
    const lines = [
      `MAATA TECHNOLOGIES — PRIVATE LEADERSHIP REPORT`,
      `Title: ${rep.title}`,
      `Category: ${REPORT_TYPE_LABELS[rep.report_type]}`,
      `Period: ${rep.period_label || 'Current'}`,
      `Author: ${rep.author_name}`,
      `Status: ${rep.status.toUpperCase()}`,
      ``,
      `Summary:`,
      rep.summary,
      ``,
      ...(rep.metrics.length > 0
        ? [
            `Key Figures:`,
            ...rep.metrics.map(
              (m) => `- ${m.label}: ${m.value}${m.note ? ` (${m.note})` : ''}`
            ),
            ``,
          ]
        : []),
      ...(rep.highlights ? [`Highlights & Next Actions:`, rep.highlights] : []),
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${rep.id}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-[#092F35]">Business Reports</h2>
          <p className="mt-1 text-xs text-slate-600">
            Executive briefs, merchant growth reviews, operational summaries, and financial notes.
          </p>
        </div>
        {canWrite && (
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#092F35] px-4 py-2 text-xs font-semibold text-white hover:bg-[#0F4C5C] whitespace-nowrap"
          >
            <Plus className="h-3.5 w-3.5" aria-hidden="true" />
            <span>New Business Report</span>
          </button>
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

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="h-36 animate-pulse rounded-xl border border-slate-200 bg-white" />
          ))}
        </div>
      ) : reports.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-10 text-center">
          <FileText className="mx-auto h-7 w-7 text-slate-400" aria-hidden="true" />
          <p className="mt-2 text-sm font-medium text-slate-700">No business reports recorded yet.</p>
          {canWrite && (
            <button
              type="button"
              onClick={openCreate}
              className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3.5 py-2 text-xs font-medium text-[#092F35] hover:bg-slate-50"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Create First Report</span>
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {reports.map((rep) => (
            <article key={rep.id} className="rounded-xl border border-slate-200 bg-white p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs text-slate-500 tabular-nums">
                    {REPORT_TYPE_LABELS[rep.report_type]}
                    {' · '}
                    {rep.period_label || 'Current Cycle'}
                    {' · '}
                    {rep.author_name}
                    {' · '}
                    <span className="uppercase">{rep.status}</span>
                    {' · '}
                    {formatAdminDate(rep.updated_at)}
                  </p>
                  <h3 className="mt-1.5 text-lg font-semibold text-[#092F35]">{rep.title}</h3>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <button
                    type="button"
                    onClick={() => downloadReportBrief(rep)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                  >
                    <Download className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Export Brief</span>
                  </button>
                  {canWrite && (
                    <>
                      <button
                        type="button"
                        onClick={() => openEdit(rep)}
                        className="rounded-lg border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-100"
                        aria-label={`Edit ${rep.title}`}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(rep)}
                        className="rounded-lg border border-slate-200 p-1.5 text-rose-600 hover:bg-rose-50"
                        aria-label={`Delete ${rep.title}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </>
                  )}
                </div>
              </div>

              <p className="mt-3 text-sm leading-relaxed text-slate-700">{rep.summary}</p>

              {rep.metrics.length > 0 && (
                <div className="mt-5 grid grid-cols-1 gap-3 border-t border-slate-100 pt-4 sm:grid-cols-3">
                  {rep.metrics.map((m, idx) => (
                    <div key={idx} className="rounded-lg bg-slate-50 px-4 py-3">
                      <p className="text-[11px] font-medium text-slate-500">{m.label}</p>
                      <p className="mt-1 text-base font-semibold text-[#092F35] tabular-nums">
                        {m.value}
                      </p>
                      {m.note && <p className="mt-0.5 text-[11px] text-slate-500">{m.note}</p>}
                    </div>
                  ))}
                </div>
              )}

              {rep.highlights && (
                <div className="mt-4 border-t border-slate-100 pt-4">
                  <p className="text-xs font-semibold text-[#092F35]">Highlights &amp; Actions</p>
                  <p className="mt-1.5 whitespace-pre-line text-xs leading-relaxed text-slate-600">
                    {rep.highlights}
                  </p>
                </div>
              )}
            </article>
          ))}
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#092F35]/60 p-4 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
        >
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-base font-semibold text-[#092F35]">
                {editingId ? 'Edit Business Report' : 'Create Business Report'}
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded p-1 text-slate-400 hover:bg-slate-100"
                aria-label="Close report modal"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-medium text-slate-700">Report Title *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div>
                  <label className="block font-medium text-slate-700">Report Type</label>
                  <select
                    value={reportType}
                    onChange={(e) =>
                      setReportType(e.target.value as LeadershipReport['report_type'])
                    }
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs"
                  >
                    {Object.entries(REPORT_TYPE_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-slate-700">Period Label</label>
                  <input
                    type="text"
                    value={periodLabel}
                    onChange={(e) => setPeriodLabel(e.target.value)}
                    placeholder="e.g. Q4 2026"
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as 'draft' | 'final')}
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs"
                  >
                    <option value="final">Final</option>
                    <option value="draft">Draft</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700">Executive Summary *</label>
                <textarea
                  rows={3}
                  required
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs"
                />
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label className="font-medium text-slate-700">Key Figures / Metrics</label>
                  <button
                    type="button"
                    onClick={() => setMetrics([...metrics, { label: '', value: '', note: '' }])}
                    className="font-medium text-[#0F4C5C] hover:underline"
                  >
                    + Add Metric Row
                  </button>
                </div>
                <div className="mt-2 space-y-2">
                  {metrics.map((m, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-2">
                      <input
                        type="text"
                        placeholder="Label"
                        value={m.label}
                        onChange={(e) => {
                          const next = [...metrics];
                          next[idx] = { ...m, label: e.target.value };
                          setMetrics(next);
                        }}
                        className="col-span-4 rounded border border-slate-300 px-2.5 py-1.5"
                      />
                      <input
                        type="text"
                        placeholder="Value"
                        value={m.value}
                        onChange={(e) => {
                          const next = [...metrics];
                          next[idx] = { ...m, value: e.target.value };
                          setMetrics(next);
                        }}
                        className="col-span-3 rounded border border-slate-300 px-2.5 py-1.5 font-mono tabular-nums"
                      />
                      <input
                        type="text"
                        placeholder="Context note"
                        value={m.note || ''}
                        onChange={(e) => {
                          const next = [...metrics];
                          next[idx] = { ...m, note: e.target.value };
                          setMetrics(next);
                        }}
                        className="col-span-4 rounded border border-slate-300 px-2.5 py-1.5"
                      />
                      <button
                        type="button"
                        onClick={() => setMetrics(metrics.filter((_, i) => i !== idx))}
                        className="col-span-1 text-rose-600 hover:underline"
                        aria-label="Remove metric row"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700">
                  Key Highlights &amp; Decisions
                </label>
                <textarea
                  rows={3}
                  value={highlights}
                  onChange={(e) => setHighlights(e.target.value)}
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
                  {saving ? 'Saving...' : 'Save Business Report'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        open={Boolean(deleteTarget)}
        title="Delete Business Report"
        description={`Delete "${deleteTarget?.title}"? This action is recorded in the audit log.`}
        confirmLabel="Delete"
        destructive
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};
