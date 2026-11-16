import assert from 'node:assert/strict';
import fs from 'node:fs';
import type http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { after, before, test } from 'node:test';

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'maata-cms-test-'));
process.env.DATABASE_PATH = path.join(tempDir, 'test.db');
process.env.MEDIA_STORAGE_DIR = path.join(tempDir, 'media');
process.env.LEADERSHIP_DOCS_DIR = path.join(tempDir, 'leadership_docs');
process.env.ALLOW_DEV_RESET_PREVIEW = 'true';
process.env.SESSION_SECRET = 'test-session-secret-for-maata-cms-integration';

// Helper to create a minimal valid 1x1 PNG buffer matching PNG magic bytes
function createValidPngBuffer(): Buffer {
  return Buffer.from(
    '89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000a49444154789c63000100000500010d0a2db40000000049454e44ae426082',
    'hex'
  );
}

function extractSessionCookie(res: Response): string {
  const setCookie = res.headers.get('set-cookie') || '';
  const match = setCookie.match(/maata_admin_session=([^;]+)/);
  return match ? `maata_admin_session=${match[1]}` : '';
}

let server: http.Server;
let baseUrl = '';
let superAdminCookie = '';
let contentManagerCookie = '';
let supportManagerCookie = '';

before(async () => {
  const { createExpressApp } = await import('../server/app.ts');
  const app = createExpressApp({ dbPath: process.env.DATABASE_PATH });
  await new Promise<void>((resolve) => {
    server = app.listen(0, '127.0.0.1', () => {
      const addr = server.address() as { port: number };
      baseUrl = `http://127.0.0.1:${addr.port}`;
      resolve();
    });
  });
});

after(async () => {
  if (server) {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
  const { closeDb } = await import('../server/db/database.ts');
  closeDb();
  fs.rmSync(tempDir, { recursive: true, force: true });
});

test('1. Unauthenticated requests to protected admin API routes return 401', async () => {
  for (const endpoint of [
    '/api/admin/overview',
    '/api/admin/company',
    '/api/admin/articles',
    '/api/admin/enquiries',
    '/api/admin/users',
  ]) {
    const res = await fetch(`${baseUrl}${endpoint}`);
    assert.equal(res.status, 401, `Expected 401 on ${endpoint}`);
  }
});

test('2. Initial Super Admin setup creates session cookie and locks subsequent setup calls', async () => {
  const statusBefore = await fetch(`${baseUrl}/api/admin/auth/setup-status`).then((r) => r.json());
  assert.equal(statusBefore.needsInitialSetup, true);

  const setupRes = await fetch(`${baseUrl}/api/admin/auth/setup-initial-admin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Primary Super Admin',
      email: 'super@maataapp.com',
      password: 'MaataSuperPassword123',
    }),
  });
  assert.equal(setupRes.status, 201);
  const setupBody = await setupRes.json();
  assert.equal(setupBody.user.role, 'super_admin');
  superAdminCookie = extractSessionCookie(setupRes);
  assert.ok(superAdminCookie.includes('maata_admin_session='));

  const statusAfter = await fetch(`${baseUrl}/api/admin/auth/setup-status`).then((r) => r.json());
  assert.equal(statusAfter.needsInitialSetup, false);

  const secondSetup = await fetch(`${baseUrl}/api/admin/auth/setup-initial-admin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Rogue Admin',
      email: 'rogue@maataapp.com',
      password: 'MaataSuperPassword123',
    }),
  });
  assert.equal(secondSetup.status, 403);
});

test('3. Role-based access control enforces strict permissions for content_manager and support_manager', async () => {
  // Super Admin creates Content Manager & Support Manager
  const cmRes = await fetch(`${baseUrl}/api/admin/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: superAdminCookie },
    body: JSON.stringify({
      name: 'Editorial Lead',
      email: 'content@maataapp.com',
      password: 'ContentPassword123',
      role: 'content_manager',
    }),
  });
  assert.equal(cmRes.status, 201);

  const smRes = await fetch(`${baseUrl}/api/admin/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: superAdminCookie },
    body: JSON.stringify({
      name: 'Support Lead',
      email: 'support@maataapp.com',
      password: 'SupportPassword123',
      role: 'support_manager',
    }),
  });
  assert.equal(smRes.status, 201);

  // Login as Content Manager
  const cmLogin = await fetch(`${baseUrl}/api/admin/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'content@maataapp.com', password: 'ContentPassword123' }),
  });
  assert.equal(cmLogin.status, 200);
  contentManagerCookie = extractSessionCookie(cmLogin);

  // Content Manager allowed on articles, forbidden on enquiries & users
  assert.equal(
    (await fetch(`${baseUrl}/api/admin/articles`, { headers: { Cookie: contentManagerCookie } }))
      .status,
    200
  );
  assert.equal(
    (await fetch(`${baseUrl}/api/admin/enquiries`, { headers: { Cookie: contentManagerCookie } }))
      .status,
    403
  );
  assert.equal(
    (await fetch(`${baseUrl}/api/admin/users`, { headers: { Cookie: contentManagerCookie } }))
      .status,
    403
  );

  // Login as Support Manager
  const smLogin = await fetch(`${baseUrl}/api/admin/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'support@maataapp.com', password: 'SupportPassword123' }),
  });
  assert.equal(smLogin.status, 200);
  supportManagerCookie = extractSessionCookie(smLogin);

  // Support Manager allowed on enquiries, forbidden on articles, company, media, users
  assert.equal(
    (await fetch(`${baseUrl}/api/admin/enquiries`, { headers: { Cookie: supportManagerCookie } }))
      .status,
    200
  );
  assert.equal(
    (await fetch(`${baseUrl}/api/admin/articles`, { headers: { Cookie: supportManagerCookie } }))
      .status,
    403
  );
  assert.equal(
    (await fetch(`${baseUrl}/api/admin/company`, { headers: { Cookie: supportManagerCookie } }))
      .status,
    403
  );
  assert.equal(
    (await fetch(`${baseUrl}/api/admin/media`, { headers: { Cookie: supportManagerCookie } }))
      .status,
    403
  );
  assert.equal(
    (await fetch(`${baseUrl}/api/admin/users`, { headers: { Cookie: supportManagerCookie } }))
      .status,
    403
  );
});

