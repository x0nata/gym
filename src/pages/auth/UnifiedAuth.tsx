import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Building2, Mail, Lock, Ticket, Phone, MapPin, Loader2, Moon, Sun, Shield } from "lucide-react";
import { useAuth } from "../../lib/useAuth";
import { useTheme } from "../../lib/useTheme";
import { Link } from "react-router-dom";
import { DetailedErrorPanel } from "../../components/feedback/DetailedErrorPanel";
import { Mark } from "../../components/layout/Mark";
import type { AppErrorDetails } from "../../lib/errorHandling";

type Role = "gym" | "member" | "superadmin";
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
    const dest = user?.role === "superadmin" ? "/admin" : user?.role === "member" ? "/member/dashboard" : "/dashboard";
    navigate(dest, { replace: true });
  }, [isAuthenticated, isInitialized, navigate, user?.role]);

  const gymMode = role === "gym" ? mode : "signin";

  const submitLabel = useMemo(() => {
    if (isLoading) return "Loading…";
    if (role === "gym" && gymMode === "register") return "Create account";
    if (role === "gym") return "Sign in";
    if (memberAuthMode === "first-time" && !memberInviteVerified) return "Check invite";
    if (memberAuthMode === "first-time" && memberInviteVerified) return "Set password";
    return "Sign in";
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
      if (!result.success && "error" in result) setError(result.error);
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
      if (!onboardingResult.success && "error" in result) setError(onboardingResult.error);
      return;
    }

    const result = await login({ role, email: form.email, password: form.password });
    if (!result.success && "error" in result) setError(result.error);
  };

  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-accent-light" />
      </div>
    );
  }

  const heading = role === "gym" ? "Gym / Staff" : "Member";
  const sub = role === "gym" ? "Manage your gym from one calm dashboard." : "Your membership, QR pass, and plans.";

  return (
    <div className="min-h-screen font-sans text-theme flex flex-col md:flex-row relative">
      <button
        onClick={toggleTheme}
        className="absolute top-4 right-4 md:top-6 md:right-6 z-50 grid h-10 w-10 place-items-center rounded-xl glass hover-theme transition-colors"
        aria-label="Switch theme"
      >
        {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      </button>

      {/* Left brand panel */}
      <div className="hidden md:flex md:w-[42%] p-12 lg:p-16 flex-col justify-between relative overflow-hidden">
        <div className="pointer-events-none absolute -top-24 -left-24 h-96 w-96 rounded-full bg-accent/30 blur-[120px] animate-[float_9s_ease-in-out_infinite]" />
        <div className="pointer-events-none absolute bottom-0 right-0 h-80 w-80 rounded-full bg-info/20 blur-[120px]" />

        <Link to="/" className="relative flex items-center gap-2.5 group w-fit">
          <Mark />
          <span className="brand-mark text-sm text-theme">KINETIC</span>
        </Link>

        <motion.div
          key={role + mode}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="relative"
        >
          <span className="eyebrow text-accent-light">Welcome back</span>
          <h1 className="mt-4 text-5xl lg:text-7xl font-extrabold tracking-[-0.03em] leading-[0.95]">
            {heading}
            <br />
            <span className="font-serif italic font-normal glow-text">
              {mode === "register" ? "sign up" : "sign in"}
            </span>
          </h1>
          <p className="mt-6 text-lg text-theme-secondary max-w-sm">{sub}</p>
        </motion.div>

        <div className="relative flex items-center gap-3 text-sm text-theme-muted">
          <Shield className="h-4 w-4 text-accent-light" />
          Protected, session-based authentication
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex flex-col items-center justify-center p-5 md:p-12 relative">
        <div className="md:hidden w-full max-w-md flex items-center gap-2.5 mb-8">
          <Mark />
          <span className="brand-mark text-sm text-theme">KINETIC</span>
        </div>

        <div className="w-full max-w-md">
          <div className="mb-7">
            <h2 className="text-2xl font-extrabold tracking-tight">Sign in to continue</h2>
            <p className="text-sm text-theme-muted mt-1.5">Choose your portal below.</p>
          </div>

          {/* Role toggle */}
          <div className="grid grid-cols-2 gap-1 p-1 glass rounded-2xl mb-6">
            <button
              type="button"
              onClick={() => { setRole("gym"); setError(null); }}
className={`py-2.5 rounded-xl text-sm font-semibold transition-all ${
                 role === "gym" ? "bg-energy text-[#07120f]" : "text-theme-secondary hover:text-theme"
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
              className={`py-2.5 rounded-xl text-sm font-semibold transition-all ${
                role === "member" ? "bg-energy text-[#07120f]" : "text-theme-secondary hover:text-theme"
              }`}
            >
              Member
            </button>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            {role === "member" && (
              <div className="flex gap-2 mb-2 p-1 rounded-xl border border-theme">
                <button
                  type="button"
                  onClick={() => {
                    setMemberAuthMode("regular");
                    setMemberInviteVerified(false);
                    setMemberDisplayName("");
                    setForm((prev) => ({ ...prev, invitationCode: "", phone: "" }));
                    setError(null);
                  }}
                  className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${
                    memberAuthMode === "regular" ? "bg-hover-accent text-theme" : "text-theme-muted hover:text-theme"
                  }`}
                >
                  Sign in
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
                  className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${
                    memberAuthMode === "first-time" ? "bg-hover-accent text-theme" : "text-theme-muted hover:text-theme"
                  }`}
                >
                  New member
                </button>
              </div>
            )}

            <AnimatePresence mode="wait">
              {role === "gym" && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="flex gap-2 p-1 rounded-xl border border-theme overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() => setMode("signin")}
                    className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${
                      gymMode === "signin" ? "bg-hover-accent text-theme" : "text-theme-muted hover:text-theme"
                    }`}
                  >
                    Sign in
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode("register")}
                    className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${
                      gymMode === "register" ? "bg-hover-accent text-theme" : "text-theme-muted hover:text-theme"
                    }`}
                  >
                    Sign up
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {role === "member" && memberAuthMode === "first-time" && !memberInviteVerified && (
              <Field label="Invite code" icon={Ticket}>
                <input
                  value={form.invitationCode}
                  onChange={(e) => onChange("invitationCode", e.target.value.toUpperCase())}
                  required
                  className="field !pl-11"
                  placeholder="MEM-XXXX-XXXX"
                />
              </Field>
            )}

            {role === "member" && memberAuthMode === "first-time" && !memberInviteVerified && (
              <Field label="Phone number" icon={Phone}>
                <input
                  value={form.phone}
                  onChange={(e) => onChange("phone", e.target.value)}
                  required
                  className="field !pl-11"
                  placeholder="+1 555 123 4567"
                />
              </Field>
            )}

            {role === "member" && memberAuthMode === "first-time" && memberInviteVerified && (
              <div className="rounded-2xl border border-success/40 bg-success/10 p-4 text-sm text-success flex items-center gap-2.5">
                <Shield className="h-4 w-4 shrink-0" />
                Invite checked{memberDisplayName ? ` for ${memberDisplayName}` : ""}. Pick your email and password.
              </div>
            )}

            {role === "gym" && gymMode === "register" && (
              <>
                <Field label="Gym name" icon={Building2}>
                  <input value={form.name} onChange={(e) => onChange("name", e.target.value)} required className="field !pl-11" />
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Phone" icon={Phone}>
                    <input value={form.phone} onChange={(e) => onChange("phone", e.target.value)} required className="field !pl-11" />
                  </Field>
                  <Field label="City" icon={MapPin}>
                    <input value={form.city} onChange={(e) => onChange("city", e.target.value)} required className="field !pl-11" />
                  </Field>
                </div>
                <Field label="Address">
                  <input value={form.address} onChange={(e) => onChange("address", e.target.value)} required className="field" />
                </Field>
              </>
            )}

            {(role === "gym" || memberAuthMode === "regular" || (role === "member" && memberInviteVerified)) && (
              <Field label="Email" icon={Mail}>
                <input type="email" value={form.email} onChange={(e) => onChange("email", e.target.value)} required className="field !pl-11" />
              </Field>
            )}

            {(role === "gym" || memberAuthMode === "regular" || (role === "member" && memberInviteVerified)) && (
              <Field label="Password" icon={Lock}>
                <input type="password" value={form.password} onChange={(e) => onChange("password", e.target.value)} required minLength={6} className="field !pl-11" />
              </Field>
            )}

            {error && <DetailedErrorPanel error={error} />}

            <button type="submit" disabled={isLoading} className="btn btn--primary btn--lg w-full mt-2">
              {isLoading && <Loader2 className="h-5 w-5 animate-spin" />}
              {submitLabel}
            </button>
          </form>

          <div className="mt-7 pt-6 border-t border-theme flex items-center justify-between text-sm">
            <Link to="/" className="text-theme-muted hover:text-accent-light transition-colors">← Back to site</Link>
            <Link to="/admin/auth" className="text-theme-muted hover:text-energy transition-colors inline-flex items-center gap-1.5">
              <Shield className="h-3.5 w-3.5" /> Admin
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, icon: Icon, children }: { label: string; icon?: typeof Mail; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="eyebrow">{label}</label>
      <div className="relative">
        {Icon && <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-theme-muted pointer-events-none" />}
        {children}
      </div>
    </div>
  );
}
