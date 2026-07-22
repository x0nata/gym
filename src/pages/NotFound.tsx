import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import { Mark } from "../components/layout/Mark";

export default function NotFound() {
    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="card text-center p-8 md:p-12 max-w-lg w-full"
            >
                <Link to="/" className="inline-flex items-center gap-2.5 mb-8">
                    <Mark />
                    <span className="brand-mark text-sm">KINETIC</span>
                </Link>
                <h1 className="text-7xl md:text-8xl font-extrabold tracking-tight leading-none text-energy">404</h1>
                <p className="mt-4 text-base text-theme-secondary">This page took a rest day.</p>
                <Link to="/" className="btn btn--primary btn--lg mt-8">
                    <ArrowLeft className="h-4 w-4" /> Go home
                </Link>
            </motion.div>
        </div>
    );
}