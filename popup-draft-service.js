/* LocalPassMass popup draft persistence.
   Drafts live only in chrome.storage.session and are encrypted with the active vault key.
   They survive the action popup closing/reopening, but disappear when Chrome exits. */
const POPUP_DRAFT_KEY = 'lpPopupDraftV1';
const POPUP_DRAFT_AAD = 'LocalPassMass:popup-draft:v1';
const POPUP_DRAFT_MAX_AGE = 2 * 60 * 60 * 1000;
let popupDraftTail = Promise.resolve();

function queuePopupDraftWrite(task) {
  const run = popupDraftTail.then(task, task);
  popupDraftTail = run.catch(() => undefined);
  return run;
}

function sanitizePopupDraft(raw) {
  const src = raw && typeof raw === 'object' ? raw : {};
  const entry = src.entry && typeof src.entry === 'object' ? src.entry : null;
  const generator = src.generator && typeof src.generator === 'object' ? src.generator : null;
  const clean = {
    version: 1,
    savedAt: now(),
    activeTab: ['vault','generator','guide','settings'].includes(src.activeTab) ? src.activeTab : 'vault',
    search: String(src.search || '').slice(0, 300),
    entry: entry ? {
      open: entry.open === true,
      id: String(entry.id || '').slice(0, 100),
      title: String(entry.title || '').slice(0, 500),
      url: String(entry.url || '').slice(0, 2048),
      username: String(entry.username || '').slice(0, 1000),
      password: String(entry.password || '').slice(0, 10000),
      notes: String(entry.notes || '').slice(0, 20000),
      tags: LPM_ACCOUNT_META.normalizeTags(entry.tags || []),
      favorite: entry.favorite === true
    } : null,
    generator: generator ? {
      length: Math.max(4, Math.min(128, Number(generator.length || 20))),
      upper: generator.upper !== false,
      lower: generator.lower !== false,
      number: generator.number !== false,
      symbol: generator.symbol !== false,
      value: String(generator.value || '').slice(0, 256)
    } : null
  };
  return clean;
}

function savePopupDraft(raw) {
  // Sanitize at request time, then serialize only draft writes. This keeps
  // keystroke persistence independent of vault mutation traffic while
  // preserving last-write-wins ordering.
  const draft = sanitizePopupDraft(raw);
  return queuePopupDraftWrite(async () => {
    const key = await getSessionKey({ touchActivity:false });
    if (!key) throw new Error('LOCKED');
    const payload = await LP.encryptJson(key, draft, POPUP_DRAFT_AAD);
    await chrome.storage.session.set({ [POPUP_DRAFT_KEY]: { savedAt:draft.savedAt, payload } });
    return { saved:true, savedAt:draft.savedAt };
  });
}

async function getPopupDraft() {
  // If the previous popup closed while a draft write was still finishing, wait
  // for that tiny draft-only queue before restoring.
  try { await popupDraftTail; } catch (_) {}
  const holder = (await chrome.storage.session.get(POPUP_DRAFT_KEY))[POPUP_DRAFT_KEY];
  if (!holder?.payload) return null;
  if (now() - Number(holder.savedAt || 0) > POPUP_DRAFT_MAX_AGE) {
    await chrome.storage.session.remove(POPUP_DRAFT_KEY);
    return null;
  }
  const key = await getSessionKey({ touchActivity:false });
  if (!key) return null;
  try {
    return sanitizePopupDraft(await LP.decryptJson(key, holder.payload, POPUP_DRAFT_AAD));
  } catch {
    await chrome.storage.session.remove(POPUP_DRAFT_KEY);
    return null;
  }
}

function clearPopupDraft() {
  return queuePopupDraftWrite(async () => {
    await chrome.storage.session.remove(POPUP_DRAFT_KEY);
    return true;
  });
}
