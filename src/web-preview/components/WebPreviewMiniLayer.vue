<script setup lang="ts">
// SPDX-FileCopyrightText: 2026 Mr.Baoboer
// SPDX-License-Identifier: AGPL-3.0-only
//
// Additional terms: see /legal/ADDITIONAL_TERMS.md
import { computed } from "vue";
import type { AmountMode } from "../../composables/useSalarySettings";
import { useI18n } from "../../composables/useI18n";
import type { WindowSize } from "../../lib/window-mode";
import MiniWindow from "../../components/MiniWindow.vue";
import WebMiniOpacityPanel from "./WebMiniOpacityPanel.vue";

const { t } = useI18n();

const props = defineProps<{
  amountMode: AmountMode;
  earnedText: string;
  miniLayerStyle: Record<string, string>;
  miniOpacityPercent: number;
  miniPosition: { x: number; y: number };
  miniSize: WindowSize;
  miniStyle: Record<string, string>;
  shellClass: string;
  showWebMiniOpacityPanel: boolean;
}>();

const emit = defineEmits<{
  dragStart: [event: PointerEvent];
  opacityMenu: [];
  restore: [];
  toggleOpacityPanel: [];
  updateOpacity: [value: number, options?: { commit?: boolean }];
}>();

// Keep the centered 154px popover inside the simulated mini stage when dragged near edges.
const popoverLeft = computed(() => {
  const stageWidth =
    Number.parseFloat(props.miniLayerStyle["--mini-stage-width"] ?? "") ||
    props.miniSize.width + 68;
  const halfPanelWidth = 77;
  const padding = 8;
  const minLeft = halfPanelWidth + padding;
  const maxLeft = Math.max(minLeft, stageWidth - halfPanelWidth - padding);
  const desiredLeft = props.miniPosition.x + props.miniSize.width / 2;
  return Math.round(Math.min(Math.max(desiredLeft, minLeft), maxLeft));
});

const forwardOpacityUpdate = (value: number, options?: { commit?: boolean }) => {
  emit("updateOpacity", value, options);
};
</script>

<template>
  <div class="web-preview__mini-stage">
    <div class="web-preview__mini-layer" :style="miniLayerStyle">
      <div class="web-preview__mini-window" :class="shellClass" :style="miniStyle">
        <MiniWindow
          :amount="earnedText"
          :amount-mode="amountMode"
          :opacity-percent="miniOpacityPercent"
          @drag-start="emit('dragStart', $event)"
          @opacity-menu="emit('opacityMenu')"
          @restore="emit('restore')"
        />
      </div>

      <WebMiniOpacityPanel
        v-if="showWebMiniOpacityPanel"
        :left="popoverLeft"
        :mini-opacity-percent="miniOpacityPercent"
        :shell-class="shellClass"
        :top="miniPosition.y + miniSize.height + 12"
        @restore="emit('restore')"
        @update-opacity="forwardOpacityUpdate"
      />
    </div>

    <div class="web-preview__mini-touch-bar" role="group">
      <button
        class="web-preview__mini-touch-btn"
        type="button"
        @click="emit('toggleOpacityPanel')"
      >
        {{ t("web.opacityLabel") }} · {{ miniOpacityPercent }}%
      </button>
      <button class="web-preview__mini-touch-btn" type="button" @click="emit('restore')">
        {{ t("mini.restoreWindow") }}
      </button>
    </div>
  </div>
</template>
