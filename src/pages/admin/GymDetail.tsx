import { useQuery, useMutation } from "convex/react";
import { motion } from "framer-motion";
import { Building2, Users, Activity, DollarSign, CalendarClock, UserCheck, MapPin, Phone, Mail, ShieldCheck } from "lucide-react";
import { useParams, Link } from "react-router-dom";
import { api } from "../../../convex/_generated/api";
import { useAuth } from "../../lib/useAuth";
import { MiniMetric, MetricBar, Panel } from "../../components/admin/StatCard";
import { ConfirmAction } from "../../components/admin/ConfirmAction";
import { useState } from "react";

export default function AdminGymDetail() {
    const { id } = useParams<{ id: string }>();
    const { user } = useAuth();
    const sessionToken = user?.sessionToken;
    const detail = useQuery(api.admin.getGymDetail, sessionToken && id ? { sessionToken, gymId: id as never } : "skip");
    const setActive = useMutation(api.admin.setGymActive);
    const updateGym = useMutation(api.admin.updateGym);
    const [editing, setEditing] = useState(false);
    const [form, setForm] = useState({ name: "", phone: "", address: "", city: "", description: "" });
    const [editMsg, setEditMsg] = useState("");

    if (!detail) {
        return (
            <div className="flex h-[60vh] items-center justify-center">
                <div className="h-12 w-12 border-4 border-theme-strong border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    const { gym } = detail;

    const startEdit = () => {
        setForm({
            name: gym.name,
            phone: gym.phone,
            address: gym.address,
            city: gym.city,
            description: gym.description || "",
        });
        setEditing(true);
        setEditMsg("");
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await updateGym({
                sessionToken: sessionToken!,
                gymId: gym._id,
                name: form.name,
                phone: form.phone,
                address: form.address,
                city: form.city,
                description: form.description || undefined,
            });
            setEditing(false);
        } catch (err) {
            setEditMsg(err instanceof Error ? err.message : "Update failed.");
        }
    };

    return (
        <div className="space-y-6 font-['Outfit']">
            <motion.section
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                className="border-4 border-theme-strong bg-theme-raised shadow-[4px_4px_0px_0px_var(--border-strong)]"
            >
                <div className="p-6 border-b-4 border-theme-strong bg-theme-sidebar flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-4">
                        <div className={`h-12 w-12 border-2 bg-theme-raised flex items-center justify-center ${gym.isActive ? "border-[#ccff00] text-[#ccff00]" : "border-red-500 text-red-500"}`}>
                            <Building2 className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-[10px] uppercase font-black tracking-[0.2em] text-theme-muted">
                                <Link to="/admin/gyms" className="text-[#ccff00] hover:underline">Gyms</Link> / {gym.name}
                            </p>
                            <h1 className="text-2xl md:text-3xl font-black uppercase font-['Syncopate'] text-theme">{gym.name}</h1>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 flex-wrap">
                        <button
                            onClick={startEdit}
                            className="px-4 py-2.5 border-2 border-[#ccff00] bg-[#ccff00]/10 text-[#ccff00] font-black uppercase tracking-widest text-xs hover:bg-[#ccff00] hover:text-[#000000] transition-colors shadow-[3px_3px_0px_0px_#ccff00]"
                        >
                            Edit Profile
                        </button>
                        <ConfirmAction
                            title={gym.isActive ? "Suspend Gym" : "Activate Gym"}
                            message={gym.isActive
                                ? `Suspend "${gym.name}"? All staff will lose access.`
                                : `Reactivate "${gym.name}"? Staff will regain access.`}
                            variant={gym.isActive ? "danger" : "default"}
                            onConfirm={() => setActive({ sessionToken: sessionToken!, gymId: gym._id, isActive: !gym.isActive })}
                            trigger={
                                <span className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs font-black uppercase tracking-widest border-2 cursor-pointer transition-all shadow-[3px_3px_0px_0px_var(--border-strong)] ${
                                    gym.isActive
                                        ? "border-red-500/50 bg-red-500/10 text-red-500 hover:bg-red-500"
                                        : "border-green-500/50 bg-green-500/10 text-green-500 hover:bg-green-500/20"
                                }`}>
                                    {gym.isActive ? "Suspend" : "Activate"}
                                </span>
                            }
                        />
                    </div>
                </div>
            </motion.section>

            {editing && (
                <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="border-4 border-[#ccff00] bg-theme-raised p-6 shadow-[4px_4px_0px_0px_#ccff00]"
                >
                    <h3 className="text-lg font-black uppercase tracking-widest font-['Syncopate'] text-[#ccff00] mb-4">Edit Gym Profile</h3>
                    {editMsg && (
                        <div className="mb-4 p-3 border-2 border-red-500 bg-red-500/10 text-red-500 font-bold uppercase text-xs tracking-wider">{editMsg}</div>
                    )}
                    <form onSubmit={handleUpdate} className="grid md:grid-cols-2 gap-4">
                        {(["name", "email", "phone", "address", "city"] as const).map((field) => (
                            <div key={field}>
                                <label className="text-xs font-black uppercase tracking-wider text-theme-muted mb-1.5 block">{field}</label>
                                <input
                                    type={field === "email" ? "email" : "text"}
                                    value={field === "email" ? gym.email : form[field]}
                                    onChange={(e) => field !== "email" && setForm((f) => ({ ...f, [field]: e.target.value }))}
                                    disabled={field === "email"}
                                    required
                                    className="w-full px-3 py-2.5 border-2 border-theme-strong bg-theme-sidebar text-theme font-bold text-sm placeholder:text-theme-muted focus:border-[#ccff00] focus:outline-none disabled:opacity-50"
                                />
                            </div>
                        ))}
                        <div className="md:col-span-2">
                            <label className="text-xs font-black uppercase tracking-wider text-theme-muted mb-1.5 block">Description</label>
                            <input
                                type="text"
                                value={form.description}
                                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                                className="w-full px-3 py-2.5 border-2 border-theme-strong bg-theme-sidebar text-theme font-bold text-sm placeholder:text-theme-muted focus:border-[#ccff00] focus:outline-none"
                            />
                        </div>
                        <div className="md:col-span-2 flex gap-3">
                            <button type="submit" className="flex-1 px-4 py-3 border-2 border-[#ccff00] bg-[#ccff00] text-[#000000] font-black uppercase tracking-widest text-sm hover:bg-[#b3e600] transition-colors shadow-[4px_4px_0px_0px_#ccff00]">
                                Save Changes
                            </button>
                            <button type="button" onClick={() => setEditing(false)} className="px-4 py-3 border-2 border-theme font-black uppercase tracking-widest text-sm text-theme hover:bg-theme transition-colors">
                                Cancel
                            </button>
                        </div>
                    </form>
                </motion.div>
            )}

            <div className="flex items-center gap-3 flex-wrap text-sm font-bold text-theme-muted uppercase tracking-wider">
                <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4 text-theme" /> {gym.city}</span>
                <span className="flex items-center gap-1.5"><Phone className="h-4 w-4 text-theme" /> {gym.phone}</span>
                <span className="flex items-center gap-1.5"><Mail className="h-4 w-4 text-theme" /> {gym.email}</span>
                <span className={`flex items-center gap-1.5 ${gym.isActive ? "text-green-500" : "text-red-500"}`}>
                    <ShieldCheck className="h-4 w-4" />
                    {gym.isActive ? "Active" : "Suspended"}
                </span>
            </div>

            <section className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                <MiniMetric icon={Users} label="Members" value={detail.memberCount} color="#6366F1" />
                <MiniMetric icon={UserCheck} label="Active" value={detail.activeMembers} color="#10B981" />
                <MiniMetric icon={DollarSign} label="Revenue" value={`ETB ${detail.revenue.toLocaleString()}` as unknown as number} color="#ccff00" />
                <MiniMetric icon={CalendarClock} label="Expiring" value={detail.expiringMemberships} color="#EF4444" />
            </section>

            <div className="grid lg:grid-cols-2 gap-4 md:gap-4">
                <Panel title="Member Breakdown" titleIcon={Users}>
                    <div className="p-5 space-y-3">
                        <MetricBar label="Active members" value={detail.activeMembers} total={detail.memberCount} color="#10B981" />
                        <MetricBar label="Inactive members" value={Math.max(0, detail.memberCount - detail.activeMembers)} total={detail.memberCount} color="#EF4444" />
                    </div>
                </Panel>

                <Panel title="Recent Members" titleIcon={Users}>
                    {detail.recentMembers.length === 0 ? (
                        <div className="p-6 text-center text-theme-muted font-black uppercase tracking-wider text-sm">No members yet</div>
                    ) : (
                        <div className="divide-y-2 divide-theme-strong max-h-72 overflow-y-auto">
                            {detail.recentMembers.map((m) => (
                                <div key={(m as { _id: string })._id} className="p-3 px-4 flex items-center justify-between">
                                    <div>
                                        <p className="font-black uppercase text-sm text-theme">{(m as { firstName: string; lastName: string }).firstName} {(m as { firstName: string; lastName: string }).lastName}</p>
                                        <p className="text-xs font-bold text-theme-muted uppercase tracking-wider">{(m as { email: string }).email}</p>
                                    </div>
                                    <div className={`h-2 w-2 rounded-full ${(m as { isActive: boolean }).isActive ? "bg-green-500" : "bg-red-500"}`} />
                                </div>
                            ))}
                        </div>
                    )}
                </Panel>
            </div>

            <Panel title="Recent Check-ins" titleIcon={Activity}>
                {detail.recentCheckIns.length === 0 ? (
                    <div className="p-6 text-center text-theme-muted font-black uppercase tracking-wider text-sm">No check-ins today</div>
                ) : (
                    <div className="divide-y-2 divide-theme-strong max-h-80 overflow-y-auto">
                        {detail.recentCheckIns.map((ci) => (
                            <div key={(ci as { _id: string })._id} className="p-3 px-4 flex items-center justify-between">
                                <div>
                                    <p className="font-black uppercase text-sm text-theme">Member check-in</p>
                                    <p className="text-xs font-bold text-theme-muted uppercase tracking-wider">
                                        {new Date((ci as { timestamp: number }).timestamp).toLocaleString()}
                                    </p>
                                </div>
                                <span className="text-xs font-bold uppercase text-[#ccff00]">{(ci as { date: string }).date}</span>
                            </div>
                        ))}
                    </div>
                )}
            </Panel>
        </div>
    );
}
