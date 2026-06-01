# Gym Agent Guide

This document is the canonical guide for anyone (human or agent) working in this repository.
It explains architecture, runtime flow, code conventions, and UI style rules.

## 1) Product Scope

`gym` is a React + Convex application with two primary roles:

- `gym`: staff/admin experience (members, scan/check-ins, analytics, reports, notifications)
- `member`: member portal (dashboard, active plans, notifications)

Core domain: gyms manage members and memberships; members access plans and progress.

## 2) Tech Stack

- Frontend: React 19, React Router, Vite, Tailwind CSS v4, Framer Motion, Lucide icons
- Backend: Convex (queries, mutations, schema, auth/session)
- Language: TypeScript throughout app and Convex functions

## 3) Local Development

- Install: `npm install`
- Frontend dev server: `npm run dev`
- Convex dev server: `npm run dev:convex`
- Both (simple parallel): `npm run dev:all`
- Production build: `npm run build`
- Lint: `npm run lint`

Environment:

- Frontend reads `VITE_CONVEX_URL` from `.env.local`
- `src/main.tsx` creates `ConvexReactClient` from that variable
- After changing `.env.local`, restart Vite

## 4) Frontend Architecture

## Entry

- `src/main.tsx`
  - wraps app with `ConvexProvider`, `BrowserRouter`, `ThemeProvider`, `AuthProvider`

## Routing

- `src/App.tsx`
  - route guards:
    - `ProtectedRoute`
    - `PublicOnlyRoute`
    - `GymOnlyRoute`
    - `MemberOnlyRoute`
  - top-level pages:
    - landing `/`
    - auth `/auth`
    - dashboard `/dashboard`
    - gym pages `/members`, `/scan`, `/reports`, `/analytics`, `/notifications`
    - member page `/member/plans`

## Layout

- `src/components/layout/AppLayout.tsx`
  - shared shell for authenticated pages
  - role-specific navigation labels and menu set
  - theme toggle + logout

## State/Context

- `src/lib/useAuth.tsx`
  - manages session token in localStorage key `gym_app_session_token`
  - calls Convex auth APIs for login/logout/register/member onboarding
  - exposes `user`, `isAuthenticated`, `isInitialized`, `isLoading`
- `src/lib/useTheme.tsx`
  - toggles `light`/`dark` class on `document.documentElement`

## 5) Backend Architecture (Convex)

## Main modules

- `convex/auth.ts`: role-based auth, session lifecycle, onboarding/login
- `convex/members.ts`: member CRUD + gym stats
- `convex/memberships.ts`: create/query memberships, expiring/all lists
- `convex/checkIns.ts`: QR check-ins and daily presence records
- `convex/notifications.ts`: gym/member notifications
- `convex/invitations.ts`: invitation lifecycle and claim paths
- `convex/schema.ts`: database schema and indexes
- `convex/lib/session.ts`: shared authorization and gym/member scope guards

## Data model highlights

- `users`: auth identity and role (`gym` | `member`)
- `authSessions`: token hash + expiry/revocation
- `gyms`, `members`, `memberships`, `checkIns`, `notifications`
- additional coaching/plans domain (`coaches`, `workoutPlans`, `mealPlans`, `progressLogs`, etc.)

## 6) Membership Truth Rules (Critical)

Use these rules everywhere to avoid stale/incorrect analytics:

1. A member is "active" for business metrics only when they have a valid membership.
2. Valid membership means:
   - status is effectively active, and
   - `endDate > Date.now()`
3. Do not treat `members.isActive` as equivalent to valid paid membership.
4. Dashboard/analytics/reports active counts must derive from valid memberships, not raw member flags.
5. Membership reads should normalize stale status when `status === "active"` but expired by date.

## 7) Styling and UI Language

This project uses a high-contrast brutalist/industrial aesthetic with role-driven labeling.

## CSS tokens

- Defined in `src/index.css`
- Theme variables:
  - background: `--bg`, `--bg-raised`, `--bg-sidebar`
  - text: `--text`, `--text-secondary`, `--text-muted`
  - borders: `--border`, `--border-strong`
- Utility classes map tokens:
  - `bg-theme*`, `text-theme*`, `border-theme*`

## Typography

- Display and body primarily `Outfit`
- Emphasis headers often use `Syncopate`
- Frequent uppercase + heavy weight (`font-black`) for section identity

## Component style rules

- Prefer strong borders (`border-2` or `border-4`) and explicit shadows
- Prefer square/rectangular forms over soft rounded UI
- Keep motion purposeful (`framer-motion` entry transitions, avoid noisy animation)
- Maintain high readability and role clarity in labels/copy
- Preserve current visual language when adding new screens

## 8) Code Conventions

- Keep functions small and role-scoped (especially Convex handlers)
- Validate authorization at handler entry using helpers from `convex/lib/session.ts`
- Filter by gym/member ownership before returning data
- Use shared utilities in `src/lib/utils.ts` for date/status display
- Avoid duplicate sources of truth for business metrics
- Keep naming explicit (`activeMembershipsInGym`, `memberIdsWithActiveMembership`, etc.)

## 9) Cleanup Principles

When cleaning dead code/files:

1. Verify no imports/usages via search before deletion.
2. Remove unused dependencies from `package.json` and lockfile.
3. Run `npm run build` after cleanup.
4. Prefer deleting obsolete scripts/components over leaving partial stubs.
5. Do not delete generated Convex files in `convex/_generated` manually.

## 10) Agent Working Agreement

If you are an implementation agent in this repo, follow this order:

1. Read touched areas first (`App.tsx`, relevant page, related Convex module).
2. Apply the smallest safe change set.
3. Preserve established naming, route structure, and styling language.
4. Run build before handoff.
5. In handoff notes, call out:
   - files changed
   - behavior change
   - validation performed
   - any remaining risks or follow-up tasks

This file should be kept updated whenever architecture, style system, or membership semantics change.
