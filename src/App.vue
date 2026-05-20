<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { Banknote, CircleDollarSign, Clock3, TimerReset, X } from "@lucide/vue";
import {
  validateSalaryConfig,
  type SalaryConfigIssue,
} from "./lib/salary";
import {
  getStatusText,
} from "./lib/shift-display";
import { formatDashboardDuration } from "./lib/duration-format";
import {
  readAutostartEnabled,
  setAutostartEnabled,
  tauriAutostartAdapter,
} from "./lib/autostart";
import {
  miniDefaultSize,
  miniResizeEdgeSize,
  fullWindowSize,
  normalizeFullSize,
  normalizeMiniSize,
  type WindowSize,
} from "./lib/window-mode";
import { appName } from "./lib/app-meta";
import { useSalarySettings } from "./composables/useSalarySettings";
import { useSalaryTicker } from "./composables/useSalaryTicker";
import { useWindowMode } from "./composables/useWindowMode";
import MiniWindow from "./components/MiniWindow.vue";
import IncomeProgress from "./components/IncomeProgress.vue";
import OnboardingPanel from "./components/OnboardingPanel.vue";
import RollingAmount from "./components/RollingAmount.vue";
import SettingsPanel from "./components/SettingsPanel.vue";
import StatsPanel from "./components/StatsPanel.vue";
import WindowTitlebar from "./components/WindowTitlebar.vue";

const appWindow = getCurrentWindow();
type ResizeDirection =
  | "East"
  | "North"
  | "NorthEast"
  | "NorthWest"
  | "South"
  | "SouthEast"
  | "SouthWest"
  | "West";

const {
  amountMode,
  alwaysOnTop,
  config,
  hasCompletedOnboarding,
  isSettingsReady,
  loadSettings,
  saveSettings,
  themeMode,
} = useSalarySettings();

const isMiniMode = ref(false);
const showSettings = ref(false);
const showSalaryInfo = ref(false);
const autostartEnabled = ref(false);
const autostartError = ref("");
const isAutostartUpdating = ref(false);
const fullSize = ref<WindowSize>({ ...fullWindowSize });
const miniSize = ref<WindowSize>({ ...miniDefaultSize });
const { snapshot, startTicker, stopTicker } = useSalaryTicker(config);
const { applyWindowMode, setAlwaysOnTop } = useWindowMode(
  appWindow,
  isMiniMode,
  miniSize,
  fullSize,
  alwaysOnTop,
);

const yuanFormatter = new Intl.NumberFormat("zh-CN", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
  useGrouping: false,
});

const earnedText = computed(() => yuanFormatter.format(snapshot.value.earnedToday));
const dailyEarnText = computed(() => yuanFormatter.format(snapshot.value.dailySalary));
const salaryModeLabel = computed(() => {
  if (config.value.salaryType === "daily") return "日薪模式";
  if (config.value.salaryType === "hourly") return "时薪模式";
  return "月薪模式";
});
const configIssues = computed(() => validateSalaryConfig(config.value));
const firstConfigIssue = computed(() => configIssues.value[0]?.message ?? "");
const hasConfigIssues = computed(() => configIssues.value.length > 0);
const shouldShowOnboarding = computed(() =>
  isSettingsReady.value && !hasCompletedOnboarding.value && !isMiniMode.value,
);
const statusText = computed(() =>
  getStatusText(
    snapshot.value.status,
    snapshot.value.isNightWork,
    hasConfigIssues.value,
  ),
);

const workedTimeText = computed(() => formatDashboardDuration(snapshot.value.elapsedWorkMs));
const middleStat = computed(() => {
  if (hasConfigIssues.value) {
    return { label: "配置待修正", value: "--" };
  }

  if (snapshot.value.status === "rest-day") {
    return { label: "今日休息", value: "0m" };
  }

  if (snapshot.value.status === "before-work") {
    return {
      label: "距离上班",
      value: formatDashboardDuration(snapshot.value.nextTransitionMs),
    };
  }

  if (snapshot.value.status === "lunch-break") {
    return {
      label: "距离复工",
      value: formatDashboardDuration(snapshot.value.nextTransitionMs),
    };
  }

  if (snapshot.value.status === "after-work") {
    return { label: "今日完成", value: "100%" };
  }

  return {
    label: "距离下班",
    value: formatDashboardDuration(snapshot.value.nextTransitionMs),
  };
});

