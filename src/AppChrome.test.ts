import { describe, expect, it } from "vitest";
import appSource from "./App.vue?raw";

describe("app chrome", () => {
  it("suppresses the unused webview context menu on full and mini windows", () => {
    expect(appSource).toContain("@contextmenu.prevent");
  });

  it("keeps sheets draggable while their interactive controls remain usable", () => {
    expect(appSource).toContain("@mousedown.left=\"startDrag\"");
    expect(appSource).toContain("@mousedown.left.stop");
    expect(appSource).toContain("settings-sheet__header");
  });

  it("uses a calmer, more opaque first-run panel backdrop", () => {
    expect(appSource).toContain("--onboarding-panel: rgb(255 255 255 / 0.98)");
    expect(appSource).toContain("--onboarding-panel: rgb(24 24 27 / 0.96)");
  });

  it("splits salary detail money symbols for precise optical spacing", () => {
    expect(appSource).toContain("salary-info-money__symbol");
    expect(appSource).toContain("salary-info-money__value");
    expect(appSource).toContain("margin-right: 0.1em");
  });

  it("compresses the salary detail sheet in very short windows", () => {
    expect(appSource).toContain("@container (max-height: 430px)");
    expect(appSource).toContain(".salary-info-grid");
  });
});
