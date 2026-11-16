import { useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';

interface PageSeoOptions {
  title: string;
  description: string;
}

export function usePageSeo({ title, description }: PageSeoOptions) {
  const { languageInfo } = useLanguage();

  useEffect(() => {
    document.title = title;

    const updateMeta = (selector: string, content: string) => {
      const el = document.querySelector(selector);
      if (el) {
        el.setAttribute('content', content);
      }
    };

    updateMeta('meta[name="description"]', description);
    updateMeta('meta[property="og:title"]', title);
    updateMeta('meta[property="og:description"]', description);
    updateMeta('meta[property="og:locale"]', languageInfo.intlLocale.replace('-', '_'));
    updateMeta('meta[name="twitter:title"]', title);
    updateMeta('meta[name="twitter:description"]', description);
  }, [title, description, languageInfo.intlLocale]);
}
