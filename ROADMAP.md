# 路线图

本文件记录薪跳 PayDance 的开发方向。不承诺发布时间，仅供了解当前焦点。

## 当前

- 补齐自动更新系统（真实签名、NSIS 安装包、`latest.json` 清单）
- 窗口位置记忆与多显示器恢复
- 系统时间校准策略（休眠恢复、时区切换、跨天）
- 配置迁移显式版本链
- 首次启动向导示例感知（实时预览）

## 接下来

- Authenticode 代码签名（减少 SmartScreen 警告）
- 迷你窗口右键菜单（透明度、重置位置、恢复主窗口）
- 发布后资产烟雾测试自动化
- 供应链安全加固（cargo audit、gitleaks、Actions SHA 固定）
- SBOM 生成

## 以后

- 英文官网入口（`/en/` + `hreflang`）
- Playwright 截图回归
- 可访问性自动检查（axe-core）
- Windows 原生集成烟雾测试
- 社区贡献任务标签

## 永不做

以下功能明确排除，不接受相关 PR：

- 快捷键/热键
- 提醒/通知/弹窗
- 历史时间轴/图表/趋势
- 打卡/考勤/工时统计
- 云端同步/账号/在线服务
- 多币种
- 番茄钟或生产力功能

详见 `PRODUCT.md` 与 `CONTRIBUTING.md`。

> [English version of this Roadmap →](ROADMAP_EN.md)
