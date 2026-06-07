import { query, mutation } from "./_generated/server";
import { v, ConvexError } from "convex/values";
import { requireCoachUser, requireGymUser, requireMemberUser } from "./lib/session";

const MEAL_TYPES = v.union(
    v.literal("breakfast"),
    v.literal("morning_snack"),
    v.literal("lunch"),
    v.literal("afternoon_snack"),
    v.literal("dinner"),
    v.literal("evening_snack")
);

export const createMealPlan = mutation({
    args: {
        sessionToken: v.string(),
        memberId: v.id("members"),
        title: v.string(),
        description: v.optional(v.string()),
        startDate: v.number(),
        endDate: v.number(),
        targetCalories: v.optional(v.number()),
        targetProtein: v.optional(v.number()),
        targetCarbs: v.optional(v.number()),
        targetFat: v.optional(v.number()),
        meals: v.array(v.object({
            day: v.number(),
            mealType: MEAL_TYPES,
            name: v.string(),
            description: v.optional(v.string()),
            calories: v.optional(v.number()),
            protein: v.optional(v.number()),
            carbs: v.optional(v.number()),
            fat: v.optional(v.number()),
            ingredients: v.optional(v.array(v.string())),
            instructions: v.optional(v.string()),
        })),
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
            .query("mealPlans")
            .withIndex("by_member_active", (q) =>
                q.eq("memberId", args.memberId).eq("isActive", true)
            )
            .first();

        if (existingActive) {
            await ctx.db.patch(existingActive._id, { isActive: false });
        }

        const mealPlanId = await ctx.db.insert("mealPlans", {
            coachId: user.coachId!,
            memberId: args.memberId,
            title: args.title,
            description: args.description,
            startDate: args.startDate,
            endDate: args.endDate,
            targetCalories: args.targetCalories,
            targetProtein: args.targetProtein,
            targetCarbs: args.targetCarbs,
            targetFat: args.targetFat,
            meals: args.meals,
            isActive: true,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        });

        return { success: true, mealPlanId };
    },
});

export const updateMealPlan = mutation({
    args: {
        sessionToken: v.string(),
        mealPlanId: v.id("mealPlans"),
        title: v.optional(v.string()),
        description: v.optional(v.string()),
        startDate: v.optional(v.number()),
        endDate: v.optional(v.number()),
        targetCalories: v.optional(v.number()),
        targetProtein: v.optional(v.number()),
        targetCarbs: v.optional(v.number()),
        targetFat: v.optional(v.number()),
        meals: v.optional(v.array(v.object({
            day: v.number(),
            mealType: MEAL_TYPES,
            name: v.string(),
            description: v.optional(v.string()),
            calories: v.optional(v.number()),
            protein: v.optional(v.number()),
            carbs: v.optional(v.number()),
            fat: v.optional(v.number()),
            ingredients: v.optional(v.array(v.string())),
            instructions: v.optional(v.string()),
        }))),
        isActive: v.optional(v.boolean()),
    },
    handler: async (ctx, args) => {
        const user = await requireCoachUser(ctx, args.sessionToken);

        const mealPlan = await ctx.db.get(args.mealPlanId);
        if (!mealPlan || mealPlan.coachId !== user.coachId) {
            throw new Error("Meal plan not found");
        }

        const updates: Record<string, unknown> = { updatedAt: Date.now() };
        if (args.title) updates.title = args.title;
        if (args.description !== undefined) updates.description = args.description;
        if (args.startDate) updates.startDate = args.startDate;
        if (args.endDate) updates.endDate = args.endDate;
        if (args.targetCalories !== undefined) updates.targetCalories = args.targetCalories;
        if (args.targetProtein !== undefined) updates.targetProtein = args.targetProtein;
        if (args.targetCarbs !== undefined) updates.targetCarbs = args.targetCarbs;
        if (args.targetFat !== undefined) updates.targetFat = args.targetFat;
        if (args.meals) updates.meals = args.meals;
        if (args.isActive !== undefined) updates.isActive = args.isActive;

        await ctx.db.patch(args.mealPlanId, updates);

        return { success: true };
    },
});

export const getMemberMealPlans = query({
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

        const mealPlans = await ctx.db
            .query("mealPlans")
            .withIndex("by_member", (q) => q.eq("memberId", args.memberId))
            .collect();

        return mealPlans;
    },
});

export const getMyMealPlans = query({
    args: { sessionToken: v.string() },
    handler: async (ctx, args) => {
        const user = await requireMemberUser(ctx, args.sessionToken);

        const mealPlans = await ctx.db
            .query("mealPlans")
            .withIndex("by_member", (q) => q.eq("memberId", user.memberId!))
            .collect();

        const plansWithCoach = await Promise.all(
            mealPlans.map(async (plan) => {
                const coach = await ctx.db.get(plan.coachId);
                return { ...plan, coach };
            })
        );

        return plansWithCoach;
    },
});

export const getActiveMealPlan = query({
    args: {
        sessionToken: v.string(),
    },
    handler: async (ctx, args) => {
        const user = await requireMemberUser(ctx, args.sessionToken);

        const activePlan = await ctx.db
            .query("mealPlans")
            .withIndex("by_member_active", (q) =>
                q.eq("memberId", user.memberId!).eq("isActive", true)
            )
            .first();

        if (!activePlan) return null;

        const coach = await ctx.db.get(activePlan.coachId);
        return { ...activePlan, coach };
    },
});

export const getCoachMealPlans = query({
    args: { sessionToken: v.string() },
    handler: async (ctx, args) => {
        const user = await requireCoachUser(ctx, args.sessionToken);

        const mealPlans = await ctx.db
            .query("mealPlans")
            .withIndex("by_coach", (q) => q.eq("coachId", user.coachId!))
            .collect();

        const plansWithMember = await Promise.all(
            mealPlans.map(async (plan) => {
                const member = await ctx.db.get(plan.memberId);
                return { ...plan, member };
            })
        );

        return plansWithMember;
    },
});

export const deleteMealPlan = mutation({
    args: {
        sessionToken: v.string(),
        mealPlanId: v.id("mealPlans"),
    },
    handler: async (ctx, args) => {
        const user = await requireCoachUser(ctx, args.sessionToken);

        const mealPlan = await ctx.db.get(args.mealPlanId);
        if (!mealPlan || mealPlan.coachId !== user.coachId) {
            throw new Error("Meal plan not found");
        }

        await ctx.db.delete(args.mealPlanId);

        return { success: true };
    },
});

export const duplicateMealPlan = mutation({
    args: {
        sessionToken: v.string(),
        mealPlanId: v.id("mealPlans"),
        newStartDate: v.number(),
        newEndDate: v.number(),
    },
    handler: async (ctx, args) => {
        const user = await requireCoachUser(ctx, args.sessionToken);

        const originalPlan = await ctx.db.get(args.mealPlanId);
        if (!originalPlan || originalPlan.coachId !== user.coachId) {
            throw new Error("Meal plan not found");
        }

        const newPlanId = await ctx.db.insert("mealPlans", {
            coachId: originalPlan.coachId,
            memberId: originalPlan.memberId,
            title: `${originalPlan.title} (Copy)`,
            description: originalPlan.description,
            startDate: args.newStartDate,
            endDate: args.newEndDate,
            targetCalories: originalPlan.targetCalories,
            targetProtein: originalPlan.targetProtein,
            targetCarbs: originalPlan.targetCarbs,
            targetFat: originalPlan.targetFat,
            meals: originalPlan.meals,
            isActive: false,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        });

        return { success: true, newPlanId };
    },
});
