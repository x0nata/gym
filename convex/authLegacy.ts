import { mutation, query, type QueryCtx, type MutationCtx } from "./_generated/server";
import { ConvexError, v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import { requireGymUser } from "./lib/session";

const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30;

type AuthRole = "gym" | "member";

type AuthUser = {
  _id: Id<"users">;
  email: string;
  role: AuthRole;
  gymId?: Id<"gyms">;
  memberId?: Id<"members">;
};

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D+/g, "");
  return digits || phone.trim();
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function assertAuthInput(condition: boolean, code: string, message: string): asserts condition {
  if (!condition) {
    throw new ConvexError({ code, message });
  }
}

function hashPassword(password: string): string {
  let hash = 0;
  for (let i = 0; i < password.length; i += 1) {
    const char = password.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return `hash_${Math.abs(hash).toString(16)}_${password.length.toString(16)}`;
}

function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}

function randomToken(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 12)}`;
}

function hashSessionToken(token: string): string {
  let hash = 0;
  for (let i = 0; i < token.length; i += 1) {
    const char = token.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return `sess_${Math.abs(hash).toString(16)}_${token.length.toString(16)}`;
}

async function getUserByEmail(ctx: QueryCtx | MutationCtx, email: string): Promise<AuthUser | null> {
  const user = await ctx.db
    .query("users")
    .withIndex("by_email", (q) => q.eq("email", email))
    .first();

  if (!user) return null;

  return {
    _id: user._id,
    email: user.email,
    role: user.role as "gym" | "member",
    gymId: user.gymId,
    memberId: user.memberId,
  };
}

async function createSession(ctx: MutationCtx, user: AuthUser, userAgent?: string) {
  const token = randomToken("gym_session");
  const tokenHash = hashSessionToken(token);
  const now = Date.now();
  const expiresAt = now + SESSION_TTL_MS;

  await ctx.db.insert("authSessions", {
    userId: user._id,
    tokenHash,
    createdAt: now,
    expiresAt,
    userAgent,
  });

  return {
    token,
    expiresAt,
  };
}

async function resolveSession(ctx: QueryCtx | MutationCtx, token: string) {
  const tokenHash = hashSessionToken(token);
  const session = await ctx.db
    .query("authSessions")
    .withIndex("by_tokenHash", (q) => q.eq("tokenHash", tokenHash))
    .first();

  if (!session || session.revokedAt) return null;
  if (session.expiresAt < Date.now()) return null;

  const user = (await ctx.db.get(session.userId)) as Doc<"users"> | null;
  if (!user) return null;

  return { session: session as Doc<"authSessions">, user };
}

async function cleanupExpiredSessions(ctx: MutationCtx, userId: Id<"users">) {
  const now = Date.now();
  const sessions = (await ctx.db
    .query("authSessions")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .collect()) as Doc<"authSessions">[];

  await Promise.all(
    sessions
      .filter((s: Doc<"authSessions">) => !s.revokedAt && s.expiresAt < now)
      .map((s: Doc<"authSessions">) => ctx.db.patch(s._id, { revokedAt: now }))
  );
}

export const me = query({
  args: { sessionToken: v.optional(v.string()) },
  handler: async (ctx, args) => {
    if (!args.sessionToken) return null;

    const resolved = await resolveSession(ctx, args.sessionToken);
    if (!resolved) return null;

    const { session, user } = resolved;

    const base = {
      userId: user._id,
      email: user.email,
      role: user.role,
      memberId: user.memberId,
      gymId: user.gymId,
      sessionExpiresAt: session.expiresAt,
    };

    if (user.role === "member" && user.memberId) {
      const member = (await ctx.db.get(user.memberId)) as Doc<"members"> | null;
      return {
        ...base,
        displayName: member ? `${member.firstName} ${member.lastName}` : "Member",
      };
    }

    if (user.role === "gym" && user.gymId) {
      const gym = (await ctx.db.get(user.gymId)) as Doc<"gyms"> | null;
      return {
        ...base,
        displayName: gym?.name ?? "Gym Staff",
      };
    }

    return {
      ...base,
      displayName: "User",
    };
  },
});

export const login = mutation({
  args: {
    role: v.union(v.literal("gym"), v.literal("member")),
    email: v.string(),
    password: v.string(),
    userAgent: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const email = normalizeEmail(args.email);
    assertAuthInput(isValidEmail(email), "INVALID_EMAIL", "Enter a valid email address.");
    assertAuthInput(args.password.length > 0, "INVALID_PASSWORD", "Password is required.");

    const user = await getUserByEmail(ctx, email);

    if (user) {
      const fullUser = await ctx.db.get(user._id);
      if (fullUser?.role !== args.role) {
        throw new ConvexError({
          code: "ROLE_MISMATCH",
          message: "Use the correct role to sign in.",
        });
      }

      if (fullUser?.passwordHash && !verifyPassword(args.password, fullUser.passwordHash)) {
        throw new ConvexError({
          code: "INVALID_PASSWORD",
          message: "Invalid password.",
        });
      }

      if (!fullUser?.passwordHash) {
        throw new ConvexError({
          code: "ACCOUNT_INCOMPLETE",
          message: "This account is not fully configured. Contact support.",
        });
      }

      await cleanupExpiredSessions(ctx, user._id);
      const session = await createSession(ctx, user, args.userAgent);

      return {
        success: true,
        sessionToken: session.token,
        sessionExpiresAt: session.expiresAt,
        user,
      };
    }

    if (args.role === "gym") {
      const gym = await ctx.db
        .query("gyms")
        .withIndex("by_email", (q) => q.eq("email", email))
        .first();

      if (gym) {
        throw new ConvexError({
          code: "ACCOUNT_INCOMPLETE",
          message: "Gym account exists but login is not configured. Contact support.",
        });
      }

      throw new ConvexError({
        code: "GYM_NOT_FOUND",
        message: "No gym account found for this email.",
      });
    }

    throw new ConvexError({
      code: "MEMBER_NOT_FOUND",
      message: "Member account not found. Use first-time access with invitation code.",
    });
  },
});

export const verifyMemberInvitation = mutation({
  args: {
    invitationCode: v.string(),
    phone: v.string(),
  },
  handler: async (ctx, args) => {
    const invitationCode = args.invitationCode.trim().toUpperCase();
    const phone = normalizePhone(args.phone);
    assertAuthInput(invitationCode.length > 0, "INVALID_INVITATION", "Invitation code is required.");
    assertAuthInput(phone.length > 0, "INVALID_INPUT", "Phone number is required.");

    const invitation = await ctx.db
      .query("invitations")
      .withIndex("by_code", (q) => q.eq("code", invitationCode))
      .first();

    if (!invitation || invitation.type !== "member") {
      throw new ConvexError({
        code: "INVALID_INVITATION",
        message: "Invalid invitation code.",
      });
    }

    if (invitation.status !== "pending") {
      throw new ConvexError({
        code: "INVITATION_NOT_AVAILABLE",
        message: "Invitation has already been used or revoked.",
      });
    }

    if (invitation.expiresAt < Date.now()) {
      await ctx.db.patch(invitation._id, { status: "expired", updatedAt: Date.now() });
      throw new ConvexError({
        code: "INVITATION_EXPIRED",
        message: "Invitation code has expired.",
      });
    }

    const invitationPhone = normalizePhone(invitation.phone ?? "");
    if (!invitationPhone || invitationPhone !== phone) {
      throw new ConvexError({
        code: "PHONE_MISMATCH",
        message: "Phone number does not match this invitation.",
      });
    }

    return {
      success: true,
      memberName: `${invitation.firstName} ${invitation.lastName}`,
      invitationCode,
    };
  },
});

export const completeMemberOnboarding = mutation({
  args: {
    invitationCode: v.string(),
    phone: v.string(),
    email: v.string(),
    password: v.string(),
    userAgent: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const invitationCode = args.invitationCode.trim().toUpperCase();
    const email = normalizeEmail(args.email);
    const phone = normalizePhone(args.phone);
    assertAuthInput(invitationCode.length > 0, "INVALID_INVITATION", "Invitation code is required.");
    assertAuthInput(isValidEmail(email), "INVALID_EMAIL", "Enter a valid email address.");
    assertAuthInput(phone.length > 0, "INVALID_INPUT", "Phone number is required.");
    assertAuthInput(args.password.length >= 8, "WEAK_PASSWORD", "Password must be at least 8 characters.");

    const existingUser = await getUserByEmail(ctx, email);
    if (existingUser) {
      throw new ConvexError({
        code: "EMAIL_EXISTS",
        message: "A user with this email already exists.",
      });
    }

    const invitation = await ctx.db
      .query("invitations")
      .withIndex("by_code", (q) => q.eq("code", invitationCode))
      .first();

    if (!invitation || invitation.type !== "member") {
      throw new ConvexError({
        code: "INVALID_INVITATION",
        message: "Invalid invitation code.",
      });
    }

    if (invitation.status !== "pending") {
      throw new ConvexError({
        code: "INVITATION_NOT_AVAILABLE",
        message: "Invitation has already been used or revoked.",
      });
    }

    if (invitation.expiresAt < Date.now()) {
      await ctx.db.patch(invitation._id, { status: "expired", updatedAt: Date.now() });
      throw new ConvexError({
        code: "INVITATION_EXPIRED",
        message: "Invitation code has expired.",
      });
    }

    const invitationPhone = normalizePhone(invitation.phone ?? "");
    if (!invitationPhone || invitationPhone !== phone) {
      throw new ConvexError({
        code: "PHONE_MISMATCH",
        message: "Phone number does not match this invitation.",
      });
    }

    let memberId = invitation.memberId;
    if (!memberId) {
      memberId = await ctx.db.insert("members", {
        firstName: invitation.firstName,
        lastName: invitation.lastName,
        email,
        phone: invitation.phone ?? args.phone.trim(),
        qrCode: `MEM-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
        gymId: invitation.gymId,
        joinedAt: Date.now(),
        isActive: true,
      });
    } else {
      await ctx.db.patch(memberId, {
        email,
        phone: invitation.phone ?? args.phone.trim(),
        gymId: invitation.gymId,
      });
    }

    const now = Date.now();
    const userId = await ctx.db.insert("users", {
      email,
      passwordHash: hashPassword(args.password),
      role: "member",
      memberId,
      gymId: invitation.gymId,
      createdAt: now,
    });

    await ctx.db.patch(invitation._id, {
      status: "claimed",
      claimedAt: now,
      claimedByUserId: userId,
      updatedAt: now,
      memberId,
      email,
    });

    const user: AuthUser = {
      _id: userId,
      email,
      role: "member",
      memberId,
      gymId: invitation.gymId,
    };

    await cleanupExpiredSessions(ctx, user._id);
    const session = await createSession(ctx, user, args.userAgent);

    return {
      success: true,
      sessionToken: session.token,
      sessionExpiresAt: session.expiresAt,
      user,
    };
  },
});

