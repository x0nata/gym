import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireMemberUser, requireGymUser } from "./lib/session";

export const logProgress = mutation({
    args: {
        sessionToken: v.string(),
        type: v.union(
            v.literal("weight"),
            v.literal("measurements"),
            v.literal("workout"),
            v.literal("meal"),
            v.literal("photo"),
            v.literal("note")
        ),
        data: v.object({
            weight: v.optional(v.number()),
            bodyFat: v.optional(v.number()),
            chest: v.optional(v.number()),
            waist: v.optional(v.number()),
            hips: v.optional(v.number()),
            biceps: v.optional(v.number()),
            thighs: v.optional(v.number()),
            caloriesConsumed: v.optional(v.number()),
            caloriesBurned: v.optional(v.number()),
            waterIntake: v.optional(v.number()),
            sleepHours: v.optional(v.number()),
            energyLevel: v.optional(v.number()),
            mood: v.optional(v.string()),
            notes: v.optional(v.string()),
            photoUrl: v.optional(v.string()),
            workoutCompleted: v.optional(v.boolean()),
            workoutId: v.optional(v.id("workoutPlans")),
        }),
    },
    handler: async (ctx, args) => {
        const user = await requireMemberUser(ctx, args.sessionToken);

        const logId = await ctx.db.insert("progressLogs", {
            memberId: user.memberId!,
            coachId: undefined,
            date: Date.now(),
            type: args.type,
            data: args.data,
            createdAt: Date.now(),
        });

        return { success: true, logId };
    },
});

export const getMemberProgress = query({
    args: {
        sessionToken: v.string(),
        memberId: v.id("members"),
        type: v.optional(v.union(
            v.literal("weight"),
            v.literal("measurements"),
            v.literal("workout"),
            v.literal("meal"),
            v.literal("photo"),
            v.literal("note")
        )),
        startDate: v.optional(v.number()),
        endDate: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const memberUser = await requireMemberUser(ctx, args.sessionToken).catch(() => null);

        if (memberUser && memberUser.memberId !== args.memberId) {
            throw new Error("Access denied.");
        }

        if (!memberUser) {
            await requireGymUser(ctx, args.sessionToken);
        }

        let logs = await ctx.db
            .query("progressLogs")
            .withIndex("by_member", (q) => q.eq("memberId", args.memberId))
            .collect();

        if (args.type) {
            logs = logs.filter(l => l.type === args.type);
        }
        if (args.startDate) {
            logs = logs.filter(l => l.date >= args.startDate!);
        }
        if (args.endDate) {
            logs = logs.filter(l => l.date <= args.endDate!);
        }

        return logs.sort((a, b) => b.date - a.date);
    },
});

export const getMyProgress = query({
    args: {
        sessionToken: v.string(),
        type: v.optional(v.union(
            v.literal("weight"),
            v.literal("measurements"),
            v.literal("workout"),
            v.literal("meal"),
            v.literal("photo"),
            v.literal("note")
        )),
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const user = await requireMemberUser(ctx, args.sessionToken);

        let logs = await ctx.db
            .query("progressLogs")
            .withIndex("by_member", (q) => q.eq("memberId", user.memberId!))
            .collect();

        if (args.type) {
            logs = logs.filter(l => l.type === args.type);
        }

        logs = logs.sort((a, b) => b.date - a.date);

        if (args.limit) {
            logs = logs.slice(0, args.limit);
        }

        return logs;
    },
});

export const getProgressStats = query({
    args: { sessionToken: v.string() },
    handler: async (ctx, args) => {
        const user = await requireMemberUser(ctx, args.sessionToken);

        const logs = await ctx.db
            .query("progressLogs")
            .withIndex("by_member", (q) => q.eq("memberId", user.memberId!))
            .collect();

        const weightLogs = logs
            .filter(l => l.type === "weight" && l.data.weight)
            .sort((a, b) => a.date - b.date);

        const measurementLogs = logs
            .filter(l => l.type === "measurements")
            .sort((a, b) => b.date - a.date);

        const workoutLogs = logs.filter(l => l.type === "workout");
        const completedWorkouts = workoutLogs.filter(l => l.data.workoutCompleted).length;

        return {
            totalLogs: logs.length,
            weightHistory: weightLogs.slice(-10).map(l => ({
                date: l.date,
                weight: l.data.weight,
                bodyFat: l.data.bodyFat,
            })),
            latestWeight: weightLogs.length > 0 ? weightLogs[weightLogs.length - 1].data.weight : null,
            weightChange: weightLogs.length > 1
                ? weightLogs[weightLogs.length - 1].data.weight! - weightLogs[0].data.weight!
                : 0,
            latestMeasurements: measurementLogs.length > 0 ? measurementLogs[0].data : null,
            totalWorkouts: workoutLogs.length,
            completedWorkouts,
            completionRate: workoutLogs.length > 0
                ? Math.round((completedWorkouts / workoutLogs.length) * 100)
                : 0,
        };
    },
});

export const deleteProgressLog = mutation({
    args: {
        sessionToken: v.string(),
        logId: v.id("progressLogs"),
    },
    handler: async (ctx, args) => {
        const user = await requireMemberUser(ctx, args.sessionToken);

        const log = await ctx.db.get(args.logId);
        if (!log || log.memberId !== user.memberId) {
            throw new Error("Log not found or unauthorized");
        }

        await ctx.db.delete(args.logId);

        return { success: true };
    },
});
