import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  DEFAULT_LANGUAGE,
  LOCALES,
  SUPPORTED_LANGUAGES,
  formatMessage,
  isSupportedLanguage,
  resolveDictionary,
} from '../src/i18n/index';
import { EN_DICT } from '../src/i18n/locales/en';

function collectStringLeaves(
  obj: unknown,
  prefix = ''
): Array<{ path: string; value: string }> {
  if (typeof obj === 'string') {
    return [{ path: prefix, value: obj }];
  }
  if (Array.isArray(obj)) {
    return obj.flatMap((item, idx) => collectStringLeaves(item, `${prefix}[${idx}]`));
  }
  if (obj && typeof obj === 'object') {
    return Object.entries(obj as Record<string, unknown>).flatMap(([key, val]) =>
      collectStringLeaves(val, prefix ? `${prefix}.${key}` : key)
    );
  }
  return [];
}

const OPTIONAL_EMPTY_PATHS = new Set([
  'footer.companyDescriptionPrefix',
  'footer.companyDescriptionSuffix',
]);

function assertSameShape(expected: unknown, actual: unknown, path = 'root'): void {
  if (typeof expected === 'string') {
    assert.equal(typeof actual, 'string', `Expected string at ${path}`);
    const relativePath = path.replace(/^[^.]+\./, '');
    if (!OPTIONAL_EMPTY_PATHS.has(relativePath)) {
      assert.ok(
        (actual as string).trim().length > 0,
        `Expected non-empty translated string at ${path}`
      );
    }
    return;
  }
  if (Array.isArray(expected)) {
    assert.ok(Array.isArray(actual), `Expected array at ${path}`);
    assert.equal(
      (actual as unknown[]).length,
      expected.length,
      `Expected array length ${expected.length} at ${path}, got ${(actual as unknown[]).length}`
    );
    expected.forEach((item, idx) =>
      assertSameShape(item, (actual as unknown[])[idx], `${path}[${idx}]`)
    );
    return;
  }
  if (expected && typeof expected === 'object') {
    assert.ok(actual && typeof actual === 'object' && !Array.isArray(actual), `Expected object at ${path}`);
    const expectedKeys = Object.keys(expected as Record<string, unknown>);
    const actualKeys = Object.keys(actual as Record<string, unknown>);
    assert.deepEqual(
      [...actualKeys].sort(),
      [...expectedKeys].sort(),
      `Mismatched keys at ${path}`
    );
    for (const key of expectedKeys) {
      assertSameShape(
        (expected as Record<string, unknown>)[key],
        (actual as Record<string, unknown>)[key],
        `${path}.${key}`
      );
    }
  }
}

test('1. Supported languages list matches exact order and English default', () => {
  assert.equal(DEFAULT_LANGUAGE, 'en');
  assert.equal(SUPPORTED_LANGUAGES.length, 10);
  assert.deepEqual(
    SUPPORTED_LANGUAGES.map((l) => [l.code, l.englishName, l.nativeName]),
    [
      ['en', 'English', 'English'],
      ['te', 'Telugu', 'తెలుగు'],
      ['hi', 'Hindi', 'हिन्दी'],
      ['ta', 'Tamil', 'தமிழ்'],
      ['kn', 'Kannada', 'ಕನ್ನಡ'],
      ['ml', 'Malayalam', 'മലയാളം'],
      ['bn', 'Bengali', 'বাংলা'],
      ['mr', 'Marathi', 'मराठी'],
      ['gu', 'Gujarati', 'ગુજરાતી'],
      ['pa', 'Punjabi', 'ਪੰਜਾਬੀ'],
    ]
  );
  assert.equal(isSupportedLanguage('te'), true);
  assert.equal(isSupportedLanguage('fr'), false);
  assert.equal(isSupportedLanguage(null), false);
});

test('2. Every locale dictionary matches EN_DICT shape completely with zero unexpected empty strings', () => {
  const enLeaves = collectStringLeaves(EN_DICT);
  assert.ok(enLeaves.length > 200, 'Expected full English dictionary leaf coverage');

  for (const lang of SUPPORTED_LANGUAGES) {
    const dict = LOCALES[lang.code];
    assert.ok(dict, `Missing dictionary for ${lang.code}`);
    assertSameShape(EN_DICT, dict, lang.code);

    const resolved = resolveDictionary(lang.code);
    assertSameShape(EN_DICT, resolved, `resolved(${lang.code})`);
  }
});

test('3. Non-translatable brands, founder names, URLs, and official terms are preserved across all 10 languages', () => {
  for (const lang of SUPPORTED_LANGUAGES) {
    const dict = resolveDictionary(lang.code);

    // Brand names & founder names
    assert.ok(dict.meta.siteName.includes('MAATA Technologies'), `${lang.code} siteName`);
    assert.ok(dict.hero.headlineBrand.includes('MAATA TECHNOLOGIES'), `${lang.code} hero.headlineBrand`);
    assert.ok(dict.nav.subitems.foundersLeadership.description.includes('G. Balaji Reddy'));
    assert.ok(dict.nav.subitems.foundersLeadership.description.includes('G. Pavani'));
    assert.equal(dict.nav.subitems.maataBusiness.label, 'MAATA Business');
    assert.equal(dict.technology.canvas.title, 'THE MAATA CONNECTION');
    assert.ok(dict.legal.terms.s2Body.includes('THE MAATA CONNECTION'));
    assert.ok(dict.legal.terms.s2Body.includes('MAATA TECHNOLOGIES'));
    assert.ok(dict.contact.heroDescription.includes('support@maataapp.com') || dict.contact.openMaataDomainAria.includes('maataapp.com'));
    assert.ok(
      dict.banner.seededAnnouncement.body.includes('MAATA India') ||
        dict.banner.seededAnnouncement.title.includes('maataapp.com')
    );
  }
});

test('4. formatMessage interpolates template placeholders cleanly without leaving raw tokens', () => {
  for (const lang of SUPPORTED_LANGUAGES) {
    const dict = resolveDictionary(lang.code);
    const formattedGallery = formatMessage(dict.gallery.showPhotoAria, {
      index: 2,
      total: 4,
      title: 'Leadership Portrait',
    });
    assert.ok(!formattedGallery.includes('{index}'));
    assert.ok(!formattedGallery.includes('{total}'));
    assert.ok(!formattedGallery.includes('{title}'));
    assert.ok(formattedGallery.includes('2'));
    assert.ok(formattedGallery.includes('4'));

    const formattedSuccess = formatMessage(dict.contact.successBodyPrefix, {
      name: 'G. Pavani',
    });
    assert.ok(!formattedSuccess.includes('{name}'));
    assert.ok(formattedSuccess.includes('G. Pavani'));
  }
});
