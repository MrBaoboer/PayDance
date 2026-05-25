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
const previewStageHeight = 460;

const getPreviewStageWidth = () => Math.max(320, Math.min(window.innerWidth - 36, 480));

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
  const previewWidth = getPreviewStageWidth();
  miniPosition.value = {
    x: Math.max(16, Math.round((previewWidth - width) / 2)),
    y: 188,
  };
};

const startWebMiniDrag = (event: PointerEvent) => {
  if (event.button !== 0) return;

  showWebMiniOpacityPanel.value = false;
  const startPoint = { x: event.clientX, y: event.clientY };
  const startPosition = { ...miniPosition.value };

  const handleMove = (moveEvent: PointerEvent) => {
    const previewWidth = getPreviewStageWidth();
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
          previewStageHeight - miniSize.value.height - 18,
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
    <section class="web-preview__hero" aria-label="PayDance Web Preview">
      <div class="web-preview__copy">
        <p class="web-preview__eyebrow">PayDance Web Preview</p>
        <h1>把今天挣到的钱，放在桌面上实时跳动。</h1>
        <p class="web-preview__lead">
          薪跳 PayDance
          是一款属于打工人的桌面实时工资看板。先在网页里体验核心计算、首次配置、设置中心和迷你悬浮手感，再下载
          Windows 版常驻桌面。
        </p>

        <nav class="web-preview__actions" aria-label="网页体验版操作">
          <a
            class="web-preview__action web-preview__action--primary"
            href="https://github.com/MasterBao66/PayDance/releases/latest"
          >
            下载 Windows 版
            <ExternalLink :size="15" />
          </a>
          <a class="web-preview__action" href="#paydance-preview">在线体验</a>
          <a class="web-preview__action web-preview__action--quiet" :href="repositoryUrl">
            GitHub
            <ExternalLink :size="15" />
          </a>
        </nav>

        <dl class="web-preview__proofs" aria-label="产品核心优势">
          <div>
            <dt>本地优先</dt>
            <dd>无账号，无遥测，薪资数据不上传</dd>
          </div>
          <div>
            <dt>桌面常驻</dt>
            <dd>主窗口完整看板，迷你窗口角落显示</dd>
          </div>
          <div>
            <dt>真实作息</dt>
            <dd>支持午休剔除、工作日和跨零点夜班</dd>
          </div>
        </dl>
      </div>

      <div id="paydance-preview" class="web-preview__showcase">
        <div class="web-preview__showcase-header">
          <span>{{ appName }} PayDance</span>
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

        <p class="web-preview__notice">
          Web Preview
          用于在线体验核心交互；系统托盘、窗口置顶、开机自启动和原生透明窗口请使用 Windows
          桌面版。
        </p>
      </div>
    </section>
  </main>
</template>

<style scoped>
.web-preview {
  --web-page-bg: color-mix(in srgb, var(--panel) 94%, var(--income-accent) 6%);
  --web-surface: color-mix(in srgb, var(--panel) 88%, transparent);
  --web-surface-strong: color-mix(in srgb, var(--panel) 96%, var(--text) 4%);
  --web-border: color-mix(in srgb, var(--line) 82%, transparent);
  --web-shadow: 0 26px 80px rgb(15 23 42 / 0.14);
  min-height: 100%;
  overflow: auto;
  background: linear-gradient(
    135deg,
    color-mix(in srgb, var(--web-page-bg) 90%, white 10%) 0%,
    var(--web-page-bg) 46%,
    color-mix(in srgb, var(--panel) 86%, var(--income-accent) 14%) 100%
  );
  color: var(--text);
  padding: clamp(20px, 4vw, 48px);
}

.theme-dark.web-preview {
  --web-page-bg: color-mix(in srgb, var(--panel) 92%, var(--income-accent) 8%);
  --web-surface: color-mix(in srgb, var(--panel) 86%, white 4%);
  --web-surface-strong: color-mix(in srgb, var(--panel) 92%, white 8%);
  --web-border: color-mix(in srgb, var(--line) 70%, white 10%);
  --web-shadow: 0 30px 88px rgb(0 0 0 / 0.34);
}

.web-preview__hero {
  display: grid;
  min-height: calc(100vh - clamp(40px, 8vw, 96px));
  max-width: 1120px;
  align-items: center;
  grid-template-columns: minmax(320px, 0.92fr) minmax(480px, 1fr);
  gap: clamp(34px, 6vw, 76px);
  margin: 0 auto;
}

.web-preview__copy {
  display: grid;
  align-content: center;
  gap: clamp(18px, 3vw, 28px);
}

.web-preview__eyebrow {
  margin: 0;
  color: var(--income-accent);
  font-size: 13px;
  font-weight: 820;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.web-preview h1 {
  max-width: 9.6em;
  margin: 0;
  color: var(--text);
  font-size: clamp(42px, 6vw, 68px);
  font-weight: 840;
  line-height: 1.02;
  letter-spacing: 0;
}

.web-preview__lead,
.web-preview__notice,
.web-preview__proofs dd {
  color: var(--muted);
  font-size: clamp(15px, 1.45vw, 17px);
  font-weight: 520;
  line-height: 1.78;
}

.web-preview__lead {
  max-width: 560px;
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
  height: 42px;
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

.web-preview__proofs {
  display: grid;
  max-width: 560px;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
  margin: 4px 0 0;
}

.web-preview__proofs div {
  display: grid;
  align-content: start;
  gap: 6px;
  border-top: 1px solid var(--web-border);
  padding-top: 13px;
}

.web-preview__proofs dt {
  color: var(--text);
  font-size: 14px;
  font-weight: 780;
}

.web-preview__proofs dd {
  margin: 0;
  font-size: 13px;
  line-height: 1.55;
}

.web-preview__showcase {
  position: relative;
  display: grid;
  justify-items: center;
  gap: 15px;
}

.web-preview__showcase::before {
  position: absolute;
  inset: 10% 0 auto;
  width: min(440px, 70%);
  height: 180px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--income-accent) 12%, transparent);
  content: "";
  filter: blur(38px);
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
  box-shadow: var(--web-shadow);
}

.web-preview__mini-layer {
  position: relative;
  inset: 0;
  z-index: 1;
  width: min(100%, 480px);
  height: 460px;
  border-radius: 22px;
  background: color-mix(in srgb, var(--panel) 86%, transparent);
  box-shadow: var(--web-shadow);
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

  .web-preview__proofs {
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
    width: 100%;
  }
}
</style>
