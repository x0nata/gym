import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireGymUser } from "./lib/session";

export const getCoachesForGym = query({
    args: {
        sessionToken: v.string(),
        status: v.optional(v.union(v.literal("pending"), v.literal("accepted"), v.literal("rejected")))
    },
    handler: async (ctx, args) => {
        const user = await requireGymUser(ctx, args.sessionToken);

        let query = ctx.db
            .query("coachGymConnections")
            .withIndex("by_gym", (q) => q.eq("gymId", user.gymId!));

        if (args.status) {
            query = ctx.db
                .query("coachGymConnections")
                .withIndex("by_gym_status", (q) =>
                    q.eq("gymId", user.gymId!).eq("status", args.status!)
                );
        }

        const connections = await query.collect();

        const coachesWithDetails = await Promise.all(
            connections.map(async (conn) => {
                const coach = await ctx.db.get(conn.coachId);
                return {
                    ...conn,
                    coach,
                };
            })
        );

        return coachesWithDetails;
    },
});

export const respondToConnection = mutation({
    args: {
        sessionToken: v.string(),
        connectionId: v.id("coachGymConnections"),
        accept: v.boolean(),
    },
    handler: async (ctx, args) => {
        const user = await requireGymUser(ctx, args.sessionToken);

        const connection = await ctx.db.get(args.connectionId);
        if (!connection || connection.gymId !== user.gymId) {
            throw new Error("Connection not found or unauthorized");
        }

        await ctx.db.patch(args.connectionId, {
            status: args.accept ? "accepted" : "rejected",
            updatedAt: Date.now(),
        });

        return { success: true };
    },
});

export const inviteCoach = mutation({
    args: {
        sessionToken: v.string(),
        coachId: v.id("coaches"),
    },
    handler: async (ctx, args) => {
        const user = await requireGymUser(ctx, args.sessionToken);

        const existing = await ctx.db
            .query("coachGymConnections")
            .withIndex("by_coach", (q) => q.eq("coachId", args.coachId))
            .filter((q) => q.eq(q.field("gymId"), user.gymId!))
            .first();

        if (existing) {
            throw new Error("Connection already exists");
        }

        await ctx.db.insert("coachGymConnections", {
            coachId: args.coachId,
            gymId: user.gymId!,
            status: "pending",
            requestedBy: "gym",
            createdAt: Date.now(),
            updatedAt: Date.now(),
        });

        return { success: true };
    },
});

export const getAvailableCoaches = query({
    args: { sessionToken: v.string() },
    handler: async (ctx, args) => {
        await requireGymUser(ctx, args.sessionToken);

        const coaches = await ctx.db
            .query("coaches")
            .withIndex("by_active", (q) => q.eq("isActive", true))
            .collect();

        return coaches;
    },
});