test('4. Company content drafts stay private until published and disappear on unpublish', async () => {
  const customConcept = 'Connected Communities From Chittoor To All India';
  const draftSave = await fetch(`${baseUrl}/api/admin/company/about`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Cookie: contentManagerCookie },
    body: JSON.stringify({
      data: {
        companyName: 'MAATA TECHNOLOGIES',
        publicBrand: 'MAATA India',
        tagline: 'Built in India. Designed for Indians.',
        centralConcept: customConcept,
        heroSupportingText: 'Updated draft text',
        whyMaataHeadline: 'Why MAATA',
        whyMaataBody: 'Draft narrative body',
      },
    }),
  });
  assert.equal(draftSave.status, 200);

  // Before publish, public bootstrap must still show seeded value
  const publicBefore = await fetch(`${baseUrl}/api/public/bootstrap`).then((r) => r.json());
  assert.notEqual(publicBefore.companySections.about.centralConcept, customConcept);

  // Publish section
  const pubRes = await fetch(`${baseUrl}/api/admin/company/about/publish`, {
    method: 'POST',
    headers: { Cookie: contentManagerCookie },
  });
  assert.equal(pubRes.status, 200);

  const publicAfter = await fetch(`${baseUrl}/api/public/bootstrap`).then((r) => r.json());
  assert.equal(publicAfter.companySections.about.centralConcept, customConcept);

  // Unpublish section
  const unpubRes = await fetch(`${baseUrl}/api/admin/company/about/unpublish`, {
    method: 'POST',
    headers: { Cookie: contentManagerCookie },
  });
  assert.equal(unpubRes.status, 200);

  const publicAfterUnpub = await fetch(`${baseUrl}/api/public/bootstrap`).then((r) => r.json());
  assert.equal(publicAfterUnpub.companySections.about, undefined);
});

test('5. Article draft stays hidden publicly, published article appears on public Newsroom, and delete removes it', async () => {
  const slug = 'test-chittoor-merchant-update';
  const createRes = await fetch(`${baseUrl}/api/admin/articles`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: contentManagerCookie },
    body: JSON.stringify({
      title: 'Chittoor Merchant Tools Expansion',
      slug,
      coverImageUrl: '',
      shortSummary: 'Practical billing and stock tools for neighbourhood stores.',
      content: 'Detailed article body explaining practical merchant workflows across Chittoor.',
      author: 'MAATA Product Team',
      category: 'Product Updates',
      tags: ['MAATA Business'],
      seoTitle: 'Chittoor Merchant Tools',
      seoDescription: 'Merchant tools overview',
      publishAt: null,
      status: 'draft',
    }),
  });
  assert.equal(createRes.status, 201);
  const { id } = await createRes.json();

  // Draft must NOT be publicly accessible
  const pubDraftCheck = await fetch(`${baseUrl}/api/public/articles/${slug}`);
  assert.equal(pubDraftCheck.status, 404);

  // Publish article
  const updateRes = await fetch(`${baseUrl}/api/admin/articles/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Cookie: contentManagerCookie },
    body: JSON.stringify({
      title: 'Chittoor Merchant Tools Expansion',
      slug,
      coverImageUrl: '',
      shortSummary: 'Practical billing and stock tools for neighbourhood stores.',
      content: 'Detailed article body explaining practical merchant workflows across Chittoor.',
      author: 'MAATA Product Team',
      category: 'Product Updates',
      tags: ['MAATA Business'],
      seoTitle: 'Chittoor Merchant Tools',
      seoDescription: 'Merchant tools overview',
      publishAt: null,
      status: 'published',
    }),
  });
  assert.equal(updateRes.status, 200);

  const pubLive = await fetch(`${baseUrl}/api/public/articles/${slug}`);
  assert.equal(pubLive.status, 200);
  const pubList = await fetch(`${baseUrl}/api/public/articles`).then((r) => r.json());
  assert.ok(pubList.items.some((a: any) => a.slug === slug));

  // Delete article
  const delRes = await fetch(`${baseUrl}/api/admin/articles/${id}`, {
    method: 'DELETE',
    headers: { Cookie: contentManagerCookie },
  });
  assert.equal(delRes.status, 200);
  assert.equal((await fetch(`${baseUrl}/api/public/articles/${slug}`)).status, 404);
});

test('6. Website announcement banners honor active window and hide once expired', async () => {
  const pastStart = new Date(Date.now() - 3600 * 1000).toISOString();
  const futureExpiry = new Date(Date.now() + 3600 * 1000).toISOString();

  const createAnn = await fetch(`${baseUrl}/api/admin/announcements`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: contentManagerCookie },
    body: JSON.stringify({
      kind: 'service_notification',
      title: 'Scheduled Maintenance Window Complete',
      summary: 'All MAATA India local services are operating normally.',
      body: 'Full operational notice.',
      imageUrl: '',
      isPinned: true,
      visibility: 'public',
      status: 'published',
      showAsBanner: true,
      publishAt: pastStart,
      startsAt: pastStart,
      expiresAt: futureExpiry,
    }),
  });
  assert.equal(createAnn.status, 201);
  const { id } = await createAnn.json();

  const bootActive = await fetch(`${baseUrl}/api/public/bootstrap`).then((r) => r.json());
  assert.ok(bootActive.banners.some((b: any) => b.id === id));

  // Expire banner
  const expiredTime = new Date(Date.now() - 60 * 1000).toISOString();
  const expireRes = await fetch(`${baseUrl}/api/admin/announcements/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Cookie: contentManagerCookie },
    body: JSON.stringify({
      kind: 'service_notification',
      title: 'Scheduled Maintenance Window Complete',
      summary: 'All MAATA India local services are operating normally.',
      body: 'Full operational notice.',
      imageUrl: '',
      isPinned: true,
      visibility: 'public',
      status: 'published',
      showAsBanner: true,
      publishAt: pastStart,
      startsAt: pastStart,
      expiresAt: expiredTime,
    }),
  });
  assert.equal(expireRes.status, 200);

  const bootExpired = await fetch(`${baseUrl}/api/public/bootstrap`).then((r) => r.json());
  assert.ok(!bootExpired.banners.some((b: any) => b.id === id));
});

