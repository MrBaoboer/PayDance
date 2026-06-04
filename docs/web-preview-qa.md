# Web Preview 质量验证

> [English version →](web-preview-qa_EN.md)

Web Preview 的验证标准：本地服务 + 项目声明的 Playwright + 多视口截图 + DOM/console/a11y 校验。目标不是”截到一张图”，而是确认线上橱窗在真实浏览器里能稳定展示、切换主题、切换语言、保留关键文案和布局边界。

## 禁用方法

不要使用 headless Chrome/CDP/CLI screenshot 作为 Web Preview 验证方式。上一轮验证已经证明这条路线可能得到全白截图，却仍然返回看似正常的退出结果，不能作为发布信号。

## 标准流程

1. 启动本地 Web Preview dev server，并记录本地 URL。
2. 使用项目 `devDependency` 中的 Playwright 打开页面；如需调试特殊环境，可用 `PLAYWRIGHT_NODE_MODULES` 指向外部 `node_modules`。
3. 按固定视口截图：桌面端 `1440x900`，中等窗口 `960x760`，移动端 `390x844`。
4. 浅色和深色主题都要覆盖；只改首屏橱窗时也不能只看浅色。
5. 同步做 DOM 校验：页面标题、`Web Preview · appVersion` 版本号、软件展示区、移动端展示区不消失也不塌缩。
6. 跑一次真实语言切换路径：中文进入移动端页面，点击 `Switch to English`，确认 `data-locale="en"`、英文标题和 CTA 可见且不溢出。
7. 使用 `@axe-core/playwright` 检查自动化可发现的严重无障碍问题；它不是完整 WCAG 合规声明。
8. 收集 browser console 与 page error，确认无严重报错。
9. 保存截图到本次运行专属的临时 QA 目录：`C:\Users\mrbao\AppData\Local\Temp\paydance-web-preview-qa-{version}-{commit}-{timestamp}`。不要复用仅包含版本号的固定目录，否则聊天窗口或图片查看层可能缓存旧截图。
10. 验证完成后关闭本地服务，避免占用端口。

## 命令

```powershell
npm run qa:web-preview
```

脚本会自动启动 `npm run dev:web`，使用项目自带 Playwright 完成三种视口截图、DOM/console/a11y 校验和中文到英文的真实点击回归，然后关闭本地服务。截图和 `summary.json` 会写入本次运行的唯一临时 QA 目录；`summary.json` 会记录 run id、commit 和页面实际读取到的中英文 DOM 文案，避免误把旧截图当作新证据。

## 通过标准

- 三种视口都有非空截图，首屏没有文字重叠、按钮溢出或主体塌缩。
- 中英文文案都来自当前页面 DOM，而不是旧截图或手工判断。
- 中文进入后点击 EN，根节点 `data-locale` 必须同步为 `en`。
- 没有 critical/serious 级别的 axe 自动化无障碍违规。
- 浅色/深色主题切换后，预览窗口边缘没有明显闪白、错色或残影。
- `summary.json` 中没有严重 console error 或 page error。
- 验证结束后本地 dev server 已退出。
