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

  it("allows the native menu in dialog fields while still suppressing it elsewhere", () => {
    const dialog = document.createElement("div");
    dialog.className = "n-modal";
    dialog.innerHTML = "<input><textarea></textarea><div contenteditable='true'></div><button>Save</button>";
    const outsideInput = document.createElement("input");
    document.body.append(dialog, outsideInput);
    const dialogHandler = vi.fn((event: Event) => event.preventDefault());
    dialog.addEventListener("contextmenu", dialogHandler);
    document.addEventListener("contextmenu", preventNativeContextMenu, true);
    try {
      for (const target of dialog.querySelectorAll("input, textarea, [contenteditable]")) {
        const event = new MouseEvent("contextmenu", { bubbles: true, cancelable: true });
        target.dispatchEvent(event);
        expect(event.defaultPrevented).toBe(false);
      }
      expect(dialogHandler).not.toHaveBeenCalled();
      for (const target of [dialog.querySelector("button")!, outsideInput]) {
        const event = new MouseEvent("contextmenu", { bubbles: true, cancelable: true });
        target.dispatchEvent(event);
        expect(event.defaultPrevented).toBe(true);
      }
    } finally {
      document.removeEventListener("contextmenu", preventNativeContextMenu, true);
      dialog.remove();
      outsideInput.remove();
    }
  });
});
