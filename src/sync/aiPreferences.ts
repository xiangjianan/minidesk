const ENABLED_KEY = "mini-desk-ai-enabled";
const DISCLOSURE_KEY = "mini-desk-ai-disclosure-seen";
const DESKTOP_CONSENT_KEY = "mini-desk-ai-privacy-consent";

export function loadAiPrivacyConsent(): boolean {
  try { return localStorage.getItem(DESKTOP_CONSENT_KEY) === "true"; } catch { return false; }
}
export function saveAiPrivacyConsent(): void {
  try { localStorage.setItem(DESKTOP_CONSENT_KEY, "true"); } catch { /* consent remains active for this session */ }
}

export function loadAiEnabled(): boolean {
  try { return localStorage.getItem(ENABLED_KEY) === "true"; } catch { return false; }
}
export function saveAiEnabled(enabled: boolean): void {
  try { localStorage.setItem(ENABLED_KEY, String(enabled)); } catch { /* session preference remains active */ }
}
export async function confirmAiDisclosure(requestConfirmation: () => Promise<boolean>): Promise<boolean> {
  try { if (localStorage.getItem(DISCLOSURE_KEY) === "true") return true; } catch { /* ask again if storage is unavailable */ }
  if (!await requestConfirmation()) return false;
  try { localStorage.setItem(DISCLOSURE_KEY, "true"); } catch { /* ask again next time */ }
  return true;
}
