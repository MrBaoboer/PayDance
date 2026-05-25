<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { ExternalLink } from "@lucide/vue";
import { appName, repositoryUrl } from "./lib/app-meta";
import {
  defaultMiniOpacityPercent,
  fullWindowSize,
  miniDefaultSize,
  normalizeMiniOpacityPercent,
  resolveWindowPreferences,
  type WindowSize,
} from "./lib/window-mode";
import { useAppShell } from "./composables/useAppShell";
import { useDashboardModel } from "./composables/useDashboardModel";
import { useSalarySettings } from "./composables/useSalarySettings";
import { useSalaryTicker } from "./composables/useSalaryTicker";
import { useThemeSync } from "./composables/useThemeSync";
import { useWindowStatePersistence } from "./composables/useWindowStatePersistence";
import AppWindow from "./components/AppWindow.vue";
import MiniWindow from "./components/MiniWindow.vue";
import { createBrowserSettingsStore } from "./platform/settings-store";

const previewStore = createBrowserSettingsStore();
const previewWindow = {
  setFocus: async () => {},
  setTheme: async () => {},
  show: async () => {},
};

const {
  amountMode,
  alwaysOnTop,
  config,
  hasCompletedOnboarding,
  isSettingsReady,
  loadSettings,
  saveSettings,
  themeMode,
} = useSalarySettings(() => Promise.resolve(previewStore));

const isMiniMode = ref(false);
const autostartEnabled = ref(false);
const autostartError = ref("");
const isAutostartUpdating = ref(false);
const fullSize = ref<WindowSize>({ ...fullWindowSize });
const miniSize = ref<WindowSize>({ ...miniDefaultSize });
const miniOpacityPercent = ref(defaultMiniOpacityPercent);
const showWebMiniOpacityPanel = ref(false);
const miniPosition = ref({ x: 0, y: 0 });
let clearMiniDrag: (() => void) | null = null;

const { snapshot, startTicker, stopTicker } = useSalaryTicker(config);
const { clearSaveStateTimer, loadWindowPreferences, saveStateNow, scheduleSaveState } =
  useWindowStatePersistence({
    defaultWindowPreferences: resolveWindowPreferences({}),
    fullSize,
    isMiniMode,
    isSettingsReady,
    loadSettings,
    miniOpacityPercent,
    miniSize,
    saveSettings,
  });
const { applyThemeMode, isThemeSwitching, setThemeMode, toggleTheme } = useThemeSync(
  previewWindow,
  themeMode,
  saveStateNow,
);
const setAlwaysOnTop = async (value: boolean) => {
  alwaysOnTop.value = value;
};
const applyWindowMode = async () => {};
const {
  activeView,
  completeOnboarding,
  setMiniMode,
  shouldShowOnboarding,
  showSalaryInfo,
  showSettings,
  toggleMiniMode,
} = useAppShell({
  alwaysOnTop,
  appWindow: previewWindow,
  applyThemeMode,
  applyWindowMode,
  fullSize,
  hasCompletedOnboarding,
  isMiniMode,
  isOpacityPanelWindow: false,
  isSettingsReady,
  saveStateNow,
  setAlwaysOnTop,
  themeMode,
});
const {
  dailyEarnText,
  earnedText,
  firstConfigIssue,
  hasConfigIssues,
  hasIssue,
  middleStat,
  salaryModeLabel,
  statusText,
  workedTimeText,
} = useDashboardModel(config, snapshot);

const shellClass = computed(() =>
  themeMode.value === "dark" ? "theme-dark" : "theme-light",
);
const previewFrameClass = computed(() => [
  shellClass.value,
  activeView.value === "mini" ? "is-mini" : "",
  { "is-theme-syncing": isThemeSwitching.value },
]);
const miniStyle = computed(() => ({
  height: `${miniSize.value.height}px`,
  left: `${miniPosition.value.x}px`,
  top: `${miniPosition.value.y}px`,
  width: `${miniSize.value.width}px`,
}));

const updateMiniOpacityPercent = (value: number, options: { commit?: boolean } = {}) => {
  miniOpacityPercent.value = normalizeMiniOpacityPercent(value);
  if (options.commit) {
    void saveStateNow();
    return;
  }
  scheduleSaveState();
};

const toggleAlwaysOnTop = async () => {
  alwaysOnTop.value = !alwaysOnTop.value;
  await saveStateNow();
};

const resetMiniPosition = () => {
  const width = miniSize.value.width;
  miniPosition.value = {
    x: Math.max(16, Math.round((window.innerWidth - width) / 2)),
    y: 156,
  };
};

