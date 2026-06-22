# Web Preview Demo Onboarding Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the Web Preview open directly into a seven-day demo dashboard while keeping the existing onboarding available from Settings.

**Architecture:** Seed a Web-only demo config through the existing browser settings adapter before settings load. Keep the shared desktop defaults untouched, and expose the existing onboarding through optional props/events that are enabled only by `WebPreviewShowcase`.

**Tech Stack:** Vue 3, TypeScript, Vitest, Vue Test Utils, Vite

---

### Task 1: Add Web Preview demo settings seeding

**Files:**
- Create: `src/web-preview/demo-config.ts`
- Create: `src/web-preview/demo-config.test.ts`
- Modify: `src/web-preview/useWebPreviewState.ts`

- [ ] **Step 1: Write failing tests**

Test that the demo config selects all seven workdays, leaves `defaultSalaryConfig` unchanged, seeds an empty adapter, and preserves an adapter with an existing config.

- [ ] **Step 2: Verify the tests fail**

Run: `npx vitest run src/web-preview/demo-config.test.ts`

Expected: FAIL because `demo-config.ts` does not exist.

- [ ] **Step 3: Implement the demo settings helper**

Create:

```ts
export const createWebPreviewDemoConfig = (): SalaryConfig => ({
  ...defaultSalaryConfig,
  workdays: [0, 1, 2, 3, 4, 5, 6],
});

export async function ensureWebPreviewDemoSettings(
  store: SettingsStoreAdapter,
): Promise<boolean> {
  const savedConfig = await store.get<Partial<SalaryConfig>>(
    settingsStoreKeys.config,
  );
  if (savedConfig !== undefined) return false;

  await store.set(settingsStoreKeys.config, createWebPreviewDemoConfig());
  await store.set(settingsStoreKeys.hasCompletedOnboarding, true);
  await store.save();
  return true;
}
```

Call `ensureWebPreviewDemoSettings(previewStore)` before `loadWindowPreferences()`.

- [ ] **Step 4: Verify the focused tests pass**

Run: `npx vitest run src/web-preview/demo-config.test.ts`

Expected: PASS.

### Task 2: Add the optional Settings onboarding action

**Files:**
- Modify: `src/i18n/types.ts`
- Modify: `src/i18n/locales/zh-CN.ts`
- Modify: `src/i18n/locales/en.ts`
- Modify: `src/components/SettingsPanel.vue`
- Modify: `src/components/SettingsPanel.test.ts`
- Modify: `src/components/SettingsPanel.behavior.test.ts`

- [ ] **Step 1: Write failing component tests**

Add a behavior test that mounts with `showOnboardingAction: true`, clicks `.onboarding-action-button`, and expects `openOnboarding`. Add a default-state assertion that the button is absent.

- [ ] **Step 2: Verify the component tests fail**

Run: `npx vitest run src/components/SettingsPanel.test.ts src/components/SettingsPanel.behavior.test.ts`

Expected: FAIL because the prop, event, copy, and button do not exist.

- [ ] **Step 3: Implement the optional action**

Add optional `showOnboardingAction`, default it to `false`, emit `openOnboarding`, and render a lightweight SettingsGroup before `SettingsAboutFooter`.

- [ ] **Step 4: Verify the focused component tests pass**

Run: `npx vitest run src/components/SettingsPanel.test.ts src/components/SettingsPanel.behavior.test.ts`

Expected: PASS.

### Task 3: Connect the action to Web Preview onboarding state

**Files:**
- Modify: `src/components/AppWindow.vue`
- Modify: `src/web-preview/useWebPreviewState.ts`
- Modify: `src/web-preview/components/WebPreviewShowcase.vue`
- Modify: `src/web-preview.test.ts`

- [ ] **Step 1: Write failing integration assertions**

Assert that Web Preview enables `show-onboarding-action`, handles `open-onboarding`, initializes demo settings, and exposes Web-only open/complete handlers.

- [ ] **Step 2: Verify the integration test fails**

Run: `npx vitest run src/web-preview.test.ts`

Expected: FAIL because the event chain is not connected.

- [ ] **Step 3: Implement the event chain**

Add optional AppWindow prop/event forwarding. In Web Preview state, maintain `isOnboardingOpen`, close Settings when opening, and wrap existing completion to close the overlay after persistence.

- [ ] **Step 4: Verify focused integration tests pass**

Run: `npx vitest run src/web-preview.test.ts`

Expected: PASS.

### Task 4: Verify and publish

**Files:**
- Verify all modified files.

- [ ] **Step 1: Run complete verification**

Run: `npm run verify:fast`

Expected: all lint, formatting, tests, desktop build, and Web build checks pass.

- [ ] **Step 2: Run visual QA**

Run: `npm run qa:web-preview`

Expected: DOM, console, accessibility, responsive screenshots, and visual comparisons pass.

- [ ] **Step 3: Inspect the final diff**

Run: `git diff --check` and `git status --short`.

Expected: no whitespace errors and only intended files staged.

- [ ] **Step 4: Commit and push**

Commit the feature files and documentation with a concise conventional commit, push `codex/web-preview-demo-onboarding`, and open a draft PR against `main`.

