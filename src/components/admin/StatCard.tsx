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
    const c = color || "var(--color-energy)";
    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 * delay, ease: [0.22, 1, 0.36, 1] }}
            className="stat-tile p-5"
        >
            <div
                className="grid h-11 w-11 place-items-center mb-4"
                style={{ color: c, background: `${c}1f` }}
            >
                <Icon className="h-5 w-5" />
            </div>
            <p
                className="text-2xl md:text-[1.7rem] font-extrabold tracking-tight leading-none tabular-nums"
                style={{ color: "var(--text)" }}
            >
                {value}
            </p>
            <p className="eyebrow mt-2.5">{label}</p>
        </motion.div>
    );
}

export function MiniMetric({
    icon: Icon,
    label,
    value,
    color,
}: {
    icon: LucideIcon;
    label: string;
    value: number | string;
    color?: string;
}) {
    const c = color || "var(--color-energy)";
    return (
        <div className="p-4 border-l-4" style={{ borderColor: c, background: "var(--bg-card)" }}>
            <Icon className="h-4 w-4" style={{ color: c }} />
            <p
                className="text-xl font-extrabold tracking-tight mt-2.5 leading-none tabular-nums"
                style={{ color: "var(--text)" }}
            >
                {value}
            </p>
            <p className="eyebrow mt-2">{label}</p>
        </div>
    );
}

export function MetricBar({
    label,
    value,
    total,
    color,
}: {
    label: string;
    value: number;
    total: number;
    color?: string;
}) {
    const pct = total > 0 ? Math.round((value / total) * 100) : 0;
    const c = color || "var(--color-energy)";
    return (
        <div>
            <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-theme-secondary">{label}</span>
                <span className="font-mono">
                    {value} <span className="text-theme-muted">· {pct}%</span>
                </span>
            </div>
            <div className="mt-2 h-2 overflow-hidden" style={{ background: "var(--hover)", border: "1px solid var(--border-strong)" }}>
                <div
                    className="h-full transition-all duration-700"
                    style={{ width: `${pct}%`, background: c }}
                />
            </div>
        </div>
    );
}

export function Panel({
    title,
    titleIcon: Icon,
    children,
    className,
}: {
    title: string;
    titleIcon: LucideIcon;
    children: ReactNode;
    className?: string;
}) {
    return (
        <div className={`card overflow-hidden ${className || ""}`}>
            <div className="px-5 py-4 border-b border-theme flex items-center gap-2.5" style={{ borderBottomWidth: 1 }}>
                <Icon className="h-4 w-4" style={{ color: "var(--color-energy)" }} />
                <p className="font-bold text-sm tracking-tight text-theme">{title}</p>
            </div>
            {children}
        </div>
    );
}
