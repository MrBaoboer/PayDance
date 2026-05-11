<script setup lang="ts">
import {
  Minus,
  Moon,
  Pin,
  PinOff,
  Settings2,
  Shrink,
  Sun,
  X,
} from "lucide-vue-next";

defineProps<{
  alwaysOnTop: boolean;
  hasConfigIssues: boolean;
  statusText: string;
  themeMode: "light" | "dark";
}>();

defineEmits<{
  close: [];
  dragStart: [event: MouseEvent];
  minimize: [];
  toggleAlwaysOnTop: [];
  toggleMiniMode: [];
  toggleSettings: [];
  toggleTheme: [];
}>();
</script>

<template>
  <header class="titlebar" @mousedown.left="$emit('dragStart', $event)">
    <div class="status-chip">
      <span
        class="status-dot"
        :class="hasConfigIssues ? 'status-dot--warning' : statusText === '正在上班' ? 'status-dot--working' : 'status-dot--idle'"
      />
      <span>{{ statusText }}</span>
    </div>

    <div class="window-actions">
      <button class="icon-button" title="设置" @click="$emit('toggleSettings')">
        <Settings2 :size="16" />
      </button>
      <button class="icon-button" title="迷你悬浮模式" @click="$emit('toggleMiniMode')">
        <Shrink :size="16" />
      </button>
      <button
        class="icon-button"
        :title="themeMode === 'dark' ? '浅色模式' : '深色模式'"
        @click="$emit('toggleTheme')"
      >
        <Sun v-if="themeMode === 'dark'" :size="16" />
        <Moon v-else :size="16" />
      </button>
      <button
        class="icon-button"
        :title="alwaysOnTop ? '取消置顶' : '窗口置顶'"
        @click="$emit('toggleAlwaysOnTop')"
      >
        <PinOff v-if="alwaysOnTop" :size="16" />
        <Pin v-else :size="16" />
      </button>
      <button class="icon-button" title="最小化" @click="$emit('minimize')">
        <Minus :size="16" />
      </button>
      <button class="icon-button danger" title="关闭到托盘" @click="$emit('close')">
        <X :size="16" />
      </button>
    </div>
  </header>
</template>

<style scoped>
.titlebar {
  display: flex;
  height: 48px;
  flex: 0 0 auto;
  align-items: center;
  justify-content: space-between;
  padding: 0 12px;
}

.status-chip {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 4px;
  color: var(--muted);
  font-size: 16px;
  font-weight: 500;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 999px;
}

.status-dot--warning,
.status-dot--working {
  background: var(--income-accent);
  box-shadow: 0 0 0 3px var(--income-accent-ring);
}

.status-dot--idle {
  background: color-mix(in srgb, var(--muted) 48%, transparent);
}

.window-actions {
  display: flex;
  align-items: center;
  gap: 4px;
}

.icon-button {
  display: grid;
  width: 32px;
  height: 32px;
  place-items: center;
  border-radius: 9px;
  color: var(--muted);
  transition:
    background-color 160ms ease,
    color 160ms ease,
    transform 160ms ease;
}

.icon-button:hover {
  background: var(--subtle);
  color: var(--text);
}

.icon-button:active {
  transform: scale(0.96);
}

.icon-button.danger:hover {
  background: rgb(239 68 68 / 0.12);
  color: var(--danger);
}
</style>
