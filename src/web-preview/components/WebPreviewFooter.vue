<script setup lang="ts">
defineProps<{
  appCopyright: string;
  appEnglishName: string;
  appName: string;
}>();
</script>

<template>
  <footer class="web-preview__footer" aria-label="作者归属">
    <span>{{ appCopyright }}</span>
    <span class="web-preview__footer-mark" aria-hidden="true"></span>
    <span>{{ appName }} {{ appEnglishName }}</span>
  </footer>
</template>
