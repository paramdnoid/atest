import { describe, expect, it } from "vitest";

import {
  parseDevicesResponse,
  parseSeatSummaryResponse,
  parseTeamSeatsResponse,
} from "@/lib/dashboard/license-parsers";

describe("license parsers", () => {
  it("parst Team-Sitze robust und normalisiert seatStatus", () => {
    const result = parseTeamSeatsResponse({
      seats: [
        {
          userId: "u1",
          email: "a@example.com",
          role: "member",
          joinedAt: "2026-01-01T00:00:00Z",
          seatStatus: "ACTIVE",
        },
        {
          userId: "u2",
          email: "b@example.com",
          role: "member",
          joinedAt: "2026-01-01T00:00:00Z",
          seatStatus: "BROKEN",
        },
        { invalid: true },
      ],
    });

    expect(result).toHaveLength(2);
    expect(result[0].seatStatus).toBe("ACTIVE");
    expect(result[1].seatStatus).toBe("NONE");
  });

  it("liefert sichere Defaults fuer Seat-Summary", () => {
    expect(parseSeatSummaryResponse(null)).toEqual({
      includedSeats: 0,
      usedSeats: 0,
      availableSeats: 0,
      overLimit: false,
    });

    expect(
      parseSeatSummaryResponse({
        includedSeats: 10,
        usedSeats: "5",
        availableSeats: 5,
        overLimit: "no",
      }),
    ).toEqual({
      includedSeats: 10,
      usedSeats: 0,
      availableSeats: 5,
      overLimit: false,
    });
  });

  it("filtert ungueltige Devices", () => {
    const result = parseDevicesResponse([
      {
        id: "d1",
        name: "iPad",
        platform: "ios",
        status: "licensed",
        createdAt: "2026-01-01T00:00:00Z",
      },
      {
        id: 123,
        name: "Broken",
      },
    ]);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("d1");
  });
});
