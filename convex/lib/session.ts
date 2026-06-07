import { ConvexError } from "convex/values";
import type { Doc } from "../_generated/dataModel";
import type { QueryCtx, MutationCtx } from "../_generated/server";

function hashSessionToken(token: string): string {
  let hash = 0;
  for (let i = 0; i < token.length; i += 1) {
    const char = token.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return `sess_${Math.abs(hash).toString(16)}_${token.length.toString(16)}`;
}

/* ────────────── Legacy session-token auth ────────────── */

export async function requireSessionUser(ctx: QueryCtx | MutationCtx, sessionToken: string) {
  const tokenHash = hashSessionToken(sessionToken);

  const session = (await ctx.db
    .query("authSessions")
    .withIndex("by_tokenHash", (q) => q.eq("tokenHash", tokenHash))
    .first()) as Doc<"authSessions"> | null;

  if (!session || session.revokedAt || session.expiresAt < Date.now()) {
    throw new ConvexError({
      code: "UNAUTHORIZED",
      message: "Your session expired. Sign in again.",
    });
  }

  const user = (await ctx.db.get(session.userId)) as Doc<"users"> | null;
  if (!user) {
    throw new ConvexError({
      code: "UNAUTHORIZED",
      message: "User not found.",
    });
  }

  return user;
}

export async function requireGymUser(ctx: QueryCtx | MutationCtx, sessionToken: string) {
  const user = await requireSessionUser(ctx, sessionToken);
  if (user.role !== "gym" || !user.gymId) {
    throw new ConvexError({
      code: "FORBIDDEN",
      message: "Gym access required.",
    });
  }
  return user;
}

export async function requireMemberUser(ctx: QueryCtx | MutationCtx, sessionToken: string) {
  const user = await requireSessionUser(ctx, sessionToken);
  if (user.role !== "member" || !user.memberId) {
    throw new ConvexError({
      code: "FORBIDDEN",
      message: "Member access required.",
    });
  }
  return user;
}

export async function requireCoachUser(ctx: QueryCtx | MutationCtx, sessionToken: string) {
  const user = await requireSessionUser(ctx, sessionToken);
  if (user.role !== "coach" || !user.coachId) {
    throw new ConvexError({
      code: "FORBIDDEN",
      message: "Coach access required.",
    });
  }
  return user;
}

/* ────────────── Convex Auth identity helpers ──────────────
 *  These are used when you migrate to @convex-dev/auth.
 *  They look up the user by the Convex Auth identity email,
 *  then enforce the same role checks.
 * ───────────────────────────────────────────────────────── */

async function resolveUserFromIdentity(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new ConvexError({
      code: "UNAUTHORIZED",
      message: "Not signed in.",
    });
  }

  const user = await ctx.db
    .query("users")
    .withIndex("by_email", (q) => q.eq("email", identity.email!))
    .first();

  if (!user) {
    throw new ConvexError({
      code: "UNAUTHORIZED",
      message: "No profile found.",
    });
  }

  return user;
}

export async function requireGymUserFromIdentity(ctx: QueryCtx | MutationCtx) {
  const user = await resolveUserFromIdentity(ctx);
  if (user.role !== "gym" || !user.gymId) {
    throw new ConvexError({ code: "FORBIDDEN", message: "Gym access required." });
  }
  return user;
}

export async function requireMemberUserFromIdentity(ctx: QueryCtx | MutationCtx) {
  const user = await resolveUserFromIdentity(ctx);
  if (user.role !== "member" || !user.memberId) {
    throw new ConvexError({ code: "FORBIDDEN", message: "Member access required." });
  }
  return user;
}

export async function requireCoachUserFromIdentity(ctx: QueryCtx | MutationCtx) {
  const user = await resolveUserFromIdentity(ctx);
  if (user.role !== "coach" || !user.coachId) {
    throw new ConvexError({ code: "FORBIDDEN", message: "Coach access required." });
  }
  return user;
}

export function ensureSameGym(member: Doc<"members"> | null, gymId: Doc<"users">["gymId"]) {
  if (!member || !gymId || !member.gymId || member.gymId !== gymId) {
    throw new ConvexError({
      code: "FORBIDDEN",
      message: "Member is not in your gym.",
    });
  }
}
