import { Suspense, lazy } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { AppLayout } from "./components/layout/AppLayout";
import { AdminLayout } from "./components/layout/AdminLayout";
import { useAuth } from "./lib/useAuth";

const Landing = lazy(() => import("./pages/landing/LandingA"));
const UnifiedAuth = lazy(() => import("./pages/auth/UnifiedAuth"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Members = lazy(() => import("./pages/Members"));
const MemberDetail = lazy(() => import("./pages/MemberDetail"));
const Notifications = lazy(() => import("./pages/Notifications"));
const ScanQR = lazy(() => import("./pages/ScanQR"));
const Reports = lazy(() => import("./pages/Reports"));
const Analytics = lazy(() => import("./pages/Analytics"));
const MemberPlans = lazy(() => import("./pages/member/Plans"));
const NotFound = lazy(() => import("./pages/NotFound"));
const AdminOverview = lazy(() => import("./pages/admin/Overview"));
const AdminGyms = lazy(() => import("./pages/admin/Gyms"));
const AdminGymDetail = lazy(() => import("./pages/admin/GymDetail"));
const AdminUsers = lazy(() => import("./pages/admin/Users"));
const AdminRevenue = lazy(() => import("./pages/admin/Revenue"));
const AdminLogin = lazy(() => import("./pages/admin/AdminLogin"));

function LoadingScreen() {
    return (
        <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "var(--bg)" }}>
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center gap-4"
            >
                <div className="relative">
                    <div className="h-12 w-12 rounded-full border-2 border-accent/20 border-t-accent-light animate-spin" />
                </div>
                <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="eyebrow"
                >
                    Loading…
                </motion.span>
            </motion.div>
        </div>
    );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
    const { isAuthenticated, isInitialized } = useAuth();

    if (!isInitialized) {
        return <LoadingScreen />;
    }

    if (!isAuthenticated) {
        return <Navigate to="/" replace />;
    }

    return <>{children}</>;
}

function PublicOnlyRoute({ children }: { children: React.ReactNode }) {
    const { isAuthenticated, isInitialized, user } = useAuth();

    if (!isInitialized) {
        return <LoadingScreen />;
    }

    if (isAuthenticated) {
        return <Navigate to={user?.role === "superadmin" ? "/admin" : user?.role === "member" ? "/member/dashboard" : "/dashboard"} replace />;
    }

    return <>{children}</>;
}

function GymOnlyRoute({ children }: { children: React.ReactNode }) {
    const { user, isAuthenticated, isInitialized } = useAuth();

    if (!isInitialized) {
        return <LoadingScreen />;
    }

    if (!isAuthenticated) {
        return <Navigate to="/auth" replace />;
    }

    if (user?.role !== "gym") {
        return <Navigate to="/dashboard" replace />;
    }

    return <>{children}</>;
}

function MemberOnlyRoute({ children }: { children: React.ReactNode }) {
    const { user, isAuthenticated, isInitialized } = useAuth();

    if (!isInitialized) {
        return <LoadingScreen />;
    }

    if (!isAuthenticated) {
        return <Navigate to="/auth" replace />;
    }

    if (user?.role !== "member") {
        return <Navigate to="/dashboard" replace />;
    }

    return <>{children}</>;
}

function AdminOnlyRoute({ children }: { children: React.ReactNode }) {
    const { user, isAuthenticated, isInitialized } = useAuth();

    if (!isInitialized) {
        return <LoadingScreen />;
    }

    if (!isAuthenticated) {
        return <Navigate to="/admin/auth" replace />;
    }

    if (user?.role !== "superadmin") {
        return <Navigate to="/dashboard" replace />;
    }

    return <>{children}</>;
}

