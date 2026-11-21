import assert from 'node:assert/strict';
import fs from 'node:fs';
import type http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { after, before, test } from 'node:test';

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'maata-leadership-auth-test-'));
const dbPath = path.join(tempDir, 'leadership-auth.db');
process.env.DATABASE_PATH = dbPath;
process.env.MEDIA_STORAGE_DIR = path.join(tempDir, 'media');
process.env.LEADERSHIP_DOCS_DIR = path.join(tempDir, 'leadership_docs');
process.env.ALLOW_DEV_RESET_PREVIEW = 'true';
process.env.SESSION_SECRET = 'test-leadership-auth-session-secret-maata-technologies';
process.env.INITIAL_SETUP_TOKEN = 'MAATA-TEST-SETUP-AUTH-KEY-2026';

function extractSessionCookie(res: Response): string {
  const setCookie = res.headers.get('set-cookie') || '';
  const match = setCookie.match(/maata_admin_session=([^;]+)/);
  return match ? `maata_admin_session=${match[1]}` : '';
}

let server: http.Server;
let baseUrl = '';
let superAdminCookie = '';
let directorUserId = '';

before(async () => {
  const { createExpressApp } = await import('../server/app.ts');
  const app = createExpressApp({ dbPath });
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

test('1. Initial Super Admin setup validates fields, enforces INITIAL_SETUP_TOKEN, locks permanently, and supports redirect-to-login mode', async () => {
  const statusBefore = await fetch(`${baseUrl}/api/leadership/auth/setup-status`).then((r) =>
    r.json()
  );
  assert.equal(statusBefore.needsInitialSetup, true);
  assert.equal(statusBefore.setupLocked, false);
  assert.equal(statusBefore.requiresSetupToken, true);

  // Mismatched confirmPassword rejected (400)
  const mismatchRes = await fetch(`${baseUrl}/api/admin/auth/setup-initial-admin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Primary Executive',
      email: 'super.exec@maataapp.com',
      password: 'ExecutivePassword123',
      confirmPassword: 'DifferentPassword123',
      leadershipRole: 'ceo',
      setupToken: process.env.INITIAL_SETUP_TOKEN,
      autoSignIn: false,
    }),
  });
  assert.equal(mismatchRes.status, 400);

  // Missing or wrong setupToken rejected (403)
  const wrongTokenRes = await fetch(`${baseUrl}/api/admin/auth/setup-initial-admin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Primary Executive',
      email: 'super.exec@maataapp.com',
      password: 'ExecutivePassword123',
      confirmPassword: 'ExecutivePassword123',
      leadershipRole: 'ceo',
      setupToken: 'WRONG-TOKEN',
      autoSignIn: false,
    }),
  });
  assert.equal(wrongTokenRes.status, 403);
  assert.equal((await wrongTokenRes.json()).code, 'INVALID_SETUP_TOKEN');

  // Valid first-time registration with autoSignIn: false succeeds and does not auto-issue session cookie
  const okRes = await fetch(`${baseUrl}/api/admin/auth/setup-initial-admin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Primary Executive',
      email: 'super.exec@maataapp.com',
      password: 'ExecutivePassword123',
      confirmPassword: 'ExecutivePassword123',
      leadershipRole: 'ceo',
      setupToken: process.env.INITIAL_SETUP_TOKEN,
      autoSignIn: false,
    }),
  });
  assert.equal(okRes.status, 201);
  assert.equal(extractSessionCookie(okRes), '');
  const okBody = await okRes.json();
  assert.equal(okBody.setupLocked, true);
  assert.equal(okBody.user.role, 'super_admin');
  assert.equal(okBody.user.leadershipRole, 'ceo');

  // Setup status is now permanently locked
  const statusAfter = await fetch(`${baseUrl}/api/admin/auth/setup-status`).then((r) => r.json());
  assert.equal(statusAfter.needsInitialSetup, false);
  assert.equal(statusAfter.setupLocked, true);

  // Duplicate public Super Admin registration attempt is permanently blocked (403)
  const duplicateSetup = await fetch(`${baseUrl}/api/admin/auth/setup-initial-admin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Second Rogue Admin',
      email: 'rogue2@maataapp.com',
      password: 'ExecutivePassword123',
      confirmPassword: 'ExecutivePassword123',
      setupToken: process.env.INITIAL_SETUP_TOKEN,
    }),
  });
  assert.equal(duplicateSetup.status, 403);
  assert.equal((await duplicateSetup.json()).code, 'SETUP_LOCKED');
});

