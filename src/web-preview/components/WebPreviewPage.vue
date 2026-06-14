<script setup lang="ts">
// SPDX-FileCopyrightText: 2026 Mr.Baoboer
// SPDX-License-Identifier: AGPL-3.0-only
//
// Additional terms: see /legal/ADDITIONAL_TERMS.md
import { onBeforeUnmount, onMounted, ref } from "vue";
import productLogoUrl from "../../../src-tauri/icons/icon.png";
import { detectLocale, provideI18n, type Locale } from "../../composables/useI18n";
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

const savedLocale =
  typeof localStorage !== "undefined"
    ? localStorage.getItem("paydance-web-locale")
    : null;
const initialLocale = ref<Locale>(detectLocale(savedLocale));
const { locale } = provideI18n(initialLocale, (next) => {
  localStorage.setItem("paydance-web-locale", next);
  document.documentElement.lang = next;
});

const shellClass = ref("theme-light");
const documentScrollClass = "is-web-preview-page";
const productHomepageUrl = import.meta.env.BASE_URL;

const toggleDocumentScroll = (enabled: boolean) => {
  document.documentElement.classList.toggle(documentScrollClass, enabled);
  document.body.classList.toggle(documentScrollClass, enabled);
};

onMounted(() => {
  document.documentElement.lang = locale.value;
  toggleDocumentScroll(true);
});
onBeforeUnmount(() => toggleDocumentScroll(false));
</script>

<template>
  <main class="web-preview" :class="shellClass" :data-locale="locale">
    <WebPreviewTopbar
      :app-english-name="appEnglishName"
      :app-name="appName"
      :app-version="appVersion"
      :product-homepage-url="productHomepageUrl"
      :product-logo-url="productLogoUrl"
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
