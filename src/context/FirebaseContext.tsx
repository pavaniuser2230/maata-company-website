import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  type User as FirebaseUser,
} from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import {
  OperationType,
  auth,
  db,
  googleProvider,
  handleFirestoreError,
} from '../lib/firebase';
import type {
  AdminRole,
  CmsAnnouncement,
  CmsArticle,
  CmsMediaAsset,
  CompanySectionRecord,
  LeadershipRole,
} from '../services/cmsApi';
import type {
  LeadershipDocument,
  LeadershipReport,
  LeadershipWorkItem,
} from '../services/leadershipApi';

export interface FirebaseAdminRecord {
  uid: string;
  name: string;
  email: string;
  role: AdminRole;
  leadershipRole: LeadershipRole;
  isActive: boolean;
}

export interface FirestoreSyncSummary {
  companySections: number;
  articles: number;
  announcements: number;
  mediaAssets: number;
  leadershipWorkItems: number;
  leadershipReports: number;
  leadershipDocuments: number;
}

interface FirebaseContextValue {
  firebaseUser: FirebaseUser | null;
  authReady: boolean;
  adminRecord: FirebaseAdminRecord | null;
  isBootstrapAdmin: boolean;
  syncSummary: FirestoreSyncSummary;
  syncing: boolean;
  lastSyncedAt: string | null;
  firebaseError: string | null;
  signInWithGoogle: () => Promise<FirebaseUser>;
  signOutFirebase: () => Promise<void>;
  ensureAdminProfile: (params?: {
    name?: string;
    role?: AdminRole;
    leadershipRole?: LeadershipRole;
  }) => Promise<FirebaseAdminRecord | null>;
  syncCmsToFirestore: (payload: {
    sections: CompanySectionRecord[];
    articles: CmsArticle[];
    announcements: CmsAnnouncement[];
    media: CmsMediaAsset[];
  }) => Promise<{ syncedCount: number }>;
  syncLeadershipToFirestore: (payload: {
    workItems: LeadershipWorkItem[];
    reports: LeadershipReport[];
    documents: LeadershipDocument[];
    canWriteWorkItems: boolean;
  }) => Promise<{ syncedCount: number }>;
  refreshCounts: () => Promise<void>;
  clearFirebaseError: () => void;
}

const BOOTSTRAP_ADMIN_EMAIL = 'gurrampavani2006@gmail.com';

const EMPTY_COUNTS: FirestoreSyncSummary = {
  companySections: 0,
  articles: 0,
  announcements: 0,
  mediaAssets: 0,
  leadershipWorkItems: 0,
  leadershipReports: 0,
  leadershipDocuments: 0,
};

const FirebaseContext = createContext<FirebaseContextValue | undefined>(undefined);

function toValidId(raw: string, fallbackPrefix: string): string {
  const cleaned = (raw || '')
    .trim()
    .replace(/[^a-zA-Z0-9_-]/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 120);
  return cleaned.length >= 1 ? cleaned : `${fallbackPrefix}-${Date.now()}`;
}

function clampStr(raw: unknown, minLen: number, maxLen: number, fallback: string): string {
  const s = typeof raw === 'string' ? raw.trim() : '';
  if (s.length < minLen) {
    return fallback.slice(0, maxLen);
  }
  return s.slice(0, maxLen);
}

function clampOptStr(raw: unknown, maxLen: number): string | undefined {
  if (typeof raw !== 'string') return undefined;
  const s = raw.trim();
  if (!s) return undefined;
  return s.slice(0, maxLen);
}

function sanitizeSlug(raw: string, fallbackId: string): string {
  const cleaned = (raw || fallbackId)
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 200);
  return cleaned.length >= 2 ? cleaned : `article-${fallbackId.toLowerCase().slice(0, 40)}`;
}

function sanitizeContentMap(raw: unknown): Record<string, unknown> {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { empty: true };
  }
  const out: Record<string, unknown> = {};
  const entries = Object.entries(raw as Record<string, unknown>).slice(0, 45);
  for (const [key, value] of entries) {
    if (!key || value === undefined) continue;
    if (
      typeof value === 'string' ||
      typeof value === 'number' ||
      typeof value === 'boolean' ||
      value === null
    ) {
      out[key.slice(0, 80)] = typeof value === 'string' ? value.slice(0, 8000) : value;
    } else if (Array.isArray(value)) {
      out[key.slice(0, 80)] = value.slice(0, 25).map((item) =>
        item && typeof item === 'object'
          ? JSON.parse(JSON.stringify(item))
          : item ?? null
      );
    } else if (typeof value === 'object') {
      out[key.slice(0, 80)] = JSON.parse(JSON.stringify(value));
    }
  }
  return out;
}

