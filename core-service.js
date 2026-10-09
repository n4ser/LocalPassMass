/* LocalPassMass core vault, backup and credential services. */
const DEFAULT_SETTINGS = {
  autoLockEnabled: true,
  autoLockMinutes: 5,
  clipboardSeconds: 20,
  subdomainMatch: true,
  allowHttpFill: false,
  savePrompt: true,
  savePromptSeconds: 30,
  language: 'fa',
  lockOnSystemLock: true,
  lockOnBrowserClose: true,
  theme: 'system',
  showSettingsHelp: false,
  autoBackupEnabled: true,
  autoBackupMaxSnapshots: 5,
  clipboardAutoClearEnabled: false,
  showSiteIcons: false,
  vaultMode: 'private',
  sharedVaultPath: '%LOCALAPPDATA%\\LocalPassMass\\vault.lpm',
  sharedBackupPath: '%LOCALAPPDATA%\\LocalPassMass\\Backups',
  sharedBackupMax: 5
};

const PENDING_KEY = 'lpPendingLogin'; // legacy single-item key (pre-v1.7.1)
const PENDING_MAP_KEY = 'lpPendingLogins';
const PENDING_SESSION_KEY = 'lpPendingSessionKey';
const PENDING_AAD = 'LocalPassMass:pending-login:v2';
const UNLOCK_GRACE_KEY = 'lpUnlockGraceUntil';

function now() { return Date.now(); }
function newId() { return crypto.randomUUID(); }

async function getLocal() {
  return LPM_STORE.readCore();
}

let settingsCache = null;
let settingsCacheAt = 0;
const SETTINGS_CACHE_MS = 1500;

async function getSettings({ force = false } = {}) {
  const stamp = now();
  if (!force && settingsCache && stamp - settingsCacheAt < SETTINGS_CACHE_MS) return settingsCache;
  const { lpSettings } = await chrome.storage.local.get('lpSettings');
  settingsCache = { ...DEFAULT_SETTINGS, ...(lpSettings || {}) };
  settingsCacheAt = stamp;
  return settingsCache;
}

function cacheSettings(value) {
  settingsCache = { ...DEFAULT_SETTINGS, ...(value || {}) };
  settingsCacheAt = now();
  return settingsCache;
}

async function getBackupState() {
  const { lpBackupState } = await chrome.storage.local.get('lpBackupState');
  return { lastBackupAt: null, changesSinceBackup: 0, ...(lpBackupState || {}) };
}

async function markVaultChanged({ skipSnapshot = false } = {}) {
  const current = await getBackupState();
  await chrome.storage.local.set({ lpBackupState: {
    ...current,
    changesSinceBackup: Number(current.changesSinceBackup || 0) + 1,
    lastChangeAt: now()
  }});
  if (!skipSnapshot && (await LPM_STORE.mode()) === 'private') {
    try { await createAutoSnapshot('vault-change'); } catch (_) {}
  }
}

async function markBackupCreated() {
  const current = await getBackupState();
  const next = { ...current, lastBackupAt: now(), changesSinceBackup: 0 };
  await chrome.storage.local.set({ lpBackupState: next });
  return next;
}

async function getAutoBackupStatus() {
  if ((await LPM_STORE.mode()) === 'shared') {
    const cfg = await LPM_STORE.sharedConfig();
    const result = await LPM_BRIDGE.listBackups(cfg.path, cfg.backupDir);
    const backups = Array.isArray(result?.backups) ? result.backups : [];
    return { mode:'shared', count:backups.length, latestAt:backups[0]?.createdAt || null, snapshots:backups.map(b => ({ id:b.path, path:b.path, createdAt:b.createdAt, reason:'shared-file-backup', generation:b.generation || 0 })) };
  }
  const { lpAutoBackups } = await chrome.storage.local.get('lpAutoBackups');
  const snapshots = Array.isArray(lpAutoBackups) ? lpAutoBackups : [];
  return { mode:'private', count:snapshots.length, latestAt:snapshots[0]?.createdAt || null, snapshots:snapshots.map(s => ({ id:s.id, createdAt:s.createdAt, reason:s.reason || 'change' })) };
}

