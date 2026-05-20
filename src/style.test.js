import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const styleSource = readFileSync(resolve(import.meta.dirname, "style.css"), "utf8");

describe("global style tokens", () => {
  it("uses a dedicated Fluent-friendly font stack for dashboard metrics", () => {
    expect(styleSource).toContain("--font-dashboard");
    expect(styleSource).toContain('"Segoe UI Variable Display"');
    expect(styleSource).toContain('"Bahnschrift"');
  });
});