test('7. Media upload validates image magic bytes, serves uploaded assets, and protects original MAATA logo', async () => {
  // Valid PNG upload
  const validForm = new FormData();
  validForm.append(
    'file',
    new Blob([new Uint8Array(createValidPngBuffer())], { type: 'image/png' }),
    'test-banner.png'
  );
  validForm.append('category', 'banner');
  validForm.append('altText', 'Test MAATA Banner Image');

  const uploadRes = await fetch(`${baseUrl}/api/admin/media`, {
    method: 'POST',
    headers: { Cookie: contentManagerCookie },
    body: validForm,
  });
  assert.equal(uploadRes.status, 201);
  const uploaded = await uploadRes.json();
  assert.ok(uploaded.url.startsWith('/media/'));

  const servedImg = await fetch(`${baseUrl}${uploaded.url}`);
  assert.equal(servedImg.status, 200);

  // Invalid magic bytes disguised as PNG must be rejected
  const spoofForm = new FormData();
  spoofForm.append(
    'file',
    new Blob([new Uint8Array(Buffer.from('NOT_A_REAL_PNG_FILE'))], { type: 'image/png' }),
    'spoof.png'
  );
  spoofForm.append('category', 'approved_media');
  spoofForm.append('altText', 'Spoof image');

  const spoofRes = await fetch(`${baseUrl}/api/admin/media`, {
    method: 'POST',
    headers: { Cookie: contentManagerCookie },
    body: spoofForm,
  });
  assert.equal(spoofRes.status, 400);

  // Original MAATA logo deletion must be forbidden (403)
  const logoDelRes = await fetch(`${baseUrl}/api/admin/media/media-logo-original`, {
    method: 'DELETE',
    headers: { Cookie: superAdminCookie },
  });
  assert.equal(logoDelRes.status, 403);
});

test('8. Public enquiry submission flows to support_manager queue, resolution, and CSV export', async () => {
  const pubSubmit = await fetch(`${baseUrl}/api/public/enquiries`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type: 'partnership',
      fullName: 'Ramesh Kirana Store',
      email: 'ramesh@example.in',
      organisation: 'Sri Balaji Provisions, Chittoor',
      subjectContext: 'Merchant Onboarding',
      message: 'We would like to learn more about MAATA Business billing and storefront tools.',
    }),
  });
  assert.equal(pubSubmit.status, 201);
  const created = await pubSubmit.json();
  assert.ok(created.id.startsWith('ENQ-'));

  const listRes = await fetch(`${baseUrl}/api/admin/enquiries?type=partnership`, {
    headers: { Cookie: supportManagerCookie },
  }).then((r) => r.json());
  assert.ok(listRes.items.some((item: any) => item.id === created.id));

  const patchRes = await fetch(`${baseUrl}/api/admin/enquiries/${created.id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Cookie: supportManagerCookie },
    body: JSON.stringify({
      status: 'resolved',
      internalNotes: 'Shared MAATA Business onboarding details.',
    }),
  });
  assert.equal(patchRes.status, 200);

  const csvRes = await fetch(`${baseUrl}/api/admin/enquiries/export?type=partnership`, {
    headers: { Cookie: supportManagerCookie },
  });
  assert.equal(csvRes.status, 200);
  assert.ok((csvRes.headers.get('content-type') || '').includes('text/csv'));
  const csvText = await csvRes.text();
  assert.ok(csvText.includes(created.id));
});

test('9. Password reset invalidates prior sessions and updates login credentials', async () => {
  const forgotRes = await fetch(`${baseUrl}/api/admin/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'support@maataapp.com' }),
  });
  assert.equal(forgotRes.status, 200);
  const forgotBody = await forgotRes.json();
  assert.ok(forgotBody.devPreviewToken);

  const resetRes = await fetch(`${baseUrl}/api/admin/auth/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      token: forgotBody.devPreviewToken,
      newPassword: 'UpdatedSupportPassword456',
    }),
  });
  assert.equal(resetRes.status, 200);

  // Prior supportManagerCookie must now be invalidated (401)
  const oldSessionCheck = await fetch(`${baseUrl}/api/admin/auth/me`, {
    headers: { Cookie: supportManagerCookie },
  });
  assert.equal(oldSessionCheck.status, 401);

  // Login with new password succeeds
  const newLogin = await fetch(`${baseUrl}/api/admin/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'support@maataapp.com',
      password: 'UpdatedSupportPassword456',
    }),
  });
  assert.equal(newLogin.status, 200);
  supportManagerCookie = extractSessionCookie(newLogin);
});

