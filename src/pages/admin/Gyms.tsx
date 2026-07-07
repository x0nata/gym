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
                <div className="h-12 w-12 border-4 border-theme-strong border-t-transparent rounded-full animate-spin" />
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
                    <div className={`h-2.5 w-2.5 rounded-full ${row.gym.isActive ? "bg-green-500" : "bg-red-500"}`} />
                    <div>
                        <Link
                            to={`/admin/gyms/${row.gym._id}`}
                            className="font-black uppercase text-sm hover:text-[#ccff00] transition-colors flex items-center gap-1"
                        >
                            {row.gym.name}
                            <ExternalLink className="h-3 w-3" />
                        </Link>
                        <p className="text-xs font-bold text-theme-muted uppercase tracking-wider">{row.gym.city}</p>
                    </div>
                </div>
            ),
        },
        {
            key: "phone",
            header: "Phone",
            sortable: false,
            render: (row: (typeof gyms)[number]) => (
                <span className="text-xs font-bold uppercase text-theme-muted">{row.gym.phone || "—"}</span>
            ),
        },
        {
            key: "memberCount",
            header: "Members",
            sortable: true,
            render: (row: (typeof gyms)[number]) => (
                <span className="text-sm font-black text-theme">
                    {row.activeMembers}/{row.memberCount}
                </span>
            ),
        },
        {
            key: "revenue",
            header: "Revenue",
            sortable: true,
            render: (row: (typeof gyms)[number]) => (
                <span className="text-sm font-black text-[#ccff00]">ETB {row.revenue.toLocaleString()}</span>
            ),
        },
        {
            key: "status",
            header: "Status",
            sortable: false,
            render: (row: (typeof gyms)[number]) => (
                <ConfirmAction
                    title={row.gym.isActive ? "Suspend Gym" : "Activate Gym"}
                    message={row.gym.isActive
                        ? `Suspend "${row.gym.name}"? Staff will lose access.`
                        : `Reactivate "${row.gym.name}"? Staff will regain access.`}
                    variant={row.gym.isActive ? "danger" : "default"}
                    onConfirm={() => setActive({ sessionToken: sessionToken!, gymId: row.gym._id, isActive: !row.gym.isActive })}
                    trigger={
                        <span
                            className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-black uppercase tracking-wider border-2 cursor-pointer transition-all ${
                                row.gym.isActive
                                    ? "border-green-500/50 bg-green-500/10 text-green-600 hover:bg-green-500/20"
                                    : "border-red-500/50 bg-red-500/10 text-red-500 hover:bg-red-500/20"
                            }`}
                        >
                            <span className={`h-2 w-2 rounded-full ${row.gym.isActive ? "bg-green-500" : "bg-red-500"}`} />
                            {row.gym.isActive ? "Active" : "Suspended"}
                        </span>
                    }
                />
            ),
        },
    ];

    return (
        <div className="space-y-6 font-['Outfit']">
            <motion.section
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                className="border-4 border-theme-strong bg-theme-raised shadow-[4px_4px_0px_0px_var(--border-strong)]"
            >
                <div className="p-6 border-b-4 border-theme-strong bg-theme-sidebar flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 border-2 border-[#ccff00] bg-theme-raised text-[#ccff00] flex items-center justify-center">
                            <Building2 className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-[10px] uppercase font-black tracking-[0.2em] text-theme-muted">All Gyms</p>
                            <h1 className="text-2xl md:text-3xl font-black uppercase font-['Syncopate'] text-theme">Gyms</h1>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowCreate(!showCreate)}
                        className="flex items-center gap-2 px-4 py-3 border-2 border-[#ccff00] bg-[#ccff00]/10 text-[#ccff00] font-black uppercase tracking-widest text-sm hover:bg-[#ccff00] hover:text-[#000000] transition-colors shadow-[4px_4px_0px_0px_#ccff00] hover:translate-x-[-2px] hover:translate-y-[-2px]"
                    >
                        <Plus className="h-4 w-4" />
                        <span className="hidden sm:inline">New Gym</span>
                    </button>
                </div>
            </motion.section>

            {showCreate && (
                <CreateGymForm sessionToken={sessionToken!} onDone={() => setShowCreate(false)} />
            )}

            <DataTable
                data={gyms}
                columns={columns}
                searchPlaceholder="Search gyms by name or city..."
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
            const msg = err instanceof Error ? err.message : (err as { message?: string })?.message || "Failed to create gym.";
            setMsg({ type: "error", text: msg });
        } finally {
            setLoading(false);
        }
    };

    const update = (key: keyof typeof form, value: string) => setForm((f) => ({ ...f, [key]: value }));

    return (
        <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="border-4 border-[#ccff00] bg-theme-raised p-6 shadow-[4px_4px_0px_0px_#ccff00]"
        >
            <h3 className="text-lg font-black uppercase tracking-widest font-['Syncopate'] text-[#ccff00] mb-4">Create New Gym</h3>
            {msg && (
                <div className={`mb-4 p-3 border-2 font-bold uppercase text-xs tracking-wider ${msg.type === "success" ? "border-green-500 bg-green-500/10 text-green-600" : "border-red-500 bg-red-500/10 text-red-500"}`}>
                    {msg.text}
                </div>
            )}
            <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-4">
                {(["name", "email", "password", "phone", "address", "city"] as const).map((field) => (
                    <div key={field}>
                        <label className="text-xs font-black uppercase tracking-wider text-theme-muted mb-1.5 block">
                            {field === "password" ? "Owner Password" : field}
                        </label>
                        <input
                            type={field === "password" ? "password" : field === "email" ? "email" : "text"}
                            value={form[field]}
                            onChange={(e) => update(field, e.target.value)}
                            required
                            className="w-full px-3 py-2.5 border-2 border-theme-strong bg-theme-sidebar text-theme font-bold text-sm placeholder:text-theme-muted focus:border-[#ccff00] focus:outline-none"
                            placeholder={field === "password" ? "Min 8 characters" : ""}
                        />
                    </div>
                ))}
                <div className="md:col-span-2">
                    <label className="text-xs font-black uppercase tracking-wider text-theme-muted mb-1.5 block">Description (optional)</label>
                    <input
                        type="text"
                        value={form.description}
                        onChange={(e) => update("description", e.target.value)}
                        className="w-full px-3 py-2.5 border-2 border-theme-strong bg-theme-sidebar text-theme font-bold text-sm placeholder:text-theme-muted focus:border-[#ccff00] focus:outline-none"
                    />
                </div>
                <div className="md:col-span-2 flex gap-3">
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex-1 px-4 py-3 border-2 border-[#ccff00] bg-[#ccff00] text-[#000000] font-black uppercase tracking-widest text-sm hover:bg-[#b3e600] transition-colors shadow-[4px_4px_0px_0px_#ccff00] hover:translate-x-[-2px] hover:translate-y-[-2px] disabled:opacity-50"
                    >
                        {loading ? "Creating..." : "Create Gym"}
                    </button>
                    <button
                        type="button"
                        onClick={onDone}
                        className="px-4 py-3 border-2 border-theme font-black uppercase tracking-widest text-sm text-theme hover:bg-theme transition-colors"
                    >
                        Cancel
                    </button>
                </div>
            </form>
        </motion.div>
    );
}

// Ensure gyms rows expose searchable strings at the top level so DataTable key-based search works
// We transform the data to include these flattened string fields
declare global {
    interface GymRowExtra {
        name: string;
        city: string;
    }
}
