export type AdminRole =
  | 'super_admin'
  | 'founder'
  | 'ceo'
  | 'content_manager'
  | 'support_manager';

export type LeadershipRole = 'founder' | 'ceo' | 'none';

export type PermissionKey =
  | 'leadership.overview'
  | 'leadership.product.read'
  | 'leadership.product.write'
  | 'leadership.marketing.read'
  | 'leadership.marketing.write'
  | 'leadership.testing.read'
  | 'leadership.testing.write'
  | 'leadership.reports.read'
  | 'leadership.reports.write'
  | 'leadership.documents.read'
  | 'leadership.documents.write'
  | 'leadership.publishing'
  | 'leadership.enquiries'
  | 'leadership.settings.security'
  | 'system.admin';

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  leadershipRole?: LeadershipRole;
  leadership_role?: LeadershipRole;
  mfaEnabled?: boolean;
  mfa_enabled?: number;
  permissions?: PermissionKey[];
  is_active?: number;
  last_login_at?: string | null;
  created_at?: string;
}

export interface CmsArticle {
  id: string;
  title: string;
  slug: string;
  cover_image_url: string;
  short_summary: string;
  content: string;
  author: string;
  category:
    | 'Announcements'
    | 'Product Updates'
    | 'Company News'
    | 'Articles & Insights'
    | 'Featured Stories';
  tags: string[];
  seo_title: string;
  seo_description: string;
  publish_at: string | null;
  status: 'draft' | 'scheduled' | 'published' | 'unpublished';
  updated_at?: string;
  created_at?: string;
}

export interface CmsAnnouncement {
  id: string;
  kind:
    | 'company_announcement'
    | 'product_update'
    | 'new_feature'
    | 'service_notification'
    | 'important_notice';
  title: string;
  summary: string;
  body: string;
  image_url: string;
  is_pinned: number;
  visibility: 'public' | 'hidden';
  status: 'draft' | 'scheduled' | 'published' | 'archived';
  show_as_banner: number;
  publish_at: string | null;
  starts_at: string | null;
  expires_at: string | null;
  updated_at?: string;
}

export interface CmsMediaAsset {
  id: string;
  filename: string;
  original_name: string;
  mime_type: string;
  size_bytes: number;
  url: string;
  category:
    | 'company_logo'
    | 'founder_photo'
    | 'founder_gallery'
    | 'product_screenshot'
    | 'article_cover'
    | 'banner'
    | 'approved_media';
  alt_text: string;
  caption?: string;
  focal_position?: string;
  display_order?: number;
  is_protected: number;
  uploaded_by: string | null;
  created_at: string;
}

export interface PublicFounderGallerySlide {
  id: string;
  url: string;
  original_name?: string;
  alt_text: string;
  caption: string;
  focal_position: string;
  display_order: number;
}

export interface CmsEnquiry {
  id: string;
  type: 'general' | 'business' | 'partnership' | 'careers' | 'feedback';
  full_name: string;
  email: string;
  organisation: string;
  subject_context: string;
  message: string;
  status: 'pending' | 'in_review' | 'resolved' | 'archived';
  internal_notes: string;
  resolved_by: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CompanySectionRecord {
  sectionKey: string;
  title: string;
  draftData: any;
  publishedData: any;
  status: 'draft' | 'published';
  updatedBy: string | null;
  updatedAt: string;
  publishedAt: string | null;
}

export type TranslationEntityType =
  | 'company_section'
  | 'article'
  | 'announcement'
  | 'media_asset';

export interface CmsTranslationsBootstrap {
  companySections: Record<string, any>;
  articles: Record<string, any>;
  announcements: Record<string, any>;
  mediaAssets: Record<string, any>;
}

export interface TranslationSummaryItem {
  publishedCount: number;
  draftCount: number;
  publishedLocales: string[];
  draftLocales: string[];
}

export interface TranslationEntryRecord {
  locale: string;
  draftData: Record<string, any> | null;
  publishedData: Record<string, any> | null;
  status: 'draft' | 'published';
  hasUnpublishedChanges: boolean;
  updatedBy: string | null;
  updatedAt: string;
  publishedAt: string | null;
}

export class ApiError extends Error {
  status: number;
  code?: string;

