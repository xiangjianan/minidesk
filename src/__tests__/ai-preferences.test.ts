import { beforeEach, describe, expect, it, vi } from "vitest";
import { confirmAiDisclosure, loadAiEnabled, saveAiEnabled } from "../sync/aiPreferences";

describe("AI preferences", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("persists the AI switch", () => {
    expect(loadAiEnabled()).toBe(true);
    saveAiEnabled(false);
    expect(loadAiEnabled()).toBe(false);
    saveAiEnabled(true);
    expect(loadAiEnabled()).toBe(true);
  });

  it("asks again after cancellation and remembers acceptance", () => {
    const confirm = vi.spyOn(window, "confirm").mockReturnValueOnce(false).mockReturnValue(true);
    expect(confirmAiDisclosure("notice")).toBe(false);
    expect(confirmAiDisclosure("notice")).toBe(true);
    expect(confirmAiDisclosure("notice")).toBe(true);
    expect(confirm).toHaveBeenCalledTimes(2);
  });
});
