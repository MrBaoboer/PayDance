<script setup lang="ts">
import { useI18n } from "../../composables/useI18n";

const { locale, setLocale } = useI18n();

const toggle = () => {
  setLocale(locale.value === "zh-CN" ? "en" : "zh-CN");
};
</script>

<template>
  <button
    class="lang-switcher"
    :aria-label="locale === 'zh-CN' ? 'Switch to English' : '切换到中文'"
    :title="locale === 'zh-CN' ? 'English' : '中文'"
    type="button"
    @click="toggle"
  >
    {{ locale === "zh-CN" ? "EN" : "中" }}
  </button>
</template>

<style scoped>
.lang-switcher {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 100;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--border, #e2e8f0);
  border-radius: 8px;
  background: var(--panel, #fff);
  color: var(--muted, #64748b);
  font-family: var(--font-dashboard, inherit);
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  transition:
    border-color 160ms ease,
    color 160ms ease,
    box-shadow 160ms ease;
}

.lang-switcher:hover {
  border-color: var(--income-accent-ring, #f59e0b);
  color: var(--text, #1e293b);
  box-shadow: 0 4px 12px rgb(0 0 0 / 0.08);
}
</style>