test('10. Logout terminates session and subsequent /me returns 401', async () => {
  const logoutRes = await fetch(`${baseUrl}/api/admin/auth/logout`, {
    method: 'POST',
    headers: { Cookie: supportManagerCookie },
  });
  assert.equal(logoutRes.status, 200);

  const meAfterLogout = await fetch(`${baseUrl}/api/admin/auth/me`, {
    headers: { Cookie: supportManagerCookie },
  });
  assert.equal(meAfterLogout.status, 401);
});

test('11. Unauthenticated requests to Private Leadership endpoints return 401', async () => {
  for (const endpoint of [
    '/api/leadership/auth/me',
    '/api/leadership/overview',
    '/api/leadership/work-items?domain=product',
    '/api/leadership/reports',
    '/api/leadership/documents',
    '/api/leadership/login-history',
    '/api/leadership/team',
  ]) {
    const res = await fetch(`${baseUrl}${endpoint}`);
    assert.equal(res.status, 401, `Expected 401 on ${endpoint}`);
  }
});

test('12. Non-leadership accounts cannot bypass Private Leadership Access role check', async () => {
  const cmLoginFail = await fetch(`${baseUrl}/api/leadership/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      selectedRole: 'founder',
      email: 'content@maataapp.com',
      password: 'ContentPassword123',
    }),
  });
  assert.equal(cmLoginFail.status, 403);

  const cmOverviewFail = await fetch(`${baseUrl}/api/leadership/overview`, {
    headers: { Cookie: contentManagerCookie },
  });
  assert.equal(cmOverviewFail.status, 403);
});

test('13. Founder & Co-Founder/CEO accounts enforce exact role selection and server-side permissions', async () => {
  // Super Admin without Founder/CEO designation cannot enter Private Leadership Portal
  assert.equal(
    (await fetch(`${baseUrl}/api/leadership/overview`, { headers: { Cookie: superAdminCookie } })).status,
    403
  );

  const createFounder = await fetch(`${baseUrl}/api/admin/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: superAdminCookie },
    body: JSON.stringify({
      name: 'G. Balaji Reddy',
      email: 'founder@maataapp.com',
      password: 'FounderSecurePassword123',
      role: 'founder',
      leadershipRole: 'founder',
    }),
  });
  assert.equal(createFounder.status, 201);

  const createCeo = await fetch(`${baseUrl}/api/admin/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: superAdminCookie },
    body: JSON.stringify({
      name: 'G. Pavani',
      email: 'ceo@maataapp.com',
      password: 'CeoSecurePassword123',
      role: 'ceo',
      leadershipRole: 'ceo',
    }),
  });
  assert.equal(createCeo.status, 201);

  // Founder attempting to select Co-Founder & CEO must be blocked (403)
  const founderSpoofCeo = await fetch(`${baseUrl}/api/leadership/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      selectedRole: 'ceo',
      email: 'founder@maataapp.com',
      password: 'FounderSecurePassword123',
    }),
  });
  assert.equal(founderSpoofCeo.status, 403);

  // Founder selecting Founder succeeds
  const founderLogin = await fetch(`${baseUrl}/api/leadership/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      selectedRole: 'founder',
      email: 'founder@maataapp.com',
      password: 'FounderSecurePassword123',
    }),
  });
  assert.equal(founderLogin.status, 200);
  const founderCookie = extractSessionCookie(founderLogin);

  // Founder can read product tracker & write reports, but cannot write product tracker or publish CMS articles
  assert.equal(
    (await fetch(`${baseUrl}/api/leadership/work-items?domain=product`, { headers: { Cookie: founderCookie } }))
      .status,
    200
  );
  assert.equal(
    (
      await fetch(`${baseUrl}/api/leadership/work-items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: founderCookie },
        body: JSON.stringify({ domain: 'product', title: 'Unauthorised Product Edit' }),
      })
    ).status,
    403
  );
  assert.equal(
    (await fetch(`${baseUrl}/api/admin/articles`, { headers: { Cookie: founderCookie } })).status,
    403
  );
  assert.equal(
    (
      await fetch(`${baseUrl}/api/leadership/reports`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: founderCookie },
        body: JSON.stringify({
          title: 'Chittoor Merchant Expansion Brief',
          reportType: 'merchant_growth',
          periodLabel: 'Q2 Review',
          summary: 'Summary of Chittoor retail merchant onboarding targets.',
          metrics: [{ label: 'Retail Partners', value: '84' }],
          status: 'final',
        }),
      })
    ).status,
    201
  );

  // CEO attempting to select Founder must be blocked (403)
  const ceoSpoofFounder = await fetch(`${baseUrl}/api/leadership/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      selectedRole: 'founder',
      email: 'ceo@maataapp.com',
      password: 'CeoSecurePassword123',
    }),
  });
  assert.equal(ceoSpoofFounder.status, 403);

  // CEO selecting Co-Founder & CEO succeeds
  const ceoLogin = await fetch(`${baseUrl}/api/leadership/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      selectedRole: 'ceo',
      email: 'ceo@maataapp.com',
      password: 'CeoSecurePassword123',
    }),
  });
  assert.equal(ceoLogin.status, 200);
  const ceoCookie = extractSessionCookie(ceoLogin);

  // CEO can write product milestones and access CMS publishing, but cannot access Super Admin team management
  assert.equal(
    (
      await fetch(`${baseUrl}/api/leadership/work-items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: ceoCookie },
        body: JSON.stringify({
          domain: 'product',
          title: 'MAATA Merchant Billing Flow QA',
          category: 'MAATA Business',
          priority: 'high',
          status: 'in_progress',
          progressPct: 65,
        }),
      })
    ).status,
    201
  );
  assert.equal(
    (await fetch(`${baseUrl}/api/admin/articles`, { headers: { Cookie: ceoCookie } })).status,
    200
  );
  assert.equal(
    (await fetch(`${baseUrl}/api/leadership/team`, { headers: { Cookie: ceoCookie } })).status,
    403
  );
});

test('14. Optional TOTP 2FA enrollment enforces authenticator code during Private Leadership login', async () => {
  const { generateTotpCode } = await import('../server/auth/security.ts');

  const ceoLogin = await fetch(`${baseUrl}/api/leadership/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      selectedRole: 'ceo',
      email: 'ceo@maataapp.com',
      password: 'CeoSecurePassword123',
    }),
  });
  assert.equal(ceoLogin.status, 200);
  const ceoCookie = extractSessionCookie(ceoLogin);

  const setupRes = await fetch(`${baseUrl}/api/leadership/auth/mfa/setup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: ceoCookie },
    body: JSON.stringify({ currentPassword: 'CeoSecurePassword123' }),
  });
  assert.equal(setupRes.status, 200);
  const { secret, qrDataUrl } = await setupRes.json();
  assert.ok(secret.length >= 16);
  assert.ok(qrDataUrl.startsWith('data:image/png;base64,'));

  const validCode = generateTotpCode(secret);
  const enableRes = await fetch(`${baseUrl}/api/leadership/auth/mfa/enable`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: ceoCookie },
    body: JSON.stringify({ totpCode: validCode }),
  });
  assert.equal(enableRes.status, 200);

  // Subsequent login without TOTP prompts for 2FA challenge
  const challengeRes = await fetch(`${baseUrl}/api/leadership/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      selectedRole: 'ceo',
      email: 'ceo@maataapp.com',
      password: 'CeoSecurePassword123',
    }),
  });
  assert.equal(challengeRes.status, 200);
  const challengeBody = await challengeRes.json();
  assert.equal(challengeBody.mfaRequired, true);

  // Login with wrong TOTP fails (401)
  const badMfa = await fetch(`${baseUrl}/api/leadership/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      selectedRole: 'ceo',
      email: 'ceo@maataapp.com',
      password: 'CeoSecurePassword123',
      totpCode: '000000',
    }),
  });
  assert.equal(badMfa.status, 401);

  // Login with valid TOTP succeeds
  const goodMfa = await fetch(`${baseUrl}/api/leadership/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      selectedRole: 'ceo',
      email: 'ceo@maataapp.com',
      password: 'CeoSecurePassword123',
      totpCode: generateTotpCode(secret),
    }),
  });
  assert.equal(goodMfa.status, 200);
  const mfaCookie = extractSessionCookie(goodMfa);

  // Disable MFA cleanly
  const disableRes = await fetch(`${baseUrl}/api/leadership/auth/mfa/disable`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: mfaCookie },
    body: JSON.stringify({ currentPassword: 'CeoSecurePassword123' }),
  });
  assert.equal(disableRes.status, 200);
});

