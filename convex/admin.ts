import { query, mutation } from "./_generated/server";
import { v, ConvexError } from "convex/values";
import { requireSuperadminUser } from "./lib/session";
import type { Doc } from "./_generated/dataModel";

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
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

function todayDateString(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function sevenDaysFromNow(): number {
  return Date.now() + 7 * 24 * 60 * 60 * 1000;
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/* ────────────── Platform stats ────────────── */

export const platformStats = query({
  args: { sessionToken: v.string() },
  handler: async (ctx, args) => {
    await requireSuperadminUser(ctx, args.sessionToken);

    const gyms = (await ctx.db.query("gyms").collect()) as Doc<"gyms">[];
    const members = (await ctx.db.query("members").collect()) as Doc<"members">[];
    const coaches = (await ctx.db.query("coaches").collect()) as Doc<"coaches">[];
    const memberships = (await ctx.db.query("memberships").collect()) as Doc<"memberships">[];

    const activeMemberships = memberships.filter((m) => m.status === "active");
    const totalRevenue = memberships.reduce((sum, m) => sum + (m.amountPaid || 0), 0);
    const expiringSoon = activeMemberships.filter((m) => m.endDate <= sevenDaysFromNow()).length;

    const todayStr = todayDateString();
    const checkInsToday = (await ctx.db
      .query("checkIns")
      .withIndex("by_date", (q) => q.eq("date", todayStr))
      .collect()) as Doc<"checkIns">[];

    const recentCheckIns = (await ctx.db.query("checkIns").order("desc").take(20)) as Doc<"checkIns">[];

    return {
      totalGyms: gyms.length,
      activeGyms: gyms.filter((g) => g.isActive).length,
      totalMembers: members.length,
      activeMembers: members.filter((m) => m.isActive).length,
      totalCoaches: coaches.length,
      activeCoaches: coaches.filter((c) => c.isActive).length,
      totalRevenue,
      activeMemberships: activeMemberships.length,
      expiringSoon,
      checkInsToday: checkInsToday.length,
      recentCheckIns,
    };
  },
});

/* ────────────── Gyms ────────────── */

export const listGyms = query({
  args: { sessionToken: v.string() },
  handler: async (ctx, args) => {
    await requireSuperadminUser(ctx, args.sessionToken);

    const gyms = (await ctx.db.query("gyms").order("desc").collect()) as Doc<"gyms">[];

    const memberships = (await ctx.db.query("memberships").collect()) as Doc<"memberships">[];

    return await Promise.all(
      gyms.map(async (gym) => {
        const memberCount = (await ctx.db
          .query("members")
          .withIndex("by_gymId", (q) => q.eq("gymId", gym._id))
          .collect()) as Doc<"members">[];

        const gymRevenue = memberships
          .filter((m) => {
            const member = memberCount.find((mb) => mb._id === m.memberId);
            return !!member;
          })
          .reduce((sum, m) => sum + (m.amountPaid || 0), 0);

        const activeMembers = memberCount.filter((m) => m.isActive).length;

        return {
          gym,
          memberCount: memberCount.length,
          activeMembers,
          revenue: gymRevenue,
        };
      })
    );
  },
});

export const getGymDetail = query({
  args: { sessionToken: v.string(), gymId: v.id("gyms") },
  handler: async (ctx, args) => {
    await requireSuperadminUser(ctx, args.sessionToken);

    const gym = (await ctx.db.get(args.gymId)) as Doc<"gyms"> | null;
    if (!gym) throw new ConvexError({ code: "NOT_FOUND", message: "Gym not found." });

    const members = (await ctx.db
      .query("members")
      .withIndex("by_gymId", (q) => q.eq("gymId", args.gymId))
      .collect()) as Doc<"members">[];

    const allMemberships = (await ctx.db.query("memberships").collect()) as Doc<"memberships">[];

    const memberMemberships = await Promise.all(
      members.map(async (member) => {
        const ms = allMemberships.filter((m) => m.memberId === member._id);
        return { member, memberships: ms };
      })
    );

    const gymMembershipRecords = memberMemberships.flatMap(({ memberships }) => memberships);
    const revenue = gymMembershipRecords.reduce((sum, m) => sum + (m.amountPaid || 0), 0);
    const activeMemberships = gymMembershipRecords.filter((m) => m.status === "active");

    const todayStr = todayDateString();
    const recentCheckIns = (await ctx.db
      .query("checkIns")
      .withIndex("by_date", (q) => q.eq("date", todayStr))
      .collect()) as Doc<"checkIns">[];

    const gymCheckIns = recentCheckIns
      .filter((ci) => members.some((m) => m._id === ci.memberId))
      .slice(0, 20);

    const coachConnections = await ctx.db
      .query("coachGymConnections")
      .withIndex("by_gym", (q) => q.eq("gymId", args.gymId))
      .collect();

    return {
      gym,
      memberCount: members.length,
      activeMembers: members.filter((m) => m.isActive).length,
      coachCount: coachConnections.filter((c) => c.status === "accepted").length,
      revenue,
      activeMemberships: activeMemberships.length,
      expiringMemberships: activeMemberships.filter((m) => m.endDate <= sevenDaysFromNow()).length,
      todayCheckIns: gymCheckIns.length,
      recentCheckIns: gymCheckIns,
      recentMembers: members.slice(0, 10),
    };
  },
});

export const setGymActive = mutation({
  args: { sessionToken: v.string(), gymId: v.id("gyms"), isActive: v.boolean() },
  handler: async (ctx, args) => {
    await requireSuperadminUser(ctx, args.sessionToken);

    const gym = await ctx.db.get(args.gymId);
    if (!gym) throw new ConvexError({ code: "NOT_FOUND", message: "Gym not found." });

    await ctx.db.patch(args.gymId, { isActive: args.isActive });
    return { success: true };
  },
});

export const updateGym = mutation({
  args: {
    sessionToken: v.string(),
    gymId: v.id("gyms"),
    name: v.optional(v.string()),
    phone: v.optional(v.string()),
    address: v.optional(v.string()),
    city: v.optional(v.string()),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireSuperadminUser(ctx, args.sessionToken);

    const gym = await ctx.db.get(args.gymId);
    if (!gym) throw new ConvexError({ code: "NOT_FOUND", message: "Gym not found." });

    const patch: Record<string, unknown> = {};
    if (args.name !== undefined) patch.name = args.name.trim();
    if (args.phone !== undefined) patch.phone = args.phone.trim();
    if (args.address !== undefined) patch.address = args.address.trim();
    if (args.city !== undefined) patch.city = args.city.trim();
    if (args.description !== undefined) patch.description = args.description.trim();

    await ctx.db.patch(args.gymId, patch);
    return { success: true };
  },
});

export const createGym = mutation({
  args: {
    sessionToken: v.string(),
    email: v.string(),
    password: v.string(),
    name: v.string(),
    phone: v.string(),
    address: v.string(),
    city: v.string(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireSuperadminUser(ctx, args.sessionToken);

    const email = normalizeEmail(args.email);
    const name = args.name.trim();
    const phone = args.phone.trim();
    const address = args.address.trim();
    const city = args.city.trim();
    const description = args.description?.trim() || undefined;
    const now = Date.now();

    if (!isValidEmail(email)) throw new ConvexError({ code: "INVALID_EMAIL", message: "Enter a valid email address." });
    if (args.password.length < 8) throw new ConvexError({ code: "WEAK_PASSWORD", message: "Password must be at least 8 characters." });
    if (name.length < 2) throw new ConvexError({ code: "INVALID_INPUT", message: "Gym name must be at least 2 characters." });

    const existingGym = await ctx.db
      .query("gyms")
      .withIndex("by_email", (q) => q.eq("email", email))
      .first();
    if (existingGym) throw new ConvexError({ code: "EMAIL_EXISTS", message: "A gym with this email already exists." });

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

    await ctx.db.insert("users", {
      email,
      passwordHash: hashPassword(args.password),
      role: "gym",
      gymId,
      createdAt: now,
    });

    return { success: true, gymId, email };
  },
});

/* ────────────── Users ────────────── */

export const listUsers = query({
  args: {
    sessionToken: v.string(),
    role: v.optional(v.union(v.literal("gym"), v.literal("member"), v.literal("coach"), v.literal("superadmin"))),
    search: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireSuperadminUser(ctx, args.sessionToken);

    let query;
    if (args.role) {
      query = ctx.db.query("users").withIndex("by_role", (q) => q.eq("role", args.role!));
    } else {
      query = ctx.db.query("users").order("desc");
    }

    const users = (await query.collect()) as Doc<"users">[];

    const search = args.search?.toLowerCase().trim();

    const enriched = await Promise.all(
      users
        .filter((u) => {
          if (!search) return true;
          return u.email.toLowerCase().includes(search);
        })
        .map(async (user) => {
          let profile: Record<string, unknown> | null = null;
          let profileName = "";

          if (user.role === "gym" && user.gymId) {
            profile = await ctx.db.get(user.gymId);
            profileName = (profile as Doc<"gyms"> | null)?.name ?? "";
          } else if (user.role === "member" && user.memberId) {
            const m = (await ctx.db.get(user.memberId)) as Doc<"members"> | null;
            profile = m;
            profileName = m ? `${m.firstName} ${m.lastName}` : "";
          } else if (user.role === "coach" && user.coachId) {
            const c = (await ctx.db.get(user.coachId)) as Doc<"coaches"> | null;
            profile = c;
            profileName = c ? `${c.firstName} ${c.lastName}` : "";
          }

          return { user, profile, profileName };
        })
    );

    return enriched;
  },
});

export const setMemberActive = mutation({
  args: { sessionToken: v.string(), memberId: v.id("members"), isActive: v.boolean() },
  handler: async (ctx, args) => {
    await requireSuperadminUser(ctx, args.sessionToken);

    const member = await ctx.db.get(args.memberId);
    if (!member) throw new ConvexError({ code: "NOT_FOUND", message: "Member not found." });

    await ctx.db.patch(args.memberId, { isActive: args.isActive });
    return { success: true };
  },
});

export const setCoachActive = mutation({
  args: { sessionToken: v.string(), coachId: v.id("coaches"), isActive: v.boolean() },
  handler: async (ctx, args) => {
    await requireSuperadminUser(ctx, args.sessionToken);

    const coach = await ctx.db.get(args.coachId);
    if (!coach) throw new ConvexError({ code: "NOT_FOUND", message: "Coach not found." });

    await ctx.db.patch(args.coachId, { isActive: args.isActive });
    return { success: true };
  },
});

export const revokeUserSessions = mutation({
  args: { sessionToken: v.string(), userId: v.id("users") },
  handler: async (ctx, args) => {
    await requireSuperadminUser(ctx, args.sessionToken);

    const sessions = await ctx.db
      .query("authSessions")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
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

/* ────────────── Revenue ────────────── */

export const listMemberships = query({
  args: {
    sessionToken: v.string(),
    gymId: v.optional(v.id("gyms")),
    status: v.optional(v.union(v.literal("active"), v.literal("expired"), v.literal("cancelled"))),
  },
  handler: async (ctx, args) => {
    await requireSuperadminUser(ctx, args.sessionToken);

    let memberships;
    if (args.status) {
      memberships = (await ctx.db
        .query("memberships")
        .withIndex("by_status", (q) => q.eq("status", args.status!))
        .collect()) as Doc<"memberships">[];
    } else {
      memberships = (await ctx.db.query("memberships").order("desc").collect()) as Doc<"memberships">[];
    }

    const enriched = await Promise.all(
      memberships
        .map(async (m) => {
          const member = (await ctx.db.get(m.memberId)) as Doc<"members"> | null;
          if (args.gymId && member?.gymId !== args.gymId) return null;

          const gym = member?.gymId ? ((await ctx.db.get(member.gymId)) as Doc<"gyms"> | null) : null;
          return {
            membership: m,
            member,
            gym,
          };
        })
    );

    return enriched.filter(Boolean);
  },
});

/* ────────────── Bootstrap ────────────── */

export const bootstrapSuperadmin = mutation({
  args: {
    email: v.string(),
    password: v.string(),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const email = normalizeEmail(args.email);
    const name = args.name.trim();
    const now = Date.now();

    if (!isValidEmail(email)) throw new ConvexError({ code: "INVALID_EMAIL", message: "Enter a valid email address." });
    if (args.password.length < 8) throw new ConvexError({ code: "WEAK_PASSWORD", message: "Password must be at least 8 characters." });

    const existing = await ctx.db
      .query("users")
      .withIndex("by_role", (q) => q.eq("role", "superadmin"))
      .first();

    if (existing) {
      throw new ConvexError({
        code: "ALREADY_EXISTS",
        message: "A superadmin already exists. Create additional admins from the admin panel.",
      });
    }

    const existingEmail = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", email))
      .first();

    if (existingEmail) {
      throw new ConvexError({ code: "EMAIL_EXISTS", message: "A user with this email already exists." });
    }

    await ctx.db.insert("users", {
      email,
      passwordHash: hashPassword(args.password),
      role: "superadmin",
      createdAt: now,
    });

    return { success: true, name, email };
  },
});

export const resetSuperadminPassword = mutation({
  args: {
    email: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    const email = normalizeEmail(args.email);
    if (args.password.length < 8) throw new ConvexError({ code: "WEAK_PASSWORD", message: "Password must be at least 8 characters." });

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", email))
      .first();

    if (!user || user.role !== "superadmin") {
      throw new ConvexError({ code: "NOT_FOUND", message: "No superadmin found with that email." });
    }

    await ctx.db.patch(user._id, {
      passwordHash: hashPassword(args.password),
    });

    return { success: true, email };
  },
});

