// SPDX-FileCopyrightText: 2026 Mr.Baoboer // SPDX-License-Identifier: AGPL-3.0-only // //
Additional terms: see /ADDITIONAL_TERMS.md

<script setup lang="ts">
import type { AmountMode } from "../../composables/useSalarySettings";
import type { WindowSize } from "../../lib/window-mode";
import MiniWindow from "../../components/MiniWindow.vue";
import WebMiniOpacityPanel from "./WebMiniOpacityPanel.vue";

defineProps<{
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
  updateOpacity: [value: number, options?: { commit?: boolean }];
}>();

const forwardOpacityUpdate = (value: number, options?: { commit?: boolean }) => {
  emit("updateOpacity", value, options);
};
</script>

<template>
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
      :left="miniPosition.x + miniSize.width / 2"
      :mini-opacity-percent="miniOpacityPercent"
      :shell-class="shellClass"
      :top="miniPosition.y + miniSize.height + 12"
      @update-opacity="forwardOpacityUpdate"
    />
  </div>
</template>
