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
      const result = await createMember({ sessionToken, firstName, lastName, phone });
      setInvitationCode(result.invitationCode);
      setFirstName("");
      setLastName("");
      setPhone("");
      setModal("show-code");
    } catch (err: unknown) {
      setError(toDisplayError(err, { title: "Invite failed", fallbackMessage: "Could not make the invite. Try again." }));
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
      setError(toDisplayError(err, { title: "Cancel failed", fallbackMessage: "Could not cancel this invite. Try again." }));
    }
  };

  const handleRegenerate = async (invitationId: Id<"invitations">) => {
    if (!sessionToken) return;
    try {
      const result = await regenerateInvitation({ invitationId, sessionToken });
      setInvitationCode(result.invitationCode);
      setModal("show-code");
    } catch (err: unknown) {
      setError(toDisplayError(err, { title: "Could not make new code", fallbackMessage: "Could not make a new code. Try again." }));
    }
  };

  const pendingCount = (invitations ?? []).filter((inv) => inv.status === "pending").length;

  return (
    <div className="space-y-5">
      <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="card overflow-hidden">
        <div className="p-5 md:p-6 border-b border-theme flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3.5">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-accent/15 text-accent-light">
              <Users className="h-6 w-6" />
            </span>
            <div>
              <span className="eyebrow">Directory</span>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight mt-1">Members</h1>
            </div>
          </div>
          <button onClick={() => { setModal("invite"); setError(null); }} className="btn btn--primary btn--md">
            <UserPlus className="h-4 w-4" />
            Invite member
          </button>
        </div>

        <div className="p-4 border-b border-theme">
          <div className="relative">
            <Search className="h-4 w-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-theme-muted" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name or phone"
              className="field !pl-11 !rounded-xl"
            />
          </div>
        </div>

        {/* Desktop table */}
        <div className="overflow-x-auto hidden md:block">
          <table className="w-full min-w-[720px]">
            <thead>
              <tr className="border-b border-theme text-left">
                <th className="px-5 py-3.5 eyebrow">Member</th>
                <th className="px-5 py-3.5 eyebrow">Contact</th>
                <th className="px-5 py-3.5 eyebrow">Joined</th>
                <th className="px-5 py-3.5 eyebrow text-right">View</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {!filtered || filtered.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-16 text-center eyebrow">
                    {members === undefined ? "Loading…" : "No members found"}
                  </td>
                </tr>
              ) : (
                filtered.map((member) => <MemberRow key={member._id} member={member} />)
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="md:hidden divide-y divide-[var(--border)]">
          {!filtered || filtered.length === 0 ? (
            <div className="py-16 text-center eyebrow">{members === undefined ? "Loading…" : "No members found"}</div>
          ) : (
            filtered.map((member) => (
              <Link key={member._id} to={`/members/${member._id}`} className="flex items-center gap-3 p-4 hover:bg-hover transition-colors">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-accent/12 text-accent-light font-bold text-xs shrink-0">
                  {member.firstName[0]}{member.lastName[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{member.firstName} {member.lastName}</p>
                  <p className="text-xs text-theme-muted">{member.phone}</p>
                </div>
                <ChevronRight className="h-5 w-5 text-theme-muted" />
              </Link>
            ))
          )}
        </div>
      </motion.section>

      {/* Invites */}
      <section className="card overflow-hidden">
        <div className="p-4 border-b border-theme flex items-center justify-between">
          <p className="eyebrow">Pending invites</p>
          <span className="pill pill--accent">{pendingCount} waiting</span>
        </div>
        {!invitations || invitations.length === 0 ? (
          <div className="p-10 text-center eyebrow">No invites yet</div>
        ) : (
          <div className="divide-y divide-[var(--border)]">
            {invitations.slice(0, 8).map((inv) => (
              <div key={inv._id} className="p-4 flex items-center gap-3">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold truncate">{inv.firstName} {inv.lastName}</p>
                  <p className="text-xs text-theme-muted font-mono mt-0.5">{inv.code}</p>
                </div>
                <span className={`pill ${inv.status === "pending" ? "pill--warning" : inv.status === "claimed" ? "pill--success" : ""}`}>{inv.status}</span>
                <div className="flex gap-1.5">
                  <button onClick={() => copyCode(inv.code)} className="grid h-8 w-8 place-items-center rounded-lg border border-theme hover:bg-hover transition-colors"><Copy className="h-3.5 w-3.5" /></button>
                  {inv.status !== "claimed" && (
                    <button onClick={() => handleRegenerate(inv._id)} className="grid h-8 w-8 place-items-center rounded-lg border border-theme hover:bg-hover transition-colors"><RefreshCw className="h-3.5 w-3.5" /></button>
                  )}
                  {inv.status === "pending" && (
                    <button onClick={() => handleRevoke(inv._id)} className="grid h-8 w-8 place-items-center rounded-lg border border-theme hover:bg-danger/10 hover:text-danger hover:border-danger/40 transition-colors"><Ban className="h-3.5 w-3.5" /></button>
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
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setModal(null)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 14 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 14 }}
              transition={{ type: "spring", stiffness: 300, damping: 26 }}
              className="relative glass-strong rounded-3xl w-full max-w-md mx-4 overflow-hidden"
            >
              <div className="px-5 py-4 border-b border-theme flex items-center justify-between">
                <p className="font-bold tracking-tight">{modal === "invite" ? "Invite member" : "Invite code"}</p>
                <button onClick={() => setModal(null)} className="grid h-8 w-8 place-items-center rounded-lg border border-theme hover:bg-hover transition-colors"><X className="h-4 w-4" /></button>
              </div>
              <div className="p-5">
                {error && <DetailedErrorPanel error={error} className="mb-4" />}

                {modal === "invite" && (
                  <form onSubmit={handleInvite} className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="First name" required className="field" />
                      <input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Last name" required className="field" />
                    </div>
                    <div className="relative">
                      <Phone className="h-4 w-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-theme-muted" />
                      <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone" required className="field !pl-10" />
                    </div>
                    <button type="submit" className="btn btn--primary btn--md w-full">Make invite</button>
                  </form>
                )}

                {modal === "show-code" && (
                  <div className="space-y-4">
                    <div className="rounded-2xl border border-theme bg-hover p-4">
                      <p className="eyebrow">Give them this code</p>
                      <div className="mt-2.5 flex items-center gap-2 p-2.5 rounded-xl border border-theme bg-bg-raised">
                        <Ticket className="h-4 w-4 text-accent-light" />
                        <code className="flex-1 font-mono font-bold">{invitationCode}</code>
                        <button onClick={() => copyCode(invitationCode)} className="grid h-8 w-8 place-items-center rounded-lg border border-theme hover:bg-hover transition-colors">
                          {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                    <button onClick={() => setModal(null)} className="btn btn--ghost btn--md w-full">Done</button>
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
    <tr className="hover:bg-hover transition-colors">
      <td className="px-5 py-3.5">
        <div className="flex items-center gap-3">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-accent/12 text-accent-light font-bold text-xs">
            {member.firstName[0]}{member.lastName[0]}
          </div>
          <p className="font-semibold">{member.firstName} {member.lastName}</p>
        </div>
      </td>
      <td className="px-5 py-3.5">
        <p className="text-sm text-theme-secondary inline-flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" />{member.phone}</p>
      </td>
      <td className="px-5 py-3.5">
        <p className="text-sm text-theme-secondary inline-flex items-center gap-1.5"><CalendarDays className="h-3.5 w-3.5" />{formatDate(member.joinedAt)}</p>
      </td>
      <td className="px-5 py-3.5 text-right">
        <Link to={`/members/${member._id}`} className="inline-grid h-8 w-8 place-items-center rounded-lg border border-theme hover:bg-hover-accent hover:text-accent-light transition-colors">
          <ChevronRight className="h-4 w-4" />
        </Link>
      </td>
    </tr>
  );
}