const shellClass = computed(() =>
  themeMode.value === "dark" ? "theme-dark" : "theme-light",
);

const saveState = async () => {
  try {
    await saveSettings({
      fullSize: fullSize.value,
      isMiniMode: isMiniMode.value,
      miniSize: miniSize.value,
    });
  } catch (error) {
    console.error("Failed to save settings", error);
  }
};

let saveStateTimer = 0;
const scheduleSaveState = () => {
  if (!isSettingsReady.value) return;

  window.clearTimeout(saveStateTimer);
  saveStateTimer = window.setTimeout(() => {
    void saveState();
  }, 220);
};

const saveStateNow = async () => {
  window.clearTimeout(saveStateTimer);
  await saveState();
};

const getCurrentWindowSize = () =>
  normalizeFullSize({
    width: window.innerWidth,
    height: window.innerHeight,
  });

const setMiniMode = async (value: boolean) => {
  if (value && !isMiniMode.value) {
    fullSize.value = getCurrentWindowSize();
  }

  isMiniMode.value = value;
  if (value) {
    showSettings.value = false;
  }
  await applyWindowMode();
  await saveStateNow();
};

const toggleMiniMode = () => setMiniMode(!isMiniMode.value);

const toggleTheme = async () => {
  themeMode.value = themeMode.value === "dark" ? "light" : "dark";
  await appWindow.setTheme(themeMode.value);
  await saveStateNow();
};

const setThemeMode = async (mode: "light" | "dark") => {
  themeMode.value = mode;
  await appWindow.setTheme(mode);
  await saveStateNow();
};

const toggleAlwaysOnTop = async () => {
  await setAlwaysOnTop(!alwaysOnTop.value);
  await saveStateNow();
};

const refreshAutostart = async () => {
  const result = await readAutostartEnabled(tauriAutostartAdapter);
  autostartEnabled.value = result.enabled;
  autostartError.value = result.error;
};

const updateAutostartEnabled = async (enabled: boolean) => {
  if (isAutostartUpdating.value) return;

  isAutostartUpdating.value = true;
  const result = await setAutostartEnabled(
    tauriAutostartAdapter,
    enabled,
    autostartEnabled.value,
  );
  autostartEnabled.value = result.enabled;
  autostartError.value = result.error;
  isAutostartUpdating.value = false;
};

const openSettings = async () => {
  showSettings.value = true;
  showSalaryInfo.value = false;
  if (isMiniMode.value) {
    isMiniMode.value = false;
    await applyWindowMode();
  }
  await appWindow.show();
  await appWindow.setFocus();
  await saveStateNow();
};

const completeOnboarding = async (preferences: { startInMiniMode: boolean }) => {
  hasCompletedOnboarding.value = true;
  await appWindow.setTheme(themeMode.value);
  await setAlwaysOnTop(alwaysOnTop.value);

  if (preferences.startInMiniMode) {
    await setMiniMode(true);
    return;
  }

  await saveStateNow();
};

const startDrag = async (event: MouseEvent) => {
  const target = event.target as HTMLElement;
  if (target.closest("button, input, label")) return;

  await appWindow.startDragging();
};

const startResize = async (direction: ResizeDirection) => {
  await appWindow.startResizeDragging(direction);
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

watch(config, scheduleSaveState, { deep: true });
let saveWindowSizeTimer = 0;
const unlisteners: Array<() => void> = [];

onMounted(async () => {
  const windowPreferences = await loadSettings();
  isMiniMode.value = windowPreferences.isMiniMode;
  fullSize.value = windowPreferences.fullSize;
  miniSize.value = windowPreferences.miniSize;
  showSettings.value = false;

  await refreshAutostart();
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
    await appWindow.listen("tray-toggle-mini-mode", () => {
      void toggleMiniMode();
    }),
  );

  unlisteners.push(
    await appWindow.onResized(() => {
      if (!isSettingsReady.value) return;

      window.clearTimeout(saveWindowSizeTimer);
      saveWindowSizeTimer = window.setTimeout(() => {
        const size = {
          width: window.innerWidth,
          height: window.innerHeight,
        };

        if (isMiniMode.value) {
          miniSize.value = normalizeMiniSize(size);
        } else {
          fullSize.value = normalizeFullSize(size);
        }
        void saveStateNow();
      }, 180);
    }),
  );

  startTicker();
});

