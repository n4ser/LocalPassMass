/* Storage adapter: private Chrome storage or Windows shared vault via Bridge. */
const LPM_STORE = (() => {
  const DEFAULT_SHARED_PATH = '%LOCALAPPDATA%\\LocalPassMass\\vault.lpm';
  const DEFAULT_BACKUP_DIR = '%LOCALAPPDATA%\\LocalPassMass\\Backups';

  async function settings() {
    const { lpSettings } = await chrome.storage.local.get('lpSettings');
    return lpSettings || {};
  }

  async function setVaultMode(modeValue) {
    const { lpSettings } = await chrome.storage.local.get('lpSettings');
    const next = { ...(lpSettings || {}), vaultMode: modeValue === 'shared' ? 'shared' : 'private' };
    await chrome.storage.local.set({ lpSettings: next });
    // core-service.js is loaded after this module, but these functions run only
    // after service-worker initialization has completed. Keep its short-lived
    // settings cache coherent so a mode switch cannot be overwritten by a
    // settings save in the next moment.
    try { if (typeof cacheSettings === 'function') cacheSettings(next); } catch (_) {}
    return next;
  }

  async function mode() {
    const s = await settings();
    return s.vaultMode === 'shared' ? 'shared' : 'private';
  }

  async function sharedConfig() {
    const s = await settings();
    return {
      path: String(s.sharedVaultPath || DEFAULT_SHARED_PATH),
      backupDir: String(s.sharedBackupPath || DEFAULT_BACKUP_DIR),
      backupMax: Math.max(1, Math.min(20, Number(s.sharedBackupMax || 5))),
      backupEnabled: s.autoBackupEnabled !== false
    };
  }

  async function readCore() {
    if ((await mode()) !== 'shared') {
      const { lpMeta, lpVault } = await chrome.storage.local.get(['lpMeta', 'lpVault']);
      return { lpMeta: lpMeta || null, lpVault: lpVault || null, generation: 0, vaultId: null, mode: 'private' };
    }
    const cfg = await sharedConfig();
    const doc = await LPM_BRIDGE.readDocument(cfg.path);
    if (!doc) return { lpMeta: null, lpVault: null, generation: 0, vaultId: null, mode: 'shared' };
    if (doc.format !== 'LocalPassMass-SharedVault' || Number(doc.version) !== 1 || !doc.vaultId) throw new Error('SHARED_VAULT_INVALID');
    return { lpMeta: doc.meta || null, lpVault: doc.vault || null, generation: Number(doc.generation || 0), vaultId: doc.vaultId, mode: 'shared' };
  }

  async function writeCore({ lpMeta, lpVault }, expectedGeneration = null, { backup = true } = {}) {
    if ((await mode()) !== 'shared') {
      await chrome.storage.local.set({ lpMeta, lpVault });
      return { generation: 0, mode: 'private' };
    }
    const cfg = await sharedConfig();
    const current = expectedGeneration == null ? await readCore() : { generation: Number(expectedGeneration || 0) };
    const vaultId = lpMeta?.vaultId || (await readCore()).vaultId;
    if (!vaultId) throw new Error('SHARED_VAULT_ID_MISSING');
    const generation = Number(current.generation || 0) + 1;
    const doc = {
      format: 'LocalPassMass-SharedVault', version: 1, product: 'LocalPassMass',
      vaultId, generation, updatedAt: new Date().toISOString(), meta: { ...lpMeta, vaultId, devicePepper: undefined }, vault: lpVault
    };
    delete doc.meta.devicePepper;
    const result = await LPM_BRIDGE.writeDocument(cfg.path, doc, Number(current.generation || 0), { ...cfg, backupEnabled: backup && cfg.backupEnabled });
    return { generation: Number(result?.generation || generation), mode: 'shared' };
  }

  async function getPepper(meta) {
    if ((await mode()) !== 'shared') {
      if (!meta?.devicePepper) throw new Error('DEVICE_SECRET_MISSING');
      return LP.b64ToBytes(meta.devicePepper);
    }
    const vaultId = meta?.vaultId;
    if (!vaultId) throw new Error('SHARED_VAULT_ID_MISSING');
    const result = await LPM_BRIDGE.getSecret(vaultId);
    if (!result?.secret) throw new Error('DEVICE_SECRET_MISSING');
    return LP.b64ToBytes(result.secret);
  }

  async function makeSharedFromPrivate(masterPassword) {
    if (!masterPassword) throw new Error('PASSWORD_EMPTY');
    const local = await chrome.storage.local.get(['lpMeta', 'lpVault']);
    if (!local.lpMeta || !local.lpVault) throw new Error('NOT_SETUP');
    const oldPepper = LP.b64ToBytes(local.lpMeta.devicePepper);
    let vaultKey;
    try {
      vaultKey = await LP.unwrapVaultKeyWithPassword(local.lpMeta.passwordWrap, masterPassword, oldPepper, LP.b64ToBytes(local.lpMeta.kdf.salt), local.lpMeta.kdf.iterations);
      await LP.decryptVault(vaultKey, local.lpVault);
    } catch { throw new Error('BAD_PASSWORD'); }

    const cfg = await sharedConfig();
    const existing = await LPM_BRIDGE.readDocument(cfg.path);
    if (existing) throw new Error('SHARED_VAULT_EXISTS');
    await LPM_BRIDGE.validatePath(cfg.path);
    const vaultId = crypto.randomUUID();
    const sec = await LPM_BRIDGE.createSecret(vaultId);
    const pepper = LP.b64ToBytes(sec.secret);
    const salt = LP.randomBytes(16);
    const iterations = 600000;
    const meta = {
      ...local.lpMeta, version: Math.max(3, Number(local.lpMeta.version || 2)), vaultId, migratedToSharedAt: Date.now(),
      kdf: { name: 'PBKDF2-SHA256', iterations, salt: LP.bytesToB64(salt) },
      passwordWrap: await LP.wrapVaultKeyWithPassword(vaultKey, masterPassword, pepper, salt, iterations)
    };
    delete meta.devicePepper;
    const doc = { format:'LocalPassMass-SharedVault', version:1, product:'LocalPassMass', vaultId, generation:1, updatedAt:new Date().toISOString(), meta, vault:local.lpVault };
    await LPM_BRIDGE.writeDocument(cfg.path, doc, 0, cfg);
    if (cfg.backupEnabled) { try { await LPM_BRIDGE.send({ op:'snapshot_now', path:cfg.path, backupDir:cfg.backupDir, backupMax:cfg.backupMax, reason:'shared-created' }); } catch (_) {} }
    await setVaultMode('shared');
    return { vaultId, path: cfg.path, generation: 1 };
  }

  async function connectShared() {
    const cfg = await sharedConfig();
    const doc = await LPM_BRIDGE.readDocument(cfg.path);
    if (!doc) throw new Error('SHARED_VAULT_MISSING');
    if (doc.format !== 'LocalPassMass-SharedVault' || !doc.vaultId || !doc.meta || !doc.vault) throw new Error('SHARED_VAULT_INVALID');
    await LPM_BRIDGE.getSecret(doc.vaultId); // verifies this Windows user owns the DPAPI secret.
    await setVaultMode('shared');
    return { vaultId: doc.vaultId, path: cfg.path, generation: Number(doc.generation || 0) };
  }

  async function disconnectShared() {
    await setVaultMode('private');
    return true;
  }

  async function bridgeStatus() {
    const granted = await LPM_BRIDGE.hasPermission();
    if (!granted) return { permission:false, connected:false, mode:await mode(), ...(await sharedConfig()) };
    let ping = null;
    try { ping = await LPM_BRIDGE.ping(); } catch (e) { return { permission:true, connected:false, error:e.message, mode:await mode(), ...(await sharedConfig()) }; }
    const cfg = await sharedConfig();
    let doc = null;
    try { doc = await LPM_BRIDGE.readDocument(cfg.path); } catch (_) {}
    return { permission:true, connected:true, bridge:ping, mode:await mode(), path:cfg.path, backupDir:cfg.backupDir, hasSharedVault:!!doc, vaultId:doc?.vaultId || null, generation:Number(doc?.generation || 0) };
  }

  return { DEFAULT_SHARED_PATH, DEFAULT_BACKUP_DIR, mode, sharedConfig, readCore, writeCore, getPepper, makeSharedFromPrivate, connectShared, disconnectShared, bridgeStatus };
})();
