// SPDX-FileCopyrightText: 2026 Mr.Baoboer // SPDX-License-Identifier: AGPL-3.0-only // //
Additional terms: see /ADDITIONAL_TERMS.md

<script setup lang="ts">
import { computed } from "vue";
import SegmentedControl from "../ui/SegmentedControl.vue";
import SwitchRow from "../ui/SwitchRow.vue";
import {
  useI18n,
  supportedLocales,
  localeLabels,
  type Locale,
} from "../../composables/useI18n";

const { locale, setLocale, t } = useI18n();

type ThemeMode = "light" | "dark";

withDefaults(
  defineProps<{
    autostartEnabled: boolean;
    showDesktopFeatures?: boolean;
    themeMode: ThemeMode;
  }>(),
  {
    showDesktopFeatures: true,
  },
);

const emit = defineEmits<{
  "update:autostartEnabled": [value: boolean];
  "update:themeMode": [mode: ThemeMode];
}>();

const langOptions = computed(() =>
  supportedLocales.map((loc) => ({
    label: localeLabels[loc],
    value: loc,
  })),
);

const themeOptions = computed(() => [
  { label: t.value("preferences.light"), value: "light" } as const,
  { label: t.value("preferences.dark"), value: "dark" } as const,
]);

const updateThemeMode = (value: string) => {
  emit("update:themeMode", value as ThemeMode);
};
</script>

<template>
  <section class="onboarding-step">
    <div class="onboarding-section-label">
      <strong>{{ t("preferences.language") }}</strong>
    </div>
    <SegmentedControl
      :columns="2"
      density="onboarding"
      :label="t('preferences.language')"
      :model-value="locale"
      :options="langOptions"
      @update:model-value="setLocale($event as Locale)"
    />

    <div class="onboarding-section-label">
      <strong>{{ t("preferences.theme") }}</strong>
    </div>
    <SegmentedControl
      :columns="2"
      density="onboarding"
      :label="t('preferences.theme')"
      :model-value="themeMode"
      :options="themeOptions"
      @update:model-value="updateThemeMode"
    />

    <SwitchRow
      v-if="showDesktopFeatures"
      :label="t('preferences.autostart')"
      panel
      :model-value="autostartEnabled"
      @update:model-value="emit('update:autostartEnabled', $event)"
    />
  </section>
</template>

<style scoped>
.onboarding-step {
  display: grid;
  gap: clamp(16px, 3.6cqh, 20px);
}

.onboarding-section-label {
  min-height: clamp(22px, 5.2cqh, 28px);
  display: flex;
  align-items: center;
}

.onboarding-section-label strong {
  color: var(--text);
  font-size: var(--ui-font-sm, 15px);
  font-weight: 700;
}
</style>
