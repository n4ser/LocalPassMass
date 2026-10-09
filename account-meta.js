/* LocalPassMass account metadata helpers. Pure/local; no network access. */
(() => {
  if (globalThis.LPM_ACCOUNT_META) return;

  const GENERIC_TITLES = /^(?:login|log in|sign in|signin|account|home|welcome|ورود|حساب|صفحه\s*ورود|خوش\s*آمدید?)$/i;
  const COMMON_2LD = new Set(['co','com','net','org','gov','ac','edu']);

  function safeUrl(value) {
    const raw = String(value || '').trim();
    if (!raw) return '';
    try {
      const u = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
      if (!['http:','https:'].includes(u.protocol) || !u.hostname) return '';
      // Credentials are domain-oriented. Drop query/hash so auth/session tokens are
      // never persisted simply because the popup was opened on a callback URL.
      const path = u.pathname && u.pathname !== '/' ? u.pathname.replace(/\/{2,}/g, '/').slice(0, 512) : '';
      return `${u.origin}${path}`;
    } catch { return ''; }
  }

  function hostFrom(value) {
    try { return new URL(/^https?:\/\//i.test(String(value||'')) ? String(value) : `https://${String(value||'')}`).hostname.toLowerCase().replace(/^www\./,''); }
    catch { return String(value||'').trim().toLowerCase().replace(/^www\./,'').split('/')[0]; }
  }

  function siteLabel(value) {
    const host = hostFrom(value);
    if (!host) return '';
    if (host === 'localhost' || host.includes(':') || /^\d{1,3}(?:\.\d{1,3}){3}$/.test(host)) return host;
    const labels = host.split('.').filter(Boolean);
    if (labels.length === 1) return labels[0];
    let idx = labels.length - 2;
    const tld = labels.at(-1) || '';
    const second = labels.at(-2) || '';
    if (tld.length === 2 && COMMON_2LD.has(second) && labels.length >= 3) idx = labels.length - 3;
    return labels[idx] || second || host;
  }

  function titleFragment(pageTitle) {
    const source = String(pageTitle || '').replace(/\s+/g,' ').trim();
    if (!source) return '';
    const chunks = source.split(/\s*[|•·–—]\s*|\s+-\s+/).map(x=>x.trim()).filter(Boolean);
    let piece = chunks.find(x => !GENERIC_TITLES.test(x)) || chunks[0] || source;
    piece = piece.replace(/\s+/g,' ').trim().slice(0, 42).trim();
    return GENERIC_TITLES.test(piece) ? '' : piece;
  }

  function capitalizeAscii(value) {
    const text = String(value || '');
    return text ? text[0].toUpperCase() + text.slice(1) : '';
  }

  function makeTitle(pageTitle, urlOrHost) {
    const fragment = titleFragment(pageTitle);
    const label = siteLabel(urlOrHost);
    if (!fragment) return capitalizeAscii(label) || hostFrom(urlOrHost) || 'Account';
    if (!label || fragment.toLowerCase().includes(label.toLowerCase())) return fragment;
    return `${fragment} ${label}`.slice(0, 70).trim();
  }

  function normalizeTags(value) {
    const raw = Array.isArray(value) ? value : String(value || '').split(/[,;،\n]+/);
    const out=[]; const seen=new Set();
    for (const item of raw) {
      const tag=String(item||'').replace(/\s+/g,' ').trim().replace(/^#+/,'').slice(0,40);
      if (!tag) continue;
      const key=tag.toLocaleLowerCase();
      if (seen.has(key)) continue;
      seen.add(key); out.push(tag);
      if (out.length >= 20) break;
    }
    return out;
  }

  function tagsText(value) { return normalizeTags(value).join(', '); }

  globalThis.LPM_ACCOUNT_META = Object.freeze({ safeUrl, hostFrom, siteLabel, makeTitle, normalizeTags, tagsText });
})();
