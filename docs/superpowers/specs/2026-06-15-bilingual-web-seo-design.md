# PayDance 双语官网 SEO 设计

## 目标

保留中文官网 `https://mrbaoboer.github.io/PayDance/`，新增独立英文入口
`https://mrbaoboer.github.io/PayDance/en/`，让搜索引擎和社交平台无需执行
JavaScript 就能识别每个页面的语言与内容。

## 方案

- `index.html` 是中文页面，`en/index.html` 是英文页面。
- 两个入口共用同一套 Vue 应用、样式与图片，不复制界面实现。
- 页面路径决定首次语言：根路径为中文，`/en/` 为英文。
- 语言切换器在两个规范网址之间跳转，使网址、正文语言和 SEO 元数据始终一致。
- 每个 HTML 分别声明自己的标题、描述、Canonical、Open Graph、Twitter Card 和 JSON-LD。
- 两个页面都声明 `zh-CN`、`en` 和 `x-default` 的双向 `hreflang`。
- Vite 构建插件从 `package.json` 读取版本，并以构建日期生成 JSON-LD `dateModified`。
- 构建插件同时生成包含中英文规范网址及 `lastmod` 的 `sitemap.xml`。

## 兼容性

- 桌面版仍以 `index.html` 为唯一入口，不生成英文网页入口。
- 官网现有视觉、工资演示、主题与本地设置保持不变。
- 旧的语言偏好只用于桌面版；官网语言由网址决定，避免英文网址显示中文内容。

## 验证

- 单元测试检查两份 HTML 的语言、独立元数据、双向 `hreflang` 和 JSON-LD。
- 构建测试检查 `dist/index.html`、`dist/en/index.html` 和 `dist/sitemap.xml`。
- 真实网页 QA 分别访问中文与英文入口，检查正文语言和语言切换后的网址。

