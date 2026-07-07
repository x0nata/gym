import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Mail, Lock, Loader2, Shield, Sun, Moon, ArrowLeft } from "lucide-react";
import { useAuth } from "../../lib/useAuth";
import { useTheme } from "../../lib/useTheme";
import { DetailedErrorPanel } from "../../components/feedback/DetailedErrorPanel";
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
        <div className="min-h-screen bg-theme text-theme font-['Outfit'] selection:bg-[#ccff00] selection:text-[#000000] flex">
            <div className="absolute inset-0 z-0 pointer-events-none [background-size:24px_24px] opacity-40" style={{ backgroundImage: "radial-gradient(var(--border) 1px, transparent 1px)" }} />

            <button
                onClick={toggleTheme}
                className="absolute top-3 right-3 md:top-6 md:right-6 z-50 p-2 md:p-3 bg-theme-raised border-2 border-theme-strong hover:bg-[#ccff00] hover:text-[#000000] transition-colors shadow-[4px_4px_0px_0px_var(--border-strong)]"
                aria-label="Switch theme"
            >
                {theme === "dark" ? <Sun className="w-4 h-4 md:w-5 md:h-5" /> : <Moon className="w-4 h-4 md:w-5 md:h-5" />}
            </button>

            <div className="hidden md:flex w-[40%] border-r-4 border-theme-strong bg-theme-sidebar p-12 flex-col justify-between relative z-10">
                <div>
                    <Link to="/" className="inline-flex items-center gap-2 text-2xl font-black uppercase tracking-widest font-['Syncopate'] hover:text-[#ccff00] transition-colors mb-16">
                        <Shield className="text-[#ccff00] w-6 h-6" /> KINETIC
                    </Link>
                    <motion.h1
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="text-5xl lg:text-7xl font-black uppercase leading-[0.9] font-['Syncopate']"
                    >
                        PLATFORM
                        <br />
                        <span className="text-[#ccff00]">ADMIN</span>
                    </motion.h1>
                </div>
                <div className="border-l-4 border-[#ccff00] pl-6 py-2">
                    <p className="text-xl font-bold uppercase tracking-wider text-theme-muted">
                        MANAGE ALL GYMS
                    </p>
                </div>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-12 relative z-10 bg-theme-raised">
                <div className="md:hidden w-full flex items-center gap-4 mb-6 pb-4 border-b-4 border-theme-strong">
                    <Shield className="text-[#ccff00] w-5 h-5" />
                    <span className="font-black uppercase tracking-widest font-['Syncopate']">KINETIC ADMIN</span>
                </div>

                <div className="w-full max-w-md">
                    <div className="mb-8">
                        <div className="flex items-center gap-3 mb-2">
                            <Shield className="h-8 w-8 text-[#ccff00]" />
                            <h2 className="text-2xl font-black uppercase tracking-widest font-['Syncopate']">Admin Login</h2>
                        </div>
                        <p className="text-xs font-bold uppercase tracking-wider text-theme-muted">Platform-level access for super administrators</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase tracking-widest text-theme-muted">Email</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#ccff00]" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="w-full bg-theme-sidebar border-2 border-theme-strong p-4 pl-12 text-theme font-bold focus:bg-[#ccff00]/10 focus:border-[#ccff00] focus:outline-none focus:shadow-[4px_4px_0px_0px_#ccff00] transition-all placeholder:text-theme-muted"
                                    placeholder="admin@kinetic.app"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase tracking-widest text-theme-muted">Password</label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#ccff00]" />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="w-full bg-theme-sidebar border-2 border-theme-strong p-4 pl-12 text-theme font-bold focus:bg-[#ccff00]/10 focus:border-[#ccff00] focus:outline-none focus:shadow-[4px_4px_0px_0px_#ccff00] transition-all placeholder:text-theme-muted"
                                />
                            </div>
                        </div>

                        {error && <DetailedErrorPanel error={error} />}

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full mt-8 border-2 border-[#ccff00] bg-[#ccff00] text-[#000000] p-5 font-black uppercase tracking-widest hover:bg-[#b3e600] transition-colors shadow-[4px_4px_0px_0px_#ccff00] hover:translate-x-[-2px] hover:translate-y-[-2px] flex items-center justify-center gap-3 disabled:opacity-50 disabled:hover:translate-x-0 disabled:hover:translate-y-0"
                        >
                            {isLoading && <Loader2 className="h-5 w-5 animate-spin" />}
                            {isLoading ? "SIGNING IN..." : "SIGN IN"}
                        </button>
                    </form>

                    <div className="mt-8 pt-6 border-t-2 border-theme">
                        <Link
                            to="/"
                            className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider text-theme-muted hover:text-[#ccff00] transition-colors"
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
