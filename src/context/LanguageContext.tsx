import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  DEFAULT_LANGUAGE,
  getLanguageOption,
  isSupportedLanguage,
  LANGUAGE_STORAGE_KEY,
  resolveDictionary,
  SUPPORTED_LANGUAGES,
  type LanguageCode,
  type LanguageOption,
  type TranslationDictionary,
} from '../i18n';

export function extractLanguageFromPath(pathname: string): {
  prefixLang: LanguageCode | null;
  cleanPath: string;
} {
  const segments = pathname.split('/').filter(Boolean);
  if (segments.length > 0 && isSupportedLanguage(segments[0])) {
    const rest = '/' + segments.slice(1).join('/');
    return {
      prefixLang: segments[0],
      cleanPath: rest === '/' || rest === '' ? '/' : rest,
    };
  }
  return {
    prefixLang: null,
    cleanPath: pathname || '/',
  };
}

function readStoredLanguage(): LanguageCode | null {
  try {
    const saved = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
    return isSupportedLanguage(saved) ? saved : null;
  } catch {
    return null;
  }
}

function writeStoredLanguage(code: LanguageCode): void {
  try {
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, code);
  } catch {
    // Ignore storage quota or private browsing errors
  }
}

function resolveInitialLanguage(pathname: string, search: string): LanguageCode {
  const params = new URLSearchParams(search);
  const queryLang = params.get('lang');
  if (isSupportedLanguage(queryLang)) {
    return queryLang;
  }

  const { prefixLang } = extractLanguageFromPath(pathname);
  if (prefixLang) {
    return prefixLang;
  }

  const stored = readStoredLanguage();
  if (stored) {
    return stored;
  }

  return DEFAULT_LANGUAGE;
}

