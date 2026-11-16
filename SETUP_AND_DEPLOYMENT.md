# MAATA Technologies Corporate Website & CMS — Setup and Deployment Guide

This guide covers environment configuration, database persistence, administrator onboarding, role-based access control (RBAC), backup procedures, and production deployment for the MAATA Technologies corporate platform.

---

## 1. Architecture Overview

- **Frontend**: React 19 + TypeScript + Vite + Tailwind CSS v4.
  - Public corporate website routes: `/`, `/company`, `/app`, `/technology`, `/news`, `/careers`, `/contact`, `/privacy`, `/terms`.
  - Private admin CMS routes: `/admin/login`, `/admin`, `/admin/company`, `/admin/articles`, `/admin/announcements`, `/admin/media`, `/admin/enquiries`, `/admin/users`.
- **Backend**: Express server (`server.ts` / `server/app.ts`) running on port `3000`.
- **Database**: Persistent SQLite database powered by Node.js built-in `node:sqlite` (`DatabaseSync`, WAL mode + foreign keys enabled) with idempotent schema migrations (`server/db/migrations.ts`) and initial corporate content seeding (`server/db/seed.ts`).
- **Media Storage**: Validated local disk storage in `MEDIA_STORAGE_DIR` (defaults to `./storage/media`) served safely via `/media/*`. Official brand assets (`company_logo`, `founder_photo`) are marked `is_protected = 1` in `media_assets` and cannot be deleted or overwritten via the CMS.

---

## 2. Environment Variables (`.env`)

Copy `.env.example` to `.env` for local or production configuration:

```env
PORT=3000
DATABASE_PATH=./data/maata.db
MEDIA_STORAGE_DIR=./storage/media

# Generate a strong random secret in production (e.g., openssl rand -hex 32)
SESSION_SECRET=replace-with-secure-random-hex
SESSION_TTL_HOURS=12

# Optional: Pre-create initial Super Admin on first boot (no hardcoded passwords in code)
# ADMIN_BOOTSTRAP_NAME=MAATA Super Admin
# ADMIN_BOOTSTRAP_EMAIL=admin@maataapp.com
# ADMIN_BOOTSTRAP_PASSWORD=StrongPassword123

# Development only: when true in non-production, forgot-password returns a preview token
ALLOW_DEV_RESET_PREVIEW=true
```

---

## 3. Initial Super Admin Setup

No administrator passwords are ever hardcoded in source code. You have two options for creating the first `super_admin`:

1. **Interactive First-Run Setup (Default)**:
   - Start the server (`npm run dev` or `npm start`) and visit `/admin/login`.
   - When zero `super_admin` accounts exist, the portal automatically displays the **Initial Super Admin Setup** form.
   - Passwords must be at least 10 characters long and contain uppercase, lowercase, and numeric characters.
   - Once the first Super Admin is created, `/api/admin/auth/setup-initial-admin` permanently locks (`403 Forbidden`).

2. **Automated Bootstrap via Environment Variables**:
   - Set `ADMIN_BOOTSTRAP_NAME`, `ADMIN_BOOTSTRAP_EMAIL`, and `ADMIN_BOOTSTRAP_PASSWORD` in your environment before first boot.
   - Remove `ADMIN_BOOTSTRAP_PASSWORD` from runtime environment after initial provisioning if desired.

---

## 4. Roles & Permissions (Server-Enforced RBAC)

All admin endpoints validate the HttpOnly `maata_admin_session` cookie against `admin_sessions` and enforce role permissions on the server:

| Role | Permitted Modules | Restricted Modules |
| :--- | :--- | :--- |
| **`super_admin`** | Full access: Overview, Company Content, News & Articles, Announcements & Banners, Media Library, Enquiries & Feedback, Admin Users, Security Audit Logs | None |
| **`content_manager`** | Overview (content counts), Company Content, News & Articles, Announcements & Banners, Media Library | Enquiries & Feedback PII, Admin Users, Audit Logs (`403`) |
| **`support_manager`** | Overview, Enquiries & Feedback (`general`, `business`, `partnership`, `careers`, `feedback`), CSV Export | Company Content writes, Articles, Announcements, Media Library, Users (`403`) |

---

## 5. Development, Testing & Production Commands

```bash
# Install dependencies
npm install

# Run development server (Express + Vite HMR middlewares on port 3000)
npm run dev

# Run automated backend API & RBAC integration tests
npm test

# Type-check & lint
npm run lint

# Build frontend assets into /dist
npm run build

# Start production server (serves API + built /dist SPA on port 3000)
NODE_ENV=production npm start
```

---

## 6. Backups & Maintenance

- **Database Backup**: Safely snapshot `./data/maata.db` (alongside `-wal`/`-shm` files if active, or using SQLite backup).
- **Media Backup**: Back up `./storage/media/` alongside the database so uploaded article covers and banners remain intact.
- **Session Hygiene**: Expired sessions are automatically purged during login attempts; password resets immediately invalidate all active sessions for the user.
