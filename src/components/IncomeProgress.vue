<script setup lang="ts">
import { computed } from "vue";

const props = defineProps<{
  progress: number;
  isWorking: boolean;
}>();

const clampedProgress = computed(() => Math.min(Math.max(props.progress, 0), 1));
const progressPercent = computed(() => `${clampedProgress.value * 100}%`);
const progressText = computed(() => `${Math.round(clampedProgress.value * 100)}%`);
</script>

<template>
  <div class="income-progress" :class="{ 'is-working': isWorking }">
    <div class="progress-track">
      <div class="progress-fill" :style="{ width: progressPercent }">
        <span class="progress-glow" />
      </div>
      <span class="progress-dot" :style="{ left: progressPercent }" />
    </div>
    <span class="progress-label">
      <span>今日进度</span>
      <strong>{{ progressText }}</strong>
    </span>
  </div>
</template>

<style scoped>
.income-progress {
  display: grid;
  width: 100%;
  gap: 6px;
  margin-top: 20px;
}

.progress-track {
  position: relative;
  height: 9px;
  overflow: hidden;
  border: 1px solid var(--line);
  border-radius: 999px;
  background:
    linear-gradient(180deg, rgb(255 255 255 / 0.22), transparent),
    var(--subtle);
}

.progress-fill {
  position: relative;
  height: 100%;
  min-width: 8px;
  overflow: hidden;
  border-radius: inherit;
  background: linear-gradient(90deg, rgb(16 185 129), rgb(45 212 191));
  transition: width 260ms ease-out;
}

.progress-glow {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    110deg,
    transparent 0%,
    rgb(255 255 255 / 0.34) 45%,
    transparent 72%
  );
  transform: translateX(-100%);
}

.income-progress.is-working .progress-glow {
  animation: progress-shine 2.4s ease-in-out infinite;
}

.progress-dot {
  position: absolute;
  top: 50%;
  width: 13px;
  height: 13px;
  border: 2px solid var(--panel);
  border-radius: 999px;
  background: rgb(16 185 129);
  box-shadow: 0 0 0 1px rgb(16 185 129 / 0.22), 0 6px 16px rgb(16 185 129 / 0.28);
  transform: translate(-50%, -50%);
  transition: left 260ms ease-out, opacity 160ms ease;
}

.progress-label {
  display: inline-flex;
  justify-content: center;
  gap: 6px;
  color: var(--muted);
  font-size: 13px;
  font-weight: 650;
  line-height: 1;
  text-align: center;
}

.progress-label strong {
  font-family: var(--font-mono);
  font-size: 13px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.income-progress:not(.is-working) .progress-fill {
  background: linear-gradient(90deg, var(--muted), color-mix(in srgb, var(--muted) 54%, transparent));
}

.income-progress:not(.is-working) .progress-dot {
  background: var(--muted);
  box-shadow: 0 0 0 1px rgb(127 127 127 / 0.16);
  opacity: 0.72;
}

@keyframes progress-shine {
  0% {
    transform: translateX(-100%);
  }

  58%,
  100% {
    transform: translateX(120%);
  }
}
</style>
