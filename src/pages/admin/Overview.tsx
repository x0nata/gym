import { useQuery } from "convex/react";
import { motion } from "framer-motion";
import { Building2, Users, Activity, DollarSign, CalendarClock, TrendingUp, UserCheck, ShieldCheck } from "lucide-react";
import { api } from "../../../convex/_generated/api";
import { useAuth } from "../../lib/useAuth";
import { StatCard } from "../../components/admin/StatCard";
import { Panel } from "../../components/admin/StatCard";

export default function AdminOverview() {
    const { user } = useAuth();
    const sessionToken = user?.sessionToken;
    const stats = useQuery(api.admin.platformStats, sessionToken ? { sessionToken } : "skip");

    if (!stats) {
        return (
            <div className="flex h-[60vh] items-center justify-center">
                <div className="h-10 w-10 rounded-full border-2 border-energy/30 border-t-energy animate-spin" />
            </div>
        );
    }

    const activeGymPct = stats.totalGyms ? Math.round((stats.activeGyms / stats.totalGyms) * 100) : 0;
    const activeMemberPct = stats.totalMembers ? Math.round((stats.activeMembers / stats.totalMembers) * 100) : 0;

    return (
        <div className="space-y-5">
            <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="card overflow-hidden">
                <div className="p-5 md:p-6 border-b border-theme flex items-center gap-3.5">
                    <span className="grid h-12 w-12 place-items-center rounded-2xl bg-energy/15 text-energy">
                        <ShieldCheck className="h-6 w-6" />
                    </span>
                    <div>
                        <span className="eyebrow">Platform overview</span>
                        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight mt-1">Overview</h1>
                    </div>
                </div>
            </motion.section>

            <section className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                <StatCard icon={Building2} label="Total Gyms" value={stats.totalGyms} color="var(--color-energy)" delay={0} />
                <StatCard icon={TrendingUp} label="Active Gyms" value={`${stats.activeGyms} (${activeGymPct}%)`} color="var(--color-success)" delay={1} />
                <StatCard icon={Users} label="Total Members" value={stats.totalMembers} color="var(--color-accent-light)" delay={2} />
                <StatCard icon={UserCheck} label="Active Members" value={`${stats.activeMembers} (${activeMemberPct}%)`} color="var(--color-success)" delay={3} />
                <StatCard icon={Users} label="Coaches" value={stats.totalCoaches} color="var(--color-warning)" delay={4} />
                <StatCard icon={DollarSign} label="Revenue" value={`ETB ${stats.totalRevenue.toLocaleString()}`} color="var(--color-energy)" delay={5} />
                <StatCard icon={Activity} label="Active Plans" value={stats.activeMemberships} color="var(--color-accent-light)" delay={6} />
                <StatCard icon={CalendarClock} label="Expiring Soon" value={stats.expiringSoon} color="var(--color-danger)" delay={7} />
            </section>

            <div className="grid lg:grid-cols-2 gap-4 md:gap-5">
                <div className="card p-5">
                    <p className="eyebrow mb-4">Today</p>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="surface rounded-2xl p-4">
                            <Activity className="h-4 w-4 text-energy" />
                            <p className="text-2xl font-extrabold tracking-tight mt-2.5 leading-none">{stats.checkInsToday}</p>
                            <p className="eyebrow mt-2">Check-ins</p>
                        </div>
                        <div className="surface rounded-2xl p-4">
                            <CalendarClock className="h-4 w-4 text-danger" />
                            <p className="text-2xl font-extrabold tracking-tight mt-2.5 leading-none">{stats.expiringSoon}</p>
                            <p className="eyebrow mt-2">Expiring</p>
                        </div>
                    </div>
                </div>

                <Panel title="Recent Check-ins" titleIcon={Activity}>
                    {stats.recentCheckIns.length === 0 ? (
                        <div className="p-6 text-center eyebrow">No recent activity</div>
                    ) : (
                        <div className="divide-y divide-[var(--border)] max-h-72 overflow-y-auto">
                            {stats.recentCheckIns.slice(0, 10).map((ci) => (
                                <div key={ci._id} className="p-3.5 px-5 flex items-center justify-between">
                                    <div>
                                        <p className="font-semibold text-sm">Check-in</p>
                                        <p className="text-xs text-theme-muted mt-0.5">{new Date(ci.timestamp).toLocaleString()}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="h-2 w-2 rounded-full bg-energy" />
                                        <span className="text-xs font-bold text-energy">Today</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </Panel>
            </div>
        </div>
    );
}
