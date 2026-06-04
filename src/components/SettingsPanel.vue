<script setup lang="ts">
// SPDX-FileCopyrightText: 2026 Mr.Baoboer
// SPDX-License-Identifier: AGPL-3.0-only
//
// Additional terms: see /legal/ADDITIONAL_TERMS.md
import { computed, ref } from "vue";
import {
  appAuthor,
  appCopyright,
  appEnglishName,
  appName,
  appVersion,
  repositoryUrl,
} from "../lib/app-meta";
import type { SalaryConfig, SalaryConfigIssue } from "../lib/salary";
import {
  useI18n,
  type Locale,
  localeLabels,
  supportedLocales,
} from "../composables/useI18n";
import type { UpdaterStatus } from "../platform/updater";
import { openExternalUrl } from "../platform/opener";
import type { Messages } from "../i18n/types";
import LunchBreakFields from "./settings/LunchBreakFields.vue";
import SalaryAmountFields from "./settings/SalaryAmountFields.vue";
import SalaryModeControl from "./settings/SalaryModeControl.vue";
import UpdateActionBadge from "./settings/UpdateActionBadge.vue";
import WorkdayPicker from "./settings/WorkdayPicker.vue";
import WorkTimeFields from "./settings/WorkTimeFields.vue";
import SegmentedControl from "./ui/SegmentedControl.vue";
import SettingsGroup from "./ui/SettingsGroup.vue";
import SwitchRow from "./ui/SwitchRow.vue";

const { locale, setLocale, t } = useI18n();

const props = withDefaults(
  defineProps<{
    amountMode: "rolling" | "plain";
    autostartEnabled: boolean;
    autostartError: string;
    config: SalaryConfig;
    firstIssue: string;
    hasIssue: (field: SalaryConfigIssue["field"]) => boolean;
    isAutostartUpdating: boolean;
    settingsSaveError?: string;
    showDesktopFeatures?: boolean;
    updateStatus: UpdaterStatus;
  }>(),
  {
    settingsSaveError: "",
    showDesktopFeatures: true,
  },
);

const emit = defineEmits<{
  "update:autostartEnabled": [enabled: boolean];
  "update:amountMode": [mode: "rolling" | "plain"];
  "update:config": [config: SalaryConfig];
  "update:locale": [locale: Locale];
}>();

const amountModeOptions = computed(
  () =>
    [
      { label: t.value("amountMode.rolling"), value: "rolling" },
      { label: t.value("amountMode.plain"), value: "plain" },
    ] as const,
);

const settingsSaveErrorText = computed(() =>
  props.settingsSaveError ? t.value(props.settingsSaveError as keyof Messages) : "",
);

const langOptions = computed(() =>
  supportedLocales.map((loc) => ({
    label: localeLabels[loc],
    value: loc,
  })),
);

const updateLocale = (val: string) => {
  const next = val as Locale;
  setLocale(next);
  emit("update:locale", next);
};

const updateAmountMode = (mode: string) => {
  emit("update:amountMode", mode as "rolling" | "plain");
};

const updateConfig = <Key extends keyof SalaryConfig>(
  key: Key,
  value: SalaryConfig[Key],
) => {
  emit("update:config", { ...props.config, [key]: value });
};

const isOpeningRepository = ref(false);
const repositoryError = ref("");

