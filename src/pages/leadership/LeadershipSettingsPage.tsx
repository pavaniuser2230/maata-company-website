import React, { useEffect, useState } from 'react';
import { KeyRound, ShieldCheck, UserPlus } from 'lucide-react';
import { useAdminAuth } from '../../context/AdminAuthContext';
import type { AdminRole, LeadershipRole, PermissionKey } from '../../services/cmsApi';
import {
  leadershipApi,
  type LeadershipTeamMember,
  type LoginAuditRow,
} from '../../services/leadershipApi';
import { formatAdminDate } from '../../components/admin/AdminUi';
import { FirebaseSyncPanel } from '../../components/admin/FirebaseSyncPanel';

const PERMISSION_LABELS: Record<PermissionKey, string> = {
  'leadership.overview': 'Company Overview',
  'leadership.product.read': 'Product & Dev (Read)',
  'leadership.product.write': 'Product & Dev (Edit)',
  'leadership.marketing.read': 'Marketing (Read)',
  'leadership.marketing.write': 'Marketing (Edit)',
  'leadership.testing.read': 'App Testing (Read)',
  'leadership.testing.write': 'App Testing (Edit)',
  'leadership.reports.read': 'Business Reports (Read)',
  'leadership.reports.write': 'Business Reports (Write)',
  'leadership.documents.read': 'Documents (Read)',
  'leadership.documents.write': 'Documents (Write)',
  'leadership.publishing': 'Announcements & Publishing',
  'leadership.enquiries': 'Enquiries & Partnerships',
  'leadership.settings.security': 'Personal Security & 2FA',
  'system.admin': 'System Admin',
};

