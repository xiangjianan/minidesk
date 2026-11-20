import { nextTick } from "vue";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { defaultState, defaultWorkspace, STORAGE_KEY } from "../state/defaults";
import { mountApp } from "./helpers/mount-app";

// These legacy interaction tests exercise the animated companion explicitly.
// Default-theme behavior is covered by default-feedback.test.ts.
vi.mock("../state/companionGifThemes", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../state/companionGifThemes")>();
  return {
    ...actual,
    DEFAULT_COMPANION_GIF_THEME: "cat",
    normalizeCompanionGifTheme: (value: unknown) => value === undefined ? "cat" : actual.normalizeCompanionGifTheme(value),
  };
});

vi.mock("naive-ui", async () => {
  const { createNaiveUiStubModule } = await import("./helpers/naive-ui-mock");
  return createNaiveUiStubModule();
});

function seedTodos() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    ...defaultState(),
    workspaces: [{
      ...defaultWorkspace(),
      todoLists: [{ id: "work", title: "工作", collapsed: false, compact: false }],
      todos: {
        work: [
          { id: "a", text: "A", done: false },
          { id: "b", text: "B", done: false },
          { id: "c", text: "C", done: false },
          { id: "d", text: "D", done: false },
        ],
      },
      showCompletedTodos: { work: false },
    }],
  }));
}

/** Right-click the first remaining todo and pick the 删除 menu option. */
async function deleteViaMenu(wrapper: ReturnType<typeof mountApp>) {
  const item = wrapper.findAll(".todo-item[data-todo-id]")[0];
  await item.trigger("contextmenu");
  await nextTick();
  const option = wrapper.findAll(".dropdown-option").find((o) => o.text() === "删除");
  await option?.trigger("click");
  await vi.advanceTimersByTimeAsync(200);
  await nextTick();
}

function remainingTodos(wrapper: ReturnType<typeof mountApp>): number {
  return wrapper.findAll(".todo-item[data-todo-id]").length;
}

function confirmButtonsVisible(wrapper: ReturnType<typeof mountApp>): boolean {
  return wrapper.find('[data-testid="companion-yes"]').exists();
}

describe("todo delete confirmation", () => {
  beforeEach(() => {
    localStorage.clear();
    seedTodos();
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
    document.body.innerHTML = "";
    localStorage.clear();
  });

  it("deletes immediately and supports undo", async () => {
    const wrapper = mountApp();
    try {
      await deleteViaMenu(wrapper);
      expect(confirmButtonsVisible(wrapper)).toBe(false);
      expect(remainingTodos(wrapper)).toBe(3);
      await wrapper.get('[data-testid="companion-action"]').trigger("click");
      expect(wrapper.findAll(".todo-item[data-todo-id]").map(item => item.attributes("data-todo-id"))).toEqual(["a", "b", "c", "d"]);
    } finally { wrapper.unmount(); }
  });
});