const startWebMiniDrag = (event: PointerEvent) => {
  if (event.button !== 0) return;

  showWebMiniOpacityPanel.value = false;
  const startPoint = { x: event.clientX, y: event.clientY };
  const startPosition = { ...miniPosition.value };

  const handleMove = (moveEvent: PointerEvent) => {
    miniPosition.value = {
      x: Math.max(
        12,
        Math.min(
          window.innerWidth - miniSize.value.width - 12,
          startPosition.x + moveEvent.clientX - startPoint.x,
        ),
      ),
      y: Math.max(
        96,
        Math.min(
          window.innerHeight - miniSize.value.height - 24,
          startPosition.y + moveEvent.clientY - startPoint.y,
        ),
      ),
    };
  };
  const handleEnd = () => {
    window.removeEventListener("pointermove", handleMove);
    window.removeEventListener("pointerup", handleEnd);
    clearMiniDrag = null;
  };

  clearMiniDrag = handleEnd;
  window.addEventListener("pointermove", handleMove);
  window.addEventListener("pointerup", handleEnd);
};

const showMiniOpacityPanel = () => {
  showWebMiniOpacityPanel.value = true;
};

watch(config, scheduleSaveState, { deep: true });
watch(isMiniMode, (value) => {
  if (value) {
    resetMiniPosition();
  } else {
    showWebMiniOpacityPanel.value = false;
  }
});

onMounted(async () => {
  const windowPreferences = await loadWindowPreferences();
  isMiniMode.value = windowPreferences.isMiniMode;
  fullSize.value = windowPreferences.fullSize;
  miniSize.value = windowPreferences.miniSize;
  miniOpacityPercent.value = windowPreferences.miniOpacityPercent;
  await applyThemeMode(themeMode.value, { persist: false });
  if (isMiniMode.value) resetMiniPosition();
  startTicker();
});

onBeforeUnmount(() => {
  stopTicker();
  clearSaveStateTimer();
  clearMiniDrag?.();
});
</script>

<template>
  <main class="web-preview" :class="shellClass">
    <header class="web-preview__header">
      <div>
        <strong>{{ appName }} PayDance</strong>
        <span>Web Preview · 在线体验核心计算与界面</span>
      </div>
      <nav class="web-preview__actions" aria-label="网页体验版操作">
        <a href="https://github.com/MasterBao66/PayDance/releases/latest">
          下载 Windows 版
          <ExternalLink :size="15" />
        </a>
        <a :href="repositoryUrl">
          GitHub
          <ExternalLink :size="15" />
        </a>
      </nav>
    </header>

    <section class="web-preview__stage" aria-label="PayDance Web Preview">
      <p class="web-preview__notice">
        网页体验版用于预览薪资计算、首次配置、设置中心和迷你悬浮效果；系统托盘、窗口置顶、开机自启动和原生透明窗口请使用
        Windows 桌面版。
      </p>

      <div
        v-if="activeView !== 'mini'"
        class="app-shell web-preview__frame h-full w-full select-none p-0"
        :class="previewFrameClass"
        @contextmenu.prevent
      >
        <AppWindow
          v-model:always-on-top="alwaysOnTop"
          v-model:amount-mode="amountMode"
          v-model:config="config"
          v-model:show-salary-info="showSalaryInfo"
          v-model:show-settings="showSettings"
          :app-name="appName"
          :autostart-enabled="autostartEnabled"
          :autostart-error="autostartError"
          :daily-earn-text="dailyEarnText"
          :earned-text="earnedText"
          :first-config-issue="firstConfigIssue"
          :has-config-issues="hasConfigIssues"
          :has-issue="hasIssue"
          :is-autostart-updating="isAutostartUpdating"
          :is-theme-switching="isThemeSwitching"
          :middle-stat="middleStat"
          :salary-mode-label="salaryModeLabel"
          :should-show-onboarding="shouldShowOnboarding"
          :show-desktop-features="false"
          :snapshot="snapshot"
          :status-text="statusText"
          :theme-mode="themeMode"
          :worked-time-text="workedTimeText"
          @close="showSettings = false"
          @complete-onboarding="completeOnboarding"
          @drag-start="showWebMiniOpacityPanel = false"
          @minimize="showSettings = false"
          @set-mini-mode="setMiniMode"
          @toggle-always-on-top="toggleAlwaysOnTop"
          @toggle-mini-mode="toggleMiniMode"
          @toggle-settings="showSettings = !showSettings"
          @toggle-theme="toggleTheme"
          @update:autostart-enabled="autostartEnabled = $event"
          @update:theme-mode="setThemeMode"
        />
      </div>

      <div v-else class="web-preview__mini-layer">
        <div class="web-preview__mini-window" :class="shellClass" :style="miniStyle">
          <MiniWindow
            :amount="earnedText"
            :amount-mode="amountMode"
            :opacity-percent="miniOpacityPercent"
            @drag-start="startWebMiniDrag"
            @opacity-menu="showMiniOpacityPanel"
            @restore="setMiniMode(false)"
          />
        </div>

        <section
          v-if="showWebMiniOpacityPanel"
          class="web-mini-opacity"
          :class="shellClass"
          :style="{
            left: `${miniPosition.x + miniSize.width / 2}px`,
            top: `${miniPosition.y + miniSize.height + 12}px`,
          }"
          aria-label="迷你悬浮透明度"
        >
          <div class="web-mini-opacity__header">
            <span>透明度</span>
            <strong>{{ miniOpacityPercent }}%</strong>
          </div>
          <label class="web-mini-opacity__slider" for="web-mini-opacity-range">
            <span class="sr-only">迷你悬浮透明度</span>
            <input
              id="web-mini-opacity-range"
              max="100"
              min="10"
              :value="miniOpacityPercent"
              type="range"
              @input="
                updateMiniOpacityPercent(
                  Number(($event.target as HTMLInputElement).value),
                )
              "
              @change="
                updateMiniOpacityPercent(
                  Number(($event.target as HTMLInputElement).value),
                  { commit: true },
                )
              "
            />
          </label>
        </section>
      </div>
    </section>
  </main>