async function storePrivateSnapshot(lpMeta, lpVault, reason = 'change', { force = false } = {}) {
  const settings = await getSettings();
  if ((!force && settings.autoBackupEnabled === false) || !lpMeta?.recoveryWrap || !lpVault) return getAutoBackupStatus();
  const { lpAutoBackups } = await chrome.storage.local.get('lpAutoBackups');
  const max = Math.max(1, Math.min(10, Number(settings.autoBackupMaxSnapshots || 5)));
  const snapshots = Array.isArray(lpAutoBackups) ? [...lpAutoBackups] : [];
  const snapshot = {
    id: newId(), createdAt: now(), reason: String(reason || 'change'),
    format: 'LocalPassMass-AutoBackup', version: 1,
    recoveryWrap: lpMeta.recoveryWrap, vault: lpVault
  };
  snapshots.unshift(snapshot);
  await chrome.storage.local.set({ lpAutoBackups: snapshots.slice(0, max) });
  return getAutoBackupStatus();
}

async function createAutoSnapshot(reason = 'change', { force = false } = {}) {
  const settings = await getSettings();
  if ((await LPM_STORE.mode()) === 'shared') {
    if (!force && settings.autoBackupEnabled === false) return getAutoBackupStatus();
    const cfg = await LPM_STORE.sharedConfig();
    await LPM_BRIDGE.send({ op:'snapshot_now', path:cfg.path, backupDir:cfg.backupDir, backupMax:cfg.backupMax, reason:String(reason || 'manual') });
    return getAutoBackupStatus();
  }
  if (!force && settings.autoBackupEnabled === false) return getAutoBackupStatus();
  const { lpMeta, lpVault } = await chrome.storage.local.get(['lpMeta', 'lpVault']);
  if (!lpMeta?.recoveryWrap || !lpVault) return getAutoBackupStatus();
  // Manual/baseline snapshots capture the current encrypted state. Normal vault
  // mutations are backed up BEFORE overwrite in writeVault(), so a deletion or
  // bad edit can be undone even when several changes happen quickly.
  return storePrivateSnapshot(lpMeta, lpVault, reason, { force });
}

async function restoreAutoSnapshot(id = '') {
  const key = await getSessionKey();
  if (!key) throw new Error('LOCKED');
  if ((await LPM_STORE.mode()) === 'shared') {
    const status = await getAutoBackupStatus();
    const snapshot = id ? status.snapshots.find(s => s.id === id) : status.snapshots[0];
    if (!snapshot?.path) throw new Error('SNAPSHOT_MISSING');
    const doc = await LPM_BRIDGE.readDocument(snapshot.path);
    if (!doc?.vault) throw new Error('SNAPSHOT_MISSING');
    await LP.decryptVault(key, doc.vault); // proves this backup uses the active vault key.
    const current = await LPM_STORE.readCore();
    // Restore only encrypted vault DATA. Keep current password/recovery metadata;
    // otherwise restoring an old snapshot could silently revive an old master password.
    await LPM_STORE.writeCore({ lpMeta:current.lpMeta, lpVault:doc.vault }, current.generation, { backup:true });
    await markVaultChanged({ skipSnapshot:true });
    return true;
  }
  const { lpMeta, lpVault, lpAutoBackups } = await chrome.storage.local.get(['lpMeta','lpVault','lpAutoBackups']);
  const snapshots = Array.isArray(lpAutoBackups) ? lpAutoBackups : [];
  const snapshot = id ? snapshots.find(s => s.id === id) : snapshots[0];
  if (!snapshot?.vault) throw new Error('SNAPSHOT_MISSING');
  await LP.decryptVault(key, snapshot.vault);
  // Preserve the state being replaced as a safety snapshot before the restore.
  try { await storePrivateSnapshot(lpMeta, lpVault, 'before-restore', { force:true }); } catch (_) {}
  await chrome.storage.local.set({ lpVault:snapshot.vault });
  await markVaultChanged({ skipSnapshot:true });
  return true;
}

function normalizeUnlockGrace(value) {
  if (value === 'session') return 'session';
  const n = Number(value || 0);
  return [0,5,15,30,60].includes(n) ? n : 0;
}

async function setSessionKey(vaultKeyBytes, grace = 0) {
  const normalized = normalizeUnlockGrace(grace);
  const data = { lpSessionKey: LP.bytesToB64(vaultKeyBytes), lpLastActivity: now() };
  if (normalized === 'session') data[UNLOCK_GRACE_KEY] = Number.MAX_SAFE_INTEGER;
  else if (normalized > 0) data[UNLOCK_GRACE_KEY] = now() + normalized * 60_000;
  await chrome.storage.session.set(data);
  if (!normalized) await chrome.storage.session.remove(UNLOCK_GRACE_KEY);
}

async function touch() {
  await chrome.storage.session.set({ lpLastActivity: now() });
}

