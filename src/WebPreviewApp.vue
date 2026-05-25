<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { ExternalLink } from "@lucide/vue";
import productLogoUrl from "../src-tauri/icons/icon.png";
import { appEnglishName, appName, appVersion, repositoryUrl } from "./lib/app-meta";
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
const miniStagePaddingX = 34;
const miniStageHeight = 188;
const miniStageTop = 52;

const getMiniStageWidth = () => miniSize.value.width + miniStagePaddingX * 2;

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
const miniLayerStyle = computed(() => ({
  "--mini-stage-height": `${miniStageHeight}px`,
  "--mini-stage-width": `${getMiniStageWidth()}px`,
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
  const previewWidth = getMiniStageWidth();
  miniPosition.value = {
    x: Math.max(16, Math.round((previewWidth - width) / 2)),
    y: miniStageTop,
  };
};

const startWebMiniDrag = (event: PointerEvent) => {
  if (event.button !== 0) return;

  showWebMiniOpacityPanel.value = false;
  const startPoint = { x: event.clientX, y: event.clientY };
  const startPosition = { ...miniPosition.value };

  const handleMove = (moveEvent: PointerEvent) => {
    const previewWidth = getMiniStageWidth();
    miniPosition.value = {
      x: Math.max(
        12,
        Math.min(
          previewWidth - miniSize.value.width - 12,
          startPosition.x + moveEvent.clientX - startPoint.x,
        ),
      ),
      y: Math.max(
        18,
        Math.min(
          miniStageHeight - miniSize.value.height - 18,
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
    <header class="web-preview__topbar" aria-label="产品信息">
      <a class="web-preview__brand" :href="repositoryUrl">
        <img :src="productLogoUrl" alt="" aria-hidden="true" />
        <span>{{ appName }} {{ appEnglishName }}</span>
      </a>
      <span class="web-preview__version">v{{ appVersion }}</span>
    </header>

    <section class="web-preview__hero" aria-label="PayDance Web Preview">
      <div class="web-preview__copy">
        <h1>看见每一秒的收入跳动。</h1>
        <p class="web-preview__lead">
          配置薪资与作息，今日入账会在桌面上实时增长。网页端可预览核心体验，完整桌面能力请下载
          Windows 版。
        </p>

        <nav class="web-preview__actions" aria-label="网页体验版操作">
          <a
            class="web-preview__action web-preview__action--primary"
            href="https://github.com/MasterBao66/PayDance/releases/latest"
          >
            下载 Windows 版
            <ExternalLink :size="15" />
          </a>
          <a class="web-preview__action web-preview__action--quiet" :href="repositoryUrl">
            GitHub
            <ExternalLink :size="15" />
          </a>
        </nav>

        <dl class="web-preview__chips" aria-label="产品核心优势">
          <div class="web-preview__chip">
            <dt>实时入账</dt>
            <dd>金额随工作时间增长</dd>
          </div>
          <div class="web-preview__chip">
            <dt>迷你悬浮</dt>
            <dd>角落常驻，少打扰</dd>
          </div>
          <div class="web-preview__chip">
            <dt>本地保存</dt>
            <dd>无账号，无遥测</dd>
          </div>
        </dl>
      </div>

      <div id="paydance-preview" class="web-preview__showcase">
        <div class="web-preview__showcase-header">
          <span>{{ appName }} {{ appEnglishName }}</span>
          <strong>网页体验版</strong>
        </div>

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

        <div v-else class="web-preview__mini-layer" :style="miniLayerStyle">
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

        <p class="web-preview__notice">
          Web Preview 只用于预览核心体验；完整桌面能力请使用 Windows 桌面版。
        </p>
      </div>
    </section>
  </main>
</template>

<style scoped>
.web-preview {
  --web-page-bg: rgb(247 247 245);
  --web-surface: rgb(255 255 255 / 0.72);
  --web-surface-strong: rgb(255 255 255 / 0.92);
  --web-border: rgb(24 24 27 / 0.11);
  --web-shadow: 0 28px 84px rgb(24 24 27 / 0.13);
  min-height: 100%;
  overflow: auto;
  background:
    radial-gradient(
      circle at 76% 26%,
      color-mix(in srgb, var(--income-accent) 13%, transparent) 0,
      transparent 30%
    ),
    linear-gradient(
      145deg,
      rgb(250 250 249) 0%,
      var(--web-page-bg) 48%,
      rgb(239 238 234) 100%
    );
  color: var(--text);
  padding: clamp(20px, 4vw, 44px);
}

.theme-dark.web-preview {
  --web-page-bg: rgb(12 12 14);
  --web-surface: rgb(24 24 27 / 0.72);
  --web-surface-strong: rgb(32 32 36 / 0.92);
  --web-border: rgb(255 255 255 / 0.11);
  --web-shadow: 0 30px 88px rgb(0 0 0 / 0.38);
  background:
    radial-gradient(
      circle at 75% 24%,
      color-mix(in srgb, var(--income-accent) 9%, transparent) 0,
      transparent 28%
    ),
    linear-gradient(145deg, rgb(13 13 15) 0%, var(--web-page-bg) 58%, rgb(19 18 17) 100%);
}

.web-preview__topbar {
  position: relative;
  z-index: 2;
  display: flex;
  max-width: 1120px;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  margin: 0 auto clamp(34px, 6vw, 76px);
}

.web-preview__brand {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  color: var(--text);
  font-size: 15px;
  font-weight: 820;
  text-decoration: none;
}

.web-preview__brand img {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  box-shadow: 0 10px 24px rgb(24 24 27 / 0.12);
}

.web-preview__version {
  border: 1px solid var(--web-border);
  border-radius: 999px;
  background: var(--web-surface);
  padding: 7px 12px;
  color: var(--muted);
  font-size: 12px;
  font-weight: 760;
}

.web-preview__hero {
  display: grid;
  min-height: calc(100vh - clamp(112px, 14vw, 176px));
  max-width: 1120px;
  align-items: start;
  grid-template-columns: minmax(292px, 0.82fr) minmax(480px, 1fr);
  gap: clamp(44px, 7vw, 92px);
  margin: 0 auto;
}

.web-preview__copy {
  display: grid;
  align-content: start;
  gap: clamp(18px, 3vw, 28px);
  padding-top: clamp(22px, 5vw, 54px);
}

.web-preview h1 {
  max-width: 7.8em;
  margin: 0;
  color: var(--text);
  font-size: clamp(46px, 6.4vw, 78px);
  font-weight: 850;
  line-height: 1.01;
  letter-spacing: 0;
}

.web-preview__lead,
.web-preview__notice,
.web-preview__chips dd {
  color: var(--muted);
  font-size: clamp(15px, 1.4vw, 17px);
  font-weight: 520;
  line-height: 1.7;
}

.web-preview__lead {
  max-width: 500px;
  margin: 0;
}

.web-preview__actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
}

.web-preview__action {
  display: inline-flex;
  height: 44px;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: 1px solid var(--web-border);
  border-radius: 999px;
  background: var(--web-surface);
  padding: 0 18px;
  color: var(--text);
  font-size: 14px;
  font-weight: 760;
  text-decoration: none;
  transition:
    background-color 180ms ease,
    border-color 180ms ease,
    color 180ms ease,
    transform 180ms ease;
}

.web-preview__action:hover {
  border-color: color-mix(in srgb, var(--income-accent) 46%, var(--web-border));
  background: var(--web-surface-strong);
  transform: translateY(-1px);
}

.web-preview__action--primary {
  border-color: transparent;
  background: var(--income-accent);
  color: rgb(24 24 27);
  box-shadow: 0 14px 32px color-mix(in srgb, var(--income-accent) 28%, transparent);
}

.web-preview__action--quiet {
  color: var(--muted);
}

.web-preview__chips {
  display: flex;
  max-width: 560px;
  flex-wrap: wrap;
  gap: 10px;
  margin: 0;
}

.web-preview__chip {
  display: grid;
  min-width: 132px;
  gap: 3px;
  border: 1px solid var(--web-border);
  border-radius: 16px;
  background: var(--web-surface);
  padding: 12px 14px;
  backdrop-filter: blur(16px);
}

.web-preview__chips dt {
  color: var(--text);
  font-size: 13px;
  font-weight: 820;
}

.web-preview__chips dd {
  margin: 0;
  font-size: 12px;
  line-height: 1.45;
}

.web-preview__showcase {
  position: relative;
  display: grid;
  justify-items: center;
  gap: 14px;
  padding-top: clamp(2px, 1vw, 10px);
}

.web-preview__showcase::before {
  position: absolute;
  inset: 8% auto auto;
  width: min(410px, 70%);
  height: 150px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--income-accent) 8%, transparent);
  content: "";
  filter: blur(44px);
  pointer-events: none;
}

.web-preview__showcase-header {
  position: relative;
  z-index: 1;
  display: flex;
  width: min(100%, 480px);
  align-items: center;
  justify-content: space-between;
  color: var(--muted);
  font-size: 13px;
  font-weight: 700;
}

.web-preview__showcase-header strong {
  color: var(--income-accent);
  font-size: 12px;
  font-weight: 820;
}

.web-preview__frame {
  position: relative;
  z-index: 1;
  width: min(100%, 480px);
  height: 460px;
  border-radius: 28px;
  background: var(--panel);
  box-shadow: var(--web-shadow);
}

.web-preview__frame :deep(.app-window) {
  background: var(--panel);
  backdrop-filter: none;
}

.web-preview__mini-layer {
  position: relative;
  z-index: 1;
  width: min(100%, var(--mini-stage-width));
  height: var(--mini-stage-height);
  overflow: visible;
  border: 1px solid var(--web-border);
  border-radius: 28px;
  background:
    radial-gradient(
      circle at 50% 38%,
      color-mix(in srgb, var(--income-accent) 8%, transparent),
      transparent 58%
    ),
    color-mix(in srgb, var(--panel) 92%, transparent);
  box-shadow: 0 24px 64px rgb(24 24 27 / 0.14);
  backdrop-filter: blur(18px);
}

.web-preview__mini-window {
  position: absolute;
  z-index: 3;
}

.web-mini-opacity {
  position: absolute;
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

.web-preview__notice {
  position: relative;
  z-index: 1;
  max-width: min(100%, 480px);
  margin: 0;
  text-align: left;
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

@media (max-width: 980px) {
  .web-preview__hero {
    min-height: auto;
    grid-template-columns: 1fr;
  }

  .web-preview h1 {
    max-width: 11em;
  }
}

@media (max-width: 560px) {
  .web-preview {
    padding: 18px;
  }

  .web-preview__hero {
    gap: 28px;
  }

  .web-preview__topbar {
    margin-bottom: 30px;
  }

  .web-preview__chips {
    display: grid;
    grid-template-columns: 1fr;
  }

  .web-preview__actions {
    justify-content: flex-start;
  }

  .web-preview__frame {
    width: 100%;
    height: clamp(410px, 108vw, 460px);
  }

  .web-preview__showcase-header {
    width: 100%;
  }

  .web-preview__mini-layer {
    width: min(100%, var(--mini-stage-width));
  }
}
</style>
