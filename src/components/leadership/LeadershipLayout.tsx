import React, { useEffect, useState } from 'react';
import { Link, NavLink, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  BarChart3,
  Briefcase,
  CheckSquare,
  ExternalLink,
  FileLock2,
  Inbox,
  LayoutDashboard,
  LogOut,
  Megaphone,
  Menu,
  RefreshCw,
  Rocket,
  Settings,
  TrendingUp,
  X,
} from 'lucide-react';
import { BRAND_ASSETS } from '../../config/brandAssets';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { usePageSeo } from '../../hooks/usePageSeo';
import { ApiError, type AdminUser, type PermissionKey } from '../../services/cmsApi';
import { leadershipApi } from '../../services/leadershipApi';

interface LeadershipNavItem {
  to: string;
  label: string;
  icon: React.FC<{ className?: string }>;
  permission: PermissionKey;
  end?: boolean;
}

const LEADERSHIP_NAV_ITEMS: LeadershipNavItem[] = [
  {
    to: '/leadership',
    label: 'Company Overview',
    icon: LayoutDashboard,
    permission: 'leadership.overview',
    end: true,
  },
  {
    to: '/leadership/product',
    label: 'Product & Development',
    icon: Rocket,
    permission: 'leadership.product.read',
  },
  {
    to: '/leadership/marketing',
    label: 'Marketing & Promotions',
    icon: TrendingUp,
    permission: 'leadership.marketing.read',
  },
  {
    to: '/leadership/testing',
    label: 'App Testing & Updates',
    icon: CheckSquare,
    permission: 'leadership.testing.read',
  },
  {
    to: '/leadership/reports',
    label: 'Business Reports',
    icon: BarChart3,
    permission: 'leadership.reports.read',
  },
  {
    to: '/leadership/documents',
    label: 'Company Documents',
    icon: FileLock2,
    permission: 'leadership.documents.read',
  },
  {
    to: '/leadership/publishing',
    label: 'Announcements & Publishing',
    icon: Megaphone,
    permission: 'leadership.publishing',
  },
  {
    to: '/leadership/enquiries',
    label: 'Enquiries & Partnerships',
    icon: Inbox,
    permission: 'leadership.enquiries',
  },
  {
    to: '/leadership/settings',
    label: 'Leadership Settings',
    icon: Settings,
    permission: 'leadership.settings.security',
  },
];

const ROUTE_TITLES: Record<string, string> = {
  '/leadership': 'Company Overview',
  '/leadership/product': 'Product & Development Progress',
  '/leadership/marketing': 'Marketing & Promotions',
  '/leadership/testing': 'App Testing & Feature Updates',
  '/leadership/reports': 'Business Reports',
  '/leadership/documents': 'Company Documents',
  '/leadership/publishing': 'Announcements & Publishing',
  '/leadership/enquiries': 'Enquiries & Partnerships',
  '/leadership/settings': 'Leadership Settings',
};

export function formatExecutiveDesignation(role: string, leadershipRole?: string): string {
  const effective = leadershipRole && leadershipRole !== 'none' ? leadershipRole : role;
  switch (effective) {
    case 'super_admin':
      return 'Super Admin';
    case 'founder':
      return 'Founder';
    case 'ceo':
      return 'Co-Founder & CEO';
    case 'director':
      return 'Director';
    case 'executive':
      return 'Executive';
    case 'administrator':
      return 'Administrator';
    default:
      return role.replace(/_/g, ' ');
  }
}

