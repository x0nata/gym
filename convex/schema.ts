import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    email: v.string(),
    passwordHash: v.optional(v.string()),
    role: v.union(v.literal("gym"), v.literal("member"), v.literal("coach")),
    memberId: v.optional(v.id("members")),
    gymId: v.optional(v.id("gyms")),
    coachId: v.optional(v.id("coaches")),
    createdAt: v.number(),
  })
    .index("by_email", ["email"])
    .index("by_member", ["memberId"])
    .index("by_gym", ["gymId"])
    .index("by_coach", ["coachId"]),

  authSessions: defineTable({
    userId: v.id("users"),
    tokenHash: v.string(),
    createdAt: v.number(),
    expiresAt: v.number(),
    revokedAt: v.optional(v.number()),
    userAgent: v.optional(v.string()),
  })
    .index("by_user", ["userId"])
    .index("by_tokenHash", ["tokenHash"])
    .index("by_expiresAt", ["expiresAt"]),

  gyms: defineTable({
    name: v.string(),
    email: v.string(),
    phone: v.string(),
    address: v.string(),
    city: v.string(),
    description: v.optional(v.string()),
    logoUrl: v.optional(v.string()),
    isActive: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_email", ["email"])
    .index("by_active", ["isActive"])
    .index("by_city", ["city"]),

  coaches: defineTable({
    firstName: v.string(),
    lastName: v.string(),
    email: v.string(),
    phone: v.string(),
    bio: v.optional(v.string()),
    specializations: v.optional(v.array(v.string())),
    photoUrl: v.optional(v.string()),
    hourlyRate: v.optional(v.number()),
    invitationCode: v.optional(v.string()),
    gymId: v.optional(v.id("gyms")),
    isActive: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_email", ["email"])
    .index("by_active", ["isActive"])
    .index("by_invitationCode", ["invitationCode"])
    .index("by_gymId", ["gymId"]),

  coachGymConnections: defineTable({
    coachId: v.id("coaches"),
    gymId: v.id("gyms"),
    status: v.union(
      v.literal("pending"),
      v.literal("accepted"),
      v.literal("rejected")
    ),
    requestedBy: v.union(v.literal("coach"), v.literal("gym")),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_coach", ["coachId"])
    .index("by_gym", ["gymId"])
    .index("by_status", ["status"])
    .index("by_coach_status", ["coachId", "status"])
    .index("by_gym_status", ["gymId", "status"]),

  coachMemberConnections: defineTable({
    coachId: v.id("coaches"),
    memberId: v.id("members"),
    status: v.union(
      v.literal("pending"),
      v.literal("active"),
      v.literal("paused"),
      v.literal("ended")
    ),
    requestedBy: v.union(v.literal("coach"), v.literal("member")),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    goals: v.optional(v.array(v.string())),
    notes: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_coach", ["coachId"])
    .index("by_member", ["memberId"])
    .index("by_status", ["status"])
    .index("by_coach_status", ["coachId", "status"])
    .index("by_member_status", ["memberId", "status"]),

  classes: defineTable({
    coachId: v.id("coaches"),
    gymId: v.optional(v.id("gyms")),
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
    currentParticipants: v.number(),
    price: v.optional(v.number()),
    status: v.union(
      v.literal("scheduled"),
      v.literal("in_progress"),
      v.literal("completed"),
      v.literal("cancelled"),
      v.literal("rescheduled")
    ),
    recurrence: v.optional(v.object({
      frequency: v.union(v.literal("daily"), v.literal("weekly"), v.literal("monthly")),
      endDate: v.optional(v.number()),
    })),
    location: v.optional(v.string()),
    isOnline: v.boolean(),
    meetingLink: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_coach", ["coachId"])
    .index("by_gym", ["gymId"])
    .index("by_status", ["status"])
    .index("by_scheduledAt", ["scheduledAt"])
    .index("by_type", ["type"]),

  classBookings: defineTable({
    classId: v.id("classes"),
    memberId: v.id("members"),
    status: v.union(
      v.literal("booked"),
      v.literal("confirmed"),
      v.literal("cancelled"),
      v.literal("completed"),
      v.literal("no_show")
    ),
    bookedAt: v.number(),
    cancelledAt: v.optional(v.number()),
    cancellationReason: v.optional(v.string()),
    notes: v.optional(v.string()),
  })
    .index("by_class", ["classId"])
    .index("by_member", ["memberId"])
    .index("by_status", ["status"])
    .index("by_class_status", ["classId", "status"])
    .index("by_member_status", ["memberId", "status"]),

  mealPlans: defineTable({
    coachId: v.id("coaches"),
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
      mealType: v.union(
        v.literal("breakfast"),
        v.literal("morning_snack"),
        v.literal("lunch"),
        v.literal("afternoon_snack"),
        v.literal("dinner"),
        v.literal("evening_snack")
      ),
      name: v.string(),
      description: v.optional(v.string()),
      calories: v.optional(v.number()),
      protein: v.optional(v.number()),
      carbs: v.optional(v.number()),
      fat: v.optional(v.number()),
      ingredients: v.optional(v.array(v.string())),
      instructions: v.optional(v.string()),
    })),
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_coach", ["coachId"])
    .index("by_member", ["memberId"])
    .index("by_active", ["isActive"])
    .index("by_member_active", ["memberId", "isActive"]),

  workoutPlans: defineTable({
    coachId: v.id("coaches"),
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
      type: v.union(
        v.literal("strength"),
        v.literal("cardio"),
        v.literal("flexibility"),
        v.literal("hiit"),
        v.literal("recovery"),
        v.literal("mixed")
      ),
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
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_coach", ["coachId"])
    .index("by_member", ["memberId"])
    .index("by_active", ["isActive"])
    .index("by_member_active", ["memberId", "isActive"]),

  progressLogs: defineTable({
    memberId: v.id("members"),
    coachId: v.optional(v.id("coaches")),
    date: v.number(),
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
    createdAt: v.number(),
  })
    .index("by_member", ["memberId"])
    .index("by_coach", ["coachId"])
    .index("by_date", ["date"])
    .index("by_type", ["type"])
    .index("by_member_date", ["memberId", "date"]),

  messages: defineTable({
    senderId: v.id("users"),
    receiverId: v.id("users"),
    conversationId: v.string(),
    content: v.string(),
    attachments: v.optional(v.array(v.object({
      type: v.union(v.literal("image"), v.literal("video"), v.literal("document")),
      url: v.string(),
      name: v.string(),
    }))),
    isRead: v.boolean(),
    readAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_sender", ["senderId"])
    .index("by_receiver", ["receiverId"])
    .index("by_conversation", ["conversationId"])
    .index("by_receiver_read", ["receiverId", "isRead"]),

  members: defineTable({
    firstName: v.string(),
    lastName: v.string(),
    email: v.string(),
    phone: v.string(),
    qrCode: v.string(),
    invitationCode: v.optional(v.string()),
    gymId: v.optional(v.id("gyms")),
    photoUrl: v.optional(v.string()),
    joinedAt: v.number(),
    isActive: v.boolean(),
  })
    .index("by_qrCode", ["qrCode"])
    .index("by_email", ["email"])
    .index("by_active", ["isActive"])
    .index("by_invitationCode", ["invitationCode"])
    .index("by_gymId", ["gymId"]),

  memberships: defineTable({
    memberId: v.id("members"),
    planName: v.string(), // e.g. "Monthly", "Quarterly", "Annual"
    startDate: v.number(),
    endDate: v.number(),
    amountPaid: v.number(),
    status: v.union(
      v.literal("active"),
      v.literal("expired"),
      v.literal("cancelled")
    ),
    notifiedExpiring: v.boolean(), // whether we've sent expiry warning
    notifiedExpired: v.boolean(), // whether we've sent expired notice
  })
    .index("by_member", ["memberId"])
    .index("by_status", ["status"])
    .index("by_endDate", ["endDate"])
    .index("by_member_status", ["memberId", "status"]),

  checkIns: defineTable({
    memberId: v.id("members"),
    timestamp: v.number(),
    date: v.string(), // "YYYY-MM-DD" for easy daily grouping
  })
    .index("by_member", ["memberId"])
    .index("by_date", ["date"])
    .index("by_member_date", ["memberId", "date"]),

  invitations: defineTable({
    code: v.string(),
    type: v.union(v.literal("member"), v.literal("coach")),
    gymId: v.id("gyms"),
    memberId: v.optional(v.id("members")),
    coachId: v.optional(v.id("coaches")),
    email: v.optional(v.string()),
    firstName: v.string(),
    lastName: v.string(),
    phone: v.optional(v.string()),
    status: v.union(
      v.literal("pending"),
      v.literal("claimed"),
      v.literal("expired"),
      v.literal("revoked")
    ),
    expiresAt: v.number(),
    claimedAt: v.optional(v.number()),
    claimedByUserId: v.optional(v.id("users")),
    createdByUserId: v.optional(v.id("users")),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_code", ["code"])
    .index("by_gym", ["gymId"])
    .index("by_status", ["status"])
    .index("by_type_status", ["type", "status"]),

  notifications: defineTable({
    memberId: v.id("members"),
    type: v.union(
      v.literal("membership_expiring"),
      v.literal("membership_expired"),
      v.literal("check_in"),
      v.literal("welcome")
    ),
    title: v.string(),
    message: v.string(),
    isRead: v.boolean(),
    createdAt: v.number(),
    audience: v.union(v.literal("gym"), v.literal("member"), v.literal("coach")),
  })
    .index("by_audience", ["audience"])
    .index("by_member", ["memberId"])
    .index("by_audience_read", ["audience", "isRead"]),
});
