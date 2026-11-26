<script setup lang="ts">
// SPDX-FileCopyrightText: 2026 Mr.Baoboer
// SPDX-License-Identifier: AGPL-3.0-only
//
// Additional terms: see /legal/ADDITIONAL_TERMS.md
import { computed } from "vue";
import RollingAmount from "./RollingAmount.vue";
import ResizeHandles from "./onboarding/ResizeHandles.vue";
import {
  maxMiniOpacityPercent,
  minMiniOpacityPercent,
  normalizeMiniOpacityPercent,
} from "../lib/window-mode";
import type { MiniOpacityPanelAnchor } from "../lib/mini-opacity-position";
import type { ResizeDirection } from "../lib/resize-handles";
import { useI18n } from "../composables/useI18n";
import { useCurrency } from "../composables/useCurrency";
import { withCurrencySymbol } from "../lib/currency";

const props = withDefaults(
  defineProps<{
    amount: string;
    amountMode: "rolling" | "plain";
    opacityPercent: number;
    resizable?: boolean;
  }>(),
  {
    resizable: false,
  },
);

const { t } = useI18n();
const { currencySymbol } = useCurrency();

// The mini window is a single control whose only visible content is aria-hidden digits, so the
// amount has to live in this visually hidden name or it is invisible to a screen reader.
const miniAccessibleName = computed(() =>
  t.value("mini.ariaLabel", {
    amount: withCurrencySymbol(currencySymbol.value, props.amount),
  }),
);

const emit = defineEmits<{
  restore: [];
  dragStart: [event: PointerEvent];
  opacityMenu: [anchor: MiniOpacityPanelAnchor];
  resizeStart: [direction: ResizeDirection];
}>();

const normalizedOpacity = computed(() =>
  normalizeMiniOpacityPercent(props.opacityPercent),
);
const panelStyle = computed(() => ({
  "--mini-panel-opacity": String(normalizedOpacity.value / 100),
}));
const isOpaque = computed(() => normalizedOpacity.value >= maxMiniOpacityPercent);
const isTransparent = computed(() => normalizedOpacity.value <= minMiniOpacityPercent);

const resolveOpacityPanelAnchor = (
  event: MouseEvent,
): MiniOpacityPanelAnchor | undefined => {
  const target = event.currentTarget as HTMLElement | null;
  const rect = target?.getBoundingClientRect();
  if (!rect) return undefined;

  return {
    clientPoint: { x: event.clientX, y: event.clientY },
    screenPoint: { x: event.screenX, y: event.screenY },
    targetRect: {
      height: rect.height,
      width: rect.width,
      x: rect.x,
      y: rect.y,
    },
  };
};

const handleOpacityMenu = (event: MouseEvent) => {
  const anchor = resolveOpacityPanelAnchor(event);
  if (!anchor) return;

  emit("opacityMenu", anchor);
};
</script>

<template>
  <div
    class="mini-window"
    :class="{ 'is-opaque': isOpaque, 'is-transparent': isTransparent }"
    :style="panelStyle"
    role="button"
    tabindex="0"
    :title="t('mini.restoreTitle')"
    @contextmenu.prevent.stop="handleOpacityMenu"
    @pointerdown="$emit('dragStart', $event)"
    @dblclick="$emit('restore')"
    @keydown.enter.prevent="$emit('restore')"
    @keydown.space.prevent="$emit('restore')"
  >
    <ResizeHandles
      v-if="resizable"
      size="compact"
      @resize-start="emit('resizeStart', $event)"
    />
    <span class="sr-only">{{ miniAccessibleName }}</span>
    <RollingAmount aria-hidden="true" :mode="amountMode" :value="amount" variant="mini" />
  </div>
</template>

<style scoped>
.mini-window {
  position: relative;
  display: grid;
  width: 100%;
  height: 100%;
  place-items: center;
  border: 1px solid var(--border);
  border-radius: 14px;
  background: rgb(var(--mini-panel-rgb, 255 255 255) / var(--mini-panel-opacity, 0.85));
  box-shadow: var(--mini-window-shadow, none);
  color: var(--text);
  backdrop-filter: blur(30px);
  padding: 0 12px;
}

.mini-window :deep(.rolling-amount) {
  max-width: 100%;
}

.mini-window.is-opaque {
  backdrop-filter: none;
}

.mini-window.is-transparent {
  border-color: transparent;
  background: transparent;
  box-shadow: none;
  backdrop-filter: none;
  transition:
    background-color 140ms ease,
    border-color 140ms ease;
}

.mini-window.is-transparent :deep(.rolling-amount) {
  filter: var(--mini-transparent-text-shadow);
}

.mini-window.is-transparent:hover,
.mini-window.is-transparent:focus-visible {
  border-color: var(--mini-transparent-hover-border);
  background: var(--mini-transparent-hover-bg);
}
</style>
