<script setup lang="ts">
// SPDX-FileCopyrightText: 2026 Mr.Baoboer
// SPDX-License-Identifier: AGPL-3.0-only
//
// Additional terms: see /legal/ADDITIONAL_TERMS.md
import { useI18n } from "../../composables/useI18n";

const { t } = useI18n();
import { Download } from "@lucide/vue";
import GitHubMark from "./GitHubMark.vue";
import Windows11Mark from "./Windows11Mark.vue";

defineProps<{
  repositoryUrl: string;
  windowsDownloadUrl: string;
}>();
</script>

<template>
  <nav class="web-preview__actions" :aria-label="t('web.actionsAriaLabel')">
    <a
      class="web-preview__action web-preview__action--primary"
      :href="windowsDownloadUrl"
    >
      <Windows11Mark />
      <span class="web-preview__action-label web-preview__action-label-full">
        {{ t("web.downloadWindows") }}
      </span>
      <span class="web-preview__action-label web-preview__action-label-short">
        Download
      </span>
      <Download :size="16" />
    </a>
    <a class="web-preview__action web-preview__action--quiet" :href="repositoryUrl">
      <GitHubMark />
      <span class="web-preview__action-label">GitHub</span>
    </a>
  </nav>
</template>
