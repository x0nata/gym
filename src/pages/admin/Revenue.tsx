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
                <div className="h-10 w-10 rounded-full border-2 border-energy/30 border-t-energy animate-spin" />
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
        if (!planBreakdown[plan]) planBreakdown[plan] = { count: 0, revenue: 0 };
        planBreakdown[plan].count += 1;
        planBreakdown[plan].revenue += (m as { membership: { amountPaid: number } }).membership.amountPaid || 0;
    });

    const maxCount = Math.max(...Object.values(planBreakdown).map((v) => v.count), 1);
    const maxRevenue = Math.max(...Object.values(planBreakdown).map((v) => v.revenue), 1);

    return (
        <div className="space-y-5">
            <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="card overflow-hidden">
                <div className="p-5 md:p-6 border-b border-theme flex items-center gap-3.5">
                    <span className="grid h-12 w-12 place-items-center rounded-2xl bg-energy/15 text-energy">
                        <DollarSign className="h-6 w-6" />
                    </span>
                    <div>
                        <span className="eyebrow">Platform revenue</span>
                        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight mt-1">Revenue</h1>
                    </div>
                </div>
            </motion.section>

            <section className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                <StatCard icon={DollarSign} label="Total Revenue" value={`ETB ${totalRevenue.toLocaleString()}`} color="var(--color-energy)" delay={0} />
                <StatCard icon={TrendingUp} label="Active Plans" value={activePlans} color="var(--color-accent-light)" delay={1} />
                <StatCard icon={CalendarClock} label="Expiring Soon" value={expiringSoon} color="var(--color-danger)" delay={2} />
                <StatCard icon={BarChart3} label="Avg Revenue / Plan" value={activePlans > 0 ? `ETB ${Math.round(totalRevenue / Math.max(activePlans, 1)).toLocaleString()}` : "ETB 0"} color="var(--color-success)" delay={3} />
            </section>

            <div className="grid lg:grid-cols-2 gap-4 md:gap-5">
                <div className="card p-5">
                    <p className="eyebrow mb-4">Plans by count</p>
                    <div className="space-y-4">
                        {Object.entries(planBreakdown).sort((a, b) => b[1].count - a[1].count).map(([plan, { count }]) => {
                            const pct = Math.round((count / maxCount) * 100);
                            return (
                                <div key={plan}>
                                    <div className="flex items-center justify-between text-sm font-semibold">
                                        <span className="text-theme-secondary">{plan}</span>
                                        <span>{count}</span>
                                    </div>
                                    <div className="mt-2 h-2.5 rounded-full bg-hover overflow-hidden">
                                        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: "var(--color-energy)" }} />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="card p-5">
                    <p className="eyebrow mb-4">Revenue by plan</p>
                    <div className="space-y-4">
                        {Object.entries(planBreakdown).sort((a, b) => b[1].revenue - a[1].revenue).map(([plan, { revenue }]) => {
                            const pct = Math.round((revenue / maxRevenue) * 100);
                            return (
                                <div key={plan}>
                                    <div className="flex items-center justify-between text-sm font-semibold">
                                        <span className="text-theme-secondary">{plan}</span>
                                        <span className="text-energy">ETB {revenue.toLocaleString()}</span>
                                    </div>
                                    <div className="mt-2 h-2.5 rounded-full bg-hover overflow-hidden">
                                        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: "var(--color-energy)" }} />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            <Panel title="Recent Payments" titleIcon={FileText}>
                {memberships.length === 0 ? (
                    <div className="p-10 text-center eyebrow">No payments yet</div>
                ) : (
                    <div className="divide-y divide-[var(--border)] max-h-96 overflow-y-auto">
                        {memberships.slice(0, 30).map((m) => {
                            if (!m) return null;
                            const entry = m as { membership: { _id: string; planName: string; amountPaid: number; startDate: number; status: string }; member: { firstName: string; lastName: string } | null; gym: { name: string } | null };
                            return (
                                <div key={entry.membership._id} className="p-4 md:p-5 flex items-center justify-between gap-4 hover:bg-hover transition-colors">
                                    <div className="min-w-0 flex-1">
                                        <p className="font-semibold truncate">{entry.member ? `${entry.member.firstName} ${entry.member.lastName}` : "Unknown"}</p>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span className="text-xs text-theme-muted">{entry.membership.planName}</span>
                                            {entry.gym && <span className="text-xs text-theme-muted">· {entry.gym.name}</span>}
                                        </div>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <p className="font-bold text-energy">ETB {entry.membership.amountPaid.toLocaleString()}</p>
                                        <p className={`text-xs mt-0.5 ${entry.membership.status === "active" ? "text-success" : entry.membership.status === "expired" ? "text-danger" : "text-warning"}`}>
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
