# Kinetic Gym App

React + Vite + Convex gym management system.

## Quick start

```bash
npm install
npm run dev
```

Create `.env.local` (copy from `.env.example`) and fill in your Convex URLs.

## Deploy to Vercel

### 1. Push your code to GitHub

```bash
git add .
git commit -m "Ready for Vercel"
git push origin main
```

### 2. Connect to Vercel

1. Go to [vercel.com](https://vercel.com) and import your repo.
2. Framework preset: **Vite**
3. Build command: `npm run build`
4. Output directory: `dist`
5. Node version: `18.x` or `20.x`

### 3. Add environment variables

In Vercel project settings, add:

| Name | Value |
|------|-------|
| `VITE_CONVEX_URL` | `https://<your-deployment>.convex.cloud` |
| `VITE_CONVEX_SITE_URL` | `https://<your-deployment>.convex.site` |

Get these from your [Convex dashboard](https://dashboard.convex.dev).

### 4. Deploy Convex to production

```bash
npx convex deploy
```

This pushes your Convex functions to the production deployment.

### 5. Redeploy Vercel

After setting env vars, trigger a redeploy in Vercel.

---

## Migrate to Convex Auth

The app currently uses a **custom session-token auth** system (email/password with manual sessions). We have prepared the code to also support **@convex-dev/auth** — Convex's official auth library with OAuth, email/password, magic links, and more.

### Why migrate?

- **Security**: `@convex-dev/auth` handles password hashing (bcrypt/Argon2), session rotation, and CSRF protection automatically.
- **Features**: Easily add Google OAuth, password reset, email verification.
- **Maintenance**: Official Convex package — always up to date.

### Migration steps

#### Step 1 — Update Convex Auth configuration

The `convex/auth.ts` file is already configured with the `Password` provider:

```ts
import { convexAuth } from "@convex-dev/auth/server";
import { Password } from "@convex-dev/auth/providers/Password";

export const { auth, signIn, signOut, store } = convexAuth({
  providers: [Password],
});
```

You can add OAuth providers here too:

```ts
import { Google } from "@convex-dev/auth/providers/Google";

export const { auth, signIn, signOut, store } = convexAuth({
  providers: [Password, Google],
});
```

#### Step 2 — Deploy Convex Auth functions

```bash
npx convex dev      # local
npx convex deploy     # production
```

This creates the auth tables (`users` managed by Convex Auth) in your Convex deployment.

#### Step 3 — Switch frontend to Convex Auth

In `src/lib/useAuth.tsx`, replace the legacy mutation calls with Convex Auth's `signIn` / `signOut`:

```tsx
import { useAuth as useConvexAuth } from "@convex-dev/auth/react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

export function useAuth() {
  const { isAuthenticated, user: convexUser } = useConvexAuth();
  const signIn = useMutation(api.auth.signIn);
  const signOut = useMutation(api.auth.signOut);

  // ...map convexUser to your app's user shape
}
```

#### Step 4 — Switch backend to identity-based auth

In each Convex query/mutation, replace:

```ts
const user = await requireGymUser(ctx, args.sessionToken);
```

with:

```ts
const user = await requireGymUserFromIdentity(ctx);
```

The `require*FromIdentity` helpers are already in `convex/lib/session.ts`. They resolve the user from `ctx.auth.getUserIdentity()` instead of a session token.

#### Step 5 — Migrate existing users

Run a one-off migration script to link existing custom `users` records to Convex Auth identities. A helper is provided in `convex/migrateAuth.ts`:

```bash
npx convex run migrateAuth:migrateUsers
```

(You need to create this script if you have existing users.)

#### Step 6 — Remove legacy auth code

Once all users are migrated:

1. Delete `convex/authLegacy.ts`
2. Delete `convex/authSessions` table from schema
3. Update `src/lib/useAuth.tsx` to remove legacy mutations
4. Remove session token from localStorage logic

---

## Architecture

### Auth

- **Current**: Custom email/password with `sessionToken` stored in `localStorage`
- **Prepared**: `@convex-dev/auth` with `ConvexAuthProvider` already wired in `main.tsx`

### Tech stack

- React 19 + TypeScript
- Vite 7
- Tailwind CSS 4
- Framer Motion
- Convex (backend + database)
- React Router 7

### Project structure

```
convex/
  auth.ts              # Convex Auth configuration
  authLegacy.ts        # Custom session auth (deprecated after migration)
  schema.ts            # Database schema
  lib/session.ts       # Auth helpers (supports both legacy + Convex Auth)
  *.ts                 # Domain-specific backend functions
src/
  main.tsx             # Entry point (wraps ConvexAuthProvider)
  App.tsx              # Routes with code-splitting
  lib/
    useAuth.tsx        # Legacy auth context
    useTheme.tsx       # Light/dark theme
    useQrScanner.ts    # Camera QR scanner hook
    utils.ts           # Date/currency helpers
    errorHandling.ts   # Error normalization
  pages/               # Route components
  components/          # Shared UI
public/
  favicon.svg
```

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server |
| `npm run dev:convex` | Start Convex dev |
| `npm run dev:all` | Start both (local only) |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npm run test` | Vitest (unit tests) |
| `npm run preview` | Preview production build |
| `npx convex deploy` | Deploy Convex functions |

---

## License

MIT
