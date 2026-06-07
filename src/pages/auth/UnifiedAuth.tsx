import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Building2, Mail, Lock, Ticket, Phone, MapPin, Loader2, Zap, Moon, Sun } from "lucide-react";
import { useAuth } from "../../lib/useAuth";
import { useTheme } from "../../lib/useTheme";
import { Link } from "react-router-dom";
import { DetailedErrorPanel } from "../../components/feedback/DetailedErrorPanel";
import type { AppErrorDetails } from "../../lib/errorHandling";

type Role = "gym" | "member";
type Mode = "signin" | "register";
type MemberAuthMode = "regular" | "first-time";

export default function UnifiedAuth() {
  const location = useLocation();
  const navigate = useNavigate();
  const {
    login,
    registerGym,
    verifyMemberInvitation,
    completeMemberOnboarding,
    isAuthenticated,
    isInitialized,
    isLoading,
    user,
  } = useAuth();

  const { theme, toggleTheme } = useTheme();

  const [role, setRole] = useState<Role>(location.pathname === "/auth/gym" ? "gym" : "member");
  const [mode, setMode] = useState<Mode>("signin");
  const [memberAuthMode, setMemberAuthMode] = useState<MemberAuthMode>("regular");
  const [memberInviteVerified, setMemberInviteVerified] = useState(false);
  const [memberDisplayName, setMemberDisplayName] = useState("");
  const [error, setError] = useState<AppErrorDetails | null>(null);

  const [form, setForm] = useState({
    email: "",
    password: "",
    invitationCode: "",
    name: "",
    phone: "",
    address: "",
    city: "",
    description: "",
  });

  useEffect(() => {
    if (!isInitialized || !isAuthenticated) return;
    navigate(user?.role === "member" ? "/member/dashboard" : "/dashboard", { replace: true });
  }, [isAuthenticated, isInitialized, navigate, user?.role]);

  const gymMode = role === "gym" ? mode : "signin";

  const submitLabel = useMemo(() => {
    if (isLoading) return "LOADING...";
    if (role === "gym" && gymMode === "register") return "CREATE ACCOUNT";
    if (role === "gym") return "SIGN IN";
    if (memberAuthMode === "first-time" && !memberInviteVerified) return "CHECK INVITE";
    if (memberAuthMode === "first-time" && memberInviteVerified) return "SET PASSWORD";
    return "SIGN IN";
  }, [isLoading, gymMode, role, memberAuthMode, memberInviteVerified]);

  const onChange = (key: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (role === "gym" && gymMode === "register") {
      const result = await registerGym({
        email: form.email,
        password: form.password,
        name: form.name,
        phone: form.phone,
        address: form.address,
        city: form.city,
        description: form.description || undefined,
      });

      if (!result.success && "error" in result) {
        setError(result.error);
      }
      return;
    }

    if (role === "member" && memberAuthMode === "first-time") {
      if (!memberInviteVerified) {
        const verifyResult = await verifyMemberInvitation({
          invitationCode: form.invitationCode,
          phone: form.phone,
        });

        if (!verifyResult.success && "error" in verifyResult) {
          setError(verifyResult.error);
          return;
        }

        setMemberInviteVerified(true);
        setMemberDisplayName(verifyResult.memberName ?? "");
        return;
      }

      const onboardingResult = await completeMemberOnboarding({
        invitationCode: form.invitationCode,
        phone: form.phone,
        email: form.email,
        password: form.password,
      });

      if (!onboardingResult.success && "error" in onboardingResult) {
        setError(onboardingResult.error);
      }
      return;
    }

    const result = await login({
      role,
      email: form.email,
      password: form.password,
    });

    if (!result.success && "error" in result) {
      setError(result.error);
    }
  };

  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-theme-raised flex items-center justify-center font-['Outfit']">
        <Loader2 className="h-12 w-12 animate-spin text-theme" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-theme-raised text-slate-900 font-['Outfit'] selection:bg-[#ccff00] selection:text-theme flex flex-col md:flex-row relative">
      {/* Background Pattern */}
      <div className="absolute inset-0 z-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:24px_24px] opacity-60 pointer-events-none dark:hidden" />

      {/* Theme Toggle Button Top Right */}
      <button
        onClick={toggleTheme}
        className="absolute top-3 right-3 md:top-6 md:right-6 z-50 p-2 md:p-3 bg-theme-sidebar border-2 border-theme-strong hover:bg-[#ccff00] hover:text-theme transition-colors shadow-[4px_4px_0px_0px_var(--border-strong)] text-theme"
        aria-label="Switch theme"
      >
        {theme === 'dark' ? <Sun className="w-4 h-4 md:w-5 md:h-5" /> : <Moon className="w-4 h-4 md:w-5 md:h-5" />}
      </button>

      {/* Left Branding Panel */}
      <div className="hidden md:flex w-[40%] bg-black p-12 border-r-4 border-theme-strong relative z-10 flex-col justify-between text-white">
        <div>
          <Link to="/" className="inline-flex items-center gap-2 text-2xl font-black uppercase tracking-widest font-['Syncopate'] hover:text-[#ccff00] transition-colors mb-16">
            <Zap className="text-[#ccff00] w-6 h-6" /> KINETIC
          </Link>
          <motion.h1 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            key={role + mode}
            className="text-5xl lg:text-7xl font-black uppercase leading-[0.9] font-['Syncopate']"
          >
            {role === "gym" ? "GYM" : "MEMBER"}
            <br />
            <span className="text-[#ccff00]">
              {mode === "register" ? "SIGN UP" : "SIGN IN"}
            </span>
          </motion.h1>
        </div>
        <div className="border-l-4 border-[#ccff00] pl-6 py-2">
          <p className="text-xl font-bold uppercase tracking-wider text-theme-muted">
            {role === "gym" ? "MANAGE YOUR GYM" : "MEMBER LOGIN"}
          </p>
        </div>
      </div>

      {/* Right Form Panel */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-12 relative z-10 bg-theme-raised">
        
        {/* Mobile Header */}
        <div className="md:hidden w-full flex items-center mb-6 pb-4 border-b-4 border-theme-strong">
           <Link to="/" className="inline-flex items-center gap-2 font-black uppercase tracking-widest font-['Syncopate']">
            <Zap className="text-[#ccff00] fill-black w-5 h-5" /> <span className="text-base">KINETIC</span>
          </Link>
        </div>

        <div className="w-full max-w-md">
          {/* Role Toggle */}
          <div className="flex p-1 bg-theme-sidebar border-2 border-theme-strong mb-8">
              <button
                type="button"
                onClick={() => {
                  setRole("gym");
                  setError(null);
                }}
              className={`flex-1 py-3 text-sm font-black uppercase tracking-widest transition-all ${
                role === "gym" 
                  ? "bg-[#ccff00] border-2 border-theme-strong shadow-[4px_4px_0px_0px_var(--border-strong)] translate-x-[-2px] translate-y-[-2px]" 
                  : "text-theme-muted hover:text-theme"
              }`}
            >
              Gym / Staff
            </button>
              <button
                type="button"
                onClick={() => {
                  setRole("member");
                  setMode("signin");
                  setMemberAuthMode("regular");
                  setMemberInviteVerified(false);
                  setMemberDisplayName("");
                  setForm((prev) => ({ ...prev, invitationCode: "", phone: "", password: "", email: "" }));
                  setError(null);
                }}
              className={`flex-1 py-3 text-sm font-black uppercase tracking-widest transition-all ${
                role === "member" 
                  ? "bg-black text-white border-2 border-theme-strong shadow-[2px_2px_0px_0px_rgba(204,255,0,1)] translate-x-[-2px] translate-y-[-2px]" 
                  : "text-theme-muted hover:text-theme"
              }`}
              >
                Member
              </button>
            </div>

            <form onSubmit={onSubmit} className="space-y-5">
              {role === "member" && (
                <div className="flex gap-4 mb-6 border-b-2 border-theme-strong pb-6">
                  <button
                    type="button"
                    onClick={() => {
                      setMemberAuthMode("regular");
                        setMemberInviteVerified(false);
                        setMemberDisplayName("");
                        setForm((prev) => ({ ...prev, invitationCode: "", phone: "" }));
                        setError(null);
                      }}
                    className={`flex-1 pb-2 text-left font-bold uppercase ${memberAuthMode === "regular" ? "text-theme border-b-4 border-[#ccff00]" : "text-theme-muted"}`}
                  >
                    Sign In
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMemberAuthMode("first-time");
                        setMemberInviteVerified(false);
                        setMemberDisplayName("");
                        setForm((prev) => ({ ...prev, invitationCode: "", phone: "", password: "", email: "" }));
                        setError(null);
                      }}
                    className={`flex-1 pb-2 text-left font-bold uppercase ${memberAuthMode === "first-time" ? "text-theme border-b-4 border-[#ccff00]" : "text-theme-muted"}`}
                  >
                    New Member
                  </button>
                </div>
              )}

              {/* Gym Mode Toggle */}
              <AnimatePresence mode="wait">
                {role === "gym" && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="flex gap-4 mb-6 border-b-2 border-theme-strong pb-6"
                >
                  <button
                    type="button"
                    onClick={() => setMode("signin")}
                    className={`flex-1 pb-2 text-left font-bold uppercase ${gymMode === "signin" ? "text-theme border-b-4 border-[#ccff00]" : "text-theme-muted"}`}
                  >
                    Sign In
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode("register")}
                    className={`flex-1 pb-2 text-left font-bold uppercase ${gymMode === "register" ? "text-theme border-b-4 border-[#ccff00]" : "text-theme-muted"}`}
                  >
                    Sign Up
                  </button>
                </motion.div>
                )}
              </AnimatePresence>

            {role === "member" && memberAuthMode === "first-time" && !memberInviteVerified && (
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-theme-muted">Invite Code</label>
                <div className="relative">
                  <Ticket className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-theme" />
                  <input
                    value={form.invitationCode}
                    onChange={(e) => onChange("invitationCode", e.target.value.toUpperCase())}
                    required
                    className="w-full bg-theme-sidebar border-2 border-theme-strong p-4 pl-12 text-theme font-bold focus:bg-[#ccff00]/10 focus:outline-none focus:shadow-[4px_4px_0px_0px_var(--border-strong)] transition-all placeholder:text-theme-muted"
                    placeholder="MEM-XXXX-XXXX"
                  />
                </div>
              </div>
            )}

            {role === "member" && memberAuthMode === "first-time" && !memberInviteVerified && (
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-theme-muted">Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-theme" />
                  <input
                    value={form.phone}
                    onChange={(e) => onChange("phone", e.target.value)}
                    required
                    className="w-full bg-theme-sidebar border-2 border-theme-strong p-4 pl-12 text-theme font-bold focus:bg-[#ccff00]/10 focus:outline-none focus:shadow-[4px_4px_0px_0px_var(--border-strong)] transition-all"
                    placeholder="+1 555 123 4567"
                  />
                </div>
              </div>
            )}

            {role === "member" && memberAuthMode === "first-time" && memberInviteVerified && (
              <div className="bg-emerald-50 border-2 border-emerald-500 p-4 text-emerald-700 font-bold">
                Invite checked{memberDisplayName ? ` for ${memberDisplayName}` : ""}. Pick your email and password.
              </div>
            )}

            {role === "gym" && gymMode === "register" && (
              <>
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-theme-muted">Gym Name</label>
                  <div className="relative">
                    <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-theme" />
                    <input 
                      value={form.name} 
                      onChange={(e) => onChange("name", e.target.value)} 
                      required 
                      className="w-full bg-theme-sidebar border-2 border-theme-strong p-4 pl-12 text-theme font-bold focus:bg-[#ccff00]/10 focus:outline-none focus:shadow-[4px_4px_0px_0px_var(--border-strong)] transition-all" 
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-theme-muted">Phone</label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-theme" />
                      <input 
                        value={form.phone} 
                        onChange={(e) => onChange("phone", e.target.value)} 
                        required 
                        className="w-full bg-theme-sidebar border-2 border-theme-strong p-4 pl-12 text-theme font-bold focus:bg-[#ccff00]/10 focus:outline-none focus:shadow-[4px_4px_0px_0px_var(--border-strong)] transition-all" 
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-theme-muted">City</label>
                    <div className="relative">
                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-theme" />
                      <input 
                        value={form.city} 
                        onChange={(e) => onChange("city", e.target.value)} 
                        required 
                        className="w-full bg-theme-sidebar border-2 border-theme-strong p-4 pl-12 text-theme font-bold focus:bg-[#ccff00]/10 focus:outline-none focus:shadow-[4px_4px_0px_0px_var(--border-strong)] transition-all" 
                      />
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-theme-muted">Address</label>
                  <input 
                    value={form.address} 
                    onChange={(e) => onChange("address", e.target.value)} 
                    required 
                    className="w-full bg-theme-sidebar border-2 border-theme-strong p-4 text-theme font-bold focus:bg-[#ccff00]/10 focus:outline-none focus:shadow-[4px_4px_0px_0px_var(--border-strong)] transition-all" 
                  />
                </div>
              </>
            )}

            {(role === "gym" || memberAuthMode === "regular" || (role === "member" && memberInviteVerified)) && (
              <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-theme-muted">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-theme" />
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => onChange("email", e.target.value)}
                  required
                  className="w-full bg-theme-sidebar border-2 border-theme-strong p-4 pl-12 text-theme font-bold focus:bg-[#ccff00]/10 focus:outline-none focus:shadow-[4px_4px_0px_0px_var(--border-strong)] transition-all"
                />
              </div>
              </div>
            )}

            {(role === "gym" || memberAuthMode === "regular" || (role === "member" && memberInviteVerified)) && (
              <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-theme-muted">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-theme" />
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => onChange("password", e.target.value)}
                  required
                  minLength={6}
                  className="w-full bg-theme-sidebar border-2 border-theme-strong p-4 pl-12 text-theme font-bold focus:bg-[#ccff00]/10 focus:outline-none focus:shadow-[4px_4px_0px_0px_var(--border-strong)] transition-all"
                />
              </div>
              </div>
            )}

            {error && <DetailedErrorPanel error={error} />}

            <button 
              type="submit" 
              disabled={isLoading} 
              className="w-full mt-8 bg-black text-white border-2 border-theme-strong p-5 font-black uppercase tracking-widest hover:bg-[#ccff00] hover:text-theme transition-colors shadow-[4px_4px_0px_0px_var(--border-strong)] hover:shadow-[4px_4px_0px_0px_var(--border-strong)] hover:translate-x-[6px] hover:translate-y-[6px] flex items-center justify-center gap-3 disabled:opacity-50 disabled:hover:translate-x-0 disabled:hover:translate-y-0 disabled:hover:shadow-[4px_4px_0px_0px_var(--border-strong)] disabled:hover:bg-black disabled:hover:text-white"
            >
              {isLoading && <Loader2 className="h-5 w-5 animate-spin" />}
              {submitLabel}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
