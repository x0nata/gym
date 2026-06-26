import { useState, useCallback } from "react";
import { useQuery, useMutation } from "convex/react";
import { motion } from "framer-motion";
import { ScanLine, Camera, Keyboard, Search, CheckCircle2, AlertTriangle, XCircle, Clock3, Scan } from "lucide-react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "../lib/useAuth";
import { formatDate, formatDateTime } from "../lib/utils";
import type { Doc } from "../../convex/_generated/dataModel";
import { toDisplayError, type AppErrorDetails } from "../lib/errorHandling";
import { DetailedErrorPanel } from "../components/feedback/DetailedErrorPanel";
import { useQrScanner } from "../lib/useQrScanner";

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

  const [scannerMode, setScannerMode] = useState<"manual" | "camera">("manual");
  const [manualCode, setManualCode] = useState("");
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [cameraActive, setCameraActive] = useState(false);

  const handleScan = useCallback(async (qrCode: string) => {
    if (!sessionToken) return;
    setScanning(true);
    setResult(null);
    try {
      const res = await checkIn({ qrCode, sessionToken });
      setResult(res as ScanResult);
    } catch (err: unknown) {
      const details = toDisplayError(err, {
        title: "Check-in failed",
        fallbackMessage: "Scan failed. Try again.",
      });
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

  const resetResult = () => {
    setResult(null);
    setManualCode("");
  };

  return (
    <div className="space-y-6 font-['Outfit'] text-theme">
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="border-4 border-theme-strong bg-theme-raised shadow-[4px_4px_0px_0px_var(--border-strong)]"
      >
        <div className="p-6 border-b-4 border-theme-strong bg-theme-sidebar text-black flex items-center gap-4">
          <div className="h-12 w-12 border-2 border-theme-strong bg-white text-black flex items-center justify-center">
            <ScanLine className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-black tracking-[0.2em] text-[#ccff00]">Access</p>
            <h1 className="text-2xl md:text-3xl font-black font-['Syncopate'] uppercase">Check-in</h1>
          </div>
        </div>
      </motion.section>

      <div className="grid lg:grid-cols-[1.05fr_1fr] gap-4 md:gap-6">
        <section className="border-4 border-theme-strong bg-theme-raised shadow-[4px_4px_0px_0px_var(--border-strong)] p-4 md:p-5">
          <div className="flex gap-2 p-1 border-2 border-theme-strong bg-theme-sidebar mb-4 md:mb-5">
            <button
              onClick={() => {
                setScannerMode("manual");
                setCameraActive(false);
              }}
              className={`flex-1 py-2 text-xs font-black uppercase tracking-widest border-2 ${scannerMode === "manual" ? "bg-black text-white border-theme-strong" : "border-transparent text-theme-muted"}`}
            >
              <span className="inline-flex items-center gap-2"><Keyboard className="h-4 w-4" /> Manual</span>
            </button>
            <button
              onClick={() => {
                setScannerMode("camera");
                setCameraActive(true);
              }}
              className={`flex-1 py-2 text-xs font-black uppercase tracking-widest border-2 ${scannerMode === "camera" ? "bg-[#ccff00] text-black border-theme-strong" : "border-transparent text-theme-muted"}`}
            >
              <span className="inline-flex items-center gap-2"><Camera className="h-4 w-4" /> Camera</span>
            </button>
          </div>

          {!result ? (
            scannerMode === "manual" ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (manualCode.trim()) {
                    void handleScan(manualCode.trim());
                  }
                }}
                className="space-y-4"
              >
                <div className="relative">
                  <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-theme-muted" />
                  <input
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                    placeholder="Enter member QR ID"
                    className="w-full h-12 border-2 border-theme-strong bg-theme-raised text-theme pl-10 pr-3 font-black uppercase tracking-widest text-sm focus:outline-none focus:ring-2 focus:ring-theme-strong"
                  />
                </div>
                <button
                  type="submit"
                  disabled={scanning || !manualCode.trim()}
                  className="w-full h-12 border-2 border-theme-strong bg-black text-white font-black uppercase tracking-widest disabled:opacity-50 hover:bg-gray-900 transition-colors"
                >
                  {scanning ? "Checking..." : "Check in"}
                </button>
              </form>
            ) : (
              <div className="space-y-3">
                <div className="relative border-4 border-theme-strong bg-theme-sidebar overflow-hidden" style={{ aspectRatio: "1/1", maxWidth: "400px", width: "100%", margin: "0 auto" }}>
                  <div id="scan-reader" className="w-full h-full" />
                  {cameraActive && !cameraError && (
                    <div className="absolute inset-0 pointer-events-none">
                      <div className="absolute top-3 left-3 w-7 h-7 border-t-4 border-l-4 border-[#ccff00]" />
                      <div className="absolute top-3 right-3 w-7 h-7 border-t-4 border-r-4 border-[#ccff00]" />
                      <div className="absolute bottom-3 left-3 w-7 h-7 border-b-4 border-l-4 border-[#ccff00]" />
                      <div className="absolute bottom-3 right-3 w-7 h-7 border-b-4 border-r-4 border-[#ccff00]" />
                      <motion.div
                        className="absolute left-3 right-3 h-0.5 bg-[#ccff00] shadow-[0_0_8px_#ccff00]"
                        animate={{ top: ["12%", "88%", "12%"] }}
                        transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                      />
                      <div className="absolute bottom-4 left-0 right-0 text-center">
                        <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-[#ccff00] bg-black/70 px-2.5 py-1">
                          <Scan className="h-3.5 w-3.5" />
                          {scannerActive ? "Scanning" : "Ready"}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
                {cameraError && (
                  <div className="p-3 border-2 border-red-500 bg-red-500/10 text-red-600 text-xs font-bold uppercase tracking-wider text-center">
                    {cameraError}
                  </div>
                )}
                {!cameraActive && !cameraError && (
                  <button
                    onClick={() => setCameraActive(true)}
                    className="w-full h-11 border-2 border-theme-strong bg-[#ccff00] text-black font-black uppercase tracking-widest hover:bg-[#b3e600] transition-colors"
                  >
                    Start scanner
                  </button>
                )}
                {cameraError && (
                  <button
                    onClick={() => {
                      setCameraActive(false);
                      setTimeout(() => setCameraActive(true), 100);
                    }}
                    className="w-full h-11 border-2 border-theme-strong bg-black text-white font-black uppercase tracking-widest hover:bg-gray-900 transition-colors"
                  >
                    Retry camera
                  </button>
                )}
              </div>
            )
          ) : (
            <div
              className={`border-4 border-theme-strong p-5 ${
                result.status === "checked_in"
                  ? "bg-emerald-500/10"
                  : result.status === "already_checked_in"
                    ? "bg-amber-500/10"
                    : "bg-red-500/10"
              }`}
            >
              <div className="text-center">
                <div className="mx-auto h-12 w-12 border-2 border-theme-strong bg-theme-raised flex items-center justify-center mb-3">
                  {result.status === "checked_in" && <CheckCircle2 className="h-6 w-6 text-emerald-500" />}
                  {result.status === "already_checked_in" && <AlertTriangle className="h-6 w-6 text-amber-500" />}
                  {result.status === "error" && <XCircle className="h-6 w-6 text-red-500" />}
                </div>
                <p className="text-xl font-black uppercase text-theme">{result.member ? `${result.member.firstName} ${result.member.lastName}` : "Not allowed"}</p>
                {result.membership && (
                  <div className="border-2 border-theme-strong bg-theme-raised p-3 mt-2 mx-auto max-w-xs">
                    <div className="text-[10px] font-black text-theme-muted uppercase tracking-widest mb-1">Plan</div>
                    <div className="font-black text-theme uppercase">{result.membership.planName}</div>
                    <div className="text-[10px] font-bold text-theme-muted uppercase mt-1">
                      Ends: {formatDate(result.membership.endDate)}
                    </div>
                    {result.daysRemaining !== undefined && (
                      <div className="text-[10px] font-bold text-theme-muted uppercase mt-0.5">
                        {result.daysRemaining} day{result.daysRemaining !== 1 ? "s" : ""} left
                      </div>
                    )}
                  </div>
                )}
                {result.errorDetails ? (
                  <DetailedErrorPanel error={result.errorDetails} className="mt-3 text-left" />
                ) : (
                  <p className="mt-2 text-sm font-bold uppercase text-theme-muted">{result.message ?? (result.status === "checked_in" ? "Checked in" : "Already checked in")}</p>
                )}
                <button onClick={resetResult} className="mt-4 h-10 px-4 border-2 border-theme-strong bg-black text-white text-xs font-black uppercase tracking-widest hover:bg-gray-900 transition-colors">Next</button>
              </div>
            </div>
          )}
        </section>

        <section className="border-4 border-theme-strong bg-theme-raised shadow-[4px_4px_0px_0px_var(--border-strong)] overflow-hidden">
          <div className="p-4 border-b-4 border-theme-strong bg-theme-sidebar flex items-center justify-between">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-theme-muted">Today</p>
            <p className="text-xs font-black uppercase text-theme">{todayCheckIns?.length ?? 0} check-ins</p>
          </div>
          {!todayCheckIns || todayCheckIns.length === 0 ? (
            <div className="py-16 text-center text-theme-muted font-black uppercase tracking-widest">No check-ins yet</div>
          ) : (
            <div className="divide-y divide-theme-strong max-h-[540px] overflow-auto">
              {todayCheckIns.map((item) => (
                <div key={item._id} className="p-4 flex items-center justify-between gap-4 hover:bg-theme-sidebar/50 transition-colors">
                  <div>
                    <p className="font-black uppercase text-sm text-theme">{item.member.firstName} {item.member.lastName}</p>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-theme-muted">{item.member.qrCode}</p>
                  </div>
                  <p className="text-xs font-bold uppercase tracking-wider text-theme-muted inline-flex items-center gap-1">
                    <Clock3 className="h-3.5 w-3.5" />
                    {formatDateTime(item.timestamp)}
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
