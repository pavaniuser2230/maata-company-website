import React, { useState } from 'react';
import { Link, NavLink, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Building2,
  ExternalLink,
  FileText,
  Image as ImageIcon,
  Inbox,
  LayoutDashboard,
  LogOut,
  Megaphone,
  Menu,
  Settings,
  ShieldCheck,
  X,
} from 'lucide-react';
import { BRAND_ASSETS } from '../../config/brandAssets';
import { useAdminAuth } from '../../context/AdminAuthContext';
import type { AdminRole } from '../../services/cmsApi';
import { StatusBadge } from './AdminUi';

interface NavEntry {
  to: string;
  label: string;
  icon: React.FC<{ className?: string }>;
  roles: AdminRole[];
  permission?: string;
  end?: boolean;
}

const ADMIN_NAV_ITEMS: NavEntry[] = [
  {
    to: '/admin',
    label: 'Dashboard',
    icon: LayoutDashboard,
    roles: ['super_admin', 'content_manager', 'support_manager', 'founder', 'ceo'],
    end: true,
  },
  {
    to: '/admin/articles',
    label: 'Articles & News',
    icon: FileText,
    roles: ['super_admin', 'content_manager'],
    permission: 'leadership.publishing',
  },
  {
    to: '/admin/announcements',
    label: 'Announcements',
    icon: Megaphone,
    roles: ['super_admin', 'content_manager'],
    permission: 'leadership.publishing',
  },
  {
    to: '/admin/company',
    label: 'Company Information',
    icon: Building2,
    roles: ['super_admin', 'content_manager'],
    permission: 'leadership.publishing',
  },
  {
    to: '/admin/media',
    label: 'Media Library',
    icon: ImageIcon,
    roles: ['super_admin', 'content_manager'],
    permission: 'leadership.publishing',
  },
  {
    to: '/admin/enquiries',
    label: 'Enquiries & Feedback',
    icon: Inbox,
    roles: ['super_admin', 'support_manager'],
    permission: 'leadership.enquiries',
  },
  {
    to: '/admin/users',
    label: 'Admin Users',
    icon: ShieldCheck,
    roles: ['super_admin'],
  },
  {
    to: '/admin/settings',
    label: 'Website Settings',
    icon: Settings,
    roles: ['super_admin', 'content_manager'],
    permission: 'leadership.publishing',
  },
];

const ROUTE_TITLES: Record<string, string> = {
  '/admin': 'Dashboard',
  '/admin/articles': 'Articles & News',
  '/admin/announcements': 'Announcements',
  '/admin/company': 'Company Information',
  '/admin/media': 'Media Library',
  '/admin/enquiries': 'Enquiries & Feedback',
  '/admin/users': 'Admin Users',
  '/admin/settings': 'Website Settings',
};

export const AdminLayout: React.FC = () => {
  const { user, loading, logout } = useAdminAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC] text-[#092F35]">
        <div className="flex flex-col items-center gap-3 text-center">
          <img
            src={BRAND_ASSETS.logo.src}
            alt={BRAND_ASSETS.logo.alt}
            className="h-12 w-12 object-contain"
          />
          <p className="text-sm font-medium text-slate-600">Verifying MAATA admin session...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />;
  }

  const visibleNav = ADMIN_NAV_ITEMS.filter(
    (item) =>
      item.roles.includes(user.role) ||
      Boolean(item.permission && user.permissions?.includes(item.permission as any))
  );
  const canAccessLeadership =
    user.role === 'founder' ||
    user.role === 'ceo' ||
    (user.role === 'super_admin' &&
      (user.leadershipRole === 'founder' || user.leadershipRole === 'ceo'));
  const currentTitle = ROUTE_TITLES[location.pathname] || 'Admin Workspace';

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
      navigate('/admin/login', { replace: true });
    } finally {
      setLoggingOut(false);
    }
  };

  const renderSidebarContent = () => (
    <div className="flex h-full flex-col bg-[#092F35] text-white">
      <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
        <Link to="/admin" className="flex items-center gap-3" onClick={() => setSidebarOpen(false)}>
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white p-1">
            <img
              src={BRAND_ASSETS.logo.src}
              alt={BRAND_ASSETS.logo.alt}
              className="h-full w-full object-contain"
            />
          </div>
          <div>
            <span className="block text-sm font-semibold tracking-tight text-white">MAATA CMS</span>
            <span className="block text-[11px] text-[#FFD84A]">Technologies Console</span>
          </div>
        </Link>
        <button
          type="button"
          onClick={() => setSidebarOpen(false)}
          className="rounded-lg p-1.5 text-white/70 hover:bg-white/10 lg:hidden"
          aria-label="Close admin sidebar"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4" aria-label="Admin navigation">
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
              <Icon className="h-4 w-4 shrink-0" />
              <span>{entry.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="border-t border-white/10 p-4">
        <div className="rounded-lg border border-white/10 bg-white/5 p-3">
          <p className="truncate text-xs font-semibold text-white">{user.name}</p>
          <p className="mt-0.5 truncate text-[11px] text-white/65">{user.email}</p>
          <div className="mt-2">
            <StatusBadge status={user.role} />
          </div>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          disabled={loggingOut}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-xs font-medium text-white/90 transition hover:bg-white/10 disabled:opacity-50"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span>{loggingOut ? 'Logging out...' : 'Logout'}</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] text-slate-900">
      {/* Desktop Sidebar */}
      <aside className="hidden w-[264px] shrink-0 lg:block">{renderSidebarContent()}</aside>

      {/* Mobile Drawer */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-[#092F35]/60"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
          <aside className="relative z-10 w-[264px] max-w-[85vw]">{renderSidebarContent()}</aside>
        </div>
      )}

      {/* Main Content Shell */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-slate-200 bg-white px-4 md:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 lg:hidden"
              aria-label="Open admin menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <span>MAATA Technologies Admin</span>
                <span>/</span>
                <span className="truncate font-medium text-[#092F35]">{currentTitle}</span>
              </div>
              <h1 className="truncate text-base font-semibold text-[#092F35] md:text-lg">
                {currentTitle}
              </h1>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2.5">
            {canAccessLeadership && (
              <Link
                to="/leadership"
                className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-[#092F35]/20 bg-[#F7F4EC] px-3 py-1.5 text-xs font-medium text-[#092F35] hover:bg-[#EDE8DA]"
              >
                <span>Executive Workspace</span>
              </Link>
            )}
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              <span>Public Website</span>
              <ExternalLink className="h-3.5 w-3.5" />
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
