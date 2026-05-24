import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const packageJson = JSON.parse(
  readFileSync(resolve(import.meta.dirname, "..", "package.json"), "utf8"),
);

describe("verification scripts", () => {
  it("keeps fast and release verification paths explicit", () => {
    expect(packageJson.scripts["verify:fast"]).toContain("npm run check:hygiene");
    expect(packageJson.scripts["verify:fast"]).toContain("npm run lint");
    expect(packageJson.scripts["verify:fast"]).toContain("npm run build");
    expect(packageJson.scripts.verify).toBe("npm run verify:fast");

    expect(packageJson.scripts["verify:release"]).toContain("npm run version:check");
    expect(packageJson.scripts["verify:release"]).toContain("npm audit --omit=dev");
    expect(packageJson.scripts["verify:release"]).toContain("cargo fmt --all -- --check");
    expect(packageJson.scripts["verify:release"]).toContain(
      "cargo clippy --all-targets -- -D warnings",
    );
  });
});
