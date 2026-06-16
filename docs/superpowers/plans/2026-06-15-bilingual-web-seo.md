# PayDance 双语官网 SEO 实现计划

> **面向 AI 代理的工作者：** 必需子技能：使用 superpowers:subagent-driven-development（推荐）或 superpowers:executing-plans 逐任务实现此计划。步骤使用复选框（`- [ ]`）语法来跟踪进度。

**目标：** 构建可独立收录的中文与英文官网入口，并自动维护版本日期和 Sitemap。

**架构：** 使用 Vite 多页面输入构建两份静态 HTML，共享一个 Vue 运行时。路径决定官网语言；一个专用构建插件统一注入版本、构建日期并输出 Sitemap。

**技术栈：** Vite 8、Vue 3、TypeScript、Vitest、Node.js。

---

### 任务 1：定义双语 SEO 合同

**文件：**
- 修改：`src/web-preview.test.ts`
- 创建：`scripts/web-seo.test.js`

- [ ] 写测试，要求 `index.html` 与 `en/index.html` 分别拥有独立语言、标题、描述、Canonical、Open Graph、JSON-LD 和双向 `hreflang`。
- [ ] 写测试，要求构建辅助函数从版本和日期生成同时包含两个网址的 Sitemap。
- [ ] 运行 `npx vitest run src/web-preview.test.ts scripts/web-seo.test.js`，确认因英文入口和构建模块尚不存在而失败。

### 任务 2：实现静态双入口与路径语言

**文件：**
- 修改：`index.html`
- 创建：`en/index.html`
- 修改：`src/web-preview/components/WebPreviewPage.vue`
- 修改：`src/web-preview/components/LanguageSwitcher.vue`

- [ ] 添加英文静态 HTML 元数据和两页完整 `hreflang`。
- [ ] 让官网以路径决定初始语言，不再由浏览器语言或旧存储覆盖规范入口。
- [ ] 让语言切换器跳转 `/PayDance/` 与 `/PayDance/en/`。
- [ ] 运行目标测试，确认静态 SEO 与语言路径行为通过。

### 任务 3：自动版本日期和 Sitemap

**文件：**
- 创建：`scripts/web-seo.mjs`
- 修改：`vite.config.ts`
- 删除：`public/sitemap.xml`
- 修改：`scripts/verify-scripts.test.js`

- [ ] 实现 `createWebSeoPlugin`，仅在 web 构建启用多页面输入。
- [ ] 在 HTML 转换阶段注入 `package.json` 版本和 UTC 构建日期。
- [ ] 在构建产物阶段生成包含中英文网址和 `lastmod` 的 `sitemap.xml`。
- [ ] 更新脚本测试并运行目标测试。

### 任务 4：更新真实网页 QA

**文件：**
- 修改：`scripts/qa-web-preview.mjs`
- 修改：`docs/web-preview-qa.md`
- 修改：`docs/web-preview-qa_EN.md`

- [ ] 让每种语言从其规范入口启动。
- [ ] 验证语言切换后网址与页面语言同步。
- [ ] 保留现有桌面、移动端、主题和无障碍检查。

### 任务 5：完整验证

**文件：**
- 检查：`dist/index.html`
- 检查：`dist/en/index.html`
- 检查：`dist/sitemap.xml`

- [ ] 运行 `npm run verify:fast`。
- [ ] 运行 `npm run qa:web-preview`。
- [ ] 解析两份构建 HTML 与 Sitemap，核对标题、Canonical、`hreflang`、JSON-LD、版本和日期。
- [ ] 运行 `git diff --check` 并检查工作区只包含本功能文件。

