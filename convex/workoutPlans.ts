import { query, mutation } from "./_generated/server";
import { v, ConvexError } from "convex/values";
import { requireCoachUser, requireGymUser, requireMemberUser } from "./lib/session";

const EXERCISE_TYPE = v.union(
    v.literal("strength"),
    v.literal("cardio"),
    v.literal("flexibility"),
    v.literal("hiit"),
    v.literal("recovery"),
    v.literal("mixed")
);

export const createWorkoutPlan = mutation({
    args: {
        sessionToken: v.string(),
        memberId: v.id("members"),
        title: v.string(),
        description: v.optional(v.string()),
        startDate: v.number(),
        endDate: v.optional(v.number()),
        difficulty: v.union(
            v.literal("beginner"),
            v.literal("intermediate"),
            v.literal("advanced"),
            v.literal("expert")
        ),
        workouts: v.array(v.object({
            dayOfWeek: v.optional(v.number()),
            name: v.string(),
            type: EXERCISE_TYPE,
            duration: v.optional(v.number()),
            exercises: v.array(v.object({
                name: v.string(),
                sets: v.optional(v.number()),
                reps: v.optional(v.number()),
                weight: v.optional(v.number()),
                duration: v.optional(v.number()),
                rest: v.optional(v.number()),
                notes: v.optional(v.string()),
                videoUrl: v.optional(v.string()),
            })),
            notes: v.optional(v.string()),
        })),
        goals: v.optional(v.array(v.string())),
    },
    handler: async (ctx, args) => {
        const user = await requireCoachUser(ctx, args.sessionToken);

        const connection = await ctx.db
            .query("coachMemberConnections")
            .withIndex("by_member_status", (q) =>
                q.eq("memberId", args.memberId).eq("status", "active")
            )
            .filter((q) => q.eq(q.field("coachId"), user.coachId!))
            .first();

        if (!connection) throw new Error("No active link with this member");

        const existingActive = await ctx.db
            .query("workoutPlans")
            .withIndex("by_member_active", (q) =>
                q.eq("memberId", args.memberId).eq("isActive", true)
            )
            .first();

        if (existingActive) {
            await ctx.db.patch(existingActive._id, { isActive: false });
        }

        const workoutPlanId = await ctx.db.insert("workoutPlans", {
            coachId: user.coachId!,
            memberId: args.memberId,
            title: args.title,
            description: args.description,
            startDate: args.startDate,
            endDate: args.endDate,
            difficulty: args.difficulty,
            workouts: args.workouts,
            goals: args.goals,
            isActive: true,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        });

        return { success: true, workoutPlanId };
    },
});

export const updateWorkoutPlan = mutation({
    args: {
        sessionToken: v.string(),
        workoutPlanId: v.id("workoutPlans"),
        title: v.optional(v.string()),
        description: v.optional(v.string()),
        startDate: v.optional(v.number()),
        endDate: v.optional(v.number()),
        difficulty: v.optional(v.union(
            v.literal("beginner"),
            v.literal("intermediate"),
            v.literal("advanced"),
            v.literal("expert")
        )),
        workouts: v.optional(v.array(v.object({
            dayOfWeek: v.optional(v.number()),
            name: v.string(),
            type: EXERCISE_TYPE,
            duration: v.optional(v.number()),
            exercises: v.array(v.object({
                name: v.string(),
                sets: v.optional(v.number()),
                reps: v.optional(v.number()),
                weight: v.optional(v.number()),
                duration: v.optional(v.number()),
                rest: v.optional(v.number()),
                notes: v.optional(v.string()),
                videoUrl: v.optional(v.string()),
            })),
            notes: v.optional(v.string()),
        }))),
        goals: v.optional(v.array(v.string())),
        isActive: v.optional(v.boolean()),
    },
    handler: async (ctx, args) => {
        const user = await requireCoachUser(ctx, args.sessionToken);

        const workoutPlan = await ctx.db.get(args.workoutPlanId);
        if (!workoutPlan || workoutPlan.coachId !== user.coachId) {
            throw new Error("Workout plan not found");
        }

        const updates: Record<string, unknown> = { updatedAt: Date.now() };
        if (args.title) updates.title = args.title;
        if (args.description !== undefined) updates.description = args.description;
        if (args.startDate) updates.startDate = args.startDate;
        if (args.endDate !== undefined) updates.endDate = args.endDate;
        if (args.difficulty) updates.difficulty = args.difficulty;
        if (args.workouts) updates.workouts = args.workouts;
        if (args.goals !== undefined) updates.goals = args.goals;
        if (args.isActive !== undefined) updates.isActive = args.isActive;

        await ctx.db.patch(args.workoutPlanId, updates);

        return { success: true };
    },
});

