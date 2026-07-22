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
    Menu,
    X,
    ArrowLeft,
} from "lucide-react";
import { useAuth } from "../../lib/useAuth";
import { useTheme } from "../../lib/useTheme";
import { Mark } from "./Mark";

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

    const activeLabel =
        adminNavItems.find(
            (item) => item.to === location.pathname || (item.to !== "/admin" && location.pathname.startsWith(item.to))
        )?.label ?? "Admin";

    return (
        <div className="min-h-screen flex font-sans text-theme">
            <AnimatePresence>
                {sidebarOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
                        onClick={() => setSidebarOpen(false)}
                    />
                )}
            </AnimatePresence>

            <aside
                className={`fixed inset-y-0 left-0 z-50 w-[260px] glass flex flex-col rounded-none border-r transition-transform duration-300 lg:relative lg:translate-x-0 ${
                    sidebarOpen ? "translate-x-0" : "-translate-x-full"
                }`}
            >
                <div className="px-6 pt-7 pb-6">
                    <div className="flex items-center justify-between">
                        <Link to="/admin" className="flex items-center gap-3 group" onClick={() => setSidebarOpen(false)}>
                            <Mark />
                            <div className="leading-none">
                                <div className="brand-mark text-[0.95rem] text-theme">KINETIC</div>
                                <div className="eyebrow mt-1.5 text-energy">Admin</div>
                            </div>
                        </Link>
                        <button
                            onClick={() => setSidebarOpen(false)}
                            className="lg:hidden grid h-9 w-9 place-items-center rounded-xl border border-theme hover-theme transition-colors"
                            aria-label="Close menu"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                </div>

                <nav className="flex-1 px-3 flex flex-col gap-1 overflow-y-auto">
                    {adminNavItems.map((item) => {
                        const isActive =
                            location.pathname === item.to ||
                            (item.to !== "/admin" && location.pathname.startsWith(item.to));
                        return (
                            <Link
                                key={item.to}
                                to={item.to}
                                onClick={() => setSidebarOpen(false)}
                                className={`nav-item ${isActive ? "nav-item--active" : ""}`}
                                style={
                                    isActive
                                        ? {
                                              ["--hover-accent" as string]: "rgba(163,230,53,0.14)",
                                              color: "var(--text)",
                                          }
                                        : undefined
                                }
                            >
                                <item.icon className="h-[18px] w-[18px]" />
                                <span>{item.label}</span>
                            </Link>
                        );
                    })}

                    <div className="mt-4 pt-4 border-t border-theme">
                        <Link
                            to="/dashboard"
                            className="nav-item text-theme-muted"
                        >
                            <ArrowLeft className="h-[18px] w-[18px]" />
                            <span>Gym Portal</span>
                        </Link>
                    </div>
                </nav>

                <div className="p-3 mt-2">
                    <div className="glass-strong rounded-2xl p-3 flex items-center gap-3 mb-2 border-energy/30">
                        <div className="grid h-10 w-10 place-items-center rounded-xl bg-energy/15 text-energy font-bold shrink-0">
                            A
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="text-sm font-semibold text-theme">Admin</div>
                            <div className="text-xs text-energy truncate">{user?.email}</div>
                        </div>
                    </div>

                    <button
                        onClick={logout}
                        className="btn btn--ghost btn--md w-full text-danger hover:!bg-danger/10 hover:!border-danger/40"
                    >
                        <LogOut className="h-4 w-4" />
                        Log out
                    </button>
                </div>
            </aside>

            <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative z-10">
                <header className="sticky top-0 z-20 px-4 md:px-8 h-16 md:h-[72px] flex items-center justify-between glass border-b border-theme">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="lg:hidden grid h-9 w-9 place-items-center rounded-xl border border-theme hover-theme transition-colors"
                            aria-label="Open menu"
                        >
                            <Menu className="h-4 w-4" />
                        </button>
                        <div className="flex items-center gap-2 lg:hidden">
                            <Mark />
                            <span className="brand-mark text-xs text-theme">KINETIC</span>
                        </div>
                        <h1 className="hidden lg:block text-xl font-extrabold tracking-tight text-theme">{activeLabel}</h1>
                    </div>

                    <div className="flex items-center gap-2 md:gap-3">
                        <button
                            onClick={toggleTheme}
                            className="grid h-9 w-9 place-items-center rounded-xl border border-theme hover-theme transition-colors text-theme-secondary hover:text-theme"
                            aria-label="Switch theme"
                        >
                            {theme === "dark" ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
                        </button>
                        
                    </div>
                </header>

                <div className="flex-1 overflow-auto p-4 md:p-8">
                    <div className="max-w-7xl mx-auto">{children}</div>
                </div>
            </main>
        </div>
    );
}
