<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { LazyStore } from "@tauri-apps/plugin-store";
import { LogicalSize } from "@tauri-apps/api/dpi";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { HandCoins, TimerReset, X, Zap } from "lucide-vue-next";
import {
  calculateSalarySnapshot,
  defaultSalaryConfig,
  validateSalaryConfig,
  type SalaryConfigIssue,
  type SalaryConfig,
  type SalarySnapshot,
} from "./lib/salary";
import MiniWindow from "./components/MiniWindow.vue";
import IncomeProgress from "./components/IncomeProgress.vue";
import RollingAmount from "./components/RollingAmount.vue";
import SettingsPanel from "./components/SettingsPanel.vue";
import StatsPanel from "./components/StatsPanel.vue";
import WindowTitlebar from "./components/WindowTitlebar.vue";

type ThemeMode = "light" | "dark";
type WindowSize = {
  width: number;
  height: number;
};

const store = new LazyStore("salary-settings.json");
const appWindow = getCurrentWindow();
const settingsSchemaVersion = 1;
const fullWindowWidth = 468;
const fullWindowMinWidth = 420;
const compactWindowHeight = 432;
const compactWindowMinHeight = 390;
const miniDefaultSize: WindowSize = { width: 238, height: 86 };
const miniMinSize: WindowSize = { width: 168, height: 58 };
const miniResizeEdgeSize = 12;

const config = ref<SalaryConfig>({ ...defaultSalaryConfig });
const alwaysOnTop = ref(false);
const isMiniMode = ref(false);
const showSettings = ref(false);
const themeMode = ref<ThemeMode>("light");
const miniSize = ref<WindowSize>({ ...miniDefaultSize });
const isReady = ref(false);

const snapshot = ref<SalarySnapshot>(
  calculateSalarySnapshot(new Date(), config.value),
);

