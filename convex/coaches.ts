import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireCoachUser } from "./lib/session";

export const getAvailableGyms = query({
    args: { sessionToken: v.string(), coachId: v.optional(v.id("coaches")) },
    handler: async (ctx, args) => {
        await requireCoachUser(ctx, args.sessionToken);

        const gyms = await ctx.db
            .query("gyms")
            .withIndex("by_active", (q) => q.eq("isActive", true))
            .collect();

        if (!args.coachId) {
            return gyms.map(gym => ({ ...gym, connectionStatus: null }));
        }

        const connections = await ctx.db
            .query("coachGymConnections")
            .withIndex("by_coach", (q) => q.eq("coachId", args.coachId!))
            .collect();

        const connectionMap = new Map(
            connections.map(c => [c.gymId, c])
        );

        return gyms.map(gym => {
            const connection = connectionMap.get(gym._id);
            return {
                ...gym,
                connectionStatus: connection?.status || null,
                connectionId: connection?._id,
            };
        });
    },
});

export const requestConnection = mutation({
    args: { sessionToken: v.string(), gymId: v.id("gyms") },
    handler: async (ctx, args) => {
        const user = await requireCoachUser(ctx, args.sessionToken);

        const existing = await ctx.db
            .query("coachGymConnections")
            .withIndex("by_coach_status", (q) =>
                q.eq("coachId", user.coachId!).eq("status", "pending")
            )
            .filter((q) => q.eq(q.field("gymId"), args.gymId))
            .first();

        if (existing) {
            throw new Error("Request already exists");
        }

        await ctx.db.insert("coachGymConnections", {
            coachId: user.coachId!,
            gymId: args.gymId,
            status: "pending",
            requestedBy: "coach",
            createdAt: Date.now(),
            updatedAt: Date.now(),
        });

        return { success: true };
    },
});

export const getMyConnections = query({
    args: { sessionToken: v.string() },
    handler: async (ctx, args) => {
        const user = await requireCoachUser(ctx, args.sessionToken);

        const connections = await ctx.db
            .query("coachGymConnections")
            .withIndex("by_coach", (q) => q.eq("coachId", user.coachId!))
            .collect();

        return connections;
    },
});
