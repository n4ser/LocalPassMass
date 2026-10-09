/* LocalPassMass login capture, success detection and site policy flow. */
const PENDING_CAPTURE_TTL_MS = 5 * 60 * 1000; // allow redirects, 2FA and slower login flows
const IDENTITY_TTL_MS = 5 * 60 * 1000;
const IDENTITY_MAP_KEY = 'lpPendingLoginIdentities';
const IDENTITY_AAD = 'LocalPassMass:pending-identity:v1';
let siteRulesCache = null;
let siteRulesCacheAt = 0;
const SITE_RULES_CACHE_MS = 2000;

async function getSiteRules({ force = false } = {}) {
  const stamp = now();
  if (!force && siteRulesCache && stamp - siteRulesCacheAt < SITE_RULES_CACHE_MS) return { ...siteRulesCache };
  const { lpSiteRules } = await chrome.storage.local.get('lpSiteRules');
  siteRulesCache = lpSiteRules && typeof lpSiteRules === 'object' ? { ...lpSiteRules } : {};
  siteRulesCacheAt = stamp;
  return { ...siteRulesCache };
}

function cacheSiteRules(rules) {
  siteRulesCache = rules && typeof rules === 'object' ? { ...rules } : {};
  siteRulesCacheAt = now();
}

async function getSiteRule(host) {
  const rules = await getSiteRules();
  return rules[siteScope(host)] || 'ask';
}

async function setSiteRule(host, rule) {
  const scope = siteScope(host);
  if (!scope) return 'ask';
  const rules = await getSiteRules();
  if (!rule || rule === 'ask') delete rules[scope];
  else rules[scope] = rule === 'always' ? 'always' : 'never';
  await chrome.storage.local.set({ lpSiteRules: rules });
  cacheSiteRules(rules);
  return rules[scope] || 'ask';
}

async function getPendingSessionKey() {
  let { [PENDING_SESSION_KEY]: text } = await chrome.storage.session.get(PENDING_SESSION_KEY);
  if (!text) {
    text = LP.bytesToB64(LP.randomBytes(32));
    await chrome.storage.session.set({ [PENDING_SESSION_KEY]: text });
  }
  return LP.b64ToBytes(text);
}

const PENDING_SLOT_SEP = '\u001f';
function validContextId(value) {
  if (value === null || value === undefined || value === '') return null;
  const id = Number(value);
  return Number.isInteger(id) && id >= 0 ? id : null;
}
function pendingSlot(scope, tabId = null, frameId = null) {
  const tab = validContextId(tabId), frame = validContextId(frameId);
  if (tab === null) return String(scope || '');
  return frame === null ? `${scope}${PENDING_SLOT_SEP}${tab}` : `${scope}${PENDING_SLOT_SEP}${tab}${PENDING_SLOT_SEP}${frame}`;
}
function slotBelongsToScope(slot, scope) {
  return slot === scope || String(slot || '').startsWith(`${scope}${PENDING_SLOT_SEP}`);
}

function activePendingMap(raw) {
  const map = raw && typeof raw === 'object' && !Array.isArray(raw) ? { ...raw } : {};
  const time = now();
  for (const [scope, holder] of Object.entries(map)) {
    if (!holder?.payload || Number(holder.expiresAt || 0) <= time) delete map[scope];
  }
  return map;
}

async function writePending(pending) {
  if (!pending?.scope) throw new Error('PENDING_SCOPE_MISSING');
  const key = await getPendingSessionKey();
  const payload = await LP.encryptJson(key, pending, PENDING_AAD);
  const stored = await chrome.storage.session.get(PENDING_MAP_KEY);
  const map = activePendingMap(stored[PENDING_MAP_KEY]);
  const slot = pendingSlot(pending.scope, pending.tabId, pending.frameId);
  map[slot] = { expiresAt:pending.expiresAt, scope:pending.scope, tabId:pending.tabId, frameId:pending.frameId, payload };
  // Remove pre-v1.9 site-only/tab-only map slots after migration.
  if (slot !== pending.scope) delete map[pending.scope];
  if (validContextId(pending.tabId) !== null && validContextId(pending.frameId) !== null) delete map[pendingSlot(pending.scope, pending.tabId)];
  await chrome.storage.session.set({ [PENDING_MAP_KEY]: map });
  const legacy = (await chrome.storage.session.get(PENDING_KEY))[PENDING_KEY];
  if (legacy?.scope === pending.scope) await chrome.storage.session.remove(PENDING_KEY);
}

