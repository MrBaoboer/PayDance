# Labor-Wage-Live-Calc

社畜牛马工资实时计算器，一款 Windows 11 风格的轻量桌面端工资实时计算器。输入月薪、每月工作天数、上下班时间和午休时间后，应用会用 `requestAnimationFrame` 平滑计算并展示今天已经赚到的钱。

## 功能

- 实时展示今日已赚金额，精确到小数点后 2 位
- 自动计算时薪、分薪、秒薪
- 支持剔除午休时间
- 本地保存薪资配置
- 无边框窗口，可拖拽移动
- 支持窗口置顶
- 迷你悬浮模式，双击金额可切换
- 关闭窗口时隐藏到系统托盘
- 托盘菜单支持打开窗口、打开设置、切换置顶和退出
- Light/Dark 双主题 + Windows 11 Mica 风格

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
