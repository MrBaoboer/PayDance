<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { Download } from "@lucide/vue";
import productLogoUrl from "../src-tauri/icons/icon.png";
import {
  appCopyright,
  appEnglishName,
  appName,
  appVersion,
  repositoryUrl,
} from "./lib/app-meta";
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
  "--mini-opacity-percent": `${miniOpacityPercent.value}%`,
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
        <span class="web-preview__brand-icon" aria-hidden="true">
          <img :src="productLogoUrl" alt="" />
        </span>
        <span>{{ appName }} {{ appEnglishName }}</span>
      </a>
      <span class="web-preview__version" :aria-label="`当前版本 ${appVersion}`">
        <span>Web Preview</span>
        <strong>v{{ appVersion }}</strong>
      </span>
    </header>

    <section class="web-preview__hero" aria-label="PayDance Web Preview">
      <div class="web-preview__copy">
        <h1>
          <span class="web-preview__headline-main">看见每一秒的</span>
          <span class="web-preview__headline-accent">收入跳动</span>
        </h1>
        <p class="web-preview__lead">把今天已经挣到的钱 实时放在桌面上</p>

        <nav class="web-preview__actions" aria-label="网页端操作">
          <a
            class="web-preview__action web-preview__action--primary"
            href="https://github.com/MasterBao66/PayDance/releases/latest"
          >
            下载 Windows 版
            <Download :size="16" />
          </a>
          <a class="web-preview__action web-preview__action--quiet" :href="repositoryUrl">
            <svg class="github-mark" aria-hidden="true" viewBox="0 0 24 24">
              <path
                fill-rule="evenodd"
                clip-rule="evenodd"
                d="M12 2C6.48 2 2 6.59 2 12.25c0 4.53 2.87 8.37 6.84 9.73.5.09.68-.22.68-.49 0-.24-.01-.89-.01-1.75-2.78.62-3.37-1.37-3.37-1.37-.45-1.18-1.11-1.49-1.11-1.49-.91-.64.07-.63.07-.63 1 .07 1.53 1.06 1.53 1.06.89 1.56 2.34 1.11 2.91.85.09-.66.35-1.11.63-1.37-2.22-.26-4.56-1.14-4.56-5.06 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.3.1-2.71 0 0 .84-.28 2.75 1.05A9.38 9.38 0 0 1 12 6.98c.85 0 1.7.12 2.5.35 1.91-1.33 2.75-1.05 2.75-1.05.55 1.41.2 2.45.1 2.71.64.72 1.03 1.63 1.03 2.75 0 3.93-2.34 4.79-4.57 5.05.36.32.68.94.68 1.9 0 1.37-.01 2.47-.01 2.81 0 .27.18.59.69.49A10.24 10.24 0 0 0 22 12.25C22 6.59 17.52 2 12 2Z"
              />
            </svg>
            GitHub
          </a>
        </nav>

        <dl class="web-preview__chips" aria-label="产品核心优势">
          <div class="web-preview__chip">
            <dt>秒秒入账</dt>
            <dd>今日收入实时跳动</dd>
          </div>
          <div class="web-preview__chip">
            <dt>角落常驻</dt>
            <dd>只看金额少打扰</dd>
          </div>
          <div class="web-preview__chip">
            <dt>隐私安心</dt>
            <dd>无账号，无遥测</dd>
          </div>
        </dl>
      </div>

      <div id="paydance-preview" class="web-preview__showcase">
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
      </div>
    </section>

    <footer class="web-preview__footer" aria-label="作者归属">
      <span>{{ appCopyright }}</span>
      <span class="web-preview__footer-mark" aria-hidden="true"></span>
      <span>{{ appName }} {{ appEnglishName }}</span>
    </footer>
  </main>
</template>

<style scoped>
@import url("https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@500;600;700;800;900&family=Noto+Serif+SC:wght@700;900&display=swap");

