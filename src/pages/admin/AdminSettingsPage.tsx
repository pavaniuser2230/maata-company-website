import React, { useEffect, useState } from 'react';
import { Eye, Globe, Lock, Mail, MapPin, Plus, Save, Share2, Trash2, UploadCloud } from 'lucide-react';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { usePublicCms } from '../../context/PublicCmsContext';
import { adminApi, type CompanySectionRecord } from '../../services/cmsApi';
import {
  ConfirmModal,
  formatAdminDate,
  PreviewModal,
  StatusBadge,
} from '../../components/admin/AdminUi';

export const AdminSettingsPage: React.FC = () => {
  const { user } = useAdminAuth();
  const { refreshPublicCms } = usePublicCms();

  const canEdit = user?.role === 'super_admin' || user?.role === 'content_manager';

  const [contactSection, setContactSection] = useState<CompanySectionRecord | null>(null);
  const [contactDraft, setContactDraft] = useState<{
    companyName: string;
    location: string;
    supportEmail: string;
    secondarySupportEmail: string;
    appUrl: string;
    socialLinks: { label: string; handle: string; href: string }[];
  }>({
    companyName: 'MAATA TECHNOLOGIES',
    location: 'Chittoor, Andhra Pradesh, India',
    supportEmail: 'support@maataapp.com',
    secondarySupportEmail: 'maatasupport215@gmail.com',
    appUrl: 'https://maataapp.com',
    socialLinks: [],
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [confirmUnpublish, setConfirmUnpublish] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getCompanySections();
      const contact = res.sections.find((s) => s.sectionKey === 'contact') || null;
      setContactSection(contact);
      if (contact?.draftData) {
        setContactDraft({
          companyName: contact.draftData.companyName || 'MAATA TECHNOLOGIES',
          location: contact.draftData.location || 'Chittoor, Andhra Pradesh, India',
          supportEmail: contact.draftData.supportEmail || 'support@maataapp.com',
          secondarySupportEmail:
            contact.draftData.secondarySupportEmail || 'maatasupport215@gmail.com',
          appUrl: contact.draftData.appUrl || 'https://maataapp.com',
          socialLinks: Array.isArray(contact.draftData.socialLinks)
            ? structuredClone(contact.draftData.socialLinks)
            : [],
        });
      }
    } catch (err: any) {
      setFeedback({ type: 'err', text: err?.message || 'Unable to load website settings.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (canEdit) {
      void loadSettings();
    } else {
      setLoading(false);
    }
  }, [canEdit]);

  if (!canEdit) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900">
        <div className="flex items-center gap-2 font-semibold">
          <Lock className="h-4 w-4" />
          <span>Restricted Module</span>
        </div>
        <p className="mt-1">
          Website Settings are restricted to Super Administrators and Content Managers.
        </p>
      </div>
    );
  }

  const handleSaveDraft = async () => {
    setSaving(true);
    setFeedback(null);
    try {
      await adminApi.saveCompanyDraft('contact', {
        title: contactSection?.title || 'Contact Details',
        data: contactDraft,
      });
      await loadSettings();
      setFeedback({ type: 'ok', text: 'Website settings draft saved.' });
    } catch (err: any) {
      setFeedback({ type: 'err', text: err?.message || 'Failed to save draft.' });
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    setPublishing(true);
    setFeedback(null);
    try {
      await adminApi.saveCompanyDraft('contact', {
        title: contactSection?.title || 'Contact Details',
        data: contactDraft,
      });
      await adminApi.publishCompanySection('contact');
      await loadSettings();
      await refreshPublicCms();
      setFeedback({
        type: 'ok',
        text: 'Website settings published. Support email, contact info, and social links are now live across the corporate website.',
      });
    } catch (err: any) {
      setFeedback({ type: 'err', text: err?.message || 'Failed to publish settings.' });
    } finally {
      setPublishing(false);
    }
  };

  const handleUnpublish = async () => {
    setPublishing(true);
    setFeedback(null);
    try {
      await adminApi.unpublishCompanySection('contact');
      await loadSettings();
      await refreshPublicCms();
      setFeedback({
        type: 'ok',
        text: 'Custom website settings unpublished (reverted to default corporate details).',
      });
    } catch (err: any) {
      setFeedback({ type: 'err', text: err?.message || 'Failed to unpublish settings.' });
    } finally {
      setPublishing(false);
      setConfirmUnpublish(false);
    }
  };

  return (
    <div className="space-y-6">
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

      {loading ? (
        <div className="h-72 animate-pulse rounded-xl border border-slate-200 bg-white" />
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white">
          <div className="flex flex-col justify-between gap-4 border-b border-slate-200 px-6 py-4 md:flex-row md:items-center">
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-base font-semibold text-[#092F35]">
                  Official Contact, Support Email & Social Links
                </h2>
                {contactSection && <StatusBadge status={contactSection.status} />}
              </div>
              <p className="mt-1 text-xs text-slate-500 tabular-nums">
                Last updated: {formatAdminDate(contactSection?.updatedAt)} · Published:{' '}
                {formatAdminDate(contactSection?.publishedAt)}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
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
                onClick={handleSaveDraft}
                disabled={saving || publishing}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#0F4C5C] bg-white px-3.5 py-2 text-xs font-semibold text-[#0F4C5C] hover:bg-slate-50 disabled:opacity-50"
              >
                <Save className="h-3.5 w-3.5" />
                <span>{saving ? 'Saving...' : 'Save Draft'}</span>
              </button>
              <button
                type="button"
                onClick={handlePublish}
                disabled={saving || publishing}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#0F8A5F] px-4 py-2 text-xs font-semibold text-white hover:bg-[#0B5D4B] disabled:opacity-50"
              >
                <UploadCloud className="h-3.5 w-3.5" />
                <span>{publishing ? 'Publishing...' : 'Publish Live'}</span>
              </button>
              {contactSection?.status === 'published' && (
                <button
                  type="button"
                  onClick={() => setConfirmUnpublish(true)}
                  disabled={saving || publishing}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-amber-300 bg-amber-50 px-3.5 py-2 text-xs font-medium text-amber-900 hover:bg-amber-100 disabled:opacity-50"
                >
                  <Globe className="h-3.5 w-3.5" />
                  <span>Unpublish</span>
                </button>
              )}
            </div>
          </div>

          <div className="space-y-6 p-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="block text-xs font-medium text-slate-700">
                  Corporate Entity Name
                </label>
                <input
                  type="text"
                  value={contactDraft.companyName}
                  onChange={(e) =>
                    setContactDraft({ ...contactDraft, companyName: e.target.value })
                  }
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700">
                  <MapPin className="mr-1 inline h-3.5 w-3.5 text-[#0F8A5F]" />
                  Headquarters Location
                </label>
                <input
                  type="text"
                  value={contactDraft.location}
                  onChange={(e) =>
                    setContactDraft({ ...contactDraft, location: e.target.value })
                  }
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700">
                  <Mail className="mr-1 inline h-3.5 w-3.5 text-[#0F8A5F]" />
                  Primary Official Support Email
                </label>
                <input
                  type="email"
                  value={contactDraft.supportEmail}
                  onChange={(e) =>
                    setContactDraft({ ...contactDraft, supportEmail: e.target.value })
                  }
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700">
                  <Mail className="mr-1 inline h-3.5 w-3.5 text-[#0F8A5F]" />
                  Secondary Official Support Email
                </label>
                <input
                  type="email"
                  value={contactDraft.secondarySupportEmail}
                  onChange={(e) =>
                    setContactDraft({ ...contactDraft, secondarySupportEmail: e.target.value })
                  }
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-slate-700">
                  <Globe className="mr-1 inline h-3.5 w-3.5 text-[#0F8A5F]" />
                  Official MAATA India Application URL (Separate Product)
                </label>
                <input
                  type="url"
                  value={contactDraft.appUrl}
                  onChange={(e) =>
                    setContactDraft({ ...contactDraft, appUrl: e.target.value })
                  }
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm"
                />
              </div>
            </div>

            <div className="border-t border-slate-200 pt-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Share2 className="h-4 w-4 text-[#0F8A5F]" />
                  <h3 className="text-sm font-semibold text-[#092F35]">
                    Official Social Media Links
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setContactDraft({
                      ...contactDraft,
                      socialLinks: [
                        ...contactDraft.socialLinks,
                        { label: '', handle: '', href: 'https://' },
                      ],
                    })
                  }
                  className="inline-flex items-center gap-1 rounded-lg border border-[#0F8A5F] px-3 py-1.5 text-xs font-semibold text-[#0F8A5F] hover:bg-emerald-50"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Add Channel</span>
                </button>
              </div>

              <div className="mt-3 space-y-2.5">
                {contactDraft.socialLinks.map((item, idx) => (
                  <div
                    key={idx}
                    className="grid grid-cols-1 gap-2 rounded-lg border border-slate-200 bg-slate-50/50 p-3 md:grid-cols-12"
                  >
                    <input
                      type="text"
                      placeholder="Platform (e.g. LinkedIn)"
                      value={item.label}
                      onChange={(e) => {
                        const next = [...contactDraft.socialLinks];
                        next[idx] = { ...item, label: e.target.value };
                        setContactDraft({ ...contactDraft, socialLinks: next });
                      }}
                      className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm md:col-span-3"
                    />
                    <input
                      type="text"
                      placeholder="Handle / Display Name"
                      value={item.handle}
                      onChange={(e) => {
                        const next = [...contactDraft.socialLinks];
                        next[idx] = { ...item, handle: e.target.value };
                        setContactDraft({ ...contactDraft, socialLinks: next });
                      }}
                      className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm md:col-span-3"
                    />
                    <input
                      type="url"
                      placeholder="https://..."
                      value={item.href}
                      onChange={(e) => {
                        const next = [...contactDraft.socialLinks];
                        next[idx] = { ...item, href: e.target.value };
                        setContactDraft({ ...contactDraft, socialLinks: next });
                      }}
                      className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm md:col-span-5"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setContactDraft({
                          ...contactDraft,
                          socialLinks: contactDraft.socialLinks.filter((_, i) => i !== idx),
                        })
                      }
                      className="rounded-lg border border-slate-200 bg-white p-2 text-slate-500 hover:bg-rose-50 hover:text-rose-700 md:col-span-1"
                      aria-label="Remove social link"
                    >
                      <Trash2 className="mx-auto h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <PreviewModal
        open={previewOpen}
        title="Website Settings & Footer Preview"
        subtitle="Preview how official contact details and social channels appear on the public corporate website"
        onClose={() => setPreviewOpen(false)}
      >
        <div className="space-y-4 rounded-xl bg-[#092F35] p-6 text-[#F7F4EC]">
          <p className="text-sm font-semibold text-[#FFD84A]">{contactDraft.companyName}</p>
          <p className="text-sm">{contactDraft.location}</p>
          <p className="text-sm">Primary Email: {contactDraft.supportEmail}</p>
          <p className="text-sm">Secondary Email: {contactDraft.secondarySupportEmail}</p>
          <p className="text-sm">Official Product App: {contactDraft.appUrl}</p>
          <div className="flex flex-wrap gap-3 pt-2 text-xs text-[#FFD84A]">
            {contactDraft.socialLinks.map((s, idx) => (
              <span key={idx} className="rounded border border-white/20 px-2.5 py-1">
                {s.label} ({s.handle})
              </span>
            ))}
          </div>
        </div>
      </PreviewModal>

      <ConfirmModal
        open={confirmUnpublish}
        title="Unpublish Custom Website Settings?"
        description="The public footer and contact page will revert to default corporate contact details until you publish again."
        confirmLabel="Unpublish"
        loading={publishing}
        onConfirm={handleUnpublish}
        onCancel={() => setConfirmUnpublish(false)}
      />
    </div>
  );
};
