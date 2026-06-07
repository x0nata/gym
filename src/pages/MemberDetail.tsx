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
  ChevronRight
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
      <div className="flex h-64 flex-col items-center justify-center space-y-4">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-theme-strong border-t-transparent"></div>
        <p className="font-['Syncopate'] text-sm font-bold uppercase tracking-widest text-theme-base">
          Loading...
        </p>
      </div>
    );
  }

  if (member === null) {
    return (
      <div className="max-w-2xl mx-auto border-4 border-theme-strong bg-theme-raised p-6 shadow-[4px_4px_0px_0px_var(--border-strong)]">
        <h1 className="text-xl font-black uppercase font-['Syncopate']">Member not found</h1>
        <p className="mt-2 text-sm font-bold text-theme-muted">This member is not available or you do not have access.</p>
        <Link to="/members" className="inline-flex mt-4 px-4 py-2 border-2 border-theme-strong bg-black text-white text-xs font-black uppercase tracking-widest">
          Back to members
        </Link>
      </div>
    );
  }

  const activeMembership = memberships?.find((m) => m.status === "active");

  const handleRenew = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);
    if (!sessionToken) {
      setActionError({
        title: "Session expired",
        message: "Your session expired. Sign in again to renew.",
        code: "UNAUTHORIZED",
      });
      return;
    }

    try {
      await createMembership({ memberId, planName, durationDays, amountPaid, sessionToken });
      setShowRenew(false);
    } catch (error) {
      setActionError(
        toDisplayError(error, {
          title: "Could not update membership",
          fallbackMessage: "Could not update membership now.",
        })
      );
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

  return (
    <div className="mx-auto max-w-7xl px-3 sm:px-4 py-4 sm:py-8 sm:px-6 lg:px-8 space-y-6 sm:space-y-8">
      {/* Back Link */}
      <Link 
        to="/members" 
        className="inline-flex items-center gap-2 font-['Syncopate'] text-xs font-bold uppercase tracking-wider text-theme-base hover:text-theme-muted transition-colors"
      >
        <ArrowLeft size={16} className="border-2 border-theme-strong rounded-full p-0.5" /> 
        Back to members
      </Link>

      {/* Header Profile Card */}
      <div className="flex flex-col md:flex-row gap-6 bg-theme-raised border-4 border-theme-strong shadow-[4px_4px_0px_0px_var(--border-strong)] p-6 md:p-8 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute -right-8 -top-8 w-32 h-32 bg-theme-sidebar border-4 border-theme-strong rotate-12 opacity-50 z-0"></div>
        <div className="absolute -left-4 -bottom-4 w-16 h-16 bg-theme-strong rounded-full opacity-10 z-0"></div>
        
        <div className="flex-1 flex flex-col sm:flex-row gap-4 sm:gap-6 items-start sm:items-center relative z-10">
          <div className="flex-shrink-0 w-24 h-24 sm:w-32 sm:h-32 bg-theme-strong text-theme-raised flex items-center justify-center text-4xl sm:text-5xl font-['Syncopate'] font-black uppercase border-4 border-theme-strong shadow-[4px_4px_0px_0px_var(--border-strong)]">
            {member.firstName[0]}
            {member.lastName[0]}
          </div>
          
          <div className="space-y-4">
            <div>
              <h1 className="text-3xl sm:text-5xl font-['Syncopate'] font-black uppercase tracking-tight text-theme-base break-words">
                {member.firstName} {member.lastName}
              </h1>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-6 text-sm font-bold uppercase tracking-wider text-theme-muted">
              <span className="flex items-center gap-2"><Mail size={16} className="text-theme-strong" /> {member.email}</span>
              <span className="flex items-center gap-2"><Phone size={16} className="text-theme-strong" /> {member.phone}</span>
              <span className="flex items-center gap-2"><Calendar size={16} className="text-theme-strong" /> Joined {formatDate(member.joinedAt)}</span>
            </div>
            
            <div>
              {activeMembership ? (
                <span className={`inline-flex items-center px-4 py-2 border-4 border-theme-strong text-sm font-black uppercase tracking-wider shadow-[4px_4px_0px_0px_var(--border-strong)] ${getMembershipStatusColor(activeMembership.endDate) === "active" ? "bg-green-500 text-white" : getMembershipStatusColor(activeMembership.endDate) === "warning" ? "bg-yellow-500 text-black" : "bg-red-500 text-white"}`}>
                  {activeMembership.planName} &middot; {getMembershipStatusLabel(activeMembership.endDate)}
                </span>
              ) : (
                <span className="inline-flex items-center px-4 py-2 border-4 border-theme-strong bg-red-500 text-white text-sm font-black uppercase tracking-wider shadow-[4px_4px_0px_0px_var(--border-strong)]">
                  No active plan
                </span>
              )}
            </div>
          </div>
        </div>

        {/* QR Section */}
        <div className="flex-shrink-0 flex flex-col items-center gap-3 md:gap-4 bg-theme-sidebar p-3 md:p-4 border-4 border-theme-strong relative z-10 sm:self-start md:self-stretch justify-center min-w-0 sm:min-w-[200px]">
          <div className="bg-white p-2 border-4 border-theme-strong shadow-[4px_4px_0px_0px_var(--border-strong)]">
            <QRCodeSVG
              id="member-qr-code"
              value={member.qrCode}
              size={200}
              bgColor="#ffffff"
              fgColor="#000000"
              level="M"
              includeMargin={true}
            />
          </div>
          <p className="font-['Syncopate'] text-xs font-bold uppercase tracking-widest bg-theme-strong text-theme-raised px-2 py-1 truncate max-w-full">
            {member.qrCode}
          </p>
          <div className="flex gap-2 w-full">
            <button 
              className="flex-1 flex items-center justify-center gap-1 border-2 border-theme-strong bg-theme-raised hover:bg-theme-sidebar p-2 text-xs font-bold uppercase tracking-wider transition-colors"
              onClick={handlePrintQR}
            >
              <Printer size={14} /> Print
            </button>
            <button
              className="flex-1 flex items-center justify-center gap-1 border-2 border-theme-strong bg-theme-raised hover:bg-theme-sidebar p-2 text-xs font-bold uppercase tracking-wider transition-colors"
              onClick={() => {
                navigator.clipboard.writeText(member.qrCode);
              }}
            >
              <Download size={14} /> Copy
            </button>
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex justify-end">
        <button 
          className="flex items-center gap-2 bg-theme-strong text-theme-raised border-4 border-theme-strong px-6 py-4 font-['Syncopate'] text-sm font-black uppercase tracking-widest shadow-[4px_4px_0px_0px_var(--border-strong)] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[2px_2px_0px_0px_var(--border-strong)] transition-all active:translate-y-[4px] active:translate-x-[4px] active:shadow-none"
          onClick={() => setShowRenew(!showRenew)}
        >
          <CreditCard size={18} /> {activeMembership ? "Renew" : "Add"} plan
        </button>
      </div>

      {actionError && <DetailedErrorPanel error={actionError} />}

      {/* Renew Form */}
      {showRenew && (
        <form onSubmit={handleRenew} className="bg-theme-sidebar border-4 border-theme-strong shadow-[4px_4px_0px_0px_var(--border-strong)] p-6 sm:p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-theme-strong/5 rotate-45 transform translate-x-16 -translate-y-16"></div>
          
          <h3 className="font-['Syncopate'] text-xl font-black uppercase tracking-widest mb-6 border-b-4 border-theme-strong pb-4 inline-block">
            Add or renew plan
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end relative z-10">
            <div className="space-y-2">
              <label className="block font-['Syncopate'] text-xs font-bold uppercase tracking-widest text-theme-muted">Plan</label>
              <select
                className="w-full bg-theme-raised border-4 border-theme-strong px-4 py-3 font-bold focus:outline-none focus:ring-0 appearance-none shadow-[2px_2px_0px_0px_var(--border-strong)]"
                value={planName}
                onChange={(e) => {
                  setPlanName(e.target.value);
                  const map: Record<string, number> = { Monthly: 30, Quarterly: 90, "Semi-Annual": 180, Annual: 365 };
                  setDurationDays(map[e.target.value] || 30);
                }}
              >
                <option value="Monthly">Monthly (30 days)</option>
                <option value="Quarterly">Quarterly (90 days)</option>
                <option value="Semi-Annual">Semi-Annual (180 days)</option>
                <option value="Annual">Annual (365 days)</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="block font-['Syncopate'] text-xs font-bold uppercase tracking-widest text-theme-muted">Amount (ETB)</label>
              <input
                className="w-full bg-theme-raised border-4 border-theme-strong px-4 py-3 font-bold focus:outline-none focus:ring-0 shadow-[2px_2px_0px_0px_var(--border-strong)]"
                type="number"
                min={0}
                value={amountPaid}
                onChange={(e) => setAmountPaid(Number(e.target.value))}
              />
            </div>
            <button 
              type="submit" 
              className="w-full bg-theme-strong text-theme-raised border-4 border-theme-strong px-4 py-3 font-['Syncopate'] text-sm font-black uppercase tracking-widest shadow-[4px_4px_0px_0px_var(--border-strong)] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[2px_2px_0px_0px_var(--border-strong)] transition-all"
            >
              Activate
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Membership History */}
        <div className="bg-theme-raised border-4 border-theme-strong shadow-[4px_4px_0px_0px_var(--border-strong)] flex flex-col h-[500px]">
          <div className="p-4 sm:p-6 border-b-4 border-theme-strong bg-theme-sidebar flex justify-between items-center">
            <h3 className="font-['Syncopate'] text-lg sm:text-xl font-black uppercase tracking-widest flex items-center gap-3">
              <CreditCard size={24} className="text-theme-strong" /> 
              Plans
            </h3>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-theme-sidebar/30">
            {!memberships || memberships.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center opacity-50 space-y-4">
                <CreditCard size={48} />
                <p className="font-['Syncopate'] text-sm font-bold uppercase tracking-widest">No plans found</p>
              </div>
            ) : (
              memberships.map((ms) => (
                <div key={ms._id} className={`bg-theme-raised border-4 border-theme-strong p-4 sm:p-5 relative overflow-hidden transition-all ${ms.status === "active" ? "shadow-[4px_4px_0px_0px_var(--border-strong)]" : "opacity-75"}`}>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <span className="font-['Syncopate'] text-lg font-black uppercase tracking-wider block mb-1">
                        {ms.planName}
                      </span>
                      <div className="text-sm font-bold uppercase tracking-wider text-theme-muted flex flex-wrap gap-x-4 gap-y-1">
                        <span>{formatDate(ms.startDate)} &rarr; {formatDate(ms.endDate)}</span>
                        <span>{formatCurrency(ms.amountPaid)}</span>
                      </div>
                    </div>
                    <span className={`inline-block px-3 py-1 border-2 border-theme-strong text-xs font-black uppercase tracking-widest ${ms.status === "active" ? (getMembershipStatusColor(ms.endDate) === "active" ? "bg-green-500 text-white" : getMembershipStatusColor(ms.endDate) === "warning" ? "bg-yellow-500 text-black" : "bg-red-500 text-white") : "bg-theme-muted text-theme-raised"}`}>
                      {ms.status === "active" ? getMembershipStatusLabel(ms.endDate) : "Expired"}
                    </span>
                  </div>
                  
                  {ms.status === "active" && (
                    <div className="mt-4">
                      <div className="h-4 w-full bg-theme-sidebar border-2 border-theme-strong rounded-none overflow-hidden relative">
                        <div
                          className="absolute top-0 left-0 h-full bg-theme-strong transition-all duration-1000 ease-out"
                          style={{ width: `${getProgressPercent(ms.startDate, ms.endDate)}%` }}
                        />
                      </div>
                      <div className="mt-1 flex justify-between text-[10px] font-bold uppercase tracking-widest text-theme-muted">
                        <span>Start</span>
                        <span>{Math.round(getProgressPercent(ms.startDate, ms.endDate))}% used</span>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Check-in History */}
        <div className="bg-theme-raised border-4 border-theme-strong shadow-[4px_4px_0px_0px_var(--border-strong)] flex flex-col h-[500px]">
          <div className="p-4 sm:p-6 border-b-4 border-theme-strong bg-theme-sidebar flex justify-between items-center">
            <h3 className="font-['Syncopate'] text-lg sm:text-xl font-black uppercase tracking-widest flex items-center gap-3">
              <Clock size={24} className="text-theme-strong" /> 
              Check-ins
            </h3>
            <span className="bg-theme-strong text-theme-raised px-3 py-1 font-['Syncopate'] text-sm font-black border-2 border-theme-strong shadow-[2px_2px_0px_0px_var(--border-strong)]">
              {checkIns?.length ?? 0}
            </span>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-theme-sidebar/30">
            {!checkIns || checkIns.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center opacity-50 space-y-4">
                <Clock size={48} />
                <p className="font-['Syncopate'] text-sm font-bold uppercase tracking-widest">No check-ins yet</p>
              </div>
            ) : (
              <div className="relative border-l-4 border-theme-strong ml-4 sm:ml-6 space-y-6 pb-6">
                {checkIns.slice(0, 30).map((ci) => (
                  <div key={ci._id} className="relative pl-6 sm:pl-8">
                    {/* Timeline Dot */}
                    <div className="absolute -left-[14px] top-1 h-6 w-6 rounded-full bg-theme-raised border-4 border-theme-strong z-10 flex items-center justify-center">
                      <div className="h-2 w-2 rounded-full bg-theme-strong" />
                    </div>
                    
                    <div className="bg-theme-raised border-4 border-theme-strong p-3 sm:p-4 shadow-[2px_2px_0px_0px_var(--border-strong)] hover:translate-x-1 transition-transform group">
                      <div className="flex items-center gap-3">
                        <ChevronRight size={16} className="text-theme-strong opacity-0 group-hover:opacity-100 transition-opacity" />
                        <span className="font-['Syncopate'] text-sm font-bold uppercase tracking-wider text-theme-base break-words">
                          {formatDateTime(ci.timestamp)}
                        </span>
                      </div>
                      <div className="mt-1 ml-7 text-xs font-bold uppercase tracking-widest text-theme-muted">
                        Checked in
                      </div>
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
