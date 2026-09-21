<script setup lang="ts">
// SPDX-FileCopyrightText: 2026 Mr.Baoboer
// SPDX-License-Identifier: AGPL-3.0-only
//
// Additional terms: see /legal/ADDITIONAL_TERMS.md
import { inject } from "@vercel/analytics";
import WebPreviewPage from "./web-preview/components/WebPreviewPage.vue";
import "./web-preview/web-preview.css";

// Initialize Vercel Web Analytics
inject();
</script>

<template>
  <WebPreviewPage />
</template>
