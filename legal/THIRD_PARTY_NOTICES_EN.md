# Third-Party Notices

PayDance depends on the following third-party software and assets. Each is
governed by its own license terms.

## Runtime dependencies

| Package | License | Usage |
|---------|---------|-------|
| [Tauri 2](https://github.com/tauri-apps/tauri) | Apache-2.0 OR MIT | Desktop shell |
| [Vue 3](https://github.com/vuejs/core) | MIT | Frontend framework |
| [@lucide/vue](https://github.com/lucide-icons/lucide) | ISC | Icons |
| [Vite](https://github.com/vitejs/vite) | MIT | Build tool |
| [TypeScript](https://github.com/microsoft/TypeScript) | Apache-2.0 | Type system |

## Tauri plugins

| Plugin | License |
|--------|---------|
| `tauri-plugin-autostart` | Apache-2.0 OR MIT |
| `tauri-plugin-opener` | Apache-2.0 OR MIT |
| `tauri-plugin-process` | Apache-2.0 OR MIT |
| `tauri-plugin-store` | Apache-2.0 OR MIT |
| `tauri-plugin-updater` | Apache-2.0 OR MIT |
| `tauri-plugin-single-instance` | Apache-2.0 OR MIT |

## Development dependencies

| Package | License |
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

## Rust dependencies

See `src-tauri/Cargo.lock` for the full Rust dependency tree and their
respective licenses. Key direct dependencies:

| Crate | License |
|-------|---------|
| tauri | Apache-2.0 OR MIT |
| serde | Apache-2.0 OR MIT |
| serde_json | Apache-2.0 OR MIT |

## Fonts

PayDance uses the system UI font stack (`Segoe UI`, `San Francisco`, etc.).
No custom fonts are bundled.

---

This file is maintained on a best-effort basis. If you notice an omission or
error, please open an Issue.
