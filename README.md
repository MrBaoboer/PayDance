# 薪跳 PayDance

<p align="center">
  <img src="src-tauri/icons/icon.png" alt="薪跳 PayDance" width="84">
</p>

<p align="center">
  <strong><font size="7">打工人的桌面实时工资看板</font></strong><br>
  <font size="5">看见每一秒的收入跳动</font>
</p>

<p align="center">
  <a href="https://masterbao66.github.io/PayDance/"><img src="https://img.shields.io/badge/在线体验-打开网页端-18181B?style=for-the-badge" alt="在线体验"></a>
  <a href="https://github.com/MasterBao66/PayDance/releases/latest/download/pay-dance.exe"><img src="https://img.shields.io/badge/下载-Windows%20便携版-EA8A00?style=for-the-badge" alt="下载 Windows 便携版"></a>
</p>

<p align="center">
  <sub>网页端用于快速了解界面与配置流程；完整桌面能力请使用 Windows 版。</sub>
</p>

<p align="center">
  <a href="https://github.com/MasterBao66/PayDance/actions/workflows/ci.yml"><img src="https://github.com/MasterBao66/PayDance/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <img src="https://img.shields.io/badge/platform-Windows%2011-0078D4" alt="Windows 11">
  <img src="https://img.shields.io/badge/built%20with-Tauri%202-24C8DB" alt="Built with Tauri 2">
  <a href="#隐私声明作者与许可"><img src="https://img.shields.io/badge/privacy-local%20first-18181B" alt="Local first privacy"></a>
</p>

## 产品简介与核心体验

薪跳 PayDance 是一款面向 Windows 11 的桌面实时工资看板。配置薪资与上下班时间后，它会把“今天已经挣了多少钱”放在桌面上，随着工作时间实时增长。

主窗口展示今日入账、工作进度、剩余时间和今日预计；迷你悬浮窗口只保留金额，适合放在屏幕角落随时查看。

## 产品预览

<p align="center">
  <img src="marketing-posters/poster-01-live-dashboard-v3.png" alt="薪跳 PayDance 实时收入看板" width="100%">
</p>

<p align="center">
  <strong>实时收入看板</strong><br>
  今日入账、工作进度、剩余时间和预计收入，一眼读懂。
</p>

<p align="center">
  <img src="marketing-posters/poster-02-three-step-setup-v3.png" alt="薪跳 PayDance 首次配置三步上手" width="100%">
</p>

<p align="center">
  <strong>首次配置，三步上手</strong><br>
  薪资模式、工作时间、使用偏好，一次设好后自动记住。
</p>

## 核心特性

- **实时收入跳动**：根据当前时间持续计算今日入账，金额精确到小数点后 2 位，让收入增长变得可见。
- **多薪资模式**：支持月薪、日薪、时薪，并自动换算日薪、时薪、分薪和秒薪。
- **真实时间建模**：支持每月工作天数、每周工作日、上下班时间、午休剔除和跨零点夜班。
- **迷你悬浮模式**：只显示核心金额，支持拖拽、双击恢复主窗口、默认置顶和 `10% - 100%` 透明度调节。
- **Windows 11 桌面体验**：无边框窗口、圆角、亮色/暗色主题、托盘常驻、窗口置顶和开机自启动。
- **本地优先隐私**：薪资与上下班时间配置保存在本机，不需要账号，不上传数据，不包含遥测。
- **在线体验入口**：Web Preview 可在浏览器中预览核心看板、首次配置和迷你悬浮手感。
- **发布可靠性**：Release 附带 SHA256 校验，CI 覆盖代码卫生、行为测试、桌面构建和 Web Preview 部署。

## 快速下载与安全校验

