# KINETIC Gym — Development Guide

## Tech Stack

- **Frontend**: React 19, React Router 7, Vite, Tailwind CSS v4, Framer Motion, Lucide icons
- **Backend**: Convex (queries, mutations, schema, auth/session)
- **Language**: TypeScript throughout

## Local Development

```bash
npm install           # Install dependencies
npm run dev:convex    # Start Convex dev server
npm run dev           # Start Vite frontend
npm run dev:all       # Both in parallel
npm run build         # Production build
npm run lint          # Lint check
npm run test          # Run tests
```

Environment: Create `.env.local` with `VITE_CONVEX_URL` from `npx convex dev`.

## Project Structure

```
src/
├── main.tsx           # Entry point
├── App.tsx            # Routing & route guards
├── index.css          # Theme & utility classes
├── components/        # Reusable UI components
├── pages/             # Page components (dashboard, auth, members, etc.)
└── lib/               # Hooks (useAuth, useTheme, useQrScanner), utilities

convex/
├── schema.ts          # Database schema
├── auth.ts            # Authentication logic
├── members.ts         # Member CRUD & stats
├── memberships.ts     # Membership management
├── checkIns.ts        # QR check-in system
├── notifications.ts   # Notification engine
├── invitations.ts     # Invitation codes
├── workoutPlans.ts    # Workout plan CRUD
├── mealPlans.ts       # Meal plan CRUD
├── classes.ts         # Class management
├── progress.ts        # Progress tracking
├── crons.ts           # Scheduled tasks
└── lib/               # Shared auth & guards
```

## Architecture

- Two roles: `gym` (staff/admin) and `member`
- Role-based route guards: `ProtectedRoute`, `PublicOnlyRoute`, `GymOnlyRoute`, `MemberOnlyRoute`
- Auth via session tokens stored in `localStorage` key `gym_app_session_token`
- Theme toggle persists to localStorage, applies `light`/`dark` class on `<html>`

## Styling

High-contrast brutalist/industrial aesthetic:
- CSS variables in `src/index.css`: `--bg`, `--text`, `--border`, `--accent`, etc.
- Utility classes: `bg-theme*`, `text-theme*`, `border-theme*`
- Fonts: Outfit (body), Syncopate (display headings)
- Strong borders (`border-2`/`border-4`), square forms, purposeful motion

## Code Conventions

- Validate authorization at handler entry using helpers from `convex/lib/session.ts`
- Filter by gym/member ownership before returning data
- Use shared utilities from `src/lib/utils.ts` for date/status display
- Keep naming explicit (`activeMembershipsInGym`, `memberIdsWithActiveMembership`)
- When removing dead code: verify no imports, remove unused deps, run build
