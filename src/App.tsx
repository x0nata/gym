import { Suspense, lazy } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { AppLayout } from "./components/layout/AppLayout";
import { useAuth } from "./lib/useAuth";

const Landing = lazy(() => import("./pages/landing/Landing"));
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

function LoadingScreen() {
    return (
        <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "var(--bg)" }}>
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center gap-4"
            >
                <div className="relative">
                    <div className="h-16 w-16 border-4 border-accent border-t-transparent rounded-full animate-spin" />
                    <div className="absolute inset-0 h-16 w-16 border-4 border-accent/20 rounded-full animate-pulse" />
                </div>
                <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="text-sm font-medium"
                    style={{ color: "var(--text-muted)" }}
                >
                    Loading...
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
        return <Navigate to={user?.role === "member" ? "/member/dashboard" : "/dashboard"} replace />;
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

                    <Route path="*" element={<NotFound />} />
                </Routes>
            </Suspense>
        </AnimatePresence>
    );
}

export default function App() {
    return <AnimatedRoutes />;
}
