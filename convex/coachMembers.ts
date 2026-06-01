import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const requestConnection = mutation({
    args: {
        memberId: v.id("members"),
        goals: v.optional(v.array(v.string())),
        notes: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Not authenticated");

        const user = await ctx.db
            .query("users")
            .withIndex("by_email", (q) => q.eq("email", identity.email!))
            .first();

        if (!user || !user.coachId) throw new Error("Coach profile not found");

        const existing = await ctx.db
            .query("coachMemberConnections")
            .withIndex("by_coach", (q) => q.eq("coachId", user.coachId!))
            .filter((q) => q.eq(q.field("memberId"), args.memberId))
            .first();

        if (existing) throw new Error("Connection already exists");

        const connectionId = await ctx.db.insert("coachMemberConnections", {
            coachId: user.coachId,
            memberId: args.memberId,
            status: "pending",
            requestedBy: "coach",
            goals: args.goals,
            notes: args.notes,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        });

        return { success: true, connectionId };
    },
});

export const respondToConnection = mutation({
    args: {
        connectionId: v.id("coachMemberConnections"),
        accept: v.boolean(),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Not authenticated");

        const user = await ctx.db
            .query("users")
            .withIndex("by_email", (q) => q.eq("email", identity.email!))
            .first();

        if (!user || !user.memberId) throw new Error("Member profile not found");

        const connection = await ctx.db.get(args.connectionId);
        if (!connection || connection.memberId !== user.memberId) {
            throw new Error("Connection not found or unauthorized");
        }

        const now = Date.now();
        await ctx.db.patch(args.connectionId, {
            status: args.accept ? "active" : "ended",
            startDate: args.accept ? now : undefined,
            updatedAt: now,
        });

        return { success: true };
    },
});

export const getMyMembers = query({
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return [];

        const user = await ctx.db
            .query("users")
            .withIndex("by_email", (q) => q.eq("email", identity.email!))
            .first();

        if (!user || !user.coachId) return [];

        const connections = await ctx.db
            .query("coachMemberConnections")
            .withIndex("by_coach_status", (q) => 
                q.eq("coachId", user.coachId!).eq("status", "active")
            )
            .collect();

        const membersWithDetails = await Promise.all(
            connections.map(async (conn) => {
                const member = await ctx.db.get(conn.memberId);
                const activeMealPlan = await ctx.db
                    .query("mealPlans")
                    .withIndex("by_member_active", (q) => 
                        q.eq("memberId", conn.memberId).eq("isActive", true)
                    )
                    .first();
                const activeWorkoutPlan = await ctx.db
                    .query("workoutPlans")
                    .withIndex("by_member_active", (q) => 
                        q.eq("memberId", conn.memberId).eq("isActive", true)
                    )
                    .first();
                const upcomingClasses = await ctx.db
                    .query("classBookings")
                    .withIndex("by_member_status", (q) => 
                        q.eq("memberId", conn.memberId).eq("status", "booked")
                    )
                    .collect();

                return {
                    ...conn,
                    member,
                    hasActiveMealPlan: !!activeMealPlan,
                    hasActiveWorkoutPlan: !!activeWorkoutPlan,
                    upcomingClassesCount: upcomingClasses.length,
                };
            })
        );

        return membersWithDetails;
    },
});

export const getMyCoaches = query({
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return [];

        const user = await ctx.db
            .query("users")
            .withIndex("by_email", (q) => q.eq("email", identity.email!))
            .first();

        if (!user || !user.memberId) return [];

        const connections = await ctx.db
            .query("coachMemberConnections")
            .withIndex("by_member", (q) => q.eq("memberId", user.memberId!))
            .collect();

        const coachesWithDetails = await Promise.all(
            connections.map(async (conn) => {
                const coach = await ctx.db.get(conn.coachId);
                return { ...conn, coach };
            })
        );

        return coachesWithDetails;
    },
});

export const getPendingRequests = query({
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return [];

        const user = await ctx.db
            .query("users")
            .withIndex("by_email", (q) => q.eq("email", identity.email!))
            .first();

        if (!user || !user.memberId) return [];

        const pending = await ctx.db
            .query("coachMemberConnections")
            .withIndex("by_member_status", (q) => 
                q.eq("memberId", user.memberId!).eq("status", "pending")
            )
            .collect();

        const withCoachDetails = await Promise.all(
            pending.map(async (conn) => {
                const coach = await ctx.db.get(conn.coachId);
                return { ...conn, coach };
            })
        );

        return withCoachDetails;
    },
});

export const updateConnectionStatus = mutation({
    args: {
        connectionId: v.id("coachMemberConnections"),
        status: v.union(
            v.literal("active"),
            v.literal("paused"),
            v.literal("ended")
        ),
        notes: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Not authenticated");

        const user = await ctx.db
            .query("users")
            .withIndex("by_email", (q) => q.eq("email", identity.email!))
            .first();

        if (!user) throw new Error("User not found");

        const connection = await ctx.db.get(args.connectionId);
        if (!connection) throw new Error("Connection not found");

        const isCoach = user.coachId === connection.coachId;
        const isMember = user.memberId === connection.memberId;
        if (!isCoach && !isMember) throw new Error("Unauthorized");

        const updates: Record<string, unknown> = {
            status: args.status,
            updatedAt: Date.now(),
        };
        if (args.notes) updates.notes = args.notes;
        if (args.status === "ended") updates.endDate = Date.now();

        await ctx.db.patch(args.connectionId, updates);

        return { success: true };
    },
});

export const getAvailableCoachesForMember = query({
    handler: async (ctx) => {
        const coaches = await ctx.db
            .query("coaches")
            .withIndex("by_active", (q) => q.eq("isActive", true))
            .collect();

        return coaches;
    },
});

export const memberRequestConnection = mutation({
    args: {
        coachId: v.id("coaches"),
        goals: v.optional(v.array(v.string())),
        notes: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Not authenticated");

        const user = await ctx.db
            .query("users")
            .withIndex("by_email", (q) => q.eq("email", identity.email!))
            .first();

        if (!user || !user.memberId) throw new Error("Member profile not found");

        const existing = await ctx.db
            .query("coachMemberConnections")
            .withIndex("by_member", (q) => q.eq("memberId", user.memberId!))
            .filter((q) => q.eq(q.field("coachId"), args.coachId))
            .first();

        if (existing) throw new Error("Connection already exists");

        const connectionId = await ctx.db.insert("coachMemberConnections", {
            coachId: args.coachId,
            memberId: user.memberId,
            status: "pending",
            requestedBy: "member",
            goals: args.goals,
            notes: args.notes,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        });

        return { success: true, connectionId };
    },
});
