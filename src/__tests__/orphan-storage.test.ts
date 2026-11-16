import { afterEach, describe, expect, it, vi } from "vitest";
import { orphanedImagePayloads } from "../state/images";

describe("orphaned image cleanup", () => {
  afterEach(() => vi.unstubAllGlobals());
  it("removes only old unreferenced records while protecting GIFs and recent writes", async () => {
    const records: Record<string, { id: string; imageId?: string; createdAt?: number; src: string }[]> = {};
    const deleted: string[] = [];
    vi.stubGlobal("indexedDB", {
      open(name: string) {
        const request: any = {};
        records[name] ??= name.includes("todo-board") ? [] : [
          { id: "live-version", imageId: "live", createdAt: 1, src: "a" },
          { id: "old", imageId: "gone", createdAt: 1, src: "abc" },
          { id: "new", imageId: "new", createdAt: Date.now(), src: "a" },
          { id: "__custom-companion-gif-light__", src: "gif" },
        ];
        request.result = {
          close() {},
          transaction() {
            const tx: any = { objectStore() { return { openCursor() {
              const cursorRequest: any = {};
              let index = 0;
              const next = () => queueMicrotask(() => {
                const record = records[name][index++];
                cursorRequest.result = record ? { value: record, delete: () => deleted.push(record.id), continue: next } : null;
                cursorRequest.onsuccess?.();
                if (!record) queueMicrotask(() => tx.oncomplete?.());
              });
              next();
              return cursorRequest;
            } }; } };
            return tx;
          },
        };
        queueMicrotask(() => request.onsuccess?.());
        return request;
      },
    });
    expect(await orphanedImagePayloads(["live"], true)).toEqual({ count: 1, bytes: 3 });
    expect(deleted).toEqual(["old"]);
  });
});
