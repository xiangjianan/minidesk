import { beforeEach, describe, expect, it, vi } from "vitest";
import { flushPromises } from "@vue/test-utils";
import { mountApp } from "./helpers/mount-app";
import TodoPanel from "../components/TodoPanel.vue";
import { defaultState, defaultWorkspace, STORAGE_KEY } from "../state/defaults";
import { useCompanionBubble, type CompanionBubbleDeps } from "../composables/useCompanionBubble";

vi.mock("naive-ui", async () => {
  const { createNaiveUiStubModule } = await import("./helpers/naive-ui-mock");
  return createNaiveUiStubModule();
});

beforeEach(() => { localStorage.clear(); });

describe("default theme feedback", () => {
  it("shows save feedback at the top without a companion", async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultState()));
    const wrapper = mountApp();
    try {
      await flushPromises();
      await vi.dynamicImportSettled();
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "s", ctrlKey: true, bubbles: true }));
      await flushPromises();
      expect(wrapper.find('[data-testid="default-message"]').exists()).toBe(true);
      expect(wrapper.find('[data-testid="companion-bubble"]').exists()).toBe(false);
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
