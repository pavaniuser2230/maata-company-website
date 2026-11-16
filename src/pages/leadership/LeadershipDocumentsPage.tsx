import React, { useEffect, useState } from 'react';
import { Download, FileLock2, Plus, Trash2, X } from 'lucide-react';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { ConfirmModal, formatAdminDate } from '../../components/admin/AdminUi';
import { leadershipApi, type LeadershipDocument } from '../../services/leadershipApi';

const CATEGORY_LABELS: Record<LeadershipDocument['category'], string> = {
  governance: 'Leadership Governance',
  strategy: 'Company Strategy',
  product_spec: 'Product & Architecture Spec',
  marketing_plan: 'Marketing & Promotions Plan',
  legal_compliance: 'Legal & Compliance',
  financial: 'Financial & Investment',
  meeting_notes: 'Executive Meeting Notes',
};

export const LeadershipDocumentsPage: React.FC = () => {
  const { user } = useAdminAuth();
  const perms = new Set(user?.permissions || []);
  const canWrite = user?.role === 'super_admin' || perms.has('leadership.documents.write');

  const [docs, setDocs] = useState<LeadershipDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<LeadershipDocument['category']>('governance');
  const [classification, setClassification] =
    useState<LeadershipDocument['classification']>('leadership_only');
  const [summary, setSummary] = useState('');
  const [content, setContent] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<LeadershipDocument | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadDocs = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await leadershipApi.getDocuments();
      setDocs(res.items);
    } catch (err: any) {
      setError(err?.message || 'Unable to load confidential documents.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadDocs();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setFeedback('');
    try {
      await leadershipApi.createDocument({
        title: title.trim(),
        category,
        summary: summary.trim(),
        content: content.trim(),
        classification,
        file,
      });
      setTitle('');
      setSummary('');
      setContent('');
      setFile(null);
      setModalOpen(false);
      setFeedback('Confidential leadership document stored securely.');
      await loadDocs();
    } catch (err: any) {
      setError(err?.message || 'Unable to store document.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await leadershipApi.deleteDocument(deleteTarget.id);
      setDeleteTarget(null);
      setFeedback('Document removed.');
      await loadDocs();
    } catch (err: any) {
      setError(err?.message || 'Unable to remove document.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-[#092F35]">Company Documents</h2>
          <p className="mt-1 text-xs text-slate-600">
            Confidential governance memos, internal charters, strategy notes, and protected file
            attachments—never publicly indexed.
          </p>
        </div>
        {canWrite && (
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#092F35] px-4 py-2 text-xs font-semibold text-white hover:bg-[#0F4C5C] whitespace-nowrap"
          >
            <Plus className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Add Company Document</span>
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
            <div key={i} className="h-28 animate-pulse rounded-xl border border-slate-200 bg-white" />
          ))}
        </div>
      ) : docs.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-10 text-center">
          <FileLock2 className="mx-auto h-7 w-7 text-slate-400" aria-hidden="true" />
          <p className="mt-2 text-sm font-medium text-slate-700">No internal documents yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {docs.map((doc) => (
            <article key={doc.id} className="rounded-xl border border-slate-200 bg-white p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs text-slate-500 tabular-nums">
                    {CATEGORY_LABELS[doc.category]}
                    {' · '}
                    {doc.classification === 'executive_confidential'
                      ? 'Executive Confidential'
                      : 'Leadership Only'}
                    {' · '}
                    Updated {formatAdminDate(doc.updated_at)}
                  </p>
                  <h3 className="mt-1.5 text-base font-semibold text-[#092F35]">{doc.title}</h3>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  {doc.attachment_filename && (
                    <a
                      href={`/api/leadership/documents/${encodeURIComponent(doc.id)}/download`}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-[#092F35] hover:bg-slate-50"
                    >
                      <Download className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>Download Attachment</span>
                    </a>
                  )}
                  {canWrite && (
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(doc)}
                      className="rounded-lg border border-slate-200 p-1.5 text-rose-600 hover:bg-rose-50"
                      aria-label={`Delete ${doc.title}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {doc.summary && <p className="mt-2 text-sm text-slate-700">{doc.summary}</p>}
              {doc.content && (
                <div className="mt-3 whitespace-pre-line border-t border-slate-100 pt-3 text-xs leading-relaxed text-slate-600">
                  {doc.content}
                </div>
              )}
              {doc.attachment_original_name && (
                <p className="mt-3 text-[11px] font-mono text-slate-500">
                  Attachment: {doc.attachment_original_name}
                </p>
              )}
            </article>
          ))}
        </div>
      )}

      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#092F35]/60 p-4 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
        >
          <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-base font-semibold text-[#092F35]">
                Add Confidential Company Document
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded p-1 text-slate-400 hover:bg-slate-100"
                aria-label="Close document modal"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-medium text-slate-700">Document Title *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="block font-medium text-slate-700">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as LeadershipDocument['category'])}
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2"
                  >
                    {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-slate-700">Classification</label>
                  <select
                    value={classification}
                    onChange={(e) =>
                      setClassification(e.target.value as LeadershipDocument['classification'])
                    }
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2"
                  >
                    <option value="leadership_only">Leadership Only</option>
                    <option value="executive_confidential">Executive Confidential</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700">Summary</label>
                <textarea
                  rows={2}
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700">Document Body / Notes</label>
                <textarea
                  rows={4}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700">
                  Private File Attachment (Optional — PDF, TXT, MD, CSV, PNG, JPEG, WebP)
                </label>
                <input
                  type="file"
                  accept=".pdf,.txt,.md,.csv,image/png,image/jpeg,image/webp"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-lg border border-slate-300 px-4 py-2 font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-[#092F35] px-4 py-2 font-semibold text-white hover:bg-[#0F4C5C] disabled:opacity-50"
                >
                  {saving ? 'Uploading...' : 'Save Document'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        open={Boolean(deleteTarget)}
        title="Delete Company Document"
        description={`Remove "${deleteTarget?.title}" and any attached private file?`}
        confirmLabel="Delete"
        destructive
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};
