import { describe, expect, it } from "vitest";
import { parsePdfDate } from "./pdfDate";

describe("parsePdfDate", () => {
  it("parses standard PDF dates", () => {
    const parsed = parsePdfDate("D:20260401101500+05'30'");
    expect(parsed?.isValid).toBe(true);
    expect(parsed?.isUnusualFormat).toBe(false);
    expect(parsed?.date?.toISOString()).toBe("2026-04-01T04:45:00.000Z");
  });

  it("accepts normalized ISO report dates", () => {
    const parsed = parsePdfDate("2026-04-01T10:15:00Z");
    expect(parsed?.isValid).toBe(true);
    expect(parsed?.isUnusualFormat).toBe(false);
  });

  it("flags invalid dates", () => {
    const parsed = parsePdfDate("D:20269999101500");
    expect(parsed?.isValid).toBe(false);
  });
});
