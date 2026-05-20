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
    <article class="stat-item">
      <span>已工作</span>
      <strong>{{ workedTime }}</strong>
    </article>
    <article class="stat-item">
      <span>{{ middleLabel }}</span>
      <strong>{{ middleValue }}</strong>
    </article>
    <article class="stat-item">
      <span>今日预计</span>
      <strong>¥{{ expectedEarn }}</strong>
    </article>
  </div>
</template>

<style scoped>
.stats-panel {
  display: grid;
  width: 100%;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--ui-gap-sm, 10px);
  margin-top: 0;
}

.stat-item {
  display: grid;
  min-width: 0;
  gap: var(--ui-gap-xs, 5px);
  place-items: center;
  border: 1px solid var(--line);
  border-radius: var(--ui-radius-sm, 10px);
  background: var(--panel-soft);
  padding: clamp(9px, 2.5cqh, 13px) var(--ui-pad-sm, 10px);
  text-align: center;
}

.stat-item span {
  overflow: hidden;
  color: var(--muted);
  font-size: var(--ui-font-xs, 13px);
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.stat-item strong {
  overflow: hidden;
  color: var(--text);
  font-family: var(--font-mono);
  font-size: var(--ui-font-sm, 14px);
  font-weight: 700;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}

</style>
