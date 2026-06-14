# 设置按项自修复实现计划

> **面向 AI 代理的工作者：** 必需子技能：使用 superpowers:subagent-driven-development（推荐）或 superpowers:executing-plans 逐任务实现此计划。步骤使用复选框（`- [ ]`）语法来跟踪进度。

**目标：** 将设置恢复改为静默按项修复，并发布为 PayDance v0.9.6。

**架构：** `settings-migration` 负责识别损坏字段并生成最小修复结果；`useSalarySettings` 负责在加载后立即写回；视图层只展示可操作的保存失败，不感知恢复过程。

**技术栈：** Vue 3、TypeScript、Vitest、Tauri 2、GitHub Actions

---

### 任务 1：锁定恢复规则

**文件：**
- 修改：`src/lib/settings-migration.test.ts`
- 修改：`src/composables/useSalarySettings.test.ts`
- 修改：`src/components/SettingsPanel.test.ts`
- 修改：`src/components/OnboardingPanel.test.ts`

- [ ] 编写失败测试，覆盖单项保留、最小关联组、未来版本字段保留、修复后写回和无黄条。
- [ ] 运行 `npx vitest run src/lib/settings-migration.test.ts src/composables/useSalarySettings.test.ts src/components/SettingsPanel.test.ts src/components/OnboardingPanel.test.ts`，确认测试因旧行为失败。

### 任务 2：实现静默自修复

**文件：**
- 修改：`src/lib/settings-migration.ts`
- 修改：`src/composables/useSalarySettings.ts`
- 修改：`src/DesktopApp.vue`
- 修改：`src/components/AppWindow.vue`
- 修改：`src/components/SettingsPanel.vue`
- 修改：`src/components/OnboardingPanel.vue`
- 修改：`src/web-preview/useWebPreviewState.ts`
- 修改：`src/web-preview/components/WebPreviewShowcase.vue`
- 修改：`src/i18n/types.ts`
- 修改：`src/i18n/locales/zh-CN.ts`
- 修改：`src/i18n/locales/en.ts`

- [ ] 让迁移层只恢复错误项或最小关联组。
- [ ] 让加载层立即保存修复后的配置和当前版本号。
- [ ] 删除恢复提示的属性传递、自动打开行为、文案和样式。
- [ ] 重新运行任务 1 的测试并确认全部通过。

### 任务 3：发布收口

**文件：**
- 修改：`CHANGELOG.md`
- 修改：`CHANGELOG_EN.md`
- 修改：`docs/MAINTENANCE.md`
- 修改：`docs/MAINTENANCE_EN.md`
- 修改：`docs/ROADMAP.md`
- 修改：`docs/ROADMAP_EN.md`
- 修改：`package.json`
- 修改：`package-lock.json`
- 修改：`src-tauri/Cargo.toml`
- 修改：`src-tauri/Cargo.lock`
- 修改：`src-tauri/tauri.conf.json`

- [ ] 同步中英文说明并将版本提升到 `0.9.6`。
- [ ] 运行仓库快速验证、元数据验证、Web Preview QA、Rust 检查和发布检查。
- [ ] 提交并推送 `main`，等待 CI 成功。
- [ ] 创建并推送 `v0.9.6` 标签，等待 Release 与发布后冒烟成功。