const openRepository = async () => {
  if (isOpeningRepository.value) return;

  isOpeningRepository.value = true;
  repositoryError.value = "";

  try {
    await openExternalUrl(repositoryUrl);
  } catch (error) {
    console.error("Failed to open repository", error);
    repositoryError.value = t.value("about.repoError");
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

    <div v-if="settingsSaveErrorText" class="settings-save-error" role="status">
      {{ settingsSaveErrorText }}
    </div>

    <SettingsGroup :title="t('settings.salaryMode')">
      <SalaryModeControl
        density="settings"
        :invalid="hasIssue('salaryType')"
        :model-value="config.salaryType"
        @update:model-value="updateConfig('salaryType', $event)"
      />
    </SettingsGroup>

    <SettingsGroup :title="t('settings.salary')">
      <SalaryAmountFields
        density="settings"
        :config="config"
        :has-issue="hasIssue"
        @update:config="emit('update:config', $event)"
      />
    </SettingsGroup>

    <SettingsGroup :title="t('settings.workdays')">
      <WorkdayPicker
        density="settings"
        :invalid="hasIssue('workdays')"
        :workdays="config.workdays"
        @update:workdays="updateConfig('workdays', $event)"
      />
    </SettingsGroup>

    <SettingsGroup :title="t('settings.workTime')">
      <WorkTimeFields
        density="settings"
        :config="config"
        :has-issue="hasIssue"
        @update:config="emit('update:config', $event)"
      />
    </SettingsGroup>

    <SettingsGroup>
      <LunchBreakFields
        density="settings"
        variant="settings"
        :config="config"
        :has-issue="hasIssue"
        @update:config="emit('update:config', $event)"
      />
    </SettingsGroup>

    <SettingsGroup :title="t('settings.amountAnimation')">
      <SegmentedControl
        :columns="2"
        :label="t('settings.amountAnimationDesc')"
        :model-value="amountMode"
        :options="amountModeOptions"
        @update:model-value="updateAmountMode"
      />
    </SettingsGroup>

    <SettingsGroup :title="t('settings.language')">
      <SegmentedControl
        :columns="2"
        :label="t('settings.language')"
        :model-value="locale"
        :options="langOptions"
        @update:model-value="updateLocale"
      />
    </SettingsGroup>

    <SettingsGroup v-if="showDesktopFeatures" :title="t('settings.startup')">
      <template #action>
        <SwitchRow
          :label="t('settings.autostart')"
          title-action
          :disabled="isAutostartUpdating"
          :model-value="autostartEnabled"
          @update:model-value="emit('update:autostartEnabled', $event)"
        />
      </template>
      <p v-if="autostartError" class="settings-inline-error">
        {{ autostartError }}
      </p>
    </SettingsGroup>

    <footer class="about-footer" :aria-label="t('about.openRepo')">
      <div class="about-footer__identity">
        <strong>{{ appName }} {{ appEnglishName }}</strong>
        <span>
          {{ t("about.appVersion") }}：{{ appVersion }}
          <UpdateActionBadge :update-status="updateStatus" />
        </span>
        <span>{{ t("about.appAuthor") }}：{{ appAuthor }}</span>
      </div>
      <div class="about-footer__repo-card">
        <button
          class="repository-button"
          :aria-label="t('about.openRepo')"
          :disabled="isOpeningRepository"
          :title="`${t('about.openRepo')}：${repositoryUrl}`"
          type="button"
          @click="openRepository"
        >
          <svg class="github-mark" aria-hidden="true" viewBox="0 0 24 24">
            <path
              fill-rule="evenodd"
              clip-rule="evenodd"
              d="M12 2C6.48 2 2 6.59 2 12.25c0 4.53 2.87 8.37 6.84 9.73.5.09.68-.22.68-.49 0-.24-.01-.89-.01-1.75-2.78.62-3.37-1.37-3.37-1.37-.45-1.18-1.11-1.49-1.11-1.49-.91-.64.07-.63.07-.63 1 .07 1.53 1.06 1.53 1.06.89 1.56 2.34 1.11 2.91.85.09-.66.35-1.11.63-1.37-2.22-.26-4.56-1.14-4.56-5.06 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.3.1-2.71 0 0 .84-.28 2.75 1.05A9.38 9.38 0 0 1 12 6.98c.85 0 1.7.12 2.5.35 1.91-1.33 2.75-1.05 2.75-1.05.55 1.41.2 2.45.1 2.71.64.72 1.03 1.63 1.03 2.75 0 3.93-2.34 4.79-4.57 5.05.36.32.68.94.68 1.9 0 1.37-.01 2.47-.01 2.81 0 .27.18.59.69.49A10.24 10.24 0 0 0 22 12.25C22 6.59 17.52 2 12 2Z"
            />
          </svg>
          <span>GitHub</span>
        </button>
        <span class="about-footer__copyright about-footer__copyright--centered">{{
          appCopyright
        }}</span>
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
  gap: clamp(11px, 2.6cqh, 14px);
  border-top: 1px solid var(--line);
  background: var(--panel-soft);
  padding: clamp(15px, 3.6cqw, 19px);
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

.settings-inline-error {
  margin: 0;
  color: var(--danger);
  font-size: var(--ui-font-xs, 12px);
  font-weight: 600;
  text-align: left;
}

.settings-save-error {
  border: 1px solid rgb(231 76 60 / 0.28);
  border-radius: var(--ui-radius-sm, 10px);
  background: rgb(231 76 60 / 0.1);
  padding: clamp(8px, 2cqh, 11px) var(--ui-pad-sm, 11px);
  color: var(--danger);
  font-size: var(--ui-font-sm, 14px);
  font-weight: 650;
  text-align: left;
}

.about-footer {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: var(--ui-gap-sm, 12px);
  border: 1px solid var(--line);
  border-radius: var(--ui-radius-md, 12px);
  background: color-mix(in srgb, var(--panel) 72%, transparent);
  padding: var(--ui-pad-sm, 12px);
}

.about-footer__identity {
  display: grid;
  min-width: clamp(96px, 20cqw, 112px);
  gap: 4px;
  align-content: center;
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
  font-family: var(--font-dashboard);
  font-size: var(--ui-font-xs, 12px);
  font-weight: 550;
  line-height: 1.35;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}

.about-footer__copyright--centered {
  width: 100%;
  text-align: center;
  transform: translateX(calc(var(--about-footer-nudge) * -1));
}

.about-footer__repo-card {
  --about-footer-nudge: clamp(3px, 0.9cqw, 5px);
  display: grid;
  min-width: clamp(92px, 20cqw, 112px);
  align-content: center;
  justify-items: center;
  gap: 6px;
}

.repository-button {
  display: inline-flex;
  width: clamp(92px, 20cqw, 108px);
  height: clamp(32px, 7.6cqh, 38px);
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  gap: var(--ui-gap-xs, 7px);
  border: 1px solid var(--line);
  border-radius: var(--ui-radius-sm, 10px);
  background: color-mix(in srgb, var(--panel) 86%, var(--subtle));
  padding: 0 clamp(9px, 2cqw, 11px);
  color: var(--muted);
  font-family: var(--font-dashboard);
  font-size: var(--ui-font-sm, 14px);
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  transition:
    border-color 160ms ease,
    background-color 160ms ease,
    box-shadow 160ms ease,
    color 160ms ease,
    transform 160ms ease;
}

.repository-button:hover {
  border-color: var(--income-accent-ring);
  background: var(--income-accent-glow);
  box-shadow: 0 7px 18px rgb(15 23 42 / 0.08);
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

.github-mark {
  width: 20px;
  height: 20px;
  fill: currentColor;
}

.about-footer__error {
  grid-column: 1 / -1;
  margin: 0;
  color: var(--danger);
  font-size: var(--ui-font-xs, 12px);
  font-weight: 600;
  text-align: left;
}
</style>
