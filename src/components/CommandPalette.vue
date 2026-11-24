<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import type { Component } from "vue";
import { NIcon } from "naive-ui";
import {
  AppWindow,
  Check,
  CheckCircle2,
  Circle,
  CloudDownload,
  CloudUpload,
  Copy,
  KeyRound,
  Layers,
  Link,
  Moon,
  Plus,
  Search,
  Sun,
  Contrast,
} from "lucide-vue-next";
import { ImagesAreaIcon, NotesAreaIcon, QuickAreaIcon, RemindersAreaIcon } from "../utils/areaIcons";
import { isImeComposing } from "../utils/ime";
import HighlightText from "./HighlightText.vue";
import { getUiText } from "../state/i18n";
import { getWorkspaceBoardTitle } from "../state/workspaces";
import type {
  AppLanguage,
  QuickButton,
  QuickTag,
  ThemeMode,
  TodoListConfig,
  TodoMap,
  WorkspaceData,
  WorkspaceSpace,
  ZoneKey,
  ZoneVisibility,
} from "../types";

type PaletteGroupKey = "quick" | "todos" | "notes" | "workspaces" | "commands";

interface PaletteItem {
  id: string;
  group: PaletteGroupKey;
  title: string;
  subtitle?: string;
  icon: Component;
  checked?: boolean;
  done?: boolean;
  keywords?: string;
  run: () => void;
}

const props = withDefaults(defineProps<{
  show: boolean;
  language?: AppLanguage;
  theme: ThemeMode;
  workspaces: WorkspaceData[];
  activeWorkspaceId: string;
  zoneVisibility: ZoneVisibility;
  quickButtons: QuickButton[];
  quickTags: QuickTag[];
  todoLists: TodoListConfig[];
  todos: TodoMap;
  spaces: WorkspaceSpace[];
}>(), {
  language: "zh",
});

const emit = defineEmits<{
  close: [];
  runQuickButton: [id: string];
  selectTodo: [period: string, id: string];
  selectSpace: [id: string];
  switchWorkspace: [id: string];
  setTheme: [theme: ThemeMode];
  toggleZone: [zone: ZoneKey];
  createWorkspace: [];
  exportWorkspace: [];
  openShortcutHelp: [];
}>();

const uiText = computed(() => getUiText(props.language));
const query = ref("");
const activeIndex = ref(0);
const composing = ref(false);
let compositionEndedAt = 0;
const inputRef = ref<HTMLInputElement | null>(null);
const listRef = ref<HTMLElement | null>(null);

function handleCompositionStart(): void {
  composing.value = true;
}

function handleCompositionEnd(): void {
  composing.value = false;
  compositionEndedAt = Date.now();
}

function isComposingKeydown(event: KeyboardEvent): boolean {
  if (composing.value || isImeComposing(event)) return true;
  // Safari dispatches `compositionend` immediately before the confirming Enter `keydown`.
  return event.key === "Enter" && Date.now() - compositionEndedAt < 80;
}

const normalizedQuery = computed(() => query.value.trim().toLowerCase());

function quickIcon(type: QuickButton["type"]): Component {
  if (type === "text") return Copy;
  if (type === "api") return CloudUpload;
  if (type === "app") return AppWindow;
  return Link;
}

function summarizeValue(value: string): string {
  const compact = value.replace(/\s+/g, " ").trim();
  if (!compact) return "";
  try {
    const url = new URL(compact);
    return url.host + (url.pathname === "/" ? "" : url.pathname);
  } catch {
    return compact.length > 56 ? `${compact.slice(0, 56)}…` : compact;
  }
}

function findMatchingNoteSnippet(space: WorkspaceSpace, needle: string): string | undefined {
  const nonEmpty = space.lines.map((line) => line.text.trim()).filter(Boolean);
  if (nonEmpty.length === 0) return undefined;
  if (!needle) {
    const first = nonEmpty[0];
    return first.length > 60 ? `${first.slice(0, 60)}…` : first;
  }
  const hit = nonEmpty.find((line) => line.toLowerCase().includes(needle)) ?? nonEmpty[0];
  return hit.length > 60 ? `${hit.slice(0, 60)}…` : hit;
}

