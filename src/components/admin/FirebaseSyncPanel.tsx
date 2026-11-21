import React, { useState } from 'react';
import { Cloud, LogIn, LogOut, RefreshCw, ShieldCheck } from 'lucide-react';
import { useFirebase } from '../../context/FirebaseContext';
import { adminApi } from '../../services/cmsApi';
import { leadershipApi } from '../../services/leadershipApi';
import { formatAdminDate } from './AdminUi';

interface FirebaseSyncPanelProps {
  mode: 'cms' | 'leadership';
  canWriteWorkItems?: boolean;
}

export const FirebaseSyncPanel: React.FC<FirebaseSyncPanelProps> = ({
  mode,
  canWriteWorkItems = false,
}) => {
  const {
    firebaseUser,
    authReady,
    adminRecord,
    isBootstrapAdmin,
    syncSummary,
    syncing,
    lastSyncedAt,
    firebaseError,
    signInWithGoogle,
    signOutFirebase,
    ensureAdminProfile,
    syncCmsToFirestore,
    syncLeadershipToFirestore,
    refreshCounts,
    clearFirebaseError,
  } = useFirebase();

  const [localMsg, setLocalMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [authBusy, setAuthBusy] = useState(false);

  const hasFirestoreAccess =
    Boolean(firebaseUser?.emailVerified) && (isBootstrapAdmin || Boolean(adminRecord?.isActive));

  const handleGoogleConnect = async () => {
    setAuthBusy(true);
    setLocalMsg(null);
    clearFirebaseError();
    try {
      await signInWithGoogle();
      await ensureAdminProfile();
      await refreshCounts();
      setLocalMsg({
        type: 'ok',
        text: 'Google account verified for Firebase Cloud Firestore.',
      });
    } catch (err: any) {
      setLocalMsg({
        type: 'err',
        text: err?.message || 'Unable to connect Google account.',
      });
    } finally {
      setAuthBusy(false);
    }
  };

  const handleDisconnect = async () => {
    setAuthBusy(true);
    setLocalMsg(null);
    try {
      await signOutFirebase();
      setLocalMsg({ type: 'ok', text: 'Disconnected Firebase Google session.' });
    } finally {
      setAuthBusy(false);
    }
  };

  const handleSync = async () => {
    setLocalMsg(null);
    clearFirebaseError();
    try {
      if (mode === 'cms') {
        const [secRes, artRes, annRes, medRes] = await Promise.all([
          adminApi.getCompanySections(),
          adminApi.getArticles({ page: 1 }),
          adminApi.getAnnouncements(),
          adminApi.getMedia(),
        ]);
        const result = await syncCmsToFirestore({
          sections: secRes.sections,
          articles: artRes.items,
          announcements: annRes.items,
          media: medRes.items,
        });
        setLocalMsg({
          type: 'ok',
          text: `Synced ${result.syncedCount} CMS records to Cloud Firestore.`,
        });
      } else {
        const [prodRes, mktRes, qaRes, repRes, docRes] = await Promise.all([
          leadershipApi.getWorkItems('product'),
          leadershipApi.getWorkItems('marketing'),
          leadershipApi.getWorkItems('testing'),
          leadershipApi.getReports(),
          leadershipApi.getDocuments(),
        ]);
        const result = await syncLeadershipToFirestore({
          workItems: [...prodRes.items, ...mktRes.items, ...qaRes.items],
          reports: repRes.items,
          documents: docRes.items,
          canWriteWorkItems,
        });
        setLocalMsg({
          type: 'ok',
          text: `Synced ${result.syncedCount} confidential leadership records to Cloud Firestore.`,
        });
      }
    } catch (err: any) {
      setLocalMsg({
        type: 'err',
        text: err?.message || 'Cloud Firestore sync failed.',
      });
    }
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6">
      <div className="flex flex-col justify-between gap-4 border-b border-slate-100 pb-4 md:flex-row md:items-center">
        <div>
          <div className="flex items-center gap-2">
            <Cloud className="h-4 w-4 text-[#0F8A5F]" aria-hidden="true" />
            <h2 className="text-sm font-semibold text-[#092F35]">
              Cloud Persistence (Firebase Firestore)
            </h2>
          </div>
          <p className="mt-1 text-xs text-slate-600">
            {mode === 'cms'
              ? 'Verify with Google Authentication to back up corporate sections, articles, announcements, and media metadata to Cloud Firestore.'
              : 'Verify with Google Authentication to synchronize confidential executive reports, documents, and roadmap records to Cloud Firestore.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {!authReady ? (
            <span className="text-xs text-slate-500">Checking Firebase session...</span>
          ) : firebaseUser ? (
            <>
              <button
                type="button"
                onClick={handleSync}
                disabled={syncing || !hasFirestoreAccess}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#0F8A5F] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#0B5D4B] disabled:opacity-50"
              >
                <RefreshCw
                  className={`h-3.5 w-3.5 ${syncing ? 'animate-spin' : ''}`}
                  aria-hidden="true"
                />
                <span>
                  {syncing
                    ? 'Syncing...'
                    : mode === 'cms'
                    ? 'Sync CMS to Firestore'
                    : 'Sync Leadership to Firestore'}
                </span>
              </button>
              <button
                type="button"
                onClick={handleDisconnect}
                disabled={authBusy || syncing}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Disconnect Google</span>
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={handleGoogleConnect}
              disabled={authBusy}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#092F35] px-4 py-2 text-xs font-semibold text-white hover:bg-[#0F4C5C] disabled:opacity-50"
            >
              <LogIn className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{authBusy ? 'Connecting...' : 'Verify Google Account'}</span>
            </button>
          )}
        </div>
      </div>

      {(localMsg || firebaseError) && (
        <div
          className={`mt-4 rounded-lg border px-3.5 py-2.5 text-xs ${
            localMsg?.type === 'ok' && !firebaseError
              ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
              : 'border-rose-200 bg-rose-50 text-rose-800'
          }`}
        >
          {firebaseError || localMsg?.text}
        </div>
      )}

      {firebaseUser && (
        <div className="mt-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50/70 px-4 py-2.5 text-xs">
            <div className="flex items-center gap-2 text-slate-700">
              <ShieldCheck className="h-4 w-4 text-[#0F8A5F]" aria-hidden="true" />
              <span>
                Signed in as <strong className="text-[#092F35]">{firebaseUser.email}</strong>
              </span>
              <span className="text-slate-400">·</span>
              <span>
                {isBootstrapAdmin
                  ? 'Super Admin (Verified)'
                  : adminRecord?.isActive
                  ? `Active (${adminRecord.role.replace(/_/g, ' ')})`
                  : 'Awaiting Firestore Admin Authorization'}
              </span>
            </div>
            {lastSyncedAt && (
              <span className="text-slate-500 tabular-nums">
                Last synced: {formatAdminDate(lastSyncedAt)}
              </span>
            )}
          </div>

          {hasFirestoreAccess && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {mode === 'cms' ? (
                <>
                  <div className="rounded-lg border border-slate-200 px-3 py-2.5">
                    <p className="text-[11px] text-slate-500">Company Sections</p>
                    <p className="mt-0.5 text-base font-semibold text-[#092F35] tabular-nums">
                      {syncSummary.companySections}
                    </p>
                  </div>
                  <div className="rounded-lg border border-slate-200 px-3 py-2.5">
                    <p className="text-[11px] text-slate-500">Newsroom Articles</p>
                    <p className="mt-0.5 text-base font-semibold text-[#092F35] tabular-nums">
                      {syncSummary.articles}
                    </p>
                  </div>
                  <div className="rounded-lg border border-slate-200 px-3 py-2.5">
                    <p className="text-[11px] text-slate-500">Announcements</p>
                    <p className="mt-0.5 text-base font-semibold text-[#092F35] tabular-nums">
                      {syncSummary.announcements}
                    </p>
                  </div>
                  <div className="rounded-lg border border-slate-200 px-3 py-2.5">
                    <p className="text-[11px] text-slate-500">Media Metadata</p>
                    <p className="mt-0.5 text-base font-semibold text-[#092F35] tabular-nums">
                      {syncSummary.mediaAssets}
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="rounded-lg border border-slate-200 px-3 py-2.5">
                    <p className="text-[11px] text-slate-500">Work Items</p>
                    <p className="mt-0.5 text-base font-semibold text-[#092F35] tabular-nums">
                      {syncSummary.leadershipWorkItems}
                    </p>
                  </div>
                  <div className="rounded-lg border border-slate-200 px-3 py-2.5">
                    <p className="text-[11px] text-slate-500">Executive Reports</p>
                    <p className="mt-0.5 text-base font-semibold text-[#092F35] tabular-nums">
                      {syncSummary.leadershipReports}
                    </p>
                  </div>
                  <div className="rounded-lg border border-slate-200 px-3 py-2.5">
                    <p className="text-[11px] text-slate-500">Governance Docs</p>
                    <p className="mt-0.5 text-base font-semibold text-[#092F35] tabular-nums">
                      {syncSummary.leadershipDocuments}
                    </p>
                  </div>
                  <div className="rounded-lg border border-slate-200 px-3 py-2.5">
                    <p className="text-[11px] text-slate-500">Write Scope</p>
                    <p className="mt-0.5 text-xs font-semibold text-[#092F35]">
                      {canWriteWorkItems ? 'Full Executive Sync' : 'Reports & Docs'}
                    </p>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