async function removePending(scope = '', tabId = null, frameId = null) {
  const stored = await chrome.storage.session.get([PENDING_MAP_KEY, PENDING_KEY]);
  const map = activePendingMap(stored[PENDING_MAP_KEY]);
  if (scope) {
    const tab = validContextId(tabId), frame = validContextId(frameId);
    if (tab !== null) {
      if (frame !== null) delete map[pendingSlot(scope, tab, frame)];
      else for (const slot of Object.keys(map)) if (slot === pendingSlot(scope, tab) || slot.startsWith(`${pendingSlot(scope, tab)}${PENDING_SLOT_SEP}`)) delete map[slot];
      // Clear ambiguous legacy slots for this site when an explicit context has handled them.
      delete map[scope]; delete map[pendingSlot(scope, tab)];
    } else {
      for (const slot of Object.keys(map)) if (slotBelongsToScope(slot, scope)) delete map[slot];
    }
  } else {
    for (const key of Object.keys(map)) delete map[key];
  }
  const legacy = stored[PENDING_KEY];
  const removeLegacy = !scope || legacy?.scope === scope;
  if (Object.keys(map).length) await chrome.storage.session.set({ [PENDING_MAP_KEY]: map });
  else await chrome.storage.session.remove(PENDING_MAP_KEY);
  if (removeLegacy) await chrome.storage.session.remove(PENDING_KEY);
  const remainingLegacy = !removeLegacy && legacy?.scope && Number(legacy.expiresAt || 0) > now();
  if (!Object.keys(map).length && !remainingLegacy) await chrome.storage.session.remove(PENDING_SESSION_KEY);
}

async function decodePending(scope, tabId = null, frameId = null) {
  if (!scope) return null;
  const stored = await chrome.storage.session.get([PENDING_MAP_KEY, PENDING_KEY]);
  const map = activePendingMap(stored[PENDING_MAP_KEY]);
  const tab = validContextId(tabId), frame = validContextId(frameId);
  const exactSlot = pendingSlot(scope, tab, frame);
  let holder = map[exactSlot] || null;
  let fromLegacy = false;
  let fromSiblingFrame = false;
  // A login form can live inside an iframe while the successful destination is
  // rendered by the top frame. Let the top frame recover the newest pending
  // credential from another frame in the same tab without mixing tabs/sites.
  if (!holder && tab !== null && frame === 0) {
    const prefix = `${pendingSlot(scope, tab)}${PENDING_SLOT_SEP}`;
    const candidates = Object.entries(map)
      .filter(([slot, item]) => slot.startsWith(prefix) && item?.payload)
      .sort((a,b) => Number(b[1]?.expiresAt || 0) - Number(a[1]?.expiresAt || 0));
    if (candidates.length) { holder = candidates[0][1]; fromSiblingFrame = true; }
  }
  if (!holder && tab !== null && frame !== null && map[pendingSlot(scope, tab)]) { holder = map[pendingSlot(scope, tab)]; fromLegacy = true; }
  if (!holder && map[scope]) { holder = map[scope]; fromLegacy = true; }
  if (!holder && stored[PENDING_KEY]?.scope === scope) { holder = stored[PENDING_KEY]; fromLegacy = true; }
  if (!holder) return null;
  if (Number(holder.expiresAt || 0) <= now()) {
    await removePending(scope, tab, frame);
    return null;
  }
  try {
    const key = await getPendingSessionKey();
    const pending = await LP.decryptJson(key, holder.payload, PENDING_AAD);
    if (Number(pending.expiresAt || 0) <= now() || pending.scope !== scope) {
      await removePending(scope, tab, frame);
      return null;
    }
    if (tab !== null && validContextId(pending.tabId) !== null && Number(pending.tabId) !== tab) return null;
    if (!fromSiblingFrame && frame !== null && validContextId(pending.frameId) !== null && Number(pending.frameId) !== frame) return null;
    if (fromLegacy && tab !== null) {
      pending.tabId = tab; pending.frameId = frame;
      await writePending(pending);
    }
    return pending;
  } catch {
    await removePending(scope, tab, frame);
    return null;
  }
}

