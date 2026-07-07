import { useState, type ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
    LayoutDashboard,
    Building2,
    Users,
    DollarSign,
    LogOut,
    Sun,
    Moon,
    Shield,
    Menu,
    X,
    ArrowLeft,
} from "lucide-react";
import { useAuth } from "../../lib/useAuth";
import { useTheme } from "../../lib/useTheme";

interface AdminLayoutProps {
    children: ReactNode;
}

const adminNavItems = [
    { to: "/admin", label: "Overview", icon: LayoutDashboard },
    { to: "/admin/gyms", label: "Gyms", icon: Building2 },
    { to: "/admin/users", label: "Users", icon: Users },
    { to: "/admin/revenue", label: "Revenue", icon: DollarSign },
];

export function AdminLayout({ children }: AdminLayoutProps) {
    const location = useLocation();
    const { logout, user } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="min-h-screen flex bg-theme font-['Outfit'] text-theme selection:bg-accent/30">
            <div className="absolute inset-0 z-0 pointer-events-none [background-size:24px_24px] opacity-40" style={{ backgroundImage: "radial-gradient(var(--border) 1px, transparent 1px)" }} />

            <AnimatePresence>
                {sidebarOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 bg-black/60 z-40 lg:hidden"
                        onClick={() => setSidebarOpen(false)}
                    />
                )}
            </AnimatePresence>

            <aside className={`fixed inset-y-0 left-0 z-50 w-72 border-r-4 border-theme-strong flex flex-col bg-theme-sidebar transform transition-transform duration-300 lg:relative lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="p-6 border-b-4 border-theme-strong bg-theme-raised">
                    <div className="flex items-center justify-between">
                        <Link to="/admin" className="flex items-center gap-3 group" onClick={() => setSidebarOpen(false)}>
                            <Shield className="h-8 w-8 text-[#ccff00] group-hover:scale-110 transition-transform" />
                            <div>
                                <div className="font-black text-xl tracking-widest uppercase font-['Syncopate']">
                                    KINETIC
                                </div>
                                <div className="text-xs font-bold tracking-widest text-[#ccff00] uppercase">
                                    ADMIN
                                </div>
                            </div>
                        </Link>
                        <button
                            onClick={() => setSidebarOpen(false)}
                            className="lg:hidden p-2 border-2 border-theme hover:bg-theme transition-colors"
                            aria-label="Close menu"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                </div>

                <nav className="flex-1 p-4 lg:p-6 flex flex-col gap-2 overflow-y-auto">
                    {adminNavItems.map((item) => {
                        const isActive = location.pathname === item.to
                            || (item.to !== "/admin" && location.pathname.startsWith(item.to));
                        return (
                            <Link
                                key={item.to}
                                to={item.to}
                                onClick={() => setSidebarOpen(false)}
                                className={`relative flex items-center gap-3 lg:gap-4 px-3 lg:px-4 py-3 font-black uppercase tracking-widest transition-all ${
                                    isActive
                                        ? "bg-[#ccff00]/10 border-2 border-[#ccff00] text-[#ccff00] shadow-[4px_4px_0px_0px_#ccff00] translate-x-[-2px] translate-y-[-2px]"
                                        : "text-theme-secondary hover:text-theme border-2 border-transparent hover:border-theme hover:bg-theme-raised"
                                }`}
                            >
                                <item.icon className="h-5 w-5" />
                                <span className="text-sm mt-0.5">{item.label}</span>
                            </Link>
                        );
                    })}

                    <div className="mt-4 border-t-2 border-theme pt-4">
                        <Link
                            to="/dashboard"
                            className="flex items-center gap-3 px-3 lg:px-4 py-3 font-black uppercase tracking-widest text-theme-secondary hover:text-theme border-2 border-dashed border-theme hover:border-theme hover:bg-theme-raised transition-all text-sm"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            <span>Gym Portal</span>
                        </Link>
                    </div>
                </nav>

                <div className="p-4 lg:p-6 border-t-4 border-theme-strong bg-theme-sidebar">
                    <div className="flex items-center gap-3 lg:gap-4 p-3 lg:p-4 bg-theme-raised mb-3 lg:mb-4 border-2 border-[#ccff00] shadow-[4px_4px_0px_0px_#ccff00]">
                        <div className="h-10 w-10 bg-[#ccff00]/10 flex items-center justify-center text-[#ccff00] font-black shrink-0">
                            <Shield className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="text-sm font-black uppercase tracking-widest text-theme">
                                Admin
                            </div>
                            <div className="text-xs font-bold text-[#ccff00] truncate">{user?.email}</div>
                        </div>
                    </div>

                    <button
                        onClick={logout}
                        className="w-full flex items-center justify-center gap-3 p-3 lg:p-4 border-2 border-red-500 bg-red-500/10 text-red-500 font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-colors shadow-[4px_4px_0px_0px_var(--color-red-500)] hover:translate-x-[-2px] hover:translate-y-[-2px] text-sm"
                    >
                        <LogOut className="h-4 w-4" />
                        Log out
                    </button>
                </div>
            </aside>

            <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative z-10">
                <header className="h-14 md:h-20 border-b-4 border-theme-strong bg-theme-raised flex items-center px-4 md:px-8 justify-between sticky top-0 z-20">
                    <div className="flex items-center gap-3 md:gap-4">
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="lg:hidden p-2 border-2 border-theme hover:bg-theme transition-colors text-theme-secondary hover:text-theme shadow-[2px_2px_0px_0px_var(--border-strong)]"
                            aria-label="Open menu"
                        >
                            <Menu className="h-5 w-5" />
                        </button>
                        <div className="flex items-center gap-2 lg:hidden">
                            <Shield className="h-5 w-5 text-[#ccff00]" />
                            <span className="font-black text-sm tracking-widest uppercase font-['Syncopate'] text-theme">
                                ADMIN
                            </span>
                        </div>
                        <h1 className="text-lg md:text-2xl font-black uppercase tracking-widest font-['Syncopate'] text-theme hidden lg:block">
                            {adminNavItems.find(item =>
                                item.to === location.pathname || (item.to !== "/admin" && location.pathname.startsWith(item.to))
                            )?.label || "Admin"}
                        </h1>
                    </div>
                    <div className="flex items-center gap-2 md:gap-4 font-bold tracking-widest uppercase text-xs md:text-sm">
                        <button
                            onClick={toggleTheme}
                            className="p-2 border-2 border-theme bg-theme-raised hover:bg-theme transition-colors text-theme-secondary hover:text-theme shadow-[2px_2px_0px_0px_var(--border-strong)] hover:translate-x-[-1px] hover:translate-y-[-1px]"
                            aria-label="Switch theme"
                        >
                            {theme === "dark" ? <Sun className="h-4 w-4 md:h-5 md:w-5" /> : <Moon className="h-4 w-4 md:h-5 md:w-5" />}
                        </button>
                        <div className="flex items-center gap-1.5 md:gap-2 px-2 md:px-4 py-1 md:py-2 border-2 border-[#ccff00]/50 bg-[#ccff00]/10 text-[#ccff00] shadow-[2px_2px_0px_0px_rgba(204,255,0,0.5)]">
                            <div className="h-2 w-2 bg-[#ccff00] rounded-full animate-pulse" />
                            <span>Admin</span>
                        </div>
                    </div>
                </header>
                <div className="flex-1 overflow-auto p-4 md:p-8 bg-transparent">
                    <div className="max-w-7xl mx-auto">
                        {children}
                    </div>
                </div>
            </main>
        </div>
    );
}
