<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { LazyStore } from "@tauri-apps/plugin-store";
import { LogicalSize } from "@tauri-apps/api/dpi";
import { getCurrentWindow } from "@tauri-apps/api/window";
import {
  Banknote,
  Clock3,
  Coffee,
  Minus,
  Moon,
  Pin,
  PinOff,
  Settings2,
  Shrink,
  Sun,
  X,
} from "lucide-vue-next";
import {
  calculateSalarySnapshot,
  defaultSalaryConfig,
  type SalaryConfig,
  type SalarySnapshot,
} from "./lib/salary";

type ThemeMode = "light" | "dark";

const store = new LazyStore("salary-settings.json");
const appWindow = getCurrentWindow();

const config = ref<SalaryConfig>({ ...defaultSalaryConfig });
const alwaysOnTop = ref(false);
const isMiniMode = ref(false);
const showSettings = ref(true);
const themeMode = ref<ThemeMode>("light");
const isReady = ref(false);

const snapshot = ref<SalarySnapshot>(
  calculateSalarySnapshot(new Date(), config.value),
);

const yuanFormatter = new Intl.NumberFormat("zh-CN", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const earnedText = computed(() => yuanFormatter.format(snapshot.value.earnedToday));
const progressPercent = computed(() => `${snapshot.value.progress * 100}%`);

const workDurationText = computed(() => {
  const hours = snapshot.value.workMsToday / 3_600_000;
  return Number.isFinite(hours) ? `${hours.toFixed(1)}h` : "0.0h";
});

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
  await store.save();
};

const applyWindowMode = async () => {
  if (isMiniMode.value) {
    await appWindow.setSize(new LogicalSize(238, 86));
    await appWindow.setAlwaysOnTop(true);
    alwaysOnTop.value = true;
    return;
  }

  await appWindow.setSize(new LogicalSize(420, showSettings.value ? 560 : 400));
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

watch(config, saveState, { deep: true });
watch(showSettings, async () => {
  if (!isReady.value || isMiniMode.value) return;
  await applyWindowMode();
  await saveState();
});

let rafId = 0;
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
  const savedMini = await store.get<boolean>("isMiniMode");
  const savedSettings = await store.get<boolean>("showSettings");
  const savedTheme = await store.get<ThemeMode>("themeMode");

  if (savedConfig) {
    config.value = { ...defaultSalaryConfig, ...savedConfig };
  }

  if (typeof savedTop === "boolean") {
    alwaysOnTop.value = savedTop;
  }

  if (typeof savedMini === "boolean") {
    isMiniMode.value = savedMini;
  }

  if (typeof savedSettings === "boolean") {
    showSettings.value = savedSettings;
  }

  if (savedTheme === "dark" || savedTheme === "light") {
    themeMode.value = savedTheme;
  }

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

  isReady.value = true;
  startTicker();
});

