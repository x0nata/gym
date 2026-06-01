import { Link } from "react-router-dom";
import { Zap, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";

export default function NotFound() {
    return (
        <div className="min-h-screen bg-theme-raised flex items-center justify-center p-4 font-['Outfit']">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-lg border-4 border-theme-strong bg-theme-raised shadow-[4px_4px_0px_0px_var(--border-strong)] text-center p-8 md:p-12"
            >
                <div className="inline-flex items-center gap-2 text-2xl font-black uppercase tracking-widest font-['Syncopate'] mb-6">
                    <Zap className="text-[#ccff00] fill-black w-6 h-6" /> KINETIC
                </div>
                <h1 className="text-6xl md:text-8xl font-black font-['Syncopate'] mb-4">404</h1>
                <p className="text-lg font-bold uppercase tracking-widest text-theme-muted mb-8">
                    Signal lost. Sector not found.
                </p>
                <Link
                    to="/"
                    className="inline-flex items-center gap-2 px-6 py-4 bg-black text-white font-black uppercase tracking-widest border-2 border-theme-strong hover:bg-[#ccff00] hover:text-theme transition-colors shadow-[4px_4px_0px_0px_var(--border-strong)]"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Return to Base
                </Link>
            </motion.div>
        </div>
    );
}
