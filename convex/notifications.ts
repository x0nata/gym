import { query, mutation, internalMutation } from "./_generated/server";
import { v, ConvexError } from "convex/values";
import { ensureSameGym, requireGymUser, requireMemberUser } from "./lib/session";
import type { Doc } from "./_generated/dataModel";

export const listForGym = query({
  args: { sessionToken: v.string() },
  handler: async (ctx, args) => {
    const user = await requireGymUser(ctx, args.sessionToken);

    const members = (await ctx.db
      .query("members")
      .withIndex("by_gymId", (q) => q.eq("gymId", user.gymId!))
      .collect()) as Doc<"members">[];
    const memberMap = new Map(members.map((member) => [member._id, member]));

    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_audience", (q) => q.eq("audience", "gym"))
      .order("desc")
      .take(150);

    return notifications
      .filter((notification) => memberMap.has(notification.memberId))
      .map((notification) => ({
        ...notification,
        member: memberMap.get(notification.memberId),
      }))
      .slice(0, 50);
  },
});

export const listForMember = query({
  args: { sessionToken: v.string() },
  handler: async (ctx, args) => {
    const user = await requireMemberUser(ctx, args.sessionToken);

    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_member", (q) => q.eq("memberId", user.memberId!))
      .filter((q) => q.eq(q.field("audience"), "member"))
      .order("desc")
      .take(50);

    return notifications;
  },
});

export const unreadCountForGym = query({
  args: { sessionToken: v.string() },
  handler: async (ctx, args) => {
    const user = await requireGymUser(ctx, args.sessionToken);

    const members = (await ctx.db
      .query("members")
      .withIndex("by_gymId", (q) => q.eq("gymId", user.gymId!))
      .collect()) as Doc<"members">[];
    const memberIds = new Set(members.map((member) => member._id));

    const unread = await ctx.db
      .query("notifications")
      .withIndex("by_audience_read", (q) => q.eq("audience", "gym").eq("isRead", false))
      .collect();

    return unread.filter((notification) => memberIds.has(notification.memberId)).length;
  },
});

export const unreadCountForMember = query({
  args: { sessionToken: v.string() },
  handler: async (ctx, args) => {
    const user = await requireMemberUser(ctx, args.sessionToken);

    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_member", (q) => q.eq("memberId", user.memberId!))
      .filter((q) => q.eq(q.field("audience"), "member"))
      .collect();
    return notifications.filter((notification) => !notification.isRead).length;
  },
});

export const markAsRead = mutation({
  args: { notificationId: v.id("notifications"), sessionToken: v.string() },
  handler: async (ctx, args) => {
    const notification = (await ctx.db.get(args.notificationId)) as Doc<"notifications"> | null;
    if (!notification) {
      throw new ConvexError({ code: "NOT_FOUND", message: "Notification not found." });
    }

    if (notification.audience === "member") {
      const memberUser = await requireMemberUser(ctx, args.sessionToken);
      if (memberUser.memberId !== notification.memberId) {
        throw new ConvexError({ code: "FORBIDDEN", message: "Access denied." });
      }
    } else {
      const gymUser = await requireGymUser(ctx, args.sessionToken);
      const member = (await ctx.db.get(notification.memberId)) as Doc<"members"> | null;
      ensureSameGym(member, gymUser.gymId);
    }

    await ctx.db.patch(args.notificationId, { isRead: true });
    return null;
  },
});

export const markAllReadForGym = mutation({
  args: { sessionToken: v.string() },
  handler: async (ctx, args) => {
    const user = await requireGymUser(ctx, args.sessionToken);

    const members = (await ctx.db
      .query("members")
      .withIndex("by_gymId", (q) => q.eq("gymId", user.gymId!))
      .collect()) as Doc<"members">[];
    const memberIds = new Set(members.map((member) => member._id));

    const unread = await ctx.db
      .query("notifications")
      .withIndex("by_audience_read", (q) => q.eq("audience", "gym").eq("isRead", false))
      .collect();

    await Promise.all(
      unread
        .filter((notification) => memberIds.has(notification.memberId))
        .map((notification) => ctx.db.patch(notification._id, { isRead: true }))
    );
    return null;
  },
});

export const markAllReadForMember = mutation({
  args: { sessionToken: v.string() },
  handler: async (ctx, args) => {
    const user = await requireMemberUser(ctx, args.sessionToken);

    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_member", (q) => q.eq("memberId", user.memberId!))
      .filter((q) => q.eq(q.field("audience"), "member"))
      .collect();

    const unread = notifications.filter((notification) => !notification.isRead);
    await Promise.all(unread.map((notification) => ctx.db.patch(notification._id, { isRead: true })));
    return null;
  },
});

export const checkMembershipExpiry = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const sevenDaysFromNow = now + 7 * 24 * 60 * 60 * 1000;

    const activeMemberships = await ctx.db
      .query("memberships")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .collect();

    for (const membership of activeMemberships) {
      const member = await ctx.db.get(membership.memberId);
      if (!member) continue;

      if (membership.endDate < now) {
        await ctx.db.patch(membership._id, { status: "expired" });

        if (!membership.notifiedExpired) {
          await ctx.db.insert("notifications", {
            memberId: member._id,
            type: "membership_expired",
            title: "Plan Expired",
            message: `${member.firstName} ${member.lastName}'s ${membership.planName} plan has expired. Pay to renew.`,
            isRead: false,
            createdAt: now,
            audience: "gym",
          });

          await ctx.db.insert("notifications", {
            memberId: member._id,
            type: "membership_expired",
            title: "Plan Expired",
            message: `Your ${membership.planName} plan has expired. Go to the gym to renew.`,
            isRead: false,
            createdAt: now,
            audience: "member",
          });

          await ctx.db.patch(membership._id, { notifiedExpired: true });
        }
      } else if (membership.endDate <= sevenDaysFromNow && !membership.notifiedExpiring) {
        const daysRemaining = Math.ceil((membership.endDate - now) / (24 * 60 * 60 * 1000));

        await ctx.db.insert("notifications", {
          memberId: member._id,
          type: "membership_expiring",
          title: "Plan Expiring Soon",
          message: `${member.firstName} ${member.lastName}'s plan ends in ${daysRemaining} day(s).`,
          isRead: false,
          createdAt: now,
          audience: "gym",
        });

        await ctx.db.insert("notifications", {
          memberId: member._id,
          type: "membership_expiring",
          title: "Plan Expiring Soon",
          message: `Your ${membership.planName} plan ends in ${daysRemaining} day(s). Renew to keep access.`,
          isRead: false,
          createdAt: now,
          audience: "member",
        });

        await ctx.db.patch(membership._id, { notifiedExpiring: true });
      }
    }
  },
});