onBeforeUnmount(() => {
  cancelAnimationFrame(rafId);
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
    <div
      v-if="isMiniMode"
      class="mini-window"
      title="双击恢复完整窗口"
      @dblclick="setMiniMode(false)"
    >
      <span>¥{{ earnedText }}</span>
    </div>

    <div v-else class="app-window">
      <header class="titlebar" @mousedown.left="startDrag">
        <div class="status-chip">
          <span
            class="status-dot"
            :class="snapshot.isWorking ? 'bg-emerald-500' : 'bg-zinc-300'"
          />
          <span>{{ snapshot.isWorking ? "正在赚钱" : "休息时间" }}</span>
        </div>

        <div class="window-actions">
          <button class="icon-button" title="设置" @click="showSettings = !showSettings">
            <Settings2 :size="16" />
          </button>
          <button class="icon-button" title="迷你悬浮模式" @click="toggleMiniMode">
            <Shrink :size="16" />
          </button>
          <button class="icon-button" :title="themeMode === 'dark' ? '浅色模式' : '深色模式'" @click="toggleTheme">
            <Sun v-if="themeMode === 'dark'" :size="16" />
            <Moon v-else :size="16" />
          </button>
          <button
            class="icon-button"
            :title="alwaysOnTop ? '取消置顶' : '窗口置顶'"
            @click="toggleAlwaysOnTop"
          >
            <PinOff v-if="alwaysOnTop" :size="16" />
            <Pin v-else :size="16" />
          </button>
          <button class="icon-button" title="最小化" @click="appWindow.minimize()">
            <Minus :size="16" />
          </button>
          <button class="icon-button danger" title="关闭到托盘" @click="appWindow.close()">
            <X :size="16" />
          </button>
        </div>
      </header>

      <section class="hero-panel">
        <div class="hero-meta">
          <p>今日已入账</p>
          <span>{{ workDurationText }}</span>
        </div>

        <button class="amount-display" title="双击进入迷你悬浮模式" @dblclick="setMiniMode(true)">
          <span class="currency">¥</span>
          <strong>{{ earnedText }}</strong>
        </button>

        <div class="progress-track">
          <div class="progress-fill" :style="{ width: progressPercent }" />
        </div>

        <div class="rate-grid">
          <article class="rate-card">
            <Banknote :size="16" />
            <span>时薪</span>
            <strong>¥{{ snapshot.hourlyRate.toFixed(2) }}</strong>
          </article>
          <article class="rate-card">
            <Clock3 :size="16" />
            <span>分薪</span>
            <strong>¥{{ snapshot.minuteRate.toFixed(2) }}</strong>
          </article>
          <article class="rate-card">
            <Coffee :size="16" />
            <span>秒薪</span>
            <strong>¥{{ snapshot.secondRate.toFixed(4) }}</strong>
          </article>
        </div>
      </section>

      <section v-if="showSettings" class="settings-panel">
        <div class="grid grid-cols-2 gap-3">
          <label class="field">
            <span>月薪</span>
            <input v-model.number="config.monthlySalary" min="0" step="100" type="number" />
          </label>
          <label class="field">
            <span>每月工作天数</span>
            <input v-model.number="config.workDaysPerMonth" min="1" step="0.5" type="number" />
          </label>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <label class="field">
            <span>上班</span>
            <input v-model="config.startTime" type="time" />
          </label>
          <label class="field">
            <span>下班</span>
            <input v-model="config.endTime" type="time" />
          </label>
        </div>

        <label class="checkbox-row">
          <input v-model="config.enableLunchBreak" type="checkbox" />
          剔除午休时间
        </label>

        <div class="grid grid-cols-2 gap-3">
          <label class="field">
            <span>午休开始</span>
            <input v-model="config.lunchStart" :disabled="!config.enableLunchBreak" type="time" />
          </label>
          <label class="field">
            <span>午休结束</span>
            <input v-model="config.lunchEnd" :disabled="!config.enableLunchBreak" type="time" />
          </label>
        </div>
      </section>
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

.titlebar {
  display: flex;
  height: 48px;
  flex: 0 0 auto;
  align-items: center;
  justify-content: space-between;
  padding: 0 12px;
}

.status-chip {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 4px;
  color: var(--muted);
  font-size: 14px;
  font-weight: 500;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 999px;
}

.window-actions {
  display: flex;
  align-items: center;
  gap: 4px;
}

.icon-button {
  display: grid;
  width: 32px;
  height: 32px;
  place-items: center;
  border-radius: 9px;
  color: var(--muted);
  transition:
    background-color 160ms ease,
    color 160ms ease,
    transform 160ms ease;
}

.icon-button:hover {
  background: var(--subtle);
  color: var(--text);
}

.icon-button:active {
  transform: scale(0.96);
}

.icon-button.danger:hover {
  background: rgb(239 68 68 / 0.12);
  color: var(--danger);
}

.hero-panel {
  display: flex;
  min-height: 0;
  flex: 1;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 22px 32px 28px;
  text-align: center;
}

.hero-meta {
  display: flex;
  width: 100%;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: var(--muted);
}

.hero-meta p {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
}

.hero-meta span {
  border-radius: 999px;
  background: var(--subtle);
  padding: 4px 10px;
  font-family: "JetBrains Mono", "Cascadia Mono", Consolas, monospace;
  font-size: 12px;
}

.amount-display {
  display: flex;
  max-width: 100%;
  align-items: flex-end;
  justify-content: center;
  gap: 10px;
  margin-top: 28px;
  color: var(--text);
}

.amount-display .currency {
  padding-bottom: 8px;
  color: var(--muted);
  font-family: "JetBrains Mono", "Cascadia Mono", Consolas, monospace;
  font-size: 34px;
  font-weight: 650;
}

.amount-display strong {
  overflow: hidden;
  max-width: 100%;
  font-family: "JetBrains Mono", "Cascadia Mono", Consolas, monospace;
  font-size: 58px;
  font-weight: 700;
  line-height: 0.98;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
  letter-spacing: 0;
}

.progress-track {
  width: 100%;
  height: 6px;
  margin-top: 32px;
  overflow: hidden;
  border-radius: 999px;
  background: var(--subtle);
}

.progress-fill {
  height: 100%;
  border-radius: inherit;
  background: var(--accent);
  transition: width 200ms ease-out;
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
  padding: 13px;
  border: 1px solid var(--line);
  border-radius: 12px;
  background: var(--panel-soft);
  box-shadow: 0 8px 24px rgb(15 23 42 / 0.05);
  text-align: left;
}

.rate-card svg,
.rate-card span {
  color: var(--muted);
}

.rate-card span {
  font-size: 12px;
}

.rate-card strong {
  overflow: hidden;
  color: var(--text);
  font-family: "JetBrains Mono", "Cascadia Mono", Consolas, monospace;
  font-size: 15px;
  font-weight: 650;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}

.settings-panel {
  display: grid;
  flex: 0 0 auto;
  gap: 12px;
  border-top: 1px solid var(--line);
  background: var(--panel-soft);
  padding: 20px;
}

.field {
  display: grid;
  gap: 6px;
}

.field span {
  color: var(--muted);
  font-size: 12px;
  font-weight: 500;
}

.field input {
  height: 36px;
  min-width: 0;
  border: 1px solid var(--line);
  border-radius: 10px;
  background: var(--panel);
  padding: 0 10px;
  color: var(--text);
  outline: none;
  transition:
    border-color 160ms ease,
    box-shadow 160ms ease,
    background-color 160ms ease;
}

.field input:focus {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px rgb(127 127 127 / 0.14);
}

.field input:disabled {
  background: var(--subtle);
  color: var(--muted);
}

.checkbox-row {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--muted);
  font-size: 14px;
  font-weight: 600;
}

.checkbox-row input {
  width: 16px;
  height: 16px;
  accent-color: var(--accent);
}

.mini-window {
  display: grid;
  width: 100%;
  height: 100%;
  place-items: center;
  border: 1px solid var(--border);
  border-radius: 18px;
  background: var(--panel);
  box-shadow: var(--shadow);
  color: var(--text);
  backdrop-filter: blur(30px);
}

.mini-window span {
  overflow: hidden;
  max-width: calc(100vw - 28px);
  font-family: "JetBrains Mono", "Cascadia Mono", Consolas, monospace;
  font-size: 31px;
  font-weight: 750;
  line-height: 1;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
  letter-spacing: 0;
}
</style>
