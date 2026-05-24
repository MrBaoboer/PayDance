<script setup lang="ts">
import { resizeHandles, type ResizeDirection } from "../../lib/resize-handles";

defineEmits<{
  resizeStart: [direction: ResizeDirection];
}>();
</script>

<template>
  <button
    v-for="handle in resizeHandles"
    :key="handle.direction"
    class="resize-handle"
    :class="handle.className"
    aria-hidden="true"
    tabindex="-1"
    type="button"
    @mousedown.left.stop.prevent="$emit('resizeStart', handle.direction)"
  />
</template>

<style scoped>
.resize-handle {
  position: absolute;
  z-index: 2;
  border: 0;
  background: transparent;
  padding: 0;
}

.resize-handle--north,
.resize-handle--south {
  left: 12px;
  right: 12px;
  height: 10px;
  cursor: ns-resize;
}

.resize-handle--north {
  top: 0;
}

.resize-handle--south {
  bottom: 0;
}

.resize-handle--east,
.resize-handle--west {
  top: 12px;
  bottom: 12px;
  width: 10px;
  cursor: ew-resize;
}

.resize-handle--east {
  right: 0;
}

.resize-handle--west {
  left: 0;
}

.resize-handle--north-east,
.resize-handle--north-west,
.resize-handle--south-east,
.resize-handle--south-west {
  width: 16px;
  height: 16px;
}

.resize-handle--north-east,
.resize-handle--south-west {
  cursor: nesw-resize;
}

.resize-handle--north-west,
.resize-handle--south-east {
  cursor: nwse-resize;
}

.resize-handle--north-east {
  top: 0;
  right: 0;
}

.resize-handle--north-west {
  top: 0;
  left: 0;
}

.resize-handle--south-east {
  right: 0;
  bottom: 0;
}

.resize-handle--south-west {
  bottom: 0;
  left: 0;
}
</style>
