import { useQuery } from "convex/react";
import { motion } from "framer-motion";
import { BarChart3, TrendingUp, Target, Activity, Users, CalendarClock } from "lucide-react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "../lib/useAuth";
import { MetricBar, MiniMetric } from "../components/admin/StatCard";

export default function Analytics() {
    const { user } = useAuth();
    const sessionToken = user?.sessionToken;
    const stats = useQuery(api.members.stats, sessionToken ? { sessionToken } : "skip");

    if (!stats) {
        return (
            <div className="flex h-[60vh] items-center justify-center">
                <div className="h-10 w-10 rounded-full border-2 border-energy/30 border-t-energy animate-spin" />
            </div>
        );
    }

    const activeRate = stats.totalMembers ? Math.round((stats.activeMembers / stats.totalMembers) * 100) : 0;
    const retentionRate = stats.totalMembers ? Math.round((stats.activeMemberships / stats.totalMembers) * 100) : 0;

    const tiles = [
        { label: "Active members", value: `${activeRate}%`, icon: TrendingUp, accent: "var(--color-success)" },
        { label: "Retention", value: `${retentionRate}%`, icon: Target, accent: "var(--color-energy)" },
        { label: "Check-ins today", value: stats.todayCheckIns, icon: Activity, accent: "var(--color-energy)" },
        { label: "Expiring soon", value: stats.expiringSoon, icon: CalendarClock, accent: "var(--color-warning)" },
    ];

    return (
        <div className="space-y-5">
            <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="card overflow-hidden">
                <div className="p-5 md:p-6 border-b border-theme flex items-center gap-3.5">
                    <span className="grid h-12 w-12 place-items-center rounded-2xl bg-energy/15 text-energy">
                        <BarChart3 className="h-6 w-6" />
                    </span>
                    <div>
                        <span className="eyebrow">Insights</span>
                        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight mt-1">Analytics</h1>
                    </div>
                </div>
            </motion.section>

            <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                {tiles.map((item, idx) => (
                    <motion.div key={item.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 * idx }} className="stat-tile p-4 md:p-5">
                        <item.icon className="h-5 w-5" style={{ color: item.accent }} />
                        <p className="mt-3 text-xl md:text-2xl font-extrabold tracking-tight leading-none tabular-nums">{item.value}</p>
                        <p className="eyebrow mt-2">{item.label}</p>
                    </motion.div>
                ))}
            </section>

            <section className="grid lg:grid-cols-2 gap-4 md:gap-5">
                <div className="card p-5">
                    <p className="eyebrow mb-4">Member breakdown</p>
                    <div className="space-y-4">
                        <MetricBar label="Members with active plans" value={stats.activeMembers} total={stats.totalMembers} color="var(--color-success)" />
                        <MetricBar label="Members without active plans" value={Math.max(0, stats.totalMembers - stats.activeMembers)} total={stats.totalMembers} color="var(--color-danger)" />
                    </div>
                </div>
                <div className="card p-5">
                    <p className="eyebrow mb-4">Totals</p>
                    <div className="grid grid-cols-2 gap-3">
                        <MiniMetric icon={Users} label="Total" value={stats.totalMembers} />
                        <MiniMetric icon={TrendingUp} label="Active" value={stats.activeMembers} />
                        <MiniMetric icon={Target} label="Plans" value={stats.activeMemberships} />
                        <MiniMetric icon={Activity} label="Today" value={stats.todayCheckIns} />
                    </div>
                </div>
            </section>
        </div>
    );
}