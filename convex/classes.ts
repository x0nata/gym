import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireCoachUser, requireMemberUser } from "./lib/session";

export const createClass = mutation({
    args: {
        sessionToken: v.string(),
        title: v.string(),
        description: v.optional(v.string()),
        type: v.union(
            v.literal("personal_training"),
            v.literal("group_fitness"),
            v.literal("yoga"),
            v.literal("crossfit"),
            v.literal("pilates"),
            v.literal("strength"),
            v.literal("cardio"),
            v.literal("other")
        ),
        scheduledAt: v.number(),
        durationMinutes: v.number(),
        maxParticipants: v.optional(v.number()),
        price: v.optional(v.number()),
        gymId: v.optional(v.id("gyms")),
        location: v.optional(v.string()),
        isOnline: v.boolean(),
        meetingLink: v.optional(v.string()),
        recurrence: v.optional(v.object({
            frequency: v.union(v.literal("daily"), v.literal("weekly"), v.literal("monthly")),
            endDate: v.optional(v.number()),
        })),
    },
    handler: async (ctx, args) => {
        const user = await requireCoachUser(ctx, args.sessionToken);

        const classId = await ctx.db.insert("classes", {
            coachId: user.coachId!,
            gymId: args.gymId,
            title: args.title,
            description: args.description,
            type: args.type,
            scheduledAt: args.scheduledAt,
            durationMinutes: args.durationMinutes,
            maxParticipants: args.maxParticipants,
            currentParticipants: 0,
            price: args.price,
            status: "scheduled",
            recurrence: args.recurrence,
            location: args.location,
            isOnline: args.isOnline,
            meetingLink: args.meetingLink,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        });

        return { success: true, classId };
    },
});

export const updateClass = mutation({
    args: {
        sessionToken: v.string(),
        classId: v.id("classes"),
        title: v.optional(v.string()),
        description: v.optional(v.string()),
        scheduledAt: v.optional(v.number()),
        durationMinutes: v.optional(v.number()),
        maxParticipants: v.optional(v.number()),
        price: v.optional(v.number()),
        location: v.optional(v.string()),
        meetingLink: v.optional(v.string()),
        status: v.optional(v.union(
            v.literal("scheduled"),
            v.literal("in_progress"),
            v.literal("completed"),
            v.literal("cancelled"),
            v.literal("rescheduled")
        )),
    },
    handler: async (ctx, args) => {
        const user = await requireCoachUser(ctx, args.sessionToken);

        const existingClass = await ctx.db.get(args.classId);
        if (!existingClass || existingClass.coachId !== user.coachId) {
            throw new Error("Class not found");
        }

        const updates: Record<string, unknown> = { updatedAt: Date.now() };
        if (args.title) updates.title = args.title;
        if (args.description !== undefined) updates.description = args.description;
        if (args.scheduledAt) updates.scheduledAt = args.scheduledAt;
        if (args.durationMinutes) updates.durationMinutes = args.durationMinutes;
        if (args.maxParticipants !== undefined) updates.maxParticipants = args.maxParticipants;
        if (args.price !== undefined) updates.price = args.price;
        if (args.location !== undefined) updates.location = args.location;
        if (args.meetingLink !== undefined) updates.meetingLink = args.meetingLink;
        if (args.status) updates.status = args.status;

        await ctx.db.patch(args.classId, updates);

        return { success: true };
    },
});

export const rescheduleClass = mutation({
    args: {
        sessionToken: v.string(),
        classId: v.id("classes"),
        newScheduledAt: v.number(),
        notifyParticipants: v.boolean(),
        reason: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const user = await requireCoachUser(ctx, args.sessionToken);

        const existingClass = await ctx.db.get(args.classId);
        if (!existingClass || existingClass.coachId !== user.coachId) {
            throw new Error("Class not found");
        }

        await ctx.db.patch(args.classId, {
            scheduledAt: args.newScheduledAt,
            status: "rescheduled",
            updatedAt: Date.now(),
        });

        return { success: true };
    },
});