| 平台           | 推荐下载                                                                                        | 说明                           |
| -------------- | ----------------------------------------------------------------------------------------------- | ------------------------------ |
| 在线体验       | [PayDance Web Preview](https://masterbao66.github.io/PayDance/)                                 | 浏览器中预览核心看板与配置流程 |
| Windows 11     | [pay-dance.exe](https://github.com/MasterBao66/PayDance/releases/latest/download/pay-dance.exe) | 便携版，下载后直接运行         |
| GitHub Release | [最新正式版](https://github.com/MasterBao66/PayDance/releases/latest)                           | 查看更新说明、附件和校验文件   |
| 源码           | [MasterBao66/PayDance](https://github.com/MasterBao66/PayDance)                                 | Vue 3 + TypeScript + Tauri 2   |

Release 页面会同时提供 `pay-dance.exe` 与 `pay-dance.exe.sha256`。Windows 对未签名二进制可能展示发布者验证提示，建议以 GitHub Release 来源与 SHA256 校验作为下载后的完整性确认。

```powershell
Get-FileHash .\pay-dance.exe -Algorithm SHA256
Get-Content .\pay-dance.exe.sha256
```

若两者校验值一致，即可确认本地文件与 Release 附件匹配；若不一致，请不要运行该文件。

## 技术架构与工程质量

| 层级        | 技术与实践                                                                                                                                 |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| 桌面壳      | Tauri 2, Rust, Windows tray, frameless window                                                                                              |
| 前端        | Vue 3, TypeScript, Vite                                                                                                                    |
| Web Preview | Vite Web build, GitHub Pages, browser localStorage                                                                                         |
| UI          | Windows 11 风格、CSS Container Queries、@lucide/vue                                                                                        |
| 本地存储    | `@tauri-apps/plugin-store`，配置写入本机应用数据目录                                                                                       |
| 测试        | Vitest, @vue/test-utils, happy-dom, vue-tsc, cargo fmt, cargo clippy, cargo check                                                          |
| 工程治理    | 品牌与敏感信息扫描、版本一致性检查、GitHub Actions Release、[PRODUCT.md](PRODUCT.md)、[DESIGN.md](DESIGN.md)、[CHANGELOG.md](CHANGELOG.md) |

项目采用 Vue 3 + TypeScript + Tauri 2 架构，核心薪资逻辑、状态模型和大部分前端界面具备迁移潜力。当前正式验证 Windows 11，并提供 Web Preview 作为线上预览入口；下一阶段桌面端战略方向是迁移并验证 macOS 版本。迁移到其他平台时，托盘、置顶、透明窗口、迷你悬浮和系统材质仍需要按平台重新设计与验证。

## 开发者指南

安装依赖并启动本地开发：

```powershell
npm install
npm run tauri dev
```

启动 Web Preview：

```powershell
npm run dev:web
```

构建 Windows 便携版 exe：

```powershell
npm run build:exe
```

构建网页体验版：

```powershell
npm run build:web
```

重置本地配置，重新体验首次启动向导：

```powershell
Remove-Item "$env:APPDATA\com.masterbao.paydance\salary-settings.json" -ErrorAction SilentlyContinue
```

完整测试、代码卫生扫描、版本一致性检查与发布构建由 CI / Release workflow 自动执行。日常开发只需要关注核心启动与构建命令即可。

## 隐私声明、作者与许可

薪跳 PayDance 坚持本地优先：不需要登录账号，不上传薪资数据，不包含遥测、远程同步或在线账户体系。应用配置通过 Tauri Store 保存在本机应用数据目录中的 `salary-settings.json`，主要包括薪资、工作时间、主题、置顶状态、迷你悬浮透明度、金额变换模式和首次配置状态。

薪跳 PayDance 由 Mr.Baober 设计与开发。当前仓库采用保留权利许可，具体见 [LICENSE](LICENSE)。代码可用于审阅与学习；未经作者许可，请勿二次发布、商用分发或移除作者归属信息。

完整版本记录请查看 [CHANGELOG.md](CHANGELOG.md)，构建产物与校验文件请查看 [Releases](https://github.com/MasterBao66/PayDance/releases)。
