import React, { useEffect, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react';
import { BRAND_ASSETS } from '../../config/brandAssets';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { usePageSeo } from '../../hooks/usePageSeo';
import { ApiError, adminApi, type AdminUser } from '../../services/cmsApi';
import { leadershipApi, type LeadershipSelectableRole } from '../../services/leadershipApi';

type AuthStep = 'select_role' | 'credentials' | 'forgot' | 'reset';

const ROLE_OPTIONS: {
  id: LeadershipSelectableRole;
  title: string;
  subtitle: string;
  scope: string;
}[] = [
  {
    id: 'super_admin',
    title: 'Super Admin',
    subtitle: 'Full Platform Governance & Executive Controls',
    scope: 'Executive account management, role permissions, security audit logs, and full workspace access.',
  },
  {
    id: 'founder',
    title: 'Founder',
    subtitle: 'Executive Oversight & Business Vision',
    scope: 'Business reports, confidential documents, partnerships, and strategic oversight.',
  },
  {
    id: 'ceo',
    title: 'Co-Founder & CEO',
    subtitle: 'Product Leadership, Strategy & Operations',
    scope: 'Product roadmap, marketing, app testing, reports, documents, and website publishing.',
  },
  {
    id: 'director',
    title: 'Director',
    subtitle: 'Department Governance & Strategic Reporting',
    scope: 'Executive briefings, business reports, confidential documents, and partnership reviews.',
  },
  {
    id: 'executive',
    title: 'Executive',
    subtitle: 'Leadership Visibility & Briefings',
    scope: 'Company overview, progress trackers, business reports, and authorised leadership documents.',
  },
  {
    id: 'administrator',
    title: 'Administrator',
    subtitle: 'Operations, Publishing & Enquiries',
    scope: 'Announcements, website publishing, partnership enquiries, and operational oversight.',
  },
];

export const LeadershipAccessPage: React.FC = () => {
  const {
    user,
    loading,
    needsInitialSetup,
    sessionNotice,
    authError,
    setAuthenticatedUser,
    clearSessionNotice,
  } = useAdminAuth();
  usePageSeo({
    title: 'Private Leadership Access | MAATA Technologies',
    description: 'Authorised executive sign-in portal for MAATA Technologies leadership.',
    noIndex: true,
  });
  const navigate = useNavigate();
  const location = useLocation();
  const locationState =
    (location.state as {
      from?: string;
      authNotice?: string;
      setupSuccess?: string;
      prefillEmail?: string;
      prefillRole?: LeadershipSelectableRole;
    } | null) || null;

  const [step, setStep] = useState<AuthStep>('select_role');
  const [selectedRole, setSelectedRole] = useState<LeadershipSelectableRole | null>(
    locationState?.prefillRole || null
  );

  const [email, setEmail] = useState(locationState?.prefillEmail || '');
  const [password, setPassword] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [mfaRequired, setMfaRequired] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [resetEmail, setResetEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [devPreviewToken, setDevPreviewToken] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState(locationState?.setupSuccess || '');
  const [routeNotice, setRouteNotice] = useState(locationState?.authNotice || '');
  const [leadershipVerified, setLeadershipVerified] = useState(false);

  useEffect(() => {
    if (locationState?.authNotice) {
      setRouteNotice(locationState.authNotice);
    }
    if (locationState?.setupSuccess) {
      setInfo(locationState.setupSuccess);
    }
    if (locationState?.prefillEmail) {
      setEmail(locationState.prefillEmail);
    }
  }, [locationState?.authNotice, locationState?.setupSuccess, locationState?.prefillEmail]);

  useEffect(() => {
    if (!user) {
      setLeadershipVerified(false);
      return;
    }
    const hasPortalClearance =
      user.role === 'founder' ||
      user.role === 'ceo' ||
      user.role === 'director' ||
      user.role === 'executive' ||
      user.role === 'administrator' ||
      (user.role === 'super_admin' && Boolean(user.leadershipRole && user.leadershipRole !== 'none'));
    setLeadershipVerified(hasPortalClearance);
  }, [user]);

  const targetDestination =
    locationState?.from &&
    locationState.from.startsWith('/leadership') &&
    locationState.from !== '/leadership/access'
      ? locationState.from
      : '/leadership';

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#092F35] text-[#F7F4EC]">
        <p className="text-sm text-[#F7F4EC]/75">Checking Private Leadership session...</p>
      </div>
    );
  }

  if (leadershipVerified) {
    return <Navigate to={targetDestination} replace />;
  }

  const activeNotice = error || routeNotice || sessionNotice || authError || '';

  const dismissNotices = () => {
    setError('');
    setRouteNotice('');
    clearSessionNotice();
  };

  const handleSelectRole = (role: LeadershipSelectableRole) => {
    setSelectedRole(role);
    dismissNotices();
    setMfaRequired(false);
    setTotpCode('');
    setStep('credentials');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRole) return;
    dismissNotices();
    setInfo('');
    setSubmitting(true);
    try {
      const res = await leadershipApi.login({
        selectedRole,
        email: email.trim(),
        password,
        totpCode: mfaRequired ? totpCode.trim() : undefined,
      });
      if (res.mfaRequired) {
        setMfaRequired(true);
        setInfo(res.message || 'Enter the 6-digit verification code from your authenticator app.');
        return;
      }

      // Immediately confirm the browser stored & sent the session cookie back before navigating
      let verified: { user: AdminUser };
      try {
        verified = await leadershipApi.me();
      } catch (verifyErr: unknown) {
        if (verifyErr instanceof ApiError && verifyErr.status === 401) {
          setError(
            'Your credentials were verified, but your browser did not retain the session cookie for this preview. Please allow cookies for this site or open the portal directly in a dedicated tab.'
          );
          return;
        }
        throw verifyErr;
      }

      setAuthenticatedUser(verified.user);
      navigate(targetDestination, { replace: true });
    } catch (err: any) {
      setError(err?.message || 'Unable to verify Private Leadership credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfo('');
    setDevPreviewToken('');
    setSubmitting(true);
    try {
      const res = await adminApi.forgotPassword(resetEmail.trim());
      setInfo(res.message);
      if (res.devPreviewToken) {
        setDevPreviewToken(res.devPreviewToken);
        setResetToken(res.devPreviewToken);
      }
      setStep('reset');
    } catch (err: any) {
      setError(err?.message || 'Unable to request password reset.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfo('');
    setSubmitting(true);
    try {
      const res = await adminApi.resetPassword({
        token: resetToken.trim(),
        newPassword,
      });
      setInfo(res.message);
      setPassword('');
      setNewPassword('');
      setResetToken('');
      setDevPreviewToken('');
      setStep('credentials');
    } catch (err: any) {
      setError(err?.message || 'Unable to reset password.');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedMeta = ROLE_OPTIONS.find((r) => r.id === selectedRole) || null;

  return (
    <div className="min-h-screen bg-[#092F35] text-[#F7F4EC] flex flex-col justify-between px-6 py-10">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-medium text-[#F7F4EC]/70 hover:text-[#FFD84A] transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Return to Public Website</span>
        </Link>

        <div className="flex items-center gap-2 text-xs text-[#F7F4EC]/60">
          <Lock className="h-3.5 w-3.5 text-[#FFD84A]" aria-hidden="true" />
          <span>MAATA TECHNOLOGIES · Encrypted Session</span>
        </div>
      </header>

      <main className="mx-auto my-auto w-full max-w-5xl py-10">
        <div className="flex flex-col items-center text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-white/15 bg-white p-2">
            <img
              src={BRAND_ASSETS.logo.src}
              alt={BRAND_ASSETS.logo.alt}
              className="h-full w-full object-contain"
            />
          </div>
          <p className="mt-5 text-xs font-medium tracking-[0.16em] uppercase text-[#FFD84A]">
            MAATA TECHNOLOGIES · Executive Portal
          </p>
          <h1 className="font-editorial mt-2.5 text-3xl sm:text-4xl font-semibold tracking-tight text-white">
            Private Leadership Access
          </h1>
          <p className="mt-3 max-w-lg text-sm leading-relaxed text-[#F7F4EC]/75">
            Restricted workspace for authorised MAATA Technologies leadership. Select your assigned
            executive role and sign in with your verified credentials.
          </p>
        </div>

        {needsInitialSetup ? (
          <div className="mx-auto mt-10 max-w-xl rounded-xl border border-white/15 bg-[#0A3A47] p-6 sm:p-8 text-center">
            <ShieldCheck className="mx-auto h-7 w-7 text-[#FFD84A]" aria-hidden="true" />
            <h2 className="mt-3 text-lg font-semibold text-white">
              Initial Administrator Setup Required
            </h2>
            <p className="mt-2 mx-auto max-w-md text-sm leading-relaxed text-[#F7F4EC]/75">
              No executive or Super Admin account has been registered yet. Complete the one-time
              initial administrator setup before signing into Private Leadership Access.
            </p>
            <div className="mt-6">
              <Link
                to="/leadership/setup"
                className="inline-flex items-center gap-2 rounded-lg bg-[#FFD84A] px-5 py-2.5 text-sm font-semibold text-[#092F35] hover:bg-[#ffe16f] transition-colors"
              >
                <span>Complete Initial Setup</span>
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          </div>
        ) : step === 'select_role' ? (
          <div className="mt-10">
            {info && (
              <div className="mb-6 rounded-xl border border-emerald-400/35 bg-emerald-950/45 px-4 py-3 text-xs text-emerald-100">
                {info}
              </div>
            )}

            {activeNotice && (
              <div
                role="alert"
                className="mb-6 flex items-start gap-2.5 rounded-xl border border-amber-400/35 bg-amber-950/45 px-4 py-3 text-xs text-amber-100"
              >
                <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-[#FFD84A]" aria-hidden="true" />
                <span>{activeNotice}</span>
              </div>
            )}

            {user && !leadershipVerified && (
              <div className="mb-6 rounded-xl border border-amber-400/30 bg-amber-950/40 px-4 py-3 text-xs text-amber-100">
                Currently signed in as <strong>{user.email}</strong> ({user.role.replace(/_/g, ' ')}
                ), which does not have Private Leadership Access. Authenticate below with an
                authorised executive account.
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {ROLE_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => handleSelectRole(option.id)}
                  className="group flex flex-col justify-between rounded-xl border border-white/14 bg-[#0A3A47]/80 p-5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-[#FFD84A]/65 hover:bg-[#0F4C5C]/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFD84A]"
                >
                  <div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-[#FFD84A]">
                        Executive Role
                      </span>
                      <Lock
                        className="h-4 w-4 text-[#F7F4EC]/45 transition-colors group-hover:text-[#FFD84A]"
                        aria-hidden="true"
                      />
                    </div>
                    <h2 className="mt-2.5 text-lg font-semibold text-white">{option.title}</h2>
                    <p className="mt-1 text-xs font-medium text-[#F7F4EC]/80">{option.subtitle}</p>
                    <p className="mt-3.5 border-t border-white/10 pt-3.5 text-xs leading-relaxed text-[#F7F4EC]/65">
                      {option.scope}
                    </p>
                  </div>

                  <div className="mt-5 flex items-center gap-2 text-xs font-semibold text-[#FFD84A]">
                    <span>Continue as {option.title}</span>
                    <ArrowRight
                      className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5"
                      aria-hidden="true"
                    />
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="mx-auto mt-10 max-w-md overflow-hidden rounded-xl border border-white/15 bg-white text-[#092F35]">
            <div className="flex items-center justify-between border-b border-slate-200 bg-[#F7F4EC] px-6 py-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#0F8A5F]">
                  {selectedMeta ? selectedMeta.title : 'Executive Access'}
                </p>
                <h2 className="text-base font-semibold text-[#092F35]">
                  {step === 'credentials'
                    ? 'Verify Executive Credentials'
                    : step === 'forgot'
                      ? 'Request Password Reset'
                      : 'Reset Account Password'}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => {
                  setStep('select_role');
                  setError('');
                  setInfo('');
                  setMfaRequired(false);
                }}
                className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                Change Role
              </button>
            </div>

            <div className="p-6">
              {activeNotice && (
                <div
                  role="alert"
                  className="mb-4 flex items-start gap-2.5 rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs text-rose-800"
                >
                  <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>{activeNotice}</span>
                </div>
              )}

              {info && (
                <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-xs text-emerald-900">
                  {info}
                </div>
              )}

              {devPreviewToken && step === 'reset' && (
                <div className="mb-4 rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs text-amber-950">
                  <p className="font-semibold">Development Reset Token Preview</p>
                  <p className="mt-1 break-all font-mono text-[11px]">{devPreviewToken}</p>
                </div>
              )}

              {step === 'credentials' ? (
                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <label
                      htmlFor="leadership-email"
                      className="block text-xs font-medium text-slate-700"
                    >
                      Registered Executive Email
                    </label>
                    <input
                      id="leadership-email"
                      type="email"
                      required
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@domain.com"
                      className="mt-1 w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-[#092F35] focus:border-[#0F4C5C] focus:outline-none"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between">
                      <label
                        htmlFor="leadership-password"
                        className="block text-xs font-medium text-slate-700"
                      >
                        Password
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setError('');
                          setInfo('');
                          setResetEmail(email);
                          setStep('forgot');
                        }}
                        className="text-xs font-medium text-[#0F4C5C] hover:underline"
                      >
                        Reset password
                      </button>
                    </div>
                    <div className="relative mt-1">
                      <input
                        id="leadership-password"
                        type={showPassword ? 'text' : 'password'}
                        required
                        autoComplete="current-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 pr-10 text-sm text-[#092F35] focus:border-[#0F4C5C] focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((s) => !s)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {mfaRequired && (
                    <div>
                      <label
                        htmlFor="leadership-totp"
                        className="block text-xs font-medium text-slate-700"
                      >
                        Two-Factor Verification Code (6 digits)
                      </label>
                      <input
                        id="leadership-totp"
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]{6}"
                        maxLength={6}
                        required
                        autoFocus
                        value={totpCode}
                        onChange={(e) => setTotpCode(e.target.value)}
                        placeholder="000000"
                        className="mt-1 w-full rounded-lg border border-slate-300 px-3.5 py-2.5 font-mono text-sm tracking-[0.25em] text-[#092F35] focus:border-[#0F4C5C] focus:outline-none"
                      />
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#092F35] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0F4C5C] disabled:opacity-50"
                  >
                    <Lock className="h-4 w-4" aria-hidden="true" />
                    <span>
                      {submitting
                        ? 'Verifying...'
                        : mfaRequired
                          ? 'Verify Code & Enter Workspace'
                          : `Sign In as ${selectedMeta?.title}`}
                    </span>
                  </button>
                </form>
              ) : step === 'forgot' ? (
                <form onSubmit={handleForgotSubmit} className="space-y-4">
                  <p className="text-xs leading-relaxed text-slate-600">
                    Enter your registered leadership email to generate a time-limited password reset
                    token on the server.
                  </p>
                  <div>
                    <label
                      htmlFor="leadership-reset-email"
                      className="block text-xs font-medium text-slate-700"
                    >
                      Registered Email
                    </label>
                    <input
                      id="leadership-reset-email"
                      type="email"
                      required
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm focus:border-[#0F4C5C] focus:outline-none"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#092F35] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#0F4C5C] disabled:opacity-50"
                  >
                    <KeyRound className="h-4 w-4" aria-hidden="true" />
                    <span>{submitting ? 'Requesting...' : 'Request Password Reset'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep('credentials')}
                    className="block w-full text-center text-xs font-medium text-slate-600 hover:underline"
                  >
                    Back to Sign In
                  </button>
                </form>
              ) : (
                <form onSubmit={handleResetSubmit} className="space-y-4">
                  <div>
                    <label
                      htmlFor="leadership-reset-token"
                      className="block text-xs font-medium text-slate-700"
                    >
                      Reset Token
                    </label>
                    <input
                      id="leadership-reset-token"
                      type="text"
                      required
                      value={resetToken}
                      onChange={(e) => setResetToken(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-slate-300 px-3.5 py-2.5 font-mono text-xs focus:border-[#0F4C5C] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="leadership-new-password"
                      className="block text-xs font-medium text-slate-700"
                    >
                      New Password (min 10 chars, upper, lower, digit)
                    </label>
                    <input
                      id="leadership-new-password"
                      type="password"
                      required
                      minLength={10}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm focus:border-[#0F4C5C] focus:outline-none"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#0F8A5F] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#0B5D4B] disabled:opacity-50"
                  >
                    <KeyRound className="h-4 w-4" aria-hidden="true" />
                    <span>{submitting ? 'Updating...' : 'Update Password'}</span>
                  </button>
                </form>
              )}
            </div>
          </div>
        )}
      </main>

      <footer className="mx-auto flex w-full max-w-4xl items-center justify-between border-t border-white/10 pt-5 text-[11px] text-[#F7F4EC]/55">
        <span className="inline-flex items-center gap-1.5">
          <Building2 className="h-3.5 w-3.5" aria-hidden="true" />
          <span>MAATA TECHNOLOGIES · Chittoor, Andhra Pradesh</span>
        </span>
        <span>All authentication attempts are recorded in the security audit log.</span>
      </footer>
    </div>
  );
};