async function setPendingIdentity(value, host, tabId = null) {
  const scope = siteScope(host);
  const tab = validContextId(tabId);
  const identity = String(value || '').trim().slice(0, 1000);
  if (!scope || tab === null || !identity) return false;
  const key = await getPendingSessionKey();
  const payload = await LP.encryptJson(key, { identity, scope, tabId:tab, expiresAt:now()+IDENTITY_TTL_MS }, IDENTITY_AAD);
  const stored = await chrome.storage.session.get(IDENTITY_MAP_KEY);
  const map = stored[IDENTITY_MAP_KEY] && typeof stored[IDENTITY_MAP_KEY] === 'object' ? { ...stored[IDENTITY_MAP_KEY] } : {};
  const time = now();
  for (const [slot, holder] of Object.entries(map)) if (!holder?.payload || Number(holder.expiresAt || 0) <= time) delete map[slot];
  map[pendingSlot(scope, tab)] = { expiresAt:now()+IDENTITY_TTL_MS, payload };
  await chrome.storage.session.set({ [IDENTITY_MAP_KEY]:map });
  return true;
}

async function getPendingIdentity(host, tabId = null) {
  const scope=siteScope(host), tab=validContextId(tabId);
  if(!scope || tab===null) return '';
  const stored=await chrome.storage.session.get(IDENTITY_MAP_KEY);
  const map=stored[IDENTITY_MAP_KEY] && typeof stored[IDENTITY_MAP_KEY]==='object' ? { ...stored[IDENTITY_MAP_KEY] } : {};
  const slot=pendingSlot(scope,tab), holder=map[slot];
  if(!holder?.payload || Number(holder.expiresAt||0)<=now()){ if(holder){delete map[slot]; await chrome.storage.session.set({[IDENTITY_MAP_KEY]:map});} return ''; }
  try{ const key=await getPendingSessionKey(); const decoded=await LP.decryptJson(key,holder.payload,IDENTITY_AAD); return decoded?.scope===scope && Number(decoded?.tabId)===tab && Number(decoded?.expiresAt||0)>now() ? String(decoded.identity||'').slice(0,1000) : ''; }
  catch{ delete map[slot]; await chrome.storage.session.set({[IDENTITY_MAP_KEY]:map}); return ''; }
}

async function clearPendingIdentity(host, tabId = null) {
  const scope=siteScope(host), tab=validContextId(tabId);
  if(!scope || tab===null) return;
  const stored=await chrome.storage.session.get(IDENTITY_MAP_KEY);
  const map=stored[IDENTITY_MAP_KEY] && typeof stored[IDENTITY_MAP_KEY]==='object' ? { ...stored[IDENTITY_MAP_KEY] } : {};
  delete map[pendingSlot(scope,tab)];
  if(Object.keys(map).length) await chrome.storage.session.set({[IDENTITY_MAP_KEY]:map}); else await chrome.storage.session.remove(IDENTITY_MAP_KEY);
}

function publicPending(pending, unlocked) {
  if (!pending) return null;
  return {
    status: pending.status || 'captured',
    kind: pending.kind || 'unknown',
    title: pending.entry?.title || '',
    username: pending.entry?.username || '',
    sourceUrl: pending.sourceUrl || '',
    expiresAt: pending.expiresAt,
    risk: pending.risk || { weak: false, reusedCount: 0, reusedEntryIds: [] },
    policy: pending.policy || 'ask',
    unlocked: !!unlocked,
    captureMode: pending.captureMode === 'active' ? 'active' : 'passive'
  };
}

