<script setup lang="ts">
import { computed, ref } from "vue";
import { Check, ChevronLeft, ChevronRight } from "@lucide/vue";
import {
  validateSalaryConfig,
  type SalaryConfig,
  type SalaryConfigIssue,
} from "../lib/salary";
import { getOnboardingStepIssues } from "../lib/onboarding-validation";
import { readInputChecked } from "../lib/settings-form";
import LunchBreakFields from "./settings/LunchBreakFields.vue";
import SalaryAmountFields from "./settings/SalaryAmountFields.vue";
import SalaryModeControl from "./settings/SalaryModeControl.vue";
import WorkdayPicker from "./settings/WorkdayPicker.vue";
import WorkTimeFields from "./settings/WorkTimeFields.vue";

const props = defineProps<{
  alwaysOnTop: boolean;
  autostartEnabled: boolean;
  config: SalaryConfig;
  themeMode: "light" | "dark";
}>();

const emit = defineEmits<{
  complete: [preferences: { startInMiniMode: boolean }];
  dragStart: [event: MouseEvent];
  resizeStart: [
    direction:
      | "East"
      | "North"
      | "NorthEast"
      | "NorthWest"
      | "South"
      | "SouthEast"
      | "SouthWest"
      | "West",
  ];
  "update:alwaysOnTop": [value: boolean];
  "update:autostartEnabled": [value: boolean];
  "update:config": [config: SalaryConfig];
  "update:themeMode": [mode: "light" | "dark"];
}>();

const step = ref(0);
const startInMiniMode = ref(false);

const stepTitles = ["薪资模式", "工作时间", "使用偏好"];
const issues = computed(() => validateSalaryConfig(props.config));
const currentStepIssues = computed(() =>
  getOnboardingStepIssues(step.value, props.config, issues.value),
);
const firstIssue = computed(() => currentStepIssues.value[0]?.message ?? "");
const isLastStep = computed(() => step.value === stepTitles.length - 1);
const canContinue = computed(() => currentStepIssues.value.length === 0);

const hasIssue = (field: SalaryConfigIssue["field"]) =>
  issues.value.some((issue) => issue.field === field);

const updateConfig = <Key extends keyof SalaryConfig>(
  key: Key,
  value: SalaryConfig[Key],
) => {
  emit("update:config", { ...props.config, [key]: value });
};

const goNext = () => {
  if (isLastStep.value) {
    emit("complete", { startInMiniMode: startInMiniMode.value });
    return;
  }

  step.value += 1;
};

const goBack = () => {
  step.value = Math.max(0, step.value - 1);
};
</script>

