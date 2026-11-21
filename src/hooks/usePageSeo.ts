import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { isSupportedLanguage } from '../i18n';

const CANONICAL_ORIGIN = 'https://maata-technologies.ai.studio';

interface PageSeoOptions {
  title: string;
  description: string;
  canonicalPath?: string;
  noIndex?: boolean;
}

/**
 * Resolves the canonical URL on https://maata-technologies.ai.studio,
 * stripping optional language prefixes (e.g. /te/company -> /company) and
 * trailing slashes (except root /) so canonical tags stay 1:1 with sitemap.xml.
 */
function resolveCanonicalUrl(pathname: string, canonicalPath?: string): string {
  let rawPath = canonicalPath ?? pathname;
  if (!rawPath.startsWith('/')) {
    rawPath = `/${rawPath}`;
  }

  const segments = rawPath.split('/').filter(Boolean);
  if (segments.length > 0 && isSupportedLanguage(segments[0])) {
    segments.shift();
  }

  const normalizedPath = segments.length === 0 ? '/' : `/${segments.join('/')}`;
  return `${CANONICAL_ORIGIN}${normalizedPath}`;
}

function upsertSingleMeta(
  attrName: 'name' | 'property',
  attrValue: string,
  content: string
): void {
  const selector = `meta[${attrName}="${attrValue}"]`;
  const existing = Array.from(document.head.querySelectorAll(selector));
  let tag = existing[0] as HTMLMetaElement | undefined;

  // Remove any accidental duplicates so metadata is strictly singular
  for (let i = 1; i < existing.length; i += 1) {
    existing[i].remove();
  }

  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute(attrName, attrValue);
    document.head.appendChild(tag);
  }
  tag.setAttribute('content', content);
}

function setCanonicalLink(href: string | null): void {
  const existing = Array.from(document.head.querySelectorAll('link[rel="canonical"]'));
  for (let i = 1; i < existing.length; i += 1) {
    existing[i].remove();
  }

  if (!href) {
    if (existing[0]) {
      existing[0].remove();
    }
    return;
  }

  let link = existing[0] as HTMLLinkElement | undefined;
  if (!link) {
    link = document.createElement('link');
    link.setAttribute('rel', 'canonical');
    document.head.appendChild(link);
  }
  link.setAttribute('href', href);
}

export function usePageSeo({
  title,
  description,
  canonicalPath,
  noIndex = false,
}: PageSeoOptions) {
  const { languageInfo } = useLanguage();
  const { pathname } = useLocation();

  useEffect(() => {
    document.title = title;

    upsertSingleMeta('name', 'description', description);
    upsertSingleMeta(
      'name',
      'robots',
      noIndex ? 'noindex, nofollow, noarchive' : 'index, follow'
    );

    const canonicalUrl = noIndex ? null : resolveCanonicalUrl(pathname, canonicalPath);
    setCanonicalLink(canonicalUrl);

    upsertSingleMeta('property', 'og:title', title);
    upsertSingleMeta('property', 'og:description', description);
    upsertSingleMeta('property', 'og:locale', languageInfo.intlLocale.replace('-', '_'));
    if (canonicalUrl) {
      upsertSingleMeta('property', 'og:url', canonicalUrl);
    }

    upsertSingleMeta('name', 'twitter:title', title);
    upsertSingleMeta('name', 'twitter:description', description);
  }, [title, description, canonicalPath, noIndex, pathname, languageInfo.intlLocale]);
}
