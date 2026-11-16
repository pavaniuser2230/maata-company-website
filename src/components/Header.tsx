import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { ArrowUpRight, ChevronDown, Menu, X } from 'lucide-react';
import { COMPANY_INFO, type NavItem } from '../theme/tokens';
import { useLanguage } from '../context/LanguageContext';
import { MaataLogo } from './MaataLogo';
import { Button } from './Button';
import { LanguageSelector } from './LanguageSelector';

export const Header: React.FC = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [mobileExpanded, setMobileExpanded] = useState<string | null>(null);
  const navRef = useRef<HTMLDivElement>(null);
  const { pathname } = useLocation();
  const { dict, localizePath } = useLanguage();

  const navItems: NavItem[] = useMemo(
    () => [
      { label: dict.nav.home, to: '/' },
      {
        label: dict.nav.company,
        to: '/company',
        children: [
          {
            label: dict.nav.subitems.whyMaata.label,
            description: dict.nav.subitems.whyMaata.description,
            to: '/company#why-maata',
          },
          {
            label: dict.nav.subitems.foundersLeadership.label,
            description: dict.nav.subitems.foundersLeadership.description,
            to: '/company#leadership',
          },
          {
            label: dict.nav.subitems.visionMission.label,
            description: dict.nav.subitems.visionMission.description,
            to: '/company#vision',
          },
          {
            label: dict.nav.subitems.companyJourney.label,
            description: dict.nav.subitems.companyJourney.description,
            to: '/company#journey',
          },
        ],
      },
      {
        label: dict.nav.maataApp,
        to: '/app',
        children: [
          {
            label: dict.nav.subitems.ecosystem16.label,
            description: dict.nav.subitems.ecosystem16.description,
            to: '/app#ecosystem',
          },
          {
            label: dict.nav.subitems.maataBusiness.label,
            description: dict.nav.subitems.maataBusiness.description,
            to: '/app#business',
          },
          {
            label: dict.nav.subitems.localIndiaNetwork.label,
            description: dict.nav.subitems.localIndiaNetwork.description,
            to: '/app#local-india',
          },
        ],
      },
      { label: dict.nav.technology, to: '/technology' },
      { label: dict.nav.newsroom, to: '/news' },
      { label: dict.nav.careers, to: '/careers' },
      { label: dict.nav.contactUs, to: '/contact' },
    ],
    [dict]
  );

  useEffect(() => {
    setMobileOpen(false);
    setOpenDropdown(null);
  }, [pathname]);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setOpenDropdown(null);
      }
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpenDropdown(null);
        setMobileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  return (
    <header
      ref={navRef}
      className="sticky top-0 z-40 border-b border-white/10 bg-[#092F35]/95 backdrop-blur-md"
    >
      <div className="mx-auto flex max-w-[1320px] items-center justify-between gap-4 px-5 py-3 lg:px-8">
        {/* Zone 1: Brand Logo & Wordmark */}
        <Link
          to={localizePath('/')}
          aria-label={dict.a11y.homeLogoAria}
          className="inline-flex items-center whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFD84A] rounded"
        >
          <MaataLogo tone="light" size="md" />
        </Link>

        {/* Zone 2: Desktop Navigation with Interactive Dropdowns */}
        <nav
          aria-label={dict.a11y.primaryNav}
          className="hidden xl:flex items-center gap-4 2xl:gap-6 text-[13px] 2xl:text-sm font-medium text-[#F7F4EC]/85"
        >
          {navItems.map((item) => {
            const hasChildren = Boolean(item.children && item.children.length > 0);
            const isDropdownOpen = openDropdown === item.to;

            if (!hasChildren) {
              return (
                <NavLink
                  key={item.to}
                  to={localizePath(item.to)}
                  end={item.to === '/'}
                  className={({ isActive }) =>
                    `relative py-1.5 whitespace-nowrap shrink-0 transition-colors duration-200 hover:text-[#FFD84A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFD84A] rounded-sm ${
                      isActive
                        ? 'text-[#FFD84A] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[1.5px] after:bg-[#FFD84A]'
                        : ''
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              );
            }

            return (
              <div
                key={item.to}
                className="relative"
                onMouseEnter={() => setOpenDropdown(item.to)}
                onMouseLeave={() => setOpenDropdown(null)}
              >
                <div className="inline-flex items-center gap-1">
                  <NavLink
                    to={localizePath(item.to)}
                    className={({ isActive }) =>
                      `relative py-1.5 whitespace-nowrap shrink-0 transition-colors duration-200 hover:text-[#FFD84A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFD84A] rounded-sm ${
                        isActive ? 'text-[#FFD84A]' : ''
                      }`
                    }
                  >
                    {item.label}
                  </NavLink>
                  <button
                    type="button"
                    aria-label={`${dict.a11y.toggleSubmenu}: ${item.label}`}
                    aria-expanded={isDropdownOpen}
                    onClick={() =>
                      setOpenDropdown((prev) => (prev === item.to ? null : item.to))
                    }
                    className="p-1 text-[#F7F4EC]/70 hover:text-[#FFD84A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFD84A] rounded cursor-pointer"
                  >
                    <ChevronDown
                      className={`h-3.5 w-3.5 transition-transform duration-200 ${
                        isDropdownOpen ? 'rotate-180 text-[#FFD84A]' : ''
                      }`}
                      aria-hidden="true"
                    />
                  </button>
                </div>

                {isDropdownOpen && item.children && (
                  <div
                    role="menu"
                    aria-label={item.label}
                    className="absolute left-0 top-full pt-2 w-72 z-50"
                  >
                    <div className="rounded-xl border border-white/15 bg-[#0A3A47] p-2 shadow-2xl">
                      {item.children.map((sub) => (
                        <Link
                          key={sub.to}
                          to={localizePath(sub.to)}
                          role="menuitem"
                          onClick={() => setOpenDropdown(null)}
                          className="block rounded-lg px-3.5 py-2.5 transition-colors hover:bg-[#092F35] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFD84A]"
                        >
                          <p className="text-sm font-semibold text-[#F7F4EC]">{sub.label}</p>
                          <p className="mt-0.5 text-xs text-[#F7F4EC]/65 leading-snug">
                            {sub.description}
                          </p>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Zone 3: Language Selector + Explore MAATA App External Action */}
        <div className="hidden xl:flex items-center gap-2.5 shrink-0">
          <LanguageSelector variant="header-desktop" />
          <Button
            href={COMPANY_INFO.appUrl}
            target="_blank"
            rel="noopener noreferrer"
            variant="primary"
            size="sm"
          >
            <span>{dict.nav.exploreAppCta}</span>
            <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Button>
        </div>

        {/* Tablet/Mobile Language Selector & Menu Button */}
        <div className="flex xl:hidden items-center gap-2 shrink-0">
          <LanguageSelector variant="header-mobile" />
          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-expanded={mobileOpen}
            aria-label={mobileOpen ? dict.a11y.closeMenu : dict.a11y.openMenu}
            className="inline-flex items-center justify-center rounded-lg p-2.5 text-[#F7F4EC] hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFD84A] cursor-pointer"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Responsive Tablet & Mobile Navigation Drawer */}
      {mobileOpen && (
        <div className="xl:hidden border-t border-white/10 bg-[#092F35] px-6 py-5 max-h-[82vh] overflow-y-auto">
          <nav aria-label={dict.a11y.mobileNav} className="flex flex-col gap-1.5">
            {navItems.map((item) => {
              const hasChildren = Boolean(item.children && item.children.length > 0);
              const isSubOpen = mobileExpanded === item.to;

              return (
                <div key={item.to} className="border-b border-white/8 pb-1.5 last:border-b-0">
                  <div className="flex items-center justify-between gap-2">
                    <NavLink
                      to={localizePath(item.to)}
                      end={item.to === '/'}
                      onClick={() => setMobileOpen(false)}
                      className={({ isActive }) =>
                        `py-2 text-base font-medium transition-colors ${
                          isActive ? 'text-[#FFD84A]' : 'text-[#F7F4EC]/90 hover:text-[#FFD84A]'
                        }`
                      }
                    >
                      {item.label}
                    </NavLink>

                    {hasChildren && (
                      <button
                        type="button"
                        aria-expanded={isSubOpen}
                        aria-label={`${dict.a11y.expandSection}: ${item.label}`}
                        onClick={() =>
                          setMobileExpanded((prev) => (prev === item.to ? null : item.to))
                        }
                        className="p-2 text-[#F7F4EC]/75 hover:text-[#FFD84A] cursor-pointer"
                      >
                        <ChevronDown
                          className={`h-4 w-4 transition-transform ${
                            isSubOpen ? 'rotate-180 text-[#FFD84A]' : ''
                          }`}
                        />
                      </button>
                    )}
                  </div>

                  {hasChildren && isSubOpen && item.children && (
                    <div className="ml-3 mb-2 flex flex-col gap-1.5 border-l border-white/15 pl-3">
                      {item.children.map((sub) => (
                        <Link
                          key={sub.to}
                          to={localizePath(sub.to)}
                          onClick={() => setMobileOpen(false)}
                          className="py-1.5 text-sm text-[#F7F4EC]/75 hover:text-[#FFD84A]"
                        >
                          {sub.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            <LanguageSelector
              variant="drawer"
              onAfterSelect={() => setMobileOpen(false)}
            />

            <div className="pt-4">
              <Button
                href={COMPANY_INFO.appUrl}
                target="_blank"
                rel="noopener noreferrer"
                variant="primary"
                size="md"
                className="w-full"
              >
                <span>{dict.nav.exploreAppCta}</span>
                <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
              </Button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};
