# 薪跳 PayDance

[![Latest Release](https://img.shields.io/github/v/release/MasterBao66/PayDance?label=latest)](https://github.com/MasterBao66/PayDance/releases/latest)
[![CI](https://github.com/MasterBao66/PayDance/actions/workflows/ci.yml/badge.svg)](https://github.com/MasterBao66/PayDance/actions/workflows/ci.yml)
[![Release](https://github.com/MasterBao66/PayDance/actions/workflows/release.yml/badge.svg)](https://github.com/MasterBao66/PayDance/actions/workflows/release.yml)
[![Platform](https://img.shields.io/badge/platform-Windows%2011-0078D4)](https://github.com/MasterBao66/PayDance/releases/latest)
[![Built with Tauri](https://img.shields.io/badge/built%20with-Tauri%202-24C8DB)](https://tauri.app/)

薪跳 PayDance 是一款桌面实时薪资仪表盘，也是一款属于打工人的桌面实时工资看板。输入薪资、工作日、上下班时间和午休设置后，它会在桌面上实时显示今天已经挣到的钱，让每一秒的收入跳动都看得见。

## 快速下载

| 平台 | 推荐下载 | 说明 |
| --- | --- | --- |
| Windows 11 | [pay-dance.exe](https://github.com/MasterBao66/PayDance/releases/latest/download/pay-dance.exe) | 便携版，下载后直接运行 |
| GitHub Release | [最新正式版](https://github.com/MasterBao66/PayDance/releases/latest) | 查看更新说明、附件和校验文件 |
| 源码 | [MasterBao66/PayDance](https://github.com/MasterBao66/PayDance) | Vue 3 + TypeScript + Tauri 2 |

首次运行 Windows 可能提示未知发布者，这是未签名个人开源软件的常见提示。请优先从本仓库 Release 页面下载，并可使用同版本的 SHA256 文件核对附件完整性。

## 一句话定位

把“今天上班挣了多少钱”变成一个安静常驻、实时跳动、适合放在屏幕角落的桌面看板。

## 适合谁

- 想把上班时间和收入感知变得更直观的打工人。
- 想要一个轻量、安静、可置顶桌面小工具的 Windows 用户。
- 想研究 Tauri 2、Vue 3、桌面托盘、无边框窗口和本地设置持久化的开发者。

## 产品亮点

| 亮点 | 体验 |
| --- | --- |
| 实时金额跳动 | 今日收入按工作时间平滑刷新，精确到小数点后 2 位 |
| 三种薪资模式 | 支持月薪、日薪、时薪，并自动换算日薪、时薪、分薪、秒薪 |
| 工作时间建模 | 支持每月工作天数、每周工作日、上下班时间和午休扣除 |
| 迷你悬浮模式 | 更小、更透明、默认置顶，只保留核心金额，适合贴在屏幕角落 |
| Windows 11 风格 | 无边框窗口、圆角、轻阴影、亮色/暗色主题和 Mica 风格背景 |
| 系统托盘 | 关闭窗口后隐藏到托盘，可从托盘打开设置、切换置顶、退出 |
| 本地优先 | 薪资和作息数据保存在本机，不需要账号，不依赖云同步 |

## 核心功能

- 首次启动向导：分步配置薪资模式、工作时间和外观风格。
- 实时薪资计算：根据当前时间计算今日已挣金额、今日预计收入、工作进度和剩余时间。
- 工作日识别：非工作日显示今日休息，避免周末继续累计。
- 午休扣除：可选择剔除午休时间，让收入累计更贴近真实工时。
- 设置中心：支持修改薪资、工作日、上下班时间、午休、金额变换方式。
- 桌面模式：支持窗口置顶、最小化、关闭到托盘、无边框拖拽。
- 迷你模式：支持拖拽移动、双击恢复主窗口、记忆迷你窗口尺寸。

## 隐私与数据

薪跳 PayDance 不需要登录账号，也不上传薪资数据。应用配置通过 Tauri Store 保存在本机应用数据目录中的 `salary-settings.json`，包括薪资、工作时间、主题、置顶状态、金额变换模式和首次配置状态。

当前版本不包含遥测、远程同步或在线账户体系。删除本机应用数据目录中的配置文件后，应用会重新进入首次配置流程。

## 跨平台能力

项目采用 Vue 3 + TypeScript + Tauri 2 架构，核心薪资逻辑、状态模型和大部分前端界面具备复用价值。Tauri 2 支持使用同一套前端与 Rust 应用逻辑面向 Windows、macOS、Linux、Android 和 iOS 构建应用，因此本项目具备继续扩展到其它平台的工程基础。

当前正式验证的是 Windows 11 桌面体验。迁移时需要注意：

- macOS/Linux：主体代码可复用，托盘、透明窗口、置顶、阴影和系统材质效果需要逐平台验证。
- Android/iOS：薪资逻辑和设置流程可复用，但托盘、桌面置顶、迷你悬浮窗和 Mica 材质需要改造成移动端首页、小组件或通知类体验。
- 微信小程序：不能直接运行 Tauri 壳，可抽离薪资逻辑后用原生小程序、Taro/uni-app 或 H5 + `web-view` 重做。

因此，本项目的优势是“核心逻辑与 Web UI 可迁移、桌面壳能力可按平台替换”，不是当前 Windows exe 能直接变成 Android、iOS、macOS 或微信小程序安装包。

## 技术栈

| 层级 | 技术 |
| --- | --- |
| 桌面壳 | Tauri 2, Rust |
| 前端 | Vue 3, TypeScript, Vite |
| UI | Windows 11 风格、CSS Container Queries、lucide-vue-next |
| 本地存储 | `@tauri-apps/plugin-store` |
| 测试 | Vitest, vue-tsc, cargo check |
| 自动发布 | GitHub Actions, softprops/action-gh-release |

## 本地开发

```powershell
npm.cmd install --cache .npm-cache
npm.cmd run tauri -- dev
```

## 测试

```powershell
npm.cmd test
npm.cmd run build
Push-Location src-tauri
cargo check
Pop-Location
```

## 构建

生成可直接运行的 exe：

```powershell
npm.cmd run build:exe
```

生成安装包：

```powershell
npm.cmd run build:installer
```

`build:exe` 和 `build:installer` 会先检查 `src-tauri\target\release\pay-dance.exe` 是否仍在运行。如果应用还停留在系统托盘里，请先从托盘菜单退出后再构建。

Windows 完整安装包构建需要安装 Visual Studio Build Tools，并包含 MSVC 与 Windows SDK 组件。MSI 打包还需要 WiX 工具链，Tauri 会在构建时自动下载。

## 发布流程

当前协作流程以 `main` 为唯一长期分支。日常修改直接在 `main` 上完成、验证、提交并推送，不保留临时远端开发分支。

正式发布优先走 GitHub Actions 自动链路：

```powershell
git status --short --branch
npm.cmd test
npm.cmd run build
Push-Location src-tauri
cargo check
Pop-Location
git push origin main
git tag -a vX.Y.Z -m "Release vX.Y.Z"
git push origin vX.Y.Z
```

推送 `v*` 标签后，`.github/workflows/release.yml` 会自动运行测试、构建 Windows `pay-dance.exe`、生成 SHA256 校验文件、上传构建产物并创建 GitHub Release。发布后可用 GitHub CLI 核验：

```powershell
gh run list --workflow Release --limit 3
gh release view vX.Y.Z --json tagName,name,isDraft,isPrerelease,url,assets,targetCommitish
```

仅当需要补救 Release notes 或覆盖附件时，才使用 `gh release edit` 或 `gh release upload --clobber` 手动处理。

## 版本记录

### v0.5.6

- README 重构为面向用户的产品主页，强化快速下载、产品亮点、隐私说明、跨平台边界和开发发布流程。
- Release workflow 增加 SHA256 校验文件产物，便于下载后核对正式版附件。

### v0.5.5

- 英文名正式调整为 PayDance，中文名保持“薪跳”。
- 产品定位统一为“桌面实时薪资仪表盘”和“打工人的桌面实时工资看板”。
- 清理旧英文品牌、历史项目名和旧营销表述，统一应用标题、托盘提示、仓库地址、发行产物和 README 表述。
- GitHub 仓库同步更名为 `PayDance`。

### v0.5.3

- 回退首次启动向导第一步数字输入框的居中对齐，恢复为更自然的左侧输入。
- 将首次启动向导中的薪资与工作天数计量单位同步到主界面设置中心，月薪、日薪、时薪显示“元”，每月工作天数显示“天”。
- 将 v0.5.3 作为当时最新正式版发布，并移除原 v0.5.2 GitHub Release。

### v0.5.0

- 新增月薪、日薪、时薪三种薪资输入模式，并按当前模式自动换算日薪、时薪、分薪和秒薪。
- 新增每周工作日设置，非工作日显示“今日休息”并停止当日收入累计。
- 新增首次启动向导，分步配置收入、作息、主题、置顶和迷你悬浮偏好。
- 主窗口排版、金额数字和界面字号改为随窗口尺寸平滑自适应。
- 主界面状态细分为未到上班、正在上班、午休中、已下班、今日休息和配置待修正。

### v0.4.1

- 完成产品命名与说明文案整理。
- 主界面 `¥ + 金额数字` 组合整体水平居中，并优化符号与数字间距。
- 金额变换设置同步作用于主界面与迷你悬浮模式。
- 应用图标改为浅色 UI 风格。
- README 全面更新，补充仓库地址、设计方向、功能说明和版本演进。

更多历史版本请查看 [Releases](https://github.com/MasterBao66/PayDance/releases)。
