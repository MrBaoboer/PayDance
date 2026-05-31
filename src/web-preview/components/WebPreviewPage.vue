// SPDX-FileCopyrightText: 2026 Mr.Baoboer // SPDX-License-Identifier: AGPL-3.0-only // //
Additional terms: see /ADDITIONAL_TERMS.md

<script setup lang="ts">
import { ref } from "vue";
import productLogoUrl from "../../../src-tauri/icons/icon.png";
import {
  appCopyright,
  appEnglishName,
  appName,
  appVersion,
  repositoryUrl,
  windowsDownloadUrl,
} from "../../lib/app-meta";
import WebPreviewFeatureStrip from "../WebPreviewFeatureStrip.vue";
import WebPreviewFooter from "./WebPreviewFooter.vue";
import WebPreviewHeroCopy from "./WebPreviewHeroCopy.vue";
import WebPreviewShowcase from "./WebPreviewShowcase.vue";
import WebPreviewTopbar from "./WebPreviewTopbar.vue";

const shellClass = ref("theme-light");
</script>

<template>
  <main class="web-preview" :class="shellClass">
    <WebPreviewTopbar
      :app-english-name="appEnglishName"
      :app-name="appName"
      :app-version="appVersion"
      :product-logo-url="productLogoUrl"
      :repository-url="repositoryUrl"
    />

    <section class="web-preview__hero" aria-label="PayDance Web Preview">
      <WebPreviewHeroCopy
        :repository-url="repositoryUrl"
        :windows-download-url="windowsDownloadUrl"
      />

      <WebPreviewShowcase @shell-class-change="shellClass = $event" />

      <WebPreviewFeatureStrip />
    </section>

    <WebPreviewFooter
      :app-copyright="appCopyright"
      :app-english-name="appEnglishName"
      :app-name="appName"
    />
  </main>
</template>
