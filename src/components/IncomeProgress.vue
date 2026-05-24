<script setup lang="ts">
import { computed } from "vue";

const props = defineProps<{
  progress: number;
  isWorking: boolean;
}>();

const clampedProgress = computed(() => Math.min(Math.max(props.progress, 0), 1));
const progressPercent = computed(() => `${clampedProgress.value * 100}%`);
const progressNumber = computed(() => Math.round(clampedProgress.value * 100));
const progressTooltip = computed(() => `今日进度 ${progressNumber.value}%`);
</script>

<template>
  <div class="income-progress" :class="{ 'is-working': isWorking }">
    <div
      class="progress-track"
      role="progressbar"
      aria-valuemin="0"
      aria-valuemax="100"
      :aria-label="progressTooltip"
      :aria-valuenow="progressNumber"
      :title="progressTooltip"
    >
      <div class="progress-fill" :style="{ width: progressPercent }">
        <span class="progress-glow" />
      </div>
      <span class="progress-dot" :style="{ left: progressPercent }" />
    </div>
  </div>
</template>

<style scoped>
.income-progress {
  display: grid;
  width: 100%;
  margin-top: 0;
}

.progress-track {
  position: relative;
  height: clamp(9px, 2.3cqh, 12px);
  overflow: visible;
  border-radius: 999px;
  background: var(--progress-track-bg, var(--subtle));
  box-shadow: var(--progress-track-shadow, none);
}

.progress-fill {
  position: relative;
  height: 100%;
  min-width: clamp(7px, 1.7cqw, 10px);
  overflow: hidden;
  border-radius: inherit;
  background: var(
    --progress-fill-bg,
    linear-gradient(90deg, var(--income-accent), var(--income-accent-bright))
  );
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
  width: clamp(13px, 3.2cqw, 17px);
  height: clamp(13px, 3.2cqw, 17px);
  border: 2px solid var(--progress-dot-border, var(--panel));
  border-radius: 999px;
  background: var(--income-accent);
  box-shadow: var(
    --progress-dot-shadow,
    0 0 0 1px var(--income-accent-ring),
    0 6px 16px var(--income-accent-shadow)
  );
  transform: translate(-50%, -50%);
  transition:
    left 260ms ease-out,
    opacity 160ms ease;
}

.income-progress:not(.is-working) .progress-fill {
  background: var(
    --progress-rest-fill-bg,
    linear-gradient(
      90deg,
      var(--muted),
      color-mix(in srgb, var(--muted) 54%, transparent)
    )
  );
}

.income-progress:not(.is-working) .progress-dot {
  background: var(--muted);
  box-shadow: var(--progress-rest-dot-shadow, 0 0 0 1px rgb(127 127 127 / 0.16));
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
