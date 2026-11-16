import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Megaphone, X } from 'lucide-react';
import { usePublicCms } from '../context/PublicCmsContext';
import { useLanguage } from '../context/LanguageContext';
import { Header } from './Header';
import { Footer } from './Footer';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { pathname, hash } = useLocation();
  const { banners } = usePublicCms();
  const { dict, localizePath } = useLanguage();
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);

  useEffect(() => {
    if (hash) {
      const targetId = hash.replace('#', '');
      const element = document.getElementById(targetId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
        return;
      }
    }
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [pathname, hash]);

  const activeBanner = banners.find((b) => !dismissedIds.includes(b.id));

  return (
    <div className="min-h-screen flex flex-col bg-[#F7F4EC] text-[#092F35]">
      {activeBanner && (
        <div
          role="region"
          aria-label={dict.banner.regionLabel}
          className="bg-[#0F4C5C] text-[#F7F4EC] border-b border-white/10"
        >
          <div className="mx-auto flex max-w-[1280px] items-center justify-between gap-4 px-5 py-2 text-xs">
            <div className="flex items-center gap-2.5 min-w-0">
              <Megaphone className="h-3.5 w-3.5 text-[#FFD84A] shrink-0" aria-hidden="true" />
              <p className="truncate">
                <strong className="font-semibold text-[#FFD84A] mr-1.5">
                  {activeBanner.title}:
                </strong>
                <span className="text-[#F7F4EC]/90">{activeBanner.summary}</span>
              </p>
              <Link
                to={localizePath('/news')}
                className="hidden sm:inline-block font-semibold text-[#FFD84A] underline-offset-2 hover:underline whitespace-nowrap shrink-0"
              >
                {dict.banner.details}
              </Link>
            </div>
            <button
              type="button"
              aria-label={dict.banner.dismiss}
              onClick={() => setDismissedIds((prev) => [...prev, activeBanner.id])}
              className="rounded p-1 text-[#F7F4EC]/75 hover:text-white cursor-pointer shrink-0"
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>
        </div>
      )}

      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
};
