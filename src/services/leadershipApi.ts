import { ApiError, type AdminRole, type AdminUser, type LeadershipRole, type PermissionKey } from './cmsApi';

export type LeadershipSelectableRole = 'founder' | 'ceo';
export type WorkItemDomain = 'product' | 'marketing' | 'testing';
export type WorkItemStatus = 'planned' | 'in_progress' | 'in_review' | 'completed' | 'blocked';
export type WorkItemPriority = 'high' | 'medium' | 'low';

export interface LeadershipWorkItem {
  id: string;
  domain: WorkItemDomain;
  title: string;
  category: string;
  summary: string;
  owner_name: string;
  priority: WorkItemPriority;
  status: WorkItemStatus;
  progress_pct: number;
  target_date: string | null;
  notes: string;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ReportMetric {
  label: string;
  value: string;
  note?: string;
}

export interface LeadershipReport {
  id: string;
  title: string;
  report_type:
    | 'executive_summary'
    | 'operations'
    | 'merchant_growth'
    | 'financial'
    | 'product_metrics';
  period_label: string;
  summary: string;
  metrics: ReportMetric[];
  highlights: string;
  author_name: string;
  status: 'draft' | 'final';
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface LeadershipDocument {
  id: string;
  title: string;
  category:
    | 'governance'
    | 'strategy'
    | 'product_spec'
    | 'marketing_plan'
    | 'legal_compliance'
    | 'financial'
    | 'meeting_notes';
  summary: string;
  content: string;
  attachment_filename: string;
  attachment_original_name: string;
  attachment_mime: string;
  attachment_size: number;
  classification: 'leadership_only' | 'executive_confidential';
  uploaded_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface LeadershipTeamMember {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  leadershipRole: LeadershipRole;
  customPermissions: boolean;
  permissions: PermissionKey[];
  mfaEnabled: boolean;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
}

export interface LoginAuditRow {
  id: string;
  actor_user_id: string | null;
  actor_email: string;
  actor_role: string;
  action: string;
  details_json: string;
  ip_address: string;
  created_at: string;
}

async function leadershipFetch<T>(url: string, init?: RequestInit): Promise<T> {
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
      'Unable to reach the Private Leadership server. Please check your connection and try again.',
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

export const leadershipApi = {
  login: (payload: {
    selectedRole: LeadershipSelectableRole;
    email: string;
    password: string;
    totpCode?: string;
  }) =>
    leadershipFetch<{ user?: AdminUser; mfaRequired?: boolean; message?: string }>(
      '/api/leadership/auth/login',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    ),

  logout: () =>
    leadershipFetch<{ ok: boolean }>('/api/leadership/auth/logout', {
      method: 'POST',
    }),

  me: () => leadershipFetch<{ user: AdminUser }>('/api/leadership/auth/me'),

  setupMfa: (currentPassword: string) =>
    leadershipFetch<{ secret: string; otpauthUri: string; qrDataUrl: string }>(
      '/api/leadership/auth/mfa/setup',
      {
        method: 'POST',
        body: JSON.stringify({ currentPassword }),
      }
    ),

  enableMfa: (totpCode: string) =>
    leadershipFetch<{ ok: boolean; mfaEnabled: boolean }>('/api/leadership/auth/mfa/enable', {
      method: 'POST',
      body: JSON.stringify({ totpCode }),
    }),

  disableMfa: (currentPassword: string) =>
    leadershipFetch<{ ok: boolean; mfaEnabled: boolean }>('/api/leadership/auth/mfa/disable', {
      method: 'POST',
      body: JSON.stringify({ currentPassword }),
    }),

  changePassword: (currentPassword: string, newPassword: string) =>
    leadershipFetch<{ ok: boolean; message: string }>('/api/leadership/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    }),

  getOverview: () =>
    leadershipFetch<{
      metrics: {
        reportsCount: number;
        documentsCount: number;
        publishedArticles: number;
        activeAnnouncements: number;
        pendingEnquiries: number;
        partnershipEnquiries: number;
        workSummary: { domain: string; status: string; count: number }[];
      };
      recentWorkItems: LeadershipWorkItem[];
      recentReports: LeadershipReport[];
      recentAudit: {
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
    }>('/api/leadership/overview'),

  getWorkItems: (domain: WorkItemDomain, status?: string) => {
    const qs = new URLSearchParams({ domain });
    if (status && status !== 'all') qs.set('status', status);
    return leadershipFetch<{ items: LeadershipWorkItem[] }>(
      `/api/leadership/work-items?${qs.toString()}`
    );
  },

  createWorkItem: (payload: {
    domain: WorkItemDomain;
    title: string;
    category: string;
    summary: string;
    ownerName: string;
    priority: WorkItemPriority;
    status: WorkItemStatus;
    progressPct: number;
    targetDate: string | null;
    notes: string;
  }) =>
    leadershipFetch<{ id: string }>('/api/leadership/work-items', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateWorkItem: (
    id: string,
    payload: {
      domain: WorkItemDomain;
      title: string;
      category: string;
      summary: string;
      ownerName: string;
      priority: WorkItemPriority;
      status: WorkItemStatus;
      progressPct: number;
      targetDate: string | null;
      notes: string;
    }
  ) =>
    leadershipFetch<{ ok: boolean }>(`/api/leadership/work-items/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  deleteWorkItem: (id: string) =>
    leadershipFetch<{ ok: boolean }>(`/api/leadership/work-items/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    }),

  getReports: () => leadershipFetch<{ items: LeadershipReport[] }>('/api/leadership/reports'),

  createReport: (payload: {
    title: string;
    reportType: LeadershipReport['report_type'];
    periodLabel: string;
    summary: string;
    metrics: ReportMetric[];
    highlights: string;
    authorName: string;
    status: 'draft' | 'final';
  }) =>
    leadershipFetch<{ id: string }>('/api/leadership/reports', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateReport: (
    id: string,
    payload: {
      title: string;
      reportType: LeadershipReport['report_type'];
      periodLabel: string;
      summary: string;
      metrics: ReportMetric[];
      highlights: string;
      authorName: string;
      status: 'draft' | 'final';
    }
  ) =>
    leadershipFetch<{ ok: boolean }>(`/api/leadership/reports/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  deleteReport: (id: string) =>
    leadershipFetch<{ ok: boolean }>(`/api/leadership/reports/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    }),

  getDocuments: () =>
    leadershipFetch<{ items: LeadershipDocument[] }>('/api/leadership/documents'),

  createDocument: (payload: {
    title: string;
    category: LeadershipDocument['category'];
    summary: string;
    content: string;
    classification: LeadershipDocument['classification'];
    file?: File | null;
  }) => {
    const fd = new FormData();
    fd.append('title', payload.title);
    fd.append('category', payload.category);
    fd.append('summary', payload.summary);
    fd.append('content', payload.content);
    fd.append('classification', payload.classification);
    if (payload.file) {
      fd.append('file', payload.file);
    }
    return leadershipFetch<{ id: string }>('/api/leadership/documents', {
      method: 'POST',
      body: fd,
    });
  },

  deleteDocument: (id: string) =>
    leadershipFetch<{ ok: boolean }>(`/api/leadership/documents/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    }),

  getLoginHistory: () =>
    leadershipFetch<{ items: LoginAuditRow[] }>('/api/leadership/login-history'),

  getTeam: () =>
    leadershipFetch<{
      availablePermissions: PermissionKey[];
      items: LeadershipTeamMember[];
    }>('/api/leadership/team'),

  createTeamUser: (payload: {
    name: string;
    email: string;
    password: string;
    role: AdminRole;
    leadershipRole?: LeadershipRole;
  }) =>
    leadershipFetch<LeadershipTeamMember>('/api/leadership/team', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateTeamUser: (
    id: string,
    payload: {
      role?: AdminRole;
      leadershipRole?: LeadershipRole;
      customPermissions?: boolean;
      permissions?: PermissionKey[];
      isActive?: boolean;
    }
  ) =>
    leadershipFetch<{ ok: boolean }>(`/api/leadership/team/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),
};
