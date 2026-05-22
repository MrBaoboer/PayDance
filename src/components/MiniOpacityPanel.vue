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
const sliderStyle = computed(() => ({
  "--slider-progress": `${
    ((opacityPercent.value - minMiniOpacityPercent) /
      (maxMiniOpacityPercent - minMiniOpacityPercent)) *
    100
  }%`,
}));

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
  <section
    class="mini-opacity-panel"
    :class="panelClass"
    :style="sliderStyle"
    @contextmenu.prevent
  >
    <header class="mini-opacity-panel__meta">
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
  align-content: center;
  gap: 6px;
  border: 1px solid var(--line);
  border-radius: 999px;
  background: var(--panel);
  box-shadow: var(--shadow);
  color: var(--text);
  font-family: var(--font-sans);
  padding: 8px 12px 9px;
}

.theme-light {
  --panel: linear-gradient(180deg, rgb(255 255 255), rgb(246 246 247));
  --line: rgb(24 24 27 / 0.12);
  --text: rgb(24 24 27);
  --muted: rgb(82 82 91);
  --accent: rgb(217 119 6);
  --track: rgb(228 228 231);
  --thumb: rgb(255 255 255);
  --shadow: 0 10px 22px rgb(15 23 42 / 0.16);
}

.theme-dark {
  --panel: linear-gradient(180deg, rgb(32 32 36), rgb(18 18 21));
  --line: rgb(255 255 255 / 0.14);
  --text: rgb(250 250 250);
  --muted: rgb(161 161 170);
  --accent: rgb(245 158 11);
  --track: rgb(63 63 70);
  --thumb: rgb(250 250 250);
  --shadow: 0 12px 26px rgb(0 0 0 / 0.28);
}

.mini-opacity-panel__meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  min-width: 0;
}

strong {
  overflow: hidden;
  font-size: 12px;
  font-weight: 720;
  letter-spacing: 0;
  text-overflow: ellipsis;
  white-space: nowrap;
}

span {
  color: var(--muted);
  font-family: var(--font-dashboard);
  font-size: 11px;
  font-weight: 760;
  font-variant-numeric: tabular-nums;
}

input {
  appearance: none;
  display: block;
  width: 100%;
  height: 12px;
  accent-color: var(--accent);
  background: transparent;
  cursor: pointer;
}

input::-webkit-slider-runnable-track {
  height: 4px;
  border-radius: 999px;
  background:
    linear-gradient(90deg, var(--accent) var(--slider-progress), transparent 0),
    var(--track);
}

input::-webkit-slider-thumb {
  appearance: none;
  width: 12px;
  height: 12px;
  margin-top: -4px;
  border: 2px solid var(--accent);
  border-radius: 999px;
  background: var(--thumb);
  box-shadow: 0 2px 7px rgb(0 0 0 / 0.18);
}

input:focus-visible {
  outline: none;
}

input:focus-visible::-webkit-slider-thumb {
  box-shadow:
    0 0 0 3px color-mix(in srgb, var(--accent) 24%, transparent),
    0 2px 7px rgb(0 0 0 / 0.18);
}
</style>
