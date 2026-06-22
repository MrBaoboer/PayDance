# 设置页首次启动向导按钮对齐实现计划

> **面向 AI 代理的工作者：** 必需子技能：使用 superpowers:subagent-driven-development（推荐）或 superpowers:executing-plans 逐任务实现此计划。步骤使用复选框（`- [ ]`）语法来跟踪进度。

**目标：** 让 Web Preview 设置页的首次启动向导标题和按钮处于同一行，并使按钮右边缘与 GitHub 按钮一致。

**架构：** 使用 `SettingsGroup` 现有 `action` 插槽承载按钮，不增加新的布局组件。按钮通过复用 GitHub 区域的响应式列宽与按钮宽度表达式计算右侧留白，适配中英文和不同面板宽度。

**技术栈：** Vue 3、TypeScript、Scoped CSS、Vitest、Vue Test Utils、Playwright Web Preview QA

---

## 文件结构

- 修改 `src/components/SettingsPanel.vue`：将向导按钮移入 `SettingsGroup` 标题操作插槽。
- 修改 `src/components/settings/SettingsOnboardingAction.vue`：计算与 GitHub 按钮一致的右边缘偏移。
- 修改 `src/components/SettingsPanel.test.ts`：锁定插槽结构和偏移公式。
- 修改 `src/components/SettingsPanel.behavior.test.ts`：验证标题与按钮渲染在同一个标题行。
- 按视觉 QA 结果更新 `tests/visual-baselines/` 中受影响的设置面板基线（仅当工具报告预期差异时）。

### 任务 1：添加布局回归测试

**文件：**
- 修改：`src/components/SettingsPanel.test.ts`
- 修改：`src/components/SettingsPanel.behavior.test.ts`

- [ ] **步骤 1：编写失败的源码结构测试**

在 `offers the first-time setup only when the host enables it` 测试中断言向导组件位于操作插槽，并断言按钮包含与 GitHub 区域相同宽度公式计算出的 `margin-inline-end`：

```ts
expect(settingsPanelSource).toContain('<template #action>\n        <SettingsOnboardingAction');
expect(settingsOnboardingActionSource).toContain(
  "margin-inline-end: calc((clamp(92px, 20cqw, 112px) - clamp(92px, 20cqw, 108px)) / 2)",
);
```

- [ ] **步骤 2：编写失败的 DOM 结构测试**

在行为测试中挂载 Web Preview 配置，确认按钮父元素同时包含标题和 `group-title--split`：

```ts
const actionButton = wrapper.get(".onboarding-action-button");
const titleRow = actionButton.element.parentElement;

expect(titleRow?.classList.contains("group-title--split")).toBe(true);
expect(titleRow?.querySelector("strong")?.textContent).toContain("首次启动向导");
```

- [ ] **步骤 3：运行测试验证失败**

运行：

```bash
npx vitest run src/components/SettingsPanel.test.ts src/components/SettingsPanel.behavior.test.ts
```

预期：FAIL；旧模板把按钮放在默认插槽下一行，且按钮没有对齐偏移。

### 任务 2：实现标题行与右边缘对齐

**文件：**
- 修改：`src/components/SettingsPanel.vue`
- 修改：`src/components/settings/SettingsOnboardingAction.vue`

- [ ] **步骤 1：将按钮移入操作插槽**

```vue
<SettingsGroup v-if="showOnboardingAction" :title="t('settings.onboarding')">
  <template #action>
    <SettingsOnboardingAction @open="emit('openOnboarding')" />
  </template>
</SettingsGroup>
```

- [ ] **步骤 2：增加响应式右侧留白**

在 `.onboarding-action-button` 中加入：

```css
margin-inline-end: calc(
  (clamp(92px, 20cqw, 112px) - clamp(92px, 20cqw, 108px)) / 2
);
```

- [ ] **步骤 3：运行目标测试验证通过**

运行：

```bash
npx vitest run src/components/SettingsPanel.test.ts src/components/SettingsPanel.behavior.test.ts
```

预期：2 个测试文件全部 PASS。

### 任务 3：视觉与全量验证

**文件：**
- 可能修改：`tests/visual-baselines/` 中工具明确指出的设置面板基线

- [ ] **步骤 1：运行完整快速验证**

运行：

```bash
npm run verify:fast
```

预期：lint、格式、全部单元测试、桌面构建和 Web Preview 构建均通过。

- [ ] **步骤 2：运行 Web Preview 视觉 QA**

运行：

```bash
npm run qa:web-preview
```

预期：DOM、可访问性、控制台和视觉对比通过；若仅目标布局导致视觉基线变化，使用 `npm run qa:web-preview:update` 更新后重新运行验证。

- [ ] **步骤 3：浏览器验收**

打开本地 Web Preview 设置面板，验证标题与按钮在同一行，读取两按钮的 `getBoundingClientRect().right`，预期差值不超过 1px。

- [ ] **步骤 4：提交、推送和合并**

```bash
git add src/components/SettingsPanel.vue src/components/settings/SettingsOnboardingAction.vue src/components/SettingsPanel.test.ts src/components/SettingsPanel.behavior.test.ts docs/superpowers/plans/2026-06-23-align-settings-onboarding-action.md
git commit -m "fix: align settings onboarding action"
git push -u origin codex/align-settings-onboarding-action
```

创建 PR，等待 CI 与 CodeQL 成功后合并，随后验证 `main` 的 Web Preview 部署成功。
