<script setup lang="ts">
import { ref, watch } from "vue";
import { NButton, NModal } from "naive-ui";

const props = withDefaults(defineProps<{ show: boolean; title: string; message: string; cancelText: string; confirmText: string; autoFocus?: boolean; confirmDisabled?: boolean; danger?: boolean; hint?: string; secondaryText?: string }>(), { autoFocus: false });
const emit = defineEmits<{ resolve: [accepted: boolean]; secondary: [] }>();

// Retain the last visible copy while NModal plays its leave transition so clearing
// caller state (e.g. pendingConfirm = null) never flashes fallback text like "确定".
const display = ref({
  title: props.title,
  message: props.message,
  cancelText: props.cancelText,
  confirmText: props.confirmText,
  danger: props.danger,
  hint: props.hint,
  secondaryText: props.secondaryText,
});

watch(
  () => [props.show, props.title, props.message, props.cancelText, props.confirmText, props.danger, props.hint, props.secondaryText] as const,
  ([show, title, message, cancelText, confirmText, danger, hint, secondaryText]) => {
    if (!show) return;
    display.value = { title, message, cancelText, confirmText, danger, hint, secondaryText };
  },
  { immediate: true },
);
</script>

<template>
  <NModal :show="show" :auto-focus="autoFocus" preset="card" class="workspace-dialog-modal" :title="display.title"
    style="width: min(440px, calc(100vw - 32px))" :mask-closable="false"
    @update:show="(visible: boolean) => { if (!visible) emit('resolve', false); }">
    <slot><p>{{ display.message }}</p></slot>
    <p v-if="display.hint" class="styled-confirm-hint">{{ display.hint }}</p>
    <div class="dialog-actions styled-confirm-actions">
      <NButton v-if="display.secondaryText" data-testid="styled-confirm-secondary" @click="emit('secondary')">{{ display.secondaryText }}</NButton>
      <NButton data-testid="styled-confirm-cancel" @click="emit('resolve', false)">{{ display.cancelText }}</NButton>
      <NButton :type="display.danger ? 'error' : 'primary'" :disabled="confirmDisabled" data-testid="styled-confirm-accept" @click="emit('resolve', true)">{{ display.confirmText }}</NButton>
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
