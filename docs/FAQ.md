# 常见问题

> [English version →](FAQ_EN.md)

产品边界见 [PRODUCT.md](PRODUCT.md)，故障与反馈路径见 [SUPPORT.md](SUPPORT.md)。

## 下载与使用

### 用 Web Preview 还是 Windows 桌面版？

[Web Preview](https://paydance.vercel.app/) 用于体验界面和计算逻辑。迷你悬浮窗和透明度可在浏览器内模拟；托盘、置顶和开机自启动仅在 Windows 桌面版提供。

### 该下载哪个文件？

在 [最新 Release](https://github.com/MrBaoboer/PayDance/releases/latest) 里下载 `pay-dance-v<版本>-windows-x64.exe`。同一页面的 `.sha256` 文件用于核对完整性：

```powershell
Get-FileHash .\pay-dance-v<版本>-windows-x64.exe -Algorithm SHA256
```

输出的哈希与 `.sha256` 文件中的一致即可，大小写不影响。

同一页面还有一份固定文件名的 `pay-dance-windows-x64.exe`，内容与带版本号的文件完全一致，官网下载按钮用的就是它。

### 首次运行出现「Windows 已保护你的电脑」怎么办？

这是 Windows SmartScreen 对没有代码签名证书的程序的默认提示，不代表文件有问题。点击「更多信息」，再点击「仍要运行」即可；同一个文件只会提示一次。担心文件被篡改时，先按上一条核对 `.sha256`。EXE 带有更新签名，但尚未购买 Authenticode 代码签名证书，进展见[路线图](ROADMAP.md)。

### 如何彻底删除 PayDance？

1. 如果开启过开机自启动，先在设置中关闭。
2. 从托盘退出应用。
3. 删除 EXE 文件。
4. 需要同时清除薪资设置时，删除 `%APPDATA%\com.masterbao.paydance\salary-settings.json`。

### 如何重新进入首次启动向导？

关闭应用后删除本地配置文件，再重新启动：

```powershell
Remove-Item "$env:APPDATA\com.masterbao.paydance\salary-settings.json"
```

### Web Preview 的设置会影响桌面版吗？

不会。Web Preview 使用浏览器 `localStorage`，桌面版通过 Tauri Store 保存到本机应用数据目录，两者互不影响。

## 薪资与时间计算

### 今日入账是怎么算出来的？

你可以选择月薪、日薪或时薪。PayDance 先按工作日、上下班时间和午休设置算出当天的有效工作时长，再折算出当天应得：月薪除以设置里的「每月工作天数」，日薪直接取用，时薪乘以有效工作时长。今日入账按已经过的有效工作时间同比例累加。

### 午休时间会计入计算吗？

取决于你的设置。启用午休剔除后，午休时段不计入有效工作时间；如果你的薪资规则不扣午休，关掉这个选项即可。

### 支持夜班或跨零点工作吗？

支持。下班时间早于上班时间时按跨零点班次处理，过零点后继续累计同一班次的收入。

### 金额为 0 或一直不动？

先看标题栏左侧的状态：「今日休息」说明今天不在设置的工作日里；「未到上班」「已下班」说明当前时间不在上下班区间内；「午休中」说明启用了午休剔除；「配置待修正」说明有设置项无效，打开设置会看到具体是哪一项。以上都不是时，检查系统时间和时区是否正确。

### 显示金额等于真实到账工资吗？

不等于。它是基于你输入的薪资与时间设置得到的实时估算，不含税费、社保、公积金、奖金、请假、加班和公司内部薪资规则。

## 隐私与本地数据

### 薪资数据会上传吗？

不会。PayDance 没有账号、云同步、遥测或广告，薪资、工作时间和界面偏好只保存在你的设备上。

### 配置保存在哪里？

Windows 桌面版通过 Tauri Store 保存在 `%APPDATA%\com.masterbao.paydance\salary-settings.json`。这个文件包含你的薪资信息，属于个人数据。删除它之后，下一次启动会重新进入首次启动向导。

## 桌面能力

### 迷你悬浮窗口怎么用？

在主窗口双击金额进入迷你悬浮模式。迷你窗口只显示金额，右键调出透明度面板，双击恢复主窗口。

### 关闭主窗口后为什么仍在运行？

主窗口的关闭按钮会把应用隐藏到系统托盘。可以从托盘重新显示窗口或彻底退出；置顶和开机自启动可在设置中单独开关。

### 开机自启动没有生效？

自启动登记的是开启时 EXE 所在的路径。移动或重命名 EXE 后，先在设置里关闭再重新开启；部分安全软件会拦截该登记，需要放行。

### 自动更新失败怎么办？

更新需要能访问 GitHub，并且 EXE 所在文件夹可写。失败时设置底部会出现「更新失败，点击重试」；重试仍失败，从 [最新 Release](https://github.com/MrBaoboer/PayDance/releases/latest) 下载新版 EXE 覆盖旧文件即可，设置不会丢失。

### 设置文件无法读取怎么办？

应用会先重试一次；仍失败时把原文件改名为 `salary-settings.json.bak-<时间戳>` 备份，再用默认值重建。无法备份时保持原文件不动，设置页会说明原因。反复出现时，关闭应用后删除 `%APPDATA%\com.masterbao.paydance\salary-settings.json`，重新启动即可。

### 多显示器或高 DPI 下显示异常怎么办？

窗口停在看不见的位置时，先点击托盘图标，应用会把窗口拉回可见区域。仍不行时关闭应用，删除 `salary-settings.json` 里的 `mainPosition` 与 `miniPosition` 两个字段（或整个文件）后重启。问题依旧请按 [SUPPORT.md](SUPPORT.md) 提交反馈，附上应用版本、Windows 版本、显示器数量、DPI 缩放和复现步骤，截图或录屏会更有帮助。

## 开源、许可与品牌

### 用的什么许可证？可以商用吗？

代码采用 [AGPL-3.0-only](../LICENSE) 发布，并带有 AGPL 第 7 条允许的附加条款。商业使用需同时遵守两者；闭源集成、OEM、白标和官方品牌使用需要单独授权。详见 [LEGAL.md](../legal/LEGAL.md)。

### 可以 fork 或修改后发布吗？

可以，但修改版需要保留必要法律声明，标注不是官方版本，并使用能清楚区分的名称、图标、应用标识符和发布渠道，避免被误认为官方版本。商标与品牌素材边界见 [TRADEMARK.md](../legal/TRADEMARK.md) 和 [BRAND-ASSETS.md](../legal/BRAND-ASSETS.md)。

### 有 macOS 或 Linux 版吗？

目前只有 Windows 桌面版和网页版。macOS 版正在邀请社区贡献，方案讨论与进度见 [#65](https://github.com/MrBaoboer/PayDance/issues/65)。

## 贡献与反馈

### 发现 Bug 怎么反馈？

用仓库里的 Bug 反馈表单，需要提供的信息见 [SUPPORT.md](SUPPORT.md)。Issue 是公开的，请勿附上薪资数据或配置文件。

### 想提功能建议，先看什么？

先看 [PRODUCT.md](PRODUCT.md) 里的产品边界。说明建议解决的具体使用场景，比描述功能本身更有帮助。

### 开发者从哪里开始？

先读 [贡献指南](../.github/CONTRIBUTING.md)。当前公开的协作入口是 macOS 版邀请（[#65](https://github.com/MrBaoboer/PayDance/issues/65)）和带 `help wanted` 标签的 Issue；想法和问题可以直接发到 [Discussions](https://github.com/MrBaoboer/PayDance/discussions)。文档和测试通常不需要完整的 Windows 桌面环境。
