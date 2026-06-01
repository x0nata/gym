import { query, mutation } from "./_generated/server";
import { v, ConvexError } from "convex/values";
import { ensureSameGym, requireGymUser, requireMemberUser } from "./lib/session";
import type { Doc } from "./_generated/dataModel";

export const scanAndCheckIn = mutation({
  args: { qrCode: v.string(), sessionToken: v.string() },
  handler: async (ctx, args) => {
    const gymUser = await requireGymUser(ctx, args.sessionToken);

    const member = (await ctx.db
      .query("members")
      .withIndex("by_qrCode", (q) => q.eq("qrCode", args.qrCode))
      .first()) as Doc<"members"> | null;

    if (!member || member.gymId !== gymUser.gymId) {
      throw new ConvexError({
        code: "MEMBER_NOT_FOUND",
        message: "No member found with this QR code",
      });
    }

    if (!member.isActive) {
      throw new ConvexError({
        code: "MEMBER_INACTIVE",
        message: `${member.firstName} ${member.lastName} is inactive`,
      });
    }

    const activeMembership = await ctx.db
      .query("memberships")
      .withIndex("by_member_status", (q) => q.eq("memberId", member._id).eq("status", "active"))
      .first();

    if (!activeMembership) {
      throw new ConvexError({
        code: "NO_ACTIVE_MEMBERSHIP",
        message: `${member.firstName} ${member.lastName} has no active membership. Payment required.`,
      });
    }

    const now = Date.now();
    if (activeMembership.endDate < now) {
      await ctx.db.patch(activeMembership._id, { status: "expired" });
      throw new ConvexError({
        code: "MEMBERSHIP_EXPIRED",
        message: `${member.firstName} ${member.lastName}'s membership has expired. Please renew.`,
      });
    }

    const today = new Date().toISOString().split("T")[0];

    const existingCheckIn = await ctx.db
      .query("checkIns")
      .withIndex("by_member_date", (q) => q.eq("memberId", member._id).eq("date", today))
      .first();

    if (existingCheckIn) {
      return {
        status: "already_checked_in",
        member,
        membership: activeMembership,
        checkInTime: existingCheckIn.timestamp,
      };
    }

    await ctx.db.insert("checkIns", {
      memberId: member._id,
      timestamp: now,
      date: today,
    });

    await ctx.db.insert("notifications", {
      memberId: member._id,
      type: "check_in",
      title: "Member Checked In",
      message: `${member.firstName} ${member.lastName} checked in at ${new Date(now).toLocaleTimeString()}`,
      isRead: false,
      createdAt: now,
      audience: "gym",
    });

    const daysRemaining = Math.ceil((activeMembership.endDate - now) / (24 * 60 * 60 * 1000));

    if (daysRemaining <= 7 && !activeMembership.notifiedExpiring) {
      await ctx.db.insert("notifications", {
        memberId: member._id,
        type: "membership_expiring",
        title: "Membership Expiring Soon",
        message: `${member.firstName} ${member.lastName}'s ${activeMembership.planName} membership expires in ${daysRemaining} day(s).`,
        isRead: false,
        createdAt: now,
        audience: "gym",
      });

      await ctx.db.insert("notifications", {
        memberId: member._id,
        type: "membership_expiring",
        title: "Your Membership is Expiring",
        message: `Your ${activeMembership.planName} membership expires in ${daysRemaining} day(s). Please renew to continue.`,
        isRead: false,
        createdAt: now,
        audience: "member",
      });

      await ctx.db.patch(activeMembership._id, { notifiedExpiring: true });
    }

    return {
      status: "checked_in",
      member,
      membership: activeMembership,
      checkInTime: now,
      daysRemaining,
    };
  },
});

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

    return await ctx.db
      .query("checkIns")
      .withIndex("by_member", (q) => q.eq("memberId", args.memberId))
      .order("desc")
      .collect();
  },
});

export const getToday = query({
  args: { sessionToken: v.string() },
  handler: async (ctx, args) => {
    const gymUser = await requireGymUser(ctx, args.sessionToken);
    const today = new Date().toISOString().split("T")[0];
    const checkIns = await ctx.db
      .query("checkIns")
      .withIndex("by_date", (q) => q.eq("date", today))
      .order("desc")
      .collect();

    const results = [];
    for (const checkIn of checkIns) {
      const member = (await ctx.db.get(checkIn.memberId)) as Doc<"members"> | null;
      if (member && member.gymId === gymUser.gymId) {
        results.push({ ...checkIn, member });
      }
    }
    return results;
  },
});

export const getRecent = query({
  args: { limit: v.optional(v.number()), sessionToken: v.string() },
  handler: async (ctx, args) => {
    const gymUser = await requireGymUser(ctx, args.sessionToken);
    const limit = args.limit ?? 50;
    const checkIns = await ctx.db.query("checkIns").order("desc").take(limit * 3);

    const results = [];
    for (const checkIn of checkIns) {
      const member = (await ctx.db.get(checkIn.memberId)) as Doc<"members"> | null;
      if (member && member.gymId === gymUser.gymId) {
        results.push({ ...checkIn, member });
      }
      if (results.length >= limit) break;
    }
    return results;
  },
});
