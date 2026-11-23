import { nextTick } from "vue";
import { mount } from "@vue/test-utils";
import { afterEach, describe, expect, it } from "vitest";
import CommandPalette from "../components/CommandPalette.vue";
import TextPanel from "../components/TextPanel.vue";
import { createWorkspaceData } from "../state/workspaces";
import type { WorkspaceData } from "../types";

const wrappers: ReturnType<typeof mount>[] = [];
afterEach(() => {
  wrappers.splice(0).forEach((wrapper) => wrapper.unmount());
  document.body.innerHTML = "";
});

function buildWorkspaces(): WorkspaceData[] {
  const main = createWorkspaceData("MiniDesk", "Do less, do it well.", 1, "ws-main", "zh");
  const second = createWorkspaceData("写作空间", "专注写作", 2, "ws-writing", "zh");
  return [main, second];
}

describe("CommandPalette", () => {
  it("filters quick buttons, reminders, notes, workspaces, and commands and runs via keyboard", async () => {
    const workspaces = buildWorkspaces();
    const wrapper = mount(CommandPalette, {
      attachTo: document.body,
      props: {
        show: true,
        language: "zh",
        theme: "light",
        workspaces,
        activeWorkspaceId: "ws-main",
        zoneVisibility: { assets: true, notes: true, tasks: true, workspace: true },
        quickButtons: [
          { id: "qb-1", title: "邮箱", value: "https://mail.example.com", type: "link", tagId: "tag-1", hidden: false },
          { id: "qb-hidden", title: "隐藏按钮", value: "secret", type: "text", tagId: "tag-1", hidden: true },
        ],
        quickTags: [{ id: "tag-1", title: "常用", collapsed: false, column: 0 }],
        todoLists: [{ id: "today", title: "今天", collapsed: false, compact: true }],
        todos: { today: [{ id: "t-1", text: "完成周报复盘", done: false }] },
        spaces: [{ id: "sp-1", title: "会议纪要", lines: [{ text: "确认发布时间表", indent: 0 }] }],
      },
    });
    wrappers.push(wrapper);
    await nextTick();

    const input = document.querySelector<HTMLInputElement>('[data-testid="command-palette-input"]')!;
    expect(input).not.toBeNull();
    // Hidden quick button must not appear.
    expect(document.querySelector('[data-command-id="quick:qb-hidden"]')).toBeNull();
    expect(document.querySelector('[data-command-id="quick:qb-1"]')).not.toBeNull();
    expect(document.querySelector('[data-command-id="todo:today:t-1"]')).not.toBeNull();
    expect(document.querySelector('[data-command-id="space:sp-1"]')).not.toBeNull();
    expect(document.querySelector('[data-command-id="ws:ws-writing"]')).not.toBeNull();

    // Search for reminder and execute with Enter.
    input.value = "周报";
    input.dispatchEvent(new Event("input"));
    await nextTick();
    const items = Array.from(document.querySelectorAll<HTMLButtonElement>(".command-palette-item"));
    expect(items).toHaveLength(1);
    expect(items[0].dataset.commandId).toBe("todo:today:t-1");

    input.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
    await nextTick();
    expect(wrapper.emitted("close")).toHaveLength(1);
    expect(wrapper.emitted("selectTodo")).toEqual([["today", "t-1"]]);
  });

  it("supports keyboard navigation and theme/zone commands in English", async () => {
    const workspaces = buildWorkspaces();
    const wrapper = mount(CommandPalette, {
      attachTo: document.body,
      props: {
        show: true,
        language: "en",
        theme: "dark",
        workspaces,
        activeWorkspaceId: "ws-main",
        zoneVisibility: { assets: true, notes: true, tasks: true, workspace: true },
        quickButtons: [],
        quickTags: [],
        todoLists: [],
        todos: {},
        spaces: [],
      },
    });
    wrappers.push(wrapper);
    await nextTick();

    const input = document.querySelector<HTMLInputElement>('[data-testid="command-palette-input"]')!;
    input.value = "dark";
    input.dispatchEvent(new Event("input"));
    await nextTick();

    const darkItem = document.querySelector<HTMLButtonElement>('[data-command-id="cmd:theme-dark"]')!;
    expect(darkItem).not.toBeNull();
    expect(darkItem.querySelector(".command-palette-item-check")).not.toBeNull();

    input.value = "light";
    input.dispatchEvent(new Event("input"));
    await nextTick();
    input.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
    await nextTick();
    expect(wrapper.emitted("setTheme")).toEqual([["light"]]);
  });

  it("closes on Escape and shows empty message when nothing matches", async () => {
    const workspaces = buildWorkspaces();
    const wrapper = mount(CommandPalette, {
      attachTo: document.body,
      props: {
        show: true,
        language: "zh",
        theme: "auto",
        workspaces,
        activeWorkspaceId: "ws-main",
        zoneVisibility: { assets: true, notes: true, tasks: true, workspace: true },
        quickButtons: [],
        quickTags: [],
        todoLists: [],
        todos: {},
        spaces: [],
      },
    });
    wrappers.push(wrapper);
    await nextTick();

    const input = document.querySelector<HTMLInputElement>('[data-testid="command-palette-input"]')!;
    input.value = "完全不存在的关键词xyz";
    input.dispatchEvent(new Event("input"));
    await nextTick();
    expect(document.querySelector('[data-testid="command-palette-empty"]')?.textContent?.trim()).toBe("没有找到匹配项");

    input.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    await nextTick();
    expect(wrapper.emitted("close")).toHaveLength(1);
  });

  it("ignores Enter while IME composition is active or just committed (Chinese pinyin)", async () => {
    const workspaces = buildWorkspaces();
    const wrapper = mount(CommandPalette, {
      attachTo: document.body,
      props: {
        show: true,
        language: "zh",
        theme: "light",
        workspaces,
        activeWorkspaceId: "ws-main",
        zoneVisibility: { assets: true, notes: true, tasks: true, workspace: true },
        quickButtons: [
          { id: "qb-1", title: "邮箱", value: "https://mail.example.com", type: "link", tagId: "tag-1", hidden: false },
        ],
        quickTags: [{ id: "tag-1", title: "常用", collapsed: false, column: 0 }],
        todoLists: [],
        todos: {},
        spaces: [],
      },
    });
    wrappers.push(wrapper);
    await nextTick();

    const input = document.querySelector<HTMLInputElement>('[data-testid="command-palette-input"]')!;
    // 1. Mid-composition Enter (Chrome/Firefox).
    input.dispatchEvent(new Event("compositionstart", { bubbles: true }));
    input.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
    await nextTick();
    expect(wrapper.emitted("runQuickButton")).toBeUndefined();
    expect(wrapper.emitted("close")).toBeUndefined();

    // 2. Safari same-tick Enter immediately after compositionend.
    input.dispatchEvent(new Event("compositionend", { bubbles: true }));
    input.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
    await nextTick();
    expect(wrapper.emitted("runQuickButton")).toBeUndefined();
    expect(wrapper.emitted("close")).toBeUndefined();

    // 3. Explicit isComposing flag on KeyboardEvent.
    const composingEnter = new KeyboardEvent("keydown", { key: "Enter", bubbles: true });
    Object.defineProperty(composingEnter, "isComposing", { value: true });
    input.dispatchEvent(composingEnter);
    await nextTick();
    expect(wrapper.emitted("runQuickButton")).toBeUndefined();
  });
});

describe("P0 interaction ergonomics", () => {
  it("toggles bold formatting on selected notebook text with Ctrl/Cmd + B", async () => {
    const wrapper = mount(TextPanel, {
      attachTo: document.body,
      props: {
        titleId: "space-1-title",
        title: "随手记",
        lines: [{ text: "重要结论", indent: 0 }],
        language: "zh",
        hideHeader: true,
      },
    });
    wrappers.push(wrapper);

    const textarea = wrapper.get("textarea");
    await textarea.trigger("click");
    textarea.element.setSelectionRange(0, 2);
    await textarea.trigger("keydown", { key: "b", metaKey: true });

    const updates = wrapper.emitted("update");
    expect(updates).toBeTruthy();
    const lastLines = updates!.at(-1)![0] as Array<{ text: string; marks?: Array<{ type: string; start: number; end: number }> }>;
    expect(lastLines[0].marks).toEqual([{ type: "bold", start: 0, end: 2 }]);
  });
});
