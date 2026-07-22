import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Mail, Lock, Loader2, Shield, Sun, Moon, ArrowLeft } from "lucide-react";
import { useAuth } from "../../lib/useAuth";
import { useTheme } from "../../lib/useTheme";
import { DetailedErrorPanel } from "../../components/feedback/DetailedErrorPanel";
import { Mark } from "../../components/layout/Mark";
import type { AppErrorDetails } from "../../lib/errorHandling";

export default function AdminLogin() {
    const { login, isLoading } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<AppErrorDetails | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        const result = await login({ role: "superadmin", email: email.trim(), password });
        if (!result.success && "error" in result) {
            setError(result.error);
        } else {
            navigate("/admin", { replace: true });
        }
    };

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
                <div className="pointer-events-none absolute -top-24 -left-24 h-96 w-96 rounded-full bg-energy/25 blur-[120px] animate-[float_9s_ease-in-out_infinite]" />
                <div className="pointer-events-none absolute bottom-0 right-0 h-80 w-80 rounded-full bg-accent/20 blur-[120px]" />

                <Link to="/" className="relative flex items-center gap-2.5 group w-fit">
                    <Mark />
                    <span className="brand-mark text-sm text-theme">KINETIC</span>
                </Link>

                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                    className="relative"
                >
                    <span className="eyebrow text-energy">Platform control</span>
                    <h1 className="mt-4 text-5xl lg:text-7xl font-extrabold tracking-[-0.03em] leading-[0.95]">
                        Platform
                        <br />
                        <span className="font-serif italic font-normal text-energy">admin.</span>
                    </h1>
                    <p className="mt-6 text-lg text-theme-secondary max-w-sm">
                        Oversee every gym, member, and payment from a single realtime console.
                    </p>
                </motion.div>

                <div className="relative flex items-center gap-3 text-sm text-theme-muted">
                    <Shield className="h-4 w-4 text-energy" />
                    Super-administrator access only
                </div>
            </div>

            {/* Right form panel */}
            <div className="flex-1 flex flex-col items-center justify-center p-5 md:p-12 relative">
                <div className="md:hidden w-full max-w-md flex items-center gap-2.5 mb-8">
                    <Mark />
                    <span className="brand-mark text-sm text-theme">KINETIC</span>
                </div>

                <div className="w-full max-w-md">
                    <div className="mb-8">
                        <div className="flex items-center gap-3 mb-2">
                            <span className="grid h-10 w-10 place-items-center rounded-xl bg-energy/15 text-energy">
                                <Shield className="h-5 w-5" />
                            </span>
                            <h2 className="text-2xl font-extrabold tracking-tight">Admin login</h2>
                        </div>
                        <p className="text-sm text-theme-muted">Platform-level access for super administrators.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="eyebrow">Email</label>
                            <div className="relative">
                                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-energy" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="field !pl-11"
                                    placeholder="admin@kinetic.app"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="eyebrow">Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-energy" />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="field !pl-11"
                                />
                            </div>
                        </div>

                        {error && <DetailedErrorPanel error={error} />}

                        <button type="submit" disabled={isLoading} className="btn btn--energy btn--lg w-full mt-2">
                            {isLoading && <Loader2 className="h-5 w-5 animate-spin" />}
                            {isLoading ? "Signing in…" : "Sign in"}
                        </button>
                    </form>

                    <div className="mt-7 pt-6 border-t border-theme">
                        <Link
                            to="/"
                            className="inline-flex items-center gap-2 text-sm text-theme-muted hover:text-energy transition-colors"
                        >
                            <ArrowLeft className="h-3.5 w-3.5" />
                            Back to site
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
