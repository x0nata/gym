import { type ReactNode } from "react";
import { motion } from "framer-motion";
import { type LucideIcon } from "lucide-react";

export function StatCard({
    icon: Icon,
    label,
    value,
    color,
    delay = 0,
}: {
    icon: LucideIcon;
    label: string;
    value: string | number;
    color?: string;
    delay?: number;
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.04 * delay }}
            className="border-4 border-theme-strong bg-theme-raised p-3 md:p-4 shadow-[4px_4px_0px_0px_var(--border-strong)]"
        >
            <Icon className="h-6 w-6 md:h-8 md:w-8 mb-2 md:mb-3" style={{ color: color || "var(--text)" }} />
            <p className="text-xl md:text-2xl font-black font-['Syncopate'] text-theme">{value}</p>
            <p className="mt-1 text-[9px] md:text-[10px] font-black uppercase tracking-[0.18em] text-theme-muted">{label}</p>
        </motion.div>
    );
}

export function MiniMetric({ icon: Icon, label, value, color }: { icon: LucideIcon; label: string; value: number; color?: string }) {
    return (
        <div className="border-2 border-theme-strong bg-theme-raised p-3">
            <Icon className="h-4 w-4" style={{ color: color || "var(--text)" }} />
            <p className="text-xl font-black font-['Syncopate'] mt-2 text-theme">{value}</p>
            <p className="text-[10px] font-black uppercase tracking-widest text-theme-muted">{label}</p>
        </div>
    );
}

export function MetricBar({ label, value, total, color }: { label: string; value: number; total: number; color?: string }) {
    const pct = total > 0 ? Math.round((value / total) * 100) : 0;
    return (
        <div>
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-theme">
                <span>{label}</span>
                <span>{value} ({pct}%)</span>
            </div>
            <div className="mt-1.5 h-3 border-2 border-theme-strong bg-theme-sidebar">
                <div className="h-full" style={{ width: `${pct}%`, backgroundColor: color || "#ccff00" }} />
            </div>
        </div>
    );
}

export function Panel({ title, titleIcon: Icon, children, className }: { title: string; titleIcon: LucideIcon; children: ReactNode; className?: string }) {
    return (
        <div className={`border-4 border-theme-strong bg-theme-raised shadow-[4px_4px_0px_0px_var(--border-strong)] overflow-hidden ${className || ""}`}>
            <div className="p-4 border-b-4 border-theme-strong bg-theme-sidebar flex items-center gap-3">
                <Icon className="h-5 w-5 text-[#ccff00]" />
                <p className="font-black uppercase tracking-widest text-sm font-['Syncopate'] text-theme">{title}</p>
            </div>
            {children}
        </div>
    );
}