  constructor(message: string, status = 0, code?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

async function apiFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const isFormData = init?.body instanceof FormData;
  let response: Response;
  try {
    response = await fetch(url, {
      credentials: 'include',
      cache: 'no-store',
      ...init,
      headers: {
        ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
        ...(init?.headers || {}),
      },
    });
  } catch {
    throw new ApiError(
      'Unable to connect to the server. Please check your connection and try again.',
      0,
      'NETWORK_ERROR'
    );
  }

  const contentType = response.headers.get('content-type') || '';
  const data = contentType.includes('application/json')
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const message =
      typeof data === 'object' && data && 'error' in data
        ? String((data as any).error)
        : `Request failed (${response.status})`;
    const code =
      typeof data === 'object' && data && 'code' in data ? String((data as any).code) : undefined;
    throw new ApiError(message, response.status, code);
  }

  return data as T;
}

export const publicApi = {
  getBootstrap: (lang?: string) => {
    const qs = lang && lang !== 'en' ? `?lang=${encodeURIComponent(lang)}` : '';
    return apiFetch<{
      language?: string;
      companySections: Record<string, any>;
      articles: CmsArticle[];
      announcements: CmsAnnouncement[];
      banners: CmsAnnouncement[];
      founderGallery: PublicFounderGallerySlide[];
      translations?: CmsTranslationsBootstrap;
    }>(`/api/public/bootstrap${qs}`);
  },

  getArticles: (params?: {
    category?: string;
    search?: string;
    page?: number;
    limit?: number;
    lang?: string;
  }) => {
    const qs = new URLSearchParams();
    if (params?.category) qs.set('category', params.category);
    if (params?.search) qs.set('search', params.search);
    if (params?.page) qs.set('page', String(params.page));
    if (params?.limit) qs.set('limit', String(params.limit));
    if (params?.lang && params.lang !== 'en') qs.set('lang', params.lang);
    return apiFetch<{ items: CmsArticle[]; total: number; page: number; totalPages: number }>(
      `/api/public/articles?${qs.toString()}`
    );
  },

  getArticleBySlug: (slug: string, lang?: string) => {
    const qs = lang && lang !== 'en' ? `?lang=${encodeURIComponent(lang)}` : '';
    return apiFetch<CmsArticle>(`/api/public/articles/${encodeURIComponent(slug)}${qs}`);
  },

  submitEnquiry: (payload: {
    type: 'general' | 'business' | 'partnership' | 'careers' | 'feedback';
    fullName: string;
    email: string;
    organisation?: string;
    subjectContext?: string;
    message: string;
  }) =>
    apiFetch<{ id: string; status: string; message: string }>('/api/public/enquiries', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
};

export const adminApi = {
  getSetupStatus: () => apiFetch<{ needsInitialSetup: boolean }>('/api/admin/auth/setup-status'),

  setupInitialAdmin: (payload: {
    name: string;
    email: string;
    password: string;
    leadershipRole?: LeadershipRole;
  }) =>
    apiFetch<{ user: AdminUser }>('/api/admin/auth/setup-initial-admin', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  login: (payload: { email: string; password: string; totpCode?: string }) =>
    apiFetch<{ user?: AdminUser; mfaRequired?: boolean; message?: string }>(
      '/api/admin/auth/login',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    ),

  logout: () =>
    apiFetch<{ ok: boolean }>('/api/admin/auth/logout', { method: 'POST' }),

  me: () => apiFetch<{ user: AdminUser }>('/api/admin/auth/me'),

  forgotPassword: (email: string) =>
    apiFetch<{ message: string; devPreviewToken?: string }>('/api/admin/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  resetPassword: (payload: { token: string; newPassword: string }) =>
    apiFetch<{ message: string }>('/api/admin/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getOverview: () =>
    apiFetch<{
      metrics: {
        publishedArticles: number;
        draftArticles: number;
        activeAnnouncements: number;
        pendingEnquiries: number;
      };
      recentActivity: {
        id: string;
        actor_email: string;
        actor_role: string;
        action: string;
        resource_type: string;
        resource_id: string;
        created_at: string;
      }[];
      recentFeedback: {
        id: string;
        full_name: string;
        subject_context: string;
        message: string;
        status: string;
        created_at: string;
      }[];
      canViewFeedback: boolean;
    }>('/api/admin/overview'),

  getCompanySections: () =>
    apiFetch<{ sections: CompanySectionRecord[] }>('/api/admin/company'),

  saveCompanyDraft: (key: string, payload: { title?: string; data: unknown }) =>
    apiFetch<{ ok: boolean }>(`/api/admin/company/${encodeURIComponent(key)}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  publishCompanySection: (key: string) =>
    apiFetch<{ ok: boolean }>(`/api/admin/company/${encodeURIComponent(key)}/publish`, {
      method: 'POST',
    }),

  unpublishCompanySection: (key: string) =>
    apiFetch<{ ok: boolean }>(`/api/admin/company/${encodeURIComponent(key)}/unpublish`, {
      method: 'POST',
    }),

  getArticles: (params?: { status?: string; category?: string; search?: string; page?: number }) => {
    const qs = new URLSearchParams();
    if (params?.status) qs.set('status', params.status);
    if (params?.category) qs.set('category', params.category);
    if (params?.search) qs.set('search', params.search);
    if (params?.page) qs.set('page', String(params.page));
    return apiFetch<{ items: CmsArticle[]; total: number; page: number; limit: number }>(
      `/api/admin/articles?${qs.toString()}`
    );
  },

  createArticle: (payload: {
    title: string;
    slug: string;
    coverImageUrl: string;
    shortSummary: string;
    content: string;
    author: string;
    category: CmsArticle['category'];
    tags: string[];
    seoTitle: string;
    seoDescription: string;
    publishAt: string | null;
    status: CmsArticle['status'];
  }) =>
    apiFetch<{ id: string; slug: string; status: string }>('/api/admin/articles', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateArticle: (
    id: string,
    payload: {
      title: string;
      slug: string;
      coverImageUrl: string;
      shortSummary: string;
      content: string;
      author: string;
      category: CmsArticle['category'];
      tags: string[];
      seoTitle: string;
      seoDescription: string;
      publishAt: string | null;
      status: CmsArticle['status'];
    }
  ) =>
    apiFetch<{ ok: boolean }>(`/api/admin/articles/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  deleteArticle: (id: string) =>
    apiFetch<{ ok: boolean }>(`/api/admin/articles/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    }),

  getAnnouncements: (status?: string) => {
    const qs = status ? `?status=${encodeURIComponent(status)}` : '';
    return apiFetch<{ items: CmsAnnouncement[] }>(`/api/admin/announcements${qs}`);
  },

  createAnnouncement: (payload: {
    kind: CmsAnnouncement['kind'];
    title: string;
    summary: string;
    body: string;
    imageUrl: string;
    isPinned: boolean;
    visibility: 'public' | 'hidden';
    status: CmsAnnouncement['status'];
    showAsBanner: boolean;
    publishAt: string | null;
    startsAt: string | null;
    expiresAt: string | null;
  }) =>
    apiFetch<{ id: string; status: string }>('/api/admin/announcements', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateAnnouncement: (
    id: string,
    payload: {
      kind: CmsAnnouncement['kind'];
      title: string;
      summary: string;
      body: string;
      imageUrl: string;
      isPinned: boolean;
      visibility: 'public' | 'hidden';
      status: CmsAnnouncement['status'];
      showAsBanner: boolean;
      publishAt: string | null;
      startsAt: string | null;
      expiresAt: string | null;
    }
  ) =>
    apiFetch<{ ok: boolean }>(`/api/admin/announcements/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  deleteAnnouncement: (id: string) =>
    apiFetch<{ ok: boolean }>(`/api/admin/announcements/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    }),

  getMedia: (params?: { category?: string; search?: string }) => {
    const qs = new URLSearchParams();
    if (params?.category) qs.set('category', params.category);
    if (params?.search) qs.set('search', params.search);
    return apiFetch<{ items: CmsMediaAsset[] }>(`/api/admin/media?${qs.toString()}`);
  },

  uploadMedia: (
    file: File,
    category: CmsMediaAsset['category'],
    altText: string,
    options?: { caption?: string; focalPosition?: string; displayOrder?: number }
  ) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', category);
    formData.append('altText', altText);
    if (options?.caption !== undefined) formData.append('caption', options.caption);
    if (options?.focalPosition) formData.append('focalPosition', options.focalPosition);
    if (options?.displayOrder !== undefined) {
      formData.append('displayOrder', String(options.displayOrder));
    }
    return apiFetch<{ id: string; url: string; filename: string }>('/api/admin/media', {
      method: 'POST',
      body: formData,
    });
  },

  updateMediaMeta: (
    id: string,
    payload: {
      altText: string;
      category: CmsMediaAsset['category'];
      caption?: string;
      focalPosition?: string;
      displayOrder?: number;
    }
  ) =>
    apiFetch<{ ok: boolean }>(`/api/admin/media/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  replaceMediaFile: (id: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiFetch<{ ok: boolean; url: string }>(
      `/api/admin/media/${encodeURIComponent(id)}/replace`,
      {
        method: 'POST',
        body: formData,
      }
    );
  },

  deleteMedia: (id: string) =>
    apiFetch<{ ok: boolean }>(`/api/admin/media/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    }),

  getEnquiries: (params?: { type?: string; status?: string; search?: string; page?: number }) => {
    const qs = new URLSearchParams();
    if (params?.type) qs.set('type', params.type);
    if (params?.status) qs.set('status', params.status);
    if (params?.search) qs.set('search', params.search);
    if (params?.page) qs.set('page', String(params.page));
    return apiFetch<{ items: CmsEnquiry[]; total: number; page: number; limit: number }>(
      `/api/admin/enquiries?${qs.toString()}`
    );
  },

  updateEnquiry: (
    id: string,
    payload: { status: CmsEnquiry['status']; internalNotes: string }
  ) =>
    apiFetch<{ ok: boolean; status: string }>(
      `/api/admin/enquiries/${encodeURIComponent(id)}`,
      {
        method: 'PATCH',
        body: JSON.stringify(payload),
      }
    ),

  getAdminUsers: () => apiFetch<{ items: AdminUser[] }>('/api/admin/users'),

  createAdminUser: (payload: {
    name: string;
    email: string;
    password: string;
    role: AdminRole;
    leadershipRole?: LeadershipRole;
  }) =>
    apiFetch<AdminUser>('/api/admin/users', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateAdminUser: (
    id: string,
    payload: { role?: AdminRole; leadershipRole?: LeadershipRole; isActive?: boolean }
  ) =>
    apiFetch<{ ok: boolean }>(`/api/admin/users/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),

  getAuditLogs: () =>
    apiFetch<{
      items: {
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
    }>('/api/admin/audit-logs'),

  getTranslationsSummary: (entityType: TranslationEntityType) =>
    apiFetch<{
      entityType: TranslationEntityType;
      totalTargetLocales: number;
      summary: Record<string, TranslationSummaryItem>;
    }>(`/api/admin/translations/summary?entityType=${encodeURIComponent(entityType)}`),

  getEntityTranslations: (entityType: TranslationEntityType, entityId: string) =>
    apiFetch<{
      entityType: TranslationEntityType;
      entityId: string;
      translations: Record<string, TranslationEntryRecord>;
    }>(
      `/api/admin/translations?entityType=${encodeURIComponent(
        entityType
      )}&entityId=${encodeURIComponent(entityId)}`
    ),

  saveTranslationDraft: (
    entityType: TranslationEntityType,
    entityId: string,
    locale: string,
    data: Record<string, unknown>
  ) =>
    apiFetch<{ ok: boolean; entityType: string; entityId: string; locale: string }>(
      `/api/admin/translations/${encodeURIComponent(entityType)}/${encodeURIComponent(
        entityId
      )}/${encodeURIComponent(locale)}`,
      {
        method: 'PUT',
        body: JSON.stringify({ data }),
      }
    ),

  publishTranslation: (
    entityType: TranslationEntityType,
    entityId: string,
    locale: string
  ) =>
    apiFetch<{ ok: boolean; status: string }>(
      `/api/admin/translations/${encodeURIComponent(entityType)}/${encodeURIComponent(
        entityId
      )}/${encodeURIComponent(locale)}/publish`,
      {
        method: 'POST',
      }
    ),

  unpublishTranslation: (
    entityType: TranslationEntityType,
    entityId: string,
    locale: string
  ) =>
    apiFetch<{ ok: boolean; status: string }>(
      `/api/admin/translations/${encodeURIComponent(entityType)}/${encodeURIComponent(
        entityId
      )}/${encodeURIComponent(locale)}/unpublish`,
      {
        method: 'POST',
      }
    ),
};
