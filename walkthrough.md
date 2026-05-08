# Walkthrough: Supabase + Auth + Vercel Migration

## Summary of Changes

All 5 phases of the implementation plan have been completed. Here's what was done:

---

### Phase 1 — Database Migration (SQLite → PostgreSQL)

| File | Change |
|---|---|
| [schema.prisma](file:///g:/1.%20PROJECTS/MY_PROS/brims-app/prisma/schema.prisma) | Provider changed to `postgresql`, added `url = env("DATABASE_URL")`, added `User` model |
| [prisma.js](file:///g:/1.%20PROJECTS/MY_PROS/brims-app/src/lib/prisma.js) | Removed `better-sqlite3` adapter, now uses standard `PrismaClient()` |
| [prisma.config.ts](file:///g:/1.%20PROJECTS/MY_PROS/brims-app/prisma.config.ts) | Removed `"file:./dev.db"` fallback |
| [package.json](file:///g:/1.%20PROJECTS/MY_PROS/brims-app/package.json) | Removed `better-sqlite3` & adapter; added `bcryptjs` & `jose`; updated build script |
| [.env.local](file:///g:/1.%20PROJECTS/MY_PROS/brims-app/.env.local) | Template for `DATABASE_URL` and `JWT_SECRET` |

### Phase 2 — Authentication Backend

| File | Purpose |
|---|---|
| [auth.js](file:///g:/1.%20PROJECTS/MY_PROS/brims-app/src/lib/auth.js) | Password hashing, JWT creation/verification, cookie helpers, hardcoded master password |
| [register/route.js](file:///g:/1.%20PROJECTS/MY_PROS/brims-app/src/app/api/auth/register/route.js) | Registration with master password verification |
| [login/route.js](file:///g:/1.%20PROJECTS/MY_PROS/brims-app/src/app/api/auth/login/route.js) | Login with JWT session cookie |
| [logout/route.js](file:///g:/1.%20PROJECTS/MY_PROS/brims-app/src/app/api/auth/logout/route.js) | Clears session cookie |
| [me/route.js](file:///g:/1.%20PROJECTS/MY_PROS/brims-app/src/app/api/auth/me/route.js) | Returns current user info from JWT |

### Phase 3 — Authentication UI

| File | Purpose |
|---|---|
| [(auth)/layout.js](file:///g:/1.%20PROJECTS/MY_PROS/brims-app/src/app/%28auth%29/layout.js) | Centered layout without sidebar for auth pages |
| [(auth)/login/page.js](file:///g:/1.%20PROJECTS/MY_PROS/brims-app/src/app/%28auth%29/login/page.js) | Login form with Notion styling, eye-toggle, loading state |
| [(auth)/register/page.js](file:///g:/1.%20PROJECTS/MY_PROS/brims-app/src/app/%28auth%29/register/page.js) | Registration form with master password field |
| [Sidebar.js](file:///g:/1.%20PROJECTS/MY_PROS/brims-app/src/components/Sidebar.js) | Added username display + Logout button at bottom |

### Phase 4 — Route Protection

| File | Purpose |
|---|---|
| [middleware.js](file:///g:/1.%20PROJECTS/MY_PROS/brims-app/src/middleware.js) | Redirects unauthenticated users to `/login`, allows public auth routes |

### Phase 5 — Deployment Config

| Change | Detail |
|---|---|
| Build script | `"build": "prisma generate && next build"` |
| `.gitignore` | Added `dev.db` |

---

## Next Steps For You

### 1. Set Up Supabase
1. Go to [supabase.com](https://supabase.com) and create a free project.
2. Go to **Settings → Database → Connection String** and copy the **URI** format.
3. Paste it into your `.env.local` file as `DATABASE_URL`.
4. Also set a strong `JWT_SECRET` value (any random string, e.g. `my-super-secret-key-2024`).

### 2. Push Schema to Supabase
```bash
npx prisma db push
```
This creates all the tables (including the new `User` table) in your Supabase database.

### 3. Test Locally
```bash
npm run dev
```
- You should be redirected to `/login`.
- Go to `/register`, create an account with the master password `rishikesh.prince`.
- Log in with your new credentials.

### 4. Deploy to Vercel
1. Push your code to a GitHub repository.
2. Go to [vercel.com](https://vercel.com), sign in with GitHub, and import the repo.
3. Add `DATABASE_URL` and `JWT_SECRET` as Environment Variables in Vercel.
4. Click **Deploy** — done!