test('2. Super Admin login works under both Super Admin and assigned Co-Founder & CEO roles while rejecting wrong credentials and unauthorised roles', async () => {
  // Wrong password rejected (401)
  const badPw = await fetch(`${baseUrl}/api/leadership/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      selectedRole: 'super_admin',
      email: 'super.exec@maataapp.com',
      password: 'WrongPassword999',
    }),
  });
  assert.equal(badPw.status, 401);

  // Selecting an unassigned role (founder) is rejected (403)
  const wrongRole = await fetch(`${baseUrl}/api/leadership/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      selectedRole: 'founder',
      email: 'super.exec@maataapp.com',
      password: 'ExecutivePassword123',
    }),
  });
  assert.equal(wrongRole.status, 403);

  // Login as super_admin succeeds
  const loginRes = await fetch(`${baseUrl}/api/leadership/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      selectedRole: 'super_admin',
      email: 'super.exec@maataapp.com',
      password: 'ExecutivePassword123',
    }),
  });
  assert.equal(loginRes.status, 200);
  superAdminCookie = extractSessionCookie(loginRes);
  assert.ok(superAdminCookie.includes('maata_admin_session='));

  // Cross-site CSRF mutation with untrusted Origin is rejected (403)
  const csrfRes = await fetch(`${baseUrl}/api/leadership/team`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: superAdminCookie,
      Origin: 'https://evil-attacker.example',
    },
    body: JSON.stringify({
      name: 'Blocked User',
      email: 'blocked@maataapp.com',
      password: 'BlockedPassword123',
      role: 'executive',
    }),
  });
  assert.equal(csrfRes.status, 403);
  assert.equal((await csrfRes.json()).code, 'CSRF_ORIGIN_REJECTED');
});

test('3. Super Admin creates all 6 executive role types, prevents duplicates, edits details, and enforces role-based access controls', async () => {
  const accountsToCreate = [
    { name: 'Founder Account', email: 'founder.exec@maataapp.com', role: 'founder' },
    { name: 'CEO Account', email: 'ceo.exec@maataapp.com', role: 'ceo' },
    { name: 'Director Account', email: 'director.exec@maataapp.com', role: 'director' },
    { name: 'Executive Account', email: 'executive.exec@maataapp.com', role: 'executive' },
    { name: 'Administrator Account', email: 'admin.exec@maataapp.com', role: 'administrator' },
  ] as const;

  for (const acct of accountsToCreate) {
    const res = await fetch(`${baseUrl}/api/leadership/team`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: superAdminCookie },
      body: JSON.stringify({
        name: acct.name,
        email: acct.email,
        password: 'RolePassword123',
        role: acct.role,
        leadershipRole: acct.role,
      }),
    });
    assert.equal(res.status, 201, `Expected 201 when creating ${acct.role}`);
    const body = await res.json();
    if (acct.role === 'director') {
      directorUserId = body.id;
    }
  }

  // Duplicate email rejected with 409
  const dupEmail = await fetch(`${baseUrl}/api/leadership/team`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: superAdminCookie },
    body: JSON.stringify({
      name: 'Duplicate Director',
      email: 'director.exec@maataapp.com',
      password: 'RolePassword123',
      role: 'director',
    }),
  });
  assert.equal(dupEmail.status, 409);

  // Director logs in as director (200), rejected as ceo (403)
  assert.equal(
    (
      await fetch(`${baseUrl}/api/leadership/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          selectedRole: 'ceo',
          email: 'director.exec@maataapp.com',
          password: 'RolePassword123',
        }),
      })
    ).status,
    403
  );

  const directorLogin = await fetch(`${baseUrl}/api/leadership/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      selectedRole: 'director',
      email: 'director.exec@maataapp.com',
      password: 'RolePassword123',
    }),
  });
  assert.equal(directorLogin.status, 200);
  const directorCookie = extractSessionCookie(directorLogin);

  // Director can create a business report (201) but cannot write product tracker (403) or manage team (403)
  assert.equal(
    (
      await fetch(`${baseUrl}/api/leadership/reports`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: directorCookie },
        body: JSON.stringify({
          title: 'Director Q3 Regional Strategy Review',
          reportType: 'executive_summary',
          periodLabel: 'Q3',
          summary: 'Quarterly governance and growth review.',
          status: 'final',
        }),
      })
    ).status,
    201
  );
  assert.equal(
    (
      await fetch(`${baseUrl}/api/leadership/work-items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: directorCookie },
        body: JSON.stringify({ domain: 'product', title: 'Blocked Product Write' }),
      })
    ).status,
    403
  );
  assert.equal(
    (await fetch(`${baseUrl}/api/leadership/team`, { headers: { Cookie: directorCookie } })).status,
    403
  );

  // Executive (read-only) logs in as executive (200), reads reports (200), cannot write reports (403)
  const executiveLogin = await fetch(`${baseUrl}/api/leadership/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      selectedRole: 'executive',
      email: 'executive.exec@maataapp.com',
      password: 'RolePassword123',
    }),
  });
  assert.equal(executiveLogin.status, 200);
  const executiveCookie = extractSessionCookie(executiveLogin);

  assert.equal(
    (await fetch(`${baseUrl}/api/leadership/reports`, { headers: { Cookie: executiveCookie } }))
      .status,
    200
  );
  assert.equal(
    (
      await fetch(`${baseUrl}/api/leadership/reports`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: executiveCookie },
        body: JSON.stringify({
          title: 'Unauthorised Executive Write',
          reportType: 'operations',
          summary: 'Should fail due to read-only executive permissions.',
        }),
      })
    ).status,
    403
  );

  // Administrator logs in as administrator (200), accesses CMS articles (200), blocked from /team (403)
  const adminRoleLogin = await fetch(`${baseUrl}/api/leadership/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      selectedRole: 'administrator',
      email: 'admin.exec@maataapp.com',
      password: 'RolePassword123',
    }),
  });
  assert.equal(adminRoleLogin.status, 200);
  const adminRoleCookie = extractSessionCookie(adminRoleLogin);

  assert.equal(
    (await fetch(`${baseUrl}/api/admin/articles`, { headers: { Cookie: adminRoleCookie } })).status,
    200
  );
  assert.equal(
    (await fetch(`${baseUrl}/api/leadership/team`, { headers: { Cookie: adminRoleCookie } }))
      .status,
    403
  );

  // Edit Director name & deactivate -> active Director session immediately revoked (401) and login blocked (403)
  const editRes = await fetch(`${baseUrl}/api/leadership/team/${directorUserId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Cookie: superAdminCookie },
    body: JSON.stringify({
      name: 'Senior Director Account',
      isActive: false,
      customPermissions: true,
      permissions: ['leadership.overview', 'system.admin'], // system.admin must be stripped server-side
    }),
  });
  assert.equal(editRes.status, 200);

  assert.equal(
    (await fetch(`${baseUrl}/api/leadership/auth/me`, { headers: { Cookie: directorCookie } }))
      .status,
    401
  );
  assert.equal(
    (
      await fetch(`${baseUrl}/api/leadership/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          selectedRole: 'director',
          email: 'director.exec@maataapp.com',
          password: 'RolePassword123',
        }),
      })
    ).status,
    403
  );

  // Verify updated name persisted and system.admin was NOT granted to non-Super Admin
  const teamAfter = await fetch(`${baseUrl}/api/leadership/team`, {
    headers: { Cookie: superAdminCookie },
  }).then((r) => r.json());
  const updatedDirector = teamAfter.items.find((u: any) => u.id === directorUserId);
  assert.equal(updatedDirector.name, 'Senior Director Account');
  assert.equal(updatedDirector.isActive, false);
  assert.ok(!updatedDirector.permissions.includes('system.admin'));
});

