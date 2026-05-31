// SPDX-FileCopyrightText: 2026 Mr.Baoboer
// SPDX-License-Identifier: AGPL-3.0-only
//
// Additional terms: see /ADDITIONAL_TERMS.md

import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath, URL } from "node:url";

export default defineConfig(({ mode }) => ({
  base: mode === "web" ? "/PayDance/" : "./",
  plugins: [vue(), tailwindcss()],
  resolve: {
    alias: {
      "#runtime-app": fileURLToPath(
        new URL(
          mode === "web" ? "./src/WebPreviewApp.vue" : "./src/DesktopApp.vue",
          import.meta.url,
        ),
      ),
    },
  },
  clearScreen: false,
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
  },
}));
