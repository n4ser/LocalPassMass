/* Local-only diagnostics. Stores only coarse error codes and component names in session storage. */
const LPM_DIAG = (() => {
  const KEY = 'lpDiagnosticsV1';
  const LIMIT = 30;
  const EXPECTED = new Set([
    'LOCKED','BAD_PASSWORD','PENDING_MISSING','CREDENTIAL_MISSING','CREDENTIAL_NOT_ALLOWED',
    'HTTP_FILL_DISABLED','SITE_PERMISSION_REQUIRED','BRIDGE_PERMISSION_REQUIRED','BRIDGE_UNAVAILABLE',
    'SHARED_VAULT_MISSING','SHARED_VAULT_INVALID','DEVICE_SECRET_MISSING','VAULT_CONFLICT',
    'UNTRUSTED_PAGE_MESSAGE','UNTRUSTED_EXTENSION_MESSAGE'
  ]);
  function codeOf(error) {
    const raw = String(error?.message || error || 'UNKNOWN_ERROR').trim();
    // Persist only app-style symbolic error codes. Browser/native exception
    // messages can accidentally contain paths or page data, so collapse them.
    return /^[A-Z][A-Z0-9_]{1,95}$/.test(raw) ? raw : 'UNEXPECTED_ERROR';
  }
  async function record(component, error, { includeExpected = false } = {}) {
    const code = codeOf(error);
    if (!includeExpected && EXPECTED.has(code)) return;
    try {
      const stored = await chrome.storage.session.get(KEY);
      const list = Array.isArray(stored[KEY]) ? stored[KEY] : [];
      list.unshift({ at: Date.now(), component: String(component || 'unknown').slice(0, 64), code });
      await chrome.storage.session.set({ [KEY]: list.slice(0, LIMIT) });
    } catch (_) {}
    try { console.warn(`[LocalPassMass] ${component}: ${code}`); } catch (_) {}
  }
  async function list() {
    try { const stored = await chrome.storage.session.get(KEY); return Array.isArray(stored[KEY]) ? stored[KEY] : []; }
    catch (_) { return []; }
  }
  async function clear() { try { await chrome.storage.session.remove(KEY); } catch (_) {} return true; }
  return { record, list, clear, codeOf };
})();
