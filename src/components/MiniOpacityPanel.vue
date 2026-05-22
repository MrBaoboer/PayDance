<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { emitTo } from "@tauri-apps/api/event";
import { getCurrentWindow } from "@tauri-apps/api/window";
import {
  defaultMiniOpacityPercent,
  maxMiniOpacityPercent,
  minMiniOpacityPercent,
  normalizeMiniOpacityPercent,
  type ThemeMode,
} from "../lib/window-mode";

type MiniOpacityPanelPayload = {
  value?: number;
  themeMode?: ThemeMode;
};

const appWindow = getCurrentWindow();
const opacityPercent = ref(defaultMiniOpacityPercent);
const themeMode = ref<ThemeMode>("light");
const panelClass = computed(() =>
  themeMode.value === "dark" ? "theme-dark" : "theme-light",
);

const emitOpacityChange = async (commit = false) => {
  await emitTo("main", "mini-opacity-change", {
    commit,
    value: opacityPercent.value,
  });
};

const updateOpacity = (event: Event, commit = false) => {
  opacityPercent.value = normalizeMiniOpacityPercent(
    Number((event.target as HTMLInputElement).value),
  );
  void emitOpacityChange(commit);
};

const hidePanel = () => {
  void appWindow.hide();
};

const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === "Escape") {
    hidePanel();
  }
};

let unlistenPanelOpen: (() => void) | undefined;

onMounted(async () => {
  unlistenPanelOpen = await appWindow.listen<MiniOpacityPanelPayload>(
    "mini-opacity-panel-open",
    (event) => {
      opacityPercent.value = normalizeMiniOpacityPercent(event.payload.value);
      if (event.payload.themeMode === "dark" || event.payload.themeMode === "light") {
        themeMode.value = event.payload.themeMode;
      }
    },
  );
  window.addEventListener("blur", hidePanel);
  window.addEventListener("keydown", handleKeydown);
});

onBeforeUnmount(() => {
  unlistenPanelOpen?.();
  window.removeEventListener("blur", hidePanel);
  window.removeEventListener("keydown", handleKeydown);
});
</script>

<template>
  <section class="mini-opacity-panel" :class="panelClass" @contextmenu.prevent>
    <header>
      <strong>透明度</strong>
      <span>{{ opacityPercent }}%</span>
    </header>
    <input
      aria-label="迷你悬浮透明度"
      :max="maxMiniOpacityPercent"
      :min="minMiniOpacityPercent"
      :value="opacityPercent"
      step="1"
      type="range"
      @change="updateOpacity($event, true)"
      @input="updateOpacity"
    />
  </section>
</template>

<style scoped>
.mini-opacity-panel {
  display: grid;
  height: 100vh;
  gap: 12px;
  align-content: center;
  border: 1px solid var(--line);
  border-radius: 16px;
  background: var(--panel);
  box-shadow: 0 16px 34px rgb(15 23 42 / 0.16);
  color: var(--text);
  font-family: var(--font-sans);
  padding: 14px;
}

.theme-light {
  --panel: rgb(250 250 250);
  --line: rgb(228 228 231);
  --text: rgb(24 24 27);
  --muted: rgb(113 113 122);
  --accent: rgb(217 119 6);
  --track: rgb(228 228 231);
}

.theme-dark {
  --panel: rgb(24 24 27);
  --line: rgb(255 255 255 / 0.12);
  --text: rgb(250 250 250);
  --muted: rgb(161 161 170);
  --accent: rgb(245 158 11);
  --track: rgb(63 63 70);
  box-shadow: none;
}

header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
}

strong {
  font-size: 14px;
  font-weight: 700;
}

span {
  color: var(--muted);
  font-family: var(--font-dashboard);
  font-size: 13px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

input {
  width: 100%;
  accent-color: var(--accent);
}
</style>