test('15. Confidential company documents require authentication for download and login history logs attempts', async () => {
  const ceoLogin = await fetch(`${baseUrl}/api/leadership/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      selectedRole: 'ceo',
      email: 'ceo@maataapp.com',
      password: 'CeoSecurePassword123',
    }),
  });
  assert.equal(ceoLogin.status, 200);
  const ceoCookie = extractSessionCookie(ceoLogin);

  const docForm = new FormData();
  docForm.append('title', 'Chittoor Regional Rollout Governance Brief');
  docForm.append('category', 'strategy');
  docForm.append('summary', 'Confidential quarterly partnership brief.');
  docForm.append('classification', 'executive_confidential');
  docForm.append(
    'file',
    new Blob(['MAATA confidential rollout strategy text'], { type: 'text/plain' }),
    'rollout-brief.txt'
  );

  const createDoc = await fetch(`${baseUrl}/api/leadership/documents`, {
    method: 'POST',
    headers: { Cookie: ceoCookie },
    body: docForm,
  });
  assert.equal(createDoc.status, 201);
  const { id: docId } = await createDoc.json();

  // Unauthenticated download must be blocked (401)
  assert.equal((await fetch(`${baseUrl}/api/leadership/documents/${docId}/download`)).status, 401);

  // Authenticated download succeeds
  const dlRes = await fetch(`${baseUrl}/api/leadership/documents/${docId}/download`, {
    headers: { Cookie: ceoCookie },
  });
  assert.equal(dlRes.status, 200);
  assert.equal(await dlRes.text(), 'MAATA confidential rollout strategy text');

  // Login audit history captures both successful & failed Private Leadership Access attempts
  const historyRes = await fetch(`${baseUrl}/api/leadership/login-history`, {
    headers: { Cookie: ceoCookie },
  });
  assert.equal(historyRes.status, 200);
  const historyBody = await historyRes.json();
  assert.ok(historyBody.items.some((e: any) => e.action === 'LEADERSHIP_LOGIN_SUCCESS'));
  assert.ok(historyBody.items.some((e: any) => e.action === 'LEADERSHIP_LOGIN_FAILED'));

  // Promote a Super Admin + CEO executive to verify /api/leadership/team access control
  const usersList = await fetch(`${baseUrl}/api/admin/users`, {
    headers: { Cookie: superAdminCookie },
  }).then((r) => r.json());
  const superUser = usersList.items.find((u: any) => u.email === 'super@maataapp.com');
  assert.ok(superUser);
  const promoteRes = await fetch(`${baseUrl}/api/admin/users/${superUser.id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Cookie: superAdminCookie },
    body: JSON.stringify({ leadershipRole: 'ceo' }),
  });
  assert.equal(promoteRes.status, 200);

  const teamRes = await fetch(`${baseUrl}/api/leadership/team`, {
    headers: { Cookie: superAdminCookie },
  });
  assert.equal(teamRes.status, 200);
  const teamBody = await teamRes.json();
  assert.ok(Array.isArray(teamBody.availablePermissions));
  assert.ok(teamBody.items.some((u: any) => u.email === 'founder@maataapp.com'));
});