export const cancelClass = mutation({
    args: {
        sessionToken: v.string(),
        classId: v.id("classes"),
        reason: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const user = await requireCoachUser(ctx, args.sessionToken);

        const existingClass = await ctx.db.get(args.classId);
        if (!existingClass || existingClass.coachId !== user.coachId) {
            throw new Error("Class not found");
        }

        await ctx.db.patch(args.classId, {
            status: "cancelled",
            updatedAt: Date.now(),
        });

        const bookings = await ctx.db
            .query("classBookings")
            .withIndex("by_class_status", (q) =>
                q.eq("classId", args.classId).eq("status", "booked")
            )
            .collect();

        for (const booking of bookings) {
            await ctx.db.patch(booking._id, {
                status: "cancelled",
                cancelledAt: Date.now(),
                cancellationReason: args.reason || "Class cancelled by coach",
            });
        }

        return { success: true, cancelledBookings: bookings.length };
    },
});

export const getCoachClasses = query({
    args: {
        sessionToken: v.string(),
        status: v.optional(v.union(
            v.literal("scheduled"),
            v.literal("in_progress"),
            v.literal("completed"),
            v.literal("cancelled"),
            v.literal("rescheduled")
        )),
        startDate: v.optional(v.number()),
        endDate: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const user = await requireCoachUser(ctx, args.sessionToken);

        let classes = await ctx.db
            .query("classes")
            .withIndex("by_coach", (q) => q.eq("coachId", user.coachId!))
            .collect();

        if (args.status) {
            classes = classes.filter(c => c.status === args.status);
        }
        if (args.startDate) {
            classes = classes.filter(c => c.scheduledAt >= args.startDate!);
        }
        if (args.endDate) {
            classes = classes.filter(c => c.scheduledAt <= args.endDate!);
        }

        const classesWithDetails = await Promise.all(
            classes.map(async (c) => {
                const bookings = await ctx.db
                    .query("classBookings")
                    .withIndex("by_class", (q) => q.eq("classId", c._id))
                    .collect();

                const participants = await Promise.all(
                    bookings.filter(b => b.status === "booked" || b.status === "confirmed")
                        .map(async (b) => {
                            const member = await ctx.db.get(b.memberId);
                            return { ...b, member };
                        })
                );

                return { ...c, participants };
            })
        );

        return classesWithDetails;
    },
});

export const bookClass = mutation({
    args: {
        sessionToken: v.string(),
        classId: v.id("classes"),
        notes: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const user = await requireMemberUser(ctx, args.sessionToken);

        const classItem = await ctx.db.get(args.classId);
        if (!classItem) throw new Error("Class not found");

        if (classItem.status !== "scheduled") {
            throw new Error("This class is not open for booking");
        }

        if (classItem.maxParticipants && classItem.currentParticipants >= classItem.maxParticipants) {
            throw new Error("This class is full");
        }

        const existingBooking = await ctx.db
            .query("classBookings")
            .withIndex("by_class_status", (q) =>
                q.eq("classId", args.classId).eq("status", "booked")
            )
            .filter((q) => q.eq(q.field("memberId"), user.memberId!))
            .first();

        if (existingBooking) throw new Error("You already booked this class");

        const bookingId = await ctx.db.insert("classBookings", {
            classId: args.classId,
            memberId: user.memberId!,
            status: "booked",
            bookedAt: Date.now(),
            notes: args.notes,
        });

        await ctx.db.patch(args.classId, {
            currentParticipants: classItem.currentParticipants + 1,
            updatedAt: Date.now(),
        });

        return { success: true, bookingId };
    },
});