export const registerGym = mutation({
  args: {
    email: v.string(),
    password: v.string(),
    name: v.string(),
    phone: v.string(),
    address: v.string(),
    city: v.string(),
    description: v.optional(v.string()),
    userAgent: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const email = normalizeEmail(args.email);
    const name = args.name.trim();
    const phone = args.phone.trim();
    const phoneDigits = normalizePhone(phone);
    const address = args.address.trim();
    const city = args.city.trim();
    const description = args.description?.trim() || undefined;
    const now = Date.now();

    assertAuthInput(isValidEmail(email), "INVALID_EMAIL", "Enter a valid email address.");
    assertAuthInput(args.password.length >= 8, "WEAK_PASSWORD", "Password must be at least 8 characters.");
    assertAuthInput(name.length >= 2, "INVALID_INPUT", "Gym name must be at least 2 characters.");
    assertAuthInput(phoneDigits.length >= 7, "INVALID_INPUT", "Enter a valid phone number.");
    assertAuthInput(address.length >= 3, "INVALID_INPUT", "Address must be at least 3 characters.");
    assertAuthInput(city.length >= 2, "INVALID_INPUT", "City must be at least 2 characters.");

    const existingUser = await getUserByEmail(ctx, email);
    if (existingUser) {
      throw new ConvexError({
        code: "EMAIL_IN_USE",
        message: "This email is already used by another account.",
      });
    }

    const existingGym = await ctx.db
      .query("gyms")
      .withIndex("by_email", (q) => q.eq("email", email))
      .first();

    if (existingGym) {
      throw new ConvexError({
        code: "EMAIL_EXISTS",
        message: "A gym with this email already exists.",
      });
    }

    const gymId = await ctx.db.insert("gyms", {
      name,
      email,
      phone,
      address,
      city,
      description,
      isActive: true,
      createdAt: now,
    });

    const userId = await ctx.db.insert("users", {
      email,
      passwordHash: hashPassword(args.password),
      role: "gym",
      gymId,
      createdAt: now,
    });

    const user: AuthUser = {
      _id: userId,
      email,
      role: "gym",
      gymId,
    };

    const session = await createSession(ctx, user, args.userAgent);

    return {
      success: true,
      sessionToken: session.token,
      sessionExpiresAt: session.expiresAt,
      user,
    };
  },
});

