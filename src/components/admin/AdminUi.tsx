import React, { useEffect, useState } from 'react';
import { Check, Image as ImageIcon, Search, X } from 'lucide-react';
import { adminApi, type CmsMediaAsset } from '../../services/cmsApi';

export function formatAdminDate(value?: string | null): string {
  if (!value) return '—';
  const normalized = value.includes('T') ? value : value.replace(' ', 'T') + 'Z';
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatBytes(bytes: number): string {
  if (!bytes || bytes <= 0) return 'Built-in asset';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function toDatetimeLocalValue(iso?: string | null): string {
  if (!iso) return '';
  const normalized = iso.includes('T') ? iso : iso.replace(' ', 'T') + 'Z';
  const d = new Date(normalized);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function fromDatetimeLocalValue(localVal: string): string | null {
  if (!localVal.trim()) return null;
  const d = new Date(localVal);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

const STATUS_STYLE_MAP: Record<string, string> = {
  published: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  resolved: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  active: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  super_admin: 'bg-[#092F35] text-[#FFD84A] border-[#092F35]',
  founder: 'bg-[#0F4C5C] text-[#FFD84A] border-[#0F4C5C]',
  ceo: 'bg-[#0B5D4B] text-white border-[#0B5D4B]',
  content_manager: 'bg-teal-50 text-teal-900 border-teal-200',
  support_manager: 'bg-sky-50 text-sky-900 border-sky-200',
  scheduled: 'bg-amber-50 text-amber-800 border-amber-200',
  in_review: 'bg-amber-50 text-amber-800 border-amber-200',
  pending: 'bg-amber-50 text-amber-800 border-amber-200',
  draft: 'bg-slate-100 text-slate-700 border-slate-200',
  unpublished: 'bg-slate-100 text-slate-700 border-slate-200',
  archived: 'bg-slate-100 text-slate-600 border-slate-200',
  inactive: 'bg-rose-50 text-rose-800 border-rose-200',
};

export const StatusBadge: React.FC<{ status: string; label?: string }> = ({ status, label }) => {
  const cls =
    STATUS_STYLE_MAP[status] || 'bg-slate-100 text-slate-700 border-slate-200';
  const text = label || status.replace(/_/g, ' ');
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 text-[11px] font-medium uppercase tracking-wider rounded border whitespace-nowrap ${cls}`}
    >
      {text}
    </span>
  );
};

interface ConfirmModalProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  destructive?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  destructive = false,
  loading = false,
  onConfirm,
  onCancel,
}) => {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#092F35]/60 p-4 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
    >
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <h3 id="confirm-modal-title" className="text-lg font-semibold text-[#092F35]">
            {title}
          </h3>
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            aria-label="Close confirmation dialog"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <p className="mt-2.5 text-sm leading-relaxed text-slate-600">{description}</p>
        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 ${
              destructive
                ? 'bg-rose-600 hover:bg-rose-700'
                : 'bg-[#0F4C5C] hover:bg-[#092F35]'
            }`}
          >
            {loading ? 'Processing...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

interface PreviewModalProps {
  open: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
}

export const PreviewModal: React.FC<PreviewModalProps> = ({
  open,
  title,
  subtitle,
  onClose,
  children,
}) => {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#092F35]/65 p-4 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
    >
      <div className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 bg-[#F7F4EC] px-6 py-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#0F8A5F]">
              Draft / Live Content Preview
            </p>
            <h3 className="mt-0.5 text-lg font-semibold text-[#092F35]">{title}</h3>
            {subtitle && <p className="text-xs text-slate-600">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-300 bg-white p-2 text-slate-600 hover:bg-slate-50 hover:text-[#092F35]"
            aria-label="Close preview"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="overflow-y-auto p-6">{children}</div>
      </div>
    </div>
  );
};

interface MediaPickerModalProps {
  open: boolean;
  selectedUrl?: string;
  onSelect: (url: string, asset: CmsMediaAsset) => void;
  onClose: () => void;
}

export const MediaPickerModal: React.FC<MediaPickerModalProps> = ({
  open,
  selectedUrl,
  onSelect,
  onClose,
}) => {
  const [items, setItems] = useState<CmsMediaAsset[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    let active = true;
    setLoading(true);
    setError('');
    adminApi
      .getMedia({ search: search.trim() || undefined })
      .then((res) => {
        if (active) setItems(res.items);
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
  }, [open, search]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#092F35]/65 p-4 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
    >
      <div className="flex max-h-[88vh] w-full max-w-4xl flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <ImageIcon className="h-5 w-5 text-[#0F8A5F]" />
            <div>
              <h3 className="text-base font-semibold text-[#092F35]">Select Media Asset</h3>
              <p className="text-xs text-slate-500">Choose an approved image from the MAATA Media Library</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"
            aria-label="Close media selector"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="border-b border-slate-200 bg-slate-50 px-6 py-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by filename or alt text..."
              className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm text-slate-800 focus:border-[#0F4C5C] focus:outline-none"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          )}
          {loading ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
              {Array.from({ length: 8 }).map((_, idx) => (
                <div key={idx} className="h-40 animate-pulse rounded-lg border border-slate-200 bg-slate-100" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <p className="py-12 text-center text-sm text-slate-500">
              No matching images found in the Media Library. Upload one in the Media Library module first.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
              {items.map((item) => {
                const isSelected = selectedUrl === item.url;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      onSelect(item.url, item);
                      onClose();
                    }}
                    className={`group relative flex flex-col overflow-hidden rounded-lg border text-left transition ${
                      isSelected
                        ? 'border-[#0F8A5F] ring-2 ring-[#0F8A5F]/25'
                        : 'border-slate-200 hover:border-[#0F4C5C]'
                    }`}
                  >
                    <div className="aspect-video w-full overflow-hidden bg-slate-100">
                      <img
                        src={item.url}
                        alt={item.alt_text}
                        className="h-full w-full object-cover transition group-hover:scale-105"
                      />
                    </div>
                    <div className="p-2.5">
                      <p className="truncate text-xs font-medium text-slate-800">{item.original_name}</p>
                      <p className="mt-0.5 truncate text-[11px] text-slate-500">
                        {item.category.replace(/_/g, ' ')}
                      </p>
                    </div>
                    {isSelected && (
                      <span className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-[#0F8A5F] text-white shadow">
                        <Check className="h-3.5 w-3.5" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
