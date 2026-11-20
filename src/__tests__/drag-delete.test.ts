import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { nextTick } from "vue";
import { defaultState, defaultWorkspace, STORAGE_KEY } from "../state/defaults";
import { cancelDragDelete, dragDelete, finishDragDelete, updateDragDelete } from "../utils/dragDelete";
import { mountApp } from "./helpers/mount-app";
import ImagePanel from "../components/ImagePanel.vue";

vi.mock("naive-ui", async () => {
  const { createNaiveUiStubModule } = await import("./helpers/naive-ui-mock");
  return createNaiveUiStubModule();
});

const transfer = () => ({ effectAllowed: "", setData: vi.fn(), setDragImage: vi.fn(), items: { add: vi.fn() }, types: [] });

describe("drag to delete", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    localStorage.clear();
    const workspace = defaultWorkspace();
    workspace.todoLists = [
      { id: "work", title: "工作", collapsed: false, compact: false, column: 0 },
      { id: "home", title: "生活", collapsed: false, compact: false, column: 0 },
    ];
    workspace.todos = { work: [{ id: "todo-1", text: "提醒", done: false }], home: [] };
    workspace.images = [{ id: "image-1", src: "data:image/png;base64,AA==", createdAt: 1 }];
    workspace.quickTags = [{ id: "tag-1", title: "一" }, { id: "tag-2", title: "二" }];
    workspace.quickButtons = [{ id: "quick-1", title: "快捷", value: "内容", type: "text", hidden: false, tagId: "tag-1" }];
    workspace.spaces = [
      { id: "space-1", title: "一", lines: [{ text: "", indent: 0 }] },
      { id: "space-2", title: "二", lines: [{ text: "", indent: 0 }] },
    ];
    workspace.activeSpaceId = "space-1";
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...defaultState(), companionGifTheme: "none", workspaces: [workspace] }));
  });
  afterEach(() => { cancelDragDelete(); vi.useRealTimers(); localStorage.clear(); document.body.innerHTML = ""; });

  it.each([
    [".image-card img", false],
    [".quick-button[data-id='quick-1']", false],
    [".todo-item[data-todo-id='todo-1'] .todo-drag-handle", false],
    [".quick-tag-group[data-tag-id='tag-1'] .quick-tag-heading", true],
    [".todo-section[data-list-id='work'] .todo-heading", true],
    [".space-tab[data-space-tab-id='space-1']", true],
  ])("uses the existing deletion flow for %s", async (selector, confirms) => {
    const wrapper = mountApp();
    try {
      await wrapper.get(selector).trigger("dragstart", { dataTransfer: transfer() });
      await nextTick();
      const zone = document.querySelector<HTMLElement>("[data-drag-delete-zone]")!;
      expect(zone).not.toBeNull();
      vi.spyOn(zone, "getBoundingClientRect").mockReturnValue({ left: 100, right: 300, top: 400, bottom: 500, width: 200, height: 100, x: 100, y: 400, toJSON: () => ({}) });
      updateDragDelete(200, 450);
      expect(dragDelete.value?.over).toBe(true);
      zone.dispatchEvent(new MouseEvent("drop", { bubbles: true, cancelable: true, clientX: 200, clientY: 450 }));
      await vi.advanceTimersByTimeAsync(0);
      await nextTick();
      expect(dragDelete.value).toBeNull();
      if (confirms) {
        expect(wrapper.find('[data-testid="styled-confirm-accept"]').exists()).toBe(true);
      } else {
        expect(document.querySelector('[data-testid="default-message-action"]')).not.toBeNull();
      }
    } finally { wrapper.unmount(); }
  });

  it("hides the zone without deleting when a native drag ends or Escape is pressed", async () => {
    const wrapper = mountApp();
    try {
      const button = wrapper.get(".quick-button[data-id='quick-1']");
      await button.trigger("dragstart", { dataTransfer: transfer() });
      expect(dragDelete.value).not.toBeNull();
      window.dispatchEvent(new Event("dragend"));
      expect(dragDelete.value).toBeNull();
      await button.trigger("dragstart", { dataTransfer: transfer() });
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
      expect(dragDelete.value).toBeNull();
      expect(wrapper.find(".quick-button[data-id='quick-1']").exists()).toBe(true);
    } finally { wrapper.unmount(); }
  });

  it("deletes an image dropped with pointer dragging without reordering it", async () => {
    const wrapper = mountApp();
    try {
      const card = wrapper.get(".image-card");
      const pointer = (target: EventTarget, type: string, x: number, y: number) => {
        const event = new MouseEvent(type, { bubbles: true, cancelable: true, button: 0, clientX: x, clientY: y });
        Object.defineProperty(event, "pointerId", { value: 1 });
        target.dispatchEvent(event);
      };
      pointer(card.element, "pointerdown", 40, 120);
      pointer(window, "pointermove", 60, 140);
      await nextTick();
      const zone = document.querySelector<HTMLElement>("[data-drag-delete-zone]")!;
      expect(zone).not.toBeNull();
      vi.spyOn(zone, "getBoundingClientRect").mockReturnValue({ left: 100, right: 300, top: 400, bottom: 500, width: 200, height: 100, x: 100, y: 400, toJSON: () => ({}) });
      pointer(window, "pointermove", 200, 450);
      await nextTick();
      expect(zone.classList.contains("is-over")).toBe(true);
      pointer(window, "pointerup", 200, 450);
      await vi.advanceTimersByTimeAsync(0);
      await nextTick();
      expect(wrapper.getComponent(ImagePanel).emitted("delete")?.[0]?.[0]).toBe("image-1");
      expect(wrapper.getComponent(ImagePanel).emitted("reorder")).toBeUndefined();
    } finally { wrapper.unmount(); }
  });

  it("does not delete when the drag is cancelled or released elsewhere", () => {
    const remove = vi.fn();
    const zone = document.createElement("div");
    zone.dataset.dragDeleteZone = "";
    zone.getBoundingClientRect = () => ({ left: 100, right: 300, top: 400, bottom: 500, width: 200, height: 100, x: 100, y: 400, toJSON: () => ({}) });
    document.body.append(zone);
    dragDelete.value = { remove, over: false };
    expect(finishDragDelete(30, 30)).toBe(false);
    expect(remove).not.toHaveBeenCalled();
    dragDelete.value = { remove, over: false };
    expect(finishDragDelete(105, 405)).toBe(false); // transparent corner of the arc
    expect(remove).not.toHaveBeenCalled();
    dragDelete.value = { remove, over: false };
    cancelDragDelete();
    expect(remove).not.toHaveBeenCalled();
  });
});
