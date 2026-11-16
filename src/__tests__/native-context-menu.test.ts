import { describe, expect, it, vi } from "vitest";
import { preventNativeContextMenu } from "../utils/contextMenu";

describe("native context menu suppression", () => {
  it("prevents the browser menu while allowing custom handlers to run, including inside menus", () => {
    const container = document.createElement("div");
    const menuItem = document.createElement("button");
    container.append(menuItem);
    document.body.append(container);
    const customHandler = vi.fn((event: Event) => event.stopPropagation());
    menuItem.addEventListener("contextmenu", customHandler);
    document.addEventListener("contextmenu", preventNativeContextMenu, true);
    try {
      for (const target of [container, menuItem, document.body]) {
        const event = new MouseEvent("contextmenu", { bubbles: true, cancelable: true });
        target.dispatchEvent(event);
        expect(event.defaultPrevented).toBe(true);
      }
      expect(customHandler).toHaveBeenCalledOnce();
    } finally {
      document.removeEventListener("contextmenu", preventNativeContextMenu, true);
      container.remove();
    }
  });

  it("allows selected text to use the browser menu without opening an ancestor menu", () => {
    const container = document.createElement("div");
    const input = document.createElement("input");
    input.value = "selected text";
    container.append(input);
    document.body.append(container);
    input.setSelectionRange(0, 8);
    const customHandler = vi.fn();
    container.addEventListener("contextmenu", customHandler);
    document.addEventListener("contextmenu", preventNativeContextMenu, true);
    try {
      const event = new MouseEvent("contextmenu", { bubbles: true, cancelable: true });
      input.dispatchEvent(event);
      expect(event.defaultPrevented).toBe(false);
      expect(customHandler).not.toHaveBeenCalled();
      input.className = "todo-input";
      const todoEvent = new MouseEvent("contextmenu", { bubbles: true, cancelable: true });
      input.dispatchEvent(todoEvent);
      expect(todoEvent.defaultPrevented).toBe(true);
      expect(customHandler).toHaveBeenCalledOnce();
    } finally {
      document.removeEventListener("contextmenu", preventNativeContextMenu, true);
      container.remove();
    }
  });

  it("allows selected ordinary page text while keeping notebook menus custom", () => {
    const container = document.createElement("div");
    container.innerHTML = '<span>some selected text</span><div class="text-editor-frame"><textarea>note</textarea></div>';
    document.body.append(container);
    const span = container.querySelector("span")!;
    const selection = window.getSelection()!;
    const range = document.createRange();
    range.selectNodeContents(span);
    selection.removeAllRanges();
    selection.addRange(range);
    document.addEventListener("contextmenu", preventNativeContextMenu, true);
    try {
      const event = new MouseEvent("contextmenu", { bubbles: true, cancelable: true });
      span.dispatchEvent(event);
      expect(event.defaultPrevented).toBe(false);
      const textarea = container.querySelector("textarea")!;
      textarea.setSelectionRange(0, 4);
      const notebookEvent = new MouseEvent("contextmenu", { bubbles: true, cancelable: true });
      textarea.dispatchEvent(notebookEvent);
      expect(notebookEvent.defaultPrevented).toBe(true);
    } finally {
      document.removeEventListener("contextmenu", preventNativeContextMenu, true);
      selection.removeAllRanges();
      container.remove();
    }
  });

});
