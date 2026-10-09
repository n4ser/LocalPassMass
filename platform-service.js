/* LocalPassMass platform integration: permissions, clipboard, Bridge and lifecycle helpers. */
async function health() {
  const vault = await readVault();
  const entries = vault.entries;
  const count = new Map();
  for (const e of entries) if (e.password) count.set(e.password, (count.get(e.password) || 0) + 1);
  const weak = entries.filter(e => e.password && (e.password.length < 10 || /^[0-9]+$/.test(e.password))).map(e => e.id);
  const reused = entries.filter(e => e.password && count.get(e.password) > 1).map(e => e.id);
  const oldCut = now() - 365 * 86400_000;
  const old = entries.filter(e => (e.passwordUpdatedAt || e.updatedAt || 0) < oldCut).map(e => e.id);
  return { total: entries.length, weak, reused, old };
}

async function hasClipboardAutomationPermission() {
  try { return await chrome.permissions.contains({ permissions:['offscreen','clipboardWrite'] }); } catch { return false; }
}

async function ensureOffscreen() {
  if (!(await hasClipboardAutomationPermission()) || !chrome.offscreen) return false;
  if (chrome.offscreen.hasDocument) { if (await chrome.offscreen.hasDocument()) return true; }
  else if (chrome.runtime.getContexts) {
    const contexts = await chrome.runtime.getContexts({ contextTypes:['OFFSCREEN_DOCUMENT'] });
    if (contexts.length) return true;
  }
  await chrome.offscreen.createDocument({ url:'offscreen.html', reasons:['CLIPBOARD'], justification:'Clear a copied password after the user-configured delay.' });
  return true;
}

async function copyWithClear(text) {
  const settings = await getSettings();
  if (settings.clipboardAutoClearEnabled !== true || !(await hasClipboardAutomationPermission())) return { needsClientCopy:true, autoClear:false };
  if (!(await ensureOffscreen())) return { needsClientCopy:true, autoClear:false };
  await chrome.runtime.sendMessage({ target:'offscreen', type:'CLIPBOARD_WRITE', text, clearAfterMs:Math.max(1,Number(settings.clipboardSeconds || 20))*1000 });
  return { needsClientCopy:false, autoClear:true };
}

async function clearClipboard() {
  if (!(await hasClipboardAutomationPermission())) return false;
  if (!(await ensureOffscreen())) return false;
  await chrome.runtime.sendMessage({ target:'offscreen', type:'CLIPBOARD_CLEAR' });
  return true;
}

async function status() {
  const settings = await getSettings();
  const key = await getSessionKey({ touchActivity:false });
  try {
    const core = await LPM_STORE.readCore();
    return { setup:!!core.lpMeta, unlocked:!!key, settings, vaultMode:core.mode, generation:Number(core.generation||0) };
  } catch (e) {
    if (settings.vaultMode === 'shared') return { setup:true, unlocked:false, settings, vaultMode:'shared', bridgeError:e.message || 'BRIDGE_ERROR' };
    throw e;
  }
}

const CONTENT_SCRIPT_ID = 'localpassmass-sites-v1';
async function grantedSiteOrigins() {
  try {
    const all = await chrome.permissions.getAll();
    return (all.origins || []).filter(o => o.startsWith('http://') || o.startsWith('https://'));
  } catch { return []; }
}

async function syncSiteContentScripts() {
  let hasScripting = false;
  try { hasScripting = await chrome.permissions.contains({ permissions:['scripting'] }); } catch (_) {}
  if (!hasScripting) return { origins:await grantedSiteOrigins(), enabled:false };
  try {
    const registered = await chrome.scripting.getRegisteredContentScripts();
    const ids = registered.map(x=>x.id).filter(id=>id===CONTENT_SCRIPT_ID || id.startsWith(CONTENT_SCRIPT_ID+'-'));
    if (ids.length) await chrome.scripting.unregisterContentScripts({ ids });
  } catch (_) {}
  const origins = await grantedSiteOrigins();
  if (!origins.length) return { origins:[], enabled:false };
  const matches = [...new Set(origins)];
  try {
    await chrome.scripting.registerContentScripts([{ id:CONTENT_SCRIPT_ID, matches, js:['account-meta.js','password-generator.js','content-fields.js','content.js'], css:['content.css'], runAt:'document_start', allFrames:true, matchOriginAsFallback:true, persistAcrossSessions:true }]);
  } catch (e) {
    // Filter any stale origins that Chrome no longer accepts and try one-by-one.
    for (let i=0;i<matches.length;i++) {
      try { await chrome.scripting.registerContentScripts([{ id:CONTENT_SCRIPT_ID+'-'+i, matches:[matches[i]], js:['account-meta.js','password-generator.js','content-fields.js','content.js'], css:['content.css'], runAt:'document_start', allFrames:true, matchOriginAsFallback:true, persistAcrossSessions:true }]); } catch (_) {}
    }
  }
  return { origins, enabled:true };
}

