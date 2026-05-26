<script setup lang="ts">
import {
  computed,
  defineComponent,
  h,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
} from "vue";
import { Download, Focus, ShieldCheck, Zap } from "@lucide/vue";
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

const Windows11Mark = defineComponent({
  name: "Windows11Mark",
  setup() {
    return () =>
      h(
        "svg",
        {
          "aria-hidden": "true",
          class: "windows11-mark",
          focusable: "false",
          viewBox: "0 0 24 24",
        },
        [
          h("rect", {
            fill: "currentColor",
            height: "8",
            rx: "0.9",
            width: "8",
            x: "3",
            y: "3",
          }),
          h("rect", {
            fill: "currentColor",
            height: "8",
            rx: "0.9",
            width: "8",
            x: "13",
            y: "3",
          }),
          h("rect", {
            fill: "currentColor",
            height: "8",
            rx: "0.9",
            width: "8",
            x: "3",
            y: "13",
          }),
          h("rect", {
            fill: "currentColor",
            height: "8",
            rx: "0.9",
            width: "8",
            x: "13",
            y: "13",
          }),
        ],
      );
  },
});

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
        <img
          class="web-preview__brand-logo"
          :src="productLogoUrl"
          alt=""
          aria-hidden="true"
        />
        <span>{{ appName }} {{ appEnglishName }}</span>
      </a>
      <span class="web-preview__version" :aria-label="`当前版本 ${appVersion}`">
        <span>Web Preview</span>
        <span class="web-preview__version-dot" aria-hidden="true">·</span>
        <strong>{{ appVersion }}</strong>
      </span>
    </header>

    <section class="web-preview__hero" aria-label="PayDance Web Preview">
      <div class="web-preview__copy">
        <h1>
          <span class="web-preview__headline-main">看见每一秒的</span>
          <span class="web-preview__headline-accent">收入跳动</span>
        </h1>
        <p class="web-preview__lead">具象化你的劳动价值，专注工作，也看见回报</p>

        <nav class="web-preview__actions" aria-label="网页端操作">
          <a
            class="web-preview__action web-preview__action--primary"
            href="https://github.com/MasterBao66/PayDance/releases/latest/download/pay-dance.exe"
          >
            <Windows11Mark />
            <span class="web-preview__action-label">下载 Windows 版</span>
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
            <span class="web-preview__action-label">GitHub</span>
          </a>
        </nav>

        <dl class="web-preview__chips" aria-label="产品核心优势">
          <div class="web-preview__chip">
            <span class="web-preview__chip-icon" aria-hidden="true">
              <Zap :size="18" :stroke-width="2.6" />
            </span>
            <dt class="web-preview__chip-copy">毫秒级更新</dt>
            <dd>今日收入实时跳动</dd>
          </div>
          <div class="web-preview__chip">
            <span class="web-preview__chip-icon" aria-hidden="true">
              <Focus :size="18" :stroke-width="2.4" />
            </span>
            <dt class="web-preview__chip-copy">安心专注</dt>
            <dd>轻量窗口，静默运行</dd>
          </div>
          <div class="web-preview__chip">
            <span class="web-preview__chip-icon" aria-hidden="true">
              <ShieldCheck :size="18" :stroke-width="2.4" />
            </span>
            <dt class="web-preview__chip-copy">隐私优先</dt>
            <dd>所有数据本地处理</dd>
          </div>
        </dl>
      </div>

      <div
        id="paydance-preview"
        class="web-preview__showcase"
        :class="{ 'is-mini': activeView === 'mini' }"
      >
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
@font-face {
  font-family: "PayDance Web Sans";
  font-style: normal;
  font-weight: 700;
  font-display: swap;
  src: url("./assets/fonts/paydance-web-sans-subset.woff2") format("woff2");
}

@font-face {
  font-family: "PayDance Web Serif";
  font-style: normal;
  font-weight: 900;
  font-display: swap;
  src: url("./assets/fonts/paydance-web-serif-subset.woff2") format("woff2");
}

