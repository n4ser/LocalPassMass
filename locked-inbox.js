/* LocalPassMass write-only encrypted inbox for saving credentials while the vault is locked. */
const LOCKED_INBOX_KEY = 'lpLockedInbox';
const LOCKED_INBOX_AAD = 'LocalPassMass:locked-inbox:v1';
const LOCKED_INBOX_LIMIT = 100;

async function ensureLockedInboxCapability() {
  const key = await getSessionKey({ touchActivity:false });
  if (!key) throw new Error('LOCKED');
  const core = await LPM_STORE.readCore();
  if (!core.lpMeta || !core.lpVault) throw new Error('NOT_SETUP');
  const vault = normalizeVault(await LP.decryptVault(key, core.lpVault));
  const current = core.lpMeta.lockedInbox;
  const hasPrivate = current?.keyId && vault.security.lockedInboxKeys.some(k => k?.id === current.keyId && k?.privateKeyJwk);
  if (current?.publicKeyJwk && hasPrivate) return { migrated:false, keyId:current.keyId };

  const pair = await LP.generateInboxKeyPair();
  const keyId = newId();
  vault.version = Math.max(3, Number(vault.version || 2));
  const priorKeys = Array.isArray(vault.security.lockedInboxKeys) ? vault.security.lockedInboxKeys.filter(k => k?.id && k?.privateKeyJwk) : [];
  vault.security.lockedInboxKeys = [{ id:keyId, privateKeyJwk:pair.privateKeyJwk, createdAt:now() }, ...priorKeys.filter(k => k.id !== keyId)].slice(0, 3);
  const nextMeta = {
    ...core.lpMeta,
    version: Math.max(3, Number(core.lpMeta.version || 2)),
    lockedInbox: { version:1, keyId, publicKeyJwk:pair.publicKeyJwk }
  };
  const clean = { ...vault, updatedAt: now() };
  delete clean._storeGeneration;
  const lpVault = await LP.encryptVault(key, clean);
  await LPM_STORE.writeCore({ lpMeta:nextMeta, lpVault }, core.generation, { backup:false });
  return { migrated:true, keyId };
}

async function enqueueLockedCredential(entry, source = {}) {
  const core = await LPM_STORE.readCore();
  const inbox = core.lpMeta?.lockedInbox;
  if (!inbox?.keyId || !inbox?.publicKeyJwk) throw new Error('LOCKED_INBOX_NOT_READY');
  const password = String(entry?.password || '');
  if (!password) throw new Error('PASSWORD_EMPTY');
  const safeEntry = {
    title: String(entry?.title || normalizeHost(source.host) || 'Account').slice(0, 200),
    url: String(entry?.url || `${source.protocol || 'https:'}//${source.host || ''}`).slice(0, 2048),
    username: String(entry?.username || '').slice(0, 1000),
    password: password.slice(0, 10000),
    notes: '', tags:LPM_ACCOUNT_META.normalizeTags(entry?.tags || []), favorite: false, autoUpsert: true
  };
  const payload = await LP.encryptForInbox(inbox.publicKeyJwk, {
    entry:safeEntry,
    sourceHost:normalizeHost(source.host || ''),
    capturedAt:now()
  }, `${LOCKED_INBOX_AAD}:${inbox.keyId}`);
  const { [LOCKED_INBOX_KEY]: raw } = await chrome.storage.local.get(LOCKED_INBOX_KEY);
  const items = Array.isArray(raw?.items) ? raw.items.slice(-LOCKED_INBOX_LIMIT + 1) : [];
  items.push({ id:newId(), keyId:inbox.keyId, createdAt:now(), payload });
  await chrome.storage.local.set({ [LOCKED_INBOX_KEY]: { version:1, items } });
  return { queued:true, count:items.length };
}

async function flushLockedInbox() {
  const key = await getSessionKey({ touchActivity:false });
  if (!key) throw new Error('LOCKED');
  const { [LOCKED_INBOX_KEY]: raw } = await chrome.storage.local.get(LOCKED_INBOX_KEY);
  const items = Array.isArray(raw?.items) ? raw.items : [];
  if (!items.length) return { imported:0, unchanged:0, failed:0, remaining:0 };
  const vault = await readVault();
  const keys = new Map((vault.security?.lockedInboxKeys || []).filter(k => k?.id && k?.privateKeyJwk).map(k => [k.id, k.privateKeyJwk]));
  const processed = new Set();
  let imported=0, unchanged=0, failed=0, anyChanged=false;
  for (const item of items) {
    const privateKeyJwk = keys.get(item?.keyId);
    if (!privateKeyJwk) { failed++; continue; }
    try {
      const decoded = await LP.decryptFromInbox(privateKeyJwk, item.payload, `${LOCKED_INBOX_AAD}:${item.keyId}`);
      if (!decoded?.entry?.password) { failed++; continue; }
      const result = LPM_ENTRY_MODEL.apply(vault, { ...decoded.entry, autoUpsert:true }, { dedupeCredentialOnly:true });
      if (result.changed) { imported++; anyChanged=true; } else unchanged++;
      processed.add(item.id);
    } catch (_) { failed++; }
  }
  if (anyChanged) await writeVault(vault);
  const remaining = items.filter(item => !processed.has(item.id));
  if (remaining.length) await chrome.storage.local.set({ [LOCKED_INBOX_KEY]: { version:1, items:remaining } });
  else await chrome.storage.local.remove(LOCKED_INBOX_KEY);
  return { imported, unchanged, failed, remaining:remaining.length };
}

async function getLockedInboxStatus() {
  const { [LOCKED_INBOX_KEY]: raw } = await chrome.storage.local.get(LOCKED_INBOX_KEY);
  const items = Array.isArray(raw?.items) ? raw.items : [];
  const core = await LPM_STORE.readCore();
  return { count:items.length, ready:!!core.lpMeta?.lockedInbox?.publicKeyJwk };
}

