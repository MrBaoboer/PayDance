<script setup lang="ts">
// SPDX-FileCopyrightText: 2026 Mr.Baoboer
// SPDX-License-Identifier: AGPL-3.0-only
//
// Additional terms: see /legal/ADDITIONAL_TERMS.md
import { Focus, ShieldCheck, Zap } from "@lucide/vue";
import { useI18n } from "../composables/useI18n";

const { t } = useI18n();
</script>

<template>
  <div class="web-preview__feature-strip">
    <dl class="web-preview__chips" :aria-label="t('web.featureAriaLabel')">
      <div class="web-preview__chip">
        <span class="web-preview__chip-icon" aria-hidden="true">
          <Zap :size="18" :stroke-width="2.6" />
        </span>
        <dt class="web-preview__chip-copy">{{ t("web.featureRealtime") }}</dt>
        <dd>{{ t("web.featureRealtimeDesc") }}</dd>
      </div>
      <div class="web-preview__chip">
        <span class="web-preview__chip-icon" aria-hidden="true">
          <Focus :size="18" :stroke-width="2.4" />
        </span>
        <dt class="web-preview__chip-copy">{{ t("web.featureFocus") }}</dt>
        <dd>{{ t("web.featureFocusDesc") }}</dd>
      </div>
      <div class="web-preview__chip">
        <span class="web-preview__chip-icon" aria-hidden="true">
          <ShieldCheck :size="18" :stroke-width="2.4" />
        </span>
        <dt class="web-preview__chip-copy">{{ t("web.featurePrivacy") }}</dt>
        <dd>{{ t("web.featurePrivacyDesc") }}</dd>
      </div>
    </dl>
  </div>
</template>

<style scoped>
.web-preview__feature-strip {
  position: relative;
  z-index: 2;
  display: flex;
  width: 100%;
  grid-column: 1 / -1;
  justify-content: center;
  margin-top: clamp(6px, 1.6vh, 18px);
  margin-bottom: clamp(4px, 1.2vh, 14px);
}

.web-preview__chips {
  --web-chip-base-width: 272px;
  --web-chip-gap: 0px;
  --web-chip-scale: 1;
  display: grid;
  width: 100%;
  max-width: min(100%, 980px);
  grid-template-columns: repeat(
    3,
    calc(var(--web-chip-base-width) * var(--web-chip-scale))
  );
  justify-content: space-between;
  gap: calc(var(--web-chip-gap) * var(--web-chip-scale));
  margin: 0;
}

.web-preview__chip {
  display: grid;
  width: calc(var(--web-chip-base-width) * var(--web-chip-scale));
  min-width: 0;
  align-items: center;
  grid-template-columns: calc(46px * var(--web-chip-scale)) minmax(0, 1fr);
  grid-template-rows: auto auto;
  column-gap: calc(14px * var(--web-chip-scale));
  justify-items: start;
  padding: 0;
  text-align: left;
}

.web-preview__chip-icon {
  display: grid;
  width: calc(46px * var(--web-chip-scale));
  height: calc(46px * var(--web-chip-scale));
  grid-row: 1 / span 2;
  place-items: center;
  border: 1px solid color-mix(in srgb, var(--income-accent) 18%, transparent);
  border-radius: 999px;
  background: color-mix(in srgb, var(--income-accent) 9%, transparent);
  color: var(--income-accent);
  box-shadow: inset 0 0 0 1px rgb(255 255 255 / 0.34);
}

.web-preview__chip-icon svg {
  width: calc(24px * var(--web-chip-scale));
  height: calc(24px * var(--web-chip-scale));
}

:global(.theme-dark.web-preview .web-preview__chip-icon) {
  border-color: color-mix(in srgb, var(--income-accent) 22%, transparent);
  background: color-mix(in srgb, var(--income-accent) 12%, transparent);
  box-shadow:
    inset 0 0 0 1px rgb(255 255 255 / 0.035),
    0 0 32px rgb(245 158 11 / 0.1);
}

.web-preview__chips dt {
  color: var(--text);
  font-family: var(--web-font-action);
  font-size: calc(17px * var(--web-chip-scale));
  font-weight: 820;
  line-height: 1.1;
}

.web-preview__chip-copy {
  white-space: nowrap;
}

.web-preview__chips dd {
  margin: 0;
  margin-top: calc(7px * var(--web-chip-scale));
  color: var(--muted);
  font-size: calc(14px * var(--web-chip-scale));
  font-weight: 520;
  line-height: 1.36;
  max-width: none;
  white-space: nowrap;
}

@media (max-width: 1180px) {
  .web-preview__chips {
    max-width: 920px;
  }
}

@media (max-width: 820px) {
  .web-preview__feature-strip {
    width: min(100%, 560px);
  }

  .web-preview__chips {
    max-width: 100%;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    justify-content: center;
    justify-items: center;
    gap: 12px;
  }

  .web-preview__chip {
    width: 100%;
    grid-template-columns: 1fr;
    grid-template-rows: auto auto;
    justify-items: center;
    row-gap: 8px;
    text-align: center;
  }

  .web-preview__chip-icon {
    width: 40px;
    height: 40px;
    grid-row: auto;
  }

  .web-preview__chip-icon svg {
    width: 20px;
    height: 20px;
  }

  .web-preview__chips dd {
    display: none;
  }
}

@media (max-width: 560px) {
  .web-preview__feature-strip {
    width: min(100%, 358px);
    margin-top: 2px;
    margin-bottom: 24px;
    padding-bottom: 4px;
  }

  .web-preview__chips {
    --web-chip-scale: 1;
    gap: 8px;
  }

  .web-preview__chip {
    row-gap: 8px;
  }

  .web-preview__chip-icon {
    width: 36px;
    height: 36px;
    grid-row: auto;
  }

  .web-preview__chip-icon svg {
    width: 18px;
    height: 18px;
  }

  .web-preview__chips dt {
    font-size: 13px;
    line-height: 1.18;
    white-space: normal;
  }
}
</style>
