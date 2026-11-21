import { beforeEach, describe, expect, it, vi } from "vitest";
import { confirmAiDisclosure, loadAiEnabled, loadAiPrivacyConsent, saveAiEnabled, saveAiPrivacyConsent } from "../sync/aiPreferences";

describe("AI preferences", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("persists the AI switch", () => {
    expect(loadAiEnabled()).toBe(false);
    saveAiEnabled(false);
    expect(loadAiEnabled()).toBe(false);
    saveAiEnabled(true);
    expect(loadAiEnabled()).toBe(true);
  });

  it("asks again after cancellation and remembers acceptance", async () => {
    const confirm = vi.fn().mockResolvedValueOnce(false).mockResolvedValue(true);
    expect(await confirmAiDisclosure(confirm)).toBe(false);
    expect(await confirmAiDisclosure(confirm)).toBe(true);
    expect(await confirmAiDisclosure(confirm)).toBe(true);
    expect(confirm).toHaveBeenCalledTimes(2);
  });

  it("records desktop privacy consent separately from the older mobile notice", () => {
    localStorage.setItem("mini-desk-ai-disclosure-seen", "true");
    expect(loadAiPrivacyConsent()).toBe(false);
    saveAiPrivacyConsent();
    expect(loadAiPrivacyConsent()).toBe(true);
  });
});
