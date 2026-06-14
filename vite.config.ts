// SPDX-FileCopyrightText: 2026 Mr.Baoboer
// SPDX-License-Identifier: AGPL-3.0-only
//
// Additional terms: see /legal/ADDITIONAL_TERMS.md

import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import tailwindcss from "@tailwindcss/vite";
import { readFileSync } from "node:fs";
import { fileURLToPath, URL } from "node:url";

const packageMetadata = JSON.parse(
  readFileSync(new URL("./package.json", import.meta.url), "utf8"),
) as { version: string };

export default defineConfig(({ mode }) => ({
  base: mode === "web" ? "/PayDance/" : "./",
  define: {
    __PAYDANCE_VERSION__: JSON.stringify(packageMetadata.version),
  },
  plugins: [vue(), tailwindcss()],
  resolve: {
    alias: {
      "#opener": fileURLToPath(
        new URL(
          mode === "web" ? "./src/platform/opener.web.ts" : "./src/platform/opener.ts",
          import.meta.url,
        ),
      ),
      "#runtime-app": fileURLToPath(
        new URL(
          mode === "web" ? "./src/WebPreviewApp.vue" : "./src/DesktopApp.vue",
          import.meta.url,
        ),
      ),
      "#settings-store": fileURLToPath(
        new URL(
          mode === "web"
            ? "./src/platform/settings-store.web.ts"
            : "./src/platform/settings-store.ts",
          import.meta.url,
        ),
      ),
      "#updater": fileURLToPath(
        new URL(
          mode === "web" ? "./src/platform/updater.web.ts" : "./src/platform/updater.ts",
          import.meta.url,
        ),
      ),
    },
  },
  clearScreen: false,
  optimizeDeps: {
    entries: ["index.html"],
  },
  build: {
    rolldownOptions: {
      checks: {
        pluginTimings: false,
      },
    },
  },
  server: {
    strictPort: true,
    port: 1420,
    host: "127.0.0.1",
    watch: {
      ignored: ["**/src-tauri/target/**"],
    },
  },
}));