<template>
  <div class="onboarding-overlay" @mousedown.left.self="emit('dragStart', $event)">
    <button
      class="resize-handle resize-handle--north"
      aria-hidden="true"
      tabindex="-1"
      type="button"
      @mousedown.left.stop.prevent="emit('resizeStart', 'North')"
    />
    <button
      class="resize-handle resize-handle--east"
      aria-hidden="true"
      tabindex="-1"
      type="button"
      @mousedown.left.stop.prevent="emit('resizeStart', 'East')"
    />
    <button
      class="resize-handle resize-handle--south"
      aria-hidden="true"
      tabindex="-1"
      type="button"
      @mousedown.left.stop.prevent="emit('resizeStart', 'South')"
    />
    <button
      class="resize-handle resize-handle--west"
      aria-hidden="true"
      tabindex="-1"
      type="button"
      @mousedown.left.stop.prevent="emit('resizeStart', 'West')"
    />
    <button
      class="resize-handle resize-handle--north-east"
      aria-hidden="true"
      tabindex="-1"
      type="button"
      @mousedown.left.stop.prevent="emit('resizeStart', 'NorthEast')"
    />
    <button
      class="resize-handle resize-handle--north-west"
      aria-hidden="true"
      tabindex="-1"
      type="button"
      @mousedown.left.stop.prevent="emit('resizeStart', 'NorthWest')"
    />
    <button
      class="resize-handle resize-handle--south-east"
      aria-hidden="true"
      tabindex="-1"
      type="button"
      @mousedown.left.stop.prevent="emit('resizeStart', 'SouthEast')"
    />
    <button
      class="resize-handle resize-handle--south-west"
      aria-hidden="true"
      tabindex="-1"
      type="button"
      @mousedown.left.stop.prevent="emit('resizeStart', 'SouthWest')"
    />
    <section class="onboarding-panel" aria-label="首次配置">
      <header class="onboarding-header">
        <div>
          <strong>{{ stepTitles[step] }}</strong>
        </div>
        <div class="step-dots" aria-hidden="true">
          <span
            v-for="(_, index) in stepTitles"
            :key="index"
            :class="{ 'is-active': index === step, 'is-done': index < step }"
          />
        </div>
      </header>

      <div class="onboarding-body">
        <section v-if="step === 0" class="onboarding-step">
          <SalaryModeControl
            density="onboarding"
            :model-value="config.salaryType"
            @update:model-value="updateConfig('salaryType', $event)"
          />

          <SalaryAmountFields
            density="onboarding"
            :config="config"
            :has-issue="hasIssue"
            @update:config="emit('update:config', $event)"
          />
        </section>

        <section v-else-if="step === 1" class="onboarding-step">
          <WorkdayPicker
            density="onboarding"
            :invalid="hasIssue('workdays')"
            :workdays="config.workdays"
            @update:workdays="updateConfig('workdays', $event)"
          />

          <WorkTimeFields
            density="onboarding"
            :config="config"
            :has-issue="hasIssue"
            @update:config="emit('update:config', $event)"
          />

          <LunchBreakFields
            density="onboarding"
            variant="onboarding"
            :config="config"
            :has-issue="hasIssue"
            @update:config="emit('update:config', $event)"
          />
        </section>

        <section v-else class="onboarding-step">
          <div class="segmented-control" aria-label="主题">
            <button :class="{ 'is-active': themeMode === 'light' }" type="button" @click="emit('update:themeMode', 'light')">
              浅色
            </button>
            <button :class="{ 'is-active': themeMode === 'dark' }" type="button" @click="emit('update:themeMode', 'dark')">
              深色
            </button>
          </div>

          <label class="switch-row switch-row--panel">
            <input
              :checked="autostartEnabled"
              type="checkbox"
              @change="emit('update:autostartEnabled', readInputChecked($event))"
            />
            <span>开机自动启动</span>
          </label>

          <label class="switch-row switch-row--panel">
            <input
              :checked="alwaysOnTop"
              type="checkbox"
              @change="emit('update:alwaysOnTop', readInputChecked($event))"
            />
            <span>窗口始终置顶</span>
          </label>

          <label class="switch-row switch-row--panel">
            <input v-model="startInMiniMode" type="checkbox" />
            <span>进入迷你悬浮模式</span>
          </label>
        </section>
      </div>

      <div v-if="firstIssue" class="onboarding-alert">
        {{ firstIssue }}
      </div>

      <footer class="onboarding-footer">
        <button class="secondary-button" :disabled="step === 0" type="button" @click="goBack">
          <ChevronLeft :size="16" />
          <span>上一步</span>
        </button>
        <button class="primary-button" :disabled="!canContinue" type="button" @click="goNext">
          <span>{{ isLastStep ? "开始" : "下一步" }}</span>
          <Check v-if="isLastStep" :size="16" />
          <ChevronRight v-else :size="16" />
        </button>
      </footer>
    </section>
  </div>
</template>

<style scoped>
.onboarding-overlay {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  border-radius: inherit;
  background: var(--onboarding-overlay, rgb(0 0 0 / 0.22));
  backdrop-filter: blur(12px) saturate(1.12);
  padding: clamp(18px, 4cqw, 24px);
  z-index: 20;
  cursor: move;
}

.onboarding-panel {
  display: grid;
  position: relative;
  width: min(100%, clamp(370px, 88cqw, 440px));
  max-height: 100%;
  overflow: hidden;
  border: 1px solid var(--onboarding-border, var(--border));
  border-radius: clamp(16px, 4cqw, 20px);
  background: var(--onboarding-panel, var(--panel));
  box-shadow: var(--shadow);
  color: var(--text);
  backdrop-filter: blur(30px) saturate(1.08);
  cursor: default;
  z-index: 1;
}

.onboarding-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--ui-gap-md, 16px);
  border-bottom: 1px solid var(--line);
  padding: clamp(16px, 3.8cqw, 20px);
}

.resize-handle {
  position: absolute;
  z-index: 2;
  border: 0;
  background: transparent;
  padding: 0;
}

.resize-handle--north,
.resize-handle--south {
  left: 12px;
  right: 12px;
  height: 10px;
  cursor: ns-resize;
}

.resize-handle--north {
  top: 0;
}

.resize-handle--south {
  bottom: 0;
}

.resize-handle--east,
.resize-handle--west {
  top: 12px;
  bottom: 12px;
  width: 10px;
  cursor: ew-resize;
}

.resize-handle--east {
  right: 0;
}

.resize-handle--west {
  left: 0;
}

.resize-handle--north-east,
.resize-handle--north-west,
.resize-handle--south-east,
.resize-handle--south-west {
  width: 16px;
  height: 16px;
}

.resize-handle--north-east,
.resize-handle--south-west {
  cursor: nesw-resize;
}

.resize-handle--north-west,
.resize-handle--south-east {
  cursor: nwse-resize;
}

.resize-handle--north-east {
  top: 0;
  right: 0;
}

.resize-handle--north-west {
  top: 0;
  left: 0;
}

.resize-handle--south-east {
  right: 0;
  bottom: 0;
}

.resize-handle--south-west {
  bottom: 0;
  left: 0;
}

.onboarding-header div:first-child {
  min-width: 0;
}

.onboarding-header strong {
  display: block;
  overflow: hidden;
  font-size: var(--ui-font-lg, 17px);
  font-weight: 760;
  line-height: 1.15;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.step-dots {
  display: flex;
  flex: 0 0 auto;
  gap: var(--ui-gap-xs, 6px);
  align-items: center;
}

.step-dots span {
  width: clamp(6px, 1.5cqw, 8px);
  height: clamp(6px, 1.5cqw, 8px);
  border-radius: 999px;
  background: color-mix(in srgb, var(--muted) 34%, transparent);
}

.step-dots span.is-active,
.step-dots span.is-done {
  background: var(--income-accent);
}

.onboarding-body {
  min-height: clamp(228px, 53cqh, 276px);
  overflow-y: auto;
  padding: clamp(20px, 4.4cqw, 24px);
}

.onboarding-step {
  display: grid;
  gap: clamp(16px, 3.6cqh, 20px);
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

.segmented-control button {
  height: clamp(34px, 8.2cqh, 40px);
  border-radius: clamp(6px, 1.6cqw, 8px);
  color: var(--muted);
  font-family: var(--font-dashboard);
  font-size: var(--ui-font-sm, 14px);
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.segmented-control button.is-active {
  background: var(--panel);
  box-shadow: 0 5px 14px rgb(15 23 42 / 0.08);
  color: var(--text);
}

.switch-row {
  display: flex;
  align-items: center;
  gap: var(--ui-gap-xs, 8px);
  color: var(--muted);
  font-size: var(--ui-font-sm, 14px);
  font-weight: 650;
}

.switch-row input {
  width: 16px;
  height: clamp(15px, 3.4cqw, 18px);
  accent-color: var(--accent);
}

.switch-row--panel {
  min-height: clamp(41px, 9.8cqh, 48px);
  border: 1px solid var(--line);
  border-radius: var(--ui-radius-sm, 10px);
  background: var(--panel-soft);
  padding: 0 var(--ui-pad-sm, 12px);
}

.onboarding-alert {
  margin: 0 18px 10px;
  border: 1px solid rgb(245 158 11 / 0.26);
  border-radius: var(--ui-radius-sm, 10px);
  background: rgb(245 158 11 / 0.12);
  padding: clamp(8px, 2cqh, 11px) var(--ui-pad-sm, 11px);
  color: var(--text);
  font-size: var(--ui-font-xs, 13px);
  font-weight: 650;
}

.onboarding-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--ui-gap-sm, 12px);
  border-top: 1px solid var(--line);
  padding: clamp(13px, 3cqw, 16px);
}

.primary-button,
.secondary-button {
  display: inline-flex;
  height: clamp(32px, 7.6cqh, 38px);
  align-items: center;
  justify-content: center;
  gap: var(--ui-gap-xs, 6px);
  border-radius: var(--ui-radius-sm, 10px);
  padding: 0 var(--ui-pad-sm, 12px);
  font-family: var(--font-dashboard);
  font-size: var(--ui-font-sm, 14px);
  font-weight: 750;
  font-variant-numeric: tabular-nums;
}

.primary-button {
  background: var(--text);
  color: var(--panel);
}

.secondary-button {
  background: var(--panel-soft);
  color: var(--muted);
}

.primary-button:disabled,
.secondary-button:disabled {
  cursor: default;
  opacity: 0.45;
}
</style>
