# MAATA Technologies — Firestore Security Specification (Phase 0)

## 1. Data Invariants
1. **Default-Deny Safety Net**: Any unmatched path under `/databases/{database}/documents` is rejected (`allow read, write: if false`).
2. **Email Verification Mandate**: All authenticated mutations require `request.auth != null && request.auth.token.email_verified == true`.
3. **No Client-Supplied Role Escalation**: Only the bootstrapped Super Admin (`gurrampavani2006@gmail.com`) or an active `super_admin` in `/admins/{request.auth.uid}` can create, update, or deactivate records in `/admins/{adminId}` or promote any user's `role` / `leadershipRole`.
4. **Founder vs. Co-Founder & CEO Separation**:
   - `leadershipWorkItems`: Readable by active `founder`, `ceo`, and `super_admin`; writable ONLY by `ceo` and `super_admin` (`founder` cannot mutate product/marketing/testing work items).
   - `leadershipReports` & `leadershipDocuments`: Strictly restricted to active `founder`, `ceo`, and `super_admin` (`content_manager`, `support_manager`, and public users are rejected).
   - `companySections`, `articles`, `announcements`, `mediaAssets`, `cmsTranslations`: Drafts and unpublished items are hidden from public `get`/`list`; writes require `super_admin`, `ceo`, or `content_manager`.
5. **PII Isolation**:
   - `/users/{userId}` holds only non-PII (`displayName`, `role`, timestamps); `/users/{userId}/private/{docId}` isolates `email`/`phone` strictly to `isOwner(userId)` or `isAdmin()`.
   - `/enquiries/{enquiryId}` is never publicly readable or listable; `read` requires `isSupportStaff()` (`super_admin`, `ceo`, `founder`, `support_manager`) or `isOwner(resource.data.ownerId)`.
6. **Immutable Provenance & Strict Server Time**: `ownerId` and `createdAt` are immutable after creation; `createdAt == request.time` on create and `updatedAt == request.time` on create/update.
7. **Protected Assets & Append-Only Logs**: `isProtected == true` records in `/mediaAssets` cannot be deleted; `/auditLogs` cannot be updated or deleted (`allow update, delete: if false`).

## 2. "Dirty Dozen" Attack Payloads (Expected: `PERMISSION_DENIED`)
1. **Self-Privilege Escalation on `/users/{uid}`**: Authenticated non-admin attempts `create` on `/users/{uid}` with `role: 'super_admin'`.
2. **Unauthorized `/admins/{uid}` Injection**: Non-admin user attempts `create` on `/admins/{uid}` with `role: 'ceo'`, `isActive: true`.
3. **Unverified Email Admin Spoof**: User with `email: 'gurrampavani2006@gmail.com'` and `email_verified: false` attempts read/write.
4. **Ghost / Shadow Field Update**: Authenticated editor sends `update` on `/articles/{id}` including an undeclared key `isVerified: true`.
5. **Oversized ID Poisoning**: Request targets `/articles/` with a 500-character or `$`-containing document ID.
6. **Draft Article Leakage (`list` / `get`)**: Unauthenticated client queries `/articles` with `status == 'draft'` or without `where('status', '==', 'published')`.
7. **Confidential Document Read by Content Manager**: Active `content_manager` attempts `get` or `list` on `/leadershipDocuments`.
8. **Founder Write to Work Items**: Active `founder` account attempts `create` or `update` on `/leadershipWorkItems/{id}`.
9. **Protected Logo Deletion**: Active `content_manager` attempts `delete` on `/mediaAssets/media-logo-original` where `isProtected == true`.
10. **PII Scraping on `/enquiries`**: Unauthenticated user or `content_manager` attempts `list` on `/enquiries`.
11. **Backdated Timestamp Spoof**: Authenticated editor submits `createdAt` set to a client-chosen past timestamp instead of `request.time`.
12. **Audit Log Tampering**: Active `super_admin` attempts `update` or `delete` on `/auditLogs/{logId}`.
