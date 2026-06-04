# 维护约定

> [English version →](MAINTENANCE_EN.md)

本文记录 PayDance 的日常维护规则，方便维护者和贡献者快速判断：改配置、写日志、做发布前检查时，哪些事项必须同步处理。

## 配置迁移

- `src/lib/settings-migration.ts` 里的 `settingsSchemaVersion` 记录薪资配置结构版本。
- 新增持久化字段时，先补迁移测试，再改迁移逻辑。
- 旧配置不能阻塞应用启动；无法识别或不安全的值应回退到默认值。
- 窗口尺寸、迷你模式、透明度等窗口偏好，继续由 `src/lib/window-mode.ts` 维护兼容边界。
- 改 schema 时，同时检查 `src/composables/useSalarySettings.ts` 的读写键和保存校验。

## 诊断与日志

- 用户能看到的错误，应说明下一步该怎么做，例如重试、检查配置或重新打开应用。
- 维护者诊断信息可以留在 console 或本地日志里，但不要记录薪资、私有路径、密钥、邮箱等敏感数据。
- 新增日志时，优先记录失败阶段和安全的错误类别，不记录完整私密内容。

## 桌面发布前冒烟

每次 Windows 发布前，使用 `docs/desktop-smoke-checklist.md` 或英文版清单。记录至少包含：

- PayDance 版本号和 commit。
- Windows 版本。
- 显示器数量和 DPI 缩放。
- 失败项截图或说明。
- 是否验证托盘、迷你悬浮、置顶、自启动和更新入口。

## 发布链路

- `latest.json` 必须指向对应版本的 Windows EXE。
- `.sha256` 必须匹配实际 EXE 文件。
- `.sig` 是 Tauri updater 签名，不等于 Windows Authenticode 发布者签名。
- 接入 Authenticode 前，先确认成本、证书来源、续期方式和失败回滚路径。
