# 第三方声明

PayDance 依赖以下第三方软件和素材，各项均受各自许可条款约束。

## 运行时依赖

| 软件包 | 许可证 | 用途 |
|---------|---------|-------|
| [Tauri 2](https://github.com/tauri-apps/tauri) | Apache-2.0 OR MIT | 桌面壳 |
| [Vue 3](https://github.com/vuejs/core) | MIT | 前端框架 |
| [@lucide/vue](https://github.com/lucide-icons/lucide) | ISC | 图标 |
| [Vite](https://github.com/vitejs/vite) | MIT | 构建工具 |
| [TypeScript](https://github.com/microsoft/TypeScript) | Apache-2.0 | 类型系统 |

## Tauri 插件

| 插件 | 许可证 |
|--------|---------|
| `tauri-plugin-autostart` | Apache-2.0 OR MIT |
| `tauri-plugin-opener` | Apache-2.0 OR MIT |
| `tauri-plugin-process` | Apache-2.0 OR MIT |
| `tauri-plugin-store` | Apache-2.0 OR MIT |
| `tauri-plugin-updater` | Apache-2.0 OR MIT |
| `tauri-plugin-single-instance` | Apache-2.0 OR MIT |

## 开发依赖

| 软件包 | 许可证 |
|---------|---------|
| Vitest | MIT |
| @vue/test-utils | MIT |
| happy-dom | MIT |
| ESLint | MIT |
| Prettier | MIT |
| Tailwind CSS | MIT |
| vue-tsc | MIT |
| @axe-core/playwright | MPL-2.0 |
| axe-core | MPL-2.0 |

## Rust 依赖

完整 Rust 依赖树及其许可证见 `src-tauri/Cargo.lock`。主要直接依赖如下：

| Crate | 许可证 |
|-------|---------|
| tauri | Apache-2.0 OR MIT |
| serde | Apache-2.0 OR MIT |
| serde_json | Apache-2.0 OR MIT |

## 字体

PayDance 使用系统 UI 字体栈（`Segoe UI`、`San Francisco` 等），不捆绑自定义字体。

---

本文档按尽力维护原则更新。如发现遗漏或错误，请提交 Issue。

> [English version →](THIRD_PARTY_NOTICES_EN.md)
