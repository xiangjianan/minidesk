<script setup lang="ts">
import { NButton, NModal } from "naive-ui";

defineProps<{ show: boolean; title: string; message: string; cancelText: string; confirmText: string; danger?: boolean; hint?: string; secondaryText?: string }>();
const emit = defineEmits<{ resolve: [accepted: boolean]; secondary: [] }>();
</script>

<template>
  <NModal :show="show" preset="card" class="workspace-dialog-modal" :title="title"
    style="width: min(440px, calc(100vw - 32px))" :mask-closable="false"
    @update:show="(visible: boolean) => { if (!visible) emit('resolve', false); }">
    <p>{{ message }}</p>
    <p v-if="hint" class="styled-confirm-hint">{{ hint }}</p>
    <div class="dialog-actions styled-confirm-actions">
      <NButton v-if="secondaryText" data-testid="styled-confirm-secondary" @click="emit('secondary')">{{ secondaryText }}</NButton>
      <NButton data-testid="styled-confirm-cancel" @click="emit('resolve', false)">{{ cancelText }}</NButton>
      <NButton :type="danger ? 'error' : 'primary'" data-testid="styled-confirm-accept" @click="emit('resolve', true)">{{ confirmText }}</NButton>
    </div>
  </NModal>
</template>

<style scoped>
.styled-confirm-hint {
  opacity: 0.7;
}
.styled-confirm-actions {
  margin-top: 24px;
}
</style>