.web-preview {
  --brand-logo-size: 52px;
  --brand-name-size: 24px;
  --headline-main-size: clamp(42px, 3.6vw, 58px);
  --headline-accent-size: clamp(62px, 5.2vw, 84px);
  --web-font-action:
    "PayDance Web Sans", "Microsoft YaHei UI", "PingFang SC", system-ui, sans-serif;
  --web-font-display:
    "PayDance Web Serif", "PayDance Web Sans", "Microsoft YaHei UI", "PingFang SC", serif;
  --web-font-ui:
    "PayDance Web Sans", "Microsoft YaHei UI", "PingFang SC", system-ui, sans-serif;
  --web-max-width: 1180px;
  --web-orbit: rgb(217 119 6 / 0.18);
  --web-page-bg: rgb(247 247 245);
  --web-stage-glow: rgb(217 119 6 / 0.08);
  --web-stage-panel: rgb(255 255 255);
  --web-stage-ring: rgb(24 24 27 / 0.08);
  --web-surface: rgb(255 255 255 / 0.8);
  --web-surface-strong: rgb(255 255 255 / 0.96);
  --web-border: rgb(24 24 27 / 0.11);
  --web-shadow: 0 32px 92px rgb(24 24 27 / 0.12);
  display: flex;
  height: 100dvh;
  min-height: 100dvh;
  flex-direction: column;
  overflow-x: hidden;
  overflow-y: auto;
  background:
    radial-gradient(circle at 19% 78%, rgb(217 119 6 / 0.035) 0, transparent 27%),
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
  --web-orbit: rgb(245 158 11 / 0.12);
  --web-page-bg: rgb(10 10 11);
  --web-stage-glow: rgb(245 158 11 / 0.08);
  --web-stage-panel: rgb(18 18 20);
  --web-stage-ring: rgb(255 255 255 / 0.08);
  --web-surface: rgb(24 24 27 / 0.78);
  --web-surface-strong: rgb(34 34 38 / 0.94);
  --web-border: rgb(255 255 255 / 0.1);
  --web-shadow: 0 30px 88px rgb(0 0 0 / 0.42);
  background:
    radial-gradient(
      ellipse at 76% 36%,
      color-mix(in srgb, var(--income-accent) 8%, transparent) 0,
      transparent 29%
    ),
    radial-gradient(circle at 21% 72%, rgb(245 158 11 / 0.04) 0, transparent 30%),
    radial-gradient(circle at 58% 48%, rgb(255 255 255 / 0.026) 0, transparent 32%),
    linear-gradient(145deg, rgb(7 7 8) 0%, var(--web-page-bg) 60%, rgb(16 13 10) 100%);
}

.web-preview__topbar {
  position: relative;
  z-index: 2;
  display: flex;
  width: min(100%, var(--web-max-width));
  align-items: center;
  justify-content: space-between;
  gap: 22px;
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

.web-preview__brand-logo {
  width: var(--brand-logo-size);
  height: var(--brand-logo-size);
  flex: 0 0 auto;
}

.web-preview__version {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: var(--muted);
  font-family: var(--web-font-ui);
  font-size: 14px;
  font-weight: 760;
  white-space: nowrap;
}

.web-preview__version-dot {
  color: color-mix(in srgb, var(--income-accent) 72%, var(--muted));
  font-size: 16px;
  line-height: 1;
}

.web-preview__version strong {
  color: var(--text);
  font-size: 15px;
  font-weight: 820;
}

.web-preview__hero {
  display: grid;
  width: min(100%, var(--web-max-width));
  flex: 1;
  align-items: center;
  grid-template-columns: minmax(360px, 440px) minmax(430px, 480px);
  justify-content: center;
  gap: clamp(60px, 7vw, 104px);
  margin: 0 auto;
  padding: clamp(34px, 6vh, 68px) 0 clamp(28px, 5vh, 56px);
}

.web-preview__copy {
  display: grid;
  align-content: start;
  justify-items: start;
  gap: clamp(20px, 2.5vw, 32px);
  font-family: var(--web-font-ui);
}

.web-preview h1 {
  display: grid;
  width: min(100%, calc(var(--headline-accent-size) * 5.2));
  gap: clamp(13px, 1.3vw, 20px);
  margin: 0;
  color: var(--text);
  font-family: var(--web-font-display);
  font-weight: 850;
  line-height: 0.94;
  letter-spacing: 0;
}

.web-preview__headline-main {
  font-size: var(--headline-main-size);
  font-weight: 850;
  line-height: 1.02;
  white-space: nowrap;
}

.web-preview__headline-accent {
  color: var(--income-accent);
  font-size: var(--headline-accent-size);
  font-weight: 900;
  line-height: 0.9;
  white-space: nowrap;
}

.web-preview__lead {
  display: block;
  max-width: 540px;
  margin: 6px 0 0;
  color: var(--muted);
  font-size: clamp(17px, 1.24vw, 20px);
  font-weight: 520;
  line-height: 1.5;
  white-space: nowrap;
}

.web-preview__actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-start;
  gap: 12px;
}

