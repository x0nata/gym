import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, X } from "lucide-react";

export function ConfirmAction({
    trigger,
    title,
    message,
    onConfirm,
    variant = "danger",
    children,
}: {
    trigger: React.ReactNode;
    title: string;
    message: string;
    onConfirm: () => void;
    variant?: "danger" | "warning" | "default";
    children?: React.ReactNode;
}) {
    const [open, setOpen] = useState(false);

    const colors = {
        danger: { text: "var(--color-danger)", btn: "btn--primary", accent: "rgba(248,113,113,0.16)", border: "rgba(248,113,113,0.4)" },
        warning: { text: "var(--color-warning)", btn: "btn--primary", accent: "rgba(251,191,36,0.16)", border: "rgba(251,191,36,0.4)" },
        default: { text: "var(--color-accent-light)", btn: "btn--primary", accent: "rgba(163,230,53,0.16)", border: "rgba(163,230,53,0.40)" },
    };

    const c = colors[variant];

    return (
        <>
            <button type="button" onClick={() => setOpen(true)}>{trigger}</button>

            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4"
                        onClick={() => setOpen(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.94, opacity: 0, y: 12 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.94, opacity: 0, y: 12 }}
                            transition={{ type: "spring", stiffness: 300, damping: 26 }}
                            className="glass-strong rounded-3xl max-w-md w-full p-6"
                            style={{ boxShadow: `0 30px 80px -20px rgba(0,0,0,0.6), 0 0 0 1px ${c.border}` }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between mb-5">
                                <div className="flex items-center gap-3">
                                    <span
                                        className="grid h-10 w-10 place-items-center rounded-xl"
                                        style={{ background: c.accent, color: c.text }}
                                    >
                                        <AlertTriangle className="h-5 w-5" />
                                    </span>
                                    <h3 className="font-extrabold text-lg tracking-tight text-theme">{title}</h3>
                                </div>
                                <button
                                    onClick={() => setOpen(false)}
                                    className="grid h-8 w-8 place-items-center rounded-lg border border-theme hover-theme transition-colors text-theme-secondary"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>

                            <p className="text-theme-secondary text-sm leading-relaxed mb-3">{message}</p>
                            {children}

                            <div className="flex gap-3 mt-6">
                                <button
                                    onClick={() => {
                                        onConfirm();
                                        setOpen(false);
                                    }}
                                    className={`btn ${c.btn} btn--md flex-1`}
                                >
                                    Confirm
                                </button>
                                <button
                                    onClick={() => setOpen(false)}
                                    className="btn btn--ghost btn--md flex-1"
                                >
                                    Cancel
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
