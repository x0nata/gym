import { query, mutation } from "./_generated/server";
import { v, ConvexError } from "convex/values";
import { ensureSameGym, requireGymUser, requireMemberUser } from "./lib/session";
import type { Doc } from "./_generated/dataModel";

export const list = query({
  args: { sessionToken: v.string() },
  handler: async (ctx, args) => {
    const user = await requireGymUser(ctx, args.sessionToken);

    const members = (await ctx.db
      .query("members")
      .withIndex("by_gymId", (q) => q.eq("gymId", user.gymId!))
      .collect()) as Doc<"members">[];

    return members.sort((a, b) => b.joinedAt - a.joinedAt);
  },
});

export const getActive = query({
  args: { sessionToken: v.string() },
  handler: async (ctx, args) => {
    const user = await requireGymUser(ctx, args.sessionToken);
    const members = (await ctx.db
      .query("members")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .collect()) as Doc<"members">[];

    return members.filter((member) => member.gymId === user.gymId);
  },
});

export const getById = query({
  args: { memberId: v.id("members"), sessionToken: v.string() },
  handler: async (ctx, args) => {
    const user = await requireMemberUser(ctx, args.sessionToken).catch(async () => {
      return requireGymUser(ctx, args.sessionToken);
    });

    const member = (await ctx.db.get(args.memberId)) as Doc<"members"> | null;
    if (!member) return null;

    if (user.role === "member") {
      if (user.memberId !== member._id) {
        throw new ConvexError({ code: "FORBIDDEN", message: "Access denied." });
      }
      return member;
    }

    ensureSameGym(member, user.gymId);
    return member;
  },
});

export const getByQrCode = query({
  args: { qrCode: v.string(), sessionToken: v.string() },
  handler: async (ctx, args) => {
    const user = await requireGymUser(ctx, args.sessionToken);
    const member = (await ctx.db
      .query("members")
      .withIndex("by_qrCode", (q) => q.eq("qrCode", args.qrCode))
      .first()) as Doc<"members"> | null;

    if (!member || member.gymId !== user.gymId) return null;
    return member;
  },
});

export const update = mutation({
  args: {
    sessionToken: v.string(),
    memberId: v.id("members"),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const user = await requireGymUser(ctx, args.sessionToken);
    const member = (await ctx.db.get(args.memberId)) as Doc<"members"> | null;
    ensureSameGym(member, user.gymId);

    const { memberId, sessionToken, ...updates } = args;
    const cleanUpdates = Object.fromEntries(
      Object.entries(updates).filter(([, val]) => val !== undefined)
    );
    if (Object.keys(cleanUpdates).length > 0) {
      await ctx.db.patch(memberId, cleanUpdates);
    }
    // ensure sessionToken is considered used since we destructure it to omit it
    void sessionToken;
    return null;
  },
});

export const remove = mutation({
  args: { memberId: v.id("members"), sessionToken: v.string() },
  handler: async (ctx, args) => {
    const user = await requireGymUser(ctx, args.sessionToken);
    const member = (await ctx.db.get(args.memberId)) as Doc<"members"> | null;
    ensureSameGym(member, user.gymId);

    await ctx.db.patch(args.memberId, { isActive: false });
    return null;
  },
});

export const stats = query({
  args: { sessionToken: v.string() },
  handler: async (ctx, args) => {
    const user = await requireGymUser(ctx, args.sessionToken);

    const allMembers = (await ctx.db
      .query("members")
      .withIndex("by_gymId", (q) => q.eq("gymId", user.gymId!))
      .collect()) as Doc<"members">[];
    const memberIds = new Set(allMembers.map((m) => m._id));

    const today = new Date().toISOString().split("T")[0];
    const todayCheckIns = await ctx.db
      .query("checkIns")
      .withIndex("by_date", (q) => q.eq("date", today))
      .collect();

    const checkInsInGym = todayCheckIns.filter((checkIn) => memberIds.has(checkIn.memberId));

    const activeMemberships = await ctx.db
      .query("memberships")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .collect();

    const now = Date.now();
    const activeMembershipsInGym = activeMemberships.filter(
      (membership) => memberIds.has(membership.memberId) && membership.endDate > now
    );
    const memberIdsWithActiveMembership = new Set(activeMembershipsInGym.map((membership) => membership.memberId));
    const activeMembers = memberIdsWithActiveMembership.size;

    const sevenDaysFromNow = now + 7 * 24 * 60 * 60 * 1000;
    const expiringSoon = activeMembershipsInGym.filter((m) => m.endDate <= sevenDaysFromNow && m.endDate > now);

    return {
      totalMembers: allMembers.length,
      activeMembers,
      todayCheckIns: checkInsInGym.length,
      activeMemberships: activeMembershipsInGym.length,
      expiringSoon: expiringSoon.length,
    };
  },
});
