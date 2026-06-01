# Web Preview QA

Web Preview 视觉验证的标准流程是：本地服务 + 内置 Playwright + 多视口截图 + DOM/console 双校验。

## 禁用方法

不要使用 headless Chrome/CDP/CLI screenshot 作为 Web Preview 验证方式。上一轮验证已经证明这条路线可能得到全白截图，却仍然返回看似正常的退出结果，不能作为发布信号。

## 标准流程

1. 启动本地 Web Preview dev server，并记录本地 URL。
2. 使用 Codex 内置 Node + Playwright 打开页面。
3. 按固定视口截图：桌面端 `1440x900`，中等窗口 `960x760`，移动端 `390x844`。
4. 浅色和深色主题都要覆盖；只改首屏橱窗时也不能只看浅色。
5. 同步做 DOM 校验：页面标题、`Web Preview · appVersion` 版本号、软件展示区、移动端展示区不消失也不塌缩。
6. 收集 browser console 与 page error，确认无严重报错。
7. 保存截图到本次运行专属的临时 QA 目录：`C:\Users\mrbao\AppData\Local\Temp\paydance-web-preview-qa-{version}-{commit}-{timestamp}`。不要复用仅包含版本号的固定目录，否则聊天窗口或图片查看层可能缓存旧截图。
8. 验证完成后关闭本地服务，避免占用端口。

## 命令

```powershell
npm run qa:web-preview
```

脚本会自动启动 `npm run dev:web`，使用内置 Playwright 完成三种视口截图与 DOM/console 校验，然后关闭本地服务。截图和 `summary.json` 会写入本次运行的唯一临时 QA 目录；`summary.json` 会记录 run id、commit 和页面实际读取到的中英文 DOM 文案，避免误把旧截图当作新证据。