export const getMemberWorkoutPlans = query({
    args: {
        sessionToken: v.string(),
        memberId: v.id("members"),
    },
    handler: async (ctx, args) => {
        const user = await requireCoachUser(ctx, args.sessionToken).catch(async () => {
            return requireGymUser(ctx, args.sessionToken);
        });

        if (user.role === "coach") {
            const connection = await ctx.db
                .query("coachMemberConnections")
                .withIndex("by_member_status", (q) =>
                    q.eq("memberId", args.memberId).eq("status", "active")
                )
                .filter((q) => q.eq(q.field("coachId"), user.coachId!))
                .first();
            if (!connection) return [];
        } else {
            const member = await ctx.db.get(args.memberId);
            if (!member || member.gymId !== user.gymId) {
                throw new ConvexError({ code: "FORBIDDEN", message: "Member is not in your gym." });
            }
        }

        const workoutPlans = await ctx.db
            .query("workoutPlans")
            .withIndex("by_member", (q) => q.eq("memberId", args.memberId))
            .collect();

        return workoutPlans;
    },
});

export const getMyWorkoutPlans = query({
    args: { sessionToken: v.string() },
    handler: async (ctx, args) => {
        const user = await requireMemberUser(ctx, args.sessionToken);

        const workoutPlans = await ctx.db
            .query("workoutPlans")
            .withIndex("by_member", (q) => q.eq("memberId", user.memberId!))
            .collect();

        const plansWithCoach = await Promise.all(
            workoutPlans.map(async (plan) => {
                const coach = await ctx.db.get(plan.coachId);
                return { ...plan, coach };
            })
        );

        return plansWithCoach;
    },
});

export const getActiveWorkoutPlan = query({
    args: {
        sessionToken: v.string(),
    },
    handler: async (ctx, args) => {
        const user = await requireMemberUser(ctx, args.sessionToken);

        const activePlan = await ctx.db
            .query("workoutPlans")
            .withIndex("by_member_active", (q) =>
                q.eq("memberId", user.memberId!).eq("isActive", true)
            )
            .first();

        if (!activePlan) return null;

        const coach = await ctx.db.get(activePlan.coachId);
        return { ...activePlan, coach };
    },
});

export const getCoachWorkoutPlans = query({
    args: { sessionToken: v.string() },
    handler: async (ctx, args) => {
        const user = await requireCoachUser(ctx, args.sessionToken);

        const workoutPlans = await ctx.db
            .query("workoutPlans")
            .withIndex("by_coach", (q) => q.eq("coachId", user.coachId!))
            .collect();

        const plansWithMember = await Promise.all(
            workoutPlans.map(async (plan) => {
                const member = await ctx.db.get(plan.memberId);
                return { ...plan, member };
            })
        );

        return plansWithMember;
    },
});

export const deleteWorkoutPlan = mutation({
    args: {
        sessionToken: v.string(),
        workoutPlanId: v.id("workoutPlans"),
    },
    handler: async (ctx, args) => {
        const user = await requireCoachUser(ctx, args.sessionToken);

        const workoutPlan = await ctx.db.get(args.workoutPlanId);
        if (!workoutPlan || workoutPlan.coachId !== user.coachId) {
            throw new Error("Workout plan not found");
        }

        await ctx.db.delete(args.workoutPlanId);

        return { success: true };
    },
});

export const duplicateWorkoutPlan = mutation({
    args: {
        sessionToken: v.string(),
        workoutPlanId: v.id("workoutPlans"),
        newStartDate: v.number(),
        newEndDate: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const user = await requireCoachUser(ctx, args.sessionToken);

        const originalPlan = await ctx.db.get(args.workoutPlanId);
        if (!originalPlan || originalPlan.coachId !== user.coachId) {
            throw new Error("Workout plan not found");
        }

        const newPlanId = await ctx.db.insert("workoutPlans", {
            coachId: originalPlan.coachId,
            memberId: originalPlan.memberId,
            title: `${originalPlan.title} (Copy)`,
            description: originalPlan.description,
            startDate: args.newStartDate,
            endDate: args.newEndDate,
            difficulty: originalPlan.difficulty,
            workouts: originalPlan.workouts,
            goals: originalPlan.goals,
            isActive: false,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        });

        return { success: true, newPlanId };
    },
});