.web-preview__action {
  display: inline-flex;
  height: 50px;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: 1px solid var(--web-border);
  border-radius: 999px;
  background: var(--web-surface);
  padding: 0 22px;
  color: var(--text);
  font-family: var(--web-font-action);
  font-size: 15px;
  font-weight: 760;
  line-height: 1;
  text-decoration: none;
  vertical-align: middle;
  transition: box-shadow 160ms ease;
}

.web-preview__action:hover {
  text-decoration: none;
}

.web-preview__action :deep(svg) {
  display: block;
  flex: 0 0 auto;
}

.web-preview__action-label {
  display: block;
  line-height: 1;
  transform: translateY(-0.75px);
}

.web-preview__action--primary {
  border-color: transparent;
  background: var(--income-accent);
  color: rgb(255 255 255);
  box-shadow: 0 14px 32px color-mix(in srgb, var(--income-accent) 28%, transparent);
}

.web-preview__action--primary:hover {
  border-color: transparent;
  background: color-mix(in srgb, var(--income-accent) 90%, rgb(255 255 255) 10%);
  color: rgb(255 255 255);
  box-shadow: 0 16px 34px color-mix(in srgb, var(--income-accent) 30%, transparent);
}

.web-preview__action--quiet {
  gap: 3px;
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
  display: block;
  width: 18px;
  height: 18px;
  flex: 0 0 auto;
  fill: currentColor;
}

.windows11-mark {
  display: block;
  width: 17px;
  height: 17px;
  flex: 0 0 auto;
}

.web-preview__chips {
  --web-chip-base-width: 146px;
  --web-chip-gap: 12px;
  --web-chip-scale: 1;
  display: grid;
  max-width: calc(
    (var(--web-chip-base-width) * 3 + var(--web-chip-gap) * 2) * var(--web-chip-scale)
  );
  grid-template-columns: repeat(
    3,
    calc(var(--web-chip-base-width) * var(--web-chip-scale))
  );
  justify-content: flex-start;
  gap: calc(var(--web-chip-gap) * var(--web-chip-scale));
  margin: 2px 0 0;
}

.web-preview__chip {
  display: grid;
  width: calc(var(--web-chip-base-width) * var(--web-chip-scale));
  min-width: 0;
  align-items: center;
  grid-template-columns: calc(30px * var(--web-chip-scale)) minmax(0, 1fr);
  grid-template-rows: auto auto;
  column-gap: calc(10px * var(--web-chip-scale));
  justify-items: start;
  padding: 0;
  text-align: left;
}

.web-preview__chip-icon {
  display: grid;
  width: calc(30px * var(--web-chip-scale));
  height: calc(30px * var(--web-chip-scale));
  grid-row: 1 / span 2;
  place-items: center;
  border-radius: 999px;
  background: color-mix(in srgb, var(--income-accent) 11%, transparent);
  color: var(--income-accent);
}

.web-preview__chip-icon svg {
  width: calc(18px * var(--web-chip-scale));
  height: calc(18px * var(--web-chip-scale));
}

.theme-dark.web-preview .web-preview__chip-icon {
  background: color-mix(in srgb, var(--income-accent) 16%, transparent);
}

.web-preview__chips dt {
  color: var(--text);
  font-family: var(--web-font-action);
  font-size: calc(15px * var(--web-chip-scale));
  font-weight: 820;
}

.web-preview__chips dd {
  margin: 0;
  margin-top: calc(5px * var(--web-chip-scale));
  color: var(--muted);
  font-size: calc(13px * var(--web-chip-scale));
  font-weight: 520;
  line-height: 1.45;
  white-space: nowrap;
}

.web-preview__showcase {
  position: relative;
  display: grid;
  width: min(100%, 480px);
  justify-items: center;
  gap: 0;
}

.web-preview__showcase::before {
  position: absolute;
  z-index: 0;
  inset: 8% auto auto;
  width: min(410px, 70%);
  height: 150px;
  border-radius: 999px;
  background: var(--web-stage-glow);
  content: "";
  filter: blur(44px);
  pointer-events: none;
}