test('16. Public bootstrap returns seeded Founder Gallery and reflects Media Library additions & edits', async () => {
  const initialBoot = await fetch(`${baseUrl}/api/public/bootstrap`).then((r) => r.json());
  assert.ok(Array.isArray(initialBoot.founderGallery));
  assert.equal(initialBoot.founderGallery.length, 4);
  assert.equal(initialBoot.founderGallery[0].url, '/assets/aistudio/image_6fa97355.png');

  // Upload a 5th Founder Gallery photo via Admin Media Library
  const galleryForm = new FormData();
  galleryForm.append(
    'file',
    new Blob([new Uint8Array(createValidPngBuffer())], { type: 'image/png' }),
    'founders-milestone-05.png'
  );
  galleryForm.append('category', 'founder_gallery');
  galleryForm.append('altText', 'G. Balaji Reddy and G. Pavani at Chittoor merchant summit');
  galleryForm.append('caption', 'Meeting local retail leaders in Chittoor.');
  galleryForm.append('focalPosition', '50% 30%');

  const uploadRes = await fetch(`${baseUrl}/api/admin/media`, {
    method: 'POST',
    headers: { Cookie: contentManagerCookie },
    body: galleryForm,
  });
  assert.equal(uploadRes.status, 201);
  const createdSlide = await uploadRes.json();
  assert.equal(createdSlide.category, 'founder_gallery');

  const updatedBoot = await fetch(`${baseUrl}/api/public/bootstrap`).then((r) => r.json());
  assert.equal(updatedBoot.founderGallery.length, 5);
  const added = updatedBoot.founderGallery.find((s: any) => s.id === createdSlide.id);
  assert.ok(added);
  assert.equal(added.caption, 'Meeting local retail leaders in Chittoor.');
  assert.equal(added.focal_position, '50% 30%');
});

