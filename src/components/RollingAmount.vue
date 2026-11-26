<script setup lang="ts">
// SPDX-FileCopyrightText: 2026 Mr.Baoboer
// SPDX-License-Identifier: AGPL-3.0-only
//
// Additional terms: see /legal/ADDITIONAL_TERMS.md
import { computed, onBeforeUnmount, ref, watch } from "vue";
import { useCurrency } from "../composables/useCurrency";
import { withCurrencySymbol } from "../lib/currency";

const { currencySymbol } = useCurrency();

const props = withDefaults(
  defineProps<{
    value: string;
    mode?: "rolling" | "plain";
    suspendPulse?: boolean;
    variant?: "hero" | "mini";
  }>(),
  {
    mode: "rolling",
    suspendPulse: false,
    variant: "hero",
  },
);

const digitRows = Array.from({ length: 10 }, (_, digit) => String(digit));
const rollDurationMs = 280;
const isTicking = ref(false);
const rollingIds = ref<ReadonlySet<string>>(new Set());
const rollingDeadlines = new Map<string, number>();
let pulseTimer = 0;
let pulseFrame = 0;
let rollingTimer = 0;

const scheduleRollingCleanup = () => {
  window.clearTimeout(rollingTimer);
  if (rollingDeadlines.size === 0) {
    rollingIds.value = new Set();
    return;
  }

  const now = Date.now();
  let earliestDeadline = Number.POSITIVE_INFINITY;
  for (const [id, deadline] of rollingDeadlines) {
    if (deadline <= now) {
      rollingDeadlines.delete(id);
    } else if (deadline < earliestDeadline) {
      earliestDeadline = deadline;
    }
  }

  rollingIds.value = new Set(rollingDeadlines.keys());
  if (rollingDeadlines.size > 0) {
    rollingTimer = window.setTimeout(
      scheduleRollingCleanup,
      Math.max(1, earliestDeadline - now),
    );
  }
};

const splitValueParts = (rawValue: string) => {
  const dotIndex = rawValue.indexOf(".");
  if (dotIndex === -1) {
    return {
      fraction: "",
      hasFraction: false,
      integer: rawValue || "0",
    };
  }

  return {
    fraction: rawValue.slice(dotIndex + 1),
    hasFraction: true,
    integer: rawValue.slice(0, dotIndex) || "0",
  };
};

const extractDigitMap = (rawValue: string, variant: "hero" | "mini") => {
  const map = new Map<string, number>();

  if (variant === "hero") {
    const parts = splitValueParts(rawValue);
    const intDigits = [...parts.integer];
    intDigits.forEach((char, index) => {
      if (/^\d$/.test(char)) {
        map.set(`place-${intDigits.length - 1 - index}`, Number(char));
      }
    });
    if (parts.hasFraction) {
      [...parts.fraction].forEach((char, index) => {
        if (/^\d$/.test(char)) {
          map.set(`frac-${index}`, Number(char));
        }
      });
    }
    return map;
  }

  const raw = [...rawValue];
  const dotIndex = raw.indexOf(".");
  raw.forEach((char, index) => {
    if (!/^\d$/.test(char)) return;
    const id =
      dotIndex === -1
        ? `int-${raw.length - 1 - index}`
        : index < dotIndex
          ? `int-${dotIndex - 1 - index}`
          : `frac-${index - dotIndex}`;
    map.set(id, Number(char));
  });
  return map;
};

const chars = computed(() => {
  if (props.variant === "hero") return [];

  const raw = [...props.value];
  const dotIndex = raw.indexOf(".");

  return raw.map((char, index) => {
    const id =
      dotIndex === -1
        ? `int-${raw.length - 1 - index}`
        : index < dotIndex
          ? `int-${dotIndex - 1 - index}`
          : index === dotIndex
            ? "dot"
            : `frac-${index - dotIndex}`;

    return {
      id,
      char,
      digit: /^\d$/.test(char) ? Number(char) : null,
    };
  });
});

const valueParts = computed(() => splitValueParts(props.value));

