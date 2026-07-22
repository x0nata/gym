import { useQuery, useMutation } from "convex/react";
import { motion } from "framer-motion";
import { useState } from "react";
import {
    Bell,
    BellOff,
    CheckCheck,
    AlertTriangle,
    UserPlus,
    ScanLine,
    Clock3,
    ShieldAlert,
    MessageSquare,
    Circle,
} from "lucide-react";
import { api } from "../../convex/_generated/api";
import { formatTimeAgo } from "../lib/utils";
import type { Doc } from "../../convex/_generated/dataModel";
import { useAuth } from "../lib/useAuth";
import { toDisplayError, type AppErrorDetails } from "../lib/errorHandling";
import { DetailedErrorPanel } from "../components/feedback/DetailedErrorPanel";

type NotificationType = Doc<"notifications">["type"];

const typeConfig: Record<NotificationType, { icon: typeof Bell; tone: string; pill: string; label: string }> = {
    membership_expiring: { icon: AlertTriangle, tone: "var(--color-warning)", pill: "pill--warning", label: "Expiring" },
    membership_expired: { icon: ShieldAlert, tone: "var(--color-danger)", pill: "pill--danger", label: "Expired" },
    check_in: { icon: ScanLine, tone: "var(--color-success)", pill: "pill--success", label: "Check-in" },
    welcome: { icon: UserPlus, tone: "var(--color-info)", pill: "pill--info", label: "Welcome" },
};

export default function Notifications() {
    const { user } = useAuth();
    const isMember = user?.role === "member";
    const sessionToken = user?.sessionToken;

    const gymNotifications = useQuery(api.notifications.listForGym, !isMember && sessionToken ? { sessionToken } : "skip");
    const memberNotifications = useQuery(api.notifications.listForMember, isMember && sessionToken ? { sessionToken } : "skip");
    const gymUnreadCount = useQuery(api.notifications.unreadCountForGym, !isMember && sessionToken ? { sessionToken } : "skip");
    const memberUnreadCount = useQuery(api.notifications.unreadCountForMember, isMember && sessionToken ? { sessionToken } : "skip");

    const markAsRead = useMutation(api.notifications.markAsRead);
    const markAllReadForGym = useMutation(api.notifications.markAllReadForGym);
    const markAllReadForMember = useMutation(api.notifications.markAllReadForMember);
    const [error, setError] = useState<AppErrorDetails | null>(null);

    const notifications = isMember ? memberNotifications : gymNotifications;
    const unreadCount = isMember ? (memberUnreadCount ?? 0) : (gymUnreadCount ?? 0);

    const markAllRead = async () => {
        if (!sessionToken) return;
        setError(null);
        try {
            if (isMember) {
                await markAllReadForMember({ sessionToken });
                return;
            }
            await markAllReadForGym({ sessionToken });
        } catch (err) {
            setError(toDisplayError(err, { title: "Update failed", fallbackMessage: "Could not mark alerts as read." }));
        }
    };

    if (notifications === undefined) {
        return (
            <div className="flex h-[60vh] items-center justify-center">
                <div className="h-10 w-10 rounded-full border-2 border-accent/30 border-t-accent-light animate-spin" />
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-5">
            {error && <DetailedErrorPanel error={error} />}

            <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="card overflow-hidden">
                <div className="p-5 md:p-6 border-b border-theme flex flex-wrap items-center gap-3 md:gap-4">
                    <div className="flex items-center gap-3.5">
                        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-accent/15 text-accent-light">
                            <MessageSquare className="h-6 w-6" />
                        </span>
                        <div>
                            <span className="eyebrow">Alerts</span>
                            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight mt-1">{isMember ? "Member alerts" : "Gym alerts"}</h1>
                        </div>
                    </div>
                    <div className="flex items-center gap-2.5 ml-auto">
                        <span className="pill pill--accent">{unreadCount} unread</span>
                        {unreadCount > 0 && (
                            <button onClick={() => void markAllRead()} className="btn btn--primary btn--sm">
                                <CheckCheck className="h-3.5 w-3.5" /> Mark all read
                            </button>
                        )}
                    </div>
                </div>
            </motion.section>

            <section className="card overflow-hidden">
                <div className="p-4 border-b border-theme flex items-center justify-between">
                    <p className="eyebrow">Live alerts</p>
                    <p className="text-xs text-theme-muted">Tap to mark read</p>
                </div>

                {notifications.length === 0 ? (
                    <div className="py-20 text-center text-theme-muted flex flex-col items-center gap-3">
                        <BellOff className="h-10 w-10 opacity-40" />
                        <p className="eyebrow">No alerts yet</p>
                    </div>
                ) : (
                    <div className="divide-y divide-[var(--border)]">
                        {notifications.map((notif) => {
                            const config = typeConfig[notif.type];
                            const Icon = config.icon;
                            return (
                                <button
                                    key={notif._id}
                                    onClick={() => {
                                        if (!notif.isRead && sessionToken) {
                                            setError(null);
                                            void markAsRead({ notificationId: notif._id, sessionToken }).catch((err) => {
                                                setError(toDisplayError(err, { title: "Update failed", fallbackMessage: "Could not mark this alert as read." }));
                                            });
                                        }
                                    }}
                                    className="w-full text-left hover:bg-hover transition-colors"
                                >
                                    <div className="flex items-stretch">
                                        <div className="w-1" style={{ background: config.tone }} />
                                        <div className="flex-1 p-4 md:p-5">
                                            <div className="flex items-start gap-3.5">
                                                <span className="grid h-10 w-10 place-items-center rounded-xl shrink-0" style={{ background: `${config.tone}1f`, color: config.tone }}>
                                                    <Icon className="h-5 w-5" />
                                                </span>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <p className="font-semibold tracking-tight">{notif.title}</p>
                                                        <span className={`pill ${config.pill}`}>{config.label}</span>
                                                        {!notif.isRead && <Circle className="h-2 w-2 fill-accent text-accent" />}
                                                    </div>
                                                    <p className="mt-1 text-sm text-theme-secondary leading-relaxed">{notif.message}</p>
                                                    <p className="mt-2 text-xs text-theme-muted inline-flex items-center gap-1.5">
                                                        <Clock3 className="h-3.5 w-3.5" /> {formatTimeAgo(notif.createdAt)}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                )}
            </section>
        </div>
    );
}
