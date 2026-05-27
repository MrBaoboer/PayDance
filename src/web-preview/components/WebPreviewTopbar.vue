<script setup lang="ts">
defineProps<{
  appEnglishName: string;
  appName: string;
  appVersion: string;
  productLogoUrl: string;
  repositoryUrl: string;
}>();
</script>

<template>
  <header class="web-preview__topbar" aria-label="产品信息">
    <a class="web-preview__brand" :href="repositoryUrl">
      <img
        class="web-preview__brand-logo"
        :src="productLogoUrl"
        alt=""
        aria-hidden="true"
      />
      <span>{{ appName }} {{ appEnglishName }}</span>
    </a>
    <span class="web-preview__version" :aria-label="`当前版本 ${appVersion}`">
      <span>Web Preview</span>
      <span class="web-preview__version-dot" aria-hidden="true">·</span>
      <strong>{{ appVersion }}</strong>
    </span>
  </header>
</template>
