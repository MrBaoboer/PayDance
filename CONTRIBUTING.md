# 参与贡献

感谢你的关注！薪跳 PayDance 是一款聚焦的桌面工具——提交前请阅读以下指引。

## 开发环境

- **操作系统**：Windows 11（主要目标平台；Web Preview 可跨平台）
- **运行时**：Node.js 22、Rust（最新稳定版）
- **包管理器**：npm

## 快速开始

```powershell
npm install
npm run tauri dev       # 桌面应用
npm run dev:web         # 浏览器 Web Preview
```

## 提交前必做

在本地运行以下命令。CI 也会运行它们，未通过的 PR 不会被合并。

```powershell
npm test                # 全部单元/组件测试
npm run lint            # ESLint
npm run format:check    # Prettier
npm run check:hygiene   # 品牌 + 密钥卫生
npm run build:desktop   # 类型检查 + Vite 构建
npm run build:web       # Web Preview 构建
cargo fmt --all -- --check        # （在 src-tauri/ 中执行）
cargo clippy --all-targets -- -D warnings
```

## 我们接受

薪跳 PayDance 是一款**桌面实时工资看板**。所有贡献必须符合 `PRODUCT.md` 中记载的产品边界。

**欢迎：**
- 附带复现步骤的 Bug 修复
- 桌面端可靠性改进（窗口管理、托盘、自启动）
- Windows 11 UI 打磨（主题、无障碍、DPI）
- 薪资计时器的性能优化
- 边界场景测试覆盖（时钟变化、配置迁移、夜班）
- 中英文 i18n 勘误

## 我们不接受

薪跳 PayDance 不是：
- 时间追踪或工时统计工具
- 个人财务管理工具
- 薪酬或人力资源系统
- 任务或项目管理应用

**以下贡献不会被合并：**
- 快捷键或热键系统
- 提醒、通知或弹窗
- 分段历史时间轴或图表
- 云端同步、账号系统或在线服务
- 任何将数据发送到设备外部的功能

这些边界保持 PayDance 简单且可维护。如果不确定某项功能是否符合，请先开 Issue 讨论。

## PR 规范

1. **一个 PR 只做一件事。** 不要将 Bug 修复和重构混在一起。
2. **写测试。** 新行为必须有测试覆盖。Bug 修复应包含回归测试。
3. **遵循现有代码风格。** 代码库已有成熟的模式——与之保持一致。
4. **更新 CHANGELOG.md**（在 `## Unreleased` 区段下）。
5. **UI 改动必须附截图**（浅色 + 深色、中文 + 英文）。
6. **使用约定式提交：** `feat:`、`fix:`、`docs:`、`test:`、`chore:`、`refactor:`。

## 国际化

所有面向用户的文案必须同时出现在 `src/i18n/locales/zh-CN.ts` 和 `src/i18n/locales/en.ts` 中，并在 `src/i18n/types.ts` 中定义类型。禁止在 Vue 组件或 TypeScript 中硬编码中英文文案。

## 版本管理

薪跳 PayDance 遵循[语义化版本](https://semver.org/lang/zh-CN/)。版本号由项目作者管理。请勿在 PR 中自行提升版本号。

## 许可

本项目代码采用 [AGPL-3.0-only](LICENSE) 发布，另有 [AGPL 第 7 条附加条款](ADDITIONAL_TERMS.md)。

提交代码贡献即表示你确认：

- 你有权提交该代码，且贡献为你的原创作品（或已获得必要授权）；
- 你接受 [贡献者许可协议（CLA）](CLA.md) 的条款；
- 提交时包含 `Signed-off-by:` 行（DCO），确认你的贡献来源合法。

> 当前项目为单人开发。CLA 文本已就位，外部 PR 合并前将启用签署流程。仅提 Issue 或建议无需签署 CLA。

详见 `LICENSE`、`ADDITIONAL_TERMS.md` 和 `TRADEMARK.md`。

> [English version of this Contributing Guide →](CONTRIBUTING_EN.md)
