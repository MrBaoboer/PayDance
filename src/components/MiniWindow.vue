<script setup lang="ts">
import RollingAmount from "./RollingAmount.vue";

defineProps<{
  amount: string;
  amountMode: "rolling" | "plain";
}>();

defineEmits<{
  restore: [];
  dragStart: [event: PointerEvent];
}>();
</script>

<template>
  <div
    class="mini-window"
    title="双击恢复完整窗口"
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
  background: var(--mini-panel, var(--panel));
  box-shadow: none;
  color: var(--text);
  backdrop-filter: blur(30px);
  padding: 0 12px;
}

.mini-window :deep(.rolling-amount) {
  max-width: 100%;
}
</style>