export const LeadershipLayout: React.FC = () => {
  const { user, loading, sessionNotice, authError, setAuthenticatedUser } = useAdminAuth();
  usePageSeo({
    title: 'Executive Leadership Workspace | MAATA Technologies',
    description: 'Private executive portal for MAATA Technologies leadership.',
    noIndex: true,
  });
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [verifiedUser, setVerifiedUser] = useState<AdminUser | null>(null);
  const [verifyingServer, setVerifyingServer] = useState(true);
  const [redirectNotice, setRedirectNotice] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [retryNonce, setRetryNonce] = useState(0);

  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) {
      setVerifyingServer(true);
      return;
    }

    if (!user) {
      setVerifiedUser(null);
      setServerError(null);
      setRedirectNotice(sessionNotice || authError || null);
      setVerifyingServer(false);
      return;
    }

    let active = true;
    setVerifyingServer(true);
    setServerError(null);
    setRedirectNotice(null);

    leadershipApi
      .me()
      .then((res) => {
        if (!active) return;
        setVerifiedUser(res.user);
        setRedirectNotice(null);
        setServerError(null);
      })
      .catch((err: unknown) => {
        if (!active) return;
        setVerifiedUser(null);
        if (err instanceof ApiError) {
          if (err.status === 401) {
            setAuthenticatedUser(null);
            setRedirectNotice(err.message);
            return;
          }
          if (err.status === 403) {
            setRedirectNotice(err.message);
            return;
          }
          setServerError(err.message);
          return;
        }
        setServerError('Unable to verify Private Leadership session. Please try again.');
      })
      .finally(() => {
        if (active) setVerifyingServer(false);
      });

    return () => {
      active = false;
    };
  }, [loading, user, sessionNotice, authError, setAuthenticatedUser, retryNonce]);

  if (loading || verifyingServer) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC] text-[#092F35]">
        <div className="flex flex-col items-center gap-3 text-center">
          <img
            src={BRAND_ASSETS.logo.src}
            alt={BRAND_ASSETS.logo.alt}
            className="h-11 w-11 object-contain"
          />
          <p className="text-sm font-medium text-slate-600">
            Verifying Private Leadership session...
          </p>
        </div>
      </div>
    );
  }

  if (serverError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC] px-6 text-[#092F35]">
        <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 text-center shadow-sm">
          <AlertCircle className="mx-auto h-8 w-8 text-rose-600" aria-hidden="true" />
          <h1 className="mt-3 text-lg font-semibold text-[#092F35]">
            Session Verification Unavailable
          </h1>
          <p className="mt-2 text-sm text-slate-600">{serverError}</p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => setRetryNonce((n) => n + 1)}
              className="inline-flex items-center gap-2 rounded-lg bg-[#092F35] px-4 py-2 text-sm font-medium text-white hover:bg-[#0F4C5C]"
            >
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              <span>Retry</span>
            </button>
            <Link
              to="/leadership/access"
              className="inline-flex items-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Return to Sign In
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!user || !verifiedUser) {
    return (
      <Navigate
        to="/leadership/access"
        replace
        state={{
          from: location.pathname,
          authNotice: redirectNotice || sessionNotice || authError || undefined,
        }}
      />
    );
  }

  const activeUser = verifiedUser;
  const perms = new Set(activeUser.permissions || []);
  const isSuper = activeUser.role === 'super_admin';
  const visibleNav = LEADERSHIP_NAV_ITEMS.filter(
    (entry) => isSuper || perms.has(entry.permission)
  );
  const canOpenCms = isSuper || perms.has('leadership.publishing') || perms.has('leadership.enquiries');
  const currentTitle = ROUTE_TITLES[location.pathname] || 'Executive Workspace';
  const designation = formatExecutiveDesignation(activeUser.role, activeUser.leadershipRole);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await leadershipApi.logout();
    } catch {
      // Proceed to clear client session state even if server session already expired
    } finally {
      setVerifiedUser(null);
      setAuthenticatedUser(null);
      setLoggingOut(false);
      navigate('/leadership/access', { replace: true });
    }
  };

  const renderSidebarContent = () => (
    <div className="flex h-full flex-col bg-[#092F35] text-white">
      <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
        <Link
          to="/leadership"
          className="flex items-center gap-3"
          onClick={() => setSidebarOpen(false)}
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white p-1">
            <img
              src={BRAND_ASSETS.logo.src}
              alt={BRAND_ASSETS.logo.alt}
              className="h-full w-full object-contain"
            />
          </div>
          <div>
            <span className="block text-sm font-semibold tracking-tight text-white">
              MAATA Leadership
            </span>
            <span className="block text-[11px] text-[#FFD84A]">Executive Workspace</span>
          </div>
        </Link>
        <button
          type="button"
          onClick={() => setSidebarOpen(false)}
          className="rounded-lg p-1.5 text-white/70 hover:bg-white/10 lg:hidden"
          aria-label="Close leadership menu"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4" aria-label="Executive navigation">
        {visibleNav.map((entry) => {
          const Icon = entry.icon;
          return (
            <NavLink
              key={entry.to}
              to={entry.to}
              end={entry.end}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                  isActive
                    ? 'bg-[#0F8A5F] text-white'
                    : 'text-white/75 hover:bg-white/8 hover:text-white'
                }`
              }
            >
              <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span className="truncate">{entry.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="border-t border-white/10 p-4">
        <div className="rounded-lg border border-white/10 bg-white/5 p-3">
          <p className="truncate text-xs font-semibold text-white">{activeUser.name}</p>
          <p className="mt-0.5 truncate text-[11px] text-white/65">{activeUser.email}</p>
          <p className="mt-2 text-[11px] font-medium text-[#FFD84A]">
            {designation}
            {isSuper && designation !== 'Super Admin' ? ' · Super Admin' : ''}
          </p>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          disabled={loggingOut}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-xs font-medium text-white/90 transition hover:bg-white/10 disabled:opacity-50"
        >
          <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
          <span>{loggingOut ? 'Signing out...' : 'Sign Out'}</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] text-slate-900">
      <aside className="hidden w-[268px] shrink-0 lg:block">{renderSidebarContent()}</aside>

      {sidebarOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-[#092F35]/60"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
          <aside className="relative z-10 w-[268px] max-w-[85vw]">{renderSidebarContent()}</aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-slate-200 bg-white px-4 md:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 lg:hidden"
              aria-label="Open executive navigation"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <span>Private Leadership</span>
                <span>/</span>
                <span className="truncate font-medium text-[#092F35]">{currentTitle}</span>
              </div>
              <h1 className="truncate text-base font-semibold text-[#092F35] md:text-lg">
                {currentTitle}
              </h1>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2.5">
            {canOpenCms && (
              <Link
                to="/admin"
                className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-[#092F35]/20 bg-[#F7F4EC] px-3 py-1.5 text-xs font-medium text-[#092F35] hover:bg-[#EDE8DA]"
              >
                <Briefcase className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Website CMS</span>
              </Link>
            )}
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              <span>Public Website</span>
              <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-8">
          <div className="mx-auto max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
