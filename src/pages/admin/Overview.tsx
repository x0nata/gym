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
                <div className="h-12 w-12 border-4 border-theme-strong border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    const activeGymPct = stats.totalGyms ? Math.round((stats.activeGyms / stats.totalGyms) * 100) : 0;
    const activeMemberPct = stats.totalMembers ? Math.round((stats.activeMembers / stats.totalMembers) * 100) : 0;

    return (
        <div className="space-y-6 font-['Outfit']">
            <motion.section
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                className="border-4 border-theme-strong bg-theme-raised shadow-[4px_4px_0px_0px_var(--border-strong)]"
            >
                <div className="p-6 border-b-4 border-theme-strong bg-theme-sidebar flex items-center gap-4">
                    <div className="h-12 w-12 border-2 border-[#ccff00] bg-theme-raised text-[#ccff00] flex items-center justify-center">
                        <ShieldCheck className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="text-[10px] uppercase font-black tracking-[0.2em] text-theme-muted">Platform Overview</p>
                        <h1 className="text-2xl md:text-3xl font-black uppercase font-['Syncopate'] text-theme">Overview</h1>
                    </div>
                </div>
            </motion.section>

            <section className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                <StatCard icon={Building2} label="Total Gyms" value={stats.totalGyms} color="#ccff00" delay={0} />
                <StatCard icon={TrendingUp} label="Active Gyms" value={`${stats.activeGyms} (${activeGymPct}%)`} color="#10B981" delay={1} />
                <StatCard icon={Users} label="Total Members" value={stats.totalMembers} color="#6366F1" delay={2} />
                <StatCard icon={UserCheck} label="Active Members" value={`${stats.activeMembers} (${activeMemberPct}%)`} color="#10B981" delay={3} />
                <StatCard icon={Users} label="Coaches" value={stats.totalCoaches} color="#F59E0B" delay={4} />
                <StatCard icon={DollarSign} label="Revenue" value={`ETB ${stats.totalRevenue.toLocaleString()}`} color="#ccff00" delay={5} />
                <StatCard icon={Activity} label="Active Plans" value={stats.activeMemberships} color="#6366F1" delay={6} />
                <StatCard icon={CalendarClock} label="Expiring Soon" value={stats.expiringSoon} color="#EF4444" delay={7} />
            </section>

            <div className="grid lg:grid-cols-2 gap-4 md:gap-4">
                <div className="border-4 border-theme-strong bg-theme-raised p-4 md:p-5 shadow-[4px_4px_0px_0px_var(--border-strong)]">
                    <p className="text-xs font-black uppercase tracking-widest text-theme-muted font-['Syncopate'] mb-4">Today</p>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="border-2 border-theme-strong bg-theme-sidebar p-3">
                            <Activity className="h-4 w-4 text-[#ccff00]" />
                            <p className="text-2xl font-black font-['Syncopate'] mt-2 text-theme">{stats.checkInsToday}</p>
                            <p className="text-[10px] font-black uppercase tracking-widest text-theme-muted">Check-ins</p>
                        </div>
                        <div className="border-2 border-theme-strong bg-theme-sidebar p-3">
                            <CalendarClock className="h-4 w-4 text-red-500" />
                            <p className="text-2xl font-black font-['Syncopate'] mt-2 text-theme">{stats.expiringSoon}</p>
                            <p className="text-[10px] font-black uppercase tracking-widest text-theme-muted">Expiring</p>
                        </div>
                    </div>
                </div>

                <Panel title="Recent Check-ins" titleIcon={Activity}>
                    {stats.recentCheckIns.length === 0 ? (
                        <div className="p-6 text-center text-theme-muted font-black uppercase tracking-wider text-sm">No recent activity</div>
                    ) : (
                        <div className="divide-y-2 divide-theme-strong max-h-72 overflow-y-auto">
                            {stats.recentCheckIns.slice(0, 10).map((ci) => (
                                <div key={ci._id} className="p-3 px-4 flex items-center justify-between">
                                    <div>
                                        <p className="font-black uppercase text-sm text-theme">Check-in</p>
                                        <p className="text-xs font-bold text-theme-muted uppercase tracking-wider">
                                            {new Date(ci.timestamp).toLocaleString()}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="h-2 w-2 rounded-full bg-[#ccff00]" />
                                        <span className="text-xs font-bold uppercase text-[#ccff00]">Today</span>
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
