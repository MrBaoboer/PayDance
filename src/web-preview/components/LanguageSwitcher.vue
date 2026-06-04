<script setup lang="ts">
// SPDX-FileCopyrightText: 2026 Mr.Baoboer
// SPDX-License-Identifier: AGPL-3.0-only
//
// Additional terms: see /legal/ADDITIONAL_TERMS.md
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
    <span class="lang-switcher__track" aria-hidden="true">
      <span class="lang-switcher__option" :class="{ 'is-active': locale === 'zh-CN' }">
        中文
      </span>
      <span class="lang-switcher__option" :class="{ 'is-active': locale === 'en' }">
        EN
      </span>
    </span>
  </button>
</template>

<style scoped>
.lang-switcher {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  height: 32px;
  border: 1px solid color-mix(in srgb, var(--web-border) 84%, transparent);
  border-radius: 999px;
  background: color-mix(in srgb, var(--web-surface-strong) 86%, transparent);
  box-shadow:
    inset 0 1px 0 rgb(255 255 255 / 0.5),
    0 6px 14px rgb(24 24 27 / 0.045);
  color: var(--muted);
  font-family: var(--web-font-action, var(--font-dashboard, inherit));
  padding: 2px;
  transition:
    border-color 160ms ease,
    box-shadow 160ms ease,
    background-color 160ms ease;
  cursor: pointer;
}

.lang-switcher__track {
  display: grid;
  width: 86px;
  height: 26px;
  grid-template-columns: 1fr 1fr;
  gap: 2px;
  border-radius: 999px;
}

.lang-switcher__option {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 820;
  line-height: 1;
  transition:
    background-color 160ms ease,
    color 160ms ease,
    box-shadow 160ms ease;
}

.lang-switcher__option.is-active {
  background: color-mix(in srgb, var(--income-accent) 16%, rgb(255 255 255));
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--income-accent) 22%, transparent);
  color: rgb(154 79 0);
}

.lang-switcher:hover {
  border-color: color-mix(in srgb, var(--income-accent) 34%, var(--web-border));
  box-shadow:
    inset 0 1px 0 rgb(255 255 255 / 0.52),
    0 8px 18px rgb(24 24 27 / 0.06);
}

:global(.theme-dark.web-preview .lang-switcher) {
  border-color: rgb(255 255 255 / 0.14);
  background: rgb(13 14 16 / 0.9);
  box-shadow:
    inset 0 1px 0 rgb(255 255 255 / 0.06),
    0 8px 18px rgb(0 0 0 / 0.3);
}

:global(.theme-dark.web-preview .lang-switcher__track) {
  background: rgb(255 255 255 / 0.025);
}

:global(.theme-dark.web-preview .lang-switcher__option) {
  color: rgb(158 163 173);
}

:global(.theme-dark.web-preview .lang-switcher__option.is-active) {
  background: color-mix(in srgb, var(--income-accent) 18%, rgb(18 18 20));
  box-shadow:
    inset 0 0 0 1px color-mix(in srgb, var(--income-accent) 32%, transparent),
    0 0 14px rgb(245 158 11 / 0.12);
  color: rgb(255 214 154);
}
</style>
