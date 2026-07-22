import { useState, useCallback } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
    Users,
    Activity,
    TrendingUp,
    AlertTriangle,
    Clock,
    Camera,
    Keyboard,
    Scan,
    ChevronRight,
    Search,
    Zap,
} from "lucide-react";
import { formatDateTime, formatTimeAgo, formatDate } from "../../lib/utils";
import type { Doc } from "../../../convex/_generated/dataModel";
import { useAuth } from "../../lib/useAuth";
import { toDisplayError, type AppErrorDetails } from "../../lib/errorHandling";
import { DetailedErrorPanel } from "../../components/feedback/DetailedErrorPanel";
import { useQrScanner } from "../../lib/useQrScanner";

type ScanResult = {
    status: "checked_in" | "already_checked_in" | "error";
    member?: Doc<"members">;
    membership?: Doc<"memberships">;
    checkInTime?: number;
    daysRemaining?: number;
    message?: string;
    errorDetails?: AppErrorDetails;
};

export default function GymDashboard() {
    const { user } = useAuth();
    const sessionToken = user?.sessionToken;

    const stats = useQuery(api.members.stats, sessionToken ? { sessionToken } : "skip");
    const todayCheckIns = useQuery(api.checkIns.getToday, sessionToken ? { sessionToken } : "skip");
    const expiringMemberships = useQuery(api.memberships.listExpiring, sessionToken ? { sessionToken } : "skip");
    const checkIn = useMutation(api.checkIns.scanAndCheckIn);

    const [scannerMode, setScannerMode] = useState<"manual" | "camera">("manual");
    const [manualCode, setManualCode] = useState("");
    const [scanning, setScanning] = useState(false);
    const [result, setResult] = useState<ScanResult | null>(null);
    const [cameraActive, setCameraActive] = useState(false);

    const handleScan = useCallback(
        async (qrCode: string) => {
            if (!sessionToken) return;
            setScanning(true);
            setResult(null);
            try {
                const res = await checkIn({ qrCode, sessionToken: sessionToken as string });
                setResult(res as ScanResult);
            } catch (err: unknown) {
                const details = toDisplayError(err, { title: "Check-in failed", fallbackMessage: "Scan failed. Try again." });
                setResult({ status: "error", message: details.message, errorDetails: details });
            } finally {
                setScanning(false);
            }
        },
        [checkIn, sessionToken]
    );

    const { error: cameraError, active: scannerActive } = useQrScanner({
        elementId: "qr-reader-main",
        onScan: handleScan,
        enabled: cameraActive && scannerMode === "camera" && !result,
    });

    const handleManualSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (manualCode.trim()) handleScan(manualCode.trim());
    };

    const resetResult = () => {
        setResult(null);
        setManualCode("");
    };

    if (!stats) {
        return (
            <div className="flex h-[60vh] items-center justify-center">
                <div className="h-10 w-10 rounded-full border-2 border-energy/25 border-t-energy animate-spin" />
            </div>
        );
    }

    const kpis = [
        { label: "All members", value: stats.totalMembers, delta: "this week", icon: Users, tone: "neutral" as const },
        { label: "Visits today", value: stats.todayCheckIns, delta: "vs avg", icon: Activity, tone: "teal" as const },
        { label: "Active plans", value: stats.activeMemberships, delta: "retention", icon: TrendingUp, tone: "neutral" as const },
        { label: "Ending ≤14d", value: stats.expiringSoon, delta: "renew", icon: AlertTriangle, tone: "warn" as const },
    ];

    // Simple hourly distribution of today's check-ins (0-23) for the mini bars
    const hourCounts = new Array(24).fill(0);
    (todayCheckIns ?? []).forEach((ci) => {
        const h = new Date(ci.timestamp).getHours();
        if (h >= 0 && h < 24) hourCounts[h]++;
    });
    const maxHour = Math.max(...hourCounts, 1);
    const firstActiveHour = hourCounts.findIndex((c) => c > 0);
    const barStart = firstActiveHour === -1 ? 6 : Math.max(0, firstActiveHour - 1);
    const barEnd = 22;
    const hourBars = hourCounts.slice(barStart, barEnd + 1);
    const labels = hourBars.map((_, idx) => `${(barStart + idx) % 24}`);

    const resultTone =
        result?.status === "checked_in" ? "success" : result?.status === "already_checked_in" ? "warning" : "danger";

    return (
        <div className="max-w-7xl mx-auto space-y-5">
            {/* Header */}
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-1">
                <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Front desk · today</h1>
                <p className="text-theme-secondary text-sm">
                    {stats.todayCheckIns} visits so far ·{" "}
                    <span className="text-energy font-semibold">{stats.expiringSoon} plans</span> enter the renewal window.
                </p>
            </motion.div>

            {/* Check-in */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }} className="card overflow-hidden">
                <div className="px-5 py-4 border-b border-theme flex items-center gap-2.5">
                    <span className="grid h-9 w-9 place-items-center rounded-xl bg-energy/12 text-energy">
                        <Zap className="h-5 w-5" />
                    </span>
                    <div>
                        <h3 className="text-sm font-bold">Check-in</h3>
                        <p className="text-[11px] text-theme-muted">Type or scan a member code</p>
                    </div>
                </div>
                <div className="p-5">
                    <div className="grid grid-cols-2 gap-1 p-1 rounded-xl border border-theme mb-4 max-w-sm">
                        <button
                            onClick={() => { setScannerMode("manual"); setCameraActive(false); }}
                            className={`py-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${scannerMode === "manual" ? "bg-hover-accent text-energy" : "text-theme-muted hover:text-theme"}`}
                        >
                            <Keyboard className="h-4 w-4" /> Manual
                        </button>
                        <button
                            onClick={() => { setScannerMode("camera"); setCameraActive(true); }}
                            className={`py-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${scannerMode === "camera" ? "bg-hover-accent text-energy" : "text-theme-muted hover:text-theme"}`}
                        >
                            <Camera className="h-4 w-4" /> Camera
                        </button>
                    </div>

                    <AnimatePresence mode="wait">
                        {!result ? (
                            <motion.div key="scanner" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex gap-5 items-start flex-wrap">
                                {scannerMode === "manual" ? (
                                    <form onSubmit={handleManualSubmit} className="space-y-3 w-full max-w-sm">
                                        <div className="relative">
                                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-theme-muted" />
                                            <input
                                                type="text"
                                                value={manualCode}
                                                onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                                                placeholder="Enter member ID…"
                                                className="field !pl-10 font-mono tracking-widest"
                                                autoFocus
                                            />
                                        </div>
                                        <button
                                            type="submit"
                                            disabled={scanning || !manualCode.trim()}
                                            className="btn btn--primary btn--md w-full"
                                        >
                                            {scanning ? "Checking…" : "Check in"}
                                            {!scanning && <ChevronRight className="h-4 w-4" />}
                                        </button>
                                    </form>
                                ) : (
                                    <div>
                                        <div
                                            className="relative overflow-hidden rounded-xl border border-theme-strong bg-bg-solid"
                                            style={{ aspectRatio: "1/1", maxWidth: "320px", width: "320px" }}
                                        >
                                            <div id="qr-reader-main" className="w-full h-full" />
                                            {cameraActive && !cameraError && (
                                                <div className="absolute inset-0 pointer-events-none">
                                                    <div className="absolute top-3 left-3 w-7 h-7 border-t-2 border-l-2 border-energy rounded-tl-lg" />
                                                    <div className="absolute top-3 right-3 w-7 h-7 border-t-2 border-r-2 border-energy rounded-tr-lg" />
                                                    <div className="absolute bottom-3 left-3 w-7 h-7 border-b-2 border-l-2 border-energy rounded-bl-lg" />
                                                    <div className="absolute bottom-3 right-3 w-7 h-7 border-b-2 border-r-2 border-energy rounded-br-lg" />
                                                    <motion.div
                                                        className="absolute left-3 right-3 h-0.5 bg-energy shadow-[0_0_12px_var(--color-energy)]"
                                                        animate={{ top: ["12%", "88%", "12%"] }}
                                                        transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                                                    />
                                                    <div className="absolute bottom-3 left-0 right-0 text-center">
                                                        <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-energy bg-black/60 px-2.5 py-1 rounded-full">
                                                            <Scan className="h-3.5 w-3.5" /> {scannerActive ? "Scanning" : "Ready"}
                                                        </span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                        {cameraError && (
                                            <div className="mt-3 rounded-xl border border-danger/40 bg-danger/10 p-3 text-xs text-danger text-center" style={{ maxWidth: "320px" }}>
                                                {cameraError}
                                                <button
                                                    onClick={() => { setCameraActive(false); setTimeout(() => setCameraActive(true), 100); }}
                                                    className="btn btn--ghost btn--sm w-full mt-2"
                                                >
                                                    Try again
                                                </button>
                                            </div>
                                        )}
                                        {!cameraActive && !cameraError && (
                                            <button
                                                onClick={() => setCameraActive(true)}
                                                className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/60 rounded-xl gap-3"
                                                style={{ width: "320px", aspectRatio: "1/1" }}
                                            >
                                                <span className="grid h-12 w-12 place-items-center rounded-xl border border-energy text-energy">
                                                    <Camera className="h-6 w-6" />
                                                </span>
                                                <span className="text-sm font-semibold text-energy">Start camera</span>
                                            </button>
                                        )}
                                    </div>
                                )}

                                {scannerMode === "camera" && (
                                    <div className="flex-1 min-w-64 space-y-5 p-5 rounded-xl border border-theme bg-bg-raised">
                                        <div>
                                            <div className="eyebrow text-theme-muted">Quick lookup</div>
                                            <p className="text-sm font-semibold mt-1">Type a member ID</p>
                                            <p className="text-xs text-theme-muted mt-1">Switch to Manual tab if you prefer typing</p>
                                        </div>
                                        <form onSubmit={handleManualSubmit} className="space-y-3">
                                            <div className="relative">
                                                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-theme-muted" />
                                                <input
                                                    type="text"
                                                    value={manualCode}
                                                    onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                                                    placeholder="Enter member ID…"
                                                    className="field !pl-10 font-mono tracking-widest"
                                                />
                                            </div>
                                            <button
                                                type="submit"
                                                disabled={scanning || !manualCode.trim()}
                                                className="btn btn--primary btn--md w-full"
                                            >
                                                {scanning ? "Checking…" : "Check in"}
                                                {!scanning && <ChevronRight className="h-4 w-4" />}
                                            </button>
                                        </form>
                                    </div>
                                )}
                            </motion.div>
                        ) : (
                            <motion.div key="result" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} className="max-w-sm">
                                <div className={`rounded-xl border p-5 text-center ${
                                    resultTone === "success" ? "border-success/40 bg-success/10" :
                                    resultTone === "warning" ? "border-warning/40 bg-warning/10" :
                                    "border-danger/40 bg-danger/10"
                                }`}>
                                    <span className={`mx-auto grid h-12 w-12 place-items-center rounded-xl mb-3 ${
                                        resultTone === "success" ? "bg-success/20 text-success" :
                                        resultTone === "warning" ? "bg-warning/20 text-warning" :
                                        "bg-danger/20 text-danger"
                                    }`}>
                                        {resultTone === "success" ? <Zap className="h-6 w-6" /> : resultTone === "warning" ? <AlertTriangle className="h-6 w-6" /> : <Activity className="h-6 w-6" />}
                                    </span>
                                    {result.member ? (
                                        <>
                                            <h3 className="text-xl font-extrabold tracking-tight">
                                                {result.member.firstName} {result.member.lastName}
                                            </h3>
                                            <p className={`text-xs font-semibold mt-1 ${
                                                resultTone === "success" ? "text-success" : "text-warning"
                                            }`}>
                                                {result.status === "checked_in" ? "Checked in" : "Already here"}
                                            </p>
                                            {result.membership && (
                                                <div className="mt-3 rounded-lg border border-theme bg-bg-raised p-3 text-left">
                                                    <div className="eyebrow">Plan</div>
                                                    <div className="font-bold text-sm mt-1">{result.membership.planName}</div>
                                                    <div className="text-[11px] text-theme-muted mt-1 font-mono">Ends {formatDate(result.membership.endDate)}</div>
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <>
                                            <h3 className="text-xl font-extrabold tracking-tight text-danger">Not found</h3>
                                            {result.errorDetails ? (
                                                <DetailedErrorPanel error={result.errorDetails} className="mt-3 text-left" />
                                            ) : (
                                                <p className="text-sm text-theme-secondary mt-1">{result.message}</p>
                                            )}
                                        </>
                                    )}
                                    <button onClick={resetResult} className="btn btn--ghost btn--md w-full mt-4">
                                        Next check-in
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>

            {/* KPIs */}
            <section className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                {kpis.map((k, i) => (
                    <motion.div
                        key={k.label}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.04 * i }}
                        className="stat-tile p-5"
                    >
                        <div className="flex items-start justify-between">
                            <span className="text-xs font-medium text-theme-secondary">{k.label}</span>
                            <k.icon className={`h-4 w-4 ${k.tone === "teal" ? "text-energy" : k.tone === "warn" ? "text-warning" : "text-theme-muted"}`} />
                        </div>
                        <div className="mt-3 text-3xl font-extrabold tracking-tight tabular-nums leading-none">{k.value}</div>
                        <div className="mt-3 text-[11px] font-mono text-theme-muted">{k.delta}</div>
                    </motion.div>
                ))}
            </section>

            <div className="grid lg:grid-cols-[1.4fr_1fr] gap-4">
                {/* Left column */}
                <div className="flex flex-col gap-4">
                    {/* Recent visits */}
                    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card">
                        <div className="flex items-center justify-between px-5 py-4 border-b border-theme">
                            <h3 className="text-sm font-bold">Recent visits</h3>
                            <span className="pill pill--energy">{todayCheckIns?.length ?? 0} today</span>
                        </div>
                        <div className="p-2">
                            {!todayCheckIns || todayCheckIns.length === 0 ? (
                                <div className="py-12 flex flex-col items-center justify-center text-theme-muted gap-2">
                                    <Activity className="h-8 w-8 opacity-40" />
                                    <p className="eyebrow">No visits yet</p>
                                </div>
                            ) : (
                                <div className="flex flex-col">
                                    {todayCheckIns.slice(0, 6).map((ci) => (
                                        <Link
                                            key={ci._id}
                                            to={`/members/${ci.memberId}`}
                                            className="grid grid-cols-[36px_1fr_auto] items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-hover transition-colors group"
                                        >
                                            <span className="grid h-9 w-9 place-items-center rounded-xl bg-energy/12 text-energy text-xs font-bold">
                                                {ci.member.firstName[0]}{ci.member.lastName[0]}
                                            </span>
                                            <div className="min-w-0">
                                                <div className="text-sm font-semibold truncate">{ci.member.firstName} {ci.member.lastName}</div>
                                                <div className="text-[11px] font-mono text-theme-muted mt-0.5">{ci.member.qrCode}</div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-[11px] font-mono text-theme-secondary flex items-center gap-1 justify-end">
                                                    <Clock className="h-3 w-3" />
                                                    {formatDateTime(ci.timestamp)}
                                                </div>
                                                <ChevronRight className="h-4 w-4 text-theme-muted mt-1 ml-auto opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>
                    </motion.div>

                    {/* Foot traffic */}
                    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }} className="card p-5">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-bold">Foot traffic · today</h3>
                            <span className="text-[11px] font-mono text-theme-muted">visits / hour</span>
                        </div>
                        <div className="flex items-end gap-1 h-32">
                            {hourBars.map((c, idx) => {
                                const h = (barStart + idx) % 24;
                                const isNow = h === new Date().getHours();
                                const pct = Math.round((c / maxHour) * 100);
                                return (
                                    <div key={idx} className="flex-1 flex flex-col items-center gap-1">
                                        <div className="w-full flex items-end" style={{ height: "100%" }}>
                                            <div
                                                className={`w-full rounded-t-md transition-all ${isNow ? "bg-energy" : "bg-energy/25"}`}
                                                style={{ height: c === 0 ? "4px" : `${Math.max(6, pct)}%` }}
                                                title={`${h}:00 · ${c} visits`}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        <div className="flex gap-1 mt-2 text-[9px] font-mono text-theme-muted">
                            {labels.map((l, idx) => (
                                <div key={idx} className="flex-1 text-center">{idx % 3 === 0 ? l : ""}</div>
                            ))}
                        </div>
                    </motion.div>
                </div>

                {/* Right column */}
                <div className="flex flex-col gap-4">
                    {/* Renewal queue */}
                    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="card">
                        <div className="flex items-center justify-between px-5 py-4 border-b border-theme">
                            <h3 className="text-sm font-bold flex items-center gap-2">
                                <AlertTriangle className="h-4 w-4 text-warning" /> Renewals
                            </h3>
                            <Link to="/members" className="text-[11px] font-mono text-energy hover:underline">see all</Link>
                        </div>
                        <div className="p-2">
                            {!expiringMemberships || expiringMemberships.length === 0 ? (
                                <div className="py-10 flex flex-col items-center justify-center text-theme-muted gap-2">
                                    <TrendingUp className="h-7 w-7 opacity-40" />
                                    <p className="eyebrow">All clear</p>
                                </div>
                            ) : (
                                <div className="flex flex-col">
                                    {expiringMemberships.slice(0, 5).map((em) => {
                                        const days = Math.max(0, Math.ceil((em.endDate - Date.now()) / (1000 * 60 * 60 * 24)));
                                        const progress = Math.min(1, days / 30);
                                        return (
                                            <Link
                                                key={em._id}
                                                to={`/members/${em.memberId}`}
                                                className="grid grid-cols-[36px_1fr_auto] items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-hover transition-colors"
                                            >
                                                <span className="grid h-9 w-9 place-items-center rounded-xl bg-danger/12 text-danger text-xs font-bold">
                                                    {em.member.firstName[0]}{em.member.lastName[0]}
                                                </span>
                                                <div className="min-w-0">
                                                    <div className="text-sm font-semibold truncate">{em.member.firstName} {em.member.lastName}</div>
                                                    <div className="mt-1.5 h-1 rounded-full bg-hover overflow-hidden">
                                                        <div className="h-full rounded-full bg-danger" style={{ width: `${Math.round((1 - progress) * 100)}%` }} />
                                                    </div>
                                                    <div className="text-[11px] text-theme-muted mt-1">{em.planName}</div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-base font-bold text-danger leading-none">{days}</div>
                                                    <div className="text-[10px] text-theme-muted mt-1 font-mono">{formatTimeAgo(em.endDate)}</div>
                                                </div>
                                            </Link>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}