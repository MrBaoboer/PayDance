<script setup lang="ts">
import SegmentedControl from "../ui/SegmentedControl.vue";
import SwitchRow from "../ui/SwitchRow.vue";

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

const themeOptions = [
  { label: "浅色", value: "light" },
  { label: "深色", value: "dark" },
] as const;

const updateThemeMode = (value: string) => {
  emit("update:themeMode", value as ThemeMode);
};
</script>

<template>
  <section class="onboarding-step">
    <SegmentedControl
      :columns="2"
      density="onboarding"
      label="主题"
      :model-value="themeMode"
      :options="themeOptions"
      @update:model-value="updateThemeMode"
    />

    <SwitchRow
      v-if="showDesktopFeatures"
      label="开机自动启动"
      panel
      :model-value="autostartEnabled"
      @update:model-value="emit('update:autostartEnabled', $event)"
    />

    <SwitchRow
      v-if="showDesktopFeatures"
      label="窗口始终置顶"
      panel
      :model-value="alwaysOnTop"
      @update:model-value="emit('update:alwaysOnTop', $event)"
    />

    <SwitchRow
      label="进入迷你悬浮模式"
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
