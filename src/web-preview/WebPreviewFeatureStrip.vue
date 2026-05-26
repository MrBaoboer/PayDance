<script setup lang="ts">
import { Focus, ShieldCheck, Zap } from "@lucide/vue";
</script>

<template>
  <div class="web-preview__feature-strip">
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
</template>

<style scoped>
.web-preview__feature-strip {
  display: flex;
  width: 100%;
  grid-column: 1 / -1;
  justify-content: center;
  margin-top: clamp(6px, 1.6vh, 18px);
  margin-bottom: clamp(4px, 1.2vh, 14px);
}

.web-preview__chips {
  --web-chip-base-width: 188px;
  --web-chip-gap: 0px;
  --web-chip-scale: 1;
  display: grid;
  width: 100%;
  max-width: min(100%, 860px);
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

:global(.theme-dark.web-preview) .web-preview__chip-icon {
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

.web-preview__chips dd {
  margin: 0;
  margin-top: calc(7px * var(--web-chip-scale));
  color: var(--muted);
  font-size: calc(14px * var(--web-chip-scale));
  font-weight: 520;
  line-height: 1.36;
  white-space: nowrap;
}

@media (max-width: 820px) {
  .web-preview__feature-strip {
    width: min(100%, 560px);
  }
}

@media (max-width: 560px) {
  .web-preview__feature-strip {
    width: min(100%, 360px);
    margin-top: 2px;
    margin-bottom: 24px;
    padding-bottom: 4px;
  }

  .web-preview__chips {
    --web-chip-scale: min(0.74, calc((100vw - 40px) / 564px));
    max-width: 100%;
  }
}
</style>
