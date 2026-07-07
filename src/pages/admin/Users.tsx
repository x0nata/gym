import { useQuery, useMutation } from "convex/react";
import { motion } from "framer-motion";
import { Users, UserCheck, UserX, Shield, PersonStanding, UserCog } from "lucide-react";
import { api } from "../../../convex/_generated/api";
import { useAuth } from "../../lib/useAuth";
import { useState } from "react";
import { ConfirmAction } from "../../components/admin/ConfirmAction";

type RoleFilter = "all" | "gym" | "member" | "coach" | "superadmin";

export default function AdminUsers() {
    const { user } = useAuth();
    const sessionToken = user?.sessionToken;
    const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
    const [search, setSearch] = useState("");

    const roleParam = roleFilter === "all" ? undefined : roleFilter;
    const users = useQuery(api.admin.listUsers, sessionToken ? { sessionToken, role: roleParam as never, search: search || undefined } : "skip");

    if (!users) {
        return (
            <div className="flex h-[60vh] items-center justify-center">
                <div className="h-12 w-12 border-4 border-theme-strong border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    const roleFilters: { value: RoleFilter; label: string; icon: typeof Users }[] = [
        { value: "all", label: "All", icon: Users },
        { value: "superadmin", label: "Admins", icon: Shield },
        { value: "gym", label: "Gym Staff", icon: UserCog },
        { value: "coach", label: "Coaches", icon: PersonStanding },
        { value: "member", label: "Members", icon: UserCheck },
    ];

    return (
        <div className="space-y-6 font-['Outfit']">
            <motion.section
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                className="border-4 border-theme-strong bg-theme-raised shadow-[4px_4px_0px_0px_var(--border-strong)]"
            >
                <div className="p-6 border-b-4 border-theme-strong bg-theme-sidebar flex items-center gap-4">
                    <div className="h-12 w-12 border-2 border-[#ccff00] bg-theme-raised text-[#ccff00] flex items-center justify-center">
                        <Users className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="text-[10px] uppercase font-black tracking-[0.2em] text-theme-muted">User Management</p>
                        <h1 className="text-2xl md:text-3xl font-black uppercase font-['Syncopate'] text-theme">Users</h1>
                    </div>
                </div>
            </motion.section>

            <div className="flex gap-2 flex-wrap">
                {roleFilters.map((f) => (
                    <button
                        key={f.value}
                        onClick={() => setRoleFilter(f.value)}
                        className={`flex items-center gap-1.5 px-3 py-2 text-xs font-black uppercase tracking-wider border-2 transition-all ${
                            roleFilter === f.value
                                ? "border-[#ccff00] bg-[#ccff00]/10 text-[#ccff00] shadow-[2px_2px_0px_0px_#ccff00]"
                                : "border-theme text-theme-muted hover:border-theme hover:text-theme"
                        }`}
                    >
                        <f.icon className="h-3.5 w-3.5" />
                        {f.label}
                    </button>
                ))}
            </div>

            <div className="mb-4 relative">
                <input
                    type="text"
                    placeholder="Search by email..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-theme-strong bg-theme-sidebar text-theme font-bold uppercase tracking-wider text-sm placeholder:text-theme-muted focus:border-[#ccff00] focus:outline-none"
                />
            </div>

            <div className="border-4 border-theme-strong bg-theme-raised shadow-[4px_4px_0px_0px_var(--border-strong)] overflow-hidden">
                {users.length === 0 ? (
                    <div className="p-10 text-center text-theme-muted font-black uppercase tracking-wider">No users found.</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b-4 border-theme-strong bg-theme-sidebar">
                                    <th className="px-4 py-3 text-left text-xs font-black uppercase tracking-[0.2em] text-theme-muted">User</th>
                                    <th className="px-4 py-3 text-left text-xs font-black uppercase tracking-[0.2em] text-theme-muted">Role</th>
                                    <th className="px-4 py-3 text-left text-xs font-black uppercase tracking-[0.2em] text-theme-muted">Profile</th>
                                    <th className="px-4 py-3 text-left text-xs font-black uppercase tracking-[0.2em] text-theme-muted">Status</th>
                                    <th className="px-4 py-3 text-right text-xs font-black uppercase tracking-[0.2em] text-theme-muted">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y-2 divide-theme-strong">
                                {users.map((entry, idx) => (
                                    <UserRow
                                        key={idx}
                                        entry={entry}
                                        sessionToken={sessionToken!}
                                    />
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {users.length > 0 && (
                <p className="mt-2 text-xs font-bold uppercase tracking-wider text-theme-muted">
                    {users.length} {users.length === 1 ? "user" : "users"}
                </p>
            )}
        </div>
    );
}

function UserRow({ entry, sessionToken }: { entry: { user: { _id: string; email: string; role: string }; profile: Record<string, unknown> | null; profileName: string }; sessionToken: string }) {
    const revokeSessions = useMutation(api.admin.revokeUserSessions);
    const setMemberActive = useMutation(api.admin.setMemberActive);
    const setCoachActive = useMutation(api.admin.setCoachActive);
    const setGymActive = useMutation(api.admin.setGymActive);

    const { user: u, profile, profileName } = entry;

    const roleColor = {
        superadmin: "text-[#ccff00] border-[#ccff00]",
        gym: "text-indigo-500 border-indigo-500",
        coach: "text-amber-500 border-amber-500",
        member: "text-sky-500 border-sky-500",
    }[u.role] || "text-theme-muted border-theme";

    const profileActive = profile ? (profile as { isActive?: boolean }).isActive : undefined;

    const canToggle = u.role === "member" && profile?._id
        ? () => setMemberActive({ sessionToken, memberId: profile._id as string as never, isActive: !profileActive })
        : u.role === "coach" && profile?._id
            ? () => setCoachActive({ sessionToken, coachId: profile._id as string as never, isActive: !profileActive })
            : u.role === "gym" && profile?._id
                ? () => setGymActive({ sessionToken, gymId: profile._id as string as never, isActive: !profileActive })
                : null;

    return (
        <tr className="hover:bg-theme-sidebar transition-colors">
            <td className="px-4 py-3">
                <p className="font-black uppercase text-sm text-theme">{u.email}</p>
                <p className="text-xs font-bold text-theme-muted">{profileName || "—"}</p>
            </td>
            <td className="px-4 py-3">
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 border-2 text-xs font-black uppercase tracking-wider ${roleColor}`}>
                    {u.role}
                </span>
            </td>
            <td className="px-4 py-3">
                <span className="text-xs font-bold uppercase text-theme-muted">
                    {profileName || "—"}
                </span>
            </td>
            <td className="px-4 py-3">
                {u.role === "superadmin" ? (
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#ccff00] uppercase">
                        <span className="h-2 w-2 rounded-full bg-[#ccff00]" />
                        Active
                    </span>
                ) : profileActive !== undefined ? (
                    <span className={`inline-flex items-center gap-1.5 text-xs font-bold uppercase ${profileActive ? "text-green-500" : "text-red-500"}`}>
                        <span className={`h-2 w-2 rounded-full ${profileActive ? "bg-green-500" : "bg-red-500"}`} />
                        {profileActive ? "Active" : "Inactive"}
                    </span>
                ) : (
                    <span className="text-xs font-bold text-theme-muted">—</span>
                )}
            </td>
            <td className="px-4 py-3 text-right">
                <div className="flex items-center justify-end gap-2">
                    {canToggle && (
                        <ConfirmAction
                            title={profileActive ? "Suspend" : "Activate"}
                            message={profileActive ? `Suspend ${profileName || u.email}?` : `Activate ${profileName || u.email}?`}
                            variant={profileActive ? "danger" : "default"}
                            onConfirm={canToggle}
                            trigger={
                                <span className={`inline-flex items-center gap-1 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider border-2 cursor-pointer transition-all ${
                                    profileActive
                                        ? "border-red-500/50 bg-red-500/10 text-red-500 hover:bg-red-500/20"
                                        : "border-green-500/50 bg-green-500/10 text-green-500 hover:bg-green-500/20"
                                }`}>
                                    <UserX className="h-3 w-3" />
                                    {profileActive ? "Suspend" : "Activate"}
                                </span>
                            }
                        />
                    )}
                    <ConfirmAction
                        title="Revoke Sessions"
                        message={`Force logout of ${u.email}? All their sessions will be revoked.`}
                        variant="warning"
                        onConfirm={() => revokeSessions({ sessionToken, userId: u._id as never })}
                        trigger={
                            <span className="inline-flex items-center gap-1 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider border-2 border-amber-500/50 bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 cursor-pointer transition-all">
                                <UserX className="h-3 w-3" />
                                Logout
                            </span>
                        }
                    />
                </div>
            </td>
        </tr>
    );
}
