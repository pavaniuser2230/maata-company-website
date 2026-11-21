import React, { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { ArrowLeft, Eye, EyeOff, KeyRound, Lock, ShieldAlert, UserPlus } from 'lucide-react';
import { BRAND_ASSETS } from '../../config/brandAssets';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { usePageSeo } from '../../hooks/usePageSeo';
import { adminApi, type LeadershipRole } from '../../services/cmsApi';

type AuthMode = 'login' | 'forgot' | 'reset';

export const AdminLoginPage: React.FC = () => {
  const { user, loading, needsInitialSetup, requiresSetupToken, login, setupInitialAdmin } =
    useAdminAuth();
  usePageSeo({
    title: 'Administrator Sign In | MAATA Technologies',
    description: 'Private administrator sign-in for MAATA Technologies CMS.',
    noIndex: true,
  });
  const navigate = useNavigate();

  const [mode, setMode] = useState<AuthMode>('login');
  const [name, setName] = useState('');
  const [leadershipRole, setLeadershipRole] = useState<LeadershipRole>('ceo');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [setupToken, setSetupToken] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [mfaStep, setMfaStep] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [resetEmail, setResetEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [devPreviewToken, setDevPreviewToken] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#092F35] text-white">
        <p className="text-sm text-white/80">Loading MAATA Admin Portal...</p>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/admin" replace />;
  }

  const handleSetupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (requiresSetupToken && !setupToken.trim()) {
      setError('Enter the server-side Setup Authorization Key configured for this environment.');
      return;
    }
    setSubmitting(true);
    try {
      await setupInitialAdmin(name.trim(), email.trim(), password, leadershipRole, {
        confirmPassword,
        setupToken: requiresSetupToken ? setupToken.trim() : undefined,
        autoSignIn: false,
      });
      navigate('/leadership/access', {
        replace: true,
        state: {
          setupSuccess:
            'Initial Super Admin account created. Public setup is now permanently locked. Sign in with your verified credentials.',
          prefillEmail: email.trim().toLowerCase(),
        },
      });
    } catch (err: any) {
      setError(err?.message || 'Unable to create initial Super Admin.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfoMessage('');
    setSubmitting(true);
    try {
      const res = await login(email.trim(), password, mfaStep ? totpCode.trim() : undefined);
      if (res.mfaRequired) {
        setMfaStep(true);
        setInfoMessage(res.message || 'Enter your 6-digit authenticator verification code.');
        return;
      }
      navigate('/admin', { replace: true });
    } catch (err: any) {
      setError(err?.message || 'Invalid email or password.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfoMessage('');
    setDevPreviewToken('');
    setSubmitting(true);
    try {
      const res = await adminApi.forgotPassword(resetEmail.trim());
      setInfoMessage(res.message);
      if (res.devPreviewToken) {
        setDevPreviewToken(res.devPreviewToken);
        setResetToken(res.devPreviewToken);
      }
      setMode('reset');
    } catch (err: any) {
      setError(err?.message || 'Unable to request password reset.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfoMessage('');
    setSubmitting(true);
    try {
      const res = await adminApi.resetPassword({
        token: resetToken.trim(),
        newPassword,
      });
      setInfoMessage(res.message);
      setPassword('');
      setNewPassword('');
      setResetToken('');
      setDevPreviewToken('');
      setMode('login');
    } catch (err: any) {
      setError(err?.message || 'Unable to reset password.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col justify-center bg-[#F7F4EC] px-4 py-12 text-[#092F35]">
      <div className="mx-auto w-full max-w-md">
        <div className="mb-6 flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-[#0F4C5C] hover:text-[#092F35]"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to MAATA Public Website</span>
          </Link>
        </div>

        <div className="overflow-hidden rounded-2xl border border-[#092F35]/15 bg-white shadow-sm">
          <div className="border-b border-[#092F35]/10 bg-[#092F35] px-6 py-6 text-white">
            <div className="flex items-center gap-3.5">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white p-1.5">
                <img
                  src={BRAND_ASSETS.logo.src}
                  alt={BRAND_ASSETS.logo.alt}
                  className="h-full w-full object-contain"
                />
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#FFD84A]">
                  MAATA Technologies
                </p>
                <h1 className="text-lg font-semibold">
                  {needsInitialSetup
                    ? 'Initial Super Admin Setup'
                    : mode === 'login'
                      ? 'Admin CMS Sign In'
                      : mode === 'forgot'
                        ? 'Reset Admin Password'
                        : 'Set New Password'}
                </h1>
              </div>
            </div>
          </div>

          <div className="p-6">
            {error && (
              <div
                role="alert"
                className="mb-4 flex items-start gap-2.5 rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-sm text-rose-800"
              >
                <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {infoMessage && (
              <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-sm text-emerald-900">
                {infoMessage}
              </div>
            )}

            {devPreviewToken && (
              <div className="mb-4 rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs text-amber-950">
                <p className="font-semibold">Development Reset Token Preview</p>
                <p className="mt-1 break-all font-mono text-[11px]">{devPreviewToken}</p>
              </div>
            )}

            {needsInitialSetup ? (
              <form onSubmit={handleSetupSubmit} className="space-y-4">
                <p className="rounded-lg border border-[#0F8A5F]/25 bg-[#F7F4EC] p-3 text-xs leading-relaxed text-slate-700">
                  Register the primary <strong>MAATA Technologies Super Admin</strong> account. This
                  one-time setup permanently locks public registration once completed.
                </p>

                <div>
                  <label className="block text-xs font-medium text-slate-700" htmlFor="setup-name">
                    Full Name
                  </label>
                  <input
                    id="setup-name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter executive full name"
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm focus:border-[#0F4C5C] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700" htmlFor="setup-leadership-role">
                    Executive Leadership Designation
                  </label>
                  <select
                    id="setup-leadership-role"
                    value={leadershipRole}
                    onChange={(e) => setLeadershipRole(e.target.value as LeadershipRole)}
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm focus:border-[#0F4C5C] focus:outline-none"
                  >
                    <option value="super_admin">Super Admin</option>
                    <option value="ceo">Co-Founder &amp; CEO</option>
                    <option value="founder">Founder</option>
                    <option value="director">Director</option>
                    <option value="executive">Executive</option>
                    <option value="administrator">Administrator</option>
                    <option value="none">CMS Administrator Only</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700" htmlFor="setup-email">
                    Official Email
                  </label>
                  <input
                    id="setup-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="executive@maataapp.com"
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm focus:border-[#0F4C5C] focus:outline-none"
                  />
                </div>

                {requiresSetupToken && (
                  <div>
                    <label className="block text-xs font-medium text-slate-700" htmlFor="setup-token">
                      Server Setup Authorization Key
                    </label>
                    <input
                      id="setup-token"
                      type="password"
                      required
                      value={setupToken}
                      onChange={(e) => setSetupToken(e.target.value)}
                      placeholder="Enter configured setup key"
                      className="mt-1 w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm focus:border-[#0F4C5C] focus:outline-none"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium text-slate-700" htmlFor="setup-pw">
                    Password (min 10 chars, uppercase, lowercase, digit)
                  </label>
                  <div className="relative mt-1">
                    <input
                      id="setup-pw"
                      type={showPassword ? 'text' : 'password'}
                      required
                      minLength={10}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 pr-10 text-sm focus:border-[#0F4C5C] focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((s) => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700" htmlFor="setup-pw2">
                    Confirm Password
                  </label>
                  <input
                    id="setup-pw2"
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={10}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm focus:border-[#0F4C5C] focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#0F8A5F] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0B5D4B] disabled:opacity-50"
                >
                  <UserPlus className="h-4 w-4" />
                  <span>{submitting ? 'Creating Super Admin...' : 'Create Super Admin & Continue'}</span>
                </button>
              </form>
            ) : mode === 'login' ? (
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700" htmlFor="login-email">
                    Admin Email
                  </label>
                  <input
                    id="login-email"
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@maataapp.com"
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm focus:border-[#0F4C5C] focus:outline-none"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-medium text-slate-700" htmlFor="login-pw">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setError('');
                        setInfoMessage('');
                        setResetEmail(email);
                        setMode('forgot');
                      }}
                      className="text-xs font-medium text-[#0F4C5C] hover:underline"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative mt-1">
                    <input
                      id="login-pw"
                      type={showPassword ? 'text' : 'password'}
                      required
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 pr-10 text-sm focus:border-[#0F4C5C] focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((s) => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {mfaStep && (
                  <div>
                    <label className="block text-xs font-medium text-slate-700" htmlFor="login-totp">
                      Authenticator Verification Code (2FA)
                    </label>
                    <input
                      id="login-totp"
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]{6}"
                      maxLength={6}
                      required
                      value={totpCode}
                      onChange={(e) => setTotpCode(e.target.value)}
                      placeholder="6-digit code"
                      className="mt-1 w-full rounded-lg border border-slate-300 px-3.5 py-2.5 font-mono text-sm tracking-widest focus:border-[#0F4C5C] focus:outline-none"
                    />
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#092F35] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0F4C5C] disabled:opacity-50"
                >
                  <Lock className="h-4 w-4" />
                  <span>
                    {submitting
                      ? 'Verifying...'
                      : mfaStep
                        ? 'Verify Code & Sign In'
                        : 'Sign In to Admin Console'}
                  </span>
                </button>
              </form>
            ) : mode === 'forgot' ? (
              <form onSubmit={handleForgotSubmit} className="space-y-4">
                <p className="text-xs leading-relaxed text-slate-600">
                  Enter your registered administrator email address to generate a time-limited
                  password reset token.
                </p>
                <div>
                  <label className="block text-xs font-medium text-slate-700" htmlFor="reset-email">
                    Registered Admin Email
                  </label>
                  <input
                    id="reset-email"
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
                  <KeyRound className="h-4 w-4" />
                  <span>{submitting ? 'Requesting token...' : 'Request Password Reset'}</span>
                </button>
                <div className="flex items-center justify-between text-xs">
                  <button
                    type="button"
                    onClick={() => setMode('reset')}
                    className="font-medium text-[#0F4C5C] hover:underline"
                  >
                    Already have a token?
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode('login')}
                    className="font-medium text-slate-600 hover:underline"
                  >
                    Back to Sign In
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleResetSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700" htmlFor="reset-token">
                    Reset Token
                  </label>
                  <input
                    id="reset-token"
                    type="text"
                    required
                    value={resetToken}
                    onChange={(e) => setResetToken(e.target.value)}
                    placeholder="Paste reset token"
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3.5 py-2.5 font-mono text-xs focus:border-[#0F4C5C] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700" htmlFor="new-pw">
                    New Password (min 10 chars, upper, lower, digit)
                  </label>
                  <input
                    id="new-pw"
                    type={showPassword ? 'text' : 'password'}
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
                  <KeyRound className="h-4 w-4" />
                  <span>{submitting ? 'Updating password...' : 'Confirm Password Reset'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="block w-full text-center text-xs font-medium text-slate-600 hover:underline"
                >
                  Back to Sign In
                </button>
              </form>
            )}
          </div>
        </div>

        <p className="mt-4 text-center text-[11px] text-slate-500">
          Authorised MAATA Technologies staff only. All actions are recorded in the server audit log.
        </p>
      </div>
    </div>
  );
};