async function setPendingLogin(entry, host, protocol, sourceUrl = '', tabId = null, frameId = null, captureMode = 'active') {
  const settings = await getSettings();
  if (!settings.savePrompt) return null;
  const password = String(entry?.password || '');
  if (!password) return null;

  // If a successful-login decision is already visible for this tab/frame, do not
  // let blur/change events from another password field replace it. This is common
  // on signup and change-password forms with 2-3 password inputs.
  const existing = await readPending(host, { includeSecret:true, tabId, frameId });
  if (existing?.status === 'confirmed') {
    const key = await getSessionKey({ touchActivity:false });
    return publicPending(existing, !!key);
  }

  const policy = await getSiteRule(host);
  if (policy === 'never') {
    await removePending(siteScope(host));
    return { ignored: true, policy };
  }

  const capturedUsername = String(entry?.username || '').trim();
  const fallbackIdentity = capturedUsername ? '' : await getPendingIdentity(host, tabId);
  const pending = {
    entry: {
      title: String(entry?.title || normalizeHost(host) || 'Account'),
      url: String(entry?.url || `${protocol}//${host}`),
      username: capturedUsername || fallbackIdentity,
      password,
      notes: '',
      favorite: false,
      autoUpsert: true
    },
    status: 'captured',
    kind: 'unknown',
    existingId: null,
    scope: siteScope(host),
    sourceHost: normalizeHost(host),
    sourceProtocol: ['http:','https:'].includes(String(protocol)) ? String(protocol) : 'https:',
    sourceUrl: String(sourceUrl || entry?.url || `${protocol}//${host}`),
    capturedAt: now(),
    expiresAt: now() + PENDING_CAPTURE_TTL_MS,
    risk: { weak: false, reusedCount: 0, reusedEntryIds: [] },
    policy,
    tabId: validContextId(tabId),
    frameId: validContextId(frameId),
    captureMode: captureMode === 'passive' ? 'passive' : 'active'
  };

  // If the vault is already unlocked we can classify the credential now, but
  // capture still works while locked because the pending item uses an in-memory
  // session key rather than the vault key.
  const vaultKey = await getSessionKey({ touchActivity: false });
  if (vaultKey) {
    const analysis = await analyzeCredential(host, protocol, pending.entry.username, password);
    if (analysis.state === 'same') {
      await removePending(pending.scope, pending.tabId, pending.frameId);
      await clearPendingIdentity(host, pending.tabId);
      return { same: true, policy };
    }
    pending.kind = analysis.state;
    pending.existingId = analysis.existingId || null;
    pending.risk = analysis.risk || pending.risk;
    if (pending.existingId) pending.entry.id = pending.existingId;
  }

  await writePending(pending);
  return publicPending(pending, !!vaultKey);
}

async function readPending(host, { includeSecret = false, tabId = null, frameId = null } = {}) {
  const scope = siteScope(host);
  const pending = await decodePending(scope, tabId, frameId);
  if (!pending) return null;
  const key = await getSessionKey({ touchActivity: false });
  return includeSecret ? pending : publicPending(pending, !!key);
}

async function classifyPending(pending, protocol = '') {
  const key = await getSessionKey({ touchActivity: false });
  if (!key) return { pending, unlocked: false };
  const effectiveProtocol = ['http:','https:'].includes(protocol) ? protocol : (pending.sourceProtocol || 'https:');
  const analysis = await analyzeCredential(pending.sourceHost || pending.scope, effectiveProtocol, pending.entry?.username, pending.entry?.password);
  if (analysis.state === 'same') return { pending: null, unlocked: true, same: true };
  pending.kind = analysis.state;
  pending.existingId = analysis.existingId || null;
  pending.risk = analysis.risk || pending.risk;
  if (pending.existingId) pending.entry.id = pending.existingId;
  return { pending, unlocked: true };
}