function sanitizeTags(tags: unknown): string[] {
  if (!Array.isArray(tags)) return [];
  return tags
    .filter((t): t is string => typeof t === 'string' && t.trim().length > 0)
    .map((t) => t.trim().slice(0, 80))
    .slice(0, 10);
}

const VALID_SECTION_KEYS = new Set([
  'about',
  'story',
  'founders',
  'vision_mission',
  'journey',
  'careers',
  'contact',
]);

export const FirebaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [adminRecord, setAdminRecord] = useState<FirebaseAdminRecord | null>(null);
  const [syncSummary, setSyncSummary] = useState<FirestoreSyncSummary>(EMPTY_COUNTS);
  const [syncing, setSyncing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [firebaseError, setFirebaseError] = useState<string | null>(null);

  const isBootstrapAdmin =
    Boolean(firebaseUser?.emailVerified) &&
    firebaseUser?.email?.toLowerCase() === BOOTSTRAP_ADMIN_EMAIL;

  const clearFirebaseError = useCallback(() => setFirebaseError(null), []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      setAuthReady(true);
      if (!user) {
        setAdminRecord(null);
        setSyncSummary(EMPTY_COUNTS);
      }
    });
    return () => unsub();
  }, []);

  // Subscribe to the signed-in user's admin directory doc only when authReady && firebaseUser
  useEffect(() => {
    if (!authReady || !firebaseUser || !firebaseUser.emailVerified) {
      return;
    }

    const adminPath = `admins/${firebaseUser.uid}`;
    const adminRef = doc(db, 'admins', firebaseUser.uid);

    const unsub = onSnapshot(
      adminRef,
      (snap) => {
        if (snap.exists()) {
          const data = snap.data() as FirebaseAdminRecord;
          setAdminRecord(data);
        } else {
          setAdminRecord(null);
        }
      },
      (err) => {
        try {
          handleFirestoreError(err, OperationType.GET, adminPath);
        } catch (wrapped) {
          setFirebaseError(wrapped instanceof Error ? wrapped.message : String(wrapped));
        }
      }
    );

    return () => unsub();
  }, [authReady, firebaseUser]);

  const refreshCounts = useCallback(async () => {
    if (!authReady || !firebaseUser || !firebaseUser.emailVerified) return;

    const countCollection = async (colName: string): Promise<number> => {
      try {
        const snap = await getDocs(collection(db, colName));
        return snap.size;
      } catch (err) {
        // Ignore if this signed-in user lacks permission on a restricted collection
        const msg = err instanceof Error ? err.message : String(err);
        if (msg.toLowerCase().includes('permission') || msg.toLowerCase().includes('insufficient')) {
          return 0;
        }
        handleFirestoreError(err, OperationType.LIST, colName);
      }
    };

    const [
      companySections,
      articles,
      announcements,
      mediaAssets,
      leadershipWorkItems,
      leadershipReports,
      leadershipDocuments,
    ] = await Promise.all([
      countCollection('companySections'),
      countCollection('articles'),
      countCollection('announcements'),
      countCollection('mediaAssets'),
      countCollection('leadershipWorkItems'),
      countCollection('leadershipReports'),
      countCollection('leadershipDocuments'),
    ]);

    setSyncSummary({
      companySections,
      articles,
      announcements,
      mediaAssets,
      leadershipWorkItems,
      leadershipReports,
      leadershipDocuments,
    });
  }, [authReady, firebaseUser]);

  useEffect(() => {
    if (authReady && firebaseUser && (isBootstrapAdmin || adminRecord?.isActive)) {
      void refreshCounts();
    }
  }, [authReady, firebaseUser, isBootstrapAdmin, adminRecord?.isActive, refreshCounts]);

  const signInWithGoogle = useCallback(async (): Promise<FirebaseUser> => {
    setFirebaseError(null);
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      return cred.user;
    } catch (err: any) {
      const msg = err?.message || 'Google authentication was cancelled or failed.';
      setFirebaseError(msg);
      throw err;
    }
  }, []);

  const signOutFirebase = useCallback(async () => {
    setFirebaseError(null);
    await signOut(auth);
  }, []);

  const ensureAdminProfile = useCallback(
    async (params?: {
      name?: string;
      role?: AdminRole;
      leadershipRole?: LeadershipRole;
    }): Promise<FirebaseAdminRecord | null> => {
      if (!firebaseUser || !firebaseUser.email || !firebaseUser.emailVerified) {
        return null;
      }
      const uid = toValidId(firebaseUser.uid, 'admin');
      const path = `admins/${uid}`;
      const ref = doc(db, 'admins', uid);

      try {
        const snap = await getDoc(ref);
        if (!snap.exists()) {
          if (firebaseUser.email.toLowerCase() !== BOOTSTRAP_ADMIN_EMAIL) {
            return null;
          }
          const payload = {
            uid,
            name: clampStr(params?.name || firebaseUser.displayName, 2, 120, 'G. Pavani'),
            email: clampStr(firebaseUser.email, 5, 160, BOOTSTRAP_ADMIN_EMAIL),
            role: params?.role || 'super_admin',
            leadershipRole: params?.leadershipRole || 'ceo',
            isActive: true,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          };
          await setDoc(ref, payload);
          return {
            uid: payload.uid,
            name: payload.name,
            email: payload.email,
            role: payload.role,
            leadershipRole: payload.leadershipRole,
            isActive: payload.isActive,
          };
        }
        return snap.data() as FirebaseAdminRecord;
      } catch (err) {
        try {
          handleFirestoreError(err, OperationType.WRITE, path);
        } catch (wrapped) {
          setFirebaseError(wrapped instanceof Error ? wrapped.message : String(wrapped));
          throw wrapped;
        }
      }
    },
    [firebaseUser]
  );

  const writeAuditLog = useCallback(
    async (action: string, resourceType: string, resourceId: string) => {
      if (!firebaseUser || !firebaseUser.email || !firebaseUser.emailVerified) return;
      const logId = toValidId(`log-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, 'log');
      const path = `auditLogs/${logId}`;
      try {
        await setDoc(doc(db, 'auditLogs', logId), {
          id: logId,
          actorUid: toValidId(firebaseUser.uid, 'uid'),
          actorEmail: clampStr(firebaseUser.email, 5, 160, 'admin@maataapp.com'),
          action: clampStr(action, 2, 100, 'firestore_sync'),
          resourceType: clampStr(resourceType, 2, 80, 'cms'),
          resourceId: resourceId.slice(0, 128),
          createdAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, path);
      }
    },
    [firebaseUser]
  );

  const syncCmsToFirestore = useCallback(
    async (payload: {
      sections: CompanySectionRecord[];
      articles: CmsArticle[];
      announcements: CmsAnnouncement[];
      media: CmsMediaAsset[];
    }): Promise<{ syncedCount: number }> => {
      if (!firebaseUser || !firebaseUser.emailVerified) {
        throw new Error('Please connect a verified Google account first.');
      }
      setSyncing(true);
      setFirebaseError(null);
      let syncedCount = 0;

      try {
        await ensureAdminProfile();
        const ownerId = toValidId(firebaseUser.uid, 'owner');

        for (const section of payload.sections) {
          if (!VALID_SECTION_KEYS.has(section.sectionKey)) continue;
          const path = `companySections/${section.sectionKey}`;
          const ref = doc(db, 'companySections', section.sectionKey);
          try {
            const snap = await getDoc(ref);
            const title = clampStr(section.title, 2, 160, section.sectionKey);
            const status = section.status === 'published' ? 'published' : 'draft';
            const content = sanitizeContentMap(
              section.status === 'published' && section.publishedData
                ? section.publishedData
                : section.draftData
            );
            if (!snap.exists()) {
              await setDoc(ref, {
                sectionKey: section.sectionKey,
                title,
                status,
                content,
                ownerId,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
              });
            } else {
              await updateDoc(ref, {
                title,
                status,
                content,
                updatedAt: serverTimestamp(),
              });
            }
            syncedCount += 1;
          } catch (err) {
            handleFirestoreError(err, OperationType.WRITE, path);
          }
        }

        for (const article of payload.articles) {
          const id = toValidId(article.id, 'article');
          const path = `articles/${id}`;
          const ref = doc(db, 'articles', id);
          try {
            const snap = await getDoc(ref);
            const coverImageUrl = clampOptStr(article.cover_image_url, 500);
            const baseFields: Record<string, unknown> = {
              title: clampStr(article.title, 3, 220, 'MAATA Update'),
              slug: sanitizeSlug(article.slug, id),
              shortSummary: clampStr(
                article.short_summary,
                10,
                600,
                'MAATA Technologies corporate update summary.'
              ),
              content: clampStr(
                article.content,
                10,
                40000,
                'MAATA Technologies official article body.'
              ),
              author: clampStr(article.author, 2, 120, 'MAATA Editorial'),
              category: article.category,
              tags: sanitizeTags(article.tags),
              status: article.status,
              updatedAt: serverTimestamp(),
            };
            if (coverImageUrl !== undefined) {
              baseFields.coverImageUrl = coverImageUrl;
            }
            if (!snap.exists()) {
              await setDoc(ref, {
                id,
                ...baseFields,
                ownerId,
                createdAt: serverTimestamp(),
              });
            } else {
              await updateDoc(ref, baseFields);
            }
            syncedCount += 1;
          } catch (err) {
            handleFirestoreError(err, OperationType.WRITE, path);
          }
        }

        for (const item of payload.announcements) {
          const id = toValidId(item.id, 'ann');
          const path = `announcements/${id}`;
          const ref = doc(db, 'announcements', id);
          try {
            const snap = await getDoc(ref);
            const body = clampOptStr(item.body, 8000);
            const baseFields: Record<string, unknown> = {
              kind: item.kind,
              title: clampStr(item.title, 3, 200, 'MAATA Announcement'),
              summary: clampStr(item.summary, 5, 600, 'Official corporate update.'),
              visibility: item.visibility === 'hidden' ? 'hidden' : 'public',
              status: item.status,
              isPinned: Boolean(item.is_pinned),
              showAsBanner: Boolean(item.show_as_banner),
              updatedAt: serverTimestamp(),
            };
            if (body !== undefined) {
              baseFields.body = body;
            }
            if (!snap.exists()) {
              await setDoc(ref, {
                id,
                ...baseFields,
                ownerId,
                createdAt: serverTimestamp(),
              });
            } else {
              await updateDoc(ref, baseFields);
            }
            syncedCount += 1;
          } catch (err) {
            handleFirestoreError(err, OperationType.WRITE, path);
          }
        }

        for (const asset of payload.media) {
          const id = toValidId(asset.id, 'media');
          const path = `mediaAssets/${id}`;
          const ref = doc(db, 'mediaAssets', id);
          try {
            const snap = await getDoc(ref);
            const caption = clampOptStr(asset.caption, 300);
            const focalPosition = clampOptStr(asset.focal_position, 40);
            const displayOrder =
              typeof asset.display_order === 'number' &&
              asset.display_order >= 0 &&
              asset.display_order <= 9999
                ? asset.display_order
                : undefined;

            const updateFields: Record<string, unknown> = {
              filename: clampStr(asset.filename, 1, 200, 'asset.png'),
              url: clampStr(asset.url, 1, 500, '/favicon.ico'),
              category: asset.category,
              altText: clampStr(asset.alt_text, 2, 250, 'MAATA Brand Asset'),
              isPublic: true,
              updatedAt: serverTimestamp(),
            };
            if (caption !== undefined) updateFields.caption = caption;
            if (focalPosition !== undefined) updateFields.focalPosition = focalPosition;
            if (displayOrder !== undefined) updateFields.displayOrder = displayOrder;

            if (!snap.exists()) {
              await setDoc(ref, {
                id,
                ...updateFields,
                isProtected: Boolean(asset.is_protected),
                ownerId,
                createdAt: serverTimestamp(),
              });
            } else {
              await updateDoc(ref, updateFields);
            }
            syncedCount += 1;
          } catch (err) {
            handleFirestoreError(err, OperationType.WRITE, path);
          }
        }

        await writeAuditLog('cms_firestore_sync', 'cms_bundle', `count_${syncedCount}`);
        setLastSyncedAt(new Date().toISOString());
        await refreshCounts();
        return { syncedCount };
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        setFirebaseError(msg);
        throw err;
      } finally {
        setSyncing(false);
      }
    },
    [ensureAdminProfile, firebaseUser, refreshCounts, writeAuditLog]
  );

  const syncLeadershipToFirestore = useCallback(
    async (payload: {
      workItems: LeadershipWorkItem[];
      reports: LeadershipReport[];
      documents: LeadershipDocument[];
      canWriteWorkItems: boolean;
    }): Promise<{ syncedCount: number }> => {
      if (!firebaseUser || !firebaseUser.emailVerified) {
        throw new Error('Please connect a verified Google account first.');
      }
      setSyncing(true);
      setFirebaseError(null);
      let syncedCount = 0;

      try {
        await ensureAdminProfile();
        const ownerId = toValidId(firebaseUser.uid, 'owner');

        if (payload.canWriteWorkItems) {
          for (const item of payload.workItems) {
            const id = toValidId(item.id, 'work');
            const path = `leadershipWorkItems/${id}`;
            const ref = doc(db, 'leadershipWorkItems', id);
            try {
              const snap = await getDoc(ref);
              const category = clampOptStr(item.category, 100);
              const summary = clampOptStr(item.summary, 2000);
              const ownerName = clampOptStr(item.owner_name, 120);
              const progressPct = Math.min(100, Math.max(0, Number(item.progress_pct) || 0));
              const updateFields: Record<string, unknown> = {
                domain: item.domain,
                title: clampStr(item.title, 3, 200, 'Work Item'),
                priority: item.priority,
                status: item.status,
                progressPct,
                updatedAt: serverTimestamp(),
              };
              if (category !== undefined) updateFields.category = category;
              if (summary !== undefined) updateFields.summary = summary;
              if (ownerName !== undefined) updateFields.ownerName = ownerName;

              if (!snap.exists()) {
                await setDoc(ref, {
                  id,
                  ...updateFields,
                  ownerId,
                  createdAt: serverTimestamp(),
                });
              } else {
                await updateDoc(ref, updateFields);
              }
              syncedCount += 1;
            } catch (err) {
              handleFirestoreError(err, OperationType.WRITE, path);
            }
          }
        }

        for (const report of payload.reports) {
          const id = toValidId(report.id, 'rep');
          const path = `leadershipReports/${id}`;
          const ref = doc(db, 'leadershipReports', id);
          try {
            const snap = await getDoc(ref);
            const periodLabel = clampOptStr(report.period_label, 80);
            const updateFields: Record<string, unknown> = {
              title: clampStr(report.title, 3, 200, 'Executive Report'),
              reportType: report.report_type,
              summary: clampStr(report.summary, 5, 5000, 'Executive summary report.'),
              authorName: clampStr(report.author_name, 2, 120, 'MAATA Leadership'),
              status: report.status === 'final' ? 'final' : 'draft',
              updatedAt: serverTimestamp(),
            };
            if (periodLabel !== undefined) updateFields.periodLabel = periodLabel;

            if (!snap.exists()) {
              await setDoc(ref, {
                id,
                ...updateFields,
                ownerId,
                createdAt: serverTimestamp(),
              });
            } else {
              await updateDoc(ref, updateFields);
            }
            syncedCount += 1;
          } catch (err) {
            handleFirestoreError(err, OperationType.WRITE, path);
          }
        }

        for (const docItem of payload.documents) {
          const id = toValidId(docItem.id, 'ldoc');
          const path = `leadershipDocuments/${id}`;
          const ref = doc(db, 'leadershipDocuments', id);
          try {
            const snap = await getDoc(ref);
            const summary = clampOptStr(docItem.summary, 1000);
            const content = clampOptStr(docItem.content, 25000);
            const updateFields: Record<string, unknown> = {
              title: clampStr(docItem.title, 3, 200, 'Leadership Document'),
              category: docItem.category,
              classification:
                docItem.classification === 'executive_confidential'
                  ? 'executive_confidential'
                  : 'leadership_only',
              updatedAt: serverTimestamp(),
            };
            if (summary !== undefined) updateFields.summary = summary;
            if (content !== undefined) updateFields.content = content;

            if (!snap.exists()) {
              await setDoc(ref, {
                id,
                ...updateFields,
                ownerId,
                createdAt: serverTimestamp(),
              });
            } else {
              await updateDoc(ref, updateFields);
            }
            syncedCount += 1;
          } catch (err) {
            handleFirestoreError(err, OperationType.WRITE, path);
          }
        }

        await writeAuditLog('leadership_firestore_sync', 'leadership_bundle', `count_${syncedCount}`);
        setLastSyncedAt(new Date().toISOString());
        await refreshCounts();
        return { syncedCount };
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        setFirebaseError(msg);
        throw err;
      } finally {
        setSyncing(false);
      }
    },
    [ensureAdminProfile, firebaseUser, refreshCounts, writeAuditLog]
  );

  return (
    <FirebaseContext.Provider
      value={{
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
      }}
    >
      {children}
    </FirebaseContext.Provider>
  );
};

export function useFirebase() {
  const ctx = useContext(FirebaseContext);
  if (!ctx) {
    throw new Error('useFirebase must be used within FirebaseProvider');
  }
  return ctx;
}