function matchesQuery(needle: string, ...fields: Array<string | undefined>): boolean {
  if (!needle) return true;
  return fields.some((field) => field && field.toLowerCase().includes(needle));
}

const tagTitleMap = computed(() => {
  const map = new Map<string, string>();
  for (const tag of props.quickTags) map.set(tag.id, tag.title);
  return map;
});

const allItems = computed<PaletteItem[]>(() => {
  const needle = normalizedQuery.value;
  const items: PaletteItem[] = [];
  const cp = uiText.value.commandPalette;

  // 1. Quick actions
  const matchedQuick: PaletteItem[] = [];
  for (const button of props.quickButtons) {
    if (button.hidden) continue;
    const tagTitle = button.tagId ? tagTitleMap.value.get(button.tagId) : undefined;
    if (!matchesQuery(needle, button.title, button.value, tagTitle)) continue;
    matchedQuick.push({
      id: `quick:${button.id}`,
      group: "quick",
      title: button.title,
      subtitle: [tagTitle, summarizeValue(button.value)].filter(Boolean).join(" · "),
      icon: quickIcon(button.type),
      run: () => emit("runQuickButton", button.id),
    });
  }
  items.push(...(needle ? matchedQuick.slice(0, 8) : matchedQuick.slice(0, 4)));

  // 2. Reminders
  const matchedTodos: PaletteItem[] = [];
  for (const list of props.todoLists) {
    const listItems = props.todos[list.id] ?? [];
    for (const todo of listItems) {
      const text = todo.text.trim();
      if (!text) continue;
      if (!matchesQuery(needle, text, list.title)) continue;
      matchedTodos.push({
        id: `todo:${list.id}:${todo.id}`,
        group: "todos",
        title: text,
        subtitle: list.title,
        icon: todo.done ? CheckCircle2 : Circle,
        done: todo.done,
        run: () => emit("selectTodo", list.id, todo.id),
      });
    }
  }
  items.push(...(needle ? matchedTodos.slice(0, 8) : matchedTodos.slice(0, 4)));

  // 3. Notebooks
  const matchedNotes: PaletteItem[] = [];
  for (const space of props.spaces) {
    const bodyText = space.lines.map((line) => line.text).join(" ");
    if (!matchesQuery(needle, space.title, bodyText)) continue;
    matchedNotes.push({
      id: `space:${space.id}`,
      group: "notes",
      title: space.title,
      subtitle: findMatchingNoteSnippet(space, needle),
      icon: NotesAreaIcon,
      run: () => emit("selectSpace", space.id),
    });
  }
  items.push(...(needle ? matchedNotes.slice(0, 6) : matchedNotes.slice(0, 3)));

  // 4. Other workspaces
  if (props.workspaces.length > 1) {
    for (const workspace of props.workspaces) {
      if (workspace.id === props.activeWorkspaceId) continue;
      const title = getWorkspaceBoardTitle(workspace);
      const slogan = workspace.customTitles["board-slogan"]?.trim();
      if (!matchesQuery(needle, title, slogan, "workspace 空间")) continue;
      items.push({
        id: `ws:${workspace.id}`,
        group: "workspaces",
        title,
        subtitle: slogan || undefined,
        icon: Layers,
        run: () => emit("switchWorkspace", workspace.id),
      });
    }
  }

  // 5. Commands
  const commands: PaletteItem[] = [
    {
      id: "cmd:theme-light",
      group: "commands",
      title: cp.commands.themeLight,
      icon: Sun,
      checked: props.theme === "light",
      keywords: "theme light appearance 浅色 亮色 外观 主题",
      run: () => emit("setTheme", "light"),
    },
    {
      id: "cmd:theme-dark",
      group: "commands",
      title: cp.commands.themeDark,
      icon: Moon,
      checked: props.theme === "dark",
      keywords: "theme dark appearance 深色 暗色 外观 主题",
      run: () => emit("setTheme", "dark"),
    },
    {
      id: "cmd:theme-auto",
      group: "commands",
      title: cp.commands.themeAuto,
      icon: Contrast,
      checked: props.theme === "auto",
      keywords: "theme system auto 跟随系统 外观 主题",
      run: () => emit("setTheme", "auto"),
    },
    {
      id: "cmd:zone-assets",
      group: "commands",
      title: cp.commands.toggleAssets,
      icon: ImagesAreaIcon,
      checked: props.zoneVisibility.assets,
      keywords: "zone images assets 贴图 区域 显示 隐藏",
      run: () => emit("toggleZone", "assets"),
    },
    {
      id: "cmd:zone-notes",
      group: "commands",
      title: cp.commands.toggleNotes,
      icon: QuickAreaIcon,
      checked: props.zoneVisibility.notes,
      keywords: "zone quick buttons 快捷动作 按钮 区域 显示 隐藏",
      run: () => emit("toggleZone", "notes"),
    },
    {
      id: "cmd:zone-tasks",
      group: "commands",
      title: cp.commands.toggleTasks,
      icon: RemindersAreaIcon,
      checked: props.zoneVisibility.tasks,
      keywords: "zone reminders todos 提醒事项 待办 区域 显示 隐藏",
      run: () => emit("toggleZone", "tasks"),
    },
    {
      id: "cmd:zone-workspace",
      group: "commands",
      title: cp.commands.toggleWorkspace,
      icon: NotesAreaIcon,
      checked: props.zoneVisibility.workspace,
      keywords: "zone notebook notes 记事本 区域 显示 隐藏",
      run: () => emit("toggleZone", "workspace"),
    },
    {
      id: "cmd:new-workspace",
      group: "commands",
      title: cp.commands.newWorkspace,
      icon: Plus,
      keywords: "new workspace create 新建 空间 工作空间",
      run: () => emit("createWorkspace"),
    },
    {
      id: "cmd:export-workspace",
      group: "commands",
      title: cp.commands.exportWorkspace,
      icon: CloudDownload,
      keywords: "export backup workspace 导出 备份 空间",
      run: () => emit("exportWorkspace"),
    },
    {
      id: "cmd:shortcut-help",
      group: "commands",
      title: cp.commands.shortcutHelp,
      icon: KeyRound,
      keywords: "help shortcuts keyboard 帮助 快捷键",
      run: () => emit("openShortcutHelp"),
    },
  ];
  for (const command of commands) {
    if (matchesQuery(needle, command.title, command.keywords)) {
      items.push(command);
    }
  }

  return items;
});

