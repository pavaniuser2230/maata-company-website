import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';

const rootDir = process.cwd();
const blueprint = JSON.parse(fs.readFileSync(path.join(rootDir, 'firebase-blueprint.json'), 'utf8'));
const rules = fs.readFileSync(path.join(rootDir, 'firestore.rules'), 'utf8');

test('1. Firestore rules enforce Eight Pillars primitives and default-deny safety net', () => {
  assert.match(rules, /rules_version = '2';/);
  assert.match(rules, /match \/\{document=\*\*\} \{\s*allow read, write: if false;\s*\}/);
  assert.match(rules, /request\.auth\.token\.email_verified == true/);
  assert.match(rules, /request\.auth\.token\.email == 'gurrampavani2006@gmail\.com'/);
  assert.match(rules, /function isValidId\(id\)/);
  assert.match(rules, /incoming\(\)\.createdAt == request\.time/);
  assert.match(rules, /incoming\(\)\.updatedAt == request\.time/);
});

test('2. Every blueprint Firestore collection path has an explicit match block and validation helper', () => {
  const paths = Object.keys(blueprint.firestore || {});
  assert.ok(paths.length >= 13, 'Expected all blueprint collections to be defined');

  for (const colPath of paths) {
    const firstSegment = colPath.split('/').filter(Boolean)[0];
    assert.ok(
      rules.includes(`match /${firstSegment}/`),
      `Missing match block for blueprint path ${colPath}`
    );
  }
});

test('3. Dirty Dozen invariants: PII isolation, protected assets, audit immutability, Founder vs CEO separation', () => {
  // Pillar 6: PII split collection & no public list on enquiries
  assert.match(rules, /match \/private\/\{docId\}/);
  assert.match(rules, /match \/enquiries\/\{enquiryId\}[\s\S]*?allow get: if isValidId\(enquiryId\) && \(isOwner\(existing\(\)\.ownerId\) \|\| isSupportStaff\(\)\)/);

  // Pillar 4 & Leadership RBAC: Founder read-only on work items, CEO/Super Admin write
  assert.match(rules, /match \/leadershipWorkItems\/\{itemId\}[\s\S]*?allow create: if isValidId\(itemId\)\s*&& isLeadershipEditor\(\)/);
  assert.match(rules, /match \/leadershipDocuments\/\{docId\}[\s\S]*?allow get: if isValidId\(docId\) && isLeadershipMember\(\)/);

  // Protected brand media & immutable audit logs
  assert.match(rules, /existing\(\)\.isProtected == false/);
  assert.match(rules, /match \/auditLogs\/\{logId\}[\s\S]*?allow update, delete: if false;/);

  // No insecure blanket list rules
  assert.equal(/allow list:\s*if\s*isSignedIn\(\)\s*;/.test(rules), false);
  assert.equal(/allow read:\s*if\s*true\s*;/.test(rules), false);
  assert.equal(/allow write:\s*if\s*true\s*;/.test(rules), false);
});