function AnimatedRoutes() {
    const location = useLocation();

    return (
        <AnimatePresence mode="wait">
            <Suspense fallback={<LoadingScreen />}>
                <Routes location={location} key={location.pathname}>
                    <Route
                        path="/"
                        element={
                            <PublicOnlyRoute>
                                <Landing />
                            </PublicOnlyRoute>
                        }
                    />
                    <Route
                        path="/auth"
                        element={
                            <PublicOnlyRoute>
                                <UnifiedAuth />
                            </PublicOnlyRoute>
                        }
                    />
                    <Route
                        path="/auth/user"
                        element={
                            <PublicOnlyRoute>
                                <UnifiedAuth />
                            </PublicOnlyRoute>
                        }
                    />
                    <Route
                        path="/auth/gym"
                        element={
                            <PublicOnlyRoute>
                                <UnifiedAuth />
                            </PublicOnlyRoute>
                        }
                    />
                    <Route path="/auth/member" element={<Navigate to="/auth/user" replace />} />
                    <Route path="/auth/gym/register" element={<Navigate to="/auth" replace />} />

                    {/* Dashboard - redirects based on role */}
                    <Route
                        path="/dashboard"
                        element={
                            <ProtectedRoute>
                                <AppLayout><Dashboard /></AppLayout>
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/notifications"
                        element={
                            <ProtectedRoute>
                                <AppLayout><Notifications /></AppLayout>
                            </ProtectedRoute>
                        }
                    />

                    {/* Gym Portal Routes */}
                    <Route
                        path="/members"
                        element={
                            <GymOnlyRoute>
                                <AppLayout><Members /></AppLayout>
                            </GymOnlyRoute>
                        }
                    />
                    <Route
                        path="/members/:id"
                        element={
                            <GymOnlyRoute>
                                <AppLayout><MemberDetail /></AppLayout>
                            </GymOnlyRoute>
                        }
                    />
                    <Route
                        path="/scan"
                        element={
                            <GymOnlyRoute>
                                <AppLayout><ScanQR /></AppLayout>
                            </GymOnlyRoute>
                        }
                    />
                    <Route
                        path="/reports"
                        element={
                            <GymOnlyRoute>
                                <AppLayout><Reports /></AppLayout>
                            </GymOnlyRoute>
                        }
                    />
                    <Route
                        path="/analytics"
                        element={
                            <GymOnlyRoute>
                                <AppLayout><Analytics /></AppLayout>
                            </GymOnlyRoute>
                        }
                    />

                    {/* Member Portal Routes */}
                    <Route
                        path="/member/dashboard"
                        element={
                            <Navigate to="/dashboard" replace />
                        }
                    />
                    <Route
                        path="/member/plans"
                        element={
                            <MemberOnlyRoute>
                                <AppLayout><MemberPlans /></AppLayout>
                            </MemberOnlyRoute>
                        }
                    />

                    {/* Admin Login (public, redirects to /admin if already authenticated) */}
                    <Route
                        path="/admin/auth"
                        element={
                            <PublicOnlyRoute>
                                <AdminLogin />
                            </PublicOnlyRoute>
                        }
                    />

                    {/* Admin Platform Routes */}
                    <Route
                        path="/admin"
                        element={
                            <AdminOnlyRoute>
                                <AdminLayout><AdminOverview /></AdminLayout>
                            </AdminOnlyRoute>
                        }
                    />
                    <Route
                        path="/admin/gyms"
                        element={
                            <AdminOnlyRoute>
                                <AdminLayout><AdminGyms /></AdminLayout>
                            </AdminOnlyRoute>
                        }
                    />
                    <Route
                        path="/admin/gyms/:id"
                        element={
                            <AdminOnlyRoute>
                                <AdminLayout><AdminGymDetail /></AdminLayout>
                            </AdminOnlyRoute>
                        }
                    />
                    <Route
                        path="/admin/users"
                        element={
                            <AdminOnlyRoute>
                                <AdminLayout><AdminUsers /></AdminLayout>
                            </AdminOnlyRoute>
                        }
                    />
                    <Route
                        path="/admin/revenue"
                        element={
                            <AdminOnlyRoute>
                                <AdminLayout><AdminRevenue /></AdminLayout>
                            </AdminOnlyRoute>
                        }
                    />

                    <Route path="*" element={<NotFound />} />
                </Routes>
            </Suspense>
        </AnimatePresence>
    );
}

export default function App() {
    return <AnimatedRoutes />;
}
