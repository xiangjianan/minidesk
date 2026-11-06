import { flushPromises, mount } from "@vue/test-utils";
import { afterEach, describe, expect, it, vi } from "vitest";
import { NModal } from "naive-ui";
import SpacePanel from "../components/SpacePanel.vue";
import TodoPanel from "../components/TodoPanel.vue";
import QuickButtons from "../components/QuickButtons.vue";
import { DEFAULT_TITLES } from "../state/defaults";
import type { PolishKind, PolishResult } from "../sync/polishClient";

const wrappers: ReturnType<typeof mount>[] = [];
const originalClipboard = Object.getOwnPropertyDescriptor(navigator, "clipboard");
afterEach(() => {
  wrappers.splice(0).forEach((wrapper) => wrapper.unmount());
  if (originalClipboard) Object.defineProperty(navigator, "clipboard", originalClipboard);
  else Reflect.deleteProperty(navigator, "clipboard");
});

function mountPastePanel(polish: (kind: PolishKind, text: string) => Promise<PolishResult>, raw = "clipboard draft") {
  const readText = vi.fn().mockResolvedValue(raw);
  Object.defineProperty(navigator, "clipboard", { configurable: true, value: { readText } });
  const wrapper = mount(SpacePanel, { props: {
    spaces: [{ id: "notes", title: "Notes", lines: [{ text: "Keep the first line", indent: 0 }, { text: "Last line", indent: 0 }] }],
    activeSpaceId: "notes", polish,
  }, attachTo: document.body });
  wrappers.push(wrapper);
  return { wrapper, readText };
}

describe("visible workbench actions", () => {
  it("adds to the selected reminder list without opening a context menu", async () => {
    const wrapper = mount(TodoPanel, { props: {
      titles: DEFAULT_TITLES,
      todos: { morning: [], noon: [], evening: [] },
      todoLists: [{ id: "morning", title: "Morning", collapsed: false, compact: true }, { id: "noon", title: "Noon", collapsed: false, compact: true }],
    }});
    wrappers.push(wrapper);
    await wrapper.findAll('[aria-label="添加提醒"]')[1].trigger("click");
    expect(wrapper.emitted("create")).toEqual([["noon"]]);
  });

  it("opens list creation from the header", async () => {
    const wrapper = mount(QuickButtons, { props: {
      title: "Actions", buttons: [], showHidden: false, language: "en",
    }});
    wrappers.push(wrapper);
    await wrapper.get(".quick-add-button").trigger("click");
    expect(wrapper.findAllComponents(NModal).find(modal => modal.props("show"))?.props("title")).toBe("New list");
    expect(wrapper.emitted("save")).toBeUndefined();
  });

  it("pastes clipboard text into the active notebook without smart processing", async () => {
    const polish = vi.fn(async (): Promise<PolishResult> => null);
    const { wrapper, readText } = mountPastePanel(polish);
    const textarea = wrapper.get("textarea");
    textarea.element.setSelectionRange(0, 7);
    await textarea.trigger("select");
    await wrapper.get('[aria-label="粘贴"]').trigger("click");
    await flushPromises();
    expect(readText).toHaveBeenCalledOnce();
    expect(polish).not.toHaveBeenCalled();
    expect(textarea.element.value).toBe("Keep the first line\nLast lineclipboard draft");
    expect(wrapper.emitted("update")?.at(-1)?.[0]).toBe("notes");
  });

  it("shows the paste button without a smart paste service", async () => {
    const { wrapper } = mountPastePanel(vi.fn(async () => null));
    await wrapper.setProps({ polish: undefined, language: "en" });
    expect(wrapper.get('[aria-label="Paste"]').attributes("title")).toBe("Paste");
  });
});
