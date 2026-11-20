import { shallowRef } from "vue";
import { setLastPointerPosition } from "./pointerPosition";

/** The active internal drag owns its delete action; external drags never register here. */
export const dragDelete = shallowRef<{ remove: () => void; over: boolean } | null>(null);

export function beginDragDelete(remove: () => void): void {
  dragDelete.value = { remove, over: false };
}

function containsPoint(x: number, y: number): boolean {
  const zone = document.querySelector<HTMLElement>("[data-drag-delete-zone]");
  if (!zone) return false;
  const rect = zone.getBoundingClientRect();
  return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
}

export function updateDragDelete(x: number, y: number): void {
  if (!dragDelete.value) return;
  const over = containsPoint(x, y);
  if (over !== dragDelete.value.over) dragDelete.value = { ...dragDelete.value, over };
}

export function finishDragDelete(x: number, y: number, defer = false): boolean {
  const current = dragDelete.value;
  const accepted = Boolean(current && containsPoint(x, y));
  dragDelete.value = null;
  if (accepted) {
    setLastPointerPosition(x, y);
    if (defer) window.setTimeout(current!.remove, 0);
    else current!.remove();
  }
  return accepted;
}

export function cancelDragDelete(): void {
  dragDelete.value = null;
}
