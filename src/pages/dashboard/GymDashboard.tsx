import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Html5Qrcode } from "html5-qrcode";
import {
    Users,
    CheckCircle2,
    XCircle,
    AlertTriangle,
    Clock,
    Camera,
    Keyboard,
    Zap,
    Activity,
    TrendingUp,
    ChevronRight,
    Search
} from "lucide-react";
import { formatDateTime, formatTimeAgo, formatDate } from "../../lib/utils";
import type { Doc } from "../../../convex/_generated/dataModel";
import { useAuth } from "../../lib/useAuth";
import { toDisplayError, type AppErrorDetails } from "../../lib/errorHandling";
import { DetailedErrorPanel } from "../../components/feedback/DetailedErrorPanel";

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
    const scannerRef = useRef<Html5Qrcode | null>(null);
    const lastScannedRef = useRef<string>("");

    const handleScan = useCallback(
        async (qrCode: string) => {
            if (scanning) return;
            if (qrCode === lastScannedRef.current) return;

            lastScannedRef.current = qrCode;
            setScanning(true);
            setResult(null);

            try {
                const res = await checkIn({ qrCode, sessionToken: sessionToken as string });
                setResult(res as ScanResult);
            } catch (err: unknown) {
                const details = toDisplayError(err, {
                    title: "Check-in failed",
                    fallbackMessage: "Scan failed. Please try again.",
                });
                setResult({ status: "error", message: details.message, errorDetails: details });
            } finally {
                setScanning(false);
                setTimeout(() => {
                    lastScannedRef.current = "";
                }, 5000);
            }
        },
        [checkIn, scanning, sessionToken]
    );

    const handleManualSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (manualCode.trim()) {
            handleScan(manualCode.trim());
        }
    };

    useEffect(() => {
        if (scannerMode !== "camera" || !cameraActive) return;

        const scanner = new Html5Qrcode("qr-reader-main");
        scannerRef.current = scanner;

        scanner
            .start(
                { facingMode: "environment" },
                { fps: 10, qrbox: { width: 220, height: 220 } },
                (decodedText) => handleScan(decodedText),
                () => {}
            )
            .catch((err) => {
                console.error("Camera start error:", err);
                setCameraActive(false);
            });

        return () => {
            if (scanner.isScanning) {
                scanner.stop().catch(() => {});
            }
        };
    }, [scannerMode, cameraActive, handleScan]);

    const resetResult = () => {
        setResult(null);
        setManualCode("");
        lastScannedRef.current = "";
    };

    if (!stats) {
        return (
            <div className="flex h-[60vh] items-center justify-center">
                <Zap className="h-10 w-10 text-[#ccff00] animate-pulse fill-black stroke-black stroke-2" />
            </div>
        );
    }

    return (
        <div className="space-y-6 relative font-['Outfit']">
            <div className="flex flex-col lg:flex-row gap-6">
                
                {/* Access Portal Side */}
                <div className="w-full lg:w-[420px] flex flex-col gap-4 lg:gap-6 shrink-0">
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="border-4 border-theme-strong bg-theme-raised shadow-[4px_4px_0px_0px_var(--border-strong)] relative overflow-hidden"
                    >
                        <div className="p-4 md:p-6 border-b-4 border-theme-strong bg-theme-sidebar">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 md:h-12 md:w-12 border-2 border-theme-strong bg-theme-sidebar flex items-center justify-center">
                                    <Zap className="h-5 w-5 md:h-6 md:w-6 text-green-500 fill-current" />
                                </div>
                                <div>
                                    <h2 className="font-black uppercase tracking-widest text-lg md:text-xl font-['Syncopate'] text-theme">ACCESS PORTAL</h2>
                                    <p className="text-[10px] md:text-xs font-bold text-slate-700 uppercase tracking-widest mt-1">ENTRY VERIFICATION</p>
                                </div>
                            </div>
                        </div>

                        <div className="p-4 md:p-6">
                            <div className="flex gap-2 mb-4 md:mb-6 border-2 border-theme-strong p-1 bg-theme-sidebar">
                                <button
                                    onClick={() => { setScannerMode("manual"); setCameraActive(false); }}
                                    className={`flex-1 flex items-center justify-center gap-2 py-3 px-3 text-xs font-black uppercase tracking-widest transition-all ${
                                        scannerMode === "manual"
                                            ? "bg-black text-white border-2 border-theme-strong shadow-[2px_2px_0px_0px_rgba(204,255,0,1)] translate-x-[-2px] translate-y-[-2px]"
                                            : "text-theme-muted hover:text-theme hover:bg-theme-sidebar border-2 border-transparent"
                                    }`}
                                >
                                    <Keyboard className="h-4 w-4" />
                                    MANUAL ENTRY
                                </button>
                                <button
                                    onClick={() => { setScannerMode("camera"); setCameraActive(true); }}
                                    className={`flex-1 flex items-center justify-center gap-2 py-3 px-3 text-xs font-black uppercase tracking-widest transition-all ${
                                        scannerMode === "camera"
                                            ? "bg-[#ccff00] text-theme border-2 border-theme-strong shadow-[4px_4px_0px_0px_var(--border-strong)] translate-x-[-2px] translate-y-[-2px]"
                                            : "text-theme-muted hover:text-theme hover:bg-theme-sidebar border-2 border-transparent"
                                    }`}
                                >
                                    <Camera className="h-4 w-4" />
                                    SCAN CODE
                                </button>
                            </div>

                            <AnimatePresence mode="wait">
                                {!result ? (
                                    <motion.div key="scanner" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }}>
                                        {scannerMode === "manual" ? (
                                            <form onSubmit={handleManualSubmit} className="space-y-4">
                                                <div className="relative">
                                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                        <Search className="h-5 w-5 text-theme" />
                                                    </div>
                                                    <input
                                                        type="text"
                                                        value={manualCode}
                                                        onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                                                        placeholder="ENTER ID..."
                                                        className="w-full h-14 pl-12 pr-4 bg-theme-sidebar border-2 border-theme-strong text-theme font-black font-mono tracking-widest focus:outline-none focus:bg-[#ccff00]/10 focus:shadow-[4px_4px_0px_0px_var(--border-strong)] transition-all placeholder:text-theme-muted"
                                                        autoFocus
                                                    />
                                                </div>
                                                <button
                                                    type="submit"
                                                    disabled={scanning || !manualCode.trim()}
                                                    className="w-full h-14 bg-black text-white font-black uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 border-2 border-theme-strong hover:bg-[#ccff00] hover:text-theme transition-colors shadow-[6px_6px_0px_0px_rgba(204,255,0,1)] hover:translate-x-[6px] hover:translate-y-[6px] hover:shadow-[0px_0px_0px_0px_rgba(204,255,0,1)] group"
                                                >
                                                    {scanning ? (
                                                        <>
                                                            <div className="h-5 w-5 border-2 border-[#ccff00]/30 border-t-[#ccff00] rounded-full animate-spin" />
                                                            VERIFYING...
                                                        </>
                                                    ) : (
                                                        <>
                                                            AUTHORIZE
                                                            <ChevronRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                                                        </>
                                                    )}
                                                </button>
                                            </form>
                                        ) : (
                                            <div className="relative">
                                                <div
                                                    id="qr-reader-main"
                                                    className="overflow-hidden border-4 border-theme-strong bg-theme-sidebar"
                                                    style={{ minHeight: "280px" }}
                                                />
                                                {!cameraActive && (
                                                    <button
                                                        onClick={() => setCameraActive(true)}
                                                        className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/80 gap-4 group"
                                                    >
                                                        <div className="h-16 w-16 border-2 border-[#ccff00] bg-black flex items-center justify-center text-[#ccff00] group-hover:scale-110 transition-transform">
                                                            <Camera className="h-8 w-8" />
                                                        </div>
                                                        <span className="text-sm font-black uppercase tracking-widest text-[#ccff00]">ACTIVATE SCANNER</span>
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </motion.div>
                                ) : (
                                    <motion.div key="result" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }}>
                                        <div className={`p-6 border-4 shadow-[4px_4px_0px_0px_var(--border-strong)] ${
                                            result.status === "checked_in" ? "bg-emerald-50 border-emerald-500" :
                                            result.status === "already_checked_in" ? "bg-amber-50 border-amber-500" : 
                                            "bg-red-50 border-red-500"
                                        }`}>
                                            <div className="text-center">
                                                <div className={`mx-auto h-16 w-16 border-4 flex items-center justify-center mb-4 ${
                                                    result.status === "checked_in" ? "bg-emerald-500 border-theme-strong text-white" :
                                                    result.status === "already_checked_in" ? "bg-amber-500 border-theme-strong text-theme" : 
                                                    "bg-red-500 border-theme-strong text-white"
                                                }`}>
                                                    {result.status === "checked_in" && <CheckCircle2 className="h-8 w-8" />}
                                                    {result.status === "already_checked_in" && <AlertTriangle className="h-8 w-8" />}
                                                    {result.status === "error" && <XCircle className="h-8 w-8" />}
                                                </div>

                                                {result.member ? (
                                                    <>
                                                        <h3 className="text-2xl font-black uppercase font-['Syncopate'] text-theme mb-1">
                                                            {result.member.firstName} {result.member.lastName}
                                                        </h3>
                                                        <p className={`text-sm font-black tracking-widest uppercase mb-4 ${
                                                            result.status === "checked_in" ? "text-emerald-600" : "text-amber-600"
                                                        }`}>
                                                            {result.status === "checked_in" ? "ACCESS GRANTED" : "ALREADY IN FACILITY"}
                                                        </p>
                                                        {result.membership && (
                                                            <div className="border-2 border-theme-strong bg-theme-raised p-4 text-sm text-left">
                                                                <div className="text-[10px] font-black text-theme-muted uppercase tracking-widest mb-1">ACTIVE PROTOCOL</div>
                                                                <div className="font-black text-theme uppercase">{result.membership.planName}</div>
                                                                <div className="text-[10px] font-bold text-slate-600 uppercase mt-1">EXPIRES: {formatDate(result.membership.endDate)}</div>
                                                            </div>
                                                        )}
                                                    </>
                                                ) : (
                                                    <>
                                                        <h3 className="text-2xl font-black uppercase font-['Syncopate'] text-red-600 mb-1">
                                                            ACCESS DENIED
                                                        </h3>
                                                        {result.errorDetails ? (
                                                            <DetailedErrorPanel error={result.errorDetails} className="mt-2 text-left" />
                                                        ) : (
                                                            <p className="text-sm font-bold text-slate-700">{result.message}</p>
                                                        )}
                                                    </>
                                                )}

                                                <button
                                                    onClick={resetResult}
                                                    className="mt-6 w-full py-4 font-black uppercase tracking-widest border-2 border-theme-strong bg-black text-white hover:bg-transparent hover:text-theme transition-colors"
                                                >
                                                    NEXT SCAN
                                                </button>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </motion.div>

                    <div className="grid grid-cols-2 gap-3 md:gap-4">
                        {[
                            { label: "TOTAL ATHLETES", value: stats.totalMembers, icon: Users, hover: "hover:bg-blue-400 hover:text-theme" },
                            { label: "TODAY'S OPS", value: stats.todayCheckIns, icon: Activity, hover: "hover:bg-[#ccff00] hover:text-theme" },
                            { label: "ACTIVE PROTOCOLS", value: stats.activeMemberships, icon: TrendingUp, hover: "hover:bg-emerald-400 hover:text-theme" },
                            { label: "EXPIRING SOON", value: stats.expiringSoon, icon: AlertTriangle, hover: "hover:bg-amber-400 hover:text-theme" },
                        ].map((stat, i) => (
                            <motion.div
                                key={stat.label}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 + i * 0.05 }}
                                className={`border-4 border-theme-strong bg-theme-raised p-3 md:p-5 text-center shadow-[4px_4px_0px_0px_var(--border-strong)] group transition-colors cursor-default ${stat.hover}`}
                            >
                                <stat.icon className="h-6 w-6 md:h-8 md:w-8 text-theme mx-auto mb-2 md:mb-3" />
                                <div className="text-2xl md:text-4xl font-black font-['Syncopate'] text-theme mb-1">
                                    {stat.value}
                                </div>
                                <div className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-theme-muted group-hover:text-theme transition-colors">
                                    {stat.label}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* Right Side Logs */}
                <div className="flex-1 flex flex-col gap-6">
                    <motion.div 
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        className="flex-1 min-h-[260px] md:min-h-[320px] border-4 border-theme-strong bg-theme-raised shadow-[4px_4px_0px_0px_var(--border-strong)] flex flex-col relative"
                    >
                        <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] dark:bg-[radial-gradient(transparent_1px,transparent_1px)] [background-size:16px_16px] opacity-50 z-0 pointer-events-none" />
                        <div className="p-4 md:p-5 border-b-4 border-theme-strong bg-theme-sidebar flex items-center justify-between relative z-10">
                            <h3 className="font-black uppercase tracking-widest flex items-center gap-2 md:gap-3 text-sm md:text-base text-black">
                                <span className="h-2 w-2 -full bg-[#ccff00] animate-pulse" />
                                LIVE OPS
                            </h3>
                            <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest px-2 md:px-3 py-1 bg-white text-green-500 border-2 border-theme-strong">
                                {todayCheckIns?.length ?? 0} LOGGED
                            </span>
                        </div>
                        <div className="flex-1 overflow-auto relative z-10 bg-theme-raised/80">
                            {!todayCheckIns || todayCheckIns.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center p-8 text-theme-muted">
                                    <Activity className="h-12 w-12 mb-4 opacity-30" />
                                    <p className="text-xs font-black uppercase tracking-widest">AWAITING SIGNAL</p>
                                </div>
                            ) : (
                                <div className="divide-y-2 divide-black">
                                    {todayCheckIns.slice(0, 8).map((ci) => (
                                        <Link
                                            to={`/members/${ci.memberId}`}
                                            key={ci._id}
                                            className="flex items-center gap-4 p-4 hover:bg-[#ccff00]/10 transition-colors group"
                                        >
                                            <div className="h-12 w-12 border-2 border-theme-strong bg-theme-raised flex items-center justify-center text-theme font-black shadow-[4px_4px_0px_0px_var(--border-strong)] group-hover:bg-[#ccff00] transition-colors">
                                                {ci.member.firstName[0]}{ci.member.lastName[0]}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="text-base font-black uppercase truncate text-theme">
                                                    {ci.member.firstName} {ci.member.lastName}
                                                </div>
                                                <div className="text-xs font-bold flex items-center gap-2 text-theme-muted uppercase tracking-widest mt-1">
                                                    <Clock className="h-3 w-3" />
                                                    {formatDateTime(ci.timestamp)}
                                                </div>
                                            </div>
                                            <ChevronRight className="h-6 w-6 text-theme opacity-0 group-hover:opacity-100 group-hover:translate-x-2 transition-all" />
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>
                    </motion.div>

                    <motion.div 
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 }}
                        className="flex-1 min-h-[260px] md:min-h-[320px] border-4 border-theme-strong bg-theme-raised shadow-[4px_4px_0px_0px_var(--border-strong)] flex flex-col relative overflow-hidden"
                    >
                        <div className="absolute top-[-50px] right-[-50px] text-slate-100 pointer-events-none z-0">
                            <AlertTriangle className="h-24 md:h-48 w-24 md:w-48 opacity-20" />
                        </div>
                        <div className="p-4 md:p-5 border-b-4 border-theme-strong bg-amber-500 flex items-center justify-between relative z-10">
                            <h3 className="font-black uppercase tracking-widest flex items-center gap-2 md:gap-3 text-theme text-sm md:text-base">
                                <AlertTriangle className="h-4 w-4 md:h-5 md:w-5" />
                                ACTION REQUIRED
                            </h3>
                            <Link to="/members" className="text-[9px] md:text-[10px] font-black uppercase tracking-widest border-2 border-theme-strong bg-theme-raised px-2 md:px-3 py-1 hover:bg-black hover:text-white transition-colors shadow-[4px_4px_0px_0px_var(--border-strong)]">
                                VIEW ALL
                            </Link>
                        </div>
                        <div className="flex-1 overflow-auto relative z-10 bg-theme-raised">
                            {!expiringMemberships || expiringMemberships.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center p-8 text-theme-muted">
                                    <CheckCircle2 className="h-12 w-12 mb-4 opacity-30" />
                                    <p className="text-xs font-black uppercase tracking-widest">SYSTEMS NOMINAL</p>
                                </div>
                            ) : (
                                <div className="divide-y-2 divide-black">
                                    {expiringMemberships.slice(0, 8).map((em) => (
                                        <Link
                                            to={`/members/${em.memberId}`}
                                            key={em._id}
                                            className="flex items-center gap-4 p-4 hover:bg-amber-50 transition-colors group"
                                        >
                                            <div className="h-12 w-12 border-2 border-theme-strong bg-theme-raised flex items-center justify-center text-theme font-black shadow-[4px_4px_0px_0px_var(--border-strong)] group-hover:bg-amber-400 transition-colors">
                                                {em.member.firstName[0]}{em.member.lastName[0]}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="text-base font-black uppercase truncate text-theme">
                                                    {em.member.firstName} {em.member.lastName}
                                                </div>
                                                <div className="text-xs font-bold text-theme-muted uppercase tracking-widest mt-1">
                                                    {em.planName}
                                                </div>
                                            </div>
                                            <div className="text-right flex flex-col items-end">
                                                <div className="text-[10px] font-black tracking-widest text-white bg-amber-500 px-2 py-1 uppercase border-2 border-theme-strong mb-1">
                                                    EXPIRING
                                                </div>
                                                <div className="text-xs font-bold text-theme uppercase tracking-widest">
                                                    {formatTimeAgo(em.endDate)}
                                                </div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
