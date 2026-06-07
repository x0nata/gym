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

const typeConfig: Record<NotificationType, { icon: typeof Bell; stripe: string; label: string }> = {
  membership_expiring: { icon: AlertTriangle, stripe: "bg-amber-400", label: "Expiring" },
  membership_expired: { icon: ShieldAlert, stripe: "bg-red-500", label: "Expired" },
  check_in: { icon: ScanLine, stripe: "bg-emerald-500", label: "Check-in" },
  welcome: { icon: UserPlus, stripe: "bg-blue-500", label: "Welcome" },
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
      setError(
        toDisplayError(err, {
          title: "Update failed",
          fallbackMessage: "Could not mark alerts as read.",
        })
      );
    }
  };

  if (notifications === undefined) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-12 w-12 border-4 border-theme-strong border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 font-['Outfit']">
      {error && <DetailedErrorPanel error={error} />}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="border-4 border-theme-strong bg-theme-raised shadow-[4px_4px_0px_0px_var(--border-strong)]"
      >
        <div className="p-4 md:p-6 md:p-8 border-b-4 border-theme-strong bg-theme-sidebar text-theme flex flex-wrap items-center gap-3 md:gap-4">
            <div className="flex items-center gap-3 md:gap-4">
              <div className="h-10 w-10 md:h-12 md:w-12 bg-indigo-500/10 border-2 border-theme-strong text-indigo-500 flex items-center justify-center shrink-0">
                <MessageSquare className="h-5 w-5 md:h-6 md:w-6" />
              </div>
              <div>
                <p className="text-[10px] md:text-[10px] font-black uppercase tracking-[0.2em] text-indigo-500">Alerts</p>
                <h1 className="text-xl md:text-2xl font-black uppercase font-['Syncopate']">{isMember ? "Member alerts" : "Gym alerts"}</h1>
              </div>
            </div>
            <div className="flex items-center gap-2 md:gap-3 ml-auto">
              <div className="px-2 md:px-3 py-1 md:py-2 border-2 border-theme-strong text-[10px] md:text-xs font-black uppercase tracking-widest text-theme-muted">
                {unreadCount} unread
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={() => {
                    void markAllRead();
                  }}
                  className="px-3 md:px-4 py-1.5 md:py-2 border-2 border-theme-strong bg-indigo-500 text-white text-[10px] md:text-xs font-black uppercase tracking-widest hover:bg-indigo-600 transition-colors inline-flex items-center gap-1 md:gap-2"
                >
                  <CheckCheck className="h-3.5 w-3.5 md:h-4 md:w-4" />
                  <span className="hidden sm:inline">Mark all read</span>
                  <span className="sm:hidden">Read</span>
                </button>
              )}
            </div>
          </div>
        </motion.section>

      <section className="border-4 border-theme-strong bg-theme-raised shadow-[4px_4px_0px_0px_var(--border-strong)] overflow-hidden">
        <div className="p-4 border-b-4 border-theme-strong bg-theme-sidebar flex items-center justify-between">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-600">Live alerts</p>
          <p className="text-xs font-bold uppercase text-theme-muted">Tap to mark read</p>
        </div>

        {notifications.length === 0 ? (
          <div className="py-20 text-center">
            <BellOff className="h-10 w-10 mx-auto text-theme-muted" />
            <p className="mt-3 font-black uppercase text-theme-muted tracking-wider">No alerts yet</p>
          </div>
        ) : (
          <div>
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
                        setError(
                          toDisplayError(err, {
                            title: "Update failed",
                            fallbackMessage: "Could not mark this alert as read.",
                          })
                        );
                      });
                    }
                  }}
                  className="w-full text-left border-b-2 border-theme-strong/10 last:border-b-0 hover:bg-theme-sidebar transition-colors"
                >
                  <div className="flex items-stretch">
                    <div className={`w-2 ${config.stripe}`} />
                    <div className="flex-1 p-4 md:p-5">
                      <div className="flex items-start gap-3">
                        <div className="h-10 w-10 border-2 border-theme-strong bg-theme-raised flex items-center justify-center shrink-0">
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-black uppercase text-sm tracking-wide text-theme">{notif.title}</p>
                            <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 bg-theme-sidebar border border-theme-strong">
                              {config.label}
                            </span>
                            {!notif.isRead && <Circle className="h-2.5 w-2.5 fill-[#ccff00] text-[#ccff00]" />}
                          </div>
                          <p className="mt-1 text-sm font-medium text-theme-muted">{notif.message}</p>
                          <p className="mt-2 text-[11px] font-bold uppercase tracking-wider text-theme-muted inline-flex items-center gap-1.5">
                            <Clock3 className="h-3.5 w-3.5" />
                            {formatTimeAgo(notif.createdAt)}
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
