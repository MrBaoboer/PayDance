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
  依次设置薪资模式、工作时间和使用偏好，从第一天开始看见每一秒收入。
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
| 实时收入仪表盘 | 主界面突出今日已入账、工作进度、剩余时间和今日预计收入 |
| 实时金额跳动 | 今日收入按工作时间平滑刷新，精确到小数点后 2 位 |
| 扫读型时间统计 | 主界面用 `4:12` 这类数字时间格式展示已工作与剩余时长，降低理解成本 |
| 三种薪资模式 | 支持月薪、日薪、时薪，并自动换算日薪、时薪、分薪、秒薪 |
| 工作时间建模 | 支持每月工作天数、每周工作日、普通日班、跨零点夜班和午休剔除 |
| 迷你悬浮模式 | 更小、更透明、默认置顶，只保留核心金额，适合贴在屏幕角落 |
| Windows 11 风格 | 无边框窗口、圆角、轻阴影、亮色/暗色主题和 Mica 风格背景 |
| 系统托盘 | 关闭窗口后隐藏到托盘，可从托盘打开设置、切换置顶、退出 |
| 开机自启动 | 可在首次启动向导或设置中心开启，随 Windows 登录自动启动薪跳 |
| 作者归属 | 设置中心展示作者署名和 GitHub 仓库入口 |
| 本地优先 | 薪资和作息数据保存在本机，不需要账号，不依赖云同步 |

## 核心功能

- 首次启动向导：分步配置薪资模式、工作时间和使用偏好，支持首次进入时选择主题、置顶、迷你悬浮和开机自启动。
- 实时薪资计算：根据当前时间计算今日已挣金额、今日预计收入、工作进度和剩余时间。
- 薪资说明：展示日薪、时薪、分薪和秒薪换算结果，避免主界面承载过多次级信息。
- 工作日识别：非工作日显示今日休息，避免周末继续累计。
- 午休剔除：可选择剔除午休时间，让收入累计更贴近真实工时。
- 设置中心：恢复独立小卡片布局，支持修改薪资模式、薪资、每周工作日、工作时间、午休和金额变换。
- 作者入口：设置中心底部展示作者署名，并可打开 GitHub 项目仓库。
- 桌面模式：支持窗口置顶、最小化、关闭到托盘、无边框拖拽。
- 开机自启动：可在首次启动向导或设置中心开启或关闭，自动沿用上次保存的主窗口或迷你悬浮状态。
- 迷你模式：支持拖拽移动、双击恢复主窗口、记忆迷你窗口尺寸。

## 隐私与数据

薪跳 PayDance 不需要登录账号，也不上传薪资数据。应用配置通过 Tauri Store 保存在本机应用数据目录中的 `salary-settings.json`，包括薪资、工作时间、主题、置顶状态、金额变换模式和首次配置状态。

当前版本不包含遥测、远程同步或在线账户体系。删除本机应用数据目录中的配置文件后，应用会重新进入首次配置流程。

Windows 上可按需删除以下配置文件来重新体验首次启动向导：

```powershell
Remove-Item "$env:APPDATA\com.masterbao.paydance\salary-settings.json" -ErrorAction SilentlyContinue
```

如果开启“开机自动启动”后移动了 `pay-dance.exe` 所在位置，请在设置中心关闭再重新开启一次自启动，让系统记录新的程序路径。

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
- `poster-02-first-run-setup.png`：首次配置三步上手，展示薪资模式、工作时间和使用偏好三段流程。

两张海报均作为人工定稿素材维护，不再由脚本批量生成或覆盖。后续更换海报时，直接替换同名文件，并同步更新 README 中的预览和说明。

## 版本记录

### v0.6.5

- 左上角状态圆点与“正在上班 / 正在夜班”文案改为与右侧窗口操控图标保持同一视觉中线。
- 仪表盘“今日预计”中的 `¥` 调整为与 `h / m` 单位一致的浅灰色，减少符号抢占金额数字焦点。
- 仪表盘数字字体切换为更贴近 Windows 11 Fluent 气质的 `Segoe UI Variable Display` 优先栈，主金额跳动字体保持不变。
- 浅色模式下“薪资说明”入口 Hover 增加轻橙底色、细描边和柔和阴影，深色模式 Hover 保持原有质感。

### v0.6.4

- 修复主界面今日进度条右侧圆点被轨道上下裁切的问题，圆点完整浮在进度轨道上。
- 仪表盘“已工作”和“距离下班”等时长回到 v0.6.0 的 `h / m` 表达，更贴近此前版本的熟悉观感。
- 主界面金额禁用千分位分隔，`1500.00` 不再显示为 `1,500.00`。
- 首次启动向导“薪资模式”和“工作时间”步骤扩大间距、输入高度和内容留白，降低初次配置的稠密感。
- 左上角状态文案与橙色状态点的间距加大，“正在上班 / 正在夜班”等状态更清爽。

