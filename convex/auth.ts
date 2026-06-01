import { convexAuth } from "@convex-dev/auth/server";
import { Password } from "@convex-dev/auth/providers/Password";

/**
 * Convex Auth configuration.
 *
 * This sets up email/password authentication via the @convex-dev/auth package.
 * After a user signs in, the backend resolves them by email against our custom
 * `users` table (which holds roles, gymId, memberId, etc.).
 */
export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [Password],
});
