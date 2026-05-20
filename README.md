# 薪跳 PayDance

[![Latest Release](https://img.shields.io/github/v/release/MasterBao66/PayDance?label=latest)](https://github.com/MasterBao66/PayDance/releases/latest)
[![CI](https://github.com/MasterBao66/PayDance/actions/workflows/ci.yml/badge.svg)](https://github.com/MasterBao66/PayDance/actions/workflows/ci.yml)
[![Release](https://github.com/MasterBao66/PayDance/actions/workflows/release.yml/badge.svg)](https://github.com/MasterBao66/PayDance/actions/workflows/release.yml)
[![Platform](https://img.shields.io/badge/platform-Windows%2011-0078D4)](https://github.com/MasterBao66/PayDance/releases/latest)
[![Built with Tauri](https://img.shields.io/badge/built%20with-Tauri%202-24C8DB)](https://tauri.app/)

薪跳 PayDance 是一款桌面实时薪资仪表盘，也是一款属于打工人的桌面实时工资看板。输入薪资、工作日、上下班时间和午休设置后，它会在桌面上实时显示今天已经挣到的钱，让每一秒的收入跳动都看得见。

## 产品预览

<p align="center">
  <img src="marketing-posters/poster-01-income-ticker.png" alt="薪跳 PayDance 实时收入看板" width="100%">
</p>

<p align="center">
  <strong>实时收入看板</strong><br>
  把今天已经挣到的钱、工作进度、剩余时间和预计收入放在桌面上实时滚动。
</p>

<p align="center">
  <img src="marketing-posters/poster-02-first-run-setup.png" alt="薪跳 PayDance 首次配置三步上手" width="100%">
</p>

<p align="center">
  <strong>首次配置，三步上手</strong><br>
  依次设置薪资模式、工作时间和外观风格，从第一天开始看见每一秒收入。
</p>

## 快速下载

| 平台 | 推荐下载 | 说明 |
| --- | --- | --- |
| Windows 11 | [pay-dance.exe](https://github.com/MasterBao66/PayDance/releases/latest/download/pay-dance.exe) | 便携版，下载后直接运行 |
| GitHub Release | [最新正式版](https://github.com/MasterBao66/PayDance/releases/latest) | 查看更新说明、附件和校验文件 |
| 源码 | [MasterBao66/PayDance](https://github.com/MasterBao66/PayDance) | Vue 3 + TypeScript + Tauri 2 |

首次运行 Windows 可能提示未知发布者，这是未签名个人发布软件的常见提示。请优先从本仓库 Release 页面下载，并可使用同版本的 SHA256 文件核对附件完整性。

```powershell
Get-FileHash .\pay-dance.exe -Algorithm SHA256
Get-Content .\pay-dance.exe.sha256
```

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
| 工作时间建模 | 支持每月工作天数、每周工作日、普通日班、跨零点夜班和午休剔除 |
| 迷你悬浮模式 | 更小、更透明、默认置顶，只保留核心金额，适合贴在屏幕角落 |
| Windows 11 风格 | 无边框窗口、圆角、轻阴影、亮色/暗色主题和 Mica 风格背景 |
| 系统托盘 | 关闭窗口后隐藏到托盘，可从托盘打开设置、切换置顶、退出 |
| 作者归属 | 设置中心展示作者署名和 GitHub 仓库入口 |
| 本地优先 | 薪资和作息数据保存在本机，不需要账号，不依赖云同步 |

## 核心功能

- 首次启动向导：分步配置薪资模式、工作时间和外观风格。
- 实时薪资计算：根据当前时间计算今日已挣金额、今日预计收入、工作进度和剩余时间。
- 工作日识别：非工作日显示今日休息，避免周末继续累计。
- 午休剔除：可选择剔除午休时间，让收入累计更贴近真实工时。
- 设置中心：恢复独立小卡片布局，支持修改薪资模式、薪资、每周工作日、工作时间、午休和金额变换。
- 作者入口：设置中心底部展示作者署名，并可打开 GitHub 项目仓库。
- 桌面模式：支持窗口置顶、最小化、关闭到托盘、无边框拖拽。
- 迷你模式：支持拖拽移动、双击恢复主窗口、记忆迷你窗口尺寸。

## 隐私与数据

薪跳 PayDance 不需要登录账号，也不上传薪资数据。应用配置通过 Tauri Store 保存在本机应用数据目录中的 `salary-settings.json`，包括薪资、工作时间、主题、置顶状态、金额变换模式和首次配置状态。

当前版本不包含遥测、远程同步或在线账户体系。删除本机应用数据目录中的配置文件后，应用会重新进入首次配置流程。

Windows 上可按需删除以下配置文件来重新体验首次启动向导：

```powershell
Remove-Item "$env:APPDATA\com.masterbao.paydance\salary-settings.json" -ErrorAction SilentlyContinue
```

## 作者与许可

薪跳 PayDance 由 Mr.Baober 设计与开发。当前仓库暂未设置开源许可证，作者保留相关权利；未经作者许可，请勿二次发布、商用分发或移除作者归属信息。

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
| UI | Windows 11 风格、CSS Container Queries、@lucide/vue |
| 本地存储 | `@tauri-apps/plugin-store` |
| 测试 | Vitest, vue-tsc, cargo fmt, cargo clippy, cargo check |
| 自动发布 | GitHub Actions, softprops/action-gh-release |

## 本地开发

```powershell
npm.cmd install --cache .npm-cache
npm.cmd run tauri -- dev
```

如果本机 `rg` 命令来自 Codex 的 WindowsApps 目录且提示 `Access is denied`，可运行项目内修复脚本安装本地 ripgrep：

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/bootstrap-ripgrep.ps1 -PersistUserPath
$env:PATH = (Resolve-Path ".tools\ripgrep").Path + ";" + $env:PATH
rg --version
```

## 测试

```powershell
npm.cmd run check:hygiene
npm.cmd test
npm.cmd run build
npm.cmd run version:check
npm.cmd audit --omit=dev
Push-Location src-tauri
cargo fmt --all -- --check
cargo clippy --all-targets -- -D warnings
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
npm.cmd run check:hygiene
npm.cmd test
npm.cmd run build
npm.cmd run version:check
npm.cmd audit --omit=dev
Push-Location src-tauri
cargo fmt --all -- --check
cargo clippy --all-targets -- -D warnings
cargo check
Pop-Location
git push origin main
git tag -a vX.Y.Z -m "Release vX.Y.Z"
git push origin vX.Y.Z
```

推送 `v*` 标签后，`.github/workflows/release.yml` 会自动运行仓库卫生扫描、测试、生产依赖审计、Rust 格式化检查、Clippy 检查、构建 Windows `pay-dance.exe`、生成 SHA256 校验文件、上传构建产物并创建 GitHub Release。也可以在 GitHub Actions 页面手动触发 Release workflow，并填写要发布的 `vX.Y.Z` 标签。发布后可用 GitHub CLI 核验：

```powershell
gh run list --workflow Release --limit 3
gh release view vX.Y.Z --json tagName,name,isDraft,isPrerelease,url,assets,targetCommitish
```

仅当需要补救 Release notes 或覆盖附件时，才使用 `gh release edit` 或 `gh release upload --clobber` 手动处理。

## 营销海报

仓库中的营销海报统一放在 `marketing-posters/`，当前只保留两张无版本号定稿素材：

- `poster-01-income-ticker.png`：实时收入看板主视觉，强调“每一秒都在入账”的核心爽感。
- `poster-02-first-run-setup.png`：首次配置三步上手，展示薪资模式、工作时间和外观风格三段流程。

两张海报均作为人工定稿素材维护，不再由脚本批量生成或覆盖。后续更换海报时，直接替换同名文件，并同步更新 README 中的预览和说明。

## 版本记录

### v0.5.16

- 主界面第二张统计卡片改为按状态动态表达：上班前显示“距离上班”，工作中显示“距离下班”，午休中显示“距离复工”，下班后显示“今日完成”，休息日显示休息态。
- 夜班跨零点计算继续加固，覆盖工作日夜班跨入休息日凌晨、连续夜班、次日下班后和下一班尚未开始等边界。
- 午休校验文案精简为更直接的短句，并区分普通工时与夜班工时内的非法午休设置。
- 设置中心底部作者、版本、GitHub 和版权区域做轻量排版微调，保持 v0.5.10 小卡片风格不变。
- 新增旧品牌文案扫描和敏感信息扫描脚本，并接入本地验证、CI 与 Release workflow。
- 升级 Tauri / Cargo 侧兼容补丁依赖，保持前端 npm 依赖在当前最新可用状态。

### v0.5.15

- 修复连续工作日夜班 `22:00 - 06:00` 在次日下班后、下一班尚未开始时误判为“未到上班”的边界问题，凌晨下班后的收入会继续归属到刚完成的上一班次。
- 设置中心继续保持 v0.5.10 的独立小卡片结构，仅微调卡片间距、底部作者信息和 GitHub 仓库入口在窄窗口下的换行与居中表现。
- 依赖升级到当前可用版本，迁移图标库到新版 `@lucide/vue`，并将 Vite / Tailwind 相关构建工具整理到开发依赖。
- Release workflow 增加生产依赖审计步骤，并关闭 Vite 8 的插件耗时提示，让构建日志更聚焦。
- 清理已废弃小版本发布痕迹，README 版本记录只保留当前仍可追溯的正式发布节点。

### v0.5.14

- 设置中心整体回退到 v0.5.10 的独立小卡片效果，恢复“薪资模式 / 薪资 / 每周工作日 / 工作时间 / 午休 / 金额变换”的轻量布局。
- 保留夜班跨零点支持，并修复跨零点班次在次日下班后过早显示“今日休息”的边界问题。
- 保留新版归属信息区：版本号、作者 Mr.Baober、GitHub 仓库入口和居中版权信息继续显示，但移除“关于”标题文案。
- README 同步恢复午休剔除和小卡片设置中心的产品说明。

### v0.5.10

- 将营销主视觉替换为新的 PayDance 产品海报。
- README 产品预览区聚焦“实时收入看板”和“首次配置三步上手”两张无版本号海报。
- 设置中心底部作者归属区新增当前版本号展示。
- Release workflow 支持手动填写标签触发正式发布，并同步 PR 模板、Issue fallback 模板和 Git 文本/二进制属性。
- 更新低风险开发依赖补丁版本。

### v0.5.9

- README 产品页新增界面预览区，展示实时收入看板、收入粒度换算和迷你悬浮模式。
- 数字输入解析改为共用逻辑，清空薪资或工作天数输入框时不再把配置误写成 `0`。
- 设置中心展开状态不再写入本地配置，只保留为当前窗口 UI 状态，减少无效持久化字段。
- 发布说明生成脚本改为 UTF-8 无 BOM 写入，避免 GitHub Release 正文开头出现不可见字符。
- Tauri 增加 CSP，并将窗口、事件、Store 权限收紧到当前实际使用范围。
- GitHub Actions 固定 Windows runner，并把 Rust 格式化检查和 Clippy 纳入 CI / Release 质量门禁。
- GitHub Issue 表单增加配置入口，优先引导用户下载最新正式版或查看项目主页。

### v0.5.8

- README 产品页增加主视觉海报、SHA256 校验示例、首次配置重置命令和 `rg` 环境修复说明。
- 营销海报更新为无版本号设计，避免海报随小版本发布频繁失效。
- 主窗口尺寸现在会随用户调整持久化，退出迷你悬浮模式后恢复用户自己的主窗口大小。
- 首次启动向导改为按步骤校验，薪资配置和工作时间问题会在对应步骤即时拦截。
- 设置保存改为防抖写入并捕获保存失败，减少输入过程中的本地存储写入压力。
- GitHub 仓库入口增加打开失败反馈，标题栏按钮和金额展示补充无障碍信息，并支持系统“减少动态效果”偏好。
- GitHub Actions 增加版本一致性检查、生产依赖审计、并发控制和基于 README 的 Release notes 生成。
- 收紧 Tauri opener 权限，仅保留默认 URL 打开能力；工作日迁移顺序更稳定，下班整点状态显示为“已下班”。
- 项目包元数据同步作者 `Mr.Baober`，并补充 GitHub Issue / PR 模板。

### v0.5.7

- 设置中心底部新增作者署名 `Mr.Baober`，强化产品归属与作者产权表达。
- 新增 GitHub 仓库入口按钮，点击后通过系统默认浏览器打开项目仓库。
- 接入 Tauri opener 插件，外部链接不再占用应用 WebView。

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
