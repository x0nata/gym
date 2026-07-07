import { useQuery } from "convex/react";
import { motion } from "framer-motion";
import { DollarSign, TrendingUp, CalendarClock, FileText, BarChart3 } from "lucide-react";
import { api } from "../../../convex/_generated/api";
import { useAuth } from "../../lib/useAuth";
import { StatCard } from "../../components/admin/StatCard";
import { Panel } from "../../components/admin/StatCard";
import { formatDate } from "../../lib/utils";

export default function AdminRevenue() {
    const { user } = useAuth();
    const sessionToken = user?.sessionToken;
    const stats = useQuery(api.admin.platformStats, sessionToken ? { sessionToken } : "skip");
    const memberships = useQuery(api.admin.listMemberships, sessionToken ? { sessionToken } : "skip");

    if (!stats || !memberships) {
        return (
            <div className="flex h-[60vh] items-center justify-center">
                <div className="h-12 w-12 border-4 border-theme-strong border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    const totalRevenue = stats.totalRevenue || 0;
    const activePlans = stats.activeMemberships || 0;
    const expiringSoon = stats.expiringSoon || 0;

    const planBreakdown: Record<string, { count: number; revenue: number }> = {};
    memberships.forEach((m) => {
        if (!m) return;
        const plan = (m as { membership: { planName: string; amountPaid: number } }).membership.planName;
        if (!planBreakdown[plan]) {
            planBreakdown[plan] = { count: 0, revenue: 0 };
        }
        planBreakdown[plan].count += 1;
        planBreakdown[plan].revenue += (m as { membership: { amountPaid: number } }).membership.amountPaid || 0;
    });

    const maxCount = Math.max(...Object.values(planBreakdown).map((v) => v.count), 1);
    const maxRevenue = Math.max(...Object.values(planBreakdown).map((v) => v.revenue), 1);

    return (
        <div className="space-y-6 font-['Outfit']">
            <motion.section
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                className="border-4 border-theme-strong bg-theme-raised shadow-[4px_4px_0px_0px_var(--border-strong)]"
            >
                <div className="p-6 border-b-4 border-theme-strong bg-theme-sidebar flex items-center gap-4">
                    <div className="h-12 w-12 border-2 border-[#ccff00] bg-theme-raised text-[#ccff00] flex items-center justify-center">
                        <DollarSign className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="text-[10px] uppercase font-black tracking-[0.2em] text-theme-muted">Platform Revenue</p>
                        <h1 className="text-2xl md:text-3xl font-black uppercase font-['Syncopate'] text-theme">Revenue</h1>
                    </div>
                </div>
            </motion.section>

            <section className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                <StatCard icon={DollarSign} label="Total Revenue" value={`ETB ${totalRevenue.toLocaleString()}`} color="#ccff00" delay={0} />
                <StatCard icon={TrendingUp} label="Active Plans" value={activePlans} color="#6366F1" delay={1} />
                <StatCard icon={CalendarClock} label="Expiring Soon" value={expiringSoon} color="#EF4444" delay={2} />
                <StatCard icon={BarChart3} label="Avg Revenue/Plan" value={activePlans > 0 ? `ETB ${Math.round(totalRevenue / Math.max(activePlans, 1)).toLocaleString()}` : "ETB 0"} color="#10B981" delay={3} />
            </section>

            <div className="grid lg:grid-cols-2 gap-4 md:gap-4">
                <div className="border-4 border-theme-strong bg-theme-raised p-4 md:p-5 shadow-[4px_4px_0px_0px_var(--border-strong)]">
                    <p className="text-xs font-black uppercase tracking-widest text-theme-muted font-['Syncopate'] mb-4">Plans by count</p>
                    <div className="space-y-3">
                        {Object.entries(planBreakdown).sort((a, b) => b[1].count - a[1].count).map(([plan, { count }]) => {
                            const pct = Math.round((count / maxCount) * 100);
                            return (
                                <div key={plan}>
                                    <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-theme">
                                        <span>{plan}</span>
                                        <span>{count}</span>
                                    </div>
                                    <div className="mt-1.5 h-3 border-2 border-theme-strong bg-theme-sidebar">
                                        <div className="h-full bg-[#ccff00]" style={{ width: `${pct}%` }} />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="border-4 border-theme-strong bg-theme-raised p-4 md:p-5 shadow-[4px_4px_0px_0px_var(--border-strong)]">
                    <p className="text-xs font-black uppercase tracking-widest text-theme-muted font-['Syncopate'] mb-4">Revenue by plan</p>
                    <div className="space-y-3">
                        {Object.entries(planBreakdown).sort((a, b) => b[1].revenue - a[1].revenue).map(([plan, { revenue }]) => {
                            const pct = Math.round((revenue / maxRevenue) * 100);
                            return (
                                <div key={plan}>
                                    <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-theme">
                                        <span>{plan}</span>
                                        <span>ETB {revenue.toLocaleString()}</span>
                                    </div>
                                    <div className="mt-1.5 h-3 border-2 border-theme-strong bg-theme-sidebar">
                                        <div className="h-full bg-indigo-500" style={{ width: `${pct}%` }} />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            <Panel title="Recent Payments" titleIcon={FileText}>
                {memberships.length === 0 ? (
                    <div className="p-10 text-center text-theme-muted font-black uppercase tracking-wider">No payments yet</div>
                ) : (
                    <div className="divide-y-2 divide-theme-strong max-h-96 overflow-y-auto">
                        {memberships.slice(0, 30).map((m) => {
                            if (!m) return null;
                            const entry = m as { membership: { _id: string; planName: string; amountPaid: number; startDate: number; status: string }; member: { firstName: string; lastName: string } | null; gym: { name: string } | null };
                            return (
                                <div key={entry.membership._id} className="p-4 md:p-5 flex items-center justify-between gap-4">
                                    <div className="min-w-0 flex-1">
                                        <p className="font-black uppercase text-sm text-theme truncate">
                                            {entry.member ? `${entry.member.firstName} ${entry.member.lastName}` : "Unknown"}
                                        </p>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span className="text-xs font-bold uppercase text-theme-muted tracking-wider">{entry.membership.planName}</span>
                                            {entry.gym && (
                                                <span className="text-xs font-bold text-theme-muted">| {entry.gym.name}</span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <p className="text-sm font-black uppercase text-theme">ETB {entry.membership.amountPaid.toLocaleString()}</p>
                                        <p className={`text-xs font-bold uppercase tracking-wider ${
                                            entry.membership.status === "active" ? "text-green-500" :
                                                entry.membership.status === "expired" ? "text-red-500" : "text-amber-500"
                                        }`}>
                                            {entry.membership.status} · {formatDate(entry.membership.startDate)}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </Panel>
        </div>
    );
}