### v0.6.3

- 夜班状态文案改为基于当前实际工作段判断：跨零点长班在 22:00 前显示“正在上班”，进入 22:00 后的工作段再显示“正在夜班”。
- 主界面仪表盘数字时间中的冒号与数字等高、同色显示，`4:12` 这类时长更像一组完整数字。
- 首次启动向导“使用偏好”步骤调整为开机自动启动、窗口始终置顶、进入迷你悬浮模式的顺序。
- 首次启动向导“工作时间”步骤中，只有勾选“剔除午休”后才展示午休开始、结束时间输入框。
- 设置中心“开机自动启动”开关与午休“剔除”开关做右侧对齐，减少设置区的视觉偏移。
- 开发依赖 Vitest 升级到 4.1.7，并保持测试套件全量通过。

### v0.6.2

- 仪表盘数字时间格式继续精修，冒号左右增加细微间距，`4:12` 这类时长扫读更轻松。
- 今日预计金额中的 `¥` 与后续金额数字完全等高，统一今日预计的金额视觉重心。
- “薪资说明”入口在 v0.6.1 基础上继续下移约 7-8 像素，与仪表盘保持更舒服的呼吸距离。
- 设置中心“开机自动启动”开关整体左移，让文案右侧与“直接变换”控件右侧更接近对齐。
- 首次启动向导第三步由“外观风格”改为“使用偏好”，并新增“开机自动启动”选择。

### v0.6.1

- 移除 v0.6.0 主界面金额下方的“每秒 / 每分钟”常驻小字，让金额重新成为唯一视觉焦点。
- 金额小数取消金色强调，恢复与整数一致的主文字色，仅保留更轻的字号与字重层次。
- 主界面“薪资明细”入口恢复为居中的“薪资说明”按钮，不再放在右下角打破布局平衡。
- 左上角状态区恢复 v0.5.17 的字号、字重和视觉密度。
- 保留整体仪表盘方向，将已工作、动态状态、今日预计和今日进度收束在同一个轻量面板里。
- 仪表盘时长改为 `4:12` 这类数字时间格式，降低 `h / m / min` 单位带来的理解和排版成本。
- 今日进度百分比不再常驻显示，鼠标悬停在进度轨道上时显示“今日进度 XX%”提示。
- 仪表盘数字改用 Windows 自带的 `Bahnschrift` 风格数字字体，统计数字、符号和金额统一基线。
- 今日预计的 `¥` 与金额数字等高，避免人民币符号像脚注一样下沉。
- “薪资说明”入口进一步下移，与仪表盘拉开呼吸感，但仍保持轻量辅助入口。
- 深色仪表盘改为更克制的石墨黑 Mica 质感、细边框和低噪声层次，减少脏灰高光和廉价厚重感。

### v0.6.0

- 主界面升级为“薪资脉搏仪表盘”，让“今日已入账”金额成为更明确的第一视觉焦点。
- 新增主界面收入脉搏文案，上班中直接展示每秒收入与每分钟收入，午休、等待开工、下班和休息日切换对应状态短句。
- 金额数字重新分层排版，货币符号弱化、整数更醒目、小数使用更轻的强调色，保持实时跳动的爽感但减少视觉噪声。
- 底部统计区从三张独立卡片优化为一组整体仪表信息，工作时长、动态状态指标和今日预计收入更紧凑清晰。
- 今日进度条升级为轻量工作进度轨道，百分比与轨道分离显示，非工作状态使用更克制的中性色。
- 标题栏按钮和状态胶囊进一步弱化默认视觉权重，让桌面常驻时更安静。
- 本版不改动迷你悬浮模式，不新增快捷键、提醒或分段时间轴。

### v0.5.17

- 修复跨零点但不属于夜班的状态文案：例如 `09:30 - 00:30` 会继续显示“正在上班 / 已下班”，不再误显示“正在夜班”。
- 夜班显示改为更谨慎的 UI 判断，只有晚间开始且跨零点的班次才显示“正在夜班 / 夜班已完成”。
- 设置中心新增“启动”小卡片，可开启或关闭“开机自动启动”，启动后沿用上次保存的主窗口或迷你悬浮状态。
- 接入 Tauri autostart 插件，并将权限收紧到启用、禁用和读取自启动状态三项。
- README 补充开机自启动说明和便携 exe 移动路径后的处理方式。

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
