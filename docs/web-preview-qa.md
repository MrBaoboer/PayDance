# Web Preview 质量验证

> [English version →](web-preview-qa_EN.md)

Web Preview QA 用来确认官网橱窗在真实浏览器里稳定可用：页面能正常渲染，主题和语言能切换，关键文案不丢，主要布局不溢出。它的目标不是截一张好看的图，而是为发布判断留下可靠证据。

## 不要使用

不要用 headless Chrome、CDP 或命令行截图替代这个流程。它们曾经出现过全白截图却正常退出的情况，不能作为发布信号。

## 验证流程

1. 启动本地 Web Preview dev server，并记录本地 URL。
2. 使用项目 `devDependency` 中的 Playwright 打开页面；如需调试特殊环境，可用 `PLAYWRIGHT_NODE_MODULES` 指向外部 `node_modules`。
3. 按固定视口截图：桌面端 `1440x900`，中等窗口 `960x760`，移动端 `390x844`。
4. 同时覆盖浅色和深色主题。即使只改了首屏，也不要只看浅色。
5. 检查 DOM：页面标题、`Web Preview · appVersion`、软件预览区和移动端布局必须存在且稳定。
6. 跑真实语言切换：中文移动端进入页面，点击 `Switch to English`，确认 `data-locale="en"`，英文标题和主要按钮在视口内可见。
7. 用 `@axe-core/playwright` 检查自动化能发现的严重无障碍问题。这不是完整 WCAG 合规证明。
8. 收集控制台错误和页面错误，确认没有严重报错。
9. 将截图和 `summary.json` 保存到本次运行专属临时目录：`C:\Users\mrbao\AppData\Local\Temp\paydance-web-preview-qa-{version}-{commit}-{timestamp}`。
10. 对 4 个标准状态执行像素差异检查：中英文各覆盖桌面端和移动端，中文使用浅色，英文使用深色。
11. 结束后关闭本地服务，避免占用端口。

## 命令

```powershell
npm run qa:web-preview
```

仅在确认视觉变化符合预期时，显式更新基准图：

```powershell
npm run qa:web-preview:update
```

普通 QA 永远不会自动接受新截图。发生差异时，临时目录会保留预期图、实际图和差异图。`summary.json` 会记录运行 ID、commit、页面实际读取到的中英文文案、截图路径和视觉比较结果。

## 通过标准

- 三种视口都有非空截图，首屏没有文字重叠、按钮溢出或主体塌缩。
- 中英文文案都来自当前页面 DOM，而不是旧截图或手工判断。
- 中文进入后点击 EN，根节点 `data-locale` 必须同步为 `en`。
- 没有 critical/serious 级别的 axe 自动化无障碍违规。
- 浅色/深色切换后，预览窗口边缘没有明显闪白、错色或残影。
- `summary.json` 中没有严重控制台错误或页面错误。
- 标准状态与已审核基准图的像素差异不超过 `0.1%`。
- 验证结束后本地 dev server 已退出。