async function confirmLoginSuccess(host, protocol = 'https:', currentUrl = '', evidence = '', tabId = null, frameId = null) {
  let pending = await readPending(host, { includeSecret: true, tabId, frameId });
  if (!pending) return null;
  if (pending.status === 'confirmed') {
    const key = await getSessionKey({ touchActivity: false });
    return publicPending(pending, !!key);
  }

  const classified = await classifyPending(pending, protocol);
  if (classified.same) {
    await removePending(pending.scope, pending.tabId, pending.frameId);
    await clearPendingIdentity(host, pending.tabId);
    return { same: true };
  }
  pending = classified.pending;
  const settings = await getSettings();
  const ttl = Math.max(10, Math.min(120, Number(settings.savePromptSeconds || 30))) * 1000;
  pending.status = 'confirmed';
  pending.confirmedAt = now();
  pending.confirmedUrl = String(currentUrl || '');
  pending.successEvidence = String(evidence || 'heuristic');
  pending.expiresAt = now() + ttl;
  pending.policy = await getSiteRule(host);

  if (pending.policy === 'never') {
    await removePending(pending.scope, pending.tabId, pending.frameId);
    return { ignored: true, policy: 'never' };
  }

  const lowConfidence = String(evidence || '').startsWith('weak:');
  if (pending.policy === 'always' && !lowConfidence) {
    if (classified.unlocked) {
      const saved = await saveEntry({ ...(pending.entry || {}), autoUpsert: true });
      await removePending(pending.scope, pending.tabId, pending.frameId);
      await clearPendingIdentity(host, pending.tabId);
      return { autoSaved: true, kind: pending.kind, saved };
    }
    try {
      const queued = await enqueueLockedCredential(pending.entry || {}, { host, protocol });
      await removePending(pending.scope, pending.tabId, pending.frameId);
      await clearPendingIdentity(host, pending.tabId);
      return { autoSaved: true, queued: true, kind: pending.kind, ...queued };
    } catch (e) {
      if (e.message !== 'LOCKED_INBOX_NOT_READY') throw e;
    }
  }

  await writePending(pending);
  return publicPending(pending, classified.unlocked);
}

async function savePendingLogin(host, remember = '', tabId = null, frameId = null) {
  let pending = await readPending(host, { includeSecret: true, tabId, frameId });
  if (!pending || pending.status !== 'confirmed') throw new Error('PENDING_MISSING');

  if (remember === 'always') pending.policy = await setSiteRule(host, 'always');

  const classified = await classifyPending(pending, pending.sourceProtocol || 'https:');
  if (classified.same) {
    await removePending(pending.scope, pending.tabId, pending.frameId);
    await clearPendingIdentity(host, pending.tabId);
    return { saved: false, same: true };
  }
  pending = classified.pending;

  if (!classified.unlocked) {
    try {
      const queued = await enqueueLockedCredential(pending.entry || {}, { host, protocol:pending.sourceProtocol || 'https:' });
      await removePending(pending.scope, pending.tabId, pending.frameId);
      await clearPendingIdentity(host, pending.tabId);
      return { saved:true, queued:true, kind:pending.kind || 'unknown', ...queued };
    } catch (e) {
      if (e.message !== 'LOCKED_INBOX_NOT_READY') throw e;
      // Upgrade edge case: old vaults have no write-only public key until their
      // first unlock after upgrading from an older vault. Keep the encrypted
      // session prompt alive briefly.
      pending.expiresAt = now() + 120_000;
      await writePending(pending);
      return { needsUnlockSetup:true };
    }
  }

  const saved = await saveEntry({ ...(pending.entry || {}), autoUpsert: true });
  await removePending(pending.scope, pending.tabId, pending.frameId);
  await clearPendingIdentity(host, pending.tabId);
  return { saved: true, entry: saved, kind: pending.kind };
}


async function clearPendingLogin(host = '', siteRule = '', tabId = null, frameId = null) {
  if (siteRule === 'never' && host) await setSiteRule(host, 'never');
  await removePending(siteScope(host), tabId, frameId);
  await clearPendingIdentity(host, tabId);
  return true;
}

async function resetSiteRules() {
  await chrome.storage.local.set({ lpSiteRules: {} });
  cacheSiteRules({});
  return true;
}

