/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as auth from "../auth.js";
import type * as authLegacy from "../authLegacy.js";
import type * as checkIns from "../checkIns.js";
import type * as classes from "../classes.js";
import type * as coachMembers from "../coachMembers.js";
import type * as coaches from "../coaches.js";
import type * as crons from "../crons.js";
import type * as gyms from "../gyms.js";
import type * as invitations from "../invitations.js";
import type * as lib_session from "../lib/session.js";
import type * as mealPlans from "../mealPlans.js";
import type * as members from "../members.js";
import type * as memberships from "../memberships.js";
import type * as notifications from "../notifications.js";
import type * as progress from "../progress.js";
import type * as workoutPlans from "../workoutPlans.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  authLegacy: typeof authLegacy;
  checkIns: typeof checkIns;
  classes: typeof classes;
  coachMembers: typeof coachMembers;
  coaches: typeof coaches;
  crons: typeof crons;
  gyms: typeof gyms;
  invitations: typeof invitations;
  "lib/session": typeof lib_session;
  mealPlans: typeof mealPlans;
  members: typeof members;
  memberships: typeof memberships;
  notifications: typeof notifications;
  progress: typeof progress;
  workoutPlans: typeof workoutPlans;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
