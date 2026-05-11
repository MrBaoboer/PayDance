<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from "vue";

const props = withDefaults(
  defineProps<{
    value: string;
    mode?: "rolling" | "plain";
    variant?: "hero" | "mini";
  }>(),
  {
    mode: "rolling",
    variant: "hero",
  },
);

const digitRows = Array.from({ length: 10 }, (_, digit) => String(digit));
const isTicking = ref(false);
let pulseTimer = 0;

const chars = computed(() =>
  [...props.value].map((char, index) => ({
    id: index,
    char,
    digit: /^\d$/.test(char) ? Number(char) : null,
  })),
);

watch(
  () => props.value,
  (value, previousValue) => {
    if (!previousValue || value === previousValue) return;

    window.clearTimeout(pulseTimer);
    isTicking.value = false;

    requestAnimationFrame(() => {
      isTicking.value = true;
      pulseTimer = window.setTimeout(() => {
        isTicking.value = false;
      }, 220);
    });
  },
);

onBeforeUnmount(() => {
  window.clearTimeout(pulseTimer);
});
</script>

<template>
  <span
    class="rolling-amount"
    :class="[`rolling-amount--${variant}`, { 'is-ticking': isTicking }]"
  >
    <span class="rolling-amount__currency">¥</span>
    <span class="rolling-amount__value" aria-live="off">
      <span
        v-for="item in chars"
        :key="item.id"
        class="rolling-amount__char"
        :class="{ 'is-digit': item.digit !== null, 'is-plain': mode === 'plain' }"
      >
        <span
          v-if="item.digit !== null && mode === 'rolling'"
          class="rolling-amount__digit-strip"
          :style="{ transform: `translate3d(0, -${item.digit}em, 0)` }"
        >
          <span v-for="digit in digitRows" :key="digit">{{ digit }}</span>
        </span>
        <span v-else>{{ item.char }}</span>
      </span>
    </span>
  </span>
</template>

<style scoped>
.rolling-amount {
  display: inline-flex;
  max-width: 100%;
  align-items: baseline;
  justify-content: center;
  gap: 0.18em;
  color: var(--text);
  font-family: var(--font-mono);
  font-variant-numeric: tabular-nums;
  letter-spacing: 0;
  transform-origin: center bottom;
  transition:
    filter 220ms ease,
    transform 220ms ease;
}

.rolling-amount__currency {
  flex: 0 0 auto;
  color: var(--text);
  font-size: 1em;
  font-weight: inherit;
  line-height: 1;
  transition: color 220ms ease;
}

.rolling-amount__value {
  display: inline-flex;
  max-width: 100%;
  overflow: hidden;
  align-items: center;
  line-height: 1;
  white-space: nowrap;
}

.rolling-amount__char {
  display: inline-grid;
  height: 1em;
  min-width: 0.48em;
  place-items: center;
  overflow: hidden;
  line-height: 1;
}

.rolling-amount__char.is-digit {
  width: 0.62em;
}

.rolling-amount__char.is-plain {
  width: auto;
}

.rolling-amount__digit-strip {
  display: grid;
  will-change: transform;
  transition: transform 260ms cubic-bezier(0.16, 0.84, 0.28, 1);
}

.rolling-amount__digit-strip span {
  height: 1em;
  line-height: 1;
}

.rolling-amount--hero {
  font-size: clamp(46px, min(13.8cqw, 17cqh), 72px);
  font-weight: 700;
}

.rolling-amount--hero .rolling-amount__currency {
  color: var(--muted);
}

.rolling-amount--mini {
  font-size: clamp(19px, min(15vw, 60vh), 30px);
  font-weight: 750;
}

.rolling-amount--mini .rolling-amount__currency {
  color: var(--text);
}

.rolling-amount--hero.is-ticking {
  filter: drop-shadow(0 12px 24px var(--income-accent-glow));
}

.rolling-amount--hero.is-ticking .rolling-amount__currency {
  color: var(--income-accent);
}
</style>