</template>

<style scoped>
.web-preview {
  min-height: 100%;
  overflow: auto;
  background:
    radial-gradient(circle at 28% 16%, var(--income-accent-glow), transparent 34%),
    var(--panel);
  color: var(--text);
  padding: clamp(18px, 4vw, 36px);
}

.web-preview__header {
  display: flex;
  max-width: 1040px;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  margin: 0 auto clamp(18px, 4vh, 30px);
}

.web-preview__header div {
  display: grid;
  gap: 5px;
}

.web-preview__header strong {
  font-size: clamp(24px, 4vw, 38px);
  font-weight: 780;
  letter-spacing: 0;
}

.web-preview__header span,
.web-preview__notice {
  color: var(--muted);
  font-size: 14px;
  font-weight: 520;
  line-height: 1.65;
}

.web-preview__actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 10px;
}

.web-preview__actions a {
  display: inline-flex;
  height: 38px;
  align-items: center;
  justify-content: center;
  gap: 7px;
  border: 1px solid var(--line);
  border-radius: 999px;
  background: color-mix(in srgb, var(--panel) 78%, transparent);
  padding: 0 15px;
  color: var(--text);
  font-size: 14px;
  font-weight: 700;
  text-decoration: none;
}

.web-preview__stage {
  display: grid;
  min-height: 560px;
  max-width: 1040px;
  place-items: center;
  margin: 0 auto;
  gap: 18px;
}

.web-preview__notice {
  max-width: 780px;
  margin: 0;
  text-align: center;
}

.web-preview__frame {
  width: min(100%, 720px);
  height: min(72vh, 560px);
  min-height: 430px;
  box-shadow: 0 24px 70px rgb(15 23 42 / 0.16);
}

.web-preview__mini-layer {
  position: fixed;
  inset: 0;
  min-height: 100%;
}

.web-preview__mini-window {
  position: fixed;
  z-index: 3;
}

.web-mini-opacity {
  position: fixed;
  z-index: 4;
  display: grid;
  width: 154px;
  gap: 8px;
  border: 1px solid var(--line);
  border-radius: 13px;
  background: var(--panel);
  box-shadow: 0 16px 40px rgb(15 23 42 / 0.16);
  padding: 12px;
  transform: translateX(-50%);
}

.web-mini-opacity__header {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  color: var(--text);
  font-size: 13px;
  font-weight: 760;
}

.web-mini-opacity__slider {
  display: grid;
}

.web-mini-opacity input {
  width: 100%;
  accent-color: var(--income-accent);
}

@media (max-width: 720px) {
  .web-preview__header {
    align-items: flex-start;
    flex-direction: column;
  }

  .web-preview__actions {
    justify-content: flex-start;
  }

  .web-preview__frame {
    height: 620px;
  }
}
</style>