export const cancelBooking = mutation({
    args: {
        sessionToken: v.string(),
        bookingId: v.id("classBookings"),
        reason: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const user = await requireMemberUser(ctx, args.sessionToken);

        const booking = await ctx.db.get(args.bookingId);
        if (!booking || booking.memberId !== user.memberId) {
            throw new Error("Booking not found");
        }

        await ctx.db.patch(args.bookingId, {
            status: "cancelled",
            cancelledAt: Date.now(),
            cancellationReason: args.reason,
        });

        const classItem = await ctx.db.get(booking.classId);
        if (classItem && classItem.currentParticipants > 0) {
            await ctx.db.patch(booking.classId, {
                currentParticipants: classItem.currentParticipants - 1,
                updatedAt: Date.now(),
            });
        }

        return { success: true };
    },
});

export const getMemberBookings = query({
    args: {
        sessionToken: v.string(),
        status: v.optional(v.union(
            v.literal("booked"),
            v.literal("confirmed"),
            v.literal("cancelled"),
            v.literal("completed"),
            v.literal("no_show")
        )),
    },
    handler: async (ctx, args) => {
        const user = await requireMemberUser(ctx, args.sessionToken);

        let bookings = await ctx.db
            .query("classBookings")
            .withIndex("by_member", (q) => q.eq("memberId", user.memberId!))
            .collect();

        if (args.status) {
            bookings = bookings.filter(b => b.status === args.status);
        }

        const bookingsWithDetails = await Promise.all(
            bookings.map(async (b) => {
                const classItem = await ctx.db.get(b.classId);
                const coach = classItem ? await ctx.db.get(classItem.coachId) : null;
                return { ...b, class: classItem, coach };
            })
        );

        return bookingsWithDetails;
    },
});

export const getAvailableClasses = query({
    args: {
        sessionToken: v.string(),
        type: v.optional(v.union(
            v.literal("personal_training"),
            v.literal("group_fitness"),
            v.literal("yoga"),
            v.literal("crossfit"),
            v.literal("pilates"),
            v.literal("strength"),
            v.literal("cardio"),
            v.literal("other")
        )),
        startDate: v.optional(v.number()),
        endDate: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        await requireMemberUser(ctx, args.sessionToken);

        let classes = await ctx.db
            .query("classes")
            .withIndex("by_status", (q) => q.eq("status", "scheduled"))
            .collect();

        const now = Date.now();
        classes = classes.filter(c => c.scheduledAt > now);

        if (args.type) {
            classes = classes.filter(c => c.type === args.type);
        }
        if (args.startDate) {
            classes = classes.filter(c => c.scheduledAt >= args.startDate!);
        }
        if (args.endDate) {
            classes = classes.filter(c => c.scheduledAt <= args.endDate!);
        }

        const classesWithDetails = await Promise.all(
            classes.map(async (c) => {
                const coach = await ctx.db.get(c.coachId);
                const gym = c.gymId ? await ctx.db.get(c.gymId) : null;
                return { ...c, coach, gym };
            })
        );

        return classesWithDetails;
    },
});

export const confirmBooking = mutation({
    args: {
        sessionToken: v.string(),
        bookingId: v.id("classBookings"),
    },
    handler: async (ctx, args) => {
        const user = await requireCoachUser(ctx, args.sessionToken);

        const booking = await ctx.db.get(args.bookingId);
        if (!booking) throw new Error("Booking not found");

        const classItem = await ctx.db.get(booking.classId);
        if (!classItem || classItem.coachId !== user.coachId) {
            throw new Error("Not allowed");
        }

        await ctx.db.patch(args.bookingId, { status: "confirmed" });

        return { success: true };
    },
});

export const markAttendance = mutation({
    args: {
        sessionToken: v.string(),
        bookingId: v.id("classBookings"),
        attended: v.boolean(),
    },
    handler: async (ctx, args) => {
        const user = await requireCoachUser(ctx, args.sessionToken);

        const booking = await ctx.db.get(args.bookingId);
        if (!booking) throw new Error("Booking not found");

        const classItem = await ctx.db.get(booking.classId);
        if (!classItem || classItem.coachId !== user.coachId) {
            throw new Error("Not allowed");
        }

        await ctx.db.patch(args.bookingId, {
            status: args.attended ? "completed" : "no_show",
        });

        return { success: true };
    },
});