export const LeadershipSettingsPage: React.FC = () => {
  const { user, refreshSession } = useAdminAuth();
  const isSuper = user?.role === 'super_admin';

  // Password Change
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [pwSaving, setPwSaving] = useState(false);

  // 2FA TOTP Setup
  const [mfaPassword, setMfaPassword] = useState('');
  const [setupQr, setSetupQr] = useState('');
  const [setupSecret, setSetupSecret] = useState('');
  const [verifyTotp, setVerifyTotp] = useState('');
  const [mfaWorking, setMfaWorking] = useState(false);

  // Login History
  const [loginHistory, setLoginHistory] = useState<LoginAuditRow[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  // Super Admin Team Permissions
  const [team, setTeam] = useState<LeadershipTeamMember[]>([]);
  const [availablePermissions, setAvailablePermissions] = useState<PermissionKey[]>([]);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newAccountPassword, setNewAccountPassword] = useState('');
  const [newRole, setNewRole] = useState<AdminRole>('founder');
  const [creatingTeam, setCreatingTeam] = useState(false);

  // Inline Edit Executive Account
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState<AdminRole>('executive');
  const [editLeadershipRole, setEditLeadershipRole] = useState<LeadershipRole>('executive');
  const [savingEdit, setSavingEdit] = useState(false);

  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');

  const loadSettingsData = async () => {
    setHistoryLoading(true);
    try {
      const hist = await leadershipApi.getLoginHistory();
      setLoginHistory(hist.items);

      if (isSuper) {
        const teamRes = await leadershipApi.getTeam();
        setTeam(teamRes.items);
        setAvailablePermissions(teamRes.availablePermissions);
      }
    } catch (err: any) {
      setError(err?.message || 'Unable to load leadership security data.');
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    void loadSettingsData();
  }, [isSuper]);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwSaving(true);
    setError('');
    setFeedback('');
    try {
      const res = await leadershipApi.changePassword(currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setFeedback(res.message);
      await loadSettingsData();
    } catch (err: any) {
      setError(err?.message || 'Unable to update password.');
    } finally {
      setPwSaving(false);
    }
  };

  const handleStartMfaSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setMfaWorking(true);
    setError('');
    setFeedback('');
    try {
      const res = await leadershipApi.setupMfa(mfaPassword);
      setSetupQr(res.qrDataUrl);
      setSetupSecret(res.secret);
      setMfaPassword('');
    } catch (err: any) {
      setError(err?.message || 'Could not start two-factor setup.');
    } finally {
      setMfaWorking(false);
    }
  };

  const handleEnableMfa = async (e: React.FormEvent) => {
    e.preventDefault();
    setMfaWorking(true);
    setError('');
    setFeedback('');
    try {
      await leadershipApi.enableMfa(verifyTotp.trim());
      setSetupQr('');
      setSetupSecret('');
      setVerifyTotp('');
      await refreshSession();
      await loadSettingsData();
      setFeedback('Two-factor authentication (TOTP) is now active on your executive account.');
    } catch (err: any) {
      setError(err?.message || 'Verification code did not match.');
    } finally {
      setMfaWorking(false);
    }
  };

  const handleDisableMfa = async (e: React.FormEvent) => {
    e.preventDefault();
    setMfaWorking(true);
    setError('');
    setFeedback('');
    try {
      await leadershipApi.disableMfa(mfaPassword);
      setMfaPassword('');
      await refreshSession();
      await loadSettingsData();
      setFeedback('Two-factor authentication has been disabled.');
    } catch (err: any) {
      setError(err?.message || 'Unable to disable 2FA.');
    } finally {
      setMfaWorking(false);
    }
  };

  const handleCreateExecutiveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingTeam(true);
    setError('');
    setFeedback('');
    const derivedLeadershipRole: LeadershipRole =
      newRole === 'super_admin' ||
      newRole === 'founder' ||
      newRole === 'ceo' ||
      newRole === 'director' ||
      newRole === 'executive' ||
      newRole === 'administrator'
        ? newRole
        : 'none';
    try {
      await leadershipApi.createTeamUser({
        name: newName.trim(),
        email: newEmail.trim(),
        password: newAccountPassword,
        role: newRole,
        leadershipRole: derivedLeadershipRole,
      });
      setNewName('');
      setNewEmail('');
      setNewAccountPassword('');
      await loadSettingsData();
      setFeedback('Executive account created with server-enforced permissions.');
    } catch (err: any) {
      setError(err?.message || 'Unable to create account.');
    } finally {
      setCreatingTeam(false);
    }
  };

  const startEditingMember = (member: LeadershipTeamMember) => {
    setEditingMemberId(member.id);
    setEditName(member.name);
    setEditRole(member.role);
    setEditLeadershipRole(member.leadershipRole);
    setError('');
    setFeedback('');
  };

  const handleSaveMemberEdit = async (e: React.FormEvent, member: LeadershipTeamMember) => {
    e.preventDefault();
    setSavingEdit(true);
    setError('');
    setFeedback('');
    try {
      const nextLeadership: LeadershipRole =
        editRole === 'super_admin'
          ? editLeadershipRole
          : editRole === 'founder' ||
              editRole === 'ceo' ||
              editRole === 'director' ||
              editRole === 'executive' ||
              editRole === 'administrator'
            ? editRole
            : 'none';

      await leadershipApi.updateTeamUser(member.id, {
        name: editName.trim(),
        role: member.id === user?.id ? member.role : editRole,
        leadershipRole: nextLeadership,
      });
      setEditingMemberId(null);
      await loadSettingsData();
      await refreshSession();
      setFeedback(`Updated executive account details for ${member.email}.`);
    } catch (err: any) {
      setError(err?.message || 'Unable to save executive account changes.');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleTogglePermission = async (member: LeadershipTeamMember, perm: PermissionKey) => {
    setError('');
    setFeedback('');
    const current = new Set(member.permissions);
    if (current.has(perm)) {
      current.delete(perm);
    } else {
      current.add(perm);
    }
    try {
      await leadershipApi.updateTeamUser(member.id, {
        customPermissions: true,
        permissions: Array.from(current),
      });
      await loadSettingsData();
      setFeedback(`Updated permissions for ${member.name}.`);
    } catch (err: any) {
      setError(err?.message || 'Failed to update permissions.');
    }
  };

  const handleUpdateDesignation = async (
    member: LeadershipTeamMember,
    patch: {
      role?: AdminRole;
      leadershipRole?: LeadershipRole;
      customPermissions?: boolean;
      isActive?: boolean;
    }
  ) => {
    setError('');
    setFeedback('');
    try {
      await leadershipApi.updateTeamUser(member.id, patch);
      await loadSettingsData();
      setFeedback(`Updated executive settings for ${member.email}.`);
    } catch (err: any) {
      setError(err?.message || 'Failed to update executive settings.');
    }
  };

  return (
    <div className="space-y-6">
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

      <FirebaseSyncPanel
        mode="leadership"
        canWriteWorkItems={
          user?.role === 'super_admin' ||
          user?.role === 'ceo' ||
          user?.leadershipRole === 'ceo'
        }
      />

      {/* Password & 2FA Controls */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <form
          onSubmit={handleChangePassword}
          className="rounded-xl border border-slate-200 bg-white p-6 space-y-4 text-xs"
        >
          <div className="flex items-center gap-2">
            <KeyRound className="h-4 w-4 text-[#0F8A5F]" aria-hidden="true" />
            <h2 className="text-sm font-semibold text-[#092F35]">Update Executive Password</h2>
          </div>
          <p className="text-slate-600">
            Changing your password updates your cryptographic scrypt hash and revokes any other
            active sessions.
          </p>

          <div>
            <label className="block font-medium text-slate-700">Current Password</label>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="block font-medium text-slate-700">
              New Strong Password (10+ chars, upper, lower, digit)
            </label>
            <input
              type="password"
              required
              minLength={10}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={pwSaving}
            className="rounded-lg bg-[#092F35] px-4 py-2 font-semibold text-white hover:bg-[#0F4C5C] disabled:opacity-50"
          >
            {pwSaving ? 'Updating...' : 'Save New Password'}
          </button>
        </form>

        <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-4 text-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-[#0F8A5F]" aria-hidden="true" />
              <h2 className="text-sm font-semibold text-[#092F35]">
                Optional Two-Factor Authentication (TOTP)
              </h2>
            </div>
            <span className="font-medium text-slate-700">
              {user?.mfaEnabled ? 'Enabled' : 'Disabled'}
            </span>
          </div>
          <p className="text-slate-600">
            Protect Private Leadership Access with a 6-digit authenticator app verification code in
            addition to your password.
          </p>

          {user?.mfaEnabled ? (
            <form onSubmit={handleDisableMfa} className="space-y-3 border-t border-slate-100 pt-4">
              <label className="block font-medium text-slate-700">
                Confirm Current Password to Disable 2FA
              </label>
              <input
                type="password"
                required
                value={mfaPassword}
                onChange={(e) => setMfaPassword(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
              <button
                type="submit"
                disabled={mfaWorking}
                className="rounded-lg border border-rose-300 px-4 py-2 font-medium text-rose-700 hover:bg-rose-50 disabled:opacity-50"
              >
                {mfaWorking ? 'Processing...' : 'Disable Two-Factor Authentication'}
              </button>
            </form>
          ) : setupQr ? (
            <form onSubmit={handleEnableMfa} className="space-y-4 border-t border-slate-100 pt-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <img
                  src={setupQr}
                  alt="TOTP Two-Factor Authenticator QR Code"
                  className="h-36 w-36 rounded-lg border border-slate-200 p-1"
                />
                <div className="space-y-2">
                  <p className="font-medium text-[#092F35]">
                    Scan with Google Authenticator or Authy
                  </p>
                  <p className="text-slate-600">
                    Or enter this setup key manually:
                  </p>
                  <p className="break-all rounded bg-slate-100 px-2.5 py-1.5 font-mono text-[11px] text-[#092F35]">
                    {setupSecret}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-end gap-3">
                <div>
                  <label className="block font-medium text-slate-700">
                    Enter 6-Digit Verification Code
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]{6}"
                    maxLength={6}
                    required
                    value={verifyTotp}
                    onChange={(e) => setVerifyTotp(e.target.value)}
                    placeholder="000000"
                    className="mt-1 w-40 rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm tracking-widest"
                  />
                </div>
                <button
                  type="submit"
                  disabled={mfaWorking}
                  className="rounded-lg bg-[#0F8A5F] px-4 py-2 font-semibold text-white hover:bg-[#0B5D4B] disabled:opacity-50"
                >
                  {mfaWorking ? 'Verifying...' : 'Verify & Activate 2FA'}
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleStartMfaSetup} className="space-y-3 border-t border-slate-100 pt-4">
              <label className="block font-medium text-slate-700">
                Enter Current Password to Generate 2FA Key
              </label>
              <input
                type="password"
                required
                value={mfaPassword}
                onChange={(e) => setMfaPassword(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
              <button
                type="submit"
                disabled={mfaWorking}
                className="rounded-lg bg-[#092F35] px-4 py-2 font-semibold text-white hover:bg-[#0F4C5C] disabled:opacity-50"
              >
                {mfaWorking ? 'Generating...' : 'Configure Authenticator App'}
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Super Admin Executive Accounts & Server-Side Permissions */}
      {isSuper && (
        <div className="space-y-6">
          <form
            onSubmit={handleCreateExecutiveUser}
            className="rounded-xl border border-slate-200 bg-white p-6 text-xs"
          >
            <h2 className="text-sm font-semibold text-[#092F35]">
              Create Individual Executive Account
            </h2>
            <p className="mt-1 text-slate-600">
              Each leader signs in with their own private email and password. Server-side RBAC
              prevents selecting an unauthorised role.
            </p>
            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-12">
              <div className="md:col-span-3">
                <label className="block font-medium text-slate-700">Full Name *</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="G. Balaji Reddy"
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                />
              </div>
              <div className="md:col-span-3">
                <label className="block font-medium text-slate-700">Private Email *</label>
                <input
                  type="email"
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="founder@domain.com"
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block font-medium text-slate-700">Executive Role *</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as AdminRole)}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2"
                >
                  <option value="super_admin">Super Admin</option>
                  <option value="founder">Founder</option>
                  <option value="ceo">Co-Founder &amp; CEO</option>
                  <option value="director">Director</option>
                  <option value="executive">Executive</option>
                  <option value="administrator">Administrator</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block font-medium text-slate-700">Password (10+ chars) *</label>
                <input
                  type="password"
                  required
                  minLength={10}
                  value={newAccountPassword}
                  onChange={(e) => setNewAccountPassword(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                />
              </div>
              <div className="flex items-end md:col-span-2">
                <button
                  type="submit"
                  disabled={creatingTeam}
                  className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-[#092F35] px-4 py-2 font-semibold text-white hover:bg-[#0F4C5C] disabled:opacity-50"
                >
                  <UserPlus className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>{creatingTeam ? 'Creating...' : 'Create Account'}</span>
                </button>
              </div>
            </div>
          </form>

          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <div className="border-b border-slate-200 px-5 py-4">
              <h2 className="text-sm font-semibold text-[#092F35]">
                Executive Directory, Role Mapping &amp; Granular Permissions
              </h2>
            </div>

            <div className="divide-y divide-slate-200">
              {team.map((member) => {
                const editablePerms = availablePermissions.filter((p) => p !== 'system.admin');
                const isSelf = member.id === user?.id;
                const isEditing = editingMemberId === member.id;
                const isLeadershipMember =
                  member.role === 'super_admin' ||
                  member.role === 'founder' ||
                  member.role === 'ceo' ||
                  member.role === 'director' ||
                  member.role === 'executive' ||
                  member.role === 'administrator';

                return (
                  <div key={member.id} className="p-5 text-xs">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm font-semibold text-[#092F35]">
                          {member.name}{' '}
                          {isSelf && (
                            <span className="text-[11px] font-medium text-[#0F8A5F]">(You)</span>
                          )}{' '}
                          <span className="font-normal text-slate-500">· {member.email}</span>
                        </p>
                        <p className="mt-0.5 text-slate-500 tabular-nums">
                          Role: {member.role.replace(/_/g, ' ')} · Portal Designation:{' '}
                          {member.leadershipRole.replace(/_/g, ' ')} · Status:{' '}
                          <span
                            className={
                              member.isActive
                                ? 'font-medium text-emerald-700'
                                : 'font-medium text-rose-700'
                            }
                          >
                            {member.isActive ? 'Active' : 'Inactive'}
                          </span>{' '}
                          · 2FA: {member.mfaEnabled ? 'Active' : 'Off'} · Last login:{' '}
                          {formatAdminDate(member.lastLoginAt)}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        {member.role === 'super_admin' && (
                          <select
                            value={member.leadershipRole}
                            onChange={(e) =>
                              handleUpdateDesignation(member, {
                                leadershipRole: e.target.value as LeadershipRole,
                              })
                            }
                            aria-label={`Portal designation for ${member.email}`}
                            className="rounded border border-slate-300 bg-white px-2.5 py-1.5 text-xs"
                          >
                            <option value="super_admin">Portal: Super Admin</option>
                            <option value="ceo">Portal: Co-Founder &amp; CEO</option>
                            <option value="founder">Portal: Founder</option>
                            <option value="director">Portal: Director</option>
                            <option value="executive">Portal: Executive</option>
                            <option value="administrator">Portal: Administrator</option>
                            <option value="none">No Leadership Portal Role</option>
                          </select>
                        )}

                        <button
                          type="button"
                          onClick={() =>
                            isEditing ? setEditingMemberId(null) : startEditingMember(member)
                          }
                          className="rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                        >
                          {isEditing ? 'Cancel' : 'Edit'}
                        </button>

                        {!isSelf && (
                          <button
                            type="button"
                            onClick={() =>
                              handleUpdateDesignation(member, { isActive: !member.isActive })
                            }
                            className={`rounded-md border px-2.5 py-1.5 text-xs font-medium ${
                              member.isActive
                                ? 'border-rose-200 text-rose-700 hover:bg-rose-50'
                                : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'
                            }`}
                          >
                            {member.isActive ? 'Deactivate' : 'Reactivate'}
                          </button>
                        )}
                      </div>
                    </div>

                    {isEditing && (
                      <form
                        onSubmit={(e) => handleSaveMemberEdit(e, member)}
                        className="mt-4 grid grid-cols-1 gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 sm:grid-cols-12"
                      >
                        <div className="sm:col-span-4">
                          <label className="block font-medium text-slate-700">Full Name</label>
                          <input
                            type="text"
                            required
                            minLength={2}
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs"
                          />
                        </div>
                        <div className="sm:col-span-4">
                          <label className="block font-medium text-slate-700">Assigned Role</label>
                          <select
                            disabled={isSelf}
                            value={editRole}
                            onChange={(e) => setEditRole(e.target.value as AdminRole)}
                            className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs disabled:bg-slate-100"
                          >
                            <option value="super_admin">Super Admin</option>
                            <option value="founder">Founder</option>
                            <option value="ceo">Co-Founder &amp; CEO</option>
                            <option value="director">Director</option>
                            <option value="executive">Executive</option>
                            <option value="administrator">Administrator</option>
                            <option value="content_manager">Content Manager</option>
                            <option value="support_manager">Support Manager</option>
                          </select>
                        </div>
                        {editRole === 'super_admin' && (
                          <div className="sm:col-span-2">
                            <label className="block font-medium text-slate-700">Designation</label>
                            <select
                              value={editLeadershipRole}
                              onChange={(e) =>
                                setEditLeadershipRole(e.target.value as LeadershipRole)
                              }
                              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs"
                            >
                              <option value="super_admin">Super Admin</option>
                              <option value="ceo">Co-Founder &amp; CEO</option>
                              <option value="founder">Founder</option>
                              <option value="director">Director</option>
                              <option value="executive">Executive</option>
                              <option value="administrator">Administrator</option>
                              <option value="none">None</option>
                            </select>
                          </div>
                        )}
                        <div
                          className={`flex items-end ${
                            editRole === 'super_admin' ? 'sm:col-span-2' : 'sm:col-span-4'
                          }`}
                        >
                          <button
                            type="submit"
                            disabled={savingEdit}
                            className="w-full rounded-lg bg-[#0F8A5F] px-3 py-1.5 font-semibold text-white hover:bg-[#0B5D4B] disabled:opacity-50"
                          >
                            {savingEdit ? 'Saving...' : 'Save Changes'}
                          </button>
                        </div>
                      </form>
                    )}

                    {isLeadershipMember && member.role !== 'super_admin' && (
                      <div className="mt-4 border-t border-slate-100 pt-3">
                        <div className="mb-2 flex items-center justify-between">
                          <span className="font-medium text-slate-700">
                            Assigned Permissions (
                            {member.customPermissions ? 'Custom' : 'Role Default'})
                          </span>
                          {member.customPermissions && (
                            <button
                              type="button"
                              onClick={() =>
                                handleUpdateDesignation(member, { customPermissions: false })
                              }
                              className="text-[11px] font-medium text-[#0F4C5C] hover:underline"
                            >
                              Reset to Role Defaults
                            </button>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                          {editablePerms.map((perm) => {
                            const checked = member.permissions.includes(perm);
                            return (
                              <label
                                key={perm}
                                className="inline-flex items-center gap-2 rounded border border-slate-200 px-2.5 py-1.5 text-[11px] text-slate-700 hover:bg-slate-50"
                              >
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={() => handleTogglePermission(member, perm)}
                                />
                                <span className="truncate">{PERMISSION_LABELS[perm]}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Login Attempts Audit Log */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="text-sm font-semibold text-[#092F35]">
            Authentication &amp; Login Attempt History
          </h2>
        </div>

        {historyLoading ? (
          <div className="p-5">
            <div className="h-24 animate-pulse rounded bg-slate-100" />
          </div>
        ) : loginHistory.length === 0 ? (
          <p className="p-5 text-xs text-slate-500">No authentication events recorded yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Event</th>
                  <th className="px-4 py-3 font-medium">Account</th>
                  <th className="px-4 py-3 font-medium">Details</th>
                  <th className="px-4 py-3 font-medium">IP Address</th>
                  <th className="px-4 py-3 text-right font-medium">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loginHistory.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/70">
                    <td className="px-4 py-2.5 font-medium text-[#092F35]">
                      {row.action.replace(/_/g, ' ')}
                    </td>
                    <td className="px-4 py-2.5 text-slate-700">{row.actor_email}</td>
                    <td className="px-4 py-2.5 font-mono text-[11px] text-slate-500">
                      {row.details_json}
                    </td>
                    <td className="px-4 py-2.5 font-mono text-[11px] text-slate-500 tabular-nums">
                      {row.ip_address || '—'}
                    </td>
                    <td className="px-4 py-2.5 text-right text-slate-500 tabular-nums whitespace-nowrap">
                      {formatAdminDate(row.created_at)}
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