.web-preview {
  --brand-logo-size: 58px;
  --brand-name-size: 26px;
  --web-font-action:
    "Noto Sans SC", "Microsoft YaHei UI", "PingFang SC", system-ui, sans-serif;
  --web-font-display:
    "Noto Serif SC", "Noto Sans SC", "Microsoft YaHei UI", "PingFang SC", serif;
  --web-font-ui:
    "Noto Sans SC", "Microsoft YaHei UI", "PingFang SC", system-ui, sans-serif;
  --web-max-width: 1160px;
  --web-page-bg: rgb(247 247 245);
  --web-stage-glow: rgb(217 119 6 / 0.1);
  --web-stage-panel: rgb(255 255 255);
  --web-stage-ring: rgb(24 24 27 / 0.08);
  --web-surface: rgb(255 255 255 / 0.8);
  --web-surface-strong: rgb(255 255 255 / 0.96);
  --web-border: rgb(24 24 27 / 0.11);
  --web-shadow: 0 32px 92px rgb(24 24 27 / 0.12);
  display: flex;
  min-height: 100dvh;
  flex-direction: column;
  overflow: auto;
  background:
    radial-gradient(
      circle at 79% 34%,
      color-mix(in srgb, var(--income-accent) 11%, transparent) 0,
      transparent 31%
    ),
    linear-gradient(
      145deg,
      rgb(250 250 249) 0%,
      var(--web-page-bg) 54%,
      rgb(242 240 236) 100%
    );
  color: var(--text);
  padding: clamp(24px, 3.6vw, 54px) clamp(24px, 5vw, 74px) clamp(18px, 3vw, 34px);
}

.theme-dark.web-preview {
  --web-page-bg: rgb(12 12 14);
  --web-stage-glow: rgb(245 158 11 / 0.18);
  --web-stage-panel: rgb(18 18 20);
  --web-stage-ring: rgb(255 255 255 / 0.13);
  --web-surface: rgb(24 24 27 / 0.78);
  --web-surface-strong: rgb(34 34 38 / 0.94);
  --web-border: rgb(255 255 255 / 0.11);
  --web-shadow: 0 30px 88px rgb(0 0 0 / 0.38);
  background:
    radial-gradient(
      circle at 78% 34%,
      color-mix(in srgb, var(--income-accent) 13%, transparent) 0,
      transparent 26%
    ),
    radial-gradient(circle at 56% 46%, rgb(255 255 255 / 0.045) 0, transparent 34%),
    linear-gradient(145deg, rgb(6 6 8) 0%, var(--web-page-bg) 58%, rgb(23 18 12) 100%);
}

.web-preview__topbar {
  position: relative;
  z-index: 2;
  display: flex;
  width: min(100%, var(--web-max-width));
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  margin: 0 auto;
}

.web-preview__brand {
  display: inline-flex;
  align-items: center;
  gap: 16px;
  color: var(--text);
  font-family: var(--web-font-ui);
  font-size: var(--brand-name-size);
  font-weight: 820;
  text-decoration: none;
}

.web-preview__brand-icon {
  display: inline-grid;
  width: var(--brand-logo-size);
  height: var(--brand-logo-size);
  overflow: hidden;
  place-items: center;
  border-radius: 15px;
  box-shadow: 0 18px 42px rgb(24 24 27 / 0.12);
}

.web-preview__brand img {
  width: var(--brand-logo-size);
  height: var(--brand-logo-size);
  transform: scale(1.16);
}

.web-preview__version {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  color: var(--muted);
  font-family: var(--web-font-ui);
}

.web-preview__version::before {
  width: 7px;
  height: 7px;
  border-radius: 999px;
  background: var(--income-accent);
  box-shadow: 0 0 16px color-mix(in srgb, var(--income-accent) 42%, transparent);
  content: "";
}

