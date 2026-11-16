import type { LanguageCode } from './languages';
import type { TranslationDictionary } from './types';
import { EN_DICT } from './locales/en';
import { TE_DICT } from './locales/te';
import { HI_DICT } from './locales/hi';
import { TA_DICT } from './locales/ta';
import { KN_DICT } from './locales/kn';
import { ML_DICT } from './locales/ml';
import { BN_DICT } from './locales/bn';
import { MR_DICT } from './locales/mr';
import { GU_DICT } from './locales/gu';
import { PA_DICT } from './locales/pa';

export * from './languages';
export type { TranslationDictionary } from './types';

export const LOCALES: Record<LanguageCode, TranslationDictionary> = {
  en: EN_DICT,
  te: TE_DICT,
  hi: HI_DICT,
  ta: TA_DICT,
  kn: KN_DICT,
  ml: ML_DICT,
  bn: BN_DICT,
  mr: MR_DICT,
  gu: GU_DICT,
  pa: PA_DICT,
};

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Recursively merges a target dictionary over the English baseline so any
 * missing or blank string safely falls back to English and never leaks a raw key.
 */
function mergeWithEnglishFallback<T>(fallback: T, candidate: unknown): T {
  if (typeof fallback === 'string') {
    if (typeof candidate === 'string' && candidate.trim().length > 0) {
      return candidate as unknown as T;
    }
    return fallback;
  }

  if (Array.isArray(fallback)) {
    if (Array.isArray(candidate) && candidate.length === fallback.length) {
      return fallback.map((item, idx) => mergeWithEnglishFallback(item, candidate[idx])) as unknown as T;
    }
    return fallback;
  }

  if (isPlainObject(fallback)) {
    const candidateObj = isPlainObject(candidate) ? candidate : {};
    const result: Record<string, unknown> = {};
    for (const key of Object.keys(fallback)) {
      result[key] = mergeWithEnglishFallback(fallback[key], candidateObj[key]);
    }
    return result as T;
  }

  return (candidate !== undefined ? candidate : fallback) as T;
}

const RESOLVED_CACHE = new Map<LanguageCode, TranslationDictionary>();

export function resolveDictionary(code: LanguageCode): TranslationDictionary {
  if (code === 'en') return EN_DICT;
  const cached = RESOLVED_CACHE.get(code);
  if (cached) return cached;
  const merged = mergeWithEnglishFallback(EN_DICT, LOCALES[code]);
  RESOLVED_CACHE.set(code, merged);
  return merged;
}

export function formatMessage(
  template: string,
  variables: Record<string, string | number | undefined>
): string {
  return template.replace(/\{(\w+)\}/g, (_match, key: string) => {
    const value = variables[key];
    return value !== undefined ? String(value) : '';
  });
}
