<script setup lang="ts">
// SPDX-FileCopyrightText: 2026 Mr.Baoboer
// SPDX-License-Identifier: AGPL-3.0-only
//
// Additional terms: see /legal/ADDITIONAL_TERMS.md
import { ref } from "vue";
import { openExternalUrl } from "#opener";
import type { UpdaterStatus } from "#updater";
import { useI18n } from "../../composables/useI18n";
import {
  appAuthor,
  appCopyright,
  appEnglishName,
  appName,
  appVersion,
  repositoryUrl,
} from "../../lib/app-meta";
import GitHubMark from "../icons/GitHubMark.vue";
import UpdateActionBadge from "./UpdateActionBadge.vue";

defineProps<{
  isCheckingUpdate?: boolean;
  onCheckUpdate?: () => Promise<UpdaterStatus> | void;
  onInstallUpdate?: () => Promise<UpdaterStatus> | void;
  updateStatus?: UpdaterStatus;
}>();

const { t } = useI18n();
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
  <footer class="about-footer" :aria-label="t('about.openRepo')">
    <div class="about-footer__identity">
      <strong>{{ appName }} {{ appEnglishName }}</strong>
      <span class="about-footer__version-line">
        <span class="about-footer__version-text"
          >{{ t("about.appVersion") }}{{ t("about.labelSeparator")
          }}{{ appVersion }}</span
        >
        <UpdateActionBadge
          :is-checking-update="isCheckingUpdate"
          :on-check-update="onCheckUpdate"
          :on-install-update="onInstallUpdate"
          :update-status="updateStatus"
        />
      </span>
      <span
        >{{ t("about.appAuthor") }}{{ t("about.labelSeparator") }}{{ appAuthor }}</span
      >
    </div>
    <div class="about-footer__repo-card">
      <button
        class="repository-button"
        :aria-label="t('about.openRepo')"
        :disabled="isOpeningRepository"
        :title="`${t('about.openRepo')}${t('about.labelSeparator')}${repositoryUrl}`"
        type="button"
        @click="openRepository"
      >
        <GitHubMark />
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
</template>

<style scoped>
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

.about-footer__version-line {
  display: inline-flex;
  align-items: center;
  gap: 3px;
}

.about-footer__version-text {
  min-width: 0;
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
    border-color 140ms ease,
    background-color 140ms ease,
    box-shadow 140ms ease,
    color 140ms ease,
    transform 120ms ease;
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

.repository-button :deep(.github-mark) {
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
