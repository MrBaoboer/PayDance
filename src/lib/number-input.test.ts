import { describe, expect, it } from "vitest";
import { parseNumberInput } from "./number-input";

describe("number input parsing", () => {
  it("keeps empty drafts unset instead of coercing them to zero", () => {
    expect(parseNumberInput("")).toBeNull();
    expect(parseNumberInput("   ")).toBeNull();
  });

  it("accepts finite number drafts", () => {
    expect(parseNumberInput("8000")).toBe(8000);
    expect(parseNumberInput("22.5")).toBe(22.5);
  });

  it("rejects invalid number drafts", () => {
    expect(parseNumberInput("abc")).toBeNull();
    expect(parseNumberInput("Infinity")).toBeNull();
  });
});
