import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Check for expiring memberships every hour
crons.interval(
  "check membership expiry",
  { hours: 1 },
  internal.notifications.checkMembershipExpiry
);

export default crons;
