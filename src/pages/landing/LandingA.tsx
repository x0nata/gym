import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { Mark } from "../../components/layout/Mark";

const lines = [
  { n: "01", h: "Check-ins in a second", b: "Scan, snap, or type a code. The door opens before the desk blinks." },
  { n: "02", h: "One calm member ledger", b: "Profiles, history, status, and dues — searchable, sortable, never a spreadsheet." },
  { n: "03", h: "Money in realtime", b: "Active rates, retention, and revenue update the instant a membership moves." },
  { n: "04", h: "Alerts before you chase", b: "Expiring plans and stale members push themselves to the top." },
  { n: "05", h: "A pass in every pocket", b: "Every member gets a personal QR — entry without a queue, ever." },
  { n: "06", h: "Three doors, one key", b: "Staff, member, and platform-admin portals — secure, separated, sealed." },
];

const stats: [string, string][] = [
  ["3", "portals"],
  ["100%", "realtime"],
  ["0", "spreadsheets"],
  ["24/7", "uptime"],
];

export default function Landing() {
  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: "var(--bg)", color: "var(--text)" }}>
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background:
            "radial-gradient(60vw 50vw at 88% 4%, rgba(61,217,182,0.10), transparent 60%), radial-gradient(40vw 40vw at 0% 96%, rgba(95,184,255,0.07), transparent 62%)",
        }}
      />

      {/* Nav */}
      <nav className="relative z-20 px-4 md:px-10 py-5 flex items-center justify-between">
        <a href="/" className="inline-flex items-center gap-3">
          <Mark />
          <span className="brand-mark text-sm">KINETIC</span>
          <span className="hidden sm:inline text-theme-muted text-[0.7rem] tracking-[0.16em] uppercase border-l pl-3 border-theme">
            Gym ops platform
          </span>
        </a>
        <div className="flex items-center gap-2">
          <Link to="/auth/user" className="btn btn--ghost btn--sm hidden sm:inline-flex">
            Member
          </Link>
          <Link to="/auth" className="btn btn--primary btn--sm">
            Open the platform
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative z-10 px-4 md:px-10 pt-10 md:pt-20">
        <div className="grid grid-cols-12 gap-x-4 md:gap-x-6 gap-y-10 items-start">
          <div className="col-span-12 md:col-span-3 md:pr-6">
            <p className="eyebrow mb-4">// Manifesto</p>
            <p className="text-theme-secondary text-sm leading-relaxed max-w-[26ch]">
              Not a dashboard. A control room for people who run rooms full of iron and heartbeats.
            </p>
          </div>

          <div className="col-span-12 md:col-span-5">
            <span className="text-theme-muted text-[0.7rem] tracking-[0.22em] uppercase">K—01</span>
            <h1 className="mt-5 text-5xl md:text-7xl lg:text-[6rem] font-extrabold tracking-[-0.03em] leading-[0.92]">
              Form,
              <br />
              <span className="text-energy">force,</span> flow.
            </h1>
            <p className="mt-7 max-w-xl text-lg md:text-2xl leading-snug text-theme">
              Check-ins, members, memberships &amp; money —
              <span className="text-theme-secondary"> running calm </span>
              on a realtime backend.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link to="/auth" className="btn btn--primary btn--lg">
                Get started
                <ArrowUpRight className="h-5 w-5" />
              </Link>
              <Link to="/admin/auth" className="btn btn--outline btn--lg">
                Platform admin
              </Link>
            </div>
          </div>

          <div className="col-span-12 md:col-span-4 md:pl-6 md:border-l border-theme">
            <div className="text-[6rem] md:text-[9rem] leading-[0.82] tracking-tighter font-extrabold">
              <span className="text-energy">1</span>.<span className="opacity-80">0s</span>
            </div>
            <p className="eyebrow mt-1">door-to-member</p>
            <dl className="mt-7 grid grid-cols-2 gap-x-4 gap-y-5">
              {stats.map(([a, b]) => (
                <div key={b} className="flex items-baseline gap-2">
                  <dt className="text-2xl font-extrabold">{a}</dt>
                  <dd className="text-theme-muted text-[0.72rem] tracking-[0.18em] uppercase">{b}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      {/* Principles */}
      <section className="relative z-10 px-4 md:px-10 mt-20 md:mt-28">
        <div className="flex items-end justify-between border-t pt-6 border-theme-strong">
          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight leading-[1.05]">
            Six things it does <br />
            that the spreadsheet didn&rsquo;t.
          </h2>
          <span className="eyebrow hidden sm:inline">06 principles</span>
        </div>

        <div className="mt-8">
          {lines.map((l, idx) => (
            <motion.div
              key={l.n}
              initial={{ opacity: 0, x: -16 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.5, delay: idx * 0.04, ease: [0.22, 1, 0.36, 1] }}
              className="group grid grid-cols-12 items-center gap-x-4 py-5 md:py-7 border-b hover:bg-hover transition-colors border-theme"
            >
              <span className="col-span-2 md:col-span-1 text-theme-muted text-sm tracking-[0.14em] group-hover:text-theme transition-colors">
                {l.n}
              </span>
              <h3 className="col-span-10 md:col-span-5 order-2 md:order-none text-xl md:text-2xl font-bold tracking-tight">
                {l.h}
              </h3>
              <p className="col-span-12 md:col-span-5 text-theme-secondary text-[0.95rem] leading-relaxed">
                {l.b}
              </p>
              <span className="hidden md:flex col-span-1 justify-end">
                <ArrowUpRight className="h-5 w-5 text-theme-muted group-hover:text-energy group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-transform" />
              </span>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Closing */}
      <section className="relative z-10 px-4 md:px-10 mt-20 md:mt-28">
        <div className="border-t pt-8 pb-24 md:pb-36 border-theme-strong">
          <p className="eyebrow mb-5">/end</p>
          <h2 className="text-4xl md:text-7xl font-extrabold leading-[0.98] tracking-tight max-w-5xl">
            Run the room. <br />
            <span className="text-energy">We&rsquo;ll</span>{" "}
            <span className="italic font-normal">count</span> the reps.
          </h2>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link to="/auth" className="btn btn--primary btn--lg">Create your gym</Link>
            <Link to="/auth/user" className="btn btn--ghost btn--lg">I&rsquo;m a member</Link>
          </div>
        </div>
      </section>
    </div>
  );
}