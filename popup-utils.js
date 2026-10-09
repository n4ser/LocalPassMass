/* LocalPassMass popup-only pure helpers. */
const LPM_POPUP_UTILS = (() => {
  function shareUrl(value) {
    const raw = String(value || '').trim();
    if (!raw) return '';
    try {
      const url = new URL(raw.includes('://') ? raw : `https://${raw}`);
      // Keep paths/query strings intact, but present a bare origin without the
      // cosmetic trailing slash added by URL.href.
      if (url.pathname === '/' && !url.search && !url.hash) return url.origin;
      return url.href;
    } catch {
      return raw;
    }
  }

  function shareEntryText(entry = {}) {
    return `${shareUrl(entry.url)}\nuser: ${String(entry.username || '')}\npass: ${String(entry.password || '')}\n\nby LocalPassMass`;
  }

  return { shareUrl, shareEntryText };
})();
