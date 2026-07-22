import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { motion } from "framer-motion";
import {
    Clock,
    Copy,
    Check,
    AlertCircle,
    Zap,
    Bell,
    ChevronRight,
    Target,
    Flame,
    RefreshCw,
    CreditCard,
} from "lucide-react";
import { useAuth } from "../../lib/useAuth";
import { formatDate } from "../../lib/utils";
import { QRCodeSVG } from "qrcode.react";
import { useState, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";

const motivationalQuotes = [
    { text: "Have a great workout.", author: "KINETIC HQ" },
    { text: "Stay consistent.", author: "KINETIC HQ" },
    { text: "Keep going.", author: "KINETIC HQ" },
    { text: "You got this.", author: "KINETIC HQ" },
    { text: "Do your best.", author: "KINETIC HQ" },
];

function getDailyMotivation() {
    const today = new Date();
    const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
    return motivationalQuotes[dayOfYear % motivationalQuotes.length];
}

function getGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
}

export default function MemberDashboard() {
    const { user } = useAuth();
    const [copied, setCopied] = useState(false);
    const [currentTime, setCurrentTime] = useState(() => Date.now());
    const [dailyMotivation, setDailyMotivation] = useState(getDailyMotivation);

    useEffect(() => {
        const interval = setInterval(() => setCurrentTime(Date.now()), 60000);
        return () => clearInterval(interval);
    }, []);

    const refreshMotivation = () => {
        const randomQuote = motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)];
        setDailyMotivation(randomQuote);
    };

    const member = useQuery(
        api.members.getById,
        user?.memberId ? { memberId: user.memberId, sessionToken: user.sessionToken } : "skip"
    );
    const memberships = useQuery(
        api.memberships.getByMember,
        user?.memberId ? { memberId: user.memberId, sessionToken: user.sessionToken } : "skip"
    );
    const checkIns = useQuery(
        api.checkIns.getByMember,
        user?.memberId ? { memberId: user.memberId, sessionToken: user.sessionToken } : "skip"
    );
    const notifications = useQuery(
        api.notifications.listForMember,
        user?.memberId ? { sessionToken: user.sessionToken } : "skip"
    );
    const unreadCount = notifications?.filter((n) => !n.isRead).length ?? 0;

    const activeMembership = memberships?.find((m) => m.status === "active");

    const daysRemaining = useMemo(() => {
        if (!activeMembership) return 0;
        return Math.max(0, Math.ceil((activeMembership.endDate - currentTime) / (1000 * 60 * 60 * 24)));
    }, [activeMembership, currentTime]);

    const copyCode = () => {
        if (member?.qrCode) {
            navigator.clipboard.writeText(member.qrCode);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    if (!member) {
        return (
            <div className="flex h-[60vh] items-center justify-center">
                <div className="h-10 w-10 rounded-full border-2 border-energy/25 border-t-energy animate-spin" />
            </div>
        );
    }

    const thisMonth = checkIns?.filter((ci) => {
        const d = new Date(ci.timestamp);
        const now = new Date();
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length ?? 0;
    const total = checkIns?.length ?? 0;

    const progressPct = daysRemaining > 0 ? Math.min(100, (daysRemaining / 30) * 100) : 0;

    // mini bar history of last 12 weeks (dummy derived from visit count) — use check-in daily counts
    const byDay = new Map<string, number>();
    (checkIns ?? []).forEach((ci) => {
        const d = new Date(ci.timestamp);
        const k = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
        byDay.set(k, (byDay.get(k) ?? 0) + 1);
    });

    return (
        <div className="max-w-5xl mx-auto space-y-5">
            {/* Greeting */}
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex items-end justify-between flex-wrap gap-3">
                <div>
                    <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight leading-tight">
                        {getGreeting()}, <span className="text-energy">{member.firstName}</span>
                    </h1>
                    <p className="text-theme-secondary text-sm mt-1.5">
                        {total} all-time visits · {thisMonth} this month
                    </p>
                </div>
                <span className="grid h-14 w-14 place-items-center rounded-2xl bg-energy/15 text-energy text-xl font-extrabold">
                    {member.firstName[0]}{member.lastName[0]}
                </span>
            </motion.div>

            {/* Daily motivation */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="card p-5 flex items-center gap-4">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-energy/12 text-energy shrink-0">
                    <Zap className="h-5 w-5" />
                </span>
                <div className="flex-1 min-w-0">
                    <div className="eyebrow">Daily note</div>
                    <p className="text-base font-semibold mt-1">"{dailyMotivation.text}"</p>
                </div>
                <button onClick={refreshMotivation} className="grid h-9 w-9 place-items-center rounded-lg border border-theme hover:border-energy/40 hover:text-energy transition-colors text-theme-muted">
                    <RefreshCw className="h-4 w-4" />
                </button>
            </motion.div>

            {/* Expiry alert */}
            {activeMembership && daysRemaining <= 7 && (
                <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                    <div className="rounded-xl border border-warning/40 bg-warning/10 p-4 flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 shrink-0 mt-0.5 text-warning" />
                        <div>
                            <h3 className="font-bold text-warning">
                                Plan ends {daysRemaining === 0 ? "today" : daysRemaining === 1 ? "tomorrow" : `in ${daysRemaining} days`}
                            </h3>
                            <p className="text-sm text-theme-secondary mt-0.5">
                                Your {activeMembership.planName} plan ends on {formatDate(activeMembership.endDate)}. Renew soon.
                            </p>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Unread messages */}
            {unreadCount > 0 && (
                <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
                    <Link to="/notifications" className="card p-4 flex items-center gap-3 lift">
                        <span className="grid h-10 w-10 place-items-center rounded-xl bg-energy/12 text-energy">
                            <Bell className="h-5 w-5" />
                        </span>
                        <div className="flex-1">
                            <h3 className="font-bold text-energy">{unreadCount} new messages</h3>
                        </div>
                        <ChevronRight className="h-5 w-5 text-energy" />
                    </Link>
                </motion.div>
            )}

            <div className="grid md:grid-cols-[340px_1fr] gap-4">
                {/* QR pass */}
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="card overflow-hidden">
                    <div className="p-5 md:p-6 text-center">
                        <div className="inline-block mb-5">
                            <div className="p-4 rounded-2xl bg-white shadow-[0_18px_40px_-18px_rgba(0,0,0,0.6)]">
                                <QRCodeSVG value={member.qrCode} size={180} level="M" includeMargin={true} fgColor="#0b0d10" bgColor="#ffffff" />
                            </div>
                        </div>
                        <p className="eyebrow mb-2">Your pass</p>
                        <button
                            onClick={copyCode}
                            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-theme bg-bg-input hover:bg-hover-accent transition-colors font-mono group"
                        >
                            <code className="text-sm font-bold tracking-widest">{member.qrCode}</code>
                            {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4 text-theme-muted group-hover:text-energy" />}
                        </button>
                    </div>
                    <div className="border-t border-theme px-4 py-3 text-center text-sm text-theme-muted">
                        Show this at the desk
                    </div>
                </motion.div>

                <div className="flex flex-col gap-4">
                    {/* Membership */}
                    <motion.div initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 }} className="card p-5">
                        <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-theme">
                            <CreditCard className="h-5 w-5 text-energy" />
                            <h3 className="text-sm font-bold">Membership</h3>
                        </div>
                        {activeMembership ? (
                            <div className="space-y-4">
                                <div>
                                    <div className="text-xl font-extrabold tracking-tight">{activeMembership.planName}</div>
                                    <div className="text-sm text-theme-secondary mt-1 font-mono">Valid until {formatDate(activeMembership.endDate)}</div>
                                </div>
                                <div>
                                    <div className="flex items-center justify-between text-xs font-semibold mb-2">
                                        <span className="flex items-center gap-2 text-theme-muted">
                                            <Clock className="h-4 w-4" /> Time left
                                        </span>
                                        <span className="font-mono text-energy">{daysRemaining} days</span>
                                    </div>
                                    <div className="h-2.5 rounded-full bg-hover overflow-hidden">
                                        <div
                                            className="h-full rounded-full transition-all duration-700 bg-energy"
                                            style={{ width: `${progressPct}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="rounded-xl border border-danger/40 bg-danger/10 p-5 text-center">
                                <AlertCircle className="h-8 w-8 text-danger mx-auto mb-2" />
                                <p className="font-bold text-danger">No active plan</p>
                            </div>
                        )}
                    </motion.div>

                    {/* Stats */}
                    <motion.div initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.32 }} className="grid grid-cols-2 gap-4">
                        <div className="stat-tile p-5">
                            <div className="flex items-start justify-between">
                                <span className="text-xs font-medium text-theme-secondary">Total visits</span>
                                <Target className="h-4 w-4 text-energy" />
                            </div>
                            <div className="mt-3 text-3xl font-extrabold tabular-nums leading-none">{total}</div>
                            <div className="mt-3 text-[11px] font-mono text-theme-muted">all-time</div>
                        </div>
                        <div className="stat-tile p-5">
                            <div className="flex items-start justify-between">
                                <span className="text-xs font-medium text-theme-secondary">This month</span>
                                <Flame className="h-4 w-4 text-warning" />
                            </div>
                            <div className="mt-3 text-3xl font-extrabold tabular-nums leading-none">{thisMonth}</div>
                            <div className="mt-3 text-[11px] font-mono text-theme-muted">visits</div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}