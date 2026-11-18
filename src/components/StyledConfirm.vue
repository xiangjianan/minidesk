<script setup lang="ts">
import { NButton, NModal } from "naive-ui";

defineProps<{ show: boolean; title: string; message: string; cancelText: string; confirmText: string; danger?: boolean }>();
const emit = defineEmits<{ resolve: [accepted: boolean] }>();
</script>

<template>
  <NModal :show="show" preset="card" class="workspace-dialog-modal" :title="title"
    style="width: min(440px, calc(100vw - 32px))" :mask-closable="false"
    @update:show="(visible: boolean) => { if (!visible) emit('resolve', false); }">
    <p>{{ message }}</p>
    <div class="dialog-actions styled-confirm-actions">
      <NButton data-testid="styled-confirm-cancel" @click="emit('resolve', false)">{{ cancelText }}</NButton>
      <NButton :type="danger ? 'error' : 'primary'" data-testid="styled-confirm-accept" @click="emit('resolve', true)">{{ confirmText }}</NButton>
    </div>
  </NModal>
</template>

<style scoped>
.styled-confirm-actions {
  margin-top: 24px;
}
</style>
