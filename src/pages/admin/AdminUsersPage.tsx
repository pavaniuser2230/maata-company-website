import React, { useEffect, useState } from 'react';
import { Lock, ShieldCheck, UserPlus } from 'lucide-react';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { adminApi, type AdminRole, type AdminUser, type LeadershipRole } from '../../services/cmsApi';
import { formatAdminDate, StatusBadge } from '../../components/admin/AdminUi';

type AuditLogRow = Awaited<ReturnType<typeof adminApi.getAuditLogs>>['items'][number];

export const AdminUsersPage: React.FC = () => {
  const { user } = useAdminAuth();
  const isSuperAdmin = user?.role === 'super_admin';

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [logs, setLogs] = useState<AuditLogRow[]>([]);
  const [loading, setLoading] = useState(true);

  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<AdminRole>('content_manager');
  const [creating, setCreating] = useState(false);

  const [feedback, setFeedback] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [uRes, lRes] = await Promise.all([
        adminApi.getAdminUsers(),
        adminApi.getAuditLogs(),
      ]);
      setUsers(uRes.items);
      setLogs(lRes.items);
    } catch (err: any) {
      setFeedback({ type: 'err', text: err?.message || 'Failed to load admin users.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isSuperAdmin) {
      void loadData();
    } else {
      setLoading(false);
    }
  }, [isSuperAdmin]);

  if (!isSuperAdmin) {
    return (
      <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-900">
        <div className="flex items-center gap-2 font-semibold">
          <Lock className="h-4 w-4" />
          <span>Super Administrator Access Required</span>
        </div>
        <p className="mt-1">
          Only Super Administrators can create admin accounts, modify roles, or view security audit
          logs.
        </p>
      </div>
    );
  }

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setFeedback(null);
    try {
      await adminApi.createAdminUser({
        name: newName.trim(),
        email: newEmail.trim(),
        password: newPassword,
        role: newRole,
      });
      setNewName('');
      setNewEmail('');
      setNewPassword('');
      setNewRole('content_manager');
      await loadData();
      setFeedback({ type: 'ok', text: 'Administrator account created successfully.' });
    } catch (err: any) {
      setFeedback({ type: 'err', text: err?.message || 'Unable to create administrator.' });
    } finally {
      setCreating(false);
    }
  };

  const handleUpdateUser = async (
    target: AdminUser,
    patch: { role?: AdminRole; leadershipRole?: LeadershipRole; isActive?: boolean }
  ) => {
    setFeedback(null);
    try {
      await adminApi.updateAdminUser(target.id, patch);
      await loadData();
      setFeedback({ type: 'ok', text: `Updated permissions for ${target.email}.` });
    } catch (err: any) {
      setFeedback({ type: 'err', text: err?.message || 'Failed to update user.' });
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

      {/* Create Administrator Form */}
      <form
        onSubmit={handleCreateUser}
        className="rounded-xl border border-slate-200 bg-white p-5"
      >
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-[#0F8A5F]" />
          <h2 className="text-sm font-semibold text-[#092F35]">Create Administrator Account</h2>
        </div>
        <p className="mt-1 text-xs text-slate-500">
          Assign strict least-privilege roles: Content Manager (CMS + Media), Support Manager
          (Enquiries & Feedback), or Super Admin (Full access).
        </p>

        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-12">
          <div className="md:col-span-3">
            <label className="block text-xs font-medium text-slate-700">Full Name *</label>
            <input
              type="text"
              required
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Staff Name"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs"
            />
          </div>
          <div className="md:col-span-3">
            <label className="block text-xs font-medium text-slate-700">Email *</label>
            <input
              type="email"
              required
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="editor@maataapp.com"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-slate-700">Role *</label>
            <select
              value={newRole}
              onChange={(e) => setNewRole(e.target.value as AdminRole)}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs"
            >
              <option value="content_manager">Content Manager</option>
              <option value="support_manager">Support Manager</option>
              <option value="founder">Founder</option>
              <option value="ceo">Co-Founder &amp; CEO</option>
              <option value="director">Director</option>
              <option value="executive">Executive</option>
              <option value="administrator">Administrator</option>
              <option value="super_admin">Super Admin</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-slate-700">
              Password (10+ chars) *
            </label>
            <input
              type="password"
              required
              minLength={10}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs"
            />
          </div>
          <div className="flex items-end md:col-span-2">
            <button
              type="submit"
              disabled={creating}
              className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-[#092F35] px-4 py-2 text-xs font-semibold text-white hover:bg-[#0F4C5C] disabled:opacity-50"
            >
              <UserPlus className="h-3.5 w-3.5" />
              <span>{creating ? 'Creating...' : 'Create User'}</span>
            </button>
          </div>
        </div>
      </form>

      {/* Admin Users Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="text-sm font-semibold text-[#092F35]">Administrator Directory</h2>
        </div>

        {loading ? (
          <div className="space-y-2 p-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-12 animate-pulse rounded bg-slate-100" />
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Administrator</th>
                  <th className="px-4 py-3 font-medium">Role</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Last Login</th>
                  <th className="px-4 py-3 text-right font-medium">Account Control</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => {
                  const isSelf = u.id === user?.id;
                  const isActive = u.is_active !== 0;
                  return (
                    <tr key={u.id} className="hover:bg-slate-50/70">
                      <td className="px-4 py-3">
                        <p className="font-semibold text-[#092F35]">
                          {u.name} {isSelf && <span className="text-[11px] text-[#0F8A5F]">(You)</span>}
                        </p>
                        <p className="text-[11px] text-slate-500">{u.email}</p>
                      </td>
                      <td className="px-4 py-3">
                        <select
                          disabled={isSelf}
                          value={u.role}
                          onChange={(e) =>
                            handleUpdateUser(u, { role: e.target.value as AdminRole })
                          }
                          aria-label={`Role for ${u.email}`}
                          className="rounded border border-slate-300 bg-white px-2.5 py-1 text-xs disabled:bg-slate-100"
                        >
                          <option value="super_admin">Super Admin</option>
                          <option value="ceo">Co-Founder &amp; CEO</option>
                          <option value="founder">Founder</option>
                          <option value="director">Director</option>
                          <option value="executive">Executive</option>
                          <option value="administrator">Administrator</option>
                          <option value="content_manager">Content Manager</option>
                          <option value="support_manager">Support Manager</option>
                        </select>
                        {u.role === 'super_admin' && (
                          <select
                            value={u.leadership_role || 'none'}
                            onChange={(e) =>
                              handleUpdateUser(u, {
                                leadershipRole: e.target.value as LeadershipRole,
                              })
                            }
                            aria-label={`Leadership access for ${u.email}`}
                            className="ml-2 rounded border border-slate-300 bg-white px-2 py-1 text-xs"
                          >
                            <option value="none">No Leadership Portal</option>
                            <option value="super_admin">Portal: Super Admin</option>
                            <option value="ceo">Portal: Co-Founder &amp; CEO</option>
                            <option value="founder">Portal: Founder</option>
                            <option value="director">Portal: Director</option>
                            <option value="executive">Portal: Executive</option>
                            <option value="administrator">Portal: Administrator</option>
                          </select>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={isActive ? 'active' : 'inactive'} />
                      </td>
                      <td className="px-4 py-3 text-slate-500 tabular-nums whitespace-nowrap">
                        {formatAdminDate(u.last_login_at)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          disabled={isSelf}
                          onClick={() => handleUpdateUser(u, { isActive: !isActive })}
                          className={`rounded-md border px-2.5 py-1 text-xs font-medium disabled:opacity-40 ${
                            isActive
                              ? 'border-rose-200 text-rose-700 hover:bg-rose-50'
                              : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'
                          }`}
                        >
                          {isActive ? 'Deactivate' : 'Reactivate'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Security Audit Log */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="text-sm font-semibold text-[#092F35]">Security & Content Audit Log</h2>
        </div>

        {loading ? (
          <div className="p-6">
            <div className="h-24 animate-pulse rounded bg-slate-100" />
          </div>
        ) : logs.length === 0 ? (
          <p className="p-6 text-xs text-slate-500">No audit events recorded yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Action</th>
                  <th className="px-4 py-3 font-medium">Actor</th>
                  <th className="px-4 py-3 font-medium">Role</th>
                  <th className="px-4 py-3 font-medium">Target</th>
                  <th className="px-4 py-3 font-medium">IP</th>
                  <th className="px-4 py-3 text-right font-medium">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/70">
                    <td className="px-4 py-2.5 font-medium text-[#092F35]">
                      {log.action.replace(/_/g, ' ')}
                    </td>
                    <td className="px-4 py-2.5 text-slate-700">{log.actor_email}</td>
                    <td className="px-4 py-2.5">
                      <StatusBadge status={log.actor_role} />
                    </td>
                    <td className="px-4 py-2.5 text-slate-500">
                      {log.resource_type}
                      {log.resource_id ? ` · ${log.resource_id}` : ''}
                    </td>
                    <td className="px-4 py-2.5 font-mono text-[11px] text-slate-500 tabular-nums">
                      {log.ip_address || '—'}
                    </td>
                    <td className="px-4 py-2.5 text-right text-slate-500 tabular-nums whitespace-nowrap">
                      {formatAdminDate(log.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
