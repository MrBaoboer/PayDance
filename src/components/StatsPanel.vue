<script setup lang="ts">
defineProps<{
  remainingEarn: string;
  workedTime: string;
  remainingTime: string;
}>();
</script>

<template>
  <div class="stats-panel" aria-label="今日工资统计">
    <article class="stat-item">
      <span>已工作</span>
      <strong>{{ workedTime }}</strong>
    </article>
    <article class="stat-item">
      <span>距离下班</span>
      <strong>{{ remainingTime }}</strong>
    </article>
    <article class="stat-item">
      <span>还可入账</span>
      <strong>¥{{ remainingEarn }}</strong>
    </article>
  </div>
</template>

<style scoped>
.stats-panel {
  display: grid;
  width: 100%;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
  margin-top: 0;
}

.stat-item {
  display: grid;
  min-width: 0;
  gap: 5px;
  place-items: center;
  border: 1px solid var(--line);
  border-radius: 10px;
  background: var(--panel-soft);
  padding: 11px 10px;
  text-align: center;
}

.stat-item span {
  overflow: hidden;
  color: var(--muted);
  font-size: 13px;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.stat-item strong {
  overflow: hidden;
  color: var(--text);
  font-family: var(--font-mono);
  font-size: 14px;
  font-weight: 700;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}

</style>