async function injectIntoTab(tabId) {
  if (!Number.isInteger(tabId)) throw new Error('TAB_INVALID');
  try { if (!(await chrome.permissions.contains({ permissions:['scripting'] }))) throw new Error('SITE_PERMISSION_REQUIRED'); } catch (e) { if (e?.message === 'SITE_PERMISSION_REQUIRED') throw e; throw new Error('SITE_PERMISSION_REQUIRED'); }
  try { await chrome.scripting.insertCSS({ target:{tabId,allFrames:true}, files:['content.css'] }); } catch (_) {}
  try { await chrome.scripting.executeScript({ target:{tabId,allFrames:true}, files:['account-meta.js','password-generator.js','content-fields.js','content.js'] }); } catch (e) { throw new Error('SITE_INJECT_FAILED'); }
  return true;
}

async function siteAccessStatus() {
  const origins = await grantedSiteOrigins();
  const hasAllHttp = origins.includes('http://*/*');
  const hasAllHttps = origins.includes('https://*/*');
  return { origins, allSites:hasAllHttps, allHttps:hasAllHttps, allHttp:hasAllHttp, count:origins.length };
}

async function bridgeStatus() { return LPM_STORE.bridgeStatus(); }
async function sharedFromPrivate(masterPassword) {
  const result = await LPM_STORE.makeSharedFromPrivate(masterPassword);
  await lockVault();
  return result;
}
async function connectShared() { const result=await LPM_STORE.connectShared(); await lockVault(); return result; }
async function disconnectShared() { await lockVault(); return LPM_STORE.disconnectShared(); }


async function updateSettings(patch = {}) {
  const current = await getSettings();
  const next = { ...current, ...(patch || {}) };
  next.autoLockEnabled = next.autoLockEnabled !== false;
  next.autoLockMinutes = Math.max(1, Math.min(1440, Number(next.autoLockMinutes || 5)));
  next.clipboardSeconds = Math.max(1, Math.min(300, Number(next.clipboardSeconds || 20)));
  next.clipboardAutoClearEnabled = next.clipboardAutoClearEnabled === true;
  next.showSiteIcons = next.showSiteIcons === true;
  next.savePromptSeconds = 30;
  next.language = next.language === 'en' ? 'en' : 'fa';
  next.lockOnSystemLock = next.lockOnSystemLock !== false;
  next.lockOnBrowserClose = next.lockOnBrowserClose !== false;
  next.theme = ['light','dark','system'].includes(next.theme) ? next.theme : 'system';
  next.showSettingsHelp = next.showSettingsHelp === true;
  next.autoBackupEnabled = next.autoBackupEnabled !== false;
  next.autoBackupMaxSnapshots = Math.max(1, Math.min(10, Number(next.autoBackupMaxSnapshots || 5)));

  const requestedSharedPath = String(next.sharedVaultPath || DEFAULT_SETTINGS.sharedVaultPath).slice(0, 512);
  next.sharedVaultPath = current.vaultMode === 'shared' && Object.prototype.hasOwnProperty.call(patch || {}, 'sharedVaultPath')
    ? String(current.sharedVaultPath || DEFAULT_SETTINGS.sharedVaultPath).slice(0, 512)
    : requestedSharedPath;
  next.sharedBackupPath = String(next.sharedBackupPath || DEFAULT_SETTINGS.sharedBackupPath).slice(0, 512);
  next.sharedBackupMax = Math.max(1, Math.min(20, Number(next.sharedBackupMax || 5)));
  next.vaultMode = next.vaultMode === 'shared' ? 'shared' : 'private';

  await chrome.storage.local.set({ lpSettings: next });
  cacheSettings(next);
  try { await ensureAutoLockAlarm(next); } catch (_) {}
  return next;
}

async function migrateSettings() {
  const { lpSettings } = await chrome.storage.local.get('lpSettings');
  const raw = lpSettings || {};
  const next = { ...DEFAULT_SETTINGS, ...raw };
  if (raw.clipboardAutoClearEnabled === undefined) {
    try { next.clipboardAutoClearEnabled = await chrome.permissions.contains({ permissions:['offscreen','clipboardWrite'] }); }
    catch { next.clipboardAutoClearEnabled = false; }
  }
  if (!raw.vaultMode) next.vaultMode = 'private';
  if (!raw.sharedVaultPath) next.sharedVaultPath = DEFAULT_SETTINGS.sharedVaultPath;
  if (!raw.sharedBackupPath) next.sharedBackupPath = DEFAULT_SETTINGS.sharedBackupPath;
  await chrome.storage.local.set({ lpSettings:next });
  cacheSettings(next);
  return next;
}

async function hardenStorageAccess() {
  try { await chrome.storage.local.setAccessLevel({ accessLevel: 'TRUSTED_CONTEXTS' }); } catch (_) {}
  try { await chrome.storage.session.setAccessLevel({ accessLevel: 'TRUSTED_CONTEXTS' }); } catch (_) {}
}

async function ensureAutoLockAlarm(settings = null) {
  try {
    const cfg = settings || await getSettings();
    if (cfg.autoLockEnabled === false) {
      await chrome.alarms.clear('lp-auto-lock');
      return;
    }
    const existing = await chrome.alarms.get('lp-auto-lock');
    if (!existing) await chrome.alarms.create('lp-auto-lock', { periodInMinutes:1 });
  } catch (_) {}
}
