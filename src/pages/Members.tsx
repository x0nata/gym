import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import {
  Users,
  UserPlus,
  Search,
  Phone,
  CalendarDays,
  ChevronRight,
  Ticket,
  Copy,
  RefreshCw,
  Ban,
  X,
  Check,
} from "lucide-react";
import { api } from "../../convex/_generated/api";
import type { Doc, Id } from "../../convex/_generated/dataModel";
import { useAuth } from "../lib/useAuth";
import { formatDate } from "../lib/utils";
import { toDisplayError, type AppErrorDetails } from "../lib/errorHandling";
import { DetailedErrorPanel } from "../components/feedback/DetailedErrorPanel";

type ModalMode = null | "invite" | "show-code";

export default function Members() {
  const { user } = useAuth();
  const sessionToken = user?.sessionToken;

  const members = useQuery(api.members.list, sessionToken ? { sessionToken } : "skip");
  const invitations = useQuery(api.invitations.listForGym, sessionToken ? { sessionToken, type: "member" } : "skip");

  const createMember = useMutation(api.invitations.createMemberInvitation);
  const revokeInvitation = useMutation(api.invitations.revoke);
  const regenerateInvitation = useMutation(api.invitations.regenerate);

  const [search, setSearch] = useState("");
  const [modal, setModal] = useState<ModalMode>(null);
  const [error, setError] = useState<AppErrorDetails | null>(null);
  const [invitationCode, setInvitationCode] = useState("");
  const [copied, setCopied] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");

  const filtered = members?.filter((m) => {
    const q = search.toLowerCase();
    return m.firstName.toLowerCase().includes(q) || m.lastName.toLowerCase().includes(q) || m.phone.toLowerCase().includes(q);
  });

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionToken) return;
    setError(null);
    try {
      const result = await createMember({
        sessionToken,
        firstName,
        lastName,
        phone,
      });
      setInvitationCode(result.invitationCode);
      setFirstName("");
      setLastName("");
      setPhone("");
      setModal("show-code");
    } catch (err: unknown) {
      setError(
        toDisplayError(err, {
          title: "Invitation failed",
          fallbackMessage: "We could not create the invitation. Please try again.",
        })
      );
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setInvitationCode(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  };

  const handleRevoke = async (invitationId: Id<"invitations">) => {
    if (!sessionToken) return;
    try {
      await revokeInvitation({ invitationId, sessionToken });
    } catch (err: unknown) {
      setError(
        toDisplayError(err, {
          title: "Revoke failed",
          fallbackMessage: "We could not revoke this invitation. Please try again.",
        })
      );
    }
  };

  const handleRegenerate = async (invitationId: Id<"invitations">) => {
    if (!sessionToken) return;
    try {
      const result = await regenerateInvitation({ invitationId, sessionToken });
      setInvitationCode(result.invitationCode);
      setModal("show-code");
    } catch (err: unknown) {
      setError(
        toDisplayError(err, {
          title: "Regeneration failed",
          fallbackMessage: "We could not regenerate this invitation. Please try again.",
        })
      );
    }
  };

  return (
    <div className="space-y-6 font-['Outfit']">
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="border-4 border-theme-strong bg-theme-raised shadow-[4px_4px_0px_0px_var(--border-strong)]"
      >
        <div className="p-6 border-b-4 border-theme-strong bg-theme-sidebar flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 border-2 border-theme-strong bg-sidebar text-[#ccff00] flex items-center justify-center">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-700">Athletes</p>
              <h1 className="text-2xl md:text-3xl font-black uppercase font-['Syncopate']">Roster Control</h1>
            </div>
          </div>
          <button
            onClick={() => {
              setModal("invite");
              setError(null);
            }}
            className="h-11 px-4 border-2 border-theme-strong bg-black text-white text-xs font-black uppercase tracking-widest hover:bg-theme-raised hover:text-theme transition-colors inline-flex items-center gap-2"
          >
            <UserPlus className="h-4 w-4" />
            Invite athlete
          </button>
        </div>

        <div className="p-4 border-b-4 border-theme-strong bg-theme-sidebar">
          <div className="relative">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or phone"
              className="w-full h-11 border-2 border-theme-strong pl-10 pr-3 text-sm font-bold"
            />
          </div>
        </div>

        <div className="overflow-x-auto hidden md:block">
          <table className="w-full min-w-[720px]">
            <thead>
              <tr className="border-b-2 border-theme-strong text-left text-[11px] font-black uppercase tracking-[0.18em] text-theme-muted">
                <th className="px-4 py-3">Athlete</th>
                <th className="px-4 py-3">Contact</th>
                <th className="px-4 py-3">Joined</th>
                <th className="px-4 py-3 text-right">Open</th>
              </tr>
            </thead>
            <tbody>
              {!filtered || filtered.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-16 text-center text-theme-muted font-black uppercase tracking-wider">
                    {members === undefined ? "Loading..." : "No athletes found"}
                  </td>
                </tr>
              ) : (
                filtered.map((member) => (
                  <MemberRow key={member._id} member={member} />
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile card view */}
        <div className="md:hidden divide-y-2 divide-black">
          {!filtered || filtered.length === 0 ? (
            <div className="py-16 text-center text-theme-muted font-black uppercase tracking-wider">
              {members === undefined ? "Loading..." : "No athletes found"}
            </div>
          ) : (
            filtered.map((member) => (
              <Link
                key={member._id}
                to={`/members/${member._id}`}
                className="flex items-center gap-3 p-4 hover:bg-[#ccff00]/10 transition-colors"
              >
                <div className="h-10 w-10 border-2 border-theme-strong bg-black text-[#ccff00] font-black text-xs flex items-center justify-center shrink-0">
                  {member.firstName[0]}{member.lastName[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-black uppercase text-sm">{member.firstName} {member.lastName}</p>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-600">{member.phone}</p>
                </div>
                <ChevronRight className="h-5 w-5 text-theme-muted" />
              </Link>
            ))
          )}
        </div>
      </motion.section>

      <section className="border-4 border-theme-strong bg-theme-raised shadow-[4px_4px_0px_0px_var(--border-strong)] overflow-hidden">
        <div className="p-4 border-b-4 border-theme-strong bg-sidebar text-black flex items-center justify-between">
          <p className="text-xs font-black uppercase tracking-[0.2em]">Invitation queue</p>
          <p className="text-[10px] md:text-xs font-black uppercase">{(invitations ?? []).filter((inv) => inv.status === "pending").length} pending</p>
        </div>
        {!invitations || invitations.length === 0 ? (
          <div className="p-10 text-center text-theme-muted font-black uppercase tracking-wider">No invitations yet</div>
        ) : (
          <div className="divide-y divide-black/10">
            {invitations.slice(0, 8).map((inv) => (
              <div key={inv._id} className="p-3 md:p-4 flex items-center gap-2 md:gap-3">
                <div className="min-w-0 flex-1">
                  <p className="font-black uppercase text-sm truncate">{inv.firstName} {inv.lastName}</p>
                  <p className="text-[10px] md:text-xs font-bold uppercase text-theme-muted tracking-wider">{inv.code}</p>
                </div>
                <span className="px-2 py-1 border border-theme-strong text-[9px] md:text-[10px] font-black uppercase tracking-wider">{inv.status}</span>
                <div className="flex gap-1 md:gap-0">
                  <button onClick={() => copyCode(inv.code)} className="h-7 w-7 md:h-8 md:w-8 border-2 border-theme-strong flex items-center justify-center"><Copy className="h-3 w-3 md:h-4 md:w-4" /></button>
                  {inv.status !== "claimed" && (
                    <button onClick={() => handleRegenerate(inv._id)} className="h-7 w-7 md:h-8 md:w-8 border-2 border-theme-strong flex items-center justify-center"><RefreshCw className="h-3 w-3 md:h-4 md:w-4" /></button>
                  )}
                  {inv.status === "pending" && (
                    <button onClick={() => handleRevoke(inv._id)} className="h-7 w-7 md:h-8 md:w-8 border-2 border-theme-strong flex items-center justify-center"><Ban className="h-3 w-3 md:h-4 md:w-4" /></button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <AnimatePresence>
        {modal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/55" onClick={() => setModal(null)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 14 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 14 }}
              className="relative w-full max-w-md border-4 border-theme-strong bg-theme-raised shadow-[4px_4px_0px_0px_var(--border-strong)] mx-4"
            >
              <div className="p-3 md:p-4 border-b-4 border-theme-strong bg-black text-white flex items-center justify-between">
                <p className="text-xs md:text-sm font-black uppercase tracking-widest">{modal === "invite" ? "Invite athlete" : "Invitation code"}</p>
                <button onClick={() => setModal(null)} className="h-7 w-7 md:h-8 md:w-8 border-2 border-white flex items-center justify-center"><X className="h-3 w-3 md:h-4 md:w-4" /></button>
              </div>
              <div className="p-4 md:p-5">
                {error && <DetailedErrorPanel error={error} className="mb-4" />}

                {modal === "invite" && (
                  <form onSubmit={handleInvite} className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="First name" required className="h-10 border-2 border-theme-strong px-3 text-sm font-bold" />
                      <input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Last name" required className="h-10 border-2 border-theme-strong px-3 text-sm font-bold" />
                    </div>
                    <div className="relative">
                      <Phone className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone" required className="h-10 w-full border-2 border-theme-strong pl-10 pr-3 text-sm font-bold" />
                    </div>
                    <button type="submit" className="h-10 w-full border-2 border-theme-strong bg-[#ccff00] text-theme text-xs font-black uppercase tracking-widest">Create invite</button>
                  </form>
                )}

                {modal === "show-code" && (
                  <div className="space-y-4">
                    <div className="p-4 border-2 border-theme-strong bg-theme-sidebar">
                      <p className="text-xs font-black uppercase tracking-wider text-theme-muted">Share this code</p>
                      <div className="mt-2 flex items-center gap-2 p-2 border-2 border-theme-strong bg-theme-raised">
                        <Ticket className="h-4 w-4" />
                        <code className="flex-1 font-black text-sm">{invitationCode}</code>
                        <button onClick={() => copyCode(invitationCode)} className="h-8 w-8 border-2 border-theme-strong flex items-center justify-center">
                          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                    <button onClick={() => setModal(null)} className="h-10 w-full border-2 border-theme-strong bg-black text-white text-xs font-black uppercase tracking-widest">Done</button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function MemberRow({ member }: { member: Doc<"members"> }) {
  return (
    <tr className="border-b border-theme-strong/10 hover:bg-theme-sidebar">
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 border-2 border-theme-strong bg-black text-[#ccff00] font-black text-xs flex items-center justify-center">
            {member.firstName[0]}{member.lastName[0]}
          </div>
          <p className="font-black uppercase text-sm">{member.firstName} {member.lastName}</p>
        </div>
      </td>
      <td className="px-4 py-3">
        <p className="text-xs font-bold uppercase tracking-wider text-slate-600 inline-flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" />{member.phone}</p>
      </td>
      <td className="px-4 py-3">
        <p className="text-xs font-bold uppercase tracking-wider text-slate-600 inline-flex items-center gap-1.5"><CalendarDays className="h-3.5 w-3.5" />{formatDate(member.joinedAt)}</p>
      </td>
      <td className="px-4 py-3 text-right">
        <Link to={`/members/${member._id}`} className="h-8 w-8 border-2 border-theme-strong inline-flex items-center justify-center bg-theme-raised hover:bg-[#ccff00] transition-colors">
          <ChevronRight className="h-4 w-4" />
        </Link>
      </td>
    </tr>
  );
}
