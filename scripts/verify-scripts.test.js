import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const packageJson = JSON.parse(
  readFileSync(resolve(import.meta.dirname, "..", "package.json"), "utf8"),
);
const readRoot = (path) =>
  readFileSync(resolve(import.meta.dirname, "..", path), "utf8");

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

  it("codifies Web Preview QA through the Codex Playwright workflow", () => {
    expect(packageJson.scripts["qa:web-preview"]).toBe(
      "node scripts/qa-web-preview.mjs",
    );

    const qaScript = readRoot("scripts/qa-web-preview.mjs");
    expect(qaScript).toContain("playwright");
    expect(qaScript).toContain("desktop");
    expect(qaScript).toContain("medium");
    expect(qaScript).toContain("mobile");
    expect(qaScript).toContain("1440");
    expect(qaScript).toContain("960");
    expect(qaScript).toContain("390");
    expect(qaScript).toContain("console");
    expect(qaScript).toContain("Web Preview");
    expect(qaScript).toContain("paydance-web-preview-qa-");

    const qaGuide = readRoot("docs/web-preview-qa.md");
    expect(qaGuide).toContain("本地服务 + 内置 Playwright + 多视口截图 + DOM/console 双校验");
    expect(qaGuide).toContain("不要使用 headless Chrome/CDP/CLI screenshot");
    expect(qaGuide).toContain("C:\\Users\\mrbao\\AppData\\Local\\Temp\\paydance-web-preview-qa-{version}");
  });
});
