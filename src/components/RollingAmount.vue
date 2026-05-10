<script setup lang="ts">
import { computed } from "vue";

const props = withDefaults(
  defineProps<{
    value: string;
    variant?: "hero" | "mini";
  }>(),
  {
    variant: "hero",
  },
);

const digitRows = Array.from({ length: 10 }, (_, digit) => String(digit));

const chars = computed(() =>
  [...props.value].map((char, index) => ({
    id: index,
    char,
    digit: /^\d$/.test(char) ? Number(char) : null,
  })),
);
</script>

<template>
  <span class="rolling-amount" :class="`rolling-amount--${variant}`">
    <span class="rolling-amount__currency">¥</span>
    <span class="rolling-amount__value" aria-live="off">
      <span
        v-for="item in chars"
        :key="item.id"
        class="rolling-amount__char"
        :class="{ 'is-digit': item.digit !== null }"
      >
        <span
          v-if="item.digit !== null"
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
  align-items: flex-end;
  justify-content: center;
  gap: 10px;
  color: var(--text);
  font-family: "JetBrains Mono", "Cascadia Mono", Consolas, monospace;
  font-variant-numeric: tabular-nums;
  letter-spacing: 0;
}

.rolling-amount__currency {
  flex: 0 0 auto;
  color: var(--muted);
  font-weight: 650;
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

.rolling-amount__digit-strip {
  display: grid;
  will-change: transform;
  transition: transform 180ms cubic-bezier(0.2, 0.72, 0.28, 1);
}

.rolling-amount__digit-strip span {
  height: 1em;
  line-height: 1;
}

.rolling-amount--hero {
  font-size: 58px;
  font-weight: 700;
}

.rolling-amount--hero .rolling-amount__currency {
  padding-bottom: 8px;
  font-size: 34px;
}

.rolling-amount--mini {
  font-size: clamp(24px, min(13vw, 46vh), 46px);
  font-weight: 750;
}

.rolling-amount--mini .rolling-amount__currency {
  font-size: 0.78em;
}
</style>
