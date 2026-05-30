
<p align="center">
  <img src="src-tauri/icons/icon.png" alt="薪跳 PayDance" width="88"><br>
  <strong><font size="7">薪跳 PayDance</font></strong>
</p>

<p align="center">
  <strong><font size="6">桌面实时工资看板</font></strong>
</p>

<p align="center">
  <font size="5"><strong><a href="https://masterbao66.github.io/PayDance/">在线体验</a></strong></font>
  &nbsp;&nbsp;&nbsp;
  <font size="5"><strong><a href="https://github.com/MasterBao66/PayDance/releases/latest/download/pay-dance-v0.9.0-windows-x64.exe">Windows 桌面端</a></strong></font>
  &nbsp;&nbsp;&nbsp;
  <a href="README_EN.md"><strong>English</strong></a>
</p>

## 产品简介

薪跳 PayDance 是一款面向 Windows 11 的桌面实时工资看板。配置薪资与上下班时间后，它会把今日入账放在桌面上，随着工作时间实时增长。

主窗口展示今日入账、工作进度、剩余时间和今日预计；迷你悬浮窗口只保留金额，适合放在屏幕角落随时查看。

## 界面体验

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

## 快速下载

| 平台 | 推荐下载 | 说明 |
| --- | --- | --- |
| 在线体验 | [PayDance Web](https://masterbao66.github.io/PayDance/) | 网页端，含所有核心功能 |
| Windows 11 桌面端 | [pay-dance-v0.9.0-windows-x64.exe](https://github.com/MasterBao66/PayDance/releases/latest/download/pay-dance-v0.9.0-windows-x64.exe) | 含开机自启动、窗口置顶、迷你悬浮模式、系统托盘等完整功能 |

Release 页面会同时提供 `pay-dance-v0.9.0-windows-x64.exe` 与 `pay-dance-v0.9.0-windows-x64.exe.sha256`。Windows 对未签名二进制可能展示发布者验证提示，建议以 GitHub Release 来源与 SHA256 校验作为下载后的完整性确认。

```powershell
Get-FileHash .\pay-dance-v0.9.0-windows-x64.exe -Algorithm SHA256
Get-Content .\pay-dance-v0.9.0-windows-x64.exe.sha256
```

若两者校验值一致，即可确认本地文件与 Release 附件匹配；若不一致，请不要运行该文件。

## 技术架构

| 层级        | 技术与实践                                                                                                                                 |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| 桌面壳      | Tauri 2, Rust, Windows tray, frameless window                                                                                              |
| 前端        | Vue 3, TypeScript, Vite                                                                                                                    |
| Web Preview | Vite Web build, GitHub Pages, browser localStorage                                                                                         |
| UI          | Windows 11 风格、CSS Container Queries、@lucide/vue                                                                                        |
| 本地存储    | `@tauri-apps/plugin-store`，配置写入本机应用数据目录                                                                                       |
| 测试        | Vitest, @vue/test-utils, happy-dom, vue-tsc, cargo fmt, cargo clippy, cargo check                                                          |

项目采用 Vue 3 + TypeScript + Tauri 2 架构，核心薪资逻辑、状态模型和前端界面服务于 Web Preview 与 Windows 桌面端。当前正式验证平台是 Windows 11，网页端用于在线体验与核心功能预览。

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

## 隐私声明

薪跳 PayDance 坚持本地优先：不需要登录账号，不上传薪资数据，不包含遥测、远程同步或在线账户体系。应用配置通过 Tauri Store 保存在本机应用数据目录中的 `salary-settings.json`，主要包括薪资、工作时间、主题、置顶状态、迷你悬浮透明度、金额变换模式和首次配置状态。

## 作者与许可

薪跳 PayDance 由 Mr.Baoboer 设计与开发。

- **代码**：采用 [GNU General Public License v3.0 (GPL-3.0)](LICENSE) — 可自由使用、学习、修改、再分发，但所有副本和修改版本必须保留原始版权声明并以相同许可开源。如需闭源商用授权，请联系作者。
- **名称与标识**："薪跳" 和 "PayDance" 为作者商标。未经许可，不得使用上述名称发布衍生产品。
- **文档**（README、PRODUCT、DESIGN、CHANGELOG）：采用 [CC-BY-4.0](https://creativecommons.org/licenses/by/4.0/) — 可自由分享、改编，但需保留 Mr.Baoboer 署名。

完整版本记录请查看 [CHANGELOG.md](CHANGELOG.md)，构建产物与校验文件请查看 [Releases](https://github.com/MasterBao66/PayDance/releases)。

> [English version of this README →](README_EN.md)
