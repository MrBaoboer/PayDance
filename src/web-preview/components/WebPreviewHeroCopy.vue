<script setup lang="ts">
import WebPreviewActions from "./WebPreviewActions.vue";

defineProps<{
  repositoryUrl: string;
  windowsDownloadUrl: string;
}>();
</script>

<template>
  <div class="web-preview__copy">
    <h1>
      <span class="web-preview__headline-main">看见每一秒的</span>
      <span class="web-preview__headline-accent">收入跳动</span>
    </h1>
    <p class="web-preview__lead">具象化你的劳动价值，专注工作，也看见回报</p>

    <WebPreviewActions
      :repository-url="repositoryUrl"
      :windows-download-url="windowsDownloadUrl"
    />
  </div>
</template>