onBeforeUnmount(() => {
  stopTicker();
  window.clearTimeout(saveStateTimer);
  window.clearTimeout(saveWindowSizeTimer);
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
      :amount-mode="amountMode"
      @drag-start="startMiniDrag"
      @restore="setMiniMode(false)"
    />

    <div v-else class="app-window" :aria-label="appName">
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
          <p>今日入账</p>
        </div>

        <button class="amount-display" title="双击进入迷你悬浮模式" @dblclick="setMiniMode(true)">
          <RollingAmount :mode="amountMode" :value="earnedText" />
        </button>

        <div class="hero-controls">
          <section class="hero-dashboard" aria-label="今日收入仪表盘">
            <StatsPanel
              :expected-earn="dailyEarnText"
              :middle-label="middleStat.label"
              :middle-value="middleStat.value"
              :worked-time="workedTimeText"
            />

            <IncomeProgress :is-working="snapshot.isWorking" :progress="snapshot.progress" />
          </section>

          <button class="salary-info-button salary-info-button--quiet" @click="showSalaryInfo = true">
            薪资说明
          </button>
        </div>
      </section>

      <Transition name="settings-sheet">
        <div v-if="showSettings" class="settings-overlay settings-overlay--top" @click.self="showSettings = false">
          <section class="settings-sheet settings-sheet--top" aria-label="设置中心">
            <header class="settings-sheet__header">
              <div>
                <strong>设置</strong>
              </div>
              <button class="sheet-close-button" title="关闭设置" @click="showSettings = false">
                <X :size="16" />
              </button>
            </header>
            <div class="settings-sheet__body">
              <SettingsPanel
                v-model:amount-mode="amountMode"
                v-model:config="config"
                :autostart-enabled="autostartEnabled"
                :autostart-error="autostartError"
                :first-issue="firstConfigIssue"
                :has-issue="hasIssue"
                :is-autostart-updating="isAutostartUpdating"
                @update:autostart-enabled="updateAutostartEnabled"
              />
            </div>
          </section>
        </div>
      </Transition>

      <Transition name="settings-sheet">
        <div v-if="showSalaryInfo" class="settings-overlay" @click.self="showSalaryInfo = false">
          <section class="settings-sheet" aria-label="薪资说明">
            <header class="settings-sheet__header">
              <div>
                <strong>薪资说明</strong>
                <span>{{ salaryModeLabel }}换算</span>
              </div>
              <button class="sheet-close-button" title="关闭薪资说明" @click="showSalaryInfo = false">
                <X :size="16" />
              </button>
            </header>
            <div class="salary-info-grid">
              <article class="salary-info-card">
                <CircleDollarSign :size="24" />
                <span>日薪</span>
                <strong>¥{{ snapshot.dailySalary.toFixed(2) }}</strong>
              </article>
              <article class="salary-info-card">
                <Banknote :size="24" />
                <span>时薪</span>
                <strong>¥{{ snapshot.hourlyRate.toFixed(2) }}</strong>
              </article>
              <article class="salary-info-card">
                <Clock3 :size="24" />
                <span>分薪</span>
                <strong>¥{{ snapshot.minuteRate.toFixed(2) }}</strong>
              </article>
              <article class="salary-info-card">
                <TimerReset :size="24" />
                <span>秒薪</span>
                <strong>¥{{ snapshot.secondRate.toFixed(4) }}</strong>
              </article>
            </div>
          </section>
        </div>
      </Transition>

      <OnboardingPanel
        v-if="shouldShowOnboarding"
        v-model:always-on-top="alwaysOnTop"
        v-model:config="config"
        :autostart-enabled="autostartEnabled"
        :theme-mode="themeMode"
        @complete="completeOnboarding"
        @drag-start="startDrag"
        @resize-start="startResize"
        @update:autostart-enabled="updateAutostartEnabled"
        @update:theme-mode="setThemeMode"
      />
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
  --income-accent: rgb(217 119 6);
  --income-accent-bright: rgb(245 158 11);
  --income-accent-glow: rgb(217 119 6 / 0.16);
  --income-accent-ring: rgb(217 119 6 / 0.22);
  --income-accent-shadow: rgb(217 119 6 / 0.26);
  --danger: rgb(239 68 68);
  --mini-panel: rgb(255 255 255 / 0.72);
  --onboarding-overlay: rgb(0 0 0 / 0.2);
  --onboarding-panel: rgb(255 255 255 / 0.94);
  --onboarding-border: rgb(255 255 255 / 0.9);
  --dashboard-panel: rgb(255 255 255 / 0.5);
  --dashboard-metric-bg: rgb(255 255 255 / 0.28);
  --dashboard-border: rgb(255 255 255 / 0.72);
  --dashboard-divider: rgb(24 24 27 / 0.08);
  --dashboard-shadow: 0 16px 42px rgb(15 23 42 / 0.1);
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
  --income-accent: rgb(245 158 11);
  --income-accent-bright: rgb(251 191 36);
  --income-accent-glow: rgb(245 158 11 / 0.2);
  --income-accent-ring: rgb(245 158 11 / 0.18);
  --income-accent-shadow: rgb(245 158 11 / 0.24);
  --danger: rgb(248 113 113);
  --mini-panel: rgb(24 24 27 / 0.7);
  --onboarding-overlay: rgb(0 0 0 / 0.34);
  --onboarding-panel: rgb(24 24 27 / 0.92);
  --onboarding-border: rgb(255 255 255 / 0.16);
  --dashboard-panel: rgb(20 20 23 / 0.54);
  --dashboard-metric-bg: rgb(255 255 255 / 0.055);
  --dashboard-border: rgb(255 255 255 / 0.12);
  --dashboard-divider: rgb(255 255 255 / 0.07);
  --dashboard-shadow: 0 18px 42px rgb(0 0 0 / 0.24);
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
  container-type: size;
  backdrop-filter: blur(28px);
  --ui-font-xs: clamp(12px, calc(10.4px + 0.42cqw), 14px);
  --ui-font-sm: clamp(13px, calc(10.8px + 0.52cqw), 15px);
  --ui-font-md: clamp(14px, calc(11px + 0.7cqw), 17px);
  --ui-font-lg: clamp(17px, calc(12px + 1.18cqw), 21px);
  --ui-radius-sm: clamp(8px, 2.1cqw, 10px);
  --ui-radius-md: clamp(10px, 2.7cqw, 13px);
  --ui-gap-xs: clamp(5px, 1.35cqw, 8px);
  --ui-gap-sm: clamp(8px, 2.1cqw, 12px);
  --ui-gap-md: clamp(12px, 3.2cqw, 18px);
  --ui-pad-sm: clamp(10px, 2.6cqw, 14px);
  --ui-pad-md: clamp(16px, 4.3cqw, 22px);
  --hero-top-pad: clamp(24px, 7.2cqh, 40px);
  --hero-side-pad: clamp(24px, 7.2cqw, 38px);
  --hero-bottom-pad: clamp(18px, 5cqh, 28px);
  --hero-amount-gap: clamp(16px, 5.2cqh, 30px);
  --hero-dashboard-gap: clamp(24px, 7cqh, 42px);
  --salary-info-offset: clamp(15px, 3.7cqh, 22px);
}

.is-mini {
  padding: 4px;
}

.hero-panel {
  display: flex;
  min-height: 0;
  flex: 1;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--hero-top-pad) var(--hero-side-pad) var(--hero-bottom-pad);
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
  font-size: var(--ui-font-lg);
  font-weight: 700;
  width: 100%;
}