.web-preview__showcase::after {
  position: absolute;
  z-index: 0;
  width: min(650px, 134vw);
  height: 470px;
  border: 1px dashed var(--web-orbit);
  border-radius: 50%;
  content: "";
  opacity: 0.62;
  pointer-events: none;
  transform: rotate(-18deg) translateY(8px);
}

.theme-dark.web-preview .web-preview__showcase::after {
  opacity: 0.38;
}

.web-preview__showcase.is-mini::before,
.web-preview__showcase.is-mini::after {
  display: none;
}

.web-preview__frame {
  position: relative;
  z-index: 1;
  width: min(100%, 480px);
  height: 460px;
  contain: paint;
  border-radius: 28px;
  border: 0;
  background: var(--web-stage-panel);
  background-clip: padding-box;
  box-shadow:
    inset 0 0 0 1px var(--web-stage-ring),
    var(--web-shadow);
}

.web-preview__frame.is-theme-syncing {
  box-shadow:
    inset 0 0 0 1px var(--web-stage-ring),
    var(--web-shadow);
}

.theme-dark.web-preview .web-preview__frame {
  box-shadow:
    inset 0 0 0 1px var(--web-stage-ring),
    0 36px 96px rgb(0 0 0 / 0.5),
    0 0 68px rgb(245 158 11 / 0.07);
}

.web-preview__frame :deep(.app-window) {
  background: var(--panel);
  backdrop-filter: none;
}

.web-preview__mini-layer {
  --mini-preview-corner: 14px;
  position: relative;
  z-index: 1;
  width: min(100%, var(--mini-stage-width));
  height: var(--mini-stage-height);
  overflow: visible;
  border: 1px solid var(--web-border);
  border-radius: 28px;
  background:
    radial-gradient(circle at 50% 42%, rgb(255 255 255 / 0.68), transparent 56%),
    linear-gradient(145deg, rgb(233 234 237), rgb(219 221 226));
  box-shadow: 0 24px 64px rgb(24 24 27 / 0.14);
  backdrop-filter: blur(18px);
}

.theme-dark.web-preview .web-preview__mini-layer {
  background:
    radial-gradient(circle at 50% 40%, rgb(255 255 255 / 0.055), transparent 58%),
    linear-gradient(145deg, rgb(39 40 45), rgb(28 29 33));
  box-shadow: 0 26px 72px rgb(0 0 0 / 0.44);
}

.web-preview__mini-window {
  position: absolute;
  z-index: 3;
  overflow: hidden;
  border-radius: var(--mini-preview-corner);
  background: transparent;
  background-clip: padding-box;
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
  background-clip: padding-box;
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

@media (max-width: 1120px) {
  .web-preview__hero {
    min-height: auto;
    grid-template-columns: minmax(330px, 0.86fr) minmax(390px, 440px);
    gap: clamp(34px, 5vw, 56px);
    padding-top: clamp(34px, 6vw, 58px);
  }

  .web-preview h1 {
    width: min(100%, calc(var(--headline-accent-size) * 5.2));
  }

  .web-preview__showcase {
    justify-items: center;
  }
}

@media (max-width: 820px) {
  .web-preview__hero {
    grid-template-columns: 1fr;
    justify-items: center;
    gap: clamp(34px, 7vw, 52px);
    padding-top: clamp(34px, 7vw, 54px);
  }

  .web-preview__copy {
    justify-items: center;
    text-align: center;
  }

  .web-preview__actions,
  .web-preview__chips {
    justify-content: center;
  }
}

@media (max-width: 560px) {
  .web-preview {
    --brand-logo-size: 42px;
    --brand-name-size: 19px;
    --headline-main-size: clamp(34px, 10vw, 46px);
    --headline-accent-size: clamp(48px, 14.4vw, 62px);
    padding: 18px 16px;
  }

  .web-preview__hero {
    gap: 28px;
  }

  .web-preview__topbar {
    width: min(100%, 420px);
    justify-content: space-between;
    gap: 16px;
  }

  .web-preview__version {
    gap: 6px;
    font-size: 12px;
  }

  .web-preview__version strong {
    font-size: 13px;
  }

  .web-preview__actions {
    justify-content: center;
  }

  .web-preview__chips {
    --web-chip-scale: min(0.82, calc((100vw - 32px) / 462px));
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
