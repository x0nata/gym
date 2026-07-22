import { useQuery } from "convex/react";
import { motion } from "framer-motion";
import { ClipboardList, DollarSign, CalendarDays, Activity, FileText, Users } from "lucide-react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "../lib/useAuth";
import { formatDate } from "../lib/utils";

export default function Reports() {
    const { user } = useAuth();
    const sessionToken = user?.sessionToken;
    const stats = useQuery(api.members.stats, sessionToken ? { sessionToken } : "skip");
    const memberships = useQuery(api.memberships.listAll, sessionToken ? { sessionToken } : "skip");

    if (!stats || !memberships) {
        return (
            <div className="flex h-[60vh] items-center justify-center">
                <div className="h-10 w-10 rounded-full border-2 border-accent/30 border-t-accent-light animate-spin" />
            </div>
        );
    }

    const totalRevenue = memberships.reduce((sum, m) => sum + (m.amountPaid || 0), 0);

    const tiles = [
        { label: "Revenue", value: `ETB ${totalRevenue.toLocaleString()}`, icon: DollarSign, accent: "var(--color-energy)" },
        { label: "Total members", value: stats.totalMembers, icon: Users, accent: "var(--color-info)" },
        { label: "Active plans", value: stats.activeMemberships, icon: Activity, accent: "var(--color-success)" },
        { label: "Expiring soon", value: stats.expiringSoon, icon: CalendarDays, accent: "var(--color-warning)" },
    ];

    return (
        <div className="space-y-5">
            <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="card overflow-hidden">
                <div className="p-5 md:p-6 border-b border-theme flex items-center gap-3.5">
                    <span className="grid h-12 w-12 place-items-center rounded-2xl bg-accent/15 text-accent-light">
                        <ClipboardList className="h-6 w-6" />
                    </span>
                    <div>
                        <span className="eyebrow">Financials</span>
                        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight mt-1">Reports</h1>
                    </div>
                </div>
            </motion.section>

            <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                {tiles.map((item, idx) => (
                    <motion.div
                        key={item.label}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.05 * idx }}
                        className="stat-tile lift p-4 md:p-5"
                    >
                        <item.icon className="h-5 w-5 md:h-6 md:w-6" style={{ color: item.accent }} />
                        <p className="text-xl md:text-2xl font-extrabold tracking-tight mt-3 leading-none">{item.value}</p>
                        <p className="eyebrow mt-2">{item.label}</p>
                    </motion.div>
                ))}
            </section>

            <section className="card overflow-hidden">
                <div className="p-4 border-b border-theme flex items-center gap-2.5">
                    <FileText className="h-4 w-4 text-accent-light" />
                    <p className="font-bold tracking-tight">Recent payments</p>
                </div>
                {memberships.length === 0 ? (
                    <div className="p-10 text-center eyebrow">No payments yet</div>
                ) : (
                    <div className="divide-y divide-[var(--border)]">
                        {memberships.slice(0, 12).map((m) => (
                            <div key={m._id} className="p-4 md:p-5 flex items-center justify-between gap-4 hover:bg-hover transition-colors">
                                <div>
                                    <p className="font-semibold">{m.member?.firstName} {m.member?.lastName}</p>
                                    <p className="text-xs text-theme-muted mt-0.5">{m.planName}</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-energy">ETB {m.amountPaid}</p>
                                    <p className="text-xs text-theme-muted mt-0.5">{formatDate(m.startDate)}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}