test('17. Private Leadership sessions emit iframe-compatible HTTPS cookie flags, persist across /me checks, expire cleanly, and clear on logout', async () => {
  const { getDb } = await import('../server/db/database.ts');
  const { hashToken } = await import('../server/auth/security.ts');

  const proxyHeaders = {
    'Content-Type': 'application/json',
    'X-Forwarded-Proto': 'https',
    Origin: 'https://aistudio.google.com',
  };

  // Founder login behind HTTPS iframe proxy
  const founderLogin = await fetch(`${baseUrl}/api/leadership/auth/login`, {
    method: 'POST',
    headers: proxyHeaders,
    body: JSON.stringify({
      selectedRole: 'founder',
      email: 'founder@maataapp.com',
      password: 'FounderSecurePassword123',
    }),
  });
  assert.equal(founderLogin.status, 200);
  assert.match(founderLogin.headers.get('cache-control') || '', /no-store/i);
  const founderSetCookie = founderLogin.headers.get('set-cookie') || '';
  assert.match(founderSetCookie, /HttpOnly/i);
  assert.match(founderSetCookie, /Secure/i);
  assert.match(founderSetCookie, /SameSite=None/i);
  assert.match(founderSetCookie, /Partitioned/i);
  assert.match(founderSetCookie, /Path=\//i);

  const founderCookie = extractSessionCookie(founderLogin);
  assert.ok(founderCookie.includes('maata_admin_session='));

  // Session persists across both /api/leadership/auth/me and /api/admin/auth/me (simulating page refresh)
  const founderMe = await fetch(`${baseUrl}/api/leadership/auth/me`, {
    headers: { Cookie: founderCookie },
  });
  assert.equal(founderMe.status, 200);
  assert.match(founderMe.headers.get('cache-control') || '', /no-store/i);
  const founderMeJson = await founderMe.json();
  assert.equal(founderMeJson.user.email, 'founder@maataapp.com');
  assert.equal(founderMeJson.user.leadershipRole, 'founder');

  const founderAdminMe = await fetch(`${baseUrl}/api/admin/auth/me`, {
    headers: { Cookie: founderCookie },
  });
  assert.equal(founderAdminMe.status, 200);

  // Co-Founder & CEO login also works with HTTPS iframe proxy cookies
  const ceoLogin = await fetch(`${baseUrl}/api/leadership/auth/login`, {
    method: 'POST',
    headers: proxyHeaders,
    body: JSON.stringify({
      selectedRole: 'ceo',
      email: 'ceo@maataapp.com',
      password: 'CeoSecurePassword123',
    }),
  });
  assert.equal(ceoLogin.status, 200);
  const ceoCookie = extractSessionCookie(ceoLogin);
  const ceoMe = await fetch(`${baseUrl}/api/leadership/auth/me`, {
    headers: { Cookie: ceoCookie },
  });
  assert.equal(ceoMe.status, 200);
  const ceoMeJson = await ceoMe.json();
  assert.equal(ceoMeJson.user.email, 'ceo@maataapp.com');
  assert.equal(ceoMeJson.user.leadershipRole, 'ceo');

  // Logout clears Founder session
  const logoutRes = await fetch(`${baseUrl}/api/leadership/auth/logout`, {
    method: 'POST',
    headers: { Cookie: founderCookie, 'X-Forwarded-Proto': 'https' },
  });
  assert.equal(logoutRes.status, 200);
  const founderAfterLogout = await fetch(`${baseUrl}/api/leadership/auth/me`, {
    headers: { Cookie: founderCookie },
  });
  assert.equal(founderAfterLogout.status, 401);
  const afterLogoutJson = await founderAfterLogout.json();
  assert.equal(afterLogoutJson.code, 'SESSION_EXPIRED');

  // Simulate expired CEO session in SQLite and verify clear SESSION_EXPIRED error
  const rawCeoToken = ceoCookie.replace('maata_admin_session=', '');
  const db = getDb();
  db.prepare('UPDATE admin_sessions SET expires_at = ? WHERE token_hash = ?').run(
    new Date(Date.now() - 60_000).toISOString(),
    hashToken(rawCeoToken)
  );
  const expiredCheck = await fetch(`${baseUrl}/api/leadership/auth/me`, {
    headers: { Cookie: ceoCookie },
  });
  assert.equal(expiredCheck.status, 401);
  const expiredJson = await expiredCheck.json();
  assert.equal(expiredJson.code, 'SESSION_EXPIRED');
  assert.match(expiredJson.error, /expired/i);
});

test('18. Multilingual CMS translations stay isolated as drafts until published, preserve English, and obey RBAC', async () => {
  // Re-login Support Manager (logged out in Test 10)
  const smLoginRes = await fetch(`${baseUrl}/api/admin/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'support@maataapp.com',
      password: 'UpdatedSupportPassword456',
    }),
  });
  assert.equal(smLoginRes.status, 200);
  const freshSupportCookie = extractSessionCookie(smLoginRes);

  // Unauthenticated & Support Manager are denied access to translation endpoints
  const unauthSummary = await fetch(`${baseUrl}/api/admin/translations/summary?entityType=company_section`);
  assert.equal(unauthSummary.status, 401);

  const smSummary = await fetch(`${baseUrl}/api/admin/translations/summary?entityType=company_section`, {
    headers: { Cookie: freshSupportCookie },
  });
  assert.equal(smSummary.status, 403);

  // Invalid locale or entityType rejected
  const invalidPut = await fetch(`${baseUrl}/api/admin/translations/company_section/vision_mission/fr`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Cookie: contentManagerCookie },
    body: JSON.stringify({ data: { headline: 'Invalid' } }),
  });
  assert.equal(invalidPut.status, 400);

  // Create & publish a test article and announcement to verify full entity translation resolution
  const artSlug = 'multilingual-i18n-article-test';
  const createArt = await fetch(`${baseUrl}/api/admin/articles`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: contentManagerCookie },
    body: JSON.stringify({
      title: 'English Original Headline',
      slug: artSlug,
      coverImageUrl: '',
      shortSummary: 'English original short summary for testing fallback.',
      content: 'Detailed English article body that remains untouched when Telugu draft or publish is updated.',
      author: 'G. Pavani',
      category: 'Announcements',
      tags: ['MAATA India'],
      seoTitle: 'English Original SEO',
      seoDescription: 'English Original SEO Description',
      status: 'published',
    }),
  });
  assert.equal(createArt.status, 201);
  const { id: articleId } = await createArt.json();

  const createAnn = await fetch(`${baseUrl}/api/admin/announcements`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: contentManagerCookie },
    body: JSON.stringify({
      kind: 'product_update',
      title: 'English Banner Title',
      summary: 'English banner summary message.',
      body: 'English banner body copy.',
      isPinned: false,
      visibility: 'public',
      status: 'published',
      showAsBanner: true,
    }),
  });
  assert.equal(createAnn.status, 201);
  const { id: announcementId } = await createAnn.json();

  // Save Telugu draft translations for company_section, article, and announcement
  const teSectionDraft = { vision: 'భారతదేశం అంతటా డిజిటల్ అనుభవాలు' };
  const teArticleDraft = {
    title: 'తెలుగు శీర్షిక పరీక్ష',
    shortSummary: 'ఇది తెలుగు సారాంశం పరీక్ష.',
    content: 'తెలుగు కథనం పూర్తి వివరాలు ఇక్కడ ఉన్నాయి.',
  };
  const teAnnDraft = {
    title: 'తెలుగు ప్రకటన శీర్షిక',
    summary: 'తెలుగు ప్రకటన సారాంశం.',
  };

  assert.equal(
    (
      await fetch(`${baseUrl}/api/admin/translations/company_section/vision_mission/te`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Cookie: contentManagerCookie },
        body: JSON.stringify({ data: teSectionDraft }),
      })
    ).status,
    200
  );
  assert.equal(
    (
      await fetch(`${baseUrl}/api/admin/translations/article/${articleId}/te`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Cookie: contentManagerCookie },
        body: JSON.stringify({ data: teArticleDraft }),
      })
    ).status,
    200
  );
  assert.equal(
    (
      await fetch(`${baseUrl}/api/admin/translations/announcement/${announcementId}/te`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Cookie: contentManagerCookie },
        body: JSON.stringify({ data: teAnnDraft }),
      })
    ).status,
    200
  );

  // Draft translations MUST NOT leak to public ?lang=te endpoints before publish
  const bootDraft = await fetch(`${baseUrl}/api/public/bootstrap?lang=te`).then((r) => r.json());
  assert.equal(bootDraft.language, 'te');
  assert.equal(bootDraft.translations.companySections.vision_mission, undefined);
  assert.equal(bootDraft.translations.articles[articleId], undefined);
  assert.equal(bootDraft.translations.announcements[announcementId], undefined);

  const artDraftPublic = await fetch(`${baseUrl}/api/public/articles/${artSlug}?lang=te`).then((r) => r.json());
  assert.equal(artDraftPublic.title, 'English Original Headline');

  // Admin summary shows draftCount = 1 before publishing
  const summaryBeforePub = await fetch(
    `${baseUrl}/api/admin/translations/summary?entityType=article`,
    { headers: { Cookie: contentManagerCookie } }
  ).then((r) => r.json());
  assert.equal(summaryBeforePub.totalTargetLocales, 9);
  assert.equal(summaryBeforePub.summary[articleId]?.draftCount, 1);
  assert.equal(summaryBeforePub.summary[articleId]?.publishedCount, 0);

  // Publish all three Telugu translations
  assert.equal(
    (
      await fetch(`${baseUrl}/api/admin/translations/company_section/vision_mission/te/publish`, {
        method: 'POST',
        headers: { Cookie: contentManagerCookie },
      })
    ).status,
    200
  );
  assert.equal(
    (
      await fetch(`${baseUrl}/api/admin/translations/article/${articleId}/te/publish`, {
        method: 'POST',
        headers: { Cookie: contentManagerCookie },
      })
    ).status,
    200
  );
  assert.equal(
    (
      await fetch(`${baseUrl}/api/admin/translations/announcement/${announcementId}/te/publish`, {
        method: 'POST',
        headers: { Cookie: contentManagerCookie },
      })
    ).status,
    200
  );

  // Public endpoints now serve published Telugu translations ONLY for lang=te
  const bootPublishedTe = await fetch(`${baseUrl}/api/public/bootstrap?lang=te`).then((r) => r.json());
  assert.equal(bootPublishedTe.translations.companySections.vision_mission?.vision, teSectionDraft.vision);
  assert.equal(bootPublishedTe.translations.articles[articleId]?.title, teArticleDraft.title);
  assert.equal(bootPublishedTe.translations.announcements[announcementId]?.title, teAnnDraft.title);

  const artPublishedTe = await fetch(`${baseUrl}/api/public/articles/${artSlug}?lang=te`).then((r) => r.json());
  assert.equal(artPublishedTe.title, teArticleDraft.title);
  assert.equal(artPublishedTe.author, 'G. Pavani'); // Untranslated field falls back cleanly

  const annPublishedTe = await fetch(`${baseUrl}/api/public/announcements?lang=te`).then((r) => r.json());
  const teAnnItem = annPublishedTe.items.find((x: any) => x.id === announcementId);
  assert.equal(teAnnItem?.title, teAnnDraft.title);

  // English default & other untouched languages (e.g., hi) remain completely intact in English
  const artPublishedEn = await fetch(`${baseUrl}/api/public/articles/${artSlug}`).then((r) => r.json());
  assert.equal(artPublishedEn.title, 'English Original Headline');

  const artPublishedHi = await fetch(`${baseUrl}/api/public/articles/${artSlug}?lang=hi`).then((r) => r.json());
  assert.equal(artPublishedHi.title, 'English Original Headline');

  // Unpublish Telugu article translation -> reverts immediately on public endpoint
  assert.equal(
    (
      await fetch(`${baseUrl}/api/admin/translations/article/${articleId}/te/unpublish`, {
        method: 'POST',
        headers: { Cookie: contentManagerCookie },
      })
    ).status,
    200
  );

  const artAfterUnpublish = await fetch(`${baseUrl}/api/public/articles/${artSlug}?lang=te`).then((r) => r.json());
  assert.equal(artAfterUnpublish.title, 'English Original Headline');

  // Cleanup test article & announcement
  await fetch(`${baseUrl}/api/admin/articles/${articleId}`, {
    method: 'DELETE',
    headers: { Cookie: contentManagerCookie },
  });
  await fetch(`${baseUrl}/api/admin/announcements/${announcementId}`, {
    method: 'DELETE',
    headers: { Cookie: contentManagerCookie },
  });
});