// Key integer digits by right-aligned place value (ones, tens, hundreds...) so rollovers
// such as 9.99 -> 10.00 keep existing columns anchored instead of scrambling left-to-right.
const integerChars = computed(() => {
  if (props.variant !== "hero") return [];

  const digits = [...valueParts.value.integer];
  return digits.map((char, index) => ({
    id: `place-${digits.length - 1 - index}`,
    char,
    digit: /^\d$/.test(char) ? Number(char) : null,
  }));
});

const fractionChars = computed(() => {
  if (props.variant !== "hero" || !valueParts.value.hasFraction) return [];

  return [...valueParts.value.fraction].map((char, index) => ({
    id: `frac-${index}`,
    char,
    digit: /^\d$/.test(char) ? Number(char) : null,
  }));
});

// Scale down gracefully when high-denomination amounts (e.g. JPY/KRW) or multi-char symbols
// (e.g. HK$, CHF) would otherwise clip against the minimum window width.
const amountScale = computed(() => {
  const symbolLength = [...currencySymbol.value].length;
  const intLength = [...valueParts.value.integer].length;
  const fracLength = valueParts.value.hasFraction
    ? [...valueParts.value.fraction].length
    : 0;

  if (props.variant === "mini") {
    const weightedLength =
      symbolLength * 1.05 + intLength + (fracLength > 0 ? 0.5 + fracLength : 0);
    return Math.max(0.54, Math.min(1, 7.2 / Math.max(7.2, weightedLength)));
  }

  const weightedLength =
    symbolLength * 0.95 + intLength + (fracLength > 0 ? 0.4 + fracLength * 0.72 : 0);
  return Math.max(0.46, Math.min(1, 7.6 / Math.max(7.6, weightedLength)));
});

const amountStyle = computed(() => ({
  "--amount-scale": amountScale.value.toFixed(4),
}));

watch(
  () => props.value,
  (value, previousValue) => {
    if (!previousValue || value === previousValue) return;
    if (props.suspendPulse) return;

    // Only enable the CSS transform transition on digit columns whose digit actually
    // changed. Initial mounts, mode switches (mini <-> full) and window resizes never
    // populate rollingIds, so font-size / em recalculations can never trigger phantom rolls.
    if (props.mode === "rolling") {
      const prevDigits = extractDigitMap(previousValue, props.variant);
      const nextDigits = extractDigitMap(value, props.variant);
      const changed = new Set<string>();
      for (const [id, digit] of nextDigits) {
        const previousDigit = prevDigits.get(id);
        if (previousDigit !== undefined && previousDigit !== digit) {
          changed.add(id);
        }
      }
      if (changed.size > 0) {
        const deadline = Date.now() + rollDurationMs;
        for (const id of changed) {
          rollingDeadlines.set(id, deadline);
        }
        scheduleRollingCleanup();
      }
    }

    window.clearTimeout(pulseTimer);
    window.cancelAnimationFrame(pulseFrame);
    isTicking.value = false;

    pulseFrame = window.requestAnimationFrame(() => {
      isTicking.value = true;
      pulseTimer = window.setTimeout(() => {
        isTicking.value = false;
      }, 220);
    });
  },
);

watch(
  () => props.suspendPulse,
  (suspendPulse) => {
    if (!suspendPulse) return;

    window.clearTimeout(pulseTimer);
    window.clearTimeout(rollingTimer);
    window.cancelAnimationFrame(pulseFrame);
    isTicking.value = false;
    rollingDeadlines.clear();
    rollingIds.value = new Set();
  },
);

onBeforeUnmount(() => {
  window.clearTimeout(pulseTimer);
  window.clearTimeout(rollingTimer);
  window.cancelAnimationFrame(pulseFrame);
  rollingDeadlines.clear();
});
</script>

