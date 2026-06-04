# 维护约定

> [English version →](MAINTENANCE_EN.md)

本文记录薪跳 PayDance 的长期维护约定，避免关键流程只留在聊天记录或单次审计里。

## Settings Migration Convention

- `src/lib/settings-migration.ts` 中的 `settingsSchemaVersion` 是薪资配置迁移版本号。
- 新增持久化字段时，先写迁移测试，再修改迁移逻辑。
- 迁移必须保留旧用户可用性：无法识别的字段回退到安全默认值，不应阻塞应用启动。
- 窗口尺寸、迷你模式、透明度等窗口偏好继续由 `src/lib/window-mode.ts` 维护自己的兼容边界。
- 修改 schema 时，同步检查 `src/composables/useSalarySettings.ts` 的读写键和保存校验。

## Diagnostics Convention

- 面向用户的错误应说明可恢复动作，例如重试、检查配置或重新打开应用。
- 面向维护者的诊断应保留在 console 或本地日志语境中，避免暴露薪资、路径、密钥、邮箱等敏感信息。
- 新增错误日志时，优先记录失败阶段和安全的错误类别，不记录完整私密数据。

## Desktop Smoke Records

每次 Windows 发布前使用 `docs/desktop-smoke-checklist.md` 或英文版清单。记录至少包含：

- PayDance 版本号和 commit。
- Windows 版本。
- 显示器数量和 DPI 缩放。
- 失败项截图或说明。
- 是否验证托盘、迷你悬浮、置顶、自启动和更新入口。

## Release Chain

- `latest.json` 必须指向版本化 Windows EXE。
- `.sha256` 必须匹配实际 EXE。
- `.sig` 是 Tauri updater 签名，不等同于 Windows Authenticode 发布者签名。
- 在没有可用的免费公开信任代码签名路径前，不强行把 Authenticode 接入 release workflow。
