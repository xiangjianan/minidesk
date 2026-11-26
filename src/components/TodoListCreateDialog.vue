<script setup lang="ts">
import { TITLE_MAX_LENGTH, limitTitle } from "../state/titleLimits";
import { computed, nextTick, ref } from "vue";
import { NButton, NInput, NModal } from "naive-ui";
import type { InputInst } from "naive-ui";
import { findTodoListByTitle } from "../state/todoListNames";
import { QUICK_COLORS } from "../state/quickColors";
import type { AppLanguage, TodoListConfig } from "../types";
import { getUiText } from "../state/i18n";

const props = defineProps<{ language?: AppLanguage; lists?: TodoListConfig[]; dialogTitle?: string }>();
const emit = defineEmits<{ confirm: [anchor: HTMLElement | undefined, title: string, id?: string, backgroundColor?: string | null] }>();
const uiText = computed(() => getUiText(props.language ?? "zh"));
const inputRef = ref<InputInst | null>(null);
const show = ref(false);
const title = ref("");
const editingId = ref<string>();
const color = ref<string | null>(null);
const customColor = ref("#80aed5");
const duplicate = computed(() => Boolean(findTodoListByTitle((props.lists ?? []).filter(list => list.id !== editingId.value), limitTitle(title.value), props.language ?? "zh")));
const canSubmit = computed(() => Boolean(limitTitle(title.value)) && !duplicate.value);
const attempted = ref(false);
let anchor: HTMLElement | undefined;

async function open(element?: HTMLElement, list?: TodoListConfig): Promise<void> {
  if (element === document.activeElement) element.blur();
  anchor = element;
  editingId.value = list?.id;
  title.value = list?.title ?? "";
  color.value = list?.backgroundColor ?? null;
  customColor.value = color.value ?? "#80aed5";
  attempted.value = false;
  show.value = true;
  await nextTick();
  inputRef.value?.focus();
}
function confirm(): void {
  const trimmed = limitTitle(title.value);
  if (!trimmed) { inputRef.value?.focus(); return; }
  attempted.value = true;
  if (duplicate.value) { inputRef.value?.focus(); return; }
  emit("confirm", anchor, trimmed, editingId.value, color.value);
  show.value = false;
}
function clear(): void {
  if (show.value) return;
  title.value = "";
  color.value = null;
  customColor.value = "#80aed5";
  anchor = undefined;
}
defineExpose({ open });
</script>

<template>
  <NModal :show="show" preset="card" class="quick-dialog todo-list-create-dialog"
    :mask-closable="false" :title="editingId ? uiText.todo.editList : (dialogTitle ?? uiText.todo.newList)" :aria-label="editingId ? uiText.todo.editList : (dialogTitle ?? uiText.todo.newList)"
    @close="show = false" @esc="show = false" @after-leave="clear">
    <form class="quick-form" autocomplete="off" @submit.prevent="confirm">
      <label for="todo-list-create-input">
        <span>{{ uiText.todo.listName }}</span>
        <NInput ref="inputRef" v-model:value="title" :status="duplicate && (attempted || Boolean(limitTitle(title))) ? 'error' : undefined" :maxlength="TITLE_MAX_LENGTH" show-count
          :input-props="{ id: 'todo-list-create-input', class: 'todo-list-create-input', name: 'mini-desk-todo-list-title', autocomplete: 'off' }" />
      </label>
      <p v-if="duplicate && (attempted || Boolean(limitTitle(title)))" role="alert">{{ uiText.todo.duplicateList }}</p>
      <fieldset class="quick-list-colors"><legend>{{ uiText.quick.buttonColor }}</legend>
        <button type="button" class="quick-color-none" :class="{ selected: color === null }" :aria-label="uiText.quick.noColor" :title="uiText.quick.noColor" :aria-pressed="color === null" @click="color = null">∅</button>
        <button v-for="swatch in QUICK_COLORS" :key="swatch" type="button" class="quick-color-swatch" :class="{ selected: color === swatch }" :style="{ '--quick-list-color': swatch }" :aria-label="swatch" :aria-pressed="color === swatch" @click="color = swatch" />
        <label class="quick-color-custom"><span class="quick-color-custom-preview" :style="{ '--quick-list-color': customColor }"><input v-model="customColor" type="color" :aria-label="uiText.quick.customColor" @input="color = ($event.target as HTMLInputElement).value" /></span><span class="quick-color-custom-label">{{ uiText.quick.customColor }}</span></label>
      </fieldset>
      <div class="dialog-actions">
        <NButton class="quick-dialog-action todo-list-create-cancel" @click="show = false">{{ uiText.common.cancel }}</NButton>
        <NButton class="quick-dialog-action quick-dialog-submit todo-list-create-confirm" type="primary" attr-type="submit" :disabled="!canSubmit">{{ uiText.common.save }}</NButton>
      </div>
    </form>
  </NModal>
</template>
