<script setup lang="ts">
defineProps<{
  expectedEarn: string;
  middleLabel: string;
  middleValue: string;
  workedTime: string;
}>();

type MetricSegment = {
  kind: "number" | "plain" | "separator" | "symbol" | "unit";
  text: string;
};

const formatMetricSegments = (value: string): MetricSegment[] => {
  const matches = value.match(/¥|:|\d+(?:\.\d+)?|[a-zA-Z%]+|\s+|./g) ?? [value];

  return matches.map((text) => {
    if (text === "¥") return { kind: "symbol", text };
    if (text === ":") return { kind: "separator", text };
    if (/^\d/.test(text)) return { kind: "number", text };
    if (/^[a-zA-Z%]+$/.test(text)) return { kind: "unit", text };
    return { kind: "plain", text };
  });
};
</script>

<template>
  <div class="stats-panel" aria-label="今日工资统计">
    <div class="stats-panel__frame">
      <article class="stat-item">
        <span class="stat-item__label">已工作</span>
        <strong class="stat-item__value">
          <span
            v-for="(segment, index) in formatMetricSegments(workedTime)"
            :key="`worked-${index}`"
            :class="`stat-value__${segment.kind}`"
            v-text="segment.text"
          />
        </strong>
      </article>
      <article class="stat-item">
        <span class="stat-item__label">{{ middleLabel }}</span>
        <strong class="stat-item__value">
          <span
            v-for="(segment, index) in formatMetricSegments(middleValue)"
            :key="`middle-${index}`"
            :class="`stat-value__${segment.kind}`"
            v-text="segment.text"
          />
        </strong>
      </article>
      <article class="stat-item">
        <span class="stat-item__label">今日预计</span>
        <strong class="stat-item__value stat-item__value--money">
          <span
            v-for="(segment, index) in formatMetricSegments(`¥${expectedEarn}`)"
            :key="`expected-${index}`"
            :class="`stat-value__${segment.kind}`"
            v-text="segment.text"
          />
        </strong>
      </article>
    </div>
  </div>
</template>

<style scoped>
.stats-panel {
  width: 100%;
  margin-top: 0;
}

.stats-panel__frame {
  display: grid;
  width: 100%;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  overflow: hidden;
  border: 1px solid var(--dashboard-border, var(--line));
  border-radius: var(--ui-radius-md, 13px);
  background: var(--dashboard-metric-bg, var(--panel-soft));
}

.stat-item {
  position: relative;
  display: grid;
  min-width: 0;
  gap: var(--ui-gap-xs, 5px);
  place-items: center;
  padding: clamp(10px, 2.7cqh, 14px) var(--ui-pad-sm, 10px);
  text-align: center;
}

.stat-item + .stat-item::before {
  position: absolute;
  top: 24%;
  bottom: 24%;
  left: 0;
  width: 1px;
  background: var(--dashboard-divider, var(--line));
  content: "";
}

.stat-item__label {
  overflow: hidden;
  color: var(--muted);
  font-size: var(--ui-font-xs, 13px);
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.stat-item__value {
  display: inline-flex;
  min-height: 1.15em;
  overflow: hidden;
  align-items: baseline;
  justify-content: center;
  gap: 0;
  color: var(--text);
  font-family: var(--font-numeric);
  font-size: clamp(14px, calc(11px + 0.72cqw), 17px);
  font-weight: 700;
  line-height: 1;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}

.stat-value__number {
  font-size: 1.1em;
  font-weight: 760;
  line-height: 1;
}

.stat-value__symbol,
.stat-value__unit {
  color: var(--muted);
  font-size: 0.88em;
  font-weight: 650;
  line-height: 1;
}

.stat-value__unit {
  margin-left: 0.12em;
}

.stat-value__symbol {
  margin-right: 0.14em;
}

.stat-value__separator {
  margin: 0 0.16em;
  color: var(--text);
  font-size: 1.1em;
  font-weight: 760;
  line-height: 1;
}

.stat-item__value--money .stat-value__symbol {
  color: var(--text);
  font-size: 1.1em;
  font-weight: 760;
}

.stat-value__plain {
  width: 0.22em;
  overflow: hidden;
}

</style>
