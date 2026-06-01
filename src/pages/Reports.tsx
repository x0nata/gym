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
        <div className="h-12 w-12 border-4 border-theme-strong border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const totalRevenue = memberships.reduce((sum, m) => sum + (m.amountPaid || 0), 0);

  return (
    <div className="space-y-6 font-['Outfit']">
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="border-4 border-theme-strong bg-theme-raised shadow-[4px_4px_0px_0px_var(--border-strong)]"
      >
        <div className="p-6 border-b-4 border-theme-strong bg-theme-sidebar flex items-center gap-4">
          <div className="h-12 w-12 border-2 border-theme-strong bg-white text-[#ccff00] flex items-center justify-center">
            <ClipboardList className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-black tracking-[0.2em] text-slate-700">Intel</p>
            <h1 className="text-2xl md:text-3xl font-black uppercase font-['Syncopate'] text-theme">Operational Report</h1>
          </div>
        </div>
      </motion.section>

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {[
          { label: "Revenue", value: `ETB ${totalRevenue.toLocaleString()}`, icon: DollarSign },
          { label: "Total Athletes", value: stats.totalMembers, icon: Users },
          { label: "Active Plans", value: stats.activeMemberships, icon: Activity },
          { label: "Expiring Soon", value: stats.expiringSoon, icon: CalendarDays },
        ].map((item, idx) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.04 * idx }}
            className="border-4 border-theme-strong bg-theme-raised p-3 md:p-4 shadow-[4px_4px_0px_0px_var(--border-strong)]"
          >
            <item.icon className="h-6 w-6 md:h-8 md:w-8 text-theme mb-2 md:mb-3" />
            <p className="text-xl md:text-2xl font-black font-['Syncopate'] text-theme">{item.value}</p>
            <p className="mt-1 text-[9px] md:text-[10px] font-black uppercase tracking-[0.18em] text-theme-muted">{item.label}</p>
          </motion.div>
        ))}
      </section>

      <section className="border-4 border-theme-strong bg-theme-raised shadow-[4px_4px_0px_0px_var(--border-strong)] overflow-hidden">
        <div className="p-4 border-b-4 border-theme-strong bg-white text-black flex items-center gap-2">
          <FileText className="h-4 w-4 text-[#ccff00]" />
          <p className="font-black uppercase tracking-widest text-sm font-['Syncopate']">Recent transactions</p>
        </div>
        {memberships.length === 0 ? (
          <div className="p-10 text-center text-theme-muted font-black uppercase tracking-wider">No transactions yet</div>
        ) : (
          <div className="divide-y-2 divide-theme-strong">
            {memberships.slice(0, 12).map((m) => (
              <div key={m._id} className="p-4 md:p-5 flex items-center justify-between gap-4">
                <div>
                  <p className="font-black uppercase text-sm text-theme">{m.member?.firstName} {m.member?.lastName}</p>
                  <p className="text-xs font-bold uppercase text-theme-muted tracking-wider">{m.planName}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black uppercase text-theme">ETB {m.amountPaid}</p>
                  <p className="text-xs font-bold uppercase text-theme-muted tracking-wider">{formatDate(m.startDate)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
