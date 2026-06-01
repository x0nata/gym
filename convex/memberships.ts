import { query, mutation } from "./_generated/server";
import { v, ConvexError } from "convex/values";
import { ensureSameGym, requireGymUser, requireMemberUser } from "./lib/session";
import type { Doc } from "./_generated/dataModel";

function toEffectiveMembershipStatus(membership: Doc<"memberships">): Doc<"memberships">["status"] {
  if (membership.status === "active" && membership.endDate <= Date.now()) {
    return "expired";
  }
  return membership.status;
}

export const getByMember = query({
  args: { memberId: v.id("members"), sessionToken: v.string() },
  handler: async (ctx, args) => {
    const memberUser = await requireMemberUser(ctx, args.sessionToken).catch(() => null);

    if (memberUser && memberUser.memberId !== args.memberId) {
      throw new ConvexError({ code: "FORBIDDEN", message: "Access denied." });
    }

    if (!memberUser) {
      const gymUser = await requireGymUser(ctx, args.sessionToken);
      const member = (await ctx.db.get(args.memberId)) as Doc<"members"> | null;
      ensureSameGym(member, gymUser.gymId);
    }

    const memberships = await ctx.db
      .query("memberships")
      .withIndex("by_member", (q) => q.eq("memberId", args.memberId))
      .order("desc")
      .collect();

    return memberships.map((membership) => ({
      ...membership,
      status: toEffectiveMembershipStatus(membership),
    }));
  },
});

export const getActiveMembership = query({
  args: { memberId: v.id("members"), sessionToken: v.string() },
  handler: async (ctx, args) => {
    const memberUser = await requireMemberUser(ctx, args.sessionToken).catch(() => null);

    if (memberUser && memberUser.memberId !== args.memberId) {
      throw new ConvexError({ code: "FORBIDDEN", message: "Access denied." });
    }

    if (!memberUser) {
      const gymUser = await requireGymUser(ctx, args.sessionToken);
      const member = (await ctx.db.get(args.memberId)) as Doc<"members"> | null;
      ensureSameGym(member, gymUser.gymId);
    }

    const membership = await ctx.db
      .query("memberships")
      .withIndex("by_member_status", (q) => q.eq("memberId", args.memberId).eq("status", "active"))
      .first();

    if (!membership || membership.endDate <= Date.now()) {
      return null;
    }

    return membership;
  },
});

export const create = mutation({
  args: {
    sessionToken: v.string(),
    memberId: v.id("members"),
    planName: v.string(),
    durationDays: v.number(),
    amountPaid: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await requireGymUser(ctx, args.sessionToken);
    const member = (await ctx.db.get(args.memberId)) as Doc<"members"> | null;
    ensureSameGym(member, user.gymId);

    const now = Date.now();
    const endDate = now + args.durationDays * 24 * 60 * 60 * 1000;

    const activeMemberships = await ctx.db
      .query("memberships")
      .withIndex("by_member_status", (q) => q.eq("memberId", args.memberId).eq("status", "active"))
      .collect();

    await Promise.all(activeMemberships.map((membership) => ctx.db.patch(membership._id, { status: "expired" })));

    const membershipId = await ctx.db.insert("memberships", {
      memberId: args.memberId,
      planName: args.planName,
      startDate: now,
      endDate,
      amountPaid: args.amountPaid,
      status: "active",
      notifiedExpiring: false,
      notifiedExpired: false,
    });

    await ctx.db.patch(args.memberId, { isActive: true });
    return membershipId;
  },
});

export const listExpiring = query({
  args: { sessionToken: v.string() },
  handler: async (ctx, args) => {
    const user = await requireGymUser(ctx, args.sessionToken);

    const members = (await ctx.db
      .query("members")
      .withIndex("by_gymId", (q) => q.eq("gymId", user.gymId!))
      .collect()) as Doc<"members">[];
    const memberMap = new Map(members.map((member) => [member._id, member]));

    const now = Date.now();
    const sevenDaysFromNow = now + 7 * 24 * 60 * 60 * 1000;

    const activeMemberships = await ctx.db
      .query("memberships")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .collect();

    return activeMemberships
      .filter(
        (membership) =>
          membership.endDate > now &&
          membership.endDate <= sevenDaysFromNow &&
          memberMap.has(membership.memberId)
      )
      .map((membership) => ({
        ...membership,
        member: memberMap.get(membership.memberId),
      }));
  },
});

export const listAll = query({
  args: { sessionToken: v.string() },
  handler: async (ctx, args) => {
    const user = await requireGymUser(ctx, args.sessionToken);

    const members = (await ctx.db
      .query("members")
      .withIndex("by_gymId", (q) => q.eq("gymId", user.gymId!))
      .collect()) as Doc<"members">[];
    const memberMap = new Map(members.map((member) => [member._id, member]));

    const memberships = await ctx.db.query("memberships").order("desc").collect();
    return memberships
      .filter((membership) => memberMap.has(membership.memberId))
      .map((membership) => ({ ...membership, member: memberMap.get(membership.memberId) }));
  },
});
