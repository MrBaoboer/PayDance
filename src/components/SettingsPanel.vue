<script setup lang="ts">
import { computed, ref } from "vue";
import { openUrl } from "@tauri-apps/plugin-opener";
import { Github } from "lucide-vue-next";
import {
  appAuthor,
  appCopyright,
  appEnglishName,
  appName,
  appVersion,
  repositoryUrl,
} from "../lib/app-meta";
import { parseNumberInput } from "../lib/number-input";
import type { SalaryConfig, SalaryConfigIssue, SalaryType } from "../lib/salary";

const props = defineProps<{
  amountMode: "rolling" | "plain";
  config: SalaryConfig;
  firstIssue: string;
  hasIssue: (field: SalaryConfigIssue["field"]) => boolean;
}>();

const emit = defineEmits<{
  "update:amountMode": [mode: "rolling" | "plain"];
  "update:config": [config: SalaryConfig];
}>();

const salaryTypeOptions: Array<{ value: SalaryType; label: string }> = [
  { value: "monthly", label: "月薪" },
  { value: "daily", label: "日薪" },
  { value: "hourly", label: "时薪" },
];

const weekdayOptions = [
  { value: 1, label: "一" },
  { value: 2, label: "二" },
  { value: 3, label: "三" },
  { value: 4, label: "四" },
  { value: 5, label: "五" },
  { value: 6, label: "六" },
  { value: 0, label: "日" },
];

const salaryAmountLabel = computed(() => {
  if (props.config.salaryType === "daily") return "日薪";
  if (props.config.salaryType === "hourly") return "时薪";
  return "月薪";
});

const updateConfig = <Key extends keyof SalaryConfig>(
  key: Key,
  value: SalaryConfig[Key],
) => {
  emit("update:config", { ...props.config, [key]: value });
};

const toggleWorkday = (day: number) => {
  const workdays = props.config.workdays.includes(day)
    ? props.config.workdays.filter((item) => item !== day)
    : [...props.config.workdays, day];

  updateConfig("workdays", [...workdays].sort((a, b) => a - b));
};

const updateNumberConfig = <Key extends keyof SalaryConfig>(
  key: Key,
  event: Event,
) => {
  const value = parseNumberInput((event.target as HTMLInputElement).value);
  if (value === null) return;
  updateConfig(key, value as SalaryConfig[Key]);
};

const readText = (event: Event) => (event.target as HTMLInputElement).value;
const readChecked = (event: Event) => (event.target as HTMLInputElement).checked;
const isOpeningRepository = ref(false);
const repositoryError = ref("");

const openRepository = async () => {
  if (isOpeningRepository.value) return;

  isOpeningRepository.value = true;
  repositoryError.value = "";

  try {
    await openUrl(repositoryUrl);
  } catch (error) {
    console.error("Failed to open repository", error);
    repositoryError.value = "无法打开 GitHub 仓库，请稍后重试。";
  } finally {
    isOpeningRepository.value = false;
  }
};
</script>

