import type { Id } from "../../convex/_generated/dataModel";

export type OfflineMember = {
  _id: Id<"members">;
  qrCode: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  gymId?: Id<"gyms">;
};

export type OfflineMembership = {
  _id: Id<"memberships">;
  memberId: Id<"members">;
  planName: string;
  startDate: number;
  endDate: number;
  status: "active" | "expired" | "cancelled";
};

export type OfflineCheckIn = {
  memberId: Id<"members">;
  timestamp: number;
  date: string;
};

export type OfflineCache = {
  syncedAt: number;
  members: OfflineMember[];
  memberships: OfflineMembership[];
  todayCheckIns: OfflineCheckIn[];
};

export type PendingCheckIn = {
  clientId: string;
  qrCode: string;
  memberId: Id<"members">;
  timestamp: number;
};

export type OfflineCheckInResult = {
  status: "checked_in" | "already_checked_in" | "error";
  member?: OfflineMember;
  membership?: OfflineMembership;
  checkInTime?: number;
  daysRemaining?: number;
  message?: string;
  code?: string;
  queued?: boolean;
  pending?: boolean;
};

export type TodayCheckInItem = {
  _id: string;
  timestamp: number;
  pending: boolean;
  member: { firstName: string; lastName: string; qrCode: string };
};

const CACHE_KEY = "offline_cache_v1";
const QUEUE_KEY = "offline_queue_v1";

function safeParse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function createClientId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `offline_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 12)}`;
}

export function toDateKey(timestamp: number): string {
  return new Date(timestamp).toISOString().split("T")[0];
}

/* ────────────── storage ────────────── */

export function loadOfflineCache(): OfflineCache | null {
  return safeParse<OfflineCache>(localStorage.getItem(CACHE_KEY));
}

export function saveOfflineCache(cache: OfflineCache): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch {
    // storage unavailable (private mode / quota) – check-in still recorded in memory for this session
  }
}

export function clearOfflineCache(): void {
  try {
    localStorage.removeItem(CACHE_KEY);
  } catch {
    // no-op
  }
}

export function loadPendingCheckIns(): PendingCheckIn[] {
  const items = safeParse<PendingCheckIn[]>(localStorage.getItem(QUEUE_KEY));
  return Array.isArray(items) ? items : [];
}

export function savePendingCheckIns(items: PendingCheckIn[]): void {
  try {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(items));
  } catch {
    // no-op
  }
}

/* ────────────── lookups ────────────── */

export function findMemberByQr(cache: OfflineCache | null, qrCode: string): OfflineMember | undefined {
  if (!cache) return undefined;
  const code = qrCode.trim();
  return cache.members.find((member) => member.qrCode === code || member.qrCode.toLowerCase() === code.toLowerCase());
}

export function findActiveMembership(
  cache: OfflineCache | null,
  memberId: Id<"members">,
  asOf = Date.now()
): OfflineMembership | undefined {
  if (!cache) return undefined;
  return cache.memberships.find(
    (membership) =>
      membership.memberId === memberId &&
      membership.status === "active" &&
      membership.endDate >= asOf
  );
}

export function findLatestMembership(
  cache: OfflineCache | null,
  memberId: Id<"members">
): OfflineMembership | undefined {
  if (!cache) return undefined;
  return cache.memberships
    .filter((membership) => membership.memberId === memberId)
    .sort((a, b) => b.endDate - a.endDate)[0];
}

export function isCheckedInToday(
  cache: OfflineCache | null,
  pending: PendingCheckIn[],
  memberId: Id<"members">,
  date: string
): boolean {
  if (cache && cache.todayCheckIns.some((checkIn) => checkIn.memberId === memberId && checkIn.date === date)) {
    return true;
  }
  return pending.some((item) => item.memberId === memberId && toDateKey(item.timestamp) === date);
}

export function getCacheSyncedAt(): number | null {
  const cache = loadOfflineCache();
  return cache ? cache.syncedAt : null;
}

export function getPendingCount(): number {
  return loadPendingCheckIns().length;
}

