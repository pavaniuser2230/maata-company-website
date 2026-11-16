import React, { useEffect, useId, useRef, useState } from 'react';
import { Check, ChevronDown, Globe } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface LanguageSelectorProps {
  variant?: 'header-desktop' | 'header-mobile' | 'drawer';
  onAfterSelect?: () => void;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  variant = 'header-desktop',
  onAfterSelect,
}) => {
  const { language, languageInfo, supportedLanguages, setLanguage, dict } = useLanguage();
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number>(() =>
    Math.max(
      0,
      supportedLanguages.findIndex((item) => item.code === language)
    )
  );

  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const listboxId = useId();

  useEffect(() => {
    const idx = supportedLanguages.findIndex((item) => item.code === language);
    if (idx >= 0) setActiveIndex(idx);
  }, [language, supportedLanguages]);

  useEffect(() => {
    if (!open) return;
    const handleOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open]);

  const handleSelect = (code: typeof language) => {
    setLanguage(code);
    setOpen(false);
    onAfterSelect?.();
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (!open) {
      if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        setOpen(true);
      }
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((prev) => (prev + 1) % supportedLanguages.length);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((prev) => (prev - 1 + supportedLanguages.length) % supportedLanguages.length);
    } else if (event.key === 'Home') {
      event.preventDefault();
      setActiveIndex(0);
    } else if (event.key === 'End') {
      event.preventDefault();
      setActiveIndex(supportedLanguages.length - 1);
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      const target = supportedLanguages[activeIndex];
      if (target) handleSelect(target.code);
    }
  };

  const isDrawer = variant === 'drawer';
  const isCompactMobile = variant === 'header-mobile';

  return (
    <div ref={containerRef} className={`relative ${isDrawer ? 'w-full' : 'shrink-0'}`}>
      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-label={`${dict.a11y.languageSelectorLabel}: ${languageInfo.englishName} – ${languageInfo.nativeName}`}
        onClick={() => setOpen((prev) => !prev)}
        onKeyDown={handleKeyDown}
        className={
          isDrawer
            ? 'flex w-full items-center justify-between gap-3 rounded-xl border border-white/15 bg-[#0A3A47]/80 px-4 py-3 text-sm font-medium text-[#F7F4EC] transition hover:border-[#FFD84A]/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFD84A] cursor-pointer'
            : isCompactMobile
            ? 'inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/5 px-2.5 py-2 text-xs font-medium text-[#F7F4EC] transition hover:border-[#FFD84A]/50 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFD84A] cursor-pointer'
            : 'inline-flex items-center gap-2 rounded-full border border-white/18 bg-white/[0.06] px-3 py-1.5 text-xs font-medium text-[#F7F4EC]/95 transition hover:border-[#FFD84A]/60 hover:bg-white/[0.11] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFD84A] cursor-pointer'
        }
      >
        <Globe className="h-3.5 w-3.5 text-[#FFD84A] shrink-0" aria-hidden="true" />
        <span className="whitespace-nowrap">
          {isDrawer
            ? `${languageInfo.englishName} – ${languageInfo.nativeName}`
            : languageInfo.nativeName}
        </span>
        <ChevronDown
          className={`h-3.5 w-3.5 text-[#F7F4EC]/70 transition-transform duration-200 shrink-0 ${
            open ? 'rotate-180 text-[#FFD84A]' : ''
          }`}
          aria-hidden="true"
        />
      </button>

      {open && (
        <div
          id={listboxId}
          role="listbox"
          aria-label={dict.a11y.languageMenuLabel}
          tabIndex={-1}
          onKeyDown={handleKeyDown}
          className={
            isDrawer
              ? 'mt-2 w-full rounded-xl border border-white/15 bg-[#0A3A47] p-1.5 shadow-2xl'
              : 'absolute right-0 top-full mt-2 w-64 rounded-xl border border-white/18 bg-[#0A3A47] p-1.5 shadow-2xl z-50 max-h-[70vh] overflow-y-auto'
          }
        >
          <div className="px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-[#F7F4EC]/55 border-b border-white/10 mb-1">
            {dict.a11y.languageSelectorLabel}
          </div>
          {supportedLanguages.map((item, index) => {
            const isSelected = item.code === language;
            const isHighlighted = index === activeIndex;
            return (
              <button
                key={item.code}
                type="button"
                role="option"
                aria-selected={isSelected}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => handleSelect(item.code)}
                className={`flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-[#FFD84A]/15 text-[#FFD84A] font-semibold'
                    : isHighlighted
                    ? 'bg-[#092F35] text-[#F7F4EC]'
                    : 'text-[#F7F4EC]/85 hover:bg-[#092F35]'
                }`}
              >
                <span className="truncate">
                  {item.englishName} – <span className="font-normal">{item.nativeName}</span>
                </span>
                {isSelected && (
                  <Check className="h-4 w-4 shrink-0 text-[#FFD84A]" aria-hidden="true" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