const groupedItems = computed(() => {
  const order: PaletteGroupKey[] = ["quick", "todos", "notes", "workspaces", "commands"];
  const groups: Array<{ key: PaletteGroupKey; label: string; items: Array<PaletteItem & { flatIndex: number }> }> = [];
  let flatIndex = 0;
  for (const key of order) {
    const matched = allItems.value.filter((item) => item.group === key);
    if (matched.length === 0) continue;
    groups.push({
      key,
      label: uiText.value.commandPalette.groups[key],
      items: matched.map((item) => ({ ...item, flatIndex: flatIndex++ })),
    });
  }
  return groups;
});

const flatOrderedItems = computed(() => groupedItems.value.flatMap((group) => group.items));

watch(
  () => props.show,
  async (open) => {
    if (!open) return;
    query.value = "";
    activeIndex.value = 0;
    await nextTick();
    inputRef.value?.focus({ preventScroll: true });
  },
);

watch(
  () => flatOrderedItems.value.length,
  (count) => {
    if (count === 0) activeIndex.value = 0;
    else if (activeIndex.value >= count) activeIndex.value = 0;
  },
);

function scrollActiveIntoView(): void {
  void nextTick(() => {
    const active = listRef.value?.querySelector<HTMLElement>(".command-palette-item.is-active");
    active?.scrollIntoView({ block: "nearest" });
  });
}

function executeItem(item: PaletteItem | undefined): void {
  if (!item) return;
  emit("close");
  item.run();
}

