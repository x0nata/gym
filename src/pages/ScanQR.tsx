import { useState, useCallback, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { motion } from "framer-motion";
import { ScanLine, Camera, Keyboard, Search, CheckCircle2, AlertTriangle, XCircle, Clock3, Scan, ImageUp, Loader2 } from "lucide-react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "../lib/useAuth";
import { formatDate, formatDateTime } from "../lib/utils";
import type { Doc } from "../../convex/_generated/dataModel";
import { toDisplayError, type AppErrorDetails } from "../lib/errorHandling";
import { DetailedErrorPanel } from "../components/feedback/DetailedErrorPanel";
import { useQrScanner, scanImageFile } from "../lib/useQrScanner";

type ScanResult = {
    status: "checked_in" | "already_checked_in" | "error";
    member?: Doc<"members">;
    membership?: Doc<"memberships">;
    checkInTime?: number;
    daysRemaining?: number;
    message?: string;
    errorDetails?: AppErrorDetails;
};

export default function ScanQR() {
    const { user } = useAuth();
    const sessionToken = user?.sessionToken;
    const todayCheckIns = useQuery(api.checkIns.getToday, sessionToken ? { sessionToken } : "skip");
    const checkIn = useMutation(api.checkIns.scanAndCheckIn);

    const [scannerMode, setScannerMode] = useState<"manual" | "camera" | "photo">("manual");
    const [manualCode, setManualCode] = useState("");
    const [scanning, setScanning] = useState(false);
    const [result, setResult] = useState<ScanResult | null>(null);
    const [cameraActive, setCameraActive] = useState(false);
    const [photoFile, setPhotoFile] = useState<{ file: File; preview: string } | null>(null);
    const [photoScanning, setPhotoScanning] = useState(false);
    const [photoError, setPhotoError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleScan = useCallback(async (qrCode: string) => {
        if (!sessionToken) return;
        setScanning(true);
        setResult(null);
        try {
            const res = await checkIn({ qrCode, sessionToken });
            setResult(res as ScanResult);
        } catch (err: unknown) {
            const details = toDisplayError(err, { title: "Check-in failed", fallbackMessage: "Scan failed. Try again." });
            setResult({ status: "error", message: details.message, errorDetails: details });
        } finally {
            setScanning(false);
        }
    }, [checkIn, sessionToken]);

    const { error: cameraError, active: scannerActive } = useQrScanner({
        elementId: "scan-reader",
        onScan: handleScan,
        enabled: cameraActive && scannerMode === "camera" && !result,
    });

    const handlePhotoFile = useCallback(async (file: File) => {
        const preview = URL.createObjectURL(file);
        setPhotoFile({ file, preview });
        setPhotoError(null);
        setPhotoScanning(true);
        try {
            const code = await scanImageFile(file);
            if (code) {
                URL.revokeObjectURL(preview);
                setPhotoFile(null);
                void handleScan(code);
            } else {
                setPhotoError("No QR code found in image");
            }
        } catch {
            setPhotoError("Failed to scan image");
        } finally {
            setPhotoScanning(false);
        }
    }, [handleScan]);

    const onFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0];
        if (f) void handlePhotoFile(f);
        e.target.value = "";
    }, [handlePhotoFile]);

    const resetResult = () => {
        setResult(null);
        setManualCode("");
    };

    const resultTone = result?.status === "checked_in" ? "success" : result?.status === "already_checked_in" ? "warning" : "danger";
    const ResultIcon = result?.status === "checked_in" ? CheckCircle2 : result?.status === "already_checked_in" ? AlertTriangle : XCircle;

    return (
        <div className="space-y-5">
            <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="card overflow-hidden">
                <div className="p-5 md:p-6 border-b border-theme flex items-center gap-3.5">
                    <span className="grid h-12 w-12 place-items-center rounded-2xl bg-energy/15 text-energy">
                        <ScanLine className="h-6 w-6" />
                    </span>
                    <div>
                        <span className="eyebrow text-energy">Access</span>
                        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight mt-1">Check-in scanner</h1>
                    </div>
                </div>
            </motion.section>

            <div className="grid lg:grid-cols-[1.05fr_1fr] gap-5">
                <section className="card p-5">
                    <div className="grid grid-cols-3 gap-1 p-1 rounded-xl border border-theme mb-5">
                        <button
                            onClick={() => { setScannerMode("manual"); setCameraActive(false); }}
                            className={`py-2.5 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${scannerMode === "manual" ? "bg-hover-accent text-theme" : "text-theme-muted hover:text-theme"}`}
                        >
                            <Keyboard className="h-4 w-4" /> Manual
                        </button>
                        <button
                            onClick={() => { setScannerMode("camera"); setCameraActive(true); }}
                            className={`py-2.5 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${scannerMode === "camera" ? "bg-hover-accent text-theme" : "text-theme-muted hover:text-theme"}`}
                        >
                            <Camera className="h-4 w-4" /> Camera
                        </button>
                        <button
                            onClick={() => { setScannerMode("photo"); setCameraActive(false); }}
                            className={`py-2.5 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${scannerMode === "photo" ? "bg-hover-accent text-theme" : "text-theme-muted hover:text-theme"}`}
                        >
                            <ImageUp className="h-4 w-4" /> Photo
                        </button>
                    </div>

                    {!result ? (
                        scannerMode === "manual" ? (
                            <form onSubmit={(e) => { e.preventDefault(); if (manualCode.trim()) void handleScan(manualCode.trim()); }} className="space-y-4">
                                <div className="relative">
                                    <Search className="h-4 w-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-theme-muted" />
                                    <input
                                        value={manualCode}
                                        onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                                        placeholder="Enter member QR ID"
                                        className="field !pl-11 font-mono tracking-widest"
                                    />
                                </div>
                                <button type="submit" disabled={scanning || !manualCode.trim()} className="btn btn--primary btn--md w-full">
                                    {scanning ? "Checking…" : "Check in"}
                                </button>
                            </form>
                        ) : scannerMode === "photo" ? (
                            <div className="space-y-4">
                                <input ref={fileInputRef} type="file" accept="image/*" capture="environment" onChange={onFileInput} className="hidden" />
                                {photoFile ? (
                                    <div className="relative rounded-2xl border border-theme-strong overflow-hidden bg-bg-solid" style={{ aspectRatio: "1/1", maxWidth: "360px", width: "100%", margin: "0 auto" }}>
                                        <img src={photoFile.preview} alt="Uploaded QR" className="w-full h-full object-contain" />
                                        {photoScanning && (
                                            <div className="absolute inset-0 bg-black/60 grid place-items-center backdrop-blur">
                                                <Loader2 className="h-8 w-8 text-accent-light animate-spin" />
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={photoScanning}
                                        className="w-full rounded-2xl border-2 border-dashed border-theme-strong hover:bg-hover transition-colors disabled:opacity-50 grid place-items-center"
                                        style={{ aspectRatio: "1/1", maxWidth: "360px", margin: "0 auto" }}
                                    >
                                        <div className="flex flex-col items-center gap-3 p-6 text-center">
                                            <ImageUp className="h-10 w-10 text-theme-muted" />
                                            <span className="text-sm font-semibold text-theme-secondary">Upload photo</span>
                                            <span className="text-xs text-theme-muted">QR code detected automatically</span>
                                        </div>
                                    </button>
                                )}
                                {photoError && (
                                    <div className="rounded-xl border border-danger/40 bg-danger/10 p-3 text-xs text-danger text-center flex items-center justify-center gap-2">
                                        <XCircle className="h-4 w-4 shrink-0" /> {photoError}
                                    </div>
                                )}
                                {photoFile && !photoScanning && (
                                    <button
                                        onClick={() => { URL.revokeObjectURL(photoFile.preview); setPhotoFile(null); setPhotoError(null); }}
                                        className="btn btn--ghost btn--md w-full"
                                    >
                                        Try another photo
                                    </button>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <div className="relative rounded-2xl border border-theme-strong bg-bg-solid overflow-hidden" style={{ aspectRatio: "1/1", maxWidth: "360px", width: "100%", margin: "0 auto" }}>
                                    <div id="scan-reader" className="w-full h-full" />
                                    {cameraActive && !cameraError && (
                                        <div className="absolute inset-0 pointer-events-none">
                                            <div className="absolute top-3 left-3 w-7 h-7 border-t-2 border-l-2 border-accent-light rounded-tl-lg" />
                                            <div className="absolute top-3 right-3 w-7 h-7 border-t-2 border-r-2 border-accent-light rounded-tr-lg" />
                                            <div className="absolute bottom-3 left-3 w-7 h-7 border-b-2 border-l-2 border-accent-light rounded-bl-lg" />
                                            <div className="absolute bottom-3 right-3 w-7 h-7 border-b-2 border-r-2 border-accent-light rounded-br-lg" />
                                            <motion.div className="absolute left-3 right-3 h-0.5 bg-accent-light shadow-[0_0_10px_var(--color-accent)]" animate={{ top: ["12%", "88%", "12%"] }} transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }} />
                                            <div className="absolute bottom-4 left-0 right-0 text-center">
                                                <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-accent-light bg-black/70 px-2.5 py-1 rounded-full backdrop-blur">
                                                    <Scan className="h-3.5 w-3.5" /> {scannerActive ? "Scanning" : "Ready"}
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                {cameraError && (
                                    <div className="rounded-xl border border-danger/40 bg-danger/10 p-3 text-xs text-danger text-center">{cameraError}</div>
                                )}
                                {!cameraActive && !cameraError && (
                                    <button onClick={() => setCameraActive(true)} className="btn btn--primary btn--md w-full">Start scanner</button>
                                )}
                                {cameraError && (
                                    <button onClick={() => { setCameraActive(false); setTimeout(() => setCameraActive(true), 100); }} className="btn btn--ghost btn--md w-full">Retry camera</button>
                                )}
                            </div>
                        )
                    ) : (
                        <div className={`rounded-2xl border p-5 text-center ${resultTone === "success" ? "border-success/40 bg-success/10" : resultTone === "warning" ? "border-warning/40 bg-warning/10" : "border-danger/40 bg-danger/10"}`}>
                            <span className={`mx-auto grid h-12 w-12 place-items-center rounded-2xl mb-3 ${resultTone === "success" ? "bg-success/20 text-success" : resultTone === "warning" ? "bg-warning/20 text-warning" : "bg-danger/20 text-danger"}`}>
                                <ResultIcon className="h-6 w-6" />
                            </span>
                            <p className="text-xl font-extrabold tracking-tight">{result.member ? `${result.member.firstName} ${result.member.lastName}` : "Not allowed"}</p>
                            {result.membership && (
                                <div className="rounded-xl border border-theme bg-bg-raised p-3 mt-3 mx-auto max-w-xs">
                                    <div className="eyebrow">Plan</div>
                                    <div className="font-bold mt-1">{result.membership.planName}</div>
                                    <div className="text-xs text-theme-muted mt-1">Ends: {formatDate(result.membership.endDate)}</div>
                                    {result.daysRemaining !== undefined && (
                                        <div className="text-xs text-theme-muted mt-0.5">{result.daysRemaining} day{result.daysRemaining !== 1 ? "s" : ""} left</div>
                                    )}
                                </div>
                            )}
                            {result.errorDetails ? (
                                <DetailedErrorPanel error={result.errorDetails} className="mt-3 text-left" />
                            ) : (
                                <p className="mt-2 text-sm text-theme-secondary">{result.message ?? (result.status === "checked_in" ? "Checked in" : "Already checked in")}</p>
                            )}
                            <button onClick={resetResult} className="btn btn--ghost btn--md mt-4">Next</button>
                        </div>
                    )}
                </section>

                <section className="card overflow-hidden">
                    <div className="p-4 border-b border-theme flex items-center justify-between">
                        <p className="eyebrow">Today</p>
                        <span className="pill pill--energy">{todayCheckIns?.length ?? 0} check-ins</span>
                    </div>
                    {!todayCheckIns || todayCheckIns.length === 0 ? (
                        <div className="py-16 text-center eyebrow">No check-ins yet</div>
                    ) : (
                        <div className="divide-y divide-[var(--border)] max-h-[560px] overflow-auto">
                            {todayCheckIns.map((item) => (
                                <div key={item._id} className="p-4 flex items-center justify-between gap-4 hover:bg-hover transition-colors">
                                    <div>
                                        <p className="font-semibold">{item.member.firstName} {item.member.lastName}</p>
                                        <p className="text-xs text-theme-muted font-mono mt-0.5">{item.member.qrCode}</p>
                                    </div>
                                    <p className="text-xs text-theme-muted inline-flex items-center gap-1.5">
                                        <Clock3 className="h-3.5 w-3.5" /> {formatDateTime(item.timestamp)}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
}
