<script setup lang="ts">
// SPDX-FileCopyrightText: 2026 Mr.Baoboer
// SPDX-License-Identifier: AGPL-3.0-only
//
// Additional terms: see /legal/ADDITIONAL_TERMS.md
import { useI18n } from "../../composables/useI18n";
import LanguageSwitcher from "./LanguageSwitcher.vue";

const { t } = useI18n();
defineProps<{
  appEnglishName: string;
  appName: string;
  appVersion: string;
  productHomepageUrl: string;
  productLogoUrl: string;
}>();
</script>

<template>
  <header class="web-preview__topbar" :aria-label="t('web.topbarAriaLabel')">
    <a class="web-preview__brand" :href="productHomepageUrl">
      <img
        class="web-preview__brand-logo"
        :src="productLogoUrl"
        alt=""
        aria-hidden="true"
      />
      <span>{{ appName }} {{ appEnglishName }}</span>
    </a>
    <div class="web-preview__topbar-right">
      <LanguageSwitcher />
      <span class="web-preview__status">
        <span
          class="web-preview__version"
          :aria-label="t('web.versionLabel') + ' ' + appVersion"
        >
          <span>Web Preview</span>
          <span class="web-preview__version-dot" aria-hidden="true">·</span>
          <strong>{{ appVersion }}</strong>
        </span>
      </span>
    </div>
  </header>
</template>
