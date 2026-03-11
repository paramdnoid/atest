import type { Device } from "@/components/dashboard/devices-panel";
import type { TeamMember } from "@/components/dashboard/team-members-panel";

type UnknownRecord = Record<string, unknown>;

function toRecord(value: unknown): UnknownRecord | null {
  return value !== null && typeof value === "object" ? (value as UnknownRecord) : null;
}

function toString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function toNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function toBoolean(value: unknown): boolean | null {
  return typeof value === "boolean" ? value : null;
}

export function parseDevicesResponse(data: unknown): Device[] {
  if (!Array.isArray(data)) return [];
  return data
    .map((item) => {
      const rec = toRecord(item);
      if (!rec) return null;
      const id = toString(rec.id);
      const name = toString(rec.name);
      const platform = toString(rec.platform);
      const status = toString(rec.status);
      const createdAt = toString(rec.createdAt);
      if (!id || !name || !platform || !status || !createdAt) return null;
      return {
        id,
        name,
        platform,
        status,
        createdAt,
        licensedAt: toString(rec.licensedAt),
        revokedAt: toString(rec.revokedAt),
        lastSeenAt: toString(rec.lastSeenAt),
      } satisfies Device;
    })
    .filter((item): item is Device => item !== null);
}

export function parseTeamSeatsResponse(data: unknown): TeamMember[] {
  const rec = toRecord(data);
  const seats = rec && Array.isArray(rec.seats) ? rec.seats : [];
  const result: TeamMember[] = [];
  for (const item of seats) {
    const seat = toRecord(item);
    if (!seat) continue;
    const userId = toString(seat.userId);
    const email = toString(seat.email);
    const role = toString(seat.role);
    const joinedAt = toString(seat.joinedAt);
    if (!userId || !email || !role || !joinedAt) continue;
    const seatStatus = toString(seat.seatStatus);
    result.push({
      userId,
      email,
      role,
      joinedAt,
      name: toString(seat.name),
      seatStatus: seatStatus === "ACTIVE" ? "ACTIVE" : "NONE",
    });
  }
  return result;
}

export function parseSeatSummaryResponse(data: unknown) {
  const rec = toRecord(data);
  if (!rec) {
    return { includedSeats: 0, usedSeats: 0, availableSeats: 0, overLimit: false };
  }
  return {
    includedSeats: toNumber(rec.includedSeats) ?? 0,
    usedSeats: toNumber(rec.usedSeats) ?? 0,
    availableSeats: toNumber(rec.availableSeats) ?? 0,
    overLimit: toBoolean(rec.overLimit) ?? false,
  };
}