<template>
  <section class="settings-panel">
    <div v-if="firstIssue" class="settings-alert">
      {{ firstIssue }}
    </div>

    <section class="settings-group">
      <div class="group-title">
        <strong>薪资模式</strong>
      </div>
      <div
        class="segmented-control segmented-control--three"
        :class="{ 'is-invalid': hasIssue('salaryType') }"
        aria-label="薪资输入方式"
      >
        <button
          v-for="option in salaryTypeOptions"
          :key="option.value"
          :class="{ 'is-active': config.salaryType === option.value }"
          type="button"
          @click="updateConfig('salaryType', option.value)"
        >
          {{ option.label }}
        </button>
      </div>
    </section>

    <section class="settings-group">
      <div class="group-title">
        <strong>薪资</strong>
      </div>
      <div class="field-grid">
        <label
          v-if="config.salaryType === 'monthly'"
          class="field"
          :class="{ 'is-invalid': hasIssue('monthlySalary') }"
        >
          <span>{{ salaryAmountLabel }}</span>
          <span class="field-input-wrap">
            <input
              :value="config.monthlySalary"
              min="0"
              step="100"
              type="number"
              @input="updateNumberConfig('monthlySalary', $event)"
            />
            <span class="field-unit">元</span>
          </span>
        </label>
        <label
          v-if="config.salaryType === 'daily'"
          class="field"
          :class="{ 'is-invalid': hasIssue('dailySalary') }"
        >
          <span>{{ salaryAmountLabel }}</span>
          <span class="field-input-wrap">
            <input
              :value="config.dailySalary"
              min="0"
              step="50"
              type="number"
              @input="updateNumberConfig('dailySalary', $event)"
            />
            <span class="field-unit">元</span>
          </span>
        </label>
        <label
          v-if="config.salaryType === 'hourly'"
          class="field"
          :class="{ 'is-invalid': hasIssue('hourlyRate') }"
        >
          <span>{{ salaryAmountLabel }}</span>
          <span class="field-input-wrap">
            <input
              :value="config.hourlyRate"
              min="0"
              step="5"
              type="number"
              @input="updateNumberConfig('hourlyRate', $event)"
            />
            <span class="field-unit">元</span>
          </span>
        </label>
        <label
          v-if="config.salaryType === 'monthly'"
          class="field"
          :class="{ 'is-invalid': hasIssue('workDaysPerMonth') }"
        >
          <span>每月工作天数</span>
          <span class="field-input-wrap">
            <input
              :value="config.workDaysPerMonth"
              min="1"
              step="0.5"
              type="number"
              @input="updateNumberConfig('workDaysPerMonth', $event)"
            />
            <span class="field-unit">天</span>
          </span>
        </label>
      </div>
    </section>

    <section class="settings-group">
      <div class="group-title">
        <strong>每周工作日</strong>
      </div>
      <div class="weekday-control" :class="{ 'is-invalid': hasIssue('workdays') }">
        <button
          v-for="day in weekdayOptions"
          :key="day.value"
          :class="{ 'is-active': config.workdays.includes(day.value) }"
          type="button"
          @click="toggleWorkday(day.value)"
        >
          {{ day.label }}
        </button>
      </div>
    </section>

    <section class="settings-group">
      <div class="group-title">
        <strong>工作时间</strong>
      </div>
      <div class="field-grid">
        <label class="field" :class="{ 'is-invalid': hasIssue('startTime') || hasIssue('workTime') }">
          <span>上班</span>
          <span class="field-input-wrap field-input-wrap--time">
            <input
              :value="config.startTime"
              type="time"
              @input="updateConfig('startTime', readText($event))"
            />
          </span>
        </label>
        <label class="field" :class="{ 'is-invalid': hasIssue('endTime') || hasIssue('workTime') }">
          <span>下班</span>
          <span class="field-input-wrap field-input-wrap--time">
            <input
              :value="config.endTime"
              type="time"
              @input="updateConfig('endTime', readText($event))"
            />
          </span>
        </label>
      </div>
    </section>

    <section class="settings-group">
      <div class="group-title group-title--split">
        <strong>午休</strong>
        <label class="switch-row">
          <input
            :checked="config.enableLunchBreak"
            type="checkbox"
            @change="updateConfig('enableLunchBreak', readChecked($event))"
          />
          <span>剔除</span>
        </label>
      </div>
      <div class="field-grid">
        <label class="field" :class="{ 'is-invalid': hasIssue('lunchStart') || hasIssue('workTime') }">
          <span>开始</span>
          <span class="field-input-wrap field-input-wrap--time">
            <input
              :disabled="!config.enableLunchBreak"
              :value="config.lunchStart"
              type="time"
              @input="updateConfig('lunchStart', readText($event))"
            />
          </span>
        </label>
        <label class="field" :class="{ 'is-invalid': hasIssue('lunchEnd') || hasIssue('workTime') }">
          <span>结束</span>
          <span class="field-input-wrap field-input-wrap--time">
            <input
              :disabled="!config.enableLunchBreak"
              :value="config.lunchEnd"
              type="time"
              @input="updateConfig('lunchEnd', readText($event))"
            />
          </span>
        </label>
      </div>
    </section>

    <section class="settings-group">
      <div class="group-title">
        <strong>金额变换</strong>
      </div>
      <div class="segmented-control" aria-label="金额数字变化方式">
        <button
          :class="{ 'is-active': amountMode === 'rolling' }"
          type="button"
          @click="emit('update:amountMode', 'rolling')"
        >
          滚动变换
        </button>
        <button
          :class="{ 'is-active': amountMode === 'plain' }"
          type="button"
          @click="emit('update:amountMode', 'plain')"
        >
          直接变换
        </button>
      </div>
    </section>

    <footer class="about-footer" aria-label="软件归属">
      <div class="about-footer__identity">
        <strong>{{ appName }} {{ appEnglishName }}</strong>
        <span>版本：{{ appVersion }}</span>
        <span>作者：{{ appAuthor }}</span>
      </div>
      <div class="about-footer__repo-card">
        <button
          class="repository-button"
          aria-label="打开 GitHub 仓库"
          :disabled="isOpeningRepository"
          :title="`打开 GitHub 仓库：${repositoryUrl}`"
          type="button"
          @click="openRepository"
        >
          <Github :size="18" stroke-width="2.2" />
          <span>GitHub</span>
        </button>
        <span class="about-footer__copyright about-footer__copyright--centered">{{ appCopyright }}</span>
      </div>
      <p v-if="repositoryError" class="about-footer__error">
        {{ repositoryError }}
      </p>
    </footer>
  </section>