.web-preview__version span {
  color: var(--muted);
  font-size: 12px;
  font-weight: 760;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.web-preview__version strong {
  color: var(--text);
  font-size: 18px;
  font-weight: 820;
}

.web-preview__hero {
  display: grid;
  width: min(100%, var(--web-max-width));
  flex: 1;
  align-items: center;
  grid-template-columns: minmax(390px, 0.92fr) minmax(480px, 520px);
  gap: clamp(22px, 3vw, 42px);
  margin: 0 auto;
  padding: clamp(34px, 6vh, 70px) 0 clamp(28px, 5vh, 56px);
}

.web-preview__copy {
  display: grid;
  align-content: start;
  gap: clamp(18px, 2.6vw, 30px);
  font-family: var(--web-font-ui);
}

.web-preview h1 {
  display: grid;
  width: min(100%, 640px);
  gap: clamp(14px, 1.3vw, 21px);
  margin: 0;
  color: var(--text);
  font-family: var(--web-font-display);
  font-weight: 850;
  line-height: 0.94;
  letter-spacing: 0;
}

.web-preview__headline-main {
  font-size: clamp(38px, 4vw, 62px);
  font-weight: 760;
  white-space: nowrap;
}

.web-preview__headline-accent {
  color: var(--income-accent);
  font-size: clamp(58px, 6vw, 92px);
  font-weight: 880;
  white-space: nowrap;
}

.web-preview__lead {
  max-width: 560px;
  margin: 0;
  color: var(--muted);
  font-size: clamp(18px, 1.38vw, 21px);
  font-weight: 520;
  line-height: 1.5;
  white-space: nowrap;
}

.web-preview__actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
}

.web-preview__action {
  display: inline-flex;
  height: 50px;
  align-items: center;
  justify-content: center;
  gap: 10px;
  border: 1px solid var(--web-border);
  border-radius: 999px;
  background: var(--web-surface);
  padding: 0 22px;
  color: var(--text);
  font-family: var(--web-font-action);
  font-size: 15px;
  font-weight: 760;
  text-decoration: none;
  transition: box-shadow 160ms ease;
}

.web-preview__action:hover {
  text-decoration: none;
}

.web-preview__action--primary {
  border-color: transparent;
  background: var(--income-accent);
  color: rgb(24 24 27);
  box-shadow: 0 14px 32px color-mix(in srgb, var(--income-accent) 28%, transparent);
}

.web-preview__action--primary:hover {
  border-color: transparent;
  background: color-mix(in srgb, var(--income-accent) 90%, rgb(255 255 255) 10%);
  color: rgb(24 24 27);
  box-shadow: 0 16px 34px color-mix(in srgb, var(--income-accent) 30%, transparent);
}

.web-preview__action--quiet {
  gap: 7px;
  background: color-mix(in srgb, var(--web-surface) 84%, transparent);
  color: var(--muted);
}

.web-preview__action--quiet:hover {
  border-color: color-mix(in srgb, var(--text) 18%, var(--web-border));
  background: var(--web-surface-strong);
  color: var(--text);
  box-shadow: 0 12px 28px rgb(24 24 27 / 0.08);
}

.github-mark {
  width: 18px;
  height: 18px;
  fill: currentColor;
}

.web-preview__chips {
  display: flex;
  max-width: 600px;
  flex-wrap: wrap;
  gap: 12px;
  margin: 2px 0 0;
}

.web-preview__chip {
  display: grid;
  min-width: 146px;
  gap: 4px;
  border: 1px solid var(--web-border);
  border-radius: 16px;
  background: color-mix(in srgb, var(--web-surface) 86%, transparent);
  padding: 13px 15px;
  text-align: center;
}

.web-preview__chips dt {
  color: var(--text);
  font-family: var(--web-font-action);
  font-size: 15px;
  font-weight: 820;
}

.web-preview__chips dd {
  margin: 0;
  color: var(--muted);
  font-size: 13px;
  font-weight: 520;
  line-height: 1.45;
}

.web-preview__showcase {
  position: relative;
  display: grid;
  justify-items: center;
  gap: 0;
}

.web-preview__showcase::before {
  position: absolute;
  inset: 8% auto auto;
  width: min(410px, 70%);
  height: 150px;
  border-radius: 999px;
  background: var(--web-stage-glow);
  content: "";
  filter: blur(44px);
  pointer-events: none;
}

.web-preview__frame {
  position: relative;
  z-index: 1;
  width: min(100%, 480px);
  height: 460px;
  border-radius: 28px;
  border: 1px solid var(--web-stage-ring);
  background: var(--web-stage-panel);
  box-shadow: var(--web-shadow);
}

