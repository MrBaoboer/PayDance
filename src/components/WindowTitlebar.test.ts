import { describe, expect, it } from "vitest";
import windowTitlebarSource from "./WindowTitlebar.vue?raw";

describe("window titlebar", () => {
  it("keeps the status chip visually centered with the window action buttons", () => {
    expect(windowTitlebarSource).toContain(".status-chip");
    expect(windowTitlebarSource).toContain("height: clamp(30px, 7.2cqw, 36px)");
    expect(windowTitlebarSource).toContain("line-height: 1");
    expect(windowTitlebarSource).toContain(".status-chip span:last-child");
  });
});
