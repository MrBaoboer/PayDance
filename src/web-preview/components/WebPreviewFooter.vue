// SPDX-FileCopyrightText: 2026 Mr.Baoboer // SPDX-License-Identifier: AGPL-3.0-only // //
Additional terms: see /ADDITIONAL_TERMS.md

<script setup lang="ts">
import { useI18n } from "../../composables/useI18n";

const { t } = useI18n();
defineProps<{
  appCopyright: string;
  appEnglishName: string;
  appName: string;
}>();
</script>

<template>
  <footer class="web-preview__footer" :aria-label="t('web.footerAriaLabel')">
    <span>{{ appCopyright }}</span>
    <span class="web-preview__footer-mark" aria-hidden="true"></span>
    <span>{{ appName }} {{ appEnglishName }}</span>
  </footer>
</template>
