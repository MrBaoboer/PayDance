<script setup lang="ts">
// SPDX-FileCopyrightText: 2026 Mr.Baoboer
// SPDX-License-Identifier: AGPL-3.0-only
//
// Additional terms: see /legal/ADDITIONAL_TERMS.md
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { useI18n } from "../composables/useI18n";

const { t } = useI18n();

const props = defineProps<{
  progress: number;
  isWorking: boolean;
}>();

const clampedProgress = computed(() => Math.min(Math.max(props.progress, 0), 1));
const progressNumber = computed(() => Math.round(clampedProgress.value * 100));
const progressPercent = computed(() => `${(clampedProgress.value * 100).toFixed(4)}%`);
const progressTooltip = computed(
  () => `${t.value("stats.progress")} ${progressNumber.value}%`,
);
const trackRef = ref<HTMLElement | null>(null);
const trackWidth = ref(0);
const isDotReady = ref(false);
let resizeObserver: ResizeObserver | undefined;
let readyFrame = 0;

const updateTrackWidth = () => {
  trackWidth.value = trackRef.value?.clientWidth ?? 0;
};

const progressStyle = computed(() => ({
  "--progress-percent": progressPercent.value,
  "--progress-x": `${trackWidth.value * clampedProgress.value}px`,
}));

onMounted(() => {
  updateTrackWidth();
  readyFrame = window.requestAnimationFrame(() => {
    updateTrackWidth();
    isDotReady.value = true;
  });

  if ("ResizeObserver" in window) {
    resizeObserver = new ResizeObserver(updateTrackWidth);
    if (trackRef.value) {
      resizeObserver.observe(trackRef.value);
    }
  }
});

onBeforeUnmount(() => {
  window.cancelAnimationFrame(readyFrame);
  resizeObserver?.disconnect();
});
</script>

<template>
  <div class="income-progress" :class="{ 'is-working': isWorking }">
    <div
      ref="trackRef"
      class="progress-track"
      role="progressbar"
      aria-valuemin="0"
      aria-valuemax="100"
      :aria-label="progressTooltip"
      :aria-valuenow="progressNumber"
      :style="progressStyle"
      :title="progressTooltip"
    >
      <div class="progress-fill-mask">
        <div class="progress-fill" :class="{ 'is-ready': isDotReady }">
          <span class="progress-glow" />
        </div>
      </div>
      <span class="progress-dot" :class="{ 'is-ready': isDotReady }" />
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

.progress-fill-mask {
  position: absolute;
  inset: 0;
  overflow: hidden;
  border-radius: inherit;
}

/* Translate a full-width rounded pill inside the track mask so the leading cap stays
   perfectly circular without scaleX distortion AND updates run 100% on the GPU compositor. */
.progress-fill {
  position: absolute;
  inset: 0;
  overflow: hidden;
  border-radius: inherit;
  background: var(
    --progress-fill-bg,
    linear-gradient(90deg, var(--income-accent), var(--income-accent-bright))
  );
  transform: translate3d(calc(var(--progress-percent) - 100%), 0, 0);
  will-change: transform;
}

.progress-fill.is-ready {
  transition: transform 260ms ease-out;
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
  transform: translate3d(-100%, 0, 0);
}

.income-progress.is-working .progress-glow {
  animation: progress-shine 2.4s ease-in-out infinite;
}

.progress-dot {
  position: absolute;
  top: 50%;
  left: 0;
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
  transform: translate3d(var(--progress-x), -50%, 0) translateX(-50%);
  transition: opacity 160ms ease;
  will-change: transform;
}

.progress-dot.is-ready {
  transition:
    transform 260ms ease-out,
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
    transform: translate3d(-100%, 0, 0);
  }

  58%,
  100% {
    transform: translate3d(120%, 0, 0);
  }
}
</style>
