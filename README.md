# Labor-Wage-Live-Calc

社畜牛马工资实时计算器，一款 Windows 11 风格的轻量桌面端工资实时计算器。输入月薪、每月工作天数、上下班时间和午休时间后，应用会用 `requestAnimationFrame` 平滑计算并展示今天已经赚到的钱。

## 功能

- 实时展示今日已赚金额，精确到小数点后 2 位
- 自动计算时薪、分薪、秒薪
- 仪表盘统计今日预计入账、还可入账、已工作和剩余时间
- 动态收入进度条，显示今日工作进度百分比
- 支持剔除午休时间
- 本地保存薪资配置
- 无边框窗口，可拖拽移动
- 支持窗口置顶
- 迷你悬浮模式，双击金额可切换
- 设置中心从底部弹出，支持鼠标滚轮和右侧滚动条浏览
- 关闭窗口时隐藏到系统托盘
- 托盘菜单支持打开窗口、打开设置、切换置顶和退出
- Light/Dark 双主题 + Windows 11 Mica 风格

## 版本

- v0.3.4：统一数字字体为 Roboto Mono，中文字体为思源黑体风格，优化中文字号、薪资图标和启动默认主界面。
- v0.3.3：优化金额前缀间距，新增底部弹出式设置中心和动态收入进度条。
- v0.3.2：新增统计面板，调整仪表盘布局和 Windows 11 风格设置分组。
- v0.2.0：稳定版，补充核心计算测试、迷你模式拖拽与窗口尺寸优化。

## 开发

```powershell
npm.cmd install --cache .npm-cache
npm.cmd run tauri -- dev
```

## 构建

生成可直接运行的 EXE：

```powershell
npm.cmd run build:exe
```

生成安装包：

```powershell
npm.cmd run build:installer
```

Windows 完整安装包构建需要安装 Visual Studio Build Tools，并包含 MSVC 与 Windows SDK 组件。MSI 打包还需要 WiX 工具链，Tauri 会在构建时自动下载。
