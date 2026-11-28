/** Share one idle timer policy across native and Naive UI desk scroll surfaces. */
export const SCROLLBAR_IDLE_MS = 800;

/** Hit padding around Naive UI rails so hovering the scrollbar gutter reveals the rail cleanly. */
const VERTICAL_RAIL_HIT_PAD = 4;
const HORIZONTAL_RAIL_BOTTOM_PAD = 4;
/** Minimum right/bottom edge strip for native scrollbars (covers 4px custom & 0px overlay bars). */
const NATIVE_SCROLLBAR_HIT_PX = 8;

function isPointerOnNaiveRail(scrollbar: HTMLElement, clientX: number, clientY: number): boolean {
  for (const child of scrollbar.children) {
    if (!(child instanceof HTMLElement)) continue;
    if (!child.classList.contains("n-scrollbar-rail")) continue;
    if (child.classList.contains("n-scrollbar-rail--disabled")) continue;
    if (!child.querySelector(".n-scrollbar-rail__scrollbar")) continue;
    const rect = child.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) continue;
    if (child.classList.contains("n-scrollbar-rail--horizontal")) {
      if (
        clientX >= rect.left &&
        clientX <= rect.right &&
        clientY >= rect.top &&
        clientY <= rect.bottom + HORIZONTAL_RAIL_BOTTOM_PAD
      ) {
        return true;
      }
      continue;
    }
    if (
      clientX >= rect.left - VERTICAL_RAIL_HIT_PAD &&
      clientX <= rect.right + VERTICAL_RAIL_HIT_PAD &&
      clientY >= rect.top &&
      clientY <= rect.bottom
    ) {
      return true;
    }
  }
  return false;
}

function isPointerOnNativeScrollbar(el: HTMLElement, clientX: number, clientY: number): boolean {
  if (el.classList.contains("n-scrollbar-container") || el.classList.contains("text-mirror")) return false;
  const hasVerticalOverflow = el.scrollHeight > el.clientHeight;
  const hasHorizontalOverflow = el.scrollWidth > el.clientWidth;
  if (!hasVerticalOverflow && !hasHorizontalOverflow) return false;
  const rect = el.getBoundingClientRect();
  if (rect.width <= 0 || rect.height <= 0) return false;
  if (clientX < rect.left || clientX > rect.right || clientY < rect.top || clientY > rect.bottom) return false;

  if (hasVerticalOverflow) {
    const nativeWidth = Math.max(0, el.offsetWidth - el.clientLeft * 2 - el.clientWidth);
    const hitWidth = Math.max(nativeWidth, NATIVE_SCROLLBAR_HIT_PX);
    if (clientX >= rect.right - hitWidth) {
      const overflowY = getComputedStyle(el).overflowY;
      if (el instanceof HTMLTextAreaElement || overflowY === "auto" || overflowY === "scroll") return true;
    }
  }
  if (hasHorizontalOverflow) {
    const nativeHeight = Math.max(0, el.offsetHeight - el.clientTop * 2 - el.clientHeight);
    const hitHeight = Math.max(nativeHeight, NATIVE_SCROLLBAR_HIT_PX);
    if (clientY >= rect.bottom - hitHeight) {
      const overflowX = getComputedStyle(el).overflowX;
      if (el instanceof HTMLTextAreaElement || overflowX === "auto" || overflowX === "scroll") return true;
    }
  }
  return false;
}

function findHoveredScrollbarSurface(target: EventTarget | null, clientX: number, clientY: number): HTMLElement | null {
  if (!(target instanceof HTMLElement)) return null;
  const zone = target.closest<HTMLElement>(".workbench-zone");
  if (!zone) return null;

  const directRail = target.closest<HTMLElement>(".n-scrollbar-rail");
  if (directRail && !directRail.classList.contains("n-scrollbar-rail--disabled")) {
    return directRail.closest<HTMLElement>(".n-scrollbar");
  }

  let current: HTMLElement | null = target;
  while (current && current !== zone) {
    if (current.classList.contains("n-scrollbar")) {
      if (isPointerOnNaiveRail(current, clientX, clientY)) return current;
    } else if (isPointerOnNativeScrollbar(current, clientX, clientY)) {
      return current;
    }
    current = current.parentElement;
  }
  return null;
}

export function installScrollActivity(root: HTMLElement): () => void {
  const timers = new Map<HTMLElement, ReturnType<typeof setTimeout>>();
  let hoveredSurface: HTMLElement | null = null;

  function setHovered(next: HTMLElement | null): void {
    if (hoveredSurface === next) return;
    hoveredSurface?.classList.remove("is-scrollbar-hovered");
    hoveredSurface = next;
    hoveredSurface?.classList.add("is-scrollbar-hovered");
  }

  function show(surface: HTMLElement): void {
    const previous = timers.get(surface);
    if (previous !== undefined) clearTimeout(previous);
    surface.classList.add("is-scrolling");
    timers.set(surface, setTimeout(() => {
      surface.classList.remove("is-scrolling");
      timers.delete(surface);
    }, SCROLLBAR_IDLE_MS));
  }

  function onScroll(event: Event): void {
    const target = event.target;
    if (!(target instanceof HTMLElement) || !target.closest(".workbench-zone")) return;
    // The text mirror follows the textarea; it is not an independent scroll surface.
    if (target.classList.contains("text-mirror")) return;
    show(target);
    const scrollbar = target.closest<HTMLElement>(".n-scrollbar");
    if (scrollbar && scrollbar !== target) show(scrollbar);
  }

  function onPointerMove(event: PointerEvent): void {
    if (event.pointerType === "touch") return;
    setHovered(findHoveredScrollbarSurface(event.target, event.clientX, event.clientY));
  }

  function onPointerLeave(): void {
    setHovered(null);
  }

  // Scroll does not bubble. Capture also covers dynamically mounted lists and tabs.
  root.addEventListener("scroll", onScroll, { capture: true, passive: true });
  root.addEventListener("pointermove", onPointerMove, { passive: true });
  root.addEventListener("pointerleave", onPointerLeave, { passive: true });
  return () => {
    root.removeEventListener("scroll", onScroll, true);
    root.removeEventListener("pointermove", onPointerMove);
    root.removeEventListener("pointerleave", onPointerLeave);
    setHovered(null);
    for (const [surface, timer] of timers) {
      clearTimeout(timer);
      surface.classList.remove("is-scrolling");
    }
    timers.clear();
  };
}
