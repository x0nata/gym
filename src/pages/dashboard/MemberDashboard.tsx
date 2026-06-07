import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { motion } from "framer-motion";
import {
    CreditCard,
    Clock,
    Copy,
    Check,
    AlertCircle,
    Zap,
    Bell,
    ChevronRight,
    Target,
    Flame,
    RefreshCw
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
    { text: "Do your best.", author: "KINETIC HQ" }
];

function getDailyMotivation(): { text: string; author: string } {
    const today = new Date();
    const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
    return motivationalQuotes[dayOfYear % motivationalQuotes.length];
}

function getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return "MORNING";
    if (hour < 17) return "DAY";
    return "EVENING";
}

export default function MemberDashboard() {
    const { user } = useAuth();
    const [copied, setCopied] = useState(false);
    const [currentTime, setCurrentTime] = useState(() => Date.now());
    const [dailyMotivation, setDailyMotivation] = useState(getDailyMotivation);

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentTime(Date.now());
        }, 60000);
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
    const unreadCount = notifications?.filter(n => !n.isRead).length ?? 0;

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
                <Zap className="h-10 w-10 text-[#ccff00] animate-pulse fill-black stroke-black stroke-2" />
            </div>
        );
    }

    const stats = [
        { label: "Total Visits", value: checkIns?.length ?? 0, icon: Target },
        { label: "This Month", value: checkIns?.filter(ci => {
            const ciDate = new Date(ci.timestamp);
            const now = new Date();
            return ciDate.getMonth() === now.getMonth() && ciDate.getFullYear() === now.getFullYear();
        }).length ?? 0, icon: Flame },
    ];

    return (
        <div className="max-w-4xl mx-auto space-y-6 relative font-['Outfit']">
            
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between border-b-4 border-theme-strong pb-4"
            >
                <div>
                    <p className="text-[9px] md:text-xs font-black uppercase tracking-widest text-indigo-500 bg-indigo-500/10 px-2 py-1 inline-block mb-2 border-2 border-indigo-500">
                        My page
                    </p>
                    <h1 className="text-2xl md:text-3xl lg:text-5xl font-black uppercase font-['Syncopate'] text-theme tracking-tighter">
                        {getGreeting()} <br /> <span className="text-transparent bg-clip-text bg-gradient-to-r from-theme to-theme-muted">{member.firstName}</span>
                    </h1>
                </div>
                <div className="h-12 w-12 md:h-16 md:w-16 border-4 border-theme-strong bg-indigo-500 flex items-center justify-center font-black text-lg md:text-2xl shadow-[4px_4px_0px_0px_var(--border-strong)] text-white">
                    {member.firstName[0]}{member.lastName[0]}
                </div>
            </motion.div>

            {/* Daily Motivation Card */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
                className="border-4 border-theme-strong p-4 bg-theme-raised shadow-[4px_4px_0px_0px_var(--border-strong)] relative overflow-hidden group text-theme"
            >
                <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/20 -bl-full -z-10 group-hover:scale-150 transition-transform duration-500" />
                <div className="flex items-center gap-4 relative z-10">
                    <div className="h-10 w-10 border-4 border-theme-strong bg-theme-sidebar text-indigo-500 flex items-center justify-center shrink-0 shadow-[2px_2px_0px_0px_var(--border-strong)]">
                        <Zap className="h-5 w-5 fill-current" />
                    </div>
                    <div className="flex-1 flex items-center justify-between">
                        <div>
                            <h3 className="font-black uppercase tracking-widest text-xs mb-1">Daily quote</h3>
                            <div className="flex items-center gap-2">
                                <p className="text-lg font-black font-['Syncopate'] uppercase italic leading-none">
                                    "{dailyMotivation.text}"
                                </p>
                                <p className="text-[10px] font-bold text-theme-muted uppercase tracking-widest mt-1">
                                    — {dailyMotivation.author}
                                </p>
                            </div>
                        </div>
                        <button onClick={refreshMotivation} className="p-2 hover:bg-theme-sidebar hover:text-indigo-500 transition-colors border-2 border-transparent hover:border-theme-strong">
                            <RefreshCw className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            </motion.div>

            {/* Alerts */}
            {activeMembership && daysRemaining <= 7 && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                    <div className="border-4 border-red-500 bg-red-500/10 p-4 shadow-[4px_4px_0px_0px_rgba(239,68,68,0.5)]">
                        <div className="flex items-start gap-3">
                            <AlertCircle className="h-6 w-6 shrink-0 mt-0.5 text-red-500" />
                            <div>
                                <h3 className="font-black uppercase tracking-widest text-red-500">
                                    Plan ends {daysRemaining === 0 ? 'TODAY' : daysRemaining === 1 ? 'TOMORROW' : `IN ${daysRemaining} DAYS`}
                                </h3>
                                <p className="text-sm mt-1 font-bold text-theme">
                                    Your {activeMembership.planName} plan {daysRemaining === 0 ? 'ends today' : `ends on ${formatDate(activeMembership.endDate)}`}. Renew soon.
                                </p>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}

            {unreadCount > 0 && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
                    <Link to="/notifications" className="block border-4 border-theme-strong bg-indigo-500/10 p-4 shadow-[4px_4px_0px_0px_var(--border-strong)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all">
                        <div className="flex items-center gap-3">
                            <Bell className="h-6 w-6 text-indigo-500 fill-indigo-500/20" />
                            <div className="flex-1">
                                <h3 className="font-black uppercase tracking-widest text-indigo-500">{unreadCount} New messages</h3>
                            </div>
                            <ChevronRight className="h-6 w-6 text-indigo-500" />
                        </div>
                    </Link>
                </motion.div>
            )}

            <div className="grid md:grid-cols-[340px_1fr] gap-4 md:gap-6">
                {/* QR Code Card */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                    <div className="border-4 border-theme-strong bg-theme-raised shadow-[6px_6px_0px_0px_var(--border-strong)] relative">
                        <div className="p-4 md:p-6 text-center">
                            <div className="inline-block mb-4 md:mb-6">
                                <div className="p-3 md:p-5 border-4 border-theme-strong bg-white shadow-[4px_4px_0px_0px_var(--border-strong)] inline-block">
                                    <QRCodeSVG value={member.qrCode} size={180} level="M" includeMargin={true} fgColor="#000000" bgColor="#ffffff" />
                                </div>
                            </div>

                            <div className="w-full">
                                <p className="text-xs font-black uppercase tracking-widest text-theme-muted mb-2">Your code</p>
                                <button onClick={copyCode} className="w-full flex items-center justify-center gap-2 py-3 border-4 border-theme-strong bg-theme-sidebar hover:bg-theme-raised transition-colors font-bold group text-theme shadow-[2px_2px_0px_0px_var(--border-strong)]">
                                    <code className="text-lg font-black tracking-widest">{member.qrCode}</code>
                                    {copied ? <Check className="h-5 w-5 text-indigo-500" /> : <Copy className="h-5 w-5 text-theme-muted group-hover:text-indigo-500" />}
                                </button>
                            </div>
                        </div>
                        <div className="border-t-4 border-theme-strong bg-theme-sidebar text-theme py-3 text-center text-sm font-black uppercase tracking-widest">
                            Show this at the desk
                        </div>
                    </div>
                </motion.div>

                <div className="space-y-6">
                    {/* Membership Card */}
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 }} className="border-4 border-theme-strong p-6 bg-theme-raised shadow-[6px_6px_0px_0px_var(--border-strong)] text-theme">
                        <div className="flex items-center gap-3 mb-6 border-b-4 border-theme-strong pb-4">
                            <CreditCard className="h-6 w-6" />
                            <div>
                                <h3 className="font-black uppercase tracking-widest text-lg">Plan</h3>
                            </div>
                        </div>

                        {activeMembership ? (
                            <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="font-black text-2xl uppercase tracking-wider">{activeMembership.planName}</div>
                                        <div className="text-sm font-bold text-theme-muted uppercase tracking-widest">
                                            Good until {formatDate(activeMembership.endDate)}
                                        </div>
                                    </div>
                                </div>
                                
                                <div>
                                    <div className="flex items-center justify-between text-xs font-black uppercase tracking-widest mb-2">
                                        <span className="flex items-center gap-2 text-theme-muted">
                                            <Clock className="h-4 w-4" /> Time left
                                        </span>
                                        <span className="text-theme">{daysRemaining} days left</span>
                                    </div>
                                    <div className="h-4 border-2 border-theme-strong bg-theme-sidebar w-full overflow-hidden">
                                        <div className="h-full bg-indigo-500 transition-all border-r-2 border-theme-strong relative overflow-hidden" style={{ width: `${daysRemaining > 0 ? Math.min(100, (daysRemaining / 30) * 100) : 0}%` }}>
                                            <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.2)_25%,rgba(255,255,255,0.2)_50%,transparent_50%,transparent_75%,rgba(255,255,255,0.2)_75%,rgba(255,255,255,0.2)_100%)] [background-size:20px_20px] animate-[slide_1s_linear_infinite]" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="p-6 border-4 border-red-500 bg-red-500/10 text-center shadow-[4px_4px_0px_0px_rgba(239,68,68,0.5)]">
                                <AlertCircle className="h-10 w-10 text-red-500 mx-auto mb-3" />
                                <p className="font-black text-xl uppercase tracking-widest text-red-500">No active plan</p>
                            </div>
                        )}
                    </motion.div>

                    {/* Stats */}
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }} className="grid grid-cols-2 gap-4">
                        {stats.map((stat) => (
                            <div key={stat.label} className="border-4 border-theme-strong bg-theme-raised p-5 text-center shadow-[4px_4px_0px_0px_var(--border-strong)] relative overflow-hidden group hover:bg-theme-sidebar transition-colors text-theme">
                                <stat.icon className="h-8 w-8 text-theme group-hover:text-indigo-500 mx-auto mb-3 transition-colors" />
                                <div className="text-4xl font-black font-['Syncopate'] text-theme mb-1 transition-colors">
                                    {stat.value}
                                </div>
                                <div className="text-xs font-black uppercase tracking-widest text-theme-muted transition-colors">{stat.label}</div>
                            </div>
                        ))}
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
