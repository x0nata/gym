import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireGymUser } from "./lib/session";

export const clearAllData = mutation({
  args: { sessionToken: v.string() },
  handler: async (ctx, _args) => {
    await requireGymUser(ctx, _args.sessionToken);

    const tables = [
      "users", "gyms", "members", "checkIns",
      "invitations", "notifications", "workoutPlans",
      "mealPlans", "progressLogs", "classes", "coaches",
      "coachGymConnections", "coachMemberConnections", "classBookings",
    ];

    for (const table of tables) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const documents = await ctx.db.query(table as any).collect();
        for (const doc of documents) {
          await ctx.db.delete(doc._id);
        }
      } catch {
        // ignore tables that don't exist
      }
    }

    return { success: true, message: "All data cleared" };
  },
});