<template>
  <span
    class="rolling-amount"
    :class="[`rolling-amount--${variant}`, { 'is-ticking': isTicking }]"
    :style="amountStyle"
    :aria-label="withCurrencySymbol(currencySymbol, value)"
  >
    <span
      v-if="currencySymbol"
      class="rolling-amount__currency"
      aria-hidden="true"
      v-text="currencySymbol"
    />
    <span v-if="variant === 'hero'" class="rolling-amount__value" aria-hidden="true">
      <span class="rolling-amount__integer">
        <span
          v-for="item in integerChars"
          :key="item.id"
          v-memo="[item.digit, item.char, mode, rollingIds.has(item.id)]"
          class="rolling-amount__char"
          :class="{ 'is-digit': item.digit !== null, 'is-plain': mode === 'plain' }"
        >
          <span
            v-if="item.digit !== null && mode === 'rolling'"
            class="rolling-amount__digit-strip"
            :class="{ 'is-digit-rolling': rollingIds.has(item.id) }"
            :style="{ transform: `translate3d(0, -${item.digit}em, 0)` }"
          >
            <span v-for="digit in digitRows" :key="digit">{{ digit }}</span>
          </span>
          <span v-else>{{ item.char }}</span>
        </span>
      </span>
      <span v-if="valueParts.hasFraction" class="rolling-amount__fraction">
        <span class="rolling-amount__separator">.</span>
        <span
          v-for="item in fractionChars"
          :key="item.id"
          v-memo="[item.digit, item.char, mode, rollingIds.has(item.id)]"
          class="rolling-amount__char"
          :class="{ 'is-digit': item.digit !== null, 'is-plain': mode === 'plain' }"
        >
          <span
            v-if="item.digit !== null && mode === 'rolling'"
            class="rolling-amount__digit-strip"
            :class="{ 'is-digit-rolling': rollingIds.has(item.id) }"
            :style="{ transform: `translate3d(0, -${item.digit}em, 0)` }"
          >
            <span v-for="digit in digitRows" :key="digit">{{ digit }}</span>
          </span>
          <span v-else>{{ item.char }}</span>
        </span>
      </span>
    </span>
    <span v-else class="rolling-amount__value" aria-hidden="true">
      <span
        v-for="item in chars"
        :key="item.id"
        v-memo="[item.digit, item.char, mode, rollingIds.has(item.id)]"
        class="rolling-amount__char"
        :class="{ 'is-digit': item.digit !== null, 'is-plain': mode === 'plain' }"
      >
        <span
          v-if="item.digit !== null && mode === 'rolling'"
          class="rolling-amount__digit-strip"
          :class="{ 'is-digit-rolling': rollingIds.has(item.id) }"
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
  align-items: baseline;
  line-height: 1;
  white-space: nowrap;
}

.rolling-amount__integer,
.rolling-amount__fraction {
  display: inline-flex;
  align-items: baseline;
}

.rolling-amount__char {
  display: inline-grid;
  height: 1em;
  min-width: 0.48em;
  place-items: center;
  overflow: hidden;
  contain: style;
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
}

.rolling-amount__digit-strip.is-digit-rolling {
  transition: transform 260ms cubic-bezier(0.16, 0.84, 0.28, 1);
}

.rolling-amount__digit-strip span {
  height: 1em;
  line-height: 1;
}

.rolling-amount--hero {
  font-size: calc(clamp(52px, min(15.4cqw, 18.8cqh), 84px) * var(--amount-scale, 1));
  font-weight: 760;
}

.rolling-amount--hero .rolling-amount__currency {
  color: var(--muted);
  font-size: 0.74em;
  transform: translateY(-0.08em);
}

.rolling-amount--hero .rolling-amount__fraction {
  color: var(--text);
  font-size: 0.72em;
  font-weight: 720;
  opacity: 0.88;
}

.rolling-amount--hero .rolling-amount__separator {
  display: inline-grid;
  height: 1em;
  place-items: center;
  color: var(--text);
  opacity: 0.78;
}

.rolling-amount--mini {
  font-size: calc(clamp(19px, min(15vw, 60vh), 30px) * var(--amount-scale, 1));
  font-weight: 750;
}

.rolling-amount--mini .rolling-amount__currency {
  color: var(--text);
}

.rolling-amount--hero.is-ticking {
  filter: drop-shadow(0 14px 30px var(--income-accent-glow));
}

.rolling-amount--hero.is-ticking .rolling-amount__currency {
  color: var(--income-accent);
}

@media (prefers-reduced-motion: reduce) {
  .rolling-amount,
  .rolling-amount__currency,
  .rolling-amount__digit-strip {
    transition: none;
  }

  .rolling-amount--hero.is-ticking {
    filter: none;
  }
}
</style>
