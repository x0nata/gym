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
        danger: { bg: "bg-red-500/10", border: "border-red-500", text: "text-red-500", btn: "bg-red-500 hover:bg-red-600 text-white" },
        warning: { bg: "bg-amber-500/10", border: "border-amber-500", text: "text-amber-500", btn: "bg-amber-500 hover:bg-amber-600 text-white" },
        default: { bg: "bg-theme-raised", border: "border-theme-strong", text: "text-theme", btn: "bg-[#ccff00] hover:bg-[#b3e600] text-[#000000] font-black" },
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
                        className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
                        onClick={() => setOpen(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className={`${c.bg} border-4 ${c.border} shadow-[8px_8px_0px_0px_var(--border-strong)] max-w-md w-full p-6`}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <AlertTriangle className={`h-6 w-6 ${c.text}`} />
                                    <h3 className={`font-black uppercase tracking-widest text-lg font-['Syncopate'] ${c.text}`}>{title}</h3>
                                </div>
                                <button onClick={() => setOpen(false)} className="p-1 border-2 border-theme hover:bg-theme transition-colors">
                                    <X className="h-4 w-4" />
                                </button>
                            </div>

                            <p className="text-theme font-medium mb-2">{message}</p>
                            {children}

                            <div className="flex gap-3 mt-6">
                                <button
                                    onClick={() => { onConfirm(); setOpen(false); }}
                                    className={`flex-1 px-4 py-3 font-black uppercase tracking-widest text-sm ${c.btn} border-2 ${c.border} shadow-[4px_4px_0px_0px_var(--border-strong)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all`}
                                >
                                    Confirm
                                </button>
                                <button
                                    onClick={() => setOpen(false)}
                                    className="flex-1 px-4 py-3 font-black uppercase tracking-widest text-sm border-2 border-theme hover:bg-theme transition-colors text-theme"
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
