import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { QRCodeSVG } from "qrcode.react";
import {
    ArrowLeft,
    Mail,
    Phone,
    Calendar,
    CreditCard,
    Clock,
    Download,
    Printer,
    ChevronRight,
} from "lucide-react";
import {
    formatDate,
    formatDateTime,
    formatCurrency,
    getMembershipStatusColor,
    getMembershipStatusLabel,
} from "../lib/utils";
import type { Id } from "../../convex/_generated/dataModel";
import { useState } from "react";
import { useAuth } from "../lib/useAuth";
import { toDisplayError, type AppErrorDetails } from "../lib/errorHandling";
import { DetailedErrorPanel } from "../components/feedback/DetailedErrorPanel";

function getProgressPercent(startDate: number, endDate: number): number {
    const now = Date.now();
    return Math.max(0, Math.min(100, ((now - startDate) / (endDate - startDate)) * 100));
}

export default function MemberDetail() {
    const { user } = useAuth();
    const sessionToken = user?.sessionToken;
    const { id } = useParams<{ id: string }>();
    const memberId = id as Id<"members">;

    const member = useQuery(api.members.getById, sessionToken ? { memberId, sessionToken } : "skip");
    const memberships = useQuery(api.memberships.getByMember, sessionToken ? { memberId, sessionToken } : "skip");
    const checkIns = useQuery(api.checkIns.getByMember, sessionToken ? { memberId, sessionToken } : "skip");
    const createMembership = useMutation(api.memberships.create);

    const [showRenew, setShowRenew] = useState(false);
    const [planName, setPlanName] = useState("Monthly");
    const [durationDays, setDurationDays] = useState(30);
    const [amountPaid, setAmountPaid] = useState(50);
    const [actionError, setActionError] = useState<AppErrorDetails | null>(null);

    if (member === undefined) {
        return (
            <div className="flex h-64 flex-col items-center justify-center gap-4">
                <div className="h-10 w-10 rounded-full border-2 border-accent/30 border-t-accent-light animate-spin" />
                <p className="eyebrow">Loading…</p>
            </div>
        );
    }

    if (member === null) {
        return (
            <div className="max-w-2xl mx-auto card p-6">
                <h1 className="text-xl font-extrabold tracking-tight">Member not found</h1>
                <p className="mt-2 text-sm text-theme-secondary">This member is not available or you do not have access.</p>
                <Link to="/members" className="btn btn--ghost btn--sm mt-4">Back to members</Link>
            </div>
        );
    }

    const activeMembership = memberships?.find((m) => m.status === "active");

    const handleRenew = async (e: React.FormEvent) => {
        e.preventDefault();
        setActionError(null);
        if (!sessionToken) {
            setActionError({ title: "Session expired", message: "Your session expired. Sign in again to renew.", code: "UNAUTHORIZED" });
            return;
        }
        try {
            await createMembership({ memberId, planName, durationDays, amountPaid, sessionToken });
            setShowRenew(false);
        } catch (error) {
            setActionError(toDisplayError(error, { title: "Could not update membership", fallbackMessage: "Could not update membership now." }));
        }
    };

    const handlePrintQR = () => {
        const svgEl = document.getElementById("member-qr-code");
        if (!svgEl) return;
        const svgData = new XMLSerializer().serializeToString(svgEl);
        const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
        const url = URL.createObjectURL(svgBlob);
        const win = window.open("", "_blank");
        if (win) {
            const doc = win.document;
            doc.title = `QR Code - ${member.firstName} ${member.lastName}`;
            const body = doc.body;
            body.style.display = "flex";
            body.style.flexDirection = "column";
            body.style.alignItems = "center";
            body.style.justifyContent = "center";
            body.style.minHeight = "100vh";
            body.style.fontFamily = "sans-serif";
            const h2 = doc.createElement("h2");
            h2.textContent = `${member.firstName} ${member.lastName}`;
            body.appendChild(h2);
            const img = doc.createElement("img");
            img.src = url;
            img.width = 300;
            img.height = 300;
            body.appendChild(img);
            const p = doc.createElement("p");
            p.style.fontFamily = "monospace";
            p.style.fontSize = "14px";
            p.style.marginTop = "12px";
            p.textContent = member.qrCode;
            body.appendChild(p);
            setTimeout(() => win.print(), 500);
        }
    };

    const statusColor = activeMembership ? getMembershipStatusColor(activeMembership.endDate) : "expired";
    const statusBadgeClass =
        statusColor === "active" ? "pill--success" : statusColor === "warning" ? "pill--warning" : "pill--danger";

    return (
        <div className="mx-auto max-w-7xl space-y-5">
            <Link to="/members" className="inline-flex items-center gap-2 text-sm text-theme-muted hover:text-accent-light transition-colors">
                <ArrowLeft className="h-4 w-4" /> Back to members
            </Link>

            {/* Profile header */}
            <div className="card p-5 md:p-7 flex flex-col md:flex-row gap-6 relative overflow-hidden">
                <div className="pointer-events-none absolute -top-20 -right-10 h-56 w-56 rounded-full bg-accent/15 blur-[90px]" />
                <div className="flex-1 flex flex-col sm:flex-row gap-5 items-start sm:items-center relative z-10">
                    <div className="grid h-24 w-24 sm:h-28 sm:w-28 place-items-center rounded-3xl bg-energy text-[#0c0c10] text-3xl sm:text-4xl font-extrabold shrink-0">
                        {member.firstName[0]}{member.lastName[0]}
                    </div>
                    <div className="space-y-4">
                        <div>
                            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight break-words">
                                {member.firstName} {member.lastName}
                            </h1>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-5 text-sm text-theme-secondary flex-wrap">
                            <span className="inline-flex items-center gap-2"><Mail className="h-4 w-4 text-theme-muted" /> {member.email}</span>
                            <span className="inline-flex items-center gap-2"><Phone className="h-4 w-4 text-theme-muted" /> {member.phone}</span>
                            <span className="inline-flex items-center gap-2"><Calendar className="h-4 w-4 text-theme-muted" /> Joined {formatDate(member.joinedAt)}</span>
                        </div>
                        <div>
                            {activeMembership ? (
                                <span className={`pill ${statusBadgeClass}`}>
                                    {activeMembership.planName} · {getMembershipStatusLabel(activeMembership.endDate)}
                                </span>
                            ) : (
                                <span className="pill pill--danger">No active plan</span>
                            )}
                        </div>
                    </div>
                </div>

                {/* QR */}
                <div className="flex-shrink-0 flex flex-col items-center gap-3 glass rounded-2xl p-4 relative z-10">
                    <div className="rounded-xl bg-white p-2.5">
                        <QRCodeSVG id="member-qr-code" value={member.qrCode} size={180} bgColor="#ffffff" fgColor="#0a0a0f" level="M" includeMargin={true} />
                    </div>
                    <p className="font-mono text-xs text-theme-muted">{member.qrCode}</p>
                    <div className="flex gap-2 w-full">
                        <button className="btn btn--ghost btn--sm flex-1" onClick={handlePrintQR}><Printer className="h-3.5 w-3.5" /> Print</button>
                        <button className="btn btn--ghost btn--sm flex-1" onClick={() => navigator.clipboard.writeText(member.qrCode)}><Download className="h-3.5 w-3.5" /> Copy</button>
                    </div>
                </div>
            </div>

            <div className="flex justify-end">
                <button className="btn btn--primary btn--md" onClick={() => setShowRenew(!showRenew)}>
                    <CreditCard className="h-4 w-4" /> {activeMembership ? "Renew" : "Add"} plan
                </button>
            </div>

            {actionError && <DetailedErrorPanel error={actionError} />}

            {showRenew && (
                <form onSubmit={handleRenew} className="card p-5 md:p-6 relative overflow-hidden">
                    <div className="pointer-events-none absolute -top-16 -right-10 h-40 w-40 rounded-full bg-accent/15 blur-[80px]" />
                    <h3 className="font-bold tracking-tight mb-5 pb-4 border-b border-theme relative z-10">Add or renew plan</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end relative z-10">
                        <div className="space-y-1.5">
                            <label className="eyebrow">Plan</label>
                            <select
                                className="field"
                                value={planName}
                                onChange={(e) => {
                                    setPlanName(e.target.value);
                                    if (e.target.value !== "Custom") {
                                        const map: Record<string, number> = { Monthly: 30, Quarterly: 90, "Semi-Annual": 180, Annual: 365 };
                                        setDurationDays(map[e.target.value] || 30);
                                    }
                                }}
                            >
                                <option value="Monthly">Monthly (30 days)</option>
                                <option value="Quarterly">Quarterly (90 days)</option>
                                <option value="Semi-Annual">Semi-Annual (180 days)</option>
                                <option value="Annual">Annual (365 days)</option>
                                <option value="Custom">Custom</option>
                            </select>
                        </div>
                        {planName === "Custom" ? (
                            <>
                                <div className="space-y-1.5">
                                    <label className="eyebrow">Duration (days)</label>
                                    <input className="field" type="number" min={1} value={durationDays} onChange={(e) => setDurationDays(Math.max(1, Number(e.target.value)))} />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="eyebrow">Amount (ETB)</label>
                                    <input className="field" type="number" min={0} value={amountPaid} onChange={(e) => setAmountPaid(Number(e.target.value))} />
                                </div>
                                <button type="submit" className="btn btn--primary btn--md">Activate</button>
                            </>
                        ) : (
                            <div className="contents">
                                <div className="space-y-1.5">
                                    <label className="eyebrow">Amount (ETB)</label>
                                    <input className="field" type="number" min={0} value={amountPaid} onChange={(e) => setAmountPaid(Number(e.target.value))} />
                                </div>
                                <button type="submit" className="btn btn--primary btn--md">Activate</button>
                            </div>
                        )}
                    </div>
                </form>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* Plans history */}
                <div className="card flex flex-col h-[480px] overflow-hidden">
                    <div className="px-5 py-4 border-b border-theme flex items-center justify-between">
                        <h3 className="font-bold tracking-tight flex items-center gap-2.5"><CreditCard className="h-4 w-4 text-accent-light" /> Plans</h3>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {!memberships || memberships.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-theme-muted gap-3">
                                <CreditCard className="h-10 w-10 opacity-40" />
                                <p className="eyebrow">No plans found</p>
                            </div>
                        ) : (
                            memberships.map((ms) => {
                                const msColor = ms.status === "active" ? getMembershipStatusColor(ms.endDate) : "expired";
                                return (
                                    <div key={ms._id} className={`rounded-2xl border p-4 ${ms.status === "active" ? "border-theme-strong" : "border-theme opacity-70"}`}>
                                        <div className="flex justify-between items-start mb-3">
                                            <div>
                                                <span className="font-bold tracking-tight block">{ms.planName}</span>
                                                <div className="text-xs text-theme-muted mt-1 flex flex-wrap gap-x-4 gap-y-1">
                                                    <span>{formatDate(ms.startDate)} → {formatDate(ms.endDate)}</span>
                                                    <span>{formatCurrency(ms.amountPaid)}</span>
                                                </div>
                                            </div>
                                            <span className={`pill ${msColor === "active" ? "pill--success" : msColor === "warning" ? "pill--warning" : "pill--danger"}`}>
                                                {ms.status === "active" ? getMembershipStatusLabel(ms.endDate) : "Expired"}
                                            </span>
                                        </div>
                                        {ms.status === "active" && (
                                            <div className="mt-3">
                                                <div className="h-2 rounded-full bg-hover overflow-hidden">
                                                    <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${getProgressPercent(ms.startDate, ms.endDate)}%`, background: "var(--color-energy)" }} />
                                                </div>
                                                <div className="mt-1.5 flex justify-between text-[11px] text-theme-muted">
                                                    <span>Start</span>
                                                    <span>{Math.round(getProgressPercent(ms.startDate, ms.endDate))}% used</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* Check-in history */}
                <div className="card flex flex-col h-[480px] overflow-hidden">
                    <div className="px-5 py-4 border-b border-theme flex items-center justify-between">
                        <h3 className="font-bold tracking-tight flex items-center gap-2.5"><Clock className="h-4 w-4 text-accent-light" /> Check-ins</h3>
                        <span className="pill pill--accent">{checkIns?.length ?? 0}</span>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4">
                        {!checkIns || checkIns.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-theme-muted gap-3">
                                <Clock className="h-10 w-10 opacity-40" />
                                <p className="eyebrow">No check-ins yet</p>
                            </div>
                        ) : (
                            <div className="relative border-l border-theme-strong ml-3 space-y-5 pb-4">
                                {checkIns.slice(0, 30).map((ci) => (
                                    <div key={ci._id} className="relative pl-7">
                                        <div className="absolute -left-[7px] top-1 h-3.5 w-3.5 rounded-full bg-accent ring-4 ring-[var(--bg)]" />
                                        <div className="rounded-xl border border-theme bg-hover p-3 hover:border-theme-strong transition-colors group">
                                            <div className="flex items-center gap-2">
                                                <ChevronRight className="h-3.5 w-3.5 text-accent-light opacity-0 group-hover:opacity-100 transition-opacity" />
                                                <span className="font-semibold text-sm">{formatDateTime(ci.timestamp)}</span>
                                            </div>
                                            <div className="mt-1 ml-5 text-xs text-theme-muted">Checked in</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