</template>

<style scoped>
.settings-panel {
  display: grid;
  flex: 0 0 auto;
  gap: var(--ui-gap-sm, 10px);
  border-top: 1px solid var(--line);
  background: var(--panel-soft);
  padding: var(--ui-pad-md, 16px);
}

.settings-alert {
  border: 1px solid rgb(245 158 11 / 0.26);
  border-radius: var(--ui-radius-sm, 10px);
  background: rgb(245 158 11 / 0.12);
  padding: clamp(8px, 2cqh, 11px) var(--ui-pad-sm, 11px);
  color: var(--text);
  font-size: var(--ui-font-sm, 14px);
  font-weight: 600;
  text-align: left;
}

.settings-group {
  display: grid;
  gap: var(--ui-gap-sm, 10px);
  border: 1px solid var(--line);
  border-radius: var(--ui-radius-md, 12px);
  background: var(--panel);
  padding: var(--ui-pad-sm, 12px);
}

.group-title {
  display: flex;
  min-height: clamp(22px, 5.2cqh, 28px);
  align-items: center;
}

.group-title--split {
  justify-content: space-between;
  gap: var(--ui-gap-sm, 12px);
}

.group-title strong {
  color: var(--text);
  font-size: var(--ui-font-sm, 15px);
  font-weight: 700;
}

.field-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--ui-gap-sm, 10px);
}

.field {
  display: grid;
  gap: var(--ui-gap-xs, 6px);
}

.field > span,
.control-label {
  color: var(--muted);
  font-size: var(--ui-font-sm, 14px);
  font-weight: 500;
}

.field-input-wrap {
  display: grid;
  height: clamp(34px, 8.2cqh, 40px);
  min-width: 0;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  border: 1px solid var(--line);
  border-radius: var(--ui-radius-sm, 10px);
  background: var(--panel);
  overflow: hidden;
  transition:
    border-color 160ms ease,
    box-shadow 160ms ease,
    background-color 160ms ease;
}

.field-input-wrap--time {
  grid-template-columns: minmax(0, 1fr);
}

.field input {
  width: 100%;
  height: 100%;
  min-width: 0;
  border: 0;
  background: transparent;
  font-family: var(--font-mono);
  font-size: var(--ui-font-sm, 14px);
  padding: 0 clamp(9px, 2.2cqw, 13px);
  color: var(--text);
  outline: none;
}

.field input[type="number"] {
  padding-left: clamp(10px, 2.4cqw, 14px);
  padding-right: clamp(4px, 1cqw, 7px);
}

.field input[type="time"] {
  padding-left: clamp(28px, 6.4cqw, 38px);
  padding-right: clamp(5px, 1.2cqw, 8px);
  text-align: center;
}

.field input[type="time"]::-webkit-calendar-picker-indicator {
  margin-right: -2px;
}

.field-unit {
  display: inline-flex;
  min-width: clamp(34px, 7.5cqw, 44px);
  height: 100%;
  align-items: center;
  justify-content: center;
  color: var(--muted);
  font-size: var(--ui-font-xs, 13px);
  font-weight: 650;
  pointer-events: none;
  white-space: nowrap;
}

.field-input-wrap:focus-within {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px rgb(127 127 127 / 0.14);
}

.field.is-invalid .field-input-wrap,
.segmented-control.is-invalid {
  border-color: rgb(245 158 11 / 0.68);
  box-shadow: 0 0 0 3px rgb(245 158 11 / 0.12);
}

