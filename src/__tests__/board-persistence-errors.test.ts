import { afterEach, describe, expect, it, vi } from "vitest";
import { useBoardPersistence } from "../composables/useBoardPersistence";
import { defaultState } from "../state/defaults";

describe("board persistence failures", () => {
  afterEach(() => vi.restoreAllMocks());

  it("keeps edits dirty when browser storage rejects a write and permits a retry", () => {
    const onSaveError = vi.fn();
    const persistence = useBoardPersistence({
      state: defaultState(), clientId: "test", onBeforeSave: vi.fn(),
      onConflict: vi.fn(), onSaveError, onMerged: vi.fn(), onSaved: vi.fn(),
      scheduleImagePayloadPrune: vi.fn(), showSaveBubble: vi.fn(),
    });
    persistence.bumpTextGeneration();
    const failure = new DOMException("Storage full", "QuotaExceededError");
    const write = vi.spyOn(Storage.prototype, "setItem").mockImplementationOnce(() => { throw failure; });

    expect(persistence.persistNow()).toBe(false);
    expect(onSaveError).toHaveBeenCalledWith(failure);
    expect(persistence.saveStatus.value).toBe("dirty");
    expect(persistence.hasPendingEdits()).toBe(true);

    write.mockRestore();
    expect(persistence.persistNow()).toBe(true);
    expect(persistence.hasPendingEdits()).toBe(false);
    persistence.clearTimers();
  });
});