async function lockVault() {
  await chrome.storage.session.remove(['lpSessionKey', 'lpLastActivity', UNLOCK_GRACE_KEY]);
  await chrome.action.setBadgeText({ text: '' });
  try { await clearClipboard(); } catch (_) {}
  return true;
}

async function getSessionKey({ touchActivity = true } = {}) {
  const { lpSessionKey, lpLastActivity, [UNLOCK_GRACE_KEY]: unlockGraceUntil } = await chrome.storage.session.get(['lpSessionKey', 'lpLastActivity', UNLOCK_GRACE_KEY]);
  if (!lpSessionKey) return null;
  const graceActive = Number(unlockGraceUntil || 0) > now();
  if (unlockGraceUntil && !graceActive) await chrome.storage.session.remove(UNLOCK_GRACE_KEY);
  const settings = await getSettings();
  if (!graceActive && settings.autoLockEnabled !== false) {
    const maxIdle = Math.max(1, Number(settings.autoLockMinutes || 5)) * 60_000;
    if (lpLastActivity && now() - lpLastActivity > maxIdle) {
      await lockVault();
      return null;
    }
  }
  if (touchActivity) await touch();
  return LP.b64ToBytes(lpSessionKey);
}

function normalizeVault(vault) {
  const v = vault && typeof vault === 'object' ? vault : {};
  if (!Array.isArray(v.entries)) v.entries = [];
  for (const e of v.entries) {
    if (!Array.isArray(e.history)) e.history = [];
  }
  if (!v.security || typeof v.security !== 'object') v.security = {};
  if (!Array.isArray(v.security.lockedInboxKeys)) v.security.lockedInboxKeys = [];
  if (!v.version || v.version < 2) v.version = 2;
  if (v.security.lockedInboxKeys.length && v.version < 3) v.version = 3;
  return v;
}

async function readVault() {
  const key = await getSessionKey();
  if (!key) throw new Error('LOCKED');
  const core = await LPM_STORE.readCore();
  if (!core.lpVault) {
    const fresh = { version: 2, entries: [], createdAt: now(), updatedAt: now() };
    Object.defineProperty(fresh, '_storeGeneration', { value: Number(core.generation || 0), writable: true, enumerable: false });
    return fresh;
  }
  let vault;
  try { vault = normalizeVault(await LP.decryptVault(key, core.lpVault)); }
  catch (e) {
    if (core.mode === 'shared') { await lockVault(); throw new Error('SHARED_VAULT_CHANGED_REUNLOCK'); }
    throw e;
  }
  Object.defineProperty(vault, '_storeGeneration', { value: Number(core.generation || 0), writable: true, enumerable: false });
  return vault;
}

async function writeVault(data, { countChange = true } = {}) {
  const key = await getSessionKey();
  if (!key) throw new Error('LOCKED');
  const expectedGeneration = Number(data?._storeGeneration || 0);
  const clean = { ...data, version: Math.max(3, Number(data?.version || 2)), updatedAt: now() };
  delete clean._storeGeneration;
  const lpVault = await LP.encryptVault(key, clean);
  const core = await LPM_STORE.readCore();
  if (!core.lpMeta) throw new Error('NOT_SETUP');
  if (countChange && core.mode === 'private' && core.lpVault) {
    try { await storePrivateSnapshot(core.lpMeta, core.lpVault, 'before-change'); } catch (_) {}
  }
  const result = await LPM_STORE.writeCore({ lpMeta: core.lpMeta, lpVault }, expectedGeneration, { backup: countChange });
  Object.defineProperty(clean, '_storeGeneration', { value: Number(result.generation || 0), writable: true, enumerable: false });
  if (countChange) await markVaultChanged({ skipSnapshot:true });
  return clean;
}

const normalizeHost = LPM_SITE.normalizeHost;
const siteScope = LPM_SITE.siteScope;
const hostMatches = LPM_SITE.hostMatches;
const formActionSafe = LPM_SITE.formActionSafe;

function publicEntry(entry) {
  return {
    id: entry.id,
    title: entry.title,
    username: entry.username,
    password: entry.password,
    url: entry.url,
    notes: entry.notes || '',
    favorite: !!entry.favorite,
    tags: LPM_ACCOUNT_META.normalizeTags(entry.tags || []),
    history: Array.isArray(entry.history) ? entry.history.map(h => ({
      password: String(h.password || ''),
      username: String(h.username || ''),
      url: String(h.url || ''),
      changedAt: Number(h.changedAt || 0)
    })) : [],
    createdAt: entry.createdAt,
    updatedAt: entry.updatedAt,
    passwordUpdatedAt: entry.passwordUpdatedAt || entry.updatedAt,
    lastUsedAt: Number(entry.lastUsedAt || 0)
  };
}