.amount-display {
  display: grid;
  width: min(100% - clamp(24px, 7cqw, 64px), 390px);
  place-items: center;
  margin-top: var(--hero-amount-gap);
  color: var(--text);
}

.hero-controls {
  display: grid;
  width: min(100%, 424px);
  gap: var(--ui-gap-sm);
  justify-items: stretch;
  margin-top: var(--hero-dashboard-gap);
}

.hero-dashboard {
  display: grid;
  width: 100%;
  gap: clamp(10px, 2.6cqh, 14px);
  border: 1px solid var(--dashboard-border);
  border-radius: clamp(14px, 3.6cqw, 18px);
  background: var(--dashboard-panel);
  box-shadow: var(--dashboard-shadow);
  padding: clamp(12px, 3.2cqh, 16px);
}

.theme-dark .hero-dashboard {
  background:
    linear-gradient(180deg, rgb(255 255 255 / 0.06), rgb(255 255 255 / 0.018)),
    var(--dashboard-panel);
}

.rate-grid {
  display: grid;
  width: 100%;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--ui-gap-sm);
  margin-top: var(--hero-amount-gap);
}

.rate-card {
  display: grid;
  min-width: 0;
  gap: var(--ui-gap-xs);
  place-items: center;
  padding: var(--ui-pad-sm);
  border: 1px solid var(--line);
  border-radius: var(--ui-radius-md);
  background: var(--panel-soft);
  box-shadow: 0 8px 24px rgb(15 23 42 / 0.05);
  text-align: center;
}

