import { describe, it, expect, beforeEach } from "vitest";
import type { Id } from "../../convex/_generated/dataModel";
import {
    toDateKey,
    saveOfflineCache,
    loadOfflineCache,
    clearOfflineCache,
    savePendingCheckIns,
    loadPendingCheckIns,
    tryOfflineCheckIn,
    getTodayCheckIns,
    getCacheSyncedAt,
    getPendingCount,
    removeResolvedPending,
    type OfflineCache,
} from "./offlineCheckIn";

const memberId = "mem_1" as Id<"members">;
const gymId = "gym_1" as Id<"gyms">;

function makeCache(overrides: Partial<OfflineCache> = {}): OfflineCache {
    return {
        syncedAt: 1000,
        members: [
            {
                _id: memberId,
                qrCode: "MEM-AAA",
                firstName: "John",
                lastName: "Doe",
                isActive: true,
                gymId,
            },
            {
                _id: "mem_2" as Id<"members">,
                qrCode: "MEM-BBB",
                firstName: "Jane",
                lastName: "Smith",
                isActive: false,
                gymId,
            },
        ],
        memberships: [
            {
                _id: "m1" as Id<"memberships">,
                memberId,
                planName: "Monthly",
                startDate: 1000,
                endDate: Date.now() + 30 * 24 * 60 * 60 * 1000,
                status: "active",
            },
        ],
        todayCheckIns: [],
        ...overrides,
    };
}

describe("offlineCheckIn", () => {
    beforeEach(() => {
        localStorage.clear();
    });

    describe("toDateKey", () => {
        it("returns YYYY-MM-DD for a timestamp", () => {
            const ts = new Date("2026-07-31T18:00:00Z").getTime();
            expect(toDateKey(ts)).toBe("2026-07-31");
        });
    });

    describe("tryOfflineCheckIn", () => {
        it("returns NO_OFFLINE_DATA when no cache exists", () => {
            const res = tryOfflineCheckIn("MEM-AAA");
            expect(res.status).toBe("error");
            expect(res.code).toBe("NO_OFFLINE_DATA");
        });

        it("returns MEMBER_NOT_FOUND for an unknown code", () => {
            saveOfflineCache(makeCache());
            const res = tryOfflineCheckIn("MEM-UNKNOWN");
            expect(res.status).toBe("error");
            expect(res.code).toBe("MEMBER_NOT_FOUND");
        });

        it("matches QR codes case-insensitively", () => {
            saveOfflineCache(makeCache());
            const res = tryOfflineCheckIn("mem-aaa");
            expect(res.status).toBe("checked_in");
        });

        it("returns MEMBER_INACTIVE for inactive members", () => {
            saveOfflineCache(makeCache());
            const res = tryOfflineCheckIn("MEM-BBB");
            expect(res.status).toBe("error");
            expect(res.code).toBe("MEMBER_INACTIVE");
        });

        it("returns NO_ACTIVE_MEMBERSHIP when member has no plan", () => {
            saveOfflineCache(makeCache({ memberships: [] }));
            const res = tryOfflineCheckIn("MEM-AAA");
            expect(res.status).toBe("error");
            expect(res.code).toBe("NO_ACTIVE_MEMBERSHIP");
        });

        it("returns MEMBERSHIP_EXPIRED when the active plan has lapsed", () => {
            saveOfflineCache(
                makeCache({
                    memberships: [
                        {
                            _id: "m1" as Id<"memberships">,
                            memberId,
                            planName: "Monthly",
                            startDate: 1000,
                            endDate: Date.now() - 1000,
                            status: "active",
                        },
                    ],
                })
            );
            const res = tryOfflineCheckIn("MEM-AAA");
            expect(res.status).toBe("error");
            expect(res.code).toBe("MEMBERSHIP_EXPIRED");
        });

        it("records a valid check-in to the pending queue", () => {
            saveOfflineCache(makeCache());
            const now = Date.now();

            const res = tryOfflineCheckIn("MEM-AAA", now);

            expect(res.status).toBe("checked_in");
            expect(res.queued).toBe(true);
            expect(res.pending).toBe(true);
            expect(res.member?.firstName).toBe("John");
            expect(res.membership?.planName).toBe("Monthly");

            const pending = loadPendingCheckIns();
            expect(pending).toHaveLength(1);
            expect(pending[0].qrCode).toBe("MEM-AAA");
            expect(pending[0].timestamp).toBe(now);

            const cache = loadOfflineCache();
            expect(cache?.todayCheckIns).toHaveLength(1);
            expect(cache?.todayCheckIns[0].memberId).toBe(memberId);

            const today = getTodayCheckIns();
            expect(today).toHaveLength(1);
            expect(today[0].pending).toBe(true);
            expect(today[0].member.firstName).toBe("John");
        });

        it("returns already_checked_in for a duplicate scan the same day", () => {
            saveOfflineCache(makeCache());
            tryOfflineCheckIn("MEM-AAA");

            const res = tryOfflineCheckIn("MEM-AAA");
            expect(res.status).toBe("already_checked_in");

            const pending = loadPendingCheckIns();
            expect(pending).toHaveLength(1);
        });
    });

    describe("getPendingCount / removeResolvedPending", () => {
        it("reports the number of queued check-ins", () => {
            savePendingCheckIns([
                {
                    clientId: "c1",
                    qrCode: "MEM-AAA",
                    memberId,
                    timestamp: Date.now(),
                },
                {
                    clientId: "c2",
                    qrCode: "MEM-BBB",
                    memberId: "mem_2" as Id<"members">,
                    timestamp: Date.now(),
                },
            ]);
            expect(getPendingCount()).toBe(2);
        });

        it("removes a resolved check-in by clientId", () => {
            savePendingCheckIns([
                {
                    clientId: "c1",
                    qrCode: "MEM-AAA",
                    memberId,
                    timestamp: Date.now(),
                },
            ]);
            removeResolvedPending("c1");
            expect(getPendingCount()).toBe(0);
        });
    });

    describe("cache sync metadata", () => {
        it("tracks when the cache was last synced", () => {
            saveOfflineCache(makeCache({ syncedAt: 123456 }));
            expect(getCacheSyncedAt()).toBe(123456);
        });

        it("returns null when no cache exists", () => {
            clearOfflineCache();
            expect(getCacheSyncedAt()).toBeNull();
        });
    });
});
