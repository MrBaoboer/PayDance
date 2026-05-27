<script setup lang="ts">
import { Download } from "@lucide/vue";
import GitHubMark from "./GitHubMark.vue";
import Windows11Mark from "./Windows11Mark.vue";

defineProps<{
  repositoryUrl: string;
  windowsDownloadUrl: string;
}>();
</script>

<template>
  <nav class="web-preview__actions" aria-label="网页端操作">
    <a
      class="web-preview__action web-preview__action--primary"
      :href="windowsDownloadUrl"
    >
      <Windows11Mark />
      <span class="web-preview__action-label">下载 Windows 版</span>
      <Download :size="16" />
    </a>
    <a class="web-preview__action web-preview__action--quiet" :href="repositoryUrl">
      <GitHubMark />
      <span class="web-preview__action-label">GitHub</span>
    </a>
  </nav>
</template>