.salary-info-button {
  height: clamp(26px, 6.3cqh, 32px);
  justify-self: center;
  margin-top: var(--salary-info-offset);
  border: 0;
  border-radius: var(--ui-radius-sm);
  background: transparent;
  padding: 0 clamp(9px, 2.4cqw, 13px);
  color: var(--muted);
  font-size: var(--ui-font-xs);
  font-weight: 650;
  transition:
    background-color 160ms ease,
    color 160ms ease,
    transform 160ms ease;
}

.salary-info-button:hover {
  background: var(--subtle);
  color: var(--income-accent);
}

.salary-info-button:active {
  transform: scale(0.98);
}

.rate-card svg,
.rate-card span {
  color: var(--muted);
}

.rate-card span {
  font-size: var(--ui-font-sm);
  font-weight: 600;
}

.rate-card strong {
  overflow: hidden;
  color: var(--text);
  font-family: var(--font-mono);
  font-size: var(--ui-font-md);
  font-weight: 650;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}

.salary-info-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--ui-gap-sm);
  padding: var(--ui-pad-md);
}

.salary-info-card {
  display: grid;
  min-width: 0;
  place-items: center;
  gap: var(--ui-gap-xs);
  border: 1px solid var(--line);
  border-radius: var(--ui-radius-md);
  background: var(--panel-soft);
  padding: var(--ui-pad-md) var(--ui-pad-sm);
  text-align: center;
}

.salary-info-card svg,
.salary-info-card span {
  color: var(--muted);
}

.salary-info-card span {
  font-size: var(--ui-font-sm);
  font-weight: 650;
}

.salary-info-card strong {
  overflow: hidden;
  max-width: 100%;
  color: var(--text);
  font-family: var(--font-mono);
  font-size: var(--ui-font-md);
  font-weight: 700;
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

.settings-overlay--top {
  align-items: flex-start;
}

.settings-sheet {
  display: flex;
  width: 100%;
  max-height: calc(100% - clamp(28px, 7cqh, 38px));
  flex-direction: column;
  overflow: hidden;
  border-top: 1px solid var(--border);
  border-radius: 18px 18px 20px 20px;
  background: var(--panel);
  box-shadow: 0 -18px 48px rgb(15 23 42 / 0.18);
}

.settings-sheet--top {
  border-top: 0;
  border-bottom: 1px solid var(--border);
  border-radius: 20px 20px 18px 18px;
  box-shadow: 0 18px 48px rgb(15 23 42 / 0.18);
}

.settings-sheet__header {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: space-between;
  gap: var(--ui-gap-md);
  border-bottom: 1px solid var(--line);
  padding: var(--ui-pad-md);
}

.settings-sheet__header div {
  display: grid;
  min-width: 0;
  text-align: left;
}

.settings-sheet__header strong {
  color: var(--text);
  font-size: var(--ui-font-lg);
  font-weight: 750;
}

.settings-sheet__header span {
  color: var(--muted);
  font-size: var(--ui-font-sm);
  font-weight: 500;
}

.sheet-close-button {
  display: grid;
  width: clamp(30px, 7.2cqw, 36px);
  height: clamp(30px, 7.2cqw, 36px);
  flex: 0 0 auto;
  place-items: center;
  border-radius: var(--ui-radius-sm);
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

.settings-sheet-enter-from .settings-sheet--top,
.settings-sheet-leave-to .settings-sheet--top {
  transform: translateY(-22px);
}

</style>
