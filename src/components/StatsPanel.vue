<script setup lang="ts">
const props = defineProps<{
  dailyTotal: string;
  remainingEarn: string;
  workedTime: string;
  remainingTime: string;
}>();

const amountWidthStyle = (value: string) => ({
  "--amount-ch": String(value.length),
});
</script>

<template>
  <div class="stats-panel" aria-label="今日工资统计">
    <article class="stat-item">
      <span>今日预计入账</span>
      <strong class="stat-money" :style="amountWidthStyle(props.dailyTotal)">
        <i>¥</i>
        <b>{{ dailyTotal }}</b>
      </strong>
    </article>
    <article class="stat-item">
      <span>还可入账</span>
      <strong class="stat-money" :style="amountWidthStyle(props.remainingEarn)">
        <i>¥</i>
        <b>{{ remainingEarn }}</b>
      </strong>
    </article>
    <article class="stat-item">
      <span>已工作</span>
      <strong>{{ workedTime }}</strong>
    </article>
    <article class="stat-item">
      <span>剩余时间</span>
      <strong>{{ remainingTime }}</strong>
    </article>
  </div>
</template>

<style scoped>
.stats-panel {
  display: grid;
  width: 100%;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;
  margin-top: 24px;
}

.stat-item {
  display: grid;
  min-width: 0;
  gap: 5px;
  place-items: center;
  border: 1px solid var(--line);
  border-radius: 10px;
  background: var(--panel-soft);
  padding: 10px 9px;
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

.stat-money {
  position: relative;
  display: block;
  width: 100%;
  text-align: center;
}

.stat-money i {
  position: absolute;
  right: calc(50% + var(--amount-ch) * 0.31em + 0.38em);
  color: var(--muted);
  font-style: normal;
}

.stat-money b {
  font-weight: inherit;
}
</style>
