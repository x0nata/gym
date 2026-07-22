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
                <div className="h-10 w-10 rounded-full border-2 border-energy/30 border-t-energy animate-spin" />
            </div>
        );
    }

    const { gym } = detail;

    const startEdit = () => {
        setForm({ name: gym.name, phone: gym.phone, address: gym.address, city: gym.city, description: gym.description || "" });
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
        <div className="space-y-5">
            <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="card overflow-hidden">
                <div className="p-5 md:p-6 border-b border-theme flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-3.5">
                        <span className={`grid h-12 w-12 place-items-center rounded-2xl ${gym.isActive ? "bg-energy/15 text-energy" : "bg-danger/15 text-danger"}`}>
                            <Building2 className="h-6 w-6" />
                        </span>
                        <div>
                            <p className="eyebrow">
                                <Link to="/admin/gyms" className="text-energy hover:underline">Gyms</Link> / {gym.name}
                            </p>
                            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight mt-1">{gym.name}</h1>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 flex-wrap">
                        <button onClick={startEdit} className="btn btn--ghost btn--sm">Edit profile</button>
                        <ConfirmAction
                            title={gym.isActive ? "Suspend Gym" : "Activate Gym"}
                            message={gym.isActive ? `Suspend "${gym.name}"? All staff will lose access.` : `Reactivate "${gym.name}"? Staff will regain access.`}
                            variant={gym.isActive ? "danger" : "default"}
                            onConfirm={() => setActive({ sessionToken: sessionToken!, gymId: gym._id, isActive: !gym.isActive })}
                            trigger={
                                <span className={`pill cursor-pointer transition-all ${gym.isActive ? "pill--danger hover:!bg-danger/20" : "pill--success hover:!bg-success/20"}`}>
                                    {gym.isActive ? "Suspend" : "Activate"}
                                </span>
                            }
                        />
                    </div>
                </div>
            </motion.section>

            {editing && (
                <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="card p-5 md:p-6 border-energy/40">
                    <h3 className="font-bold tracking-tight text-energy mb-4">Edit gym profile</h3>
                    {editMsg && <div className="mb-4 rounded-xl border border-danger/40 bg-danger/10 p-3 text-sm text-danger">{editMsg}</div>}
                    <form onSubmit={handleUpdate} className="grid md:grid-cols-2 gap-4">
                        {(["name", "email", "phone", "address", "city"] as const).map((field) => (
                            <div key={field} className="space-y-1.5">
                                <label className="eyebrow">{field}</label>
                                <input
                                    type={field === "email" ? "email" : "text"}
                                    value={field === "email" ? gym.email : form[field]}
                                    onChange={(e) => field !== "email" && setForm((f) => ({ ...f, [field]: e.target.value }))}
                                    disabled={field === "email"}
                                    required
                                    className="field disabled:opacity-50"
                                />
                            </div>
                        ))}
                        <div className="md:col-span-2 space-y-1.5">
                            <label className="eyebrow">Description</label>
                            <input type="text" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} className="field" />
                        </div>
                        <div className="md:col-span-2 flex gap-3">
                            <button type="submit" className="btn btn--energy btn--md flex-1">Save changes</button>
                            <button type="button" onClick={() => setEditing(false)} className="btn btn--ghost btn--md">Cancel</button>
                        </div>
                    </form>
                </motion.div>
            )}

            <div className="flex items-center gap-4 flex-wrap text-sm text-theme-secondary">
                <span className="inline-flex items-center gap-2"><MapPin className="h-4 w-4 text-theme-muted" /> {gym.city}</span>
                <span className="inline-flex items-center gap-2"><Phone className="h-4 w-4 text-theme-muted" /> {gym.phone}</span>
                <span className="inline-flex items-center gap-2"><Mail className="h-4 w-4 text-theme-muted" /> {gym.email}</span>
                <span className={`inline-flex items-center gap-2 font-semibold ${gym.isActive ? "text-success" : "text-danger"}`}>
                    <ShieldCheck className="h-4 w-4" /> {gym.isActive ? "Active" : "Suspended"}
                </span>
            </div>

            <section className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                <MiniMetric icon={Users} label="Members" value={detail.memberCount} color="var(--color-accent-light)" />
                <MiniMetric icon={UserCheck} label="Active" value={detail.activeMembers} color="var(--color-success)" />
                <MiniMetric icon={DollarSign} label="Revenue" value={`ETB ${detail.revenue.toLocaleString()}` as unknown as number} color="var(--color-energy)" />
                <MiniMetric icon={CalendarClock} label="Expiring" value={detail.expiringMemberships} color="var(--color-danger)" />
            </section>

            <div className="grid lg:grid-cols-2 gap-4 md:gap-5">
                <Panel title="Member Breakdown" titleIcon={Users}>
                    <div className="p-5 space-y-4">
                        <MetricBar label="Active members" value={detail.activeMembers} total={detail.memberCount} color="var(--color-success)" />
                        <MetricBar label="Inactive members" value={Math.max(0, detail.memberCount - detail.activeMembers)} total={detail.memberCount} color="var(--color-danger)" />
                    </div>
                </Panel>

                <Panel title="Recent Members" titleIcon={Users}>
                    {detail.recentMembers.length === 0 ? (
                        <div className="p-6 text-center eyebrow">No members yet</div>
                    ) : (
                        <div className="divide-y divide-[var(--border)] max-h-72 overflow-y-auto">
                            {detail.recentMembers.map((m) => (
                                <div key={(m as { _id: string })._id} className="p-3.5 px-5 flex items-center justify-between">
                                    <div>
                                        <p className="font-semibold text-sm">{(m as { firstName: string; lastName: string }).firstName} {(m as { firstName: string; lastName: string }).lastName}</p>
                                        <p className="text-xs text-theme-muted mt-0.5">{(m as { email: string }).email}</p>
                                    </div>
                                    <div className={`h-2 w-2 rounded-full ${(m as { isActive: boolean }).isActive ? "bg-success" : "bg-danger"}`} />
                                </div>
                            ))}
                        </div>
                    )}
                </Panel>
            </div>

            <Panel title="Recent Check-ins" titleIcon={Activity}>
                {detail.recentCheckIns.length === 0 ? (
                    <div className="p-6 text-center eyebrow">No check-ins today</div>
                ) : (
                    <div className="divide-y divide-[var(--border)] max-h-80 overflow-y-auto">
                        {detail.recentCheckIns.map((ci) => (
                            <div key={(ci as { _id: string })._id} className="p-3.5 px-5 flex items-center justify-between">
                                <div>
                                    <p className="font-semibold text-sm">Member check-in</p>
                                    <p className="text-xs text-theme-muted mt-0.5">{new Date((ci as { timestamp: number }).timestamp).toLocaleString()}</p>
                                </div>
                                <span className="text-xs font-bold text-energy">{(ci as { date: string }).date}</span>
                            </div>
                        ))}
                    </div>
                )}
            </Panel>
        </div>
    );
}
