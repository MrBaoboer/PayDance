import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const styleSource = readFileSync(new URL("../style.css", import.meta.url), "utf8");

describe("global focus styles", () => {
  it("provides a visible keyboard focus ring for interactive controls", () => {
    expect(styleSource).toContain(":focus-visible");
    expect(styleSource).toContain("outline:");
    expect(styleSource).toContain("--income-accent");
  });
});
