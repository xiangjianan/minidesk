import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { installScrollActivity, SCROLLBAR_IDLE_MS } from "../utils/scrollActivity";

const disposers: (() => void)[] = [];
afterEach(() => {
  disposers.splice(0).forEach((dispose) => dispose());
  document.body.innerHTML = "";
  vi.useRealTimers();
});

function setup() {
  vi.useFakeTimers();
  const root = document.createElement("div");
  root.innerHTML = `<section class="workbench-zone">
    <div class="n-scrollbar">
      <div class="n-scrollbar-container"><div class="n-scrollbar-content"></div></div>
      <div class="n-scrollbar-rail n-scrollbar-rail--vertical"><div class="n-scrollbar-rail__scrollbar"></div></div>
    </div>
    <div class="todo-column" style="overflow-y: auto"></div><textarea class="text-editor-textarea"></textarea>
    <div class="text-mirror"></div>
  </section><div class="outside"></div>`;
  document.body.append(root);
  const dispose = installScrollActivity(root);
  disposers.push(dispose);
  return { root, dispose };
}

function scroll(target: Element) { target.dispatchEvent(new Event("scroll")); }

function pointerMove(target: Element, clientX: number, clientY: number, pointerType = "mouse") {
  const event = new MouseEvent("pointermove", { bubbles: true, clientX, clientY });
  Object.defineProperty(event, "pointerType", { value: pointerType });
  target.dispatchEvent(event);
}

function setRect(el: Element, rect: Partial<DOMRect>) {
  const full: DOMRect = {
    x: rect.left ?? 0,
    y: rect.top ?? 0,
    left: rect.left ?? 0,
    top: rect.top ?? 0,
    right: rect.right ?? 0,
    bottom: rect.bottom ?? 0,
    width: rect.width ?? ((rect.right ?? 0) - (rect.left ?? 0)),
    height: rect.height ?? ((rect.bottom ?? 0) - (rect.top ?? 0)),
    toJSON: () => ({}),
  };
  vi.spyOn(el, "getBoundingClientRect").mockReturnValue(full);
}

function setOverflow(el: HTMLElement, dims: { clientHeight: number; scrollHeight: number; clientWidth?: number; scrollWidth?: number; offsetWidth?: number }) {
  Object.defineProperty(el, "clientHeight", { configurable: true, value: dims.clientHeight });
  Object.defineProperty(el, "scrollHeight", { configurable: true, value: dims.scrollHeight });
  if (dims.clientWidth !== undefined) Object.defineProperty(el, "clientWidth", { configurable: true, value: dims.clientWidth });
  if (dims.scrollWidth !== undefined) Object.defineProperty(el, "scrollWidth", { configurable: true, value: dims.scrollWidth });
  if (dims.offsetWidth !== undefined) Object.defineProperty(el, "offsetWidth", { configurable: true, value: dims.offsetWidth });
}

