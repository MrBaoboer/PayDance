<script setup lang="ts">
import { useI18n } from "../../composables/useI18n";

const { t } = useI18n();
defineProps<{
  appEnglishName: string;
  appName: string;
  appVersion: string;
  productLogoUrl: string;
  repositoryUrl: string;
}>();
</script>

<template>
  <header class="web-preview__topbar" :aria-label="t('web.topbarAriaLabel')">
    <a class="web-preview__brand" :href="repositoryUrl">
      <img
        class="web-preview__brand-logo"
        :src="productLogoUrl"
        alt=""
        aria-hidden="true"
      />
      <span>{{ appName }} {{ appEnglishName }}</span>
    </a>
    <span
      class="web-preview__version"
      :aria-label="t('web.versionLabel') + ' ' + appVersion"
    >
      <span>Web Preview</span>
      <span class="web-preview__version-dot" aria-hidden="true">·</span>
      <strong>{{ appVersion }}</strong>
    </span>
  </header>
</template>
