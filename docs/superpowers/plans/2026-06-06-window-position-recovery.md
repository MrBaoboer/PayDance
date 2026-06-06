# Window Position Recovery Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keep full and mini window positions independent and restore them safely across multiple monitors and DPI scales.

**Architecture:** Persist Tauri physical coordinates for both modes because `outerPosition`, monitor work areas, and `PhysicalPosition` use the same unit. Resolve visibility against every monitor work area, converting the logical window size and margin with that monitor's scale factor. Mode transitions capture the outgoing position, resize the window, and then restore the incoming mode's position.

**Tech Stack:** Vue 3 refs/composables, TypeScript, Tauri 2 window API, Vitest.

---

### Task 1: Make visibility resolution multi-monitor and DPI aware

**Files:**

- Modify: `src/lib/window-mode.ts`
- Test: `src/lib/window-mode.test.ts`

- [x] Add failing tests for a left-side secondary monitor, 150% DPI clamping, taskbar work areas, and a disconnected-monitor fallback.
- [x] Run `npx vitest run src/lib/window-mode.test.ts` and confirm the new expectations fail.
- [x] Add monitor scale factors and select the work area that contains or overlaps the saved physical window rectangle.
- [x] Convert logical window size and restore margin to physical pixels before clamping.
- [x] Re-run the focused test file and confirm it passes.

### Task 2: Isolate positions by window mode

**Files:**

- Modify: `src/composables/useWindowPositionRecovery.ts`
- Create: `src/composables/useWindowPositionRecovery.test.ts`

- [x] Add failing tests proving mini movement never changes the main position and each mode restores its own position with `PhysicalPosition`.
- [x] Run `npx vitest run src/composables/useWindowPositionRecovery.test.ts` and confirm the tests fail for the missing behavior.
- [x] Accept both position refs, expose a mode-aware position recorder, and restore the active mode's saved position.
- [x] Re-run the focused test file and confirm it passes.

### Task 3: Restore positions during mode transitions

**Files:**

- Modify: `src/composables/useAppShell.ts`
- Modify: `src/DesktopApp.vue`
- Create: `src/composables/useAppShell.test.ts`
- Modify: `src/AppChrome.test.ts`

- [x] Add failing tests proving a transition captures the outgoing position, resizes, then restores the destination mode.
- [x] Run the focused tests and confirm the transition expectation fails.
- [x] Inject the capture and restore operations into `useAppShell`, and use the position event payload for normal movement persistence.
- [x] Run all focused window tests.

### Task 4: Verify the complete change

**Files:**

- Modify only if verification exposes a defect.

- [x] Run `npm run verify:fast`.
- [x] Run `cargo fmt --check`, `cargo check`, and `cargo clippy --all-targets -- -D warnings` in `src-tauri`.
- [x] Run `git diff --check` and inspect the final diff for unrelated changes.