.field-input-wrap:has(input:disabled) {
  background: var(--subtle);
}

.field input:disabled {
  color: var(--muted);
}

.switch-row {
  display: flex;
  align-items: center;
  gap: var(--ui-gap-xs, 7px);
  color: var(--muted);
  font-size: var(--ui-font-sm, 14px);
  font-weight: 600;
}

.switch-row input {
  width: 16px;
  height: clamp(15px, 3.4cqw, 18px);
  accent-color: var(--accent);
}

.control-stack {
  display: grid;
  gap: var(--ui-gap-xs, 6px);
}

.segmented-control {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: clamp(3px, 0.9cqw, 5px);
  border: 1px solid var(--line);
  border-radius: var(--ui-radius-sm, 10px);
  background: var(--subtle);
  padding: clamp(3px, 0.9cqw, 5px);
}

.segmented-control--three {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.segmented-control button {
  height: clamp(32px, 7.6cqh, 38px);
  border-radius: clamp(6px, 1.6cqw, 8px);
  color: var(--muted);
  font-size: var(--ui-font-sm, 14px);
  font-weight: 650;
  transition:
    background-color 160ms ease,
    color 160ms ease,
    box-shadow 160ms ease;
}

.segmented-control button.is-active {
  background: var(--panel);
  box-shadow: 0 5px 14px rgb(15 23 42 / 0.08);
  color: var(--text);
}

.weekday-control {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: clamp(4px, 1.1cqw, 6px);
}

.weekday-control button {
  height: clamp(30px, 7cqh, 36px);
  border: 1px solid var(--line);
  border-radius: var(--ui-radius-sm, 9px);
  background: var(--panel-soft);
  color: var(--muted);
  font-size: var(--ui-font-xs, 13px);
  font-weight: 700;
  transition:
    border-color 160ms ease,
    background-color 160ms ease,
    color 160ms ease,
    transform 160ms ease;
}

.weekday-control button.is-active {
  border-color: var(--income-accent-ring);
  background: var(--income-accent-glow);
  color: var(--text);
}

.weekday-control button:active {
  transform: scale(0.96);
}

.weekday-control.is-invalid button {
  border-color: rgb(245 158 11 / 0.42);
}

.about-footer {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--ui-gap-sm, 12px);
  border: 1px solid var(--line);
  border-radius: var(--ui-radius-md, 12px);
  background: color-mix(in srgb, var(--panel) 72%, transparent);
  padding: var(--ui-pad-sm, 12px);
}

.about-footer__identity {
  display: grid;
  min-width: 0;
  gap: 4px;
  text-align: left;
}

.about-footer__identity strong {
  overflow: hidden;
  color: var(--text);
  font-size: var(--ui-font-sm, 14px);
  font-weight: 750;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.about-footer__identity span,
.about-footer__copyright {
  overflow: hidden;
  color: var(--muted);
  font-size: var(--ui-font-xs, 12px);
  font-weight: 550;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.about-footer__copyright--centered {
  width: 100%;
  text-align: center;
}

.about-footer__repo-card {
  display: grid;
  justify-items: center;
  gap: 5px;
}

.repository-button {
  display: inline-flex;
  height: clamp(32px, 7.6cqh, 38px);
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  gap: var(--ui-gap-xs, 7px);
  border: 1px solid var(--line);
  border-radius: var(--ui-radius-sm, 10px);
  background: var(--panel);
  padding: 0 var(--ui-pad-sm, 12px);
  color: var(--muted);
  font-size: var(--ui-font-sm, 14px);
  font-weight: 700;
  transition:
    border-color 160ms ease,
    background-color 160ms ease,
    color 160ms ease,
    transform 160ms ease;
}

.repository-button:hover {
  border-color: var(--income-accent-ring);
  background: var(--income-accent-glow);
  color: var(--text);
}

.repository-button:active {
  transform: scale(0.97);
}

.repository-button:disabled {
  cursor: default;
  opacity: 0.58;
  transform: none;
}

.about-footer__error {
  flex: 1 0 100%;
  margin: 0;
  color: var(--danger);
  font-size: var(--ui-font-xs, 12px);
  font-weight: 600;
  text-align: left;
}

@media (max-width: 460px) {
  .field-grid {
    grid-template-columns: 1fr;
  }

  .about-footer {
    justify-content: center;
  }

  .about-footer__repo-card {
    justify-items: center;
  }
}
</style>
