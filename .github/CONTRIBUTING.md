# 参与贡献

> [English version →](../docs/CONTRIBUTING_EN.md)

感谢你关注薪跳 PayDance。这个项目刻意保持很小——它只想把"今天正在挣到的钱"安静、清楚地放在桌面上。提交 Issue 或 PR 前，请先了解下面的边界和流程。

## 开发环境

- **操作系统**：当前官方发布与验证基线是 Windows 11；Web Preview 可在浏览器中预览核心体验；平台适配贡献需附验证边界
- **运行时**：Node.js 22、Rust 最新稳定版
- **包管理器**：npm

## 快速开始

```powershell
npm install
npm run tauri dev # 桌面应用
npm run dev:web   # 浏览器 Web Preview
```

## 提交前验证

按改动范围选择验证命令。CI 会根据路径自动选择轻量或完整验证，但本地先跑一遍能省很多来回。

```powershell
npm run verify:metadata # 文档、法务、品牌、社区模板等轻量改动
npm run verify:fast     # lint、格式、测试、桌面构建、Web Preview 构建
npm run qa:web-preview  # Web Preview 视觉与 DOM/console 验证
```

涉及 Rust、发布或安全治理时，还应在 `src-tauri/` 下运行：

```powershell
cargo fmt --all -- --check
cargo check
cargo clippy --all-targets -- -D warnings
cargo audit --deny warnings
cargo deny check --hide-inclusion-graph
```

## 维护者推送工作流

维护者向 `main` 推送前使用：

```powershell
npm run push:main
```

该命令会对将要推送的文件做路径感知分类：

- **轻量路径**（`docs/**`、`legal/**`、`README*`、`CHANGELOG*` 等）：只运行版本一致性、品牌与密钥卫生、格式检查、仓库元数据测试和 `git diff --check`。
- **代码路径**（`src/**`、`src-tauri/**`、`package*.json`、`scripts/**`、`.github/workflows/**` 等）：自动升级为完整验证，追加 lint、测试、桌面构建、Web Preview 构建、`npm audit`、`cargo fmt/check/clippy/audit/deny`。

只想跑验证不推送：`npm run verify:push`

> 注意：不要并行运行 `npm run build:desktop` 与 `npm run build:web`，两者会写入同一个 `dist/` 目录。

安全审计步骤需要本地安装：

```powershell
cargo install cargo-audit --locked
cargo install cargo-deny --version 0.19.8 --locked
gh auth login
```

## 我们欢迎

所有贡献都应符合 [PRODUCT.md](../docs/PRODUCT.md) 中记录的产品边界。

- 附带复现步骤的 Bug 修复
- 桌面端可靠性改进：窗口管理、托盘、自启动、单实例
- Windows 11 UI 打磨：主题、无障碍、DPI、多显示器
- 平台适配提案：需说明目标系统、构建方式和验证范围
- 薪资计时器的性能和边界优化
- 时钟变化、配置迁移、夜班等边界场景测试
- 中英文文案、文档、发布流程和社区模板改进

第一次参与建议优先选择带有 `good first issue` 或 `help wanted` 标签的议题。这些议题应当范围小、风险低，并说明验证方式。

## 我们不接受

薪跳 PayDance 不是时间追踪、个人财务、薪酬系统、考勤系统或任务管理工具。以下方向当前不在产品边界内，相关 PR 请先开 Issue 讨论：

- 快捷键或热键系统
- 提醒、通知或弹窗
- 分段历史时间轴、图表或趋势分析
- 云端同步、账号系统或在线服务
- 任何默认把数据发送到设备外部的功能

这些边界是为了让产品保持轻、稳、可信。如果不确定某项功能是否合适，先开 Issue 聊聊。

## PR 规范

1. **一个 PR 只做一件事。** 不要把 Bug 修复、重构和文档整理混在一起。
2. **写测试。** 新行为必须有测试覆盖；Bug 修复应包含回归测试。
3. **遵循现有代码风格。** 代码库已有成熟模式，优先沿用。
4. **更新 CHANGELOG.md**（在 `## Unreleased` 区段下），纯内部验证或文档微调可说明不适用。
5. **UI 改动必须附截图**，至少覆盖浅色/深色和中文/英文。
6. **平台适配必须说明验证边界**，包括目标系统、构建命令、人工冒烟项、更新端点和品牌区分方式。
7. **使用约定式提交**：`feat:`、`fix:`、`docs:`、`test:`、`chore:`、`refactor:`。

## 国际化

所有面向用户的文案必须同时出现在 `src/i18n/locales/zh-CN.ts` 和 `src/i18n/locales/en.ts` 中，并在 `src/i18n/types.ts` 中定义类型。不要在 Vue 组件或 TypeScript 中硬编码中英文文案。

## 版本管理

薪跳 PayDance 遵循[语义化版本](https://semver.org/lang/zh-CN/)。版本号由项目作者管理，请勿在 PR 中自行提升版本号。

## 许可

本项目代码采用 [AGPL-3.0-only](../LICENSE) 发布，另有 [AGPL 第 7 条附加条款](../legal/ADDITIONAL_TERMS.md)。

提交代码贡献即表示你确认：

- 你有权提交该代码，且贡献为你的原创作品（或已获得必要授权）；
- 你同意你的贡献以 AGPL-3.0-only 及本项目附加条款并入项目；
- 提交时包含 `Signed-off-by:` 行（DCO），确认你的贡献来源合法。

> 当前项目为单人开发。普通贡献默认按上述开源授权进入项目；如果维护者需要将某项贡献纳入商业授权、OEM 或白标授权范围，会在合并前另行要求贡献者明确签署 [贡献者许可协议（CLA）](../legal/CLA.md)。仅提 Issue、建议或安全报告无需签署 CLA。

详见 `LICENSE`、`legal/ADDITIONAL_TERMS.md`、`legal/TRADEMARK.md` 和 `legal/BRAND-ASSETS.md`。

## 维护与治理

- 行为准则：[CODE_OF_CONDUCT.md](../CODE_OF_CONDUCT.md)
- 维护者说明：[MAINTAINERS.md](../MAINTAINERS.md)
- 治理说明：[GOVERNANCE.md](../GOVERNANCE.md)
- 维护约定：[docs/MAINTENANCE.md](../docs/MAINTENANCE.md)