export const logout = mutation({
  args: { sessionToken: v.string() },
  handler: async (ctx, args) => {
    const tokenHash = hashSessionToken(args.sessionToken);
    const session = await ctx.db
      .query("authSessions")
      .withIndex("by_tokenHash", (q) => q.eq("tokenHash", tokenHash))
      .first();

    if (!session) {
      return { success: true };
    }

    await ctx.db.patch(session._id, { revokedAt: Date.now() });
    return { success: true };
  },
});

export const logoutAll = mutation({
  args: { sessionToken: v.string() },
  handler: async (ctx, args) => {
    const resolved = await resolveSession(ctx, args.sessionToken);
    if (!resolved) return { success: true };

    const sessions = await ctx.db
      .query("authSessions")
      .withIndex("by_user", (q) => q.eq("userId", resolved.user._id))
      .collect();

    const now = Date.now();
    await Promise.all(
      sessions
        .filter((s: Doc<"authSessions">) => !s.revokedAt)
        .map((s: Doc<"authSessions">) => ctx.db.patch(s._id, { revokedAt: now }))
    );

    return { success: true };
  },
});

export const deleteAllData = mutation({
  args: { sessionToken: v.string() },
  handler: async (ctx, _args) => {
    await requireGymUser(ctx, _args.sessionToken);

    const tables = ["authSessions", "users", "gyms", "members", "checkIns", "invitations", "notifications"];

    for (const table of tables) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const documents = await ctx.db.query(table as any).collect();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await Promise.all(documents.map((doc: Doc<any>) => ctx.db.delete(doc._id)));
      } catch {
        // ignore tables that don't exist
      }
    }

    return { success: true };
  },
});
