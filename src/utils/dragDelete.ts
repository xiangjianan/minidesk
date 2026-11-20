import { shallowRef } from "vue";
import { setLastPointerPosition } from "./pointerPosition";

/** The active internal drag owns its delete action; external drags never register here. */
export const dragDelete = shallowRef<{ remove: () => void; over: boolean; expanded: boolean } | null>(null);

export function beginDragDelete(remove: () => void): void {
  dragDelete.value = { remove, over: false, expanded: false };
}

function containsPoint(x: number, y: number): boolean {
  const zone = document.querySelector<HTMLElement>("[data-drag-delete-zone]");
  if (!zone) return false;
  const rect = zone.getBoundingClientRect();
  const bottom = window.innerHeight;
  if (!rect.width || !rect.height || y < bottom - rect.height || y > bottom) return false;
  const horizontal = (x - (rect.left + rect.width / 2)) / (rect.width / 2);
  const vertical = (bottom - y) / rect.height;
  return horizontal * horizontal + vertical * vertical <= 1;
}

export function updateDragDelete(x: number, y: number): void {
  if (!dragDelete.value) return;
  const expanded = dragDelete.value.expanded
    ? y >= window.innerHeight - 160 && y <= window.innerHeight
    : y >= window.innerHeight - 18 && y <= window.innerHeight;
  const over = expanded && containsPoint(x, y);
  if (expanded !== dragDelete.value.expanded || over !== dragDelete.value.over) {
    dragDelete.value = { ...dragDelete.value, expanded, over };
  }
}

export function finishDragDelete(x: number, y: number, defer = false): boolean {
  const current = dragDelete.value;
  const accepted = Boolean(current?.expanded && containsPoint(x, y));
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
