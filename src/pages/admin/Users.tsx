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
                <div className="h-10 w-10 rounded-full border-2 border-energy/30 border-t-energy animate-spin" />
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
        <div className="space-y-5">
            <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="card overflow-hidden">
                <div className="p-5 md:p-6 border-b border-theme flex items-center gap-3.5">
                    <span className="grid h-12 w-12 place-items-center rounded-2xl bg-energy/15 text-energy">
                        <Users className="h-6 w-6" />
                    </span>
                    <div>
                        <span className="eyebrow">User management</span>
                        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight mt-1">Users</h1>
                    </div>
                </div>
            </motion.section>

            <div className="flex gap-2 flex-wrap">
                {roleFilters.map((f) => (
                    <button
                        key={f.value}
                        onClick={() => setRoleFilter(f.value)}
                        className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all border ${
                            roleFilter === f.value
                                ? "border-energy/40 bg-energy/12 text-energy"
                                : "border-theme text-theme-muted hover:text-theme hover:bg-hover"
                        }`}
                    >
                        <f.icon className="h-3.5 w-3.5" />
                        {f.label}
                    </button>
                ))}
            </div>

            <div className="relative">
                <input
                    type="text"
                    placeholder="Search by email…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="field"
                />
            </div>

            <div className="card overflow-hidden">
                {users.length === 0 ? (
                    <div className="p-10 text-center eyebrow">No users found.</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-theme">
                                    <th className="px-5 py-3.5 text-left eyebrow">User</th>
                                    <th className="px-5 py-3.5 text-left eyebrow">Role</th>
                                    <th className="px-5 py-3.5 text-left eyebrow">Profile</th>
                                    <th className="px-5 py-3.5 text-left eyebrow">Status</th>
                                    <th className="px-5 py-3.5 text-right eyebrow">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--border)]">
                                {users.map((entry, idx) => (
                                    <UserRow key={idx} entry={entry} sessionToken={sessionToken!} />
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {users.length > 0 && (
                <p className="text-xs text-theme-muted">{users.length} {users.length === 1 ? "user" : "users"}</p>
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

    const rolePill: Record<string, string> = {
        superadmin: "pill--energy",
        gym: "pill--accent",
        coach: "pill--warning",
        member: "pill--info",
    };
    const rolePillClass = rolePill[u.role] || "";

    const profileActive = profile ? (profile as { isActive?: boolean }).isActive : undefined;

    const canToggle = u.role === "member" && profile?._id
        ? () => setMemberActive({ sessionToken, memberId: profile._id as string as never, isActive: !profileActive })
        : u.role === "coach" && profile?._id
            ? () => setCoachActive({ sessionToken, coachId: profile._id as string as never, isActive: !profileActive })
            : u.role === "gym" && profile?._id
                ? () => setGymActive({ sessionToken, gymId: profile._id as string as never, isActive: !profileActive })
                : null;

    return (
        <tr className="hover:bg-hover transition-colors">
            <td className="px-5 py-4">
                <p className="font-semibold">{u.email}</p>
                <p className="text-xs text-theme-muted mt-0.5">{profileName || "—"}</p>
            </td>
            <td className="px-5 py-4">
                <span className={`pill capitalize ${rolePillClass}`}>{u.role}</span>
            </td>
            <td className="px-5 py-4">
                <span className="text-sm text-theme-secondary">{profileName || "—"}</span>
            </td>
            <td className="px-5 py-4">
                {u.role === "superadmin" ? (
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-energy">
                        <span className="h-2 w-2 rounded-full bg-energy" /> Active
                    </span>
                ) : profileActive !== undefined ? (
                    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${profileActive ? "text-success" : "text-danger"}`}>
                        <span className={`h-2 w-2 rounded-full ${profileActive ? "bg-success" : "bg-danger"}`} />
                        {profileActive ? "Active" : "Inactive"}
                    </span>
                ) : (
                    <span className="text-xs text-theme-muted">—</span>
                )}
            </td>
            <td className="px-5 py-4 text-right">
                <div className="flex items-center justify-end gap-2">
                    {canToggle && (
                        <ConfirmAction
                            title={profileActive ? "Suspend" : "Activate"}
                            message={profileActive ? `Suspend ${profileName || u.email}?` : `Activate ${profileName || u.email}?`}
                            variant={profileActive ? "danger" : "default"}
                            onConfirm={canToggle}
                            trigger={
                                <span className={`pill cursor-pointer transition-all ${profileActive ? "pill--danger hover:!bg-danger/20" : "pill--success hover:!bg-success/20"}`}>
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
                            <span className="pill pill--warning cursor-pointer hover:!bg-warning/20 transition-all">
                                <UserX className="h-3 w-3" /> Logout
                            </span>
                        }
                    />
                </div>
            </td>
        </tr>
    );
}