function handleInputKeydown(event: KeyboardEvent): void {
  if (isComposingKeydown(event)) return;
  const total = flatOrderedItems.value.length;
  if (event.key === "Escape") {
    event.preventDefault();
    event.stopPropagation();
    emit("close");
    return;
  }
  if (event.key === "ArrowDown") {
    event.preventDefault();
    if (total > 0) {
      activeIndex.value = (activeIndex.value + 1) % total;
      scrollActiveIntoView();
    }
    return;
  }
  if (event.key === "ArrowUp") {
    event.preventDefault();
    if (total > 0) {
      activeIndex.value = (activeIndex.value - 1 + total) % total;
      scrollActiveIntoView();
    }
    return;
  }
  if (event.key === "Enter") {
    event.preventDefault();
    executeItem(flatOrderedItems.value[activeIndex.value]);
  }
}

function handleBackdropKeydown(event: KeyboardEvent): void {
  if (props.show && event.key === "Escape" && !composing.value && !isImeComposing(event)) {
    event.preventDefault();
    event.stopPropagation();
    emit("close");
  }
}

onMounted(() => window.addEventListener("keydown", handleBackdropKeydown, true));
onBeforeUnmount(() => window.removeEventListener("keydown", handleBackdropKeydown, true));
</script>

<template>
  <Teleport to="body">
    <Transition name="command-palette">
      <div
        v-if="show"
        class="command-palette-backdrop"
        data-testid="command-palette-backdrop"
        @mousedown.self="emit('close')"
      >
        <div
          class="command-palette-dialog"
          role="dialog"
          aria-modal="true"
          :aria-label="uiText.commandPalette.title"
          data-testid="command-palette"
        >
          <div class="command-palette-input-row">
            <NIcon class="command-palette-search-icon" :component="Search" :size="16" />
            <input
              ref="inputRef"
              v-model="query"
              type="text"
              class="command-palette-input"
              data-testid="command-palette-input"
              :placeholder="uiText.commandPalette.placeholder"
              :aria-label="uiText.commandPalette.placeholder"
              autocomplete="off"
              spellcheck="false"
              @compositionstart="handleCompositionStart"
              @compositionend="handleCompositionEnd"
              @keydown="handleInputKeydown"
            />
            <button
              type="button"
              class="command-palette-kbd"
              data-testid="command-palette-close"
              :aria-label="uiText.common.close"
              :title="`${uiText.common.close} (Esc)`"
              @click="emit('close')"
            >
              Esc
            </button>
          </div>

          <div ref="listRef" class="command-palette-results" role="listbox" :aria-label="uiText.commandPalette.title">
            <p v-if="groupedItems.length === 0" class="command-palette-empty" data-testid="command-palette-empty">
              {{ uiText.commandPalette.empty }}
            </p>
            <section v-for="group in groupedItems" :key="group.key" class="command-palette-group">
              <h3 class="command-palette-group-title">{{ group.label }}</h3>
              <button
                v-for="item in group.items"
                :key="item.id"
                type="button"
                role="option"
                class="command-palette-item"
                :class="{ 'is-active': item.flatIndex === activeIndex, 'is-done': item.done }"
                :aria-selected="item.flatIndex === activeIndex"
                :data-command-id="item.id"
                @mouseenter="activeIndex = item.flatIndex"
                @click="executeItem(item)"
              >
                <span class="command-palette-item-icon" aria-hidden="true">
                  <NIcon :component="item.icon" :size="15" />
                </span>
                <span class="command-palette-item-text">
                  <HighlightText class="command-palette-item-title" :text="item.title" :query="query" />
                  <span v-if="item.subtitle" class="command-palette-item-subtitle">{{ item.subtitle }}</span>
                </span>
                <span v-if="item.checked" class="command-palette-item-check" aria-hidden="true">
                  <NIcon :component="Check" :size="14" />
                </span>
              </button>
            </section>
          </div>

          <div class="command-palette-footer" aria-hidden="true">
            <span><kbd>↑</kbd><kbd>↓</kbd> {{ uiText.commandPalette.hintNavigate }}</span>
            <span><kbd>↵</kbd> {{ uiText.commandPalette.hintSelect }}</span>
            <span><kbd>Esc</kbd> {{ uiText.commandPalette.hintClose }}</span>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