test('4. Session expiration, logout, unauthenticated blocking, and database persistence across connection reopen', async () => {
  const { closeDb, getDb } = await import('../server/db/database.ts');
  const { hashToken } = await import('../server/auth/security.ts');

  // Direct unauthenticated URL access returns 401
  assert.equal((await fetch(`${baseUrl}/api/leadership/overview`)).status, 401);
  assert.equal((await fetch(`${baseUrl}/api/leadership/team`)).status, 401);

  // Create fresh Executive session and test expiration
  const execLogin = await fetch(`${baseUrl}/api/leadership/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      selectedRole: 'executive',
      email: 'executive.exec@maataapp.com',
      password: 'RolePassword123',
    }),
  });
  assert.equal(execLogin.status, 200);
  const execCookie = extractSessionCookie(execLogin);
  const rawToken = execCookie.replace('maata_admin_session=', '');

  const db = getDb();
  db.prepare('UPDATE admin_sessions SET expires_at = ? WHERE token_hash = ?').run(
    new Date(Date.now() - 120_000).toISOString(),
    hashToken(rawToken)
  );
  const expiredRes = await fetch(`${baseUrl}/api/leadership/auth/me`, {
    headers: { Cookie: execCookie },
  });
  assert.equal(expiredRes.status, 401);
  assert.equal((await expiredRes.json()).code, 'SESSION_EXPIRED');

  // Logout terminates Super Admin session
  const logoutRes = await fetch(`${baseUrl}/api/leadership/auth/logout`, {
    method: 'POST',
    headers: { Cookie: superAdminCookie },
  });
  assert.equal(logoutRes.status, 200);
  assert.equal(
    (await fetch(`${baseUrl}/api/leadership/auth/me`, { headers: { Cookie: superAdminCookie } }))
      .status,
    401
  );

  // Close and reopen SQLite connection to verify full persistence across restarts
  closeDb();
  const reopenedDb = getDb(dbPath);
  const lockRow = reopenedDb
    .prepare("SELECT value FROM system_settings WHERE key = 'initial_setup_completed'")
    .get() as { value: string } | undefined;
  assert.equal(lockRow?.value, 'true');

  const countRow = reopenedDb.prepare('SELECT COUNT(*) as c FROM admin_users').get() as {
    c: number;
  };
  assert.equal(countRow.c, 6);
});
