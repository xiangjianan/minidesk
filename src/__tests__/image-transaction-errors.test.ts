import { afterEach, expect, it, vi } from "vitest";
import { storeImagePayload } from "../state/images";

afterEach(() => vi.unstubAllGlobals());

it("reports a quota failure when the transaction aborts after the request succeeds", async () => {
  const failure = new DOMException("Storage full", "QuotaExceededError");
  const request = { result: "image", error: null, onsuccess: null, onerror: null };
  const transaction = {
    error: failure,
    oncomplete: null as (() => void) | null,
    onerror: null as (() => void) | null,
    onabort: null as (() => void) | null,
    objectStore: () => ({ put: () => request }),
  };
  const db = { transaction: () => transaction, close: vi.fn() };
  const openRequest = { result: db, error: null, onsuccess: null as (() => void) | null, onerror: null, onupgradeneeded: null };
  vi.stubGlobal("indexedDB", { open: () => { queueMicrotask(() => openRequest.onsuccess?.()); return openRequest; } });

  const saving = storeImagePayload({ id: "image", src: "data:image/png;base64,AA==", createdAt: 1 });
  await Promise.resolve();
  await Promise.resolve();
  transaction.onabort?.();
  await expect(saving).rejects.toBe(failure);
  expect(db.close).toHaveBeenCalled();
});