async function setupVault(password) {
  if (!password) throw new Error('PASSWORD_EMPTY');
  if ((await LPM_STORE.mode()) !== 'private') throw new Error('SHARED_SETUP_USE_CONNECT');
  const existing = await chrome.storage.local.get('lpMeta');
  if (existing.lpMeta) throw new Error('ALREADY_SETUP');

  const vaultKey = LP.randomBytes(32);
  const recoveryKey = LP.randomBytes(32);
  const pepper = LP.randomBytes(32);
  const salt = LP.randomBytes(16);
  const iterations = 600000;

  const passwordWrap = await LP.wrapVaultKeyWithPassword(vaultKey, password, pepper, salt, iterations);
  const recoveryWrap = await LP.wrapVaultKeyWithRecovery(vaultKey, recoveryKey);
  const inboxKeys = await LP.generateInboxKeyPair();
  const inboxKeyId = newId();
  const lpMeta = {
    version: 3,
    vaultId: newId(),
    createdAt: now(),
    kdf: { name: 'PBKDF2-SHA256', iterations, salt: LP.bytesToB64(salt) },
    devicePepper: LP.bytesToB64(pepper),
    passwordWrap,
    recoveryWrap,
    lockedInbox: { version: 1, keyId: inboxKeyId, publicKeyJwk: inboxKeys.publicKeyJwk }
  };
  const initial = {
    version: 3, entries: [], createdAt: now(), updatedAt: now(),
    security: { lockedInboxKeys: [{ id: inboxKeyId, privateKeyJwk: inboxKeys.privateKeyJwk, createdAt: now() }] }
  };
  const lpVault = await LP.encryptVault(vaultKey, initial);
  const existingSettings = await getSettings();
  await chrome.storage.local.set({
    lpMeta,
    lpVault,
    lpSettings: { ...existingSettings, vaultMode:'private' },
    lpBackupState: { lastBackupAt: null, changesSinceBackup: 0 },
    lpAutoBackups: []
  });
  await setSessionKey(vaultKey);
  try { await createAutoSnapshot('vault-created'); } catch (_) {}
  return { recoveryKeyText: LP.keyToText(recoveryKey) };
}


async function unlock(password, grace = 0) {
  const { lpMeta, lpVault } = await getLocal();
  if (!lpMeta || !lpVault) throw new Error('NOT_SETUP');
  try {
    const pepper = await LPM_STORE.getPepper(lpMeta);
    const vaultKey = await LP.unwrapVaultKeyWithPassword(
      lpMeta.passwordWrap, password, pepper, LP.b64ToBytes(lpMeta.kdf.salt), lpMeta.kdf.iterations
    );
    await LP.decryptVault(vaultKey, lpVault);
    await setSessionKey(vaultKey, grace);
    let securityMigration = null, inboxImported = null;
    try { securityMigration = await ensureLockedInboxCapability(); } catch (_) {}
    try { inboxImported = await flushLockedInbox(); } catch (_) {}
    return { unlocked: true, securityMigration, inboxImported };
  } catch (e) {
    if (String(e?.message || '').startsWith('BRIDGE_') || ['DEVICE_SECRET_MISSING','SHARED_VAULT_INVALID','SHARED_VAULT_MISSING'].includes(e?.message)) throw e;
    throw new Error('BAD_PASSWORD');
  }
}

async function changePassword(newPassword) {
  if (!newPassword) throw new Error('PASSWORD_EMPTY');
  const vaultKey = await getSessionKey();
  if (!vaultKey) throw new Error('LOCKED');
  const core = await LPM_STORE.readCore();
  const lpMeta = { ...(core.lpMeta || {}) };
  if (!lpMeta.passwordWrap) throw new Error('NOT_SETUP');
  const pepper = (await LPM_STORE.mode()) === 'shared' ? await LPM_STORE.getPepper(lpMeta) : LP.randomBytes(32);
  const salt = LP.randomBytes(16);
  const iterations = 600000;
  if ((await LPM_STORE.mode()) !== 'shared') lpMeta.devicePepper = LP.bytesToB64(pepper);
  lpMeta.kdf = { name: 'PBKDF2-SHA256', iterations, salt: LP.bytesToB64(salt) };
  lpMeta.passwordWrap = await LP.wrapVaultKeyWithPassword(vaultKey, newPassword, pepper, salt, iterations);
  await LPM_STORE.writeCore({ lpMeta, lpVault: core.lpVault }, core.generation);
  return true;
}