interface LanguageContextValue {
  language: LanguageCode;
  languageInfo: LanguageOption;
  dict: TranslationDictionary;
  supportedLanguages: readonly LanguageOption[];
  setLanguage: (next: LanguageCode) => void;
  localizePath: (targetPath: string) => string;
  formatDate: (
    value: string | null | undefined,
    options?: Intl.DateTimeFormatOptions
  ) => string | null;
}

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const [language, setLanguageState] = useState<LanguageCode>(() =>
    resolveInitialLanguage(location.pathname, location.search)
  );

  // Sync when browser URL changes (e.g. direct navigation, back/forward, or /:lang route)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const queryLang = params.get('lang');
    const { prefixLang } = extractLanguageFromPath(location.pathname);

    if (isSupportedLanguage(queryLang) && queryLang !== language) {
      setLanguageState(queryLang);
      writeStoredLanguage(queryLang);
      return;
    }

    if (prefixLang && prefixLang !== language) {
      setLanguageState(prefixLang);
      writeStoredLanguage(prefixLang);
    }
  }, [location.pathname, location.search, language]);

  // Keep <html lang="xx"> and <link rel="alternate" hreflang="..."> tags updated for accessibility & SEO
  useEffect(() => {
    document.documentElement.lang = language;
    const { cleanPath } = extractLanguageFromPath(location.pathname);

    // Do not inject hreflang alternates on private admin or leadership routes
    if (cleanPath.startsWith('/admin') || cleanPath.startsWith('/leadership')) {
      return;
    }

    const origin = window.location.origin;
    const managedLinks: HTMLLinkElement[] = [];

    // Remove previously managed hreflang links
    document
      .querySelectorAll('link[data-maata-hreflang="true"]')
      .forEach((node) => node.remove());

    for (const langOption of SUPPORTED_LANGUAGES) {
      const link = document.createElement('link');
      link.rel = 'alternate';
      link.hreflang = langOption.code;
      link.href =
        langOption.code === DEFAULT_LANGUAGE
          ? `${origin}${cleanPath}`
          : `${origin}${cleanPath}?lang=${langOption.code}`;
      link.setAttribute('data-maata-hreflang', 'true');
      document.head.appendChild(link);
      managedLinks.push(link);
    }

    const xDefault = document.createElement('link');
    xDefault.rel = 'alternate';
    xDefault.hreflang = 'x-default';
    xDefault.href = `${origin}${cleanPath}`;
    xDefault.setAttribute('data-maata-hreflang', 'true');
    document.head.appendChild(xDefault);
    managedLinks.push(xDefault);

    return () => {
      managedLinks.forEach((node) => node.remove());
    };
  }, [language, location.pathname]);

  const setLanguage = useCallback(
    (next: LanguageCode) => {
      if (!isSupportedLanguage(next)) return;
      setLanguageState(next);
      writeStoredLanguage(next);

      const { prefixLang, cleanPath } = extractLanguageFromPath(location.pathname);
      const params = new URLSearchParams(location.search);

      if (prefixLang) {
        params.delete('lang');
        const nextSearch = params.toString();
        const nextPath =
          next === DEFAULT_LANGUAGE
            ? cleanPath
            : `/${next}${cleanPath === '/' ? '' : cleanPath}`;
        navigate(
          {
            pathname: nextPath,
            search: nextSearch ? `?${nextSearch}` : '',
            hash: location.hash,
          },
          { replace: true }
        );
        return;
      }

      if (next === DEFAULT_LANGUAGE) {
        params.delete('lang');
      } else {
        params.set('lang', next);
      }
      const nextSearch = params.toString();
      navigate(
        {
          pathname: location.pathname,
          search: nextSearch ? `?${nextSearch}` : '',
          hash: location.hash,
        },
        { replace: true }
      );
    },
    [location.hash, location.pathname, location.search, navigate]
  );

  const localizePath = useCallback(
    (targetPath: string): string => {
      if (!targetPath || targetPath.startsWith('http') || targetPath.startsWith('mailto:')) {
        return targetPath;
      }

      const [pathAndSearch, hashPart] = targetPath.split('#');
      const [rawPath, existingSearch] = (pathAndSearch || '/').split('?');
      const normalizedPath = rawPath.startsWith('/') ? rawPath : `/${rawPath}`;
      const { cleanPath } = extractLanguageFromPath(normalizedPath);
      const { prefixLang } = extractLanguageFromPath(location.pathname);
      const hashSuffix = hashPart ? `#${hashPart}` : '';

      if (prefixLang && language !== DEFAULT_LANGUAGE) {
        const prefixed =
          cleanPath === '/' ? `/${language}` : `/${language}${cleanPath}`;
        const searchSuffix = existingSearch ? `?${existingSearch}` : '';
        return `${prefixed}${searchSuffix}${hashSuffix}`;
      }

      if (language === DEFAULT_LANGUAGE) {
        const searchSuffix = existingSearch ? `?${existingSearch}` : '';
        return `${cleanPath}${searchSuffix}${hashSuffix}`;
      }

      const params = new URLSearchParams(existingSearch || '');
      params.set('lang', language);
      return `${cleanPath}?${params.toString()}${hashSuffix}`;
    },
    [language, location.pathname]
  );

  const languageInfo = useMemo(() => getLanguageOption(language), [language]);
  const dict = useMemo(() => resolveDictionary(language), [language]);

  const formatDate = useCallback(
    (
      value: string | null | undefined,
      options: Intl.DateTimeFormatOptions = {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }
    ): string | null => {
      if (!value) return null;
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) return null;
      try {
        return new Intl.DateTimeFormat(languageInfo.intlLocale, options).format(date);
      } catch {
        return date.toLocaleDateString('en-IN', options);
      }
    },
    [languageInfo.intlLocale]
  );

  const contextValue = useMemo<LanguageContextValue>(
    () => ({
      language,
      languageInfo,
      dict,
      supportedLanguages: SUPPORTED_LANGUAGES,
      setLanguage,
      localizePath,
      formatDate,
    }),
    [language, languageInfo, dict, setLanguage, localizePath, formatDate]
  );

  return <LanguageContext.Provider value={contextValue}>{children}</LanguageContext.Provider>;
};

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return ctx;
}
