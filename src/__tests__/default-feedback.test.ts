import { beforeEach, describe, expect, it, vi } from "vitest";
import { flushPromises } from "@vue/test-utils";
import { NModal } from "naive-ui";
import { mountApp } from "./helpers/mount-app";
import TodoPanel from "../components/TodoPanel.vue";
import ImagePanel from "../components/ImagePanel.vue";
import QuickButtons from "../components/QuickButtons.vue";
import SettingsMenu from "../components/SettingsMenu.vue";
import CompanionBubble from "../components/CompanionBubble.vue";
import { defaultState, defaultWorkspace, STORAGE_KEY } from "../state/defaults";
import { withoutKaomoji, KAOMOJI_BY_MOOD } from "../state/messages";
import { useCompanionBubble, type CompanionBubbleDeps } from "../composables/useCompanionBubble";

vi.mock("naive-ui", async () => {
  const { createNaiveUiStubModule } = await import("./helpers/naive-ui-mock");
  return createNaiveUiStubModule();
});

beforeEach(() => { localStorage.clear(); });

describe("default theme feedback", () => {
  it("suppresses routine save feedback without showing a companion", async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultState()));
    const wrapper = mountApp();
    try {
      await flushPromises();
      await vi.dynamicImportSettled();
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "s", ctrlKey: true, bubbles: true }));
      await flushPromises();
      expect(document.querySelector('[data-testid="default-message"]')).toBeNull();
      expect(wrapper.find('[data-testid="companion-bubble"]').exists()).toBe(false);
    } finally { wrapper.unmount(); }
  });

  it("renders necessary feedback above the app in the document body", async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultState()));
    const wrapper = mountApp();
    try {
      await flushPromises();
      wrapper.getComponent(SettingsMenu).vm.$emit("customGifMissing");
      await wrapper.vm.$nextTick();
      const message = document.querySelector('[data-testid="default-message"]');
      expect(message?.closest("transition-stub")?.parentElement).toBe(document.body);
      expect(message?.textContent).toBeTruthy();
    } finally { wrapper.unmount(); }
  });

  it.each([ ["none", "todo"], ["none", "image"], ["none", "quick"], ["cat", "todo"], ["cat", "image"], ["cat", "quick"] ] as const)("positions %s theme %s deletion feedback near the pointer", async (theme, kind) => {
    const workspace = defaultWorkspace();
    workspace.todoLists = [{ id: "work", title: "工作", collapsed: false, compact: false, column: 0 }];
    workspace.todos = { work: [{ id: "todo-1", text: "提醒", done: false }] };
    workspace.images = [{ id: "image-1", src: "data:image/png;base64,AA==", createdAt: 1 }];
    workspace.quickButtons = [{ id: "quick-1", title: "快捷", value: "内容", type: "text" }];
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...defaultState(), companionGifTheme: theme, workspaces: [workspace] }));
    const wrapper = mountApp();
    try {
      window.dispatchEvent(new MouseEvent("mousemove", { clientX: 300, clientY: 200 }));
      if (kind === "todo") wrapper.getComponent(TodoPanel).vm.$emit("remove", "work", "todo-1");
      else if (kind === "image") wrapper.getComponent(ImagePanel).vm.$emit("delete", "image-1");
      else wrapper.getComponent(QuickButtons).vm.$emit("delete", "quick-1");
      await wrapper.vm.$nextTick();
      if (theme === "none") {
        const message = document.querySelector<HTMLElement>('[data-testid="default-message"]');
        expect(message?.classList.contains("is-near-pointer")).toBe(true);
        expect(message?.getAttribute("style")).toContain("316px");
        expect(message?.querySelector('[data-testid="default-message-action"]')).not.toBeNull();
      } else {
        expect(wrapper.getComponent(CompanionBubble).props("position")).toEqual({ right: "calc(100vw - 402px)", bottom: "auto", top: "175px" });
        expect(wrapper.getComponent(CompanionBubble).props("actionText")).toBeTruthy();
      }
    } finally { wrapper.unmount(); }
  });

  it("opens about information in a dialog and closes it", async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultState()));
    const wrapper = mountApp();
    try {
      await flushPromises();
      wrapper.getComponent(SettingsMenu).vm.$emit("about");
      await wrapper.vm.$nextTick();
      const content = wrapper.get('[data-testid="about-content"]');
      expect(content.text()).toContain("MiniDesk");
      expect(content.get("a").attributes("href")).toBe("https://github.com/xiangjianan/mini-desk");
      expect(document.querySelector('[data-testid="default-message"]')).toBeNull();
      const modal = wrapper.findAllComponents(NModal).find((item) => item.props("title") === "关于");
      expect(modal).toBeDefined();
      modal!.vm.$emit("update:show", false);
      await wrapper.vm.$nextTick();
      expect(wrapper.find('[data-testid="about-content"]').exists()).toBe(false);
    } finally { wrapper.unmount(); }
  });

  it.each(["cat", "hermes", "ikun", "custom"] as const)("uses the companion bubble for about with %s", async (companionGifTheme) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...defaultState(), companionGifTheme }));
    const wrapper = mountApp();
    try {
      await flushPromises();
      wrapper.getComponent(SettingsMenu).vm.$emit("about");
      await wrapper.vm.$nextTick();
      expect(wrapper.find('[data-testid="about-content"]').exists()).toBe(false);
      const companion = wrapper.getComponent(CompanionBubble);
      expect(companion.props("visible")).toBe(true);
      expect(companion.props("message")).toContain("MiniDesk");
      expect(companion.props("linkHref")).toBe("https://github.com/xiangjianan/mini-desk");
    } finally { wrapper.unmount(); }
  });

  it("localizes the about dialog", async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...defaultState(), language: "en" }));
    const wrapper = mountApp();
    try {
      await flushPromises();
      wrapper.getComponent(SettingsMenu).vm.$emit("about");
      await wrapper.vm.$nextTick();
      expect(wrapper.get('[data-testid="about-content"]').text()).toContain("local-first");
    } finally { wrapper.unmount(); }
  });

  it("confirms a deletion through the shared dialog", async () => {
    const workspace = defaultWorkspace();
    workspace.todoLists = [
      { id: "work", title: "工作", collapsed: false, compact: false, column: 0 },
      { id: "home", title: "生活", collapsed: false, compact: false, column: 0 },
    ];
    workspace.todos = { work: [], home: [] };
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...defaultState(), workspaces: [workspace] }));
    const wrapper = mountApp();
    try {
      await flushPromises();
      wrapper.getComponent(TodoPanel).vm.$emit("deleteList", "work", wrapper.get(".todo-panel").element);
      await wrapper.vm.$nextTick();
      expect(wrapper.find('[data-testid="styled-confirm-accept"]').exists()).toBe(true);
      expect(wrapper.find('[data-testid="companion-bubble"]').exists()).toBe(false);
      await wrapper.get('[data-testid="styled-confirm-accept"]').trigger("click");
      expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!).workspaces[0].todoLists.map((list: { id: string }) => list.id)).toEqual(["home"]);
    } finally { wrapper.unmount(); }
  });

  it("removes decorative faces while preserving ordinary message text", () => {
    for (const faces of Object.values(KAOMOJI_BY_MOOD)) {
      for (const face of faces) expect(withoutKaomoji(`已保存 ${face}`)).toBe("已保存");
    }
    expect(withoutKaomoji("请求失败 (；′⌒`)\n请检查网络 (HTTP 500)")).toBe("请求失败\n请检查网络 (HTTP 500)");
  });

  it("keeps a confirmation open until answered and cancels safely", async () => {
    vi.useFakeTimers();
    try {
      const confirmed = vi.fn();
      const cancelled = vi.fn();
      const deps: CompanionBubbleDeps = {
        state: { language: "zh", companionGifTheme: "none" } as CompanionBubbleDeps["state"],
        setActiveGuideKey: vi.fn(), confirmLabels: () => ({ yes: "是", no: "否" }),
        isBoardBlocked: () => false, isMobileLayout: () => false,
      };
      const feedback = useCompanionBubble(deps);
      feedback.requestConfirmation("confirmDeleteTodo", undefined, confirmed, cancelled);
      await vi.advanceTimersByTimeAsync(15000);
      expect(feedback.pendingConfirm.value).not.toBeNull();
      feedback.cancelCompanionAction();
      expect(confirmed).not.toHaveBeenCalled();
      expect(cancelled).toHaveBeenCalledOnce();
      feedback.clearTimers();
    } finally { vi.useRealTimers(); }
  });
});