/* ────────────── offline check-in ────────────── */

export function tryOfflineCheckIn(qrCode: string, now = Date.now()): OfflineCheckInResult {
  const cache = loadOfflineCache();
  const pending = loadPendingCheckIns();

  if (!cache) {
    return {
      status: "error",
      code: "NO_OFFLINE_DATA",
      message: "No offline data yet. Connect once to sync member data, then check-ins work without internet.",
    };
  }

  const member = findMemberByQr(cache, qrCode);
  if (!member) {
    return {
      status: "error",
      code: "MEMBER_NOT_FOUND",
      message: "No member found with this code",
    };
  }

  if (!member.isActive) {
    return {
      status: "error",
      code: "MEMBER_INACTIVE",
      message: `${member.firstName} ${member.lastName} is inactive`,
    };
  }

  const membership = findActiveMembership(cache, member._id, now);
  if (!membership) {
    const latest = findLatestMembership(cache, member._id);
    if (latest && latest.endDate < now && latest.status === "active") {
      return {
        status: "error",
        code: "MEMBERSHIP_EXPIRED",
        message: `${member.firstName} ${member.lastName}'s plan has expired. Renew now.`,
      };
    }
    return {
      status: "error",
      code: "NO_ACTIVE_MEMBERSHIP",
      message: `${member.firstName} ${member.lastName} has no active plan. Payment required.`,
    };
  }

  const date = toDateKey(now);
  const existing = cache.todayCheckIns.find(
    (checkIn) => checkIn.memberId === member._id && checkIn.date === date
  );
  if (existing) {
    return {
      status: "already_checked_in",
      member,
      membership,
      checkInTime: existing.timestamp,
    };
  }
  if (pending.some((item) => item.memberId === member._id && toDateKey(item.timestamp) === date)) {
    const queuedItem = pending.find((item) => item.memberId === member._id);
    return {
      status: "already_checked_in",
      member,
      membership,
      checkInTime: queuedItem?.timestamp,
    };
  }

  const item: PendingCheckIn = {
    clientId: createClientId(),
    qrCode: member.qrCode,
    memberId: member._id,
    timestamp: now,
  };
  pending.push(item);
  savePendingCheckIns(pending);

  cache.todayCheckIns.push({ memberId: member._id, timestamp: now, date });
  saveOfflineCache(cache);

  const daysRemaining = Math.ceil((membership.endDate - now) / (24 * 60 * 60 * 1000));

  return {
    status: "checked_in",
    member,
    membership,
    checkInTime: now,
    daysRemaining,
    queued: true,
    pending: true,
  };
}

/* ────────────── today's list (merged cache + pending) ────────────── */

export function getTodayCheckIns(): TodayCheckInItem[] {
  const cache = loadOfflineCache();
  const pending = loadPendingCheckIns();
  const byMember = new Map<string, TodayCheckInItem>();

  if (cache) {
    for (const checkIn of cache.todayCheckIns) {
      const member = cache.members.find((m) => m._id === checkIn.memberId);
      if (!member) continue;
      byMember.set(checkIn.memberId, {
        _id: `cached_${checkIn.memberId}_${checkIn.timestamp}`,
        timestamp: checkIn.timestamp,
        pending: false,
        member: {
          firstName: member.firstName,
          lastName: member.lastName,
          qrCode: member.qrCode,
        },
      });
    }
  }

  for (const item of pending) {
    const member = cache?.members.find((m) => m._id === item.memberId);
    if (!member) continue;
    byMember.set(item.memberId, {
      _id: `pending_${item.clientId}`,
      timestamp: item.timestamp,
      pending: true,
      member: {
        firstName: member.firstName,
        lastName: member.lastName,
        qrCode: member.qrCode,
      },
    });
  }

  return Array.from(byMember.values()).sort((a, b) => b.timestamp - a.timestamp);
}

/* ────────────── queue management for sync ────────────── */

export function removeResolvedPending(clientId: string): void {
  const pending = loadPendingCheckIns();
  savePendingCheckIns(pending.filter((item) => item.clientId !== clientId));
}