async function recoverCurrentVault(recoveryText, newPassword) {
  if (!newPassword) throw new Error('PASSWORD_EMPTY');
  const recoveryKey = LP.textToKey(recoveryText);
  const core = await LPM_STORE.readCore();
  if (!core.lpMeta?.recoveryWrap || !core.lpVault) throw new Error('NOT_SETUP');

  const candidates = [{ source:'current', recoveryWrap:core.lpMeta.recoveryWrap, vault:core.lpVault, meta:core.lpMeta }];
  if (core.mode === 'private') {
    const { lpAutoBackups } = await chrome.storage.local.get('lpAutoBackups');
    for (const snap of (Array.isArray(lpAutoBackups) ? lpAutoBackups : [])) {
      candidates.push({ source:'snapshot', snapshotId:snap.id, createdAt:snap.createdAt, recoveryWrap:snap.recoveryWrap, vault:snap.vault, meta:core.lpMeta });
    }
  } else {
    try {
      const cfg = await LPM_STORE.sharedConfig();
      const listing = await LPM_BRIDGE.listBackups(cfg.path, cfg.backupDir);
      for (const item of (listing?.backups || []).slice(0, 10)) {
        try {
          const doc = await LPM_BRIDGE.readDocument(item.path);
          if (doc?.meta?.recoveryWrap && doc?.vault) candidates.push({ source:'shared-backup', createdAt:item.createdAt, recoveryWrap:doc.meta.recoveryWrap, vault:doc.vault, meta:doc.meta });
        } catch (_) {}
      }
    } catch (_) {}
  }

  let selected = null, vaultKey = null;
  for (const candidate of candidates) {
    try {
      const candidateKey = await LP.unwrapVaultKeyWithRecovery(candidate.recoveryWrap, recoveryKey);
      await LP.decryptVault(candidateKey, candidate.vault);
      selected = candidate; vaultKey = candidateKey; break;
    } catch (_) {}
  }
  if (!selected || !vaultKey) throw new Error('RECOVERY_FAILED');

  const salt = LP.randomBytes(16);
  const iterations = 600000;
  const nextMeta = { ...(selected.meta || core.lpMeta), version:3, recoveredAt:now(), kdf:{ name:'PBKDF2-SHA256', iterations, salt:LP.bytesToB64(salt) }, recoveryWrap:selected.recoveryWrap };
  const pepper = core.mode === 'shared' ? await LPM_STORE.getPepper(core.lpMeta) : LP.randomBytes(32);
  if (core.mode === 'private') nextMeta.devicePepper = LP.bytesToB64(pepper);
  else { nextMeta.vaultId = core.lpMeta.vaultId; delete nextMeta.devicePepper; }
  nextMeta.passwordWrap = await LP.wrapVaultKeyWithPassword(vaultKey, newPassword, pepper, salt, iterations);
  await LPM_STORE.writeCore({ lpMeta:nextMeta, lpVault:selected.vault }, core.generation);
  await setSessionKey(vaultKey);
  try { await ensureLockedInboxCapability(); } catch (_) {}
  try { await flushLockedInbox(); } catch (_) {}
  if (core.mode === 'private' && selected.source === 'snapshot') { try { await createAutoSnapshot('recovered-from-snapshot'); } catch (_) {} }
  if (core.mode === 'shared' && selected.source !== 'current') {
    try { const cfg=await LPM_STORE.sharedConfig(); await LPM_BRIDGE.send({op:'reset_backups',path:cfg.path,backupDir:cfg.backupDir,backupMax:cfg.backupMax,reason:'recovery'}); } catch (_) {}
  }
  return { recovered:true, source:selected.source, snapshotCreatedAt:selected.createdAt || null };
}

async function testRecoveryKey(recoveryText) {
  const recoveryKey = LP.textToKey(recoveryText);
  const { lpMeta, lpVault } = await LPM_STORE.readCore();
  if (!lpMeta?.recoveryWrap || !lpVault) throw new Error('NOT_SETUP');
  try {
    const vaultKey = await LP.unwrapVaultKeyWithRecovery(lpMeta.recoveryWrap, recoveryKey);
    await LP.decryptVault(vaultKey, lpVault);
    return { valid:true };
  } catch { throw new Error('RECOVERY_FAILED'); }
}

