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
import { formatDate } from "../../lib/utils";

const dayLabels = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

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
                <div className="h-10 w-10 rounded-full border-2 border-accent/30 border-t-accent-light animate-spin" />
            </div>
        );
    }

    const today = new Date().getDay();
    const dayIndex = today === 0 ? 6 : today - 1;

    const todayWorkout = workoutPlan?.workouts.find((w) => w.dayOfWeek === dayIndex);
    const todayMeals = mealPlan?.meals.filter((m) => m.day === dayIndex).sort((a, b) => a.mealType.localeCompare(b.mealType)) ?? [];

    const caloriesToday = todayMeals.reduce((sum, item) => sum + (item.calories ?? 0), 0);
    const proteinToday = todayMeals.reduce((sum, item) => sum + (item.protein ?? 0), 0);

    return (
        <div className="space-y-5">
            <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="card overflow-hidden">
                <div className="p-5 md:p-7 border-b border-theme flex items-start justify-between gap-4">
                    <div>
                        <span className="eyebrow text-accent-light">Your plan</span>
                        <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight mt-2">Today</h1>
                        <p className="mt-2 text-sm text-theme-muted">Train, rest, and repeat.</p>
                    </div>
                    <span className="grid h-12 w-12 md:h-14 md:w-14 place-items-center rounded-2xl bg-accent/15 text-accent-light shrink-0">
                        <Sparkles className="h-6 w-6" />
                    </span>
                </div>
                <div className="p-5 md:p-7 grid gap-3 md:gap-4 md:grid-cols-3">
                    <div className="surface rounded-2xl p-4">
                        <p className="eyebrow">Today</p>
                        <p className="text-xl md:text-2xl font-extrabold tracking-tight mt-2">{dayLabels[dayIndex]}</p>
                    </div>
                    <div className="surface rounded-2xl p-4">
                        <p className="eyebrow">Workout</p>
                        <p className="text-sm font-bold mt-2">{todayWorkout?.name ?? "Recovery / Free Session"}</p>
                    </div>
                    <div className="surface rounded-2xl p-4">
                        <p className="eyebrow">Meals</p>
                        <p className="text-sm font-bold mt-2">{todayMeals.length} meals planned</p>
                    </div>
                </div>
            </motion.section>

            <div className="grid gap-4 md:gap-5 lg:grid-cols-2">
                {/* Workout */}
                <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="card overflow-hidden">
                    <div className="p-4 md:p-5 border-b border-theme flex items-center gap-2.5">
                        <Dumbbell className="h-4 w-4 text-accent-light" />
                        <h2 className="font-bold tracking-tight">Workout plan</h2>
                    </div>
                    {!workoutPlan ? (
                        <div className="p-8 text-center eyebrow">No workout plan</div>
                    ) : (
                        <div className="p-4 md:p-5 space-y-3">
                            <div className="rounded-2xl border border-theme bg-hover p-4">
                                <p className="font-bold tracking-tight">{workoutPlan.title}</p>
                                <p className="text-xs text-theme-muted mt-1.5 flex items-center gap-2"><User className="h-3.5 w-3.5" /> {workoutPlan.coach?.firstName} {workoutPlan.coach?.lastName}</p>
                                <p className="text-xs text-theme-muted mt-1.5 flex items-center gap-2"><CalendarDays className="h-3.5 w-3.5" /> Starts {formatDate(workoutPlan.startDate)}</p>
                            </div>
                            <div className="space-y-2">
                                {workoutPlan.workouts.slice(0, 5).map((w, idx) => (
                                    <div key={`workout-${idx}`} className="rounded-xl border border-theme p-3 flex items-center justify-between hover:bg-hover transition-colors">
                                        <div>
                                            <p className="eyebrow">{w.dayOfWeek !== undefined ? dayLabels[w.dayOfWeek] : `Day ${idx + 1}`}</p>
                                            <p className="text-sm font-semibold mt-1">{w.name}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs font-bold text-theme-secondary">{w.type}</p>
                                            <p className="text-xs text-theme-muted mt-0.5">{w.exercises.length} exercises</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </motion.section>

                {/* Meal */}
                <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card overflow-hidden">
                    <div className="p-4 md:p-5 border-b border-theme flex items-center gap-2.5">
                        <Utensils className="h-4 w-4 text-accent-light" />
                        <h2 className="font-bold tracking-tight">Meal plan</h2>
                    </div>
                    {!mealPlan ? (
                        <div className="p-8 text-center eyebrow">No meal plan</div>
                    ) : (
                        <div className="p-5 space-y-4">
                            <div className="rounded-2xl border border-theme bg-hover p-4">
                                <p className="font-bold tracking-tight">{mealPlan.title}</p>
                                <p className="text-xs text-theme-muted mt-1.5 flex items-center gap-2"><CalendarDays className="h-3.5 w-3.5" /> {formatDate(mealPlan.startDate)} — {formatDate(mealPlan.endDate)}</p>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="surface rounded-2xl p-3.5">
                                    <p className="eyebrow">Calories</p>
                                    <p className="text-xl font-extrabold tracking-tight mt-2 leading-none">{caloriesToday}</p>
                                    <p className="text-xs text-theme-muted mt-1.5">Target {mealPlan.targetCalories ?? "—"}</p>
                                </div>
                                <div className="surface rounded-2xl p-3.5">
                                    <p className="eyebrow">Protein</p>
                                    <p className="text-xl font-extrabold tracking-tight mt-2 leading-none">{proteinToday}g</p>
                                    <p className="text-xs text-theme-muted mt-1.5">Target {mealPlan.targetProtein ?? "—"}g</p>
                                </div>
                            </div>

                            <div className="h-2.5 rounded-full bg-hover overflow-hidden">
                                <div className="h-full rounded-full transition-all duration-700" style={{ width: `${getPercent(caloriesToday, mealPlan.targetCalories)}%`, background: "var(--color-energy)" }} />
                            </div>

                            <div className="space-y-2">
                                {todayMeals.slice(0, 4).map((meal, idx) => (
                                    <div key={`${meal.name}-${idx}`} className="rounded-xl border border-theme p-3 flex items-center justify-between hover:bg-hover transition-colors">
                                        <div>
                                            <p className="eyebrow">{meal.mealType.replace("_", " ")}</p>
                                            <p className="text-sm font-semibold mt-1">{meal.name}</p>
                                        </div>
                                        <p className="text-xs font-bold text-theme-secondary">{meal.calories ?? 0} kcal</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </motion.section>
            </div>

            <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="card p-5 md:p-6 flex items-center justify-between gap-4">
                <div>
                    <p className="eyebrow text-accent-light">Daily rule</p>
                    <p className="mt-2.5 text-sm font-semibold text-theme-secondary max-w-md">
                        Follow the plan. Stay consistent. Ask your coach before changing intensity.
                    </p>
                </div>
                <span className="flex items-center gap-2 text-accent-light font-bold text-xs shrink-0">
                    <Gauge className="h-4 w-4" /> Locked <ArrowRight className="h-4 w-4" />
                </span>
            </motion.section>
        </div>
    );
}
