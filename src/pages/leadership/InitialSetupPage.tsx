import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Check,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  ShieldAlert,
  ShieldCheck,
  UserPlus,
} from 'lucide-react';
import { BRAND_ASSETS } from '../../config/brandAssets';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { usePageSeo } from '../../hooks/usePageSeo';
import type { LeadershipSelectableRole } from '../../services/cmsApi';

const DESIGNATION_OPTIONS: { value: LeadershipSelectableRole; label: string }[] = [
  { value: 'super_admin', label: 'Super Admin' },
  { value: 'ceo', label: 'Co-Founder & CEO' },
  { value: 'founder', label: 'Founder' },
  { value: 'director', label: 'Director' },
  { value: 'executive', label: 'Executive' },
  { value: 'administrator', label: 'Administrator' },
];

export const InitialSetupPage: React.FC = () => {
  const { loading, needsInitialSetup, requiresSetupToken, setupInitialAdmin, refreshSession } =
    useAdminAuth();
  usePageSeo({
    title: 'Initial Administrator Setup | MAATA Technologies',
    description: 'One-time Super Admin registration for MAATA Technologies.',
    noIndex: true,
  });
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [leadershipRole, setLeadershipRole] = useState<LeadershipSelectableRole>('ceo');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [setupToken, setSetupToken] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const hasMinLen = password.length >= 10;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasDigit = /[0-9]/.test(password);
  const passwordsMatch = password.length > 0 && password === confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();

    if (trimmedName.length < 2) {
      setError('Please enter your full name (at least 2 characters).');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setError('Please enter a valid official email address.');
      return;
    }
    if (!hasMinLen || !hasUpper || !hasLower || !hasDigit) {
      setError('Password must be at least 10 characters and include uppercase, lowercase, and numeric characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Password and password confirmation do not match.');
      return;
    }
    if (requiresSetupToken && !setupToken.trim()) {
      setError('Enter the server-side Setup Authorization Key configured for this environment.');
      return;
    }

    setSubmitting(true);
    try {
      await setupInitialAdmin(trimmedName, trimmedEmail, password, leadershipRole, {
        confirmPassword,
        setupToken: requiresSetupToken ? setupToken.trim() : undefined,
        autoSignIn: false,
      });
      await refreshSession();
      navigate('/leadership/access', {
        replace: true,
        state: {
          setupSuccess:
            'Initial Super Admin account registered. Public setup is now permanently locked. Sign in below with your verified credentials.',
          prefillEmail: trimmedEmail.toLowerCase(),
          prefillRole: leadershipRole,
        },
      });
    } catch (err: any) {
      setError(err?.message || 'Unable to complete initial Super Admin registration.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#092F35] text-[#F7F4EC]">
        <p className="text-sm text-[#F7F4EC]/75">Checking initial setup status...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col justify-between bg-[#092F35] px-6 py-10 text-[#F7F4EC]">
      <header className="mx-auto flex w-full max-w-4xl items-center justify-between">
        <Link
          to="/leadership/access"
          className="inline-flex items-center gap-2 text-xs font-medium text-[#F7F4EC]/75 transition-colors hover:text-[#FFD84A]"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Back to Private Leadership Access</span>
        </Link>

        <div className="flex items-center gap-2 text-xs text-[#F7F4EC]/60">
          <Lock className="h-3.5 w-3.5 text-[#FFD84A]" aria-hidden="true" />
          <span>MAATA TECHNOLOGIES · One-Time Provisioning</span>
        </div>
      </header>

      <main className="mx-auto my-auto w-full max-w-lg py-10">
        <div className="flex flex-col items-center text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-white/15 bg-white p-2">
            <img
              src={BRAND_ASSETS.logo.src}
              alt={BRAND_ASSETS.logo.alt}
              className="h-full w-full object-contain"
            />
          </div>
          <p className="mt-5 text-xs font-medium uppercase tracking-[0.16em] text-[#FFD84A]">
            MAATA TECHNOLOGIES · Governance Setup
          </p>
          <h1 className="font-editorial mt-2 text-3xl font-semibold tracking-tight text-white">
            Initial Super Admin Setup
          </h1>
          <p className="mt-2.5 max-w-md text-sm leading-relaxed text-[#F7F4EC]/75">
            Register the primary Super Admin account for MAATA Technologies. This setup runs once
            and permanently locks public registration immediately upon completion.
          </p>
        </div>

        {!needsInitialSetup ? (
          <div className="mt-8 rounded-xl border border-white/15 bg-[#0A3A47] p-6 text-center sm:p-8">
            <ShieldCheck className="mx-auto h-8 w-8 text-[#FFD84A]" aria-hidden="true" />
            <h2 className="mt-3 text-lg font-semibold text-white">
              Initial Setup Permanently Locked
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-[#F7F4EC]/75">
              A Super Admin account has already been configured for MAATA Technologies. Additional
              executive accounts can only be created from inside the authenticated Leadership
              Settings dashboard.
            </p>
            <div className="mt-6">
              <Link
                to="/leadership/access"
                className="inline-flex items-center gap-2 rounded-lg bg-[#FFD84A] px-5 py-2.5 text-sm font-semibold text-[#092F35] transition-colors hover:bg-[#ffe16f]"
              >
                <span>Go to Private Leadership Login</span>
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          </div>
        ) : (
          <div className="mt-8 overflow-hidden rounded-xl border border-white/15 bg-white text-[#092F35] shadow-sm">
            <div className="border-b border-slate-200 bg-[#F7F4EC] px-6 py-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#0F8A5F]">
                One-Time Executive Provisioning
              </p>
              <h2 className="mt-0.5 text-base font-semibold text-[#092F35]">
                Register Primary Super Admin Account
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 p-6" noValidate>
              {error && (
                <div
                  role="alert"
                  className="flex items-start gap-2.5 rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs text-rose-800"
                >
                  <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label
                  htmlFor="initial-setup-name"
                  className="block text-xs font-medium text-slate-700"
                >
                  Full Name *
                </label>
                <input
                  id="initial-setup-name"
                  type="text"
                  required
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter executive full name"
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-[#092F35] focus:border-[#0F4C5C] focus:outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="initial-setup-email"
                  className="block text-xs font-medium text-slate-700"
                >
                  Official Email *
                </label>
                <input
                  id="initial-setup-email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="executive@maataapp.com"
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-[#092F35] focus:border-[#0F4C5C] focus:outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="initial-setup-designation"
                  className="block text-xs font-medium text-slate-700"
                >
                  Executive Designation (Paired with Super Admin Authority) *
                </label>
                <select
                  id="initial-setup-designation"
                  value={leadershipRole}
                  onChange={(e) => setLeadershipRole(e.target.value as LeadershipSelectableRole)}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-[#092F35] focus:border-[#0F4C5C] focus:outline-none"
                >
                  {DESIGNATION_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-[11px] text-slate-500">
                  Assigns full Super Admin privileges alongside your primary leadership designation.
                </p>
              </div>

              {requiresSetupToken && (
                <div>
                  <label
                    htmlFor="initial-setup-token"
                    className="flex items-center gap-1.5 text-xs font-medium text-slate-700"
                  >
                    <KeyRound className="h-3.5 w-3.5 text-[#0F8A5F]" aria-hidden="true" />
                    <span>Server Setup Authorization Key *</span>
                  </label>
                  <input
                    id="initial-setup-token"
                    type="password"
                    required
                    value={setupToken}
                    onChange={(e) => setSetupToken(e.target.value)}
                    placeholder="Enter server-configured setup key"
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-[#092F35] focus:border-[#0F4C5C] focus:outline-none"
                  />
                </div>
              )}

              <div>
                <label
                  htmlFor="initial-setup-password"
                  className="block text-xs font-medium text-slate-700"
                >
                  Password *
                </label>
                <div className="relative mt-1">
                  <input
                    id="initial-setup-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="new-password"
                    minLength={10}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimum 10 characters"
                    className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 pr-10 text-sm text-[#092F35] focus:border-[#0F4C5C] focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>

                <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-[11px]">
                  <span className={hasMinLen ? 'text-[#0F8A5F] font-medium' : 'text-slate-500'}>
                    <Check className="mr-1 inline h-3 w-3" aria-hidden="true" />
                    10+ characters
                  </span>
                  <span className={hasUpper ? 'text-[#0F8A5F] font-medium' : 'text-slate-500'}>
                    <Check className="mr-1 inline h-3 w-3" aria-hidden="true" />
                    Uppercase letter
                  </span>
                  <span className={hasLower ? 'text-[#0F8A5F] font-medium' : 'text-slate-500'}>
                    <Check className="mr-1 inline h-3 w-3" aria-hidden="true" />
                    Lowercase letter
                  </span>
                  <span className={hasDigit ? 'text-[#0F8A5F] font-medium' : 'text-slate-500'}>
                    <Check className="mr-1 inline h-3 w-3" aria-hidden="true" />
                    Numeric digit
                  </span>
                </div>
              </div>

              <div>
                <label
                  htmlFor="initial-setup-confirm-password"
                  className="block text-xs font-medium text-slate-700"
                >
                  Confirm Password *
                </label>
                <input
                  id="initial-setup-confirm-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="new-password"
                  minLength={10}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter your password"
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-[#092F35] focus:border-[#0F4C5C] focus:outline-none"
                />
                {confirmPassword.length > 0 && !passwordsMatch && (
                  <p className="mt-1 text-[11px] text-rose-600">Passwords do not match.</p>
                )}
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#092F35] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0F4C5C] disabled:opacity-50"
              >
                <UserPlus className="h-4 w-4" aria-hidden="true" />
                <span>
                  {submitting
                    ? 'Registering Super Admin...'
                    : 'Complete Initial Setup & Lock Registration'}
                </span>
              </button>
            </form>
          </div>
        )}
      </main>

      <footer className="mx-auto flex w-full max-w-4xl items-center justify-between border-t border-white/10 pt-5 text-[11px] text-[#F7F4EC]/55">
        <span className="inline-flex items-center gap-1.5">
          <Building2 className="h-3.5 w-3.5" aria-hidden="true" />
          <span>MAATA TECHNOLOGIES · Chittoor, Andhra Pradesh</span>
        </span>
        <span>Credentials are hashed with scrypt and verified exclusively on the server.</span>
      </footer>
    </div>
  );
};
