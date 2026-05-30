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
    alwaysOnTop: boolean;
    autostartEnabled: boolean;
    showDesktopFeatures?: boolean;
    startInMiniMode: boolean;
    themeMode: ThemeMode;
  }>(),
  {
    showDesktopFeatures: true,
  },
);

const emit = defineEmits<{
  "update:alwaysOnTop": [value: boolean];
  "update:autostartEnabled": [value: boolean];
  "update:startInMiniMode": [value: boolean];
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
    <SegmentedControl
      :columns="2"
      density="onboarding"
      :label="t('preferences.language')"
      :model-value="locale"
      :options="langOptions"
      @update:model-value="setLocale($event as Locale)"
    />

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

    <SwitchRow
      v-if="showDesktopFeatures"
      :label="t('preferences.alwaysOnTop')"
      panel
      :model-value="alwaysOnTop"
      @update:model-value="emit('update:alwaysOnTop', $event)"
    />

    <SwitchRow
      :label="t('preferences.startInMini')"
      panel
      :model-value="startInMiniMode"
      @update:model-value="emit('update:startInMiniMode', $event)"
    />
  </section>
</template>

<style scoped>
.onboarding-step {
  display: grid;
  gap: clamp(16px, 3.6cqh, 20px);
}
</style>
