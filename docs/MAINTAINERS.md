# 维护者说明

> [English version →](MAINTAINERS_EN.md)

PayDance 目前由单人维护。

## 当前维护者

- Mr.Baoboer / MasterBao66
- GitHub 主页：<https://github.com/MasterBao66>

## 响应优先级

- 安全问题：按 [安全策略](../.github/SECURITY.md) 处理。
- 可复现 Bug：优先于普通功能建议。
- PR：优先看范围清楚、验证完整、符合 [产品边界](PRODUCT.md) 的改动。
- 第一次贡献：建议从 `good first issue` 或 `help wanted` 开始。

这里不承诺固定响应时间。项目是个人维护，优先保证回复质量和发布质量。

## 合并标准

- 一个 PR 只解决一个主要问题。
- 用户可见行为需要测试，或写清楚人工冒烟路径。
- UI 改动需要截图，至少覆盖中文/英文和浅色/深色。
- 发布链路、更新器、安全、法律和品牌相关改动，即使测试通过，也必须由维护者确认。

## 发布节奏

PayDance 不设固定发版周期。积累到一组完整、验证充分的改动后，再发布新版本。

发布前至少需要通过 CI、Web Preview QA、桌面人工冒烟和发布元数据检查。