async function rotateRecoveryKey() {
  const vaultKey = await getSessionKey();
  if (!vaultKey) throw new Error('LOCKED');
  const core = await LPM_STORE.readCore();
  const lpMeta = { ...(core.lpMeta || {}) };
  const recoveryKey = LP.randomBytes(32);
  lpMeta.recoveryWrap = await LP.wrapVaultKeyWithRecovery(vaultKey, recoveryKey);
  lpMeta.recoveryRotatedAt = now();
  await LPM_STORE.writeCore({ lpMeta, lpVault:core.lpVault }, core.generation);
  if (core.mode === 'private') {
    const { lpAutoBackups } = await chrome.storage.local.get('lpAutoBackups');
    const snapshots = Array.isArray(lpAutoBackups) ? lpAutoBackups.map(snapshot => ({ ...snapshot, recoveryWrap:lpMeta.recoveryWrap })) : [];
    await chrome.storage.local.set({ lpAutoBackups:snapshots });
    try { await createAutoSnapshot('recovery-key-rotated'); } catch (_) {}
  } else {
    // Shared file snapshots contain full historical metadata. Re-writing only the
    // recoveryWrap could corrupt snapshots created under a different vault key
    // (for example after an imported vault). Reset the rolling auto-backup set
    // instead, leaving one fresh snapshot protected by the new Recovery Key.
    try {
      const cfg = await LPM_STORE.sharedConfig();
      await LPM_BRIDGE.send?.({ op:'reset_backups', path:cfg.path, backupDir:cfg.backupDir, backupMax:cfg.backupMax, reason:'recovery-key-rotated' });
    } catch (_) {}
  }
  return { recoveryKeyText:LP.keyToText(recoveryKey) };
}

async function exportBackup() {
  const key = await getSessionKey();
  if (!key) throw new Error('LOCKED');
  const { lpMeta, lpVault } = await getLocal();
  const backup = {
    format: 'LocalPassMass-Backup',
    version: 3,
    product: 'LocalPassMass',
    exportedAt: new Date().toISOString(),
    crypto: 'AES-256-GCM',
    recoveryWrap: lpMeta.recoveryWrap,
    vault: lpVault
  };
  await markBackupCreated();
  return JSON.stringify(backup, null, 2);
}

async function importBackup(backupText, recoveryText, newPassword) {
  if (!newPassword) throw new Error('PASSWORD_EMPTY');
  let backup;
  try { backup = JSON.parse(backupText); } catch { throw new Error('BACKUP_INVALID'); }
  const acceptedFormats = ['LocalPass-Backup', 'LocalPassMass-Backup'];
  if (!acceptedFormats.includes(backup?.format) || ![1,2,3].includes(Number(backup.version || 1)) || !backup.recoveryWrap || !backup.vault) throw new Error('BACKUP_INVALID');
  const recoveryKey = LP.textToKey(recoveryText);
  let vaultKey;
  try {
    vaultKey = await LP.unwrapVaultKeyWithRecovery(backup.recoveryWrap, recoveryKey);
    await LP.decryptVault(vaultKey, backup.vault);
  } catch { throw new Error('RECOVERY_FAILED'); }

  const mode = await LPM_STORE.mode();
  const salt = LP.randomBytes(16);
  const iterations = 600000;
  let lpMeta, expectedGeneration = 0;
  if (mode === 'shared') {
    let core = await LPM_STORE.readCore();
    expectedGeneration = Number(core.generation || 0);
    let vaultId = core.lpMeta?.vaultId || core.vaultId;
    let pepper;
    if (vaultId) pepper = await LPM_STORE.getPepper(core.lpMeta);
    else {
      vaultId = newId();
      const sec = await LPM_BRIDGE.createSecret(vaultId);
      pepper = LP.b64ToBytes(sec.secret);
    }
    lpMeta = { version:3, vaultId, restoredAt:now(), kdf:{ name:'PBKDF2-SHA256', iterations, salt:LP.bytesToB64(salt) }, passwordWrap:await LP.wrapVaultKeyWithPassword(vaultKey,newPassword,pepper,salt,iterations), recoveryWrap:backup.recoveryWrap };
    await LPM_STORE.writeCore({ lpMeta, lpVault:backup.vault }, expectedGeneration);
    // Imported backups can carry a different vault key. Drop incompatible shared
    // auto-backups and seed a fresh encrypted snapshot of the imported state.
    try { const cfg=await LPM_STORE.sharedConfig(); await LPM_BRIDGE.send({op:'reset_backups',path:cfg.path,backupDir:cfg.backupDir,backupMax:cfg.backupMax,reason:'backup-import'}); } catch (_) {}
  } else {
    const pepper = LP.randomBytes(32);
    lpMeta = { version:3, vaultId:newId(), restoredAt:now(), kdf:{ name:'PBKDF2-SHA256', iterations, salt:LP.bytesToB64(salt) }, devicePepper:LP.bytesToB64(pepper), passwordWrap:await LP.wrapVaultKeyWithPassword(vaultKey,newPassword,pepper,salt,iterations), recoveryWrap:backup.recoveryWrap };
    await chrome.storage.local.set({ lpMeta, lpVault:backup.vault, lpBackupState:{ lastBackupAt:now(), changesSinceBackup:0 }, lpAutoBackups:[] });
  }
  await setSessionKey(vaultKey);
  await chrome.storage.local.remove(LOCKED_INBOX_KEY);
  try { await ensureLockedInboxCapability(); } catch (_) {}
  try { await createAutoSnapshot('backup-import', { force:true }); } catch (_) {}
  return true;
}

