<script setup lang="ts">
import { computed } from "vue";
import RollingAmount from "./RollingAmount.vue";
import {
  maxMiniOpacityPercent,
  normalizeMiniOpacityPercent,
} from "../lib/window-mode";
import type { MiniOpacityPanelAnchor } from "../lib/mini-opacity-position";

const props = defineProps<{
  amount: string;
  amountMode: "rolling" | "plain";
  opacityPercent: number;
}>();

const emit = defineEmits<{
  restore: [];
  dragStart: [event: PointerEvent];
  opacityMenu: [anchor: MiniOpacityPanelAnchor];
}>();

const normalizedOpacity = computed(() =>
  normalizeMiniOpacityPercent(props.opacityPercent),
);
const panelStyle = computed(() => ({
  "--mini-panel-opacity": String(normalizedOpacity.value / 100),
}));
const isOpaque = computed(() => normalizedOpacity.value >= maxMiniOpacityPercent);

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
    :class="{ 'is-opaque': isOpaque }"
    :style="panelStyle"
    title="双击恢复完整窗口"
    @contextmenu.prevent.stop="handleOpacityMenu"
    @pointerdown="$emit('dragStart', $event)"
    @dblclick="$emit('restore')"
  >
    <RollingAmount :mode="amountMode" :value="amount" variant="mini" />
  </div>
</template>

<style scoped>
.mini-window {
  display: grid;
  width: 100%;
  height: 100%;
  place-items: center;
  border: 1px solid var(--border);
  border-radius: 14px;
  background: rgb(var(--mini-panel-rgb, 255 255 255) / var(--mini-panel-opacity, 0.85));
  box-shadow: none;
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
</style>
