import { motion } from "framer-motion";
import { useQuery } from "convex/react";
import {
  Sparkles,
  Dumbbell,
  Utensils,
  CalendarDays,
  Gauge,
  User,
  ArrowRight,
} from "lucide-react";
import { api } from "../../../convex/_generated/api";
import { useAuth } from "../../lib/useAuth";

const dayLabels = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

function formatDate(value: number) {
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getPercent(value: number, target?: number) {
  if (!target || target <= 0) return 0;
  return Math.min(100, Math.round((value / target) * 100));
}

export default function Plans() {
  const { user } = useAuth();
  const sessionToken = user?.sessionToken;
  const workoutPlan = useQuery(api.workoutPlans.getActiveWorkoutPlan, sessionToken ? { sessionToken } : "skip");
  const mealPlan = useQuery(api.mealPlans.getActiveMealPlan, sessionToken ? { sessionToken } : "skip");

  if (workoutPlan === undefined || mealPlan === undefined) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-12 w-12 border-4 border-theme-strong border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const today = new Date().getDay();
  const dayIndex = today === 0 ? 6 : today - 1;

  const todayWorkout = workoutPlan?.workouts.find((w) => w.dayOfWeek === dayIndex);
  const todayMeals =
    mealPlan?.meals
      .filter((m) => m.day === dayIndex)
      .sort((a, b) => a.mealType.localeCompare(b.mealType)) ?? [];

  const caloriesToday = todayMeals.reduce((sum, item) => sum + (item.calories ?? 0), 0);
  const proteinToday = todayMeals.reduce((sum, item) => sum + (item.protein ?? 0), 0);

  return (
    <div className="space-y-6 font-['Outfit']">
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="border-4 border-theme-strong bg-theme-raised shadow-[4px_4px_0px_0px_var(--border-strong)]"
      >
        <div className="p-4 md:p-6 md:p-8 border-b-4 border-theme-strong bg-theme-sidebar text-theme">
          <div className="flex items-start justify-between gap-3 md:gap-4">
            <div>
              <p className="text-[10px] md:text-[11px] font-black uppercase tracking-[0.2em] text-indigo-500">Member Protocol</p>
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-black uppercase font-['Syncopate'] text-theme mt-1 md:mt-2">Daily Mission</h1>
              <p className="mt-1 md:mt-3 text-xs md:text-sm font-bold text-theme-muted uppercase tracking-wider">Train, recover, and execute.</p>
            </div>
            <div className="h-10 w-10 md:h-14 md:w-14 bg-indigo-500/10 border-2 border-theme-strong text-indigo-500 flex items-center justify-center shrink-0">
              <Sparkles className="h-5 w-5 md:h-7 md:w-7" />
            </div>
          </div>
        </div>
        <div className="p-4 md:p-6 md:p-8 grid gap-3 md:gap-4 md:grid-cols-3">
          <div className="border-2 border-theme-strong p-3 md:p-4 bg-theme-raised">
            <p className="text-[9px] md:text-[10px] uppercase tracking-[0.2em] font-black text-theme-muted">Today</p>
            <p className="text-xl md:text-2xl font-black font-['Syncopate'] mt-1 md:mt-2">{dayLabels[dayIndex]}</p>
          </div>
          <div className="border-2 border-theme-strong p-3 md:p-4 bg-theme-raised">
            <p className="text-[9px] md:text-[10px] uppercase tracking-[0.2em] font-black text-theme-muted">Workout Block</p>
            <p className="text-xs md:text-sm font-black uppercase mt-1 md:mt-2">{todayWorkout?.name ?? "Recovery / Free Session"}</p>
          </div>
          <div className="border-2 border-theme-strong p-3 md:p-4 bg-theme-raised">
            <p className="text-[9px] md:text-[10px] uppercase tracking-[0.2em] font-black text-theme-muted">Nutrition Block</p>
            <p className="text-xs md:text-sm font-black uppercase mt-1 md:mt-2">{todayMeals.length} meals queued</p>
          </div>
        </div>
      </motion.section>

      <div className="grid gap-4 md:gap-6 lg:grid-cols-2">
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="border-4 border-theme-strong bg-theme-raised shadow-[4px_4px_0px_0px_var(--border-strong)]"
        >
          <div className="p-4 md:p-5 border-b-4 border-theme-strong bg-theme-sidebar text-theme flex items-center gap-2 md:gap-3">
            <Dumbbell className="h-4 w-4 md:h-5 md:w-5 text-indigo-500" />
            <h2 className="font-black uppercase tracking-widest text-sm md:text-base">Workout Protocol</h2>
          </div>
          {!workoutPlan ? (
            <div className="p-8 text-center">
              <p className="font-bold uppercase text-theme-muted tracking-wider">No active workout plan</p>
            </div>
          ) : (
            <div className="p-4 md:p-5 space-y-3 md:space-y-4">
              <div className="border-2 border-theme-strong p-3 md:p-4 bg-theme-sidebar">
                <p className="text-base md:text-lg font-black uppercase">{workoutPlan.title}</p>
                <p className="text-xs font-bold uppercase text-theme-muted mt-1 flex items-center gap-2">
                  <User className="h-3.5 w-3.5" />
                  {workoutPlan.coach?.firstName} {workoutPlan.coach?.lastName}
                </p>
                <p className="text-xs font-bold uppercase text-theme-muted mt-2 flex items-center gap-2">
                  <CalendarDays className="h-3.5 w-3.5" />
                  Starts {formatDate(workoutPlan.startDate)}
                </p>
              </div>
              <div className="space-y-2">
                {workoutPlan.workouts.slice(0, 5).map((w, idx) => (
                  <div key={`workout-${idx}`} className="border-2 border-theme-strong p-3 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-black uppercase text-theme-muted tracking-wider">{w.dayOfWeek !== undefined ? dayLabels[w.dayOfWeek] : `Day ${idx + 1}`}</p>
                      <p className="text-sm font-bold uppercase">{w.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-black uppercase text-theme-muted">{w.type}</p>
                      <p className="text-xs font-bold uppercase text-theme-muted">{w.exercises.length} exercises</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="border-4 border-theme-strong bg-theme-raised shadow-[4px_4px_0px_0px_var(--border-strong)]"
        >
          <div className="p-4 md:p-5 border-b-4 border-theme-strong bg-theme-sidebar text-theme flex items-center gap-2 md:gap-3">
            <Utensils className="h-4 w-4 md:h-5 md:w-5 text-indigo-500" />
            <h2 className="font-black uppercase tracking-widest text-sm md:text-base">Fuel Protocol</h2>
          </div>
          {!mealPlan ? (
            <div className="p-8 text-center">
              <p className="font-bold uppercase text-theme-muted tracking-wider">No active meal plan</p>
            </div>
          ) : (
            <div className="p-5 space-y-4">
              <div className="border-2 border-theme-strong p-4 bg-theme-sidebar">
                <p className="text-lg font-black uppercase">{mealPlan.title}</p>
                <p className="text-xs font-bold uppercase text-theme-muted mt-1 flex items-center gap-2">
                  <CalendarDays className="h-3.5 w-3.5" />
                  {formatDate(mealPlan.startDate)} - {formatDate(mealPlan.endDate)}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="border-2 border-theme-strong p-3">
                  <p className="text-[10px] font-black uppercase tracking-widest text-theme-muted">Calories</p>
                  <p className="text-xl font-black font-['Syncopate'] mt-1">{caloriesToday}</p>
                  <p className="text-[10px] font-bold uppercase text-theme-muted mt-1">Target {mealPlan.targetCalories ?? "-"}</p>
                </div>
                <div className="border-2 border-theme-strong p-3">
                  <p className="text-[10px] font-black uppercase tracking-widest text-theme-muted">Protein</p>
                  <p className="text-xl font-black font-['Syncopate'] mt-1">{proteinToday}g</p>
                  <p className="text-[10px] font-bold uppercase text-theme-muted mt-1">Target {mealPlan.targetProtein ?? "-"}g</p>
                </div>
              </div>

              <div className="h-3 border-2 border-theme-strong bg-theme-raised">
                <div
                  className="h-full bg-indigo-500"
                  style={{ width: `${getPercent(caloriesToday, mealPlan.targetCalories)}%` }}
                />
              </div>

              <div className="space-y-2">
                {todayMeals.slice(0, 4).map((meal, idx) => (
                  <div key={`${meal.name}-${idx}`} className="border-2 border-theme-strong p-3 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-black uppercase tracking-wider text-theme-muted">{meal.mealType.replace("_", " ")}</p>
                      <p className="text-sm font-bold uppercase">{meal.name}</p>
                    </div>
                    <p className="text-xs font-black uppercase">{meal.calories ?? 0} kcal</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.section>
      </div>

      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="border-4 border-theme-strong bg-theme-sidebar text-theme p-4 md:p-5 md:p-6 shadow-[6px_6px_0px_0px_var(--border-strong)]"
      >
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-500">Execution Rule</p>
            <p className="mt-2 text-sm font-bold uppercase tracking-wider text-theme">
              Hit the schedule. Log consistency. Ask your coach before changing intensity.
            </p>
          </div>
          <div className="flex items-center gap-2 text-indigo-500 font-black uppercase text-xs tracking-wider">
            <Gauge className="h-4 w-4" />
            Locked
            <ArrowRight className="h-4 w-4" />
          </div>
        </div>
      </motion.section>
    </div>
  );
}
