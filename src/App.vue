<script setup lang="ts">
import { defineAsyncComponent } from "vue";
import { isWebPreview } from "./platform/runtime";

const RuntimeApp = defineAsyncComponent(() =>
  isWebPreview ? import("./WebPreviewApp.vue") : import("./DesktopApp.vue"),
);
</script>

<template>
  <RuntimeApp />
</template>