const yuanFormatter = new Intl.NumberFormat("zh-CN", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const earnedText = computed(() => yuanFormatter.format(snapshot.value.earnedToday));
const dailyTotalText = computed(() => yuanFormatter.format(snapshot.value.dailySalary));
const remainingEarnText = computed(() =>
  yuanFormatter.format(Math.max(0, snapshot.value.dailySalary - snapshot.value.earnedToday)),
);
const configIssues = computed(() => validateSalaryConfig(config.value));
const firstConfigIssue = computed(() => configIssues.value[0]?.message ?? "");
const hasConfigIssues = computed(() => configIssues.value.length > 0);
const statusText = computed(() => {
  if (hasConfigIssues.value) return "配置待修正";
  return snapshot.value.isWorking ? "正在上班" : "休息时间";
});

const formatDuration = (ms: number) => {
  if (!Number.isFinite(ms) || ms <= 0) return "0m";

  const totalMinutes = Math.floor(ms / 60_000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours <= 0) return `${minutes}m`;
  if (minutes <= 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
};

const workedTimeText = computed(() => formatDuration(snapshot.value.elapsedWorkMs));
const remainingTimeText = computed(() =>
  formatDuration(snapshot.value.workMsToday - snapshot.value.elapsedWorkMs),
);

const shellClass = computed(() =>
  themeMode.value === "dark" ? "theme-dark" : "theme-light",
);

const saveState = async () => {
  if (!isReady.value) return;

  await store.set("config", config.value);
  await store.set("alwaysOnTop", alwaysOnTop.value);
  await store.set("isMiniMode", isMiniMode.value);
  await store.set("showSettings", showSettings.value);
  await store.set("themeMode", themeMode.value);
  await store.set("miniSize", miniSize.value);
  await store.set("settingsVersion", settingsSchemaVersion);
  await store.save();
};

const normalizeMiniSize = (size: Partial<WindowSize> | null | undefined): WindowSize => ({
  width: Math.max(miniMinSize.width, Math.round(size?.width ?? miniDefaultSize.width)),
  height: Math.max(miniMinSize.height, Math.round(size?.height ?? miniDefaultSize.height)),
});

const applyWindowMode = async () => {
  await appWindow.setResizable(true);

  if (isMiniMode.value) {
    const size = normalizeMiniSize(miniSize.value);
    miniSize.value = size;
    await appWindow.setMinSize(new LogicalSize(miniMinSize.width, miniMinSize.height));
    await appWindow.setSize(new LogicalSize(size.width, size.height));
    await appWindow.setAlwaysOnTop(true);
    alwaysOnTop.value = true;
    return;
  }

  await appWindow.setMinSize(
    new LogicalSize(
      fullWindowMinWidth,
      compactWindowMinHeight,
    ),
  );
  await appWindow.setSize(
    new LogicalSize(fullWindowWidth, compactWindowHeight),
  );
  await appWindow.setAlwaysOnTop(alwaysOnTop.value);
};

const setMiniMode = async (value: boolean) => {
  isMiniMode.value = value;
  if (value) {
    showSettings.value = false;
  }
  await applyWindowMode();
  await saveState();
};

const toggleMiniMode = () => setMiniMode(!isMiniMode.value);

const toggleTheme = async () => {
  themeMode.value = themeMode.value === "dark" ? "light" : "dark";
  await appWindow.setTheme(themeMode.value);
  await saveState();
};

const toggleAlwaysOnTop = async () => {
  alwaysOnTop.value = !alwaysOnTop.value;
  await appWindow.setAlwaysOnTop(alwaysOnTop.value);
  await saveState();
};

const openSettings = async () => {
  showSettings.value = true;
  if (isMiniMode.value) {
    isMiniMode.value = false;
    await applyWindowMode();
  }
  await appWindow.show();
  await appWindow.setFocus();
  await saveState();
};

const startDrag = async (event: MouseEvent) => {
  const target = event.target as HTMLElement;
  if (target.closest("button, input, label")) return;

  await appWindow.startDragging();
};

const hasIssue = (field: SalaryConfigIssue["field"]) =>
  configIssues.value.some((issue) => issue.field === field);

let clearMiniDragListeners: (() => void) | undefined;

const clearMiniDrag = () => {
  clearMiniDragListeners?.();
  clearMiniDragListeners = undefined;
};

const isNearResizeEdge = (event: PointerEvent) => {
  const target = event.currentTarget as HTMLElement | null;
  const rect = target?.getBoundingClientRect();
  if (!rect) return false;

  return (
    event.clientX - rect.left <= miniResizeEdgeSize ||
    rect.right - event.clientX <= miniResizeEdgeSize ||
    event.clientY - rect.top <= miniResizeEdgeSize ||
    rect.bottom - event.clientY <= miniResizeEdgeSize
  );
};

const startMiniDrag = (event: PointerEvent) => {
  if (event.button !== 0 || event.detail > 1) return;
  if (isNearResizeEdge(event)) return;

  const startX = event.screenX;
  const startY = event.screenY;

  const handlePointerMove = (moveEvent: PointerEvent) => {
    const distance = Math.hypot(moveEvent.screenX - startX, moveEvent.screenY - startY);
    if (distance < 4) return;

    clearMiniDrag();
    void appWindow.startDragging();
  };

  const handlePointerEnd = () => clearMiniDrag();

  clearMiniDrag();
  window.addEventListener("pointermove", handlePointerMove);
  window.addEventListener("pointerup", handlePointerEnd, { once: true });
  window.addEventListener("pointercancel", handlePointerEnd, { once: true });

  clearMiniDragListeners = () => {
    window.removeEventListener("pointermove", handlePointerMove);
    window.removeEventListener("pointerup", handlePointerEnd);
    window.removeEventListener("pointercancel", handlePointerEnd);
  };
};

watch(config, saveState, { deep: true });
watch(showSettings, async () => {
  if (!isReady.value || isMiniMode.value) return;
  await saveState();
});

let rafId = 0;
let saveMiniSizeTimer = 0;
const unlisteners: Array<() => void> = [];

const startTicker = () => {
  const baseWallTime = Date.now();
  const basePerfTime = performance.now();

  const tick = (perfTime: number) => {
    const now = new Date(baseWallTime + perfTime - basePerfTime);
    snapshot.value = calculateSalarySnapshot(now, config.value);
    rafId = requestAnimationFrame(tick);
  };

  rafId = requestAnimationFrame(tick);
};

onMounted(async () => {
  const savedConfig = await store.get<SalaryConfig>("config");
  const savedTop = await store.get<boolean>("alwaysOnTop");
  const savedTheme = await store.get<ThemeMode>("themeMode");
  const savedMiniSize = await store.get<WindowSize>("miniSize");
  const savedSettingsVersion = await store.get<number>("settingsVersion");

  if (savedConfig) {
    config.value = { ...defaultSalaryConfig, ...savedConfig };
  }

  if (savedSettingsVersion !== settingsSchemaVersion) {
    miniSize.value = normalizeMiniSize(savedMiniSize);
  }

  if (typeof savedTop === "boolean") {
    alwaysOnTop.value = savedTop;
  }

  isMiniMode.value = false;
  showSettings.value = false;

  if (savedTheme === "dark" || savedTheme === "light") {
    themeMode.value = savedTheme;
  }

  miniSize.value = normalizeMiniSize(savedMiniSize);

  await appWindow.setTheme(themeMode.value);
  await applyWindowMode();

  unlisteners.push(
    await appWindow.onCloseRequested(async (event) => {
      event.preventDefault();
      await appWindow.hide();
    }),
  );

  unlisteners.push(
    await appWindow.listen("tray-open-settings", () => {
      void openSettings();
    }),
  );

  unlisteners.push(
    await appWindow.listen("tray-toggle-always-on-top", () => {
      void toggleAlwaysOnTop();
    }),
  );

  unlisteners.push(
    await appWindow.onResized(() => {
      if (!isReady.value || !isMiniMode.value) return;

      window.clearTimeout(saveMiniSizeTimer);
      saveMiniSizeTimer = window.setTimeout(() => {
        miniSize.value = normalizeMiniSize({
          width: window.innerWidth,
          height: window.innerHeight,
        });
        void saveState();
      }, 180);
    }),
  );

  isReady.value = true;
  startTicker();
});

onBeforeUnmount(() => {
  cancelAnimationFrame(rafId);
  window.clearTimeout(saveMiniSizeTimer);
  clearMiniDrag();
  for (const unlisten of unlisteners) {
    unlisten();
  }
});
</script>

<template>
  <main
    class="h-full w-full select-none bg-transparent p-2"
    :class="[shellClass, isMiniMode ? 'is-mini' : '']"
  >
    <MiniWindow
      v-if="isMiniMode"
      :amount="earnedText"
      @drag-start="startMiniDrag"
      @restore="setMiniMode(false)"
    />

    <div v-else class="app-window">
      <WindowTitlebar
        :always-on-top="alwaysOnTop"
        :has-config-issues="hasConfigIssues"
        :status-text="statusText"
        :theme-mode="themeMode"
        @close="appWindow.close()"
        @drag-start="startDrag"
        @minimize="appWindow.minimize()"
        @toggle-always-on-top="toggleAlwaysOnTop"
        @toggle-mini-mode="toggleMiniMode"
        @toggle-settings="showSettings = !showSettings"
        @toggle-theme="toggleTheme"
      />

      <section class="hero-panel">
        <div class="hero-meta">
          <p>今天我已经挣了</p>
        </div>

        <button class="amount-display" title="双击进入迷你悬浮模式" @dblclick="setMiniMode(true)">
          <RollingAmount :value="earnedText" />
        </button>

        <StatsPanel
          :daily-total="dailyTotalText"
          :remaining-earn="remainingEarnText"
          :remaining-time="remainingTimeText"
          :worked-time="workedTimeText"
        />

        <IncomeProgress :is-working="snapshot.isWorking" :progress="snapshot.progress" />

        <div class="rate-grid">
          <article class="rate-card">
            <HandCoins :size="23" />
            <span>时薪</span>
            <strong>¥{{ snapshot.hourlyRate.toFixed(2) }}</strong>
          </article>
          <article class="rate-card">
            <TimerReset :size="23" />
            <span>分薪</span>
            <strong>¥{{ snapshot.minuteRate.toFixed(2) }}</strong>
          </article>
          <article class="rate-card">
            <Zap :size="23" />
            <span>秒薪</span>
            <strong>¥{{ snapshot.secondRate.toFixed(4) }}</strong>
          </article>
        </div>
      </section>

      <Transition name="settings-sheet">
        <div v-if="showSettings" class="settings-overlay" @click.self="showSettings = false">
          <section class="settings-sheet" aria-label="设置中心">
            <header class="settings-sheet__header">
              <div>
                <strong>设置</strong>
                <span>薪资和工作时间</span>
              </div>
              <button class="sheet-close-button" title="关闭设置" @click="showSettings = false">
                <X :size="16" />
              </button>
            </header>
            <div class="settings-sheet__body">
              <SettingsPanel
                v-model:config="config"
                :first-issue="firstConfigIssue"
                :has-issue="hasIssue"
              />
            </div>
          </section>
        </div>
      </Transition>
    </div>
  </main>
</template>

<style scoped>
.theme-light {
  --panel: rgb(255 255 255 / 0.82);
  --panel-soft: rgb(255 255 255 / 0.62);
  --border: rgb(255 255 255 / 0.82);
  --line: rgb(228 228 231 / 0.88);
  --text: rgb(24 24 27);
  --muted: rgb(113 113 122);
  --subtle: rgb(244 244 245 / 0.94);
  --accent: rgb(24 24 27);
  --danger: rgb(239 68 68);
  --shadow: 0 24px 70px rgb(15 23 42 / 0.18);
}

.theme-dark {
  --panel: rgb(24 24 27 / 0.8);
  --panel-soft: rgb(39 39 42 / 0.58);
  --border: rgb(255 255 255 / 0.12);
  --line: rgb(255 255 255 / 0.1);
  --text: rgb(250 250 250);
  --muted: rgb(161 161 170);
  --subtle: rgb(63 63 70 / 0.78);
  --accent: rgb(250 250 250);
  --danger: rgb(248 113 113);
  --shadow: 0 26px 80px rgb(0 0 0 / 0.38);
}

.app-window {
  position: relative;
  display: flex;
  height: 100%;
  overflow: hidden;
  flex-direction: column;
  border: 1px solid var(--border);
  border-radius: 22px;
  background: var(--panel);
  box-shadow: var(--shadow);
  color: var(--text);
  backdrop-filter: blur(28px);
}

.hero-panel {
  display: flex;
  min-height: 334px;
  flex: 1;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 26px 32px 28px;
  text-align: center;
}

.hero-meta {
  display: flex;
  width: 100%;
  align-items: center;
  justify-content: center;
  color: var(--muted);
  text-align: center;
}

.hero-meta p {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  width: 100%;
}

.amount-display {
  display: grid;
  max-width: 100%;
  place-items: center;
  margin-top: 26px;
  color: var(--text);
}

.rate-grid {
  display: grid;
  width: 100%;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  margin-top: 26px;
}

.rate-card {
  display: grid;
  min-width: 0;
  gap: 5px;
  place-items: center;
  padding: 13px;
  border: 1px solid var(--line);
  border-radius: 12px;
  background: var(--panel-soft);
  box-shadow: 0 8px 24px rgb(15 23 42 / 0.05);
  text-align: center;
}

.rate-card svg,
.rate-card span {
  color: var(--muted);
}

.rate-card span {
  font-size: 14px;
  font-weight: 600;
}

.rate-card strong {
  overflow: hidden;
  color: var(--text);
  font-family: var(--font-mono);
  font-size: 16px;
  font-weight: 650;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}

.settings-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: flex-end;
  border-radius: inherit;
  background: rgb(0 0 0 / 0.16);
  backdrop-filter: blur(6px);
  z-index: 10;
}

.settings-sheet {
  display: flex;
  width: 100%;
  max-height: calc(100% - 34px);
  flex-direction: column;
  overflow: hidden;
  border-top: 1px solid var(--border);
  border-radius: 18px 18px 20px 20px;
  background: var(--panel);
  box-shadow: 0 -18px 48px rgb(15 23 42 / 0.18);
}

.settings-sheet__header {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  border-bottom: 1px solid var(--line);
  padding: 14px 16px 12px 18px;
}

.settings-sheet__header div {
  display: grid;
  gap: 3px;
  min-width: 0;
  text-align: left;
}

.settings-sheet__header strong {
  color: var(--text);
  font-size: 17px;
  font-weight: 750;
}

.settings-sheet__header span {
  color: var(--muted);
  font-size: 14px;
  font-weight: 500;
}

.sheet-close-button {
  display: grid;
  width: 32px;
  height: 32px;
  flex: 0 0 auto;
  place-items: center;
  border-radius: 9px;
  color: var(--muted);
  transition:
    background-color 160ms ease,
    color 160ms ease,
    transform 160ms ease;
}

.sheet-close-button:hover {
  background: var(--subtle);
  color: var(--text);
}

.sheet-close-button:active {
  transform: scale(0.96);
}

.settings-sheet__body {
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  padding: 0;
  scrollbar-gutter: stable;
}

.settings-sheet__body::-webkit-scrollbar {
  width: 10px;
}

.settings-sheet__body::-webkit-scrollbar-thumb {
  border: 3px solid transparent;
  border-radius: 999px;
  background: color-mix(in srgb, var(--muted) 48%, transparent);
  background-clip: content-box;
}

.settings-sheet-enter-active,
.settings-sheet-leave-active {
  transition:
    opacity 180ms ease,
    backdrop-filter 180ms ease;
}

.settings-sheet-enter-active .settings-sheet,
.settings-sheet-leave-active .settings-sheet {
  transition:
    opacity 220ms ease,
    transform 220ms cubic-bezier(0.2, 0.72, 0.28, 1);
}

.settings-sheet-enter-from,
.settings-sheet-leave-to {
  opacity: 0;
  backdrop-filter: blur(0);
}

.settings-sheet-enter-from .settings-sheet,
.settings-sheet-leave-to .settings-sheet {
  opacity: 0;
  transform: translateY(22px);
}

</style>
