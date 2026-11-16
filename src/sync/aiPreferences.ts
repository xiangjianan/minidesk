const ENABLED_KEY = "mini-desk-ai-enabled";
const DISCLOSURE_KEY = "mini-desk-ai-disclosure-seen";

export function loadAiEnabled(): boolean {
  try { return localStorage.getItem(ENABLED_KEY) !== "false"; } catch { return true; }
}
export function saveAiEnabled(enabled: boolean): void {
  try { localStorage.setItem(ENABLED_KEY, String(enabled)); } catch { /* session preference remains active */ }
}
export function confirmAiDisclosure(message: string): boolean {
  try { if (localStorage.getItem(DISCLOSURE_KEY) === "true") return true; } catch { /* ask again if storage is unavailable */ }
  if (!window.confirm(message)) return false;
  try { localStorage.setItem(DISCLOSURE_KEY, "true"); } catch { /* ask again next time */ }
  return true;
}
