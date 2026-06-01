import { useQuery } from "convex/react";
import { motion } from "framer-motion";
import { BarChart3, TrendingUp, Target, Activity, Users, CalendarClock } from "lucide-react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "../lib/useAuth";

export default function Analytics() {
  const { user } = useAuth();
  const sessionToken = user?.sessionToken;
  const stats = useQuery(api.members.stats, sessionToken ? { sessionToken } : "skip");

  if (!stats) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-12 w-12 border-4 border-theme-strong border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const activeRate = stats.totalMembers ? Math.round((stats.activeMembers / stats.totalMembers) * 100) : 0;
  const retentionRate = stats.totalMembers ? Math.round((stats.activeMemberships / stats.totalMembers) * 100) : 0;

  return (
    <div className="space-y-6 font-['Outfit']">
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="border-4 border-theme-strong bg-theme-raised shadow-[4px_4px_0px_0px_var(--border-strong)]"
      >
        <div className="p-6 border-b-4 border-theme-strong bg-theme-sidebar flex items-center gap-4">
          <div className="h-12 w-12 border-2 border-theme-strong bg-white text-theme flex items-center justify-center">
            <BarChart3 className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-black tracking-[0.2em] text-theme-muted">Metrics</p>
            <h1 className="text-2xl md:text-3xl font-black uppercase font-['Syncopate'] text-theme">Performance Grid</h1>
          </div>
        </div>
      </motion.section>

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {[
          { label: "Valid Membership Rate", value: `${activeRate}%`, icon: TrendingUp },
          { label: "Retention", value: `${retentionRate}%`, icon: Target },
          { label: "Check-ins Today", value: stats.todayCheckIns, icon: Activity },
          { label: "Expiring Soon", value: stats.expiringSoon, icon: CalendarClock },
        ].map((item, idx) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.04 * idx }}
            className="border-4 border-theme-strong bg-theme-raised p-3 md:p-4 shadow-[4px_4px_0px_0px_var(--border-strong)]"
          >
            <item.icon className="h-5 w-5 text-theme" />
            <p className="mt-2 md:mt-3 text-xl md:text-2xl font-black font-['Syncopate'] text-theme">{item.value}</p>
            <p className="mt-1 text-[9px] md:text-[10px] font-black uppercase tracking-[0.18em] text-theme-muted">{item.label}</p>
          </motion.div>
        ))}
      </section>

      <section className="grid lg:grid-cols-2 gap-4 md:gap-4">
        <div className="border-4 border-theme-strong bg-theme-raised p-4 md:p-5 shadow-[4px_4px_0px_0px_var(--border-strong)]">
          <p className="text-xs font-black uppercase tracking-widest text-theme-muted font-['Syncopate']">Athlete Distribution</p>
          <div className="mt-4 space-y-3">
            <MetricBar label="Members with valid plans" value={stats.activeMembers} total={stats.totalMembers} />
            <MetricBar label="Members without valid plans" value={Math.max(0, stats.totalMembers - stats.activeMembers)} total={stats.totalMembers} />
          </div>
        </div>
        <div className="border-4 border-theme-strong bg-theme-sidebar p-5 shadow-[4px_4px_0px_0px_var(--border-strong)]">
          <p className="text-xs font-black uppercase tracking-widest text-theme-muted font-['Syncopate']">Core Totals</p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <MiniMetric icon={Users} label="Total" value={stats.totalMembers} />
            <MiniMetric icon={TrendingUp} label="Valid" value={stats.activeMembers} />
            <MiniMetric icon={Target} label="Plans" value={stats.activeMemberships} />
            <MiniMetric icon={Activity} label="Today" value={stats.todayCheckIns} />
          </div>
        </div>
      </section>
    </div>
  );
}

function MetricBar({ label, value, total }: { label: string; value: number; total: number }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div>
      <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-theme">
        <span>{label}</span>
        <span>{value} ({pct}%)</span>
      </div>
      <div className="mt-1.5 h-3 border-2 border-theme-strong bg-theme-sidebar">
        <div className="h-full bg-[#ccff00]" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function MiniMetric({ icon: Icon, label, value }: { icon: typeof Users; label: string; value: number }) {
  return (
    <div className="border-2 border-theme-strong bg-theme-raised p-3">
      <Icon className="h-4 w-4 text-theme" />
      <p className="text-xl font-black font-['Syncopate'] mt-2 text-theme">{value}</p>
      <p className="text-[10px] font-black uppercase tracking-widest text-theme-muted">{label}</p>
    </div>
  );
}
