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
  top: 14px;
  right: 148px;
  z-index: 100;
  width: 32px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--line, #e2e8f0);
  border-radius: 6px;
  background: var(--panel-soft, #f8fafc);
  color: var(--muted, #64748b);
  font-family: var(--font-dashboard, inherit);
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
  transition:
    border-color 160ms ease,
    color 160ms ease,
    background-color 160ms ease;
}

.lang-switcher:hover {
  border-color: var(--income-accent-ring, #f59e0b);
  color: var(--text, #1e293b);
  background: var(--panel, #fff);
}

/* Dark mode: ensure visibility against dark topbar */
:global(.theme-dark) .lang-switcher {
  border-color: var(--line, #334155);
  background: var(--panel-soft, #1e293b);
  color: var(--muted, #94a3b8);
}

:global(.theme-dark) .lang-switcher:hover {
  border-color: var(--income-accent-ring, #f59e0b);
  color: var(--text, #f1f5f9);
  background: var(--panel, #0f172a);
}
</style>