async function saveEntry(input) {
  const vault = await readVault();
  const result = LPM_ENTRY_MODEL.apply(vault, input || {});
  if (result.changed) await writeVault(vault);
  return publicEntry(result.entry);
}

async function bulkImportEntries(items) {
  if (!Array.isArray(items)) throw new Error('IMPORT_INVALID');
  if (items.length > 5000) throw new Error('IMPORT_TOO_LARGE');
  const vault = await readVault();
  let imported = 0, updated = 0, skipped = 0;
  for (const raw of items) {
    const url = String(raw?.url || '').trim().slice(0, 2048);
    const password = String(raw?.password || '').slice(0, 10000);
    if (!url || !password) { skipped++; continue; }
    let normalizedUrl = url;
    try {
      const parsed = new URL(/^https?:\/\//i.test(url) ? url : `https://${url}`);
      if (!['http:','https:'].includes(parsed.protocol) || !parsed.hostname) throw new Error('bad');
      normalizedUrl = parsed.origin;
    } catch { skipped++; continue; }
    const username = String(raw?.username || '').trim().slice(0, 1000);
    const input = {
      title:String(raw?.title || raw?.name || LPM_ACCOUNT_META.makeTitle('', normalizedUrl) || normalizeHost(normalizedUrl) || 'Account').trim().slice(0, 200),
      url:normalizedUrl, username, password, notes:String(raw?.notes || raw?.extra || '').slice(0, 10000),
      tags:LPM_ACCOUNT_META.normalizeTags(raw?.tags || raw?.group || raw?.folder || []),
      favorite:raw?.favorite === true || raw?.favorite === '1', autoUpsert:!!username
    };
    if (!username) {
      const exact = vault.entries.find(e => siteScope(e.url || '') === siteScope(normalizedUrl) && !String(e.username || '') && String(e.password || '') === password);
      if (exact) { skipped++; continue; }
    }
    const result = LPM_ENTRY_MODEL.apply(vault, input, { dedupeCredentialOnly:true });
    if (!result.changed) skipped++;
    else if (result.state === 'new') imported++;
    else updated++;
  }
  if (imported || updated) await writeVault(vault);
  return { imported, updated, skipped, total:items.length };
}

async function deleteEntry(id) {
  id = String(id || '');
  if (!id) return false;
  const vault = await readVault();
  const before = vault.entries.length;
  vault.entries = vault.entries.filter(e => e.id !== id);
  if (vault.entries.length === before) return false;
  await writeVault(vault);
  return true;
}

async function listEntries() {
  const vault = await readVault();
  return vault.entries.map(publicEntry).sort((a, b) => Number(b.favorite) - Number(a.favorite) || b.updatedAt - a.updatedAt);
}

function riskFromEntries(entries, password, excludeId = '') {
  password = String(password || '');
  if (!password) return { weak: true, reusedCount: 0, reusedEntryIds: [] };
  const reused = entries.filter(e => e.id !== excludeId && String(e.password || '') === password);
  return {
    weak: password.length < 10 || /^[0-9]+$/.test(password),
    reusedCount: reused.length,
    reusedEntryIds: reused.map(e => e.id)
  };
}

async function passwordRisk(password, excludeId = '') {
  const vault = await readVault();
  return riskFromEntries(vault.entries, password, String(excludeId || ''));
}

async function markEntryUsed(id, host = '', protocol = 'https:') {
  if (!id) return false;
  const settings = await getSettings();
  if (protocol === 'http:' && !settings.allowHttpFill && host !== 'localhost' && host !== '127.0.0.1') return false;
  const vault = await readVault();
  const entry = vault.entries.find(e => e.id === id);
  if (!entry || (host && !hostMatches(host, entry.url, settings.subdomainMatch))) return false;
  const stamp = now();
  // Recent-first only needs coarse recency. Avoid decrypt/encrypt/write churn when
  // the same credential is autofilled repeatedly during one login flow.
  if (stamp - Number(entry.lastUsedAt || 0) < 60_000) return true;
  entry.lastUsedAt = stamp;
  await writeVault(vault, { countChange: false });
  return true;
}

async function credentialsForHost(host, protocol = 'https:') {
  const settings = await getSettings();
  if (protocol === 'http:' && !settings.allowHttpFill && host !== 'localhost' && host !== '127.0.0.1') return [];
  const vault = await readVault();
  return vault.entries
    .filter(e => hostMatches(host, e.url, settings.subdomainMatch))
    .sort((a, b) => Number(b.favorite) - Number(a.favorite) || Number(b.lastUsedAt || 0) - Number(a.lastUsedAt || 0) || Number(b.updatedAt || 0) - Number(a.updatedAt || 0))
    .map(e => ({ id: e.id, title: e.title, username: e.username, password: e.password, url: e.url, lastUsedAt: Number(e.lastUsedAt || 0) }));
}


async function credentialSummariesForHost(host, protocol = 'https:') {
  const settings = await getSettings();
  if (protocol === 'http:' && !settings.allowHttpFill && host !== 'localhost' && host !== '127.0.0.1') return [];
  const vault = await readVault();
  return vault.entries
    .filter(e => hostMatches(host, e.url, settings.subdomainMatch))
    .sort((a, b) => Number(b.favorite) - Number(a.favorite) || Number(b.lastUsedAt || 0) - Number(a.lastUsedAt || 0) || Number(b.updatedAt || 0) - Number(a.updatedAt || 0))
    .map(e => ({ id: e.id, title: e.title, username: e.username, url: e.url, lastUsedAt: Number(e.lastUsedAt || 0) }));
}

async function credentialForHostById(id, host, protocol = 'https:') {
  if (!id) throw new Error('CREDENTIAL_MISSING');
  const settings = await getSettings();
  if (protocol === 'http:' && !settings.allowHttpFill && host !== 'localhost' && host !== '127.0.0.1') throw new Error('HTTP_FILL_DISABLED');
  const vault = await readVault();
  const entry = vault.entries.find(e => e.id === id);
  if (!entry || !hostMatches(host, entry.url, settings.subdomainMatch)) throw new Error('CREDENTIAL_NOT_ALLOWED');
  return { id:entry.id, title:entry.title, username:entry.username, password:entry.password, url:entry.url, lastUsedAt:Number(entry.lastUsedAt || 0) };
}

async function verifyMasterPassword(password) {
  if (!password) throw new Error('BAD_PASSWORD');
  const core = await LPM_STORE.readCore();
  if (!core.lpMeta?.passwordWrap || !core.lpVault) throw new Error('NOT_SETUP');
  try {
    const pepper = await LPM_STORE.getPepper(core.lpMeta);
    const candidate = await LP.unwrapVaultKeyWithPassword(
      core.lpMeta.passwordWrap,
      password,
      pepper,
      LP.b64ToBytes(core.lpMeta.kdf.salt),
      core.lpMeta.kdf.iterations
    );
    // Verify both the wrapped key and the encrypted vault. This avoids treating
    // a malformed/corrupt metadata record as a successful password check.
    await LP.decryptVault(candidate, core.lpVault);
    return true;
  } catch (e) {
    if (String(e?.message || '').startsWith('BRIDGE_') || ['DEVICE_SECRET_MISSING','SHARED_VAULT_INVALID','SHARED_VAULT_MISSING'].includes(e?.message)) throw e;
    throw new Error('BAD_PASSWORD');
  }
}

async function analyzeCredential(host, protocol, username, password) {
  const settings = await getSettings();
  const vault = await readVault();
  const list = vault.entries
    .filter(e => hostMatches(host, e.url, settings.subdomainMatch))
    .map(e => ({ id: e.id, title: e.title, username: e.username, password: e.password, url: e.url }));
  username = String(username || '');
  password = String(password || '');
  const exactUser = username ? list.filter(e => e.username === username) : list;
  if (exactUser.some(e => e.password === password)) return { state: 'same' };

  let existing = null;
  if (username) existing = exactUser[0] || null;
  else if (list.length === 1) existing = list[0];

  const risk = riskFromEntries(vault.entries, password, existing?.id || '');
  if (existing) return { state: 'changed', existingId: existing.id, title: existing.title, risk };
  return { state: 'new', risk };
}
