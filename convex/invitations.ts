import { mutation, query } from "./_generated/server";
import { ConvexError, v } from "convex/values";
import type { Doc } from "./_generated/dataModel";
import { requireGymUser } from "./lib/session";

const INVITATION_TTL_MS = 1000 * 60 * 60 * 24 * 14;

function generateCode(prefix: "MEM" | "COACH"): string {
  return `${prefix}-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D+/g, "");
  return digits || phone.trim();
}

export const createMemberInvitation = mutation({
  args: {
    sessionToken: v.string(),
    firstName: v.string(),
    lastName: v.string(),
    phone: v.string(),
  },
  handler: async (ctx, args) => {
    const gymUser = await requireGymUser(ctx, args.sessionToken);
    const normalizedPhone = normalizePhone(args.phone);

    const gymMembers = await ctx.db
      .query("members")
      .withIndex("by_gymId", (q) => q.eq("gymId", gymUser.gymId!))
      .collect();

    const existingMemberWithPhone = gymMembers.find(
      (member) => normalizePhone(member.phone) === normalizedPhone
    );

    if (existingMemberWithPhone) {
      throw new ConvexError({
        code: "PHONE_EXISTS",
        message: "A member with this phone number already exists in your gym.",
      });
    }

    const code = generateCode("MEM");
    const pendingEmail = `pending+${code.toLowerCase()}@invite.local`;

    const memberId = await ctx.db.insert("members", {
      firstName: args.firstName,
      lastName: args.lastName,
      email: pendingEmail,
      phone: args.phone.trim(),
      qrCode: `MEM-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
      gymId: gymUser.gymId,
      joinedAt: Date.now(),
      isActive: true,
    });

    const now = Date.now();

    const invitationId = await ctx.db.insert("invitations", {
      code,
      type: "member",
      gymId: gymUser.gymId!,
      memberId,
      firstName: args.firstName,
      lastName: args.lastName,
      phone: args.phone.trim(),
      status: "pending",
      expiresAt: now + INVITATION_TTL_MS,
      createdByUserId: gymUser._id,
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.insert("notifications", {
      memberId,
      type: "welcome",
      title: "Member Invited",
      message: `${args.firstName} ${args.lastName} was invited successfully.`,
      isRead: false,
      createdAt: now,
      audience: "gym",
    });

    return { invitationId, memberId, invitationCode: code, expiresAt: now + INVITATION_TTL_MS };
  },
});

export const getByCode = query({
  args: { code: v.string() },
  handler: async (ctx, args) => {
    const invitation = await ctx.db
      .query("invitations")
      .withIndex("by_code", (q) => q.eq("code", args.code.trim().toUpperCase()))
      .first();

    if (!invitation) return null;

    if (invitation.status === "pending" && invitation.expiresAt < Date.now()) {
      return { ...invitation, status: "expired" as const };
    }

    return invitation;
  },
});

export const listForGym = query({
  args: { sessionToken: v.string(), type: v.optional(v.union(v.literal("member"), v.literal("coach"))) },
  handler: async (ctx, args) => {
    const gymUser = await requireGymUser(ctx, args.sessionToken);
    const invitations = (await ctx.db
      .query("invitations")
      .withIndex("by_gym", (q) => q.eq("gymId", gymUser.gymId!))
      .collect()) as Doc<"invitations">[];

    const now = Date.now();

    const filtered = invitations.filter((inv) => {
      if (args.type && inv.type !== args.type) return false;
      return true;
    });

    return filtered
      .map((inv) => ({
        ...inv,
        status: inv.status === "pending" && inv.expiresAt < now ? "expired" : inv.status,
      }))
      .sort((a, b) => b.createdAt - a.createdAt);
  },
});

export const revoke = mutation({
  args: { invitationId: v.id("invitations"), sessionToken: v.string() },
  handler: async (ctx, args) => {
    const gymUser = await requireGymUser(ctx, args.sessionToken);
    const invitation = await ctx.db.get(args.invitationId);
    if (!invitation) {
      throw new ConvexError({ code: "NOT_FOUND", message: "Invitation not found." });
    }

    if (invitation.gymId !== gymUser.gymId) {
      throw new ConvexError({ code: "FORBIDDEN", message: "Invitation does not belong to your gym." });
    }

    if (invitation.status === "claimed") {
      throw new ConvexError({ code: "ALREADY_CLAIMED", message: "Claimed invitation cannot be revoked." });
    }

    await ctx.db.patch(args.invitationId, {
      status: "revoked",
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

export const regenerate = mutation({
  args: { invitationId: v.id("invitations"), sessionToken: v.string() },
  handler: async (ctx, args) => {
    const gymUser = await requireGymUser(ctx, args.sessionToken);
    const invitation = await ctx.db.get(args.invitationId);
    if (!invitation) {
      throw new ConvexError({ code: "NOT_FOUND", message: "Invitation not found." });
    }

    if (invitation.gymId !== gymUser.gymId) {
      throw new ConvexError({ code: "FORBIDDEN", message: "Invitation does not belong to your gym." });
    }

    if (invitation.status === "claimed") {
      throw new ConvexError({ code: "ALREADY_CLAIMED", message: "Cannot regenerate a claimed invitation." });
    }

    const now = Date.now();
    const code = generateCode(invitation.type === "member" ? "MEM" : "COACH");

    await ctx.db.patch(args.invitationId, {
      code,
      status: "pending",
      expiresAt: now + INVITATION_TTL_MS,
      updatedAt: now,
    });

    return { success: true, invitationCode: code, expiresAt: now + INVITATION_TTL_MS };
  },
});