.theme-dark.web-preview .web-preview__frame {
  box-shadow:
    0 36px 96px rgb(0 0 0 / 0.5),
    0 0 0 1px rgb(255 255 255 / 0.02),
    0 0 68px rgb(245 158 11 / 0.09);
}

.web-preview__frame :deep(.app-window) {
  background: var(--panel);
  backdrop-filter: none;
}

.web-preview__mini-layer {
  --mini-preview-corner: 14px;
  --mini-stage-contrast: rgb(226 227 230);
  --mini-stage-merge: rgb(255 255 255);
  position: relative;
  z-index: 1;
  width: min(100%, var(--mini-stage-width));
  height: var(--mini-stage-height);
  overflow: visible;
  border: 1px solid var(--web-border);
  border-radius: 28px;
  background: color-mix(
    in srgb,
    var(--mini-stage-contrast) var(--mini-opacity-percent),
    var(--mini-stage-merge)
  );
  box-shadow: 0 24px 64px rgb(24 24 27 / 0.14);
  backdrop-filter: blur(18px);
}

.theme-dark.web-preview .web-preview__mini-layer {
  --mini-stage-contrast: rgb(42 43 48);
  --mini-stage-merge: rgb(0 0 0);
  box-shadow: 0 26px 72px rgb(0 0 0 / 0.44);
}

.web-preview__mini-window {
  position: absolute;
  z-index: 3;
  overflow: hidden;
  border-radius: var(--mini-preview-corner);
  clip-path: inset(0 round var(--mini-preview-corner));
}

.web-preview__mini-window.theme-light {
  --border: rgb(24 24 27 / 0.12);
  --mini-panel-rgb: 255 255 255;
  --text: rgb(24 24 27);
}

.web-preview__mini-window.theme-dark {
  --border: rgb(255 255 255 / 0.14);
  --mini-panel-rgb: 0 0 0;
  --text: rgb(250 250 250);
}

.web-preview__mini-window :deep(.mini-window) {
  overflow: hidden;
  border-radius: var(--mini-preview-corner);
  backdrop-filter: none;
  clip-path: inset(0 round var(--mini-preview-corner));
}

.web-preview__mini-window :deep(.rolling-amount) {
  color: var(--text);
}

.web-preview__mini-window :deep(.rolling-amount__currency) {
  color: var(--text);
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

.web-preview__footer {
  display: flex;
  width: min(100%, var(--web-max-width));
  align-items: center;
  justify-content: center;
  gap: 14px;
  margin: 0 auto;
  border-top: 1px solid color-mix(in srgb, var(--web-border) 72%, transparent);
  padding-top: clamp(18px, 2.2vw, 24px);
  color: var(--muted);
  font-family: var(--web-font-ui);
  font-size: 14px;
  font-weight: 680;
  text-align: center;
}

.web-preview__footer-mark {
  width: 5px;
  height: 5px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--income-accent) 74%, var(--muted));
}

@media (max-width: 980px) {
  .web-preview__hero {
    min-height: auto;
    grid-template-columns: 1fr;
    padding-top: clamp(38px, 7vw, 62px);
  }

  .web-preview h1 {
    width: min(100%, 640px);
  }

  .web-preview__showcase {
    justify-items: start;
  }
}

@media (max-width: 560px) {
  .web-preview {
    --brand-logo-size: 46px;
    --brand-name-size: 20px;
    padding: 18px;
  }

  .web-preview__hero {
    gap: 28px;
  }

  .web-preview__topbar {
    align-items: flex-start;
  }

  .web-preview__version {
    gap: 7px;
  }

  .web-preview__version span {
    display: none;
  }

  .web-preview__version strong {
    font-size: 15px;
  }

  .web-preview__actions {
    justify-content: flex-start;
  }

  .web-preview__lead {
    white-space: normal;
  }

  .web-preview__frame {
    width: 100%;
    height: clamp(410px, 108vw, 460px);
  }

  .web-preview__mini-layer {
    width: min(100%, var(--mini-stage-width));
  }
}
</style>
