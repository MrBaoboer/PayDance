<script setup lang="ts">
defineProps<{
  left: number;
  miniOpacityPercent: number;
  shellClass: string;
  top: number;
}>();

const emit = defineEmits<{
  updateOpacity: [value: number, options?: { commit?: boolean }];
}>();

const readRangeValue = (event: Event) => Number((event.target as HTMLInputElement).value);
</script>

<template>
  <section
    class="web-mini-opacity"
    :class="shellClass"
    :style="{ left: `${left}px`, top: `${top}px` }"
    aria-label="迷你悬浮透明度"
  >
    <div class="web-mini-opacity__header">
      <span>透明度</span>
      <strong>{{ miniOpacityPercent }}%</strong>
    </div>
    <label class="web-mini-opacity__slider" for="web-mini-opacity-range">
      <span class="sr-only">迷你悬浮透明度</span>
      <input
        id="web-mini-opacity-range"
        max="100"
        min="10"
        :value="miniOpacityPercent"
        type="range"
        @input="emit('updateOpacity', readRangeValue($event))"
        @change="emit('updateOpacity', readRangeValue($event), { commit: true })"
      />
    </label>
  </section>
</template>
