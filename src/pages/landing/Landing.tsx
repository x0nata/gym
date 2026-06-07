import { motion } from "framer-motion";
import { Zap, Play, Target, Shield, ArrowUpRight, Moon, Sun } from "lucide-react";
import { Link } from "react-router-dom";
import { useTheme } from "../../lib/useTheme";

export default function Landing() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen bg-theme-raised text-slate-900 font-['Outfit'] overflow-hidden selection:bg-[#ccff00] selection:text-theme">
      {/* Dynamic Background Pattern */}
      <div className="absolute inset-0 z-0 bg-[radial-gradient(#e8e4dc_1px,transparent_1px)] [background-size:24px_24px] opacity-40 dark:hidden" />

      {/* Navigation */}
      <nav className="relative z-10 flex justify-between items-center px-4 md:px-6 py-3 md:py-4 border-b-4 border-theme-strong font-black uppercase tracking-widest text-xs md:text-sm">
        <div className="flex items-center gap-2 text-lg md:text-2xl">
          <Zap className="text-[#ccff00] fill-black w-5 h-5 md:w-6 md:h-6" /> KINETIC
        </div>
        <div className="flex gap-3 md:gap-8 items-center text-theme">
          <button
            onClick={toggleTheme}
            className="p-2 hover:bg-[#ccff00] hover:text-theme transition-colors border-2 border-transparent hover:border-theme-strong rounded"
            aria-label="Switch theme"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 md:w-5 md:h-5" /> : <Moon className="w-4 h-4 md:w-5 md:h-5" />}
          </button>
          
        </div>
      </nav>

      <main className="relative z-10 flex flex-col md:flex-row items-stretch border-b-4 border-theme-strong min-h-[85vh]">
        {/* Left Side: Massive Typography */}
        <div className="flex-1 p-6 md:p-12 lg:p-24 flex flex-col justify-center border-r-0 md:border-r-4 border-theme-strong relative bg-theme-raised">
          <motion.div
            initial={{ x: -100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ type: "spring", stiffness: 50 }}
          >
            <h1 className="text-[3.5rem] sm:text-[6rem] md:text-[8rem] lg:text-[11rem] leading-[0.85] font-black font-['Syncopate'] uppercase mb-6 md:mb-8">
              GET <br /> 
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ccff00] to-[#00f0ff] [-webkit-text-stroke:2px_black] dark:[-webkit-text-stroke:2px_white] drop-shadow-[4px_4px_0px_black] dark:drop-shadow-[4px_4px_0px_white]">
                STRONG.
              </span>
            </h1>
            <p className="text-lg sm:text-2xl md:text-3xl font-bold max-w-xl border-l-8 border-[#ccff00] pl-4 md:pl-6 mb-8 md:mb-12">
              A simple gym manager for gyms that want to grow.
            </p>

            <div className="flex gap-4 md:gap-6">
              <Link to="/auth" className="inline-flex items-center gap-2 px-6 md:px-8 py-4 md:py-5 text-base md:text-xl font-black uppercase bg-black text-white border-2 border-theme-strong hover:bg-[#ccff00] hover:text-theme transition-colors shadow-[6px_6px_0px_0px_rgba(204,255,0,1)] hover:shadow-[0px_0px_0px_0px_rgba(204,255,0,1)] hover:translate-x-[6px] hover:translate-y-[6px]">
                SIGN UP <ArrowUpRight className="w-5 h-5 md:w-6 md:h-6" />
              </Link>
              <button className="w-12 h-12 md:w-16 md:h-16 -full border-4 border-theme-strong flex items-center justify-center hover:bg-black hover:text-[#ccff00] transition-colors">
                <Play className="w-5 h-5 md:w-6 md:h-6 ml-1" />
              </button>
            </div>
          </motion.div>
        </div>

        {/* Right Side: Brutalist Grid */}
        <div className="w-full md:w-[40%] bg-[#F5F0E8] flex flex-col">
          <div className="flex-1 p-6 md:p-12 border-b-4 border-theme-strong bg-theme-raised hover:bg-[#ccff00] transition-colors group relative overflow-hidden flex flex-col justify-between">
             <Target className="w-10 h-10 md:w-16 md:h-16 text-theme mb-4 md:mb-6 group-hover:scale-110 transition-transform" />
             <div>
               <h3 className="text-2xl md:text-4xl font-black uppercase mb-3 md:mb-4 font-['Syncopate']">Quick Start</h3>
               <p className="text-base md:text-xl font-medium">Sign up fast. Get members started in seconds.</p>
             </div>
          </div>
          <div className="flex-1 p-6 md:p-12 text-black bg-theme-sidebar hover:text-theme  group relative overflow-hidden transition-colors flex flex-col justify-between">
             <Shield className="w-10 h-10 md:w-16 md:h-16 text-green-500 mb-4 md:mb-6 group-hover:scale-110 transition-transform group-hover:text-theme" />
             <div>
               <h3 className="text-2xl md:text-4xl font-black uppercase mb-3 md:mb-4 font-['Syncopate']">Safe and Secure</h3>
               <p className="text-base md:text-xl font-black text-slate-500 group-hover:text-slate-400">Your data is protected.</p>
             </div>
          </div>
        </div>
      </main>

      {/* Marquee */}
      <div className="border-b-4 border-theme-strong bg-[#ccff00] overflow-hidden py-2 md:py-3 relative z-10 flex">
        <motion.div
          animate={{ x: [0, -1000] }}
          transition={{ repeat: Infinity, ease: "linear", duration: 10 }}
          className="flex whitespace-nowrap text-xl md:text-3xl font-black font-['Syncopate'] uppercase tracking-widest gap-4 md:gap-8"
        >
          <span>• GROW YOUR GYM</span>
          <span>• RUN SMOOTHLY</span>
          <span>• KEEP MEMBERS</span>
          <span>• GROW YOUR GYM</span>
          <span>• RUN SMOOTHLY</span>
          <span>• KEEP MEMBERS</span>
        </motion.div>
      </div>
    </div>
  );
}
