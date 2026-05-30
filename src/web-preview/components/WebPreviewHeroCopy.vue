<script setup lang="ts">
import { useI18n } from "../../composables/useI18n";

const { t } = useI18n();
import WebPreviewActions from "./WebPreviewActions.vue";

defineProps<{
  repositoryUrl: string;
  windowsDownloadUrl: string;
}>();
</script>

<template>
  <div class="web-preview__copy">
    <h1>
      <span class="web-preview__headline-main">{{ t("web.heroHeadline1") }}</span>
      <span class="web-preview__headline-accent">{{ t("web.heroHeadline2") }}</span>
    </h1>
    <p class="web-preview__lead">{{ t("web.heroLead") }}</p>

    <WebPreviewActions
      :repository-url="repositoryUrl"
      :windows-download-url="windowsDownloadUrl"
    />
  </div>
</template>