describe("desk scrollbar activity", () => {
  it("captures native scrolls and keeps the Naive UI rail visible until scrolling stops", () => {
    const { root } = setup();
    const container = root.querySelector(".n-scrollbar-container")!;
    const wrapper = root.querySelector(".n-scrollbar")!;
    expect(wrapper.classList.contains("is-scrolling")).toBe(false);
    scroll(container);
    expect(wrapper.classList.contains("is-scrolling")).toBe(true);
    vi.advanceTimersByTime(SCROLLBAR_IDLE_MS - 1);
    scroll(container);
    vi.advanceTimersByTime(SCROLLBAR_IDLE_MS - 1);
    expect(wrapper.classList.contains("is-scrolling")).toBe(true);
    vi.advanceTimersByTime(1);
    expect(wrapper.classList.contains("is-scrolling")).toBe(false);
    expect(container.classList.contains("is-scrolling")).toBe(false);
  });

  it("tracks independent columns and newly mounted editors without showing on hover", () => {
    const { root } = setup();
    const column = root.querySelector(".todo-column")!;
    column.dispatchEvent(new MouseEvent("mouseenter"));
    expect(column.classList.contains("is-scrolling")).toBe(false);
    scroll(column);
    vi.advanceTimersByTime(400);
    const editor = document.createElement("textarea");
    root.querySelector(".workbench-zone")!.append(editor);
    scroll(editor);
    vi.advanceTimersByTime(400);
    expect(column.classList.contains("is-scrolling")).toBe(false);
    expect(editor.classList.contains("is-scrolling")).toBe(true);
    vi.advanceTimersByTime(400);
    expect(editor.classList.contains("is-scrolling")).toBe(false);
  });

  it("ignores mirror synchronization and scrolls outside the desk regions", () => {
    const { root } = setup();
    scroll(root.querySelector(".text-mirror")!);
    scroll(root.querySelector(".outside")!);
    expect(root.querySelector(".is-scrolling")).toBeNull();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("removes pending timers, active classes and the capture listener on unmount", () => {
    const { root, dispose } = setup();
    const column = root.querySelector(".todo-column")!;
    const thumb = root.querySelector(".n-scrollbar-rail__scrollbar")!;
    scroll(column);
    pointerMove(thumb, 194, 40);
    expect(root.querySelector(".n-scrollbar")!.classList.contains("is-scrollbar-hovered")).toBe(true);
    dispose();
    expect(vi.getTimerCount()).toBe(0);
    expect(root.querySelector(".is-scrolling")).toBeNull();
    expect(root.querySelector(".is-scrollbar-hovered")).toBeNull();
    scroll(column);
    pointerMove(thumb, 194, 40);
    expect(column.classList.contains("is-scrolling")).toBe(false);
    expect(root.querySelector(".n-scrollbar")!.classList.contains("is-scrollbar-hovered")).toBe(false);
  });

  it("reveals Naive UI scrollbars when hovering the thumb or rail gutter, but not inner content", () => {
    const { root } = setup();
    const wrapper = root.querySelector<HTMLElement>(".n-scrollbar")!;
    const content = root.querySelector<HTMLElement>(".n-scrollbar-content")!;
    const rail = root.querySelector<HTMLElement>(".n-scrollbar-rail")!;
    const thumb = root.querySelector<HTMLElement>(".n-scrollbar-rail__scrollbar")!;
    setRect(rail, { left: 192, right: 196, top: 2, bottom: 298 });

    // Hovering content far from the rail keeps the scrollbar hidden.
    pointerMove(content, 100, 120);
    expect(wrapper.classList.contains("is-scrollbar-hovered")).toBe(false);

    // Hovering the vertical rail gutter (even away from the thumb) reveals the scrollbar.
    pointerMove(content, 198, 220);
    expect(wrapper.classList.contains("is-scrollbar-hovered")).toBe(true);

    // Leaving the rail area hides it again.
    pointerMove(content, 120, 220);
    expect(wrapper.classList.contains("is-scrollbar-hovered")).toBe(false);

    // Hovering directly over the thumb reveals the scrollbar.
    pointerMove(thumb, 194, 40);
    expect(wrapper.classList.contains("is-scrollbar-hovered")).toBe(true);

    // Leaving the root container clears hover state.
    root.dispatchEvent(new MouseEvent("pointerleave"));
    expect(wrapper.classList.contains("is-scrollbar-hovered")).toBe(false);

    // Disabled rails (no overflow) do not activate on hover.
    rail.classList.add("n-scrollbar-rail--disabled");
    pointerMove(content, 194, 40);
    expect(wrapper.classList.contains("is-scrollbar-hovered")).toBe(false);
  });

  it("reveals native scrollbars when hovering the scrollbar edge of overflowing surfaces", () => {
    const { root } = setup();
    const column = root.querySelector<HTMLElement>(".todo-column")!;
    const editor = root.querySelector<HTMLElement>(".text-editor-textarea")!;
    setRect(column, { left: 0, right: 200, top: 0, bottom: 300 });
    setRect(editor, { left: 220, right: 500, top: 0, bottom: 300 });

    // Non-overflowing column never shows scrollbar on edge hover.
    setOverflow(column, { clientHeight: 300, scrollHeight: 300, clientWidth: 200, scrollWidth: 200, offsetWidth: 200 });
    pointerMove(column, 196, 100);
    expect(column.classList.contains("is-scrollbar-hovered")).toBe(false);

    // Overflowing column reveals on right scrollbar edge hover, not content hover.
    setOverflow(column, { clientHeight: 300, scrollHeight: 900, clientWidth: 196, scrollWidth: 196, offsetWidth: 200 });
    pointerMove(column, 120, 100);
    expect(column.classList.contains("is-scrollbar-hovered")).toBe(false);
    pointerMove(column, 195, 100);
    expect(column.classList.contains("is-scrollbar-hovered")).toBe(true);

    // Touch pointer moves do not leave a hovered scrollbar stuck.
    pointerMove(column, 120, 100);
    pointerMove(column, 195, 100, "touch");
    expect(column.classList.contains("is-scrollbar-hovered")).toBe(false);

    // Overflowing textarea reveals on right scrollbar edge hover.
    setOverflow(editor, { clientHeight: 300, scrollHeight: 800, clientWidth: 276, scrollWidth: 276, offsetWidth: 280 });
    pointerMove(editor, 496, 150);
    expect(editor.classList.contains("is-scrollbar-hovered")).toBe(true);
    expect(column.classList.contains("is-scrollbar-hovered")).toBe(false);
  });

  it("styles both Naive UI rails and native thumbs to appear on scrollbar hover", () => {
    const desk = readFileSync(resolve(__dirname, "../desk.css"), "utf8");
    expect(desk).toContain(".workbench-zone :is(.is-scrolling, .is-scrollbar-hovered) { --desk-scrollbar-alpha: 1; }");
    expect(desk).toContain(".workbench-zone *:hover::-webkit-scrollbar-thumb:hover");
    expect(desk).toContain(".workbench-zone .n-scrollbar:is(.is-scrolling, .is-scrollbar-hovered) > .n-scrollbar-rail");
    expect(desk).toContain(".workbench-zone .n-scrollbar > .n-scrollbar-rail:is(:hover, :active)");
  });
});
