import { useQuery, useMutation } from "convex/react";
import { motion } from "framer-motion";
import { Building2, Plus, ExternalLink } from "lucide-react";
import { api } from "../../../convex/_generated/api";
import { useAuth } from "../../lib/useAuth";
import { Link } from "react-router-dom";
import { DataTable } from "../../components/admin/DataTable";
import { ConfirmAction } from "../../components/admin/ConfirmAction";
import { useState } from "react";

export default function AdminGyms() {
    const { user } = useAuth();
    const sessionToken = user?.sessionToken;
    const gyms = useQuery(api.admin.listGyms, sessionToken ? { sessionToken } : "skip");
    const setActive = useMutation(api.admin.setGymActive);
    const [showCreate, setShowCreate] = useState(false);

    if (!gyms) {
        return (
            <div className="flex h-[60vh] items-center justify-center">
                <div className="h-10 w-10 rounded-full border-2 border-energy/30 border-t-energy animate-spin" />
            </div>
        );
    }

    const columns = [
        {
            key: "name",
            header: "Gym",
            sortable: true,
            render: (row: (typeof gyms)[number]) => (
                <div className="flex items-center gap-3">
                    <div className={`h-2.5 w-2.5 rounded-full ${row.gym.isActive ? "bg-success" : "bg-danger"}`} />
                    <div>
                        <Link to={`/admin/gyms/${row.gym._id}`} className="font-semibold hover:text-energy transition-colors flex items-center gap-1">
                            {row.gym.name}
                            <ExternalLink className="h-3 w-3" />
                        </Link>
                        <p className="text-xs text-theme-muted mt-0.5">{row.gym.city}</p>
                    </div>
                </div>
            ),
        },
        {
            key: "phone",
            header: "Phone",
            sortable: false,
            render: (row: (typeof gyms)[number]) => (
                <span className="text-sm text-theme-secondary">{row.gym.phone || "—"}</span>
            ),
        },
        {
            key: "memberCount",
            header: "Members",
            sortable: true,
            render: (row: (typeof gyms)[number]) => (
                <span className="font-semibold">{row.activeMembers}<span className="text-theme-muted">/{row.memberCount}</span></span>
            ),
        },
        {
            key: "revenue",
            header: "Revenue",
            sortable: true,
            render: (row: (typeof gyms)[number]) => (
                <span className="font-bold text-energy">ETB {row.revenue.toLocaleString()}</span>
            ),
        },
        {
            key: "status",
            header: "Status",
            sortable: false,
            render: (row: (typeof gyms)[number]) => (
                <ConfirmAction
                    title={row.gym.isActive ? "Suspend Gym" : "Activate Gym"}
                    message={row.gym.isActive ? `Suspend "${row.gym.name}"? Staff will lose access.` : `Reactivate "${row.gym.name}"? Staff will regain access.`}
                    variant={row.gym.isActive ? "danger" : "default"}
                    onConfirm={() => setActive({ sessionToken: sessionToken!, gymId: row.gym._id, isActive: !row.gym.isActive })}
                    trigger={
                        <span className={`pill cursor-pointer transition-all ${row.gym.isActive ? "pill--success hover:!bg-success/20" : "pill--danger hover:!bg-danger/20"}`}>
                            <span className={`h-2 w-2 rounded-full ${row.gym.isActive ? "bg-success" : "bg-danger"}`} />
                            {row.gym.isActive ? "Active" : "Suspended"}
                        </span>
                    }
                />
            ),
        },
    ];

    return (
        <div className="space-y-5">
            <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="card overflow-hidden">
                <div className="p-5 md:p-6 border-b border-theme flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-3.5">
                        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-energy/15 text-energy">
                            <Building2 className="h-6 w-6" />
                        </span>
                        <div>
                            <span className="eyebrow">All gyms</span>
                            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight mt-1">Gyms</h1>
                        </div>
                    </div>
                    <button onClick={() => setShowCreate(!showCreate)} className="btn btn--energy btn--md">
                        <Plus className="h-4 w-4" />
                        <span className="hidden sm:inline">New Gym</span>
                    </button>
                </div>
            </motion.section>

            {showCreate && <CreateGymForm sessionToken={sessionToken!} onDone={() => setShowCreate(false)} />}

            <DataTable
                data={gyms}
                columns={columns}
                searchPlaceholder="Search gyms by name or city…"
                searchKeys={["name" as never, undefined as never]}
                emptyMessage="No gyms registered yet."
            />
        </div>
    );
}

function CreateGymForm({ sessionToken, onDone }: { sessionToken: string; onDone: () => void }) {
    const createGym = useMutation(api.admin.createGym);
    const [form, setForm] = useState({ name: "", email: "", password: "", phone: "", address: "", city: "", description: "" });
    const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMsg(null);
        try {
            await createGym({
                sessionToken,
                name: form.name,
                email: form.email,
                password: form.password,
                phone: form.phone,
                address: form.address,
                city: form.city,
                description: form.description || undefined,
            });
            setMsg({ type: "success", text: "Gym created successfully." });
            setForm({ name: "", email: "", password: "", phone: "", address: "", city: "", description: "" });
            onDone();
        } catch (err) {
            const m = err instanceof Error ? err.message : (err as { message?: string })?.message || "Failed to create gym.";
            setMsg({ type: "error", text: m });
        } finally {
            setLoading(false);
        }
    };

    const update = (key: keyof typeof form, value: string) => setForm((f) => ({ ...f, [key]: value }));

    return (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="card p-5 md:p-6 border-energy/40">
            <h3 className="font-bold tracking-tight text-energy mb-4">Create new gym</h3>
            {msg && (
                <div className={`mb-4 rounded-xl border p-3 text-sm font-semibold ${msg.type === "success" ? "border-success/40 bg-success/10 text-success" : "border-danger/40 bg-danger/10 text-danger"}`}>
                    {msg.text}
                </div>
            )}
            <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-4">
                {(["name", "email", "password", "phone", "address", "city"] as const).map((field) => (
                    <div key={field} className="space-y-1.5">
                        <label className="eyebrow">{field === "password" ? "Owner password" : field}</label>
                        <input
                            type={field === "password" ? "password" : field === "email" ? "email" : "text"}
                            value={form[field]}
                            onChange={(e) => update(field, e.target.value)}
                            required
                            className="field"
                            placeholder={field === "password" ? "Min 8 characters" : ""}
                        />
                    </div>
                ))}
                <div className="md:col-span-2 space-y-1.5">
                    <label className="eyebrow">Description (optional)</label>
                    <input type="text" value={form.description} onChange={(e) => update("description", e.target.value)} className="field" />
                </div>
                <div className="md:col-span-2 flex gap-3">
                    <button type="submit" disabled={loading} className="btn btn--energy btn--md flex-1">
                        {loading ? "Creating…" : "Create gym"}
                    </button>
                    <button type="button" onClick={onDone} className="btn btn--ghost btn--md">Cancel</button>
                </div>
            </form>
        </motion.div>
    );
}

declare global {
    interface GymRowExtra {
        name: string;
        city: string;
    }
}
