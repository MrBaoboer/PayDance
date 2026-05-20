<script setup lang="ts">
defineProps<{
  expectedEarn: string;
  middleLabel: string;
  middleValue: string;
  workedTime: string;
}>();
</script>

<template>
  <div class="stats-panel" aria-label="今日工资统计">
    <div class="stats-panel__frame">
      <article class="stat-item">
        <span class="stat-item__label">已工作</span>
        <strong class="stat-item__value">{{ workedTime }}</strong>
      </article>
      <article class="stat-item">
        <span class="stat-item__label">{{ middleLabel }}</span>
        <strong class="stat-item__value">{{ middleValue }}</strong>
      </article>
      <article class="stat-item">
        <span class="stat-item__label">今日预计</span>
        <strong class="stat-item__value">¥{{ expectedEarn }}</strong>
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
  border: 1px solid var(--line);
  border-radius: var(--ui-radius-lg, 16px);
  background:
    linear-gradient(180deg, rgb(255 255 255 / 0.24), transparent),
    var(--panel-soft);
  box-shadow: 0 14px 36px rgb(15 23 42 / 0.06);
}

.stat-item {
  position: relative;
  display: grid;
  min-width: 0;
  gap: var(--ui-gap-xs, 5px);
  place-items: center;
  padding: clamp(11px, 2.9cqh, 15px) var(--ui-pad-sm, 10px);
  text-align: center;
}

.stat-item + .stat-item::before {
  position: absolute;
  top: 22%;
  bottom: 22%;
  left: 0;
  width: 1px;
  background: var(--line);
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
  overflow: hidden;
  color: var(--text);
  font-family: var(--font-mono);
  font-size: clamp(14px, calc(11px + 0.82cqw), 18px);
  font-weight: 760;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}

</style>
