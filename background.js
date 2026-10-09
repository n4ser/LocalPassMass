/* LocalPassMass service-worker entrypoint. Keep routing small; logic lives in focused modules. */
importScripts('diagnostics.js', 'psl.js', 'crypto.js', 'account-meta.js', 'site-utils.js', 'entry-model.js', 'bridge.js', 'vault-store.js', 'core-service.js', 'locked-inbox.js', 'login-service.js', 'popup-draft-service.js', 'platform-service.js');

const CONTENT_MESSAGES = new Set([
  'GET_SETTINGS', 'GET_FOR_HOST', 'MARK_USED', 'FORM_ACTION_SAFE', 'ANALYZE_CREDENTIAL',
  'SET_PENDING_LOGIN', 'GET_PENDING_LOGIN', 'CONFIRM_LOGIN_SUCCESS', 'SAVE_PENDING_LOGIN',
  'CLEAR_PENDING_LOGIN', 'GET_SITE_RULE', 'IS_KNOWN_CREDENTIAL', 'REQUEST_FILL_CREDENTIAL', 'SET_LOGIN_IDENTITY'
]);

// Serialize state-changing requests so two tabs cannot race a read/modify/write
// cycle and silently overwrite one another in a private vault or locked inbox.
const SERIALIZED_MESSAGES = new Set([
  'SETUP', 'UNLOCK', 'LOCK', 'SAVE_ENTRY', 'DELETE_ENTRY', 'MARK_USED',
  'SET_PENDING_LOGIN', 'GET_PENDING_LOGIN', 'CONFIRM_LOGIN_SUCCESS', 'SAVE_PENDING_LOGIN', 'CLEAR_PENDING_LOGIN', 'SET_LOGIN_IDENTITY',
  'RESET_SITE_RULES', 'IMPORT_BACKUP', 'RECOVER_CURRENT', 'CHANGE_PASSWORD', 'ROTATE_RECOVERY',
  'CREATE_AUTO_SNAPSHOT', 'RESTORE_AUTO_SNAPSHOT', 'SHARED_FROM_PRIVATE', 'SHARED_CONNECT',
  'SHARED_DISCONNECT', 'SET_SETTINGS', 'BULK_IMPORT'
]);
let mutationTail = Promise.resolve();

function serializeMutation(task) {
  const run = mutationTail.then(task, task);
  mutationTail = run.catch(() => undefined);
  return run;
}

async function initialize({ lock = false } = {}) {
  await hardenStorageAccess();
  await migrateSettings();
  await ensureAutoLockAlarm();
  if (lock) await lockVault();
  await syncSiteContentScripts();
}

chrome.runtime.onInstalled.addListener(() => initialize().catch(err => LPM_DIAG.record('installed-init', err)));
chrome.runtime.onStartup.addListener(() => initialize({ lock:true }).catch(err => LPM_DIAG.record('startup-init', err)));
initialize().catch(err => LPM_DIAG.record('initialize', err));

try {
  chrome.permissions.onAdded.addListener(() => syncSiteContentScripts().catch(err => LPM_DIAG.record('permissions-added', err)));
  chrome.permissions.onRemoved.addListener(() => syncSiteContentScripts().catch(err => LPM_DIAG.record('permissions-removed', err)));
} catch (_) {}

chrome.idle?.onStateChanged?.addListener(state => {
  if (state !== 'locked') return;
  (async () => {
    const settings = await getSettings();
    if (settings.lockOnSystemLock !== false) await lockVault();
  })().catch(err => LPM_DIAG.record('system-lock', err));
});
try {
  chrome.windows?.onRemoved?.addListener(() => {
    (async () => {
      const settings = await getSettings();
      if (settings.lockOnBrowserClose === false) return;
      const windows = await chrome.windows.getAll({ windowTypes:['normal'] });
      if (!windows.length) await lockVault();
    })().catch(err => LPM_DIAG.record('browser-close-lock', err));
  });
} catch (_) {}
chrome.alarms.onAlarm.addListener(alarm => {
  if (alarm.name !== 'lp-auto-lock') return;
  getSessionKey({ touchActivity:false }).catch(err => LPM_DIAG.record('auto-lock-alarm', err));
});
chrome.commands.onCommand.addListener(command => {
  if (command !== 'lock-vault') return;
  lockVault().catch(err => LPM_DIAG.record('lock-command', err));
});

function requestContext(sender) {
  const page = LPM_SITE.senderPage(sender);
  const extensionOrigin = chrome.runtime.getURL('');
  const trustedExtension = sender?.id === chrome.runtime.id && String(sender?.url || '').startsWith(extensionOrigin);
  return { page, trustedExtension };
}

async function dispatchMessage(msg, sender) {
  const type = String(msg?.type || '');
  const { page, trustedExtension } = requestContext(sender);
  if (page && !CONTENT_MESSAGES.has(type)) throw new Error('UNTRUSTED_PAGE_MESSAGE');
  if (!page && !trustedExtension) throw new Error('UNTRUSTED_EXTENSION_MESSAGE');
  const requirePage = () => { if (!page) throw new Error('UNTRUSTED_PAGE_MESSAGE'); return page; };

  switch (type) {
    case 'STATUS': return status();
    case 'SETUP': return setupVault(msg.password);
    case 'UNLOCK': return unlock(msg.password, msg.grace || 0);
    case 'LOCK': return lockVault();
    case 'LIST': return listEntries();
    case 'SAVE_ENTRY': return saveEntry(msg.entry || {});
    case 'DELETE_ENTRY': return deleteEntry(msg.id);
    case 'GET_FOR_HOST': { const p=requirePage(); return credentialSummariesForHost(p.host,p.protocol); }
    case 'REQUEST_FILL_CREDENTIAL': { const p=requirePage(); return { credential:await credentialForHostById(msg.id,p.host,p.protocol), needsReprompt:false }; }
    case 'MARK_USED': { const p=requirePage(); return markEntryUsed(msg.id,p.host,p.protocol); }
    case 'FORM_ACTION_SAFE': { const p=requirePage(); return formActionSafe(p.host,msg.actionUrl,msg.credentialUrl); }
    case 'PASSWORD_RISK': return passwordRisk(msg.password,msg.excludeId);
    case 'ANALYZE_CREDENTIAL': { const p=requirePage(); return analyzeCredential(p.host,p.protocol,msg.username,msg.password); }
    case 'SET_LOGIN_IDENTITY': { const p=requirePage(); return setPendingIdentity(msg.value||'',p.host,p.tabId); }
    case 'SET_PENDING_LOGIN': { const p=requirePage(); return setPendingLogin(msg.entry||{},p.host,p.protocol,p.url,p.tabId,p.frameId,msg.captureMode||'active'); }
    case 'GET_PENDING_LOGIN': { const p=requirePage(); return readPending(p.host,{tabId:p.tabId,frameId:p.frameId}); }
    case 'CONFIRM_LOGIN_SUCCESS': { const p=requirePage(); return confirmLoginSuccess(p.host,p.protocol,p.url,msg.evidence,p.tabId,p.frameId); }
    case 'SAVE_PENDING_LOGIN': { const p=requirePage(); return savePendingLogin(p.host,msg.remember||'',p.tabId,p.frameId); }
    case 'CLEAR_PENDING_LOGIN': { const p=requirePage(); return clearPendingLogin(p.host,msg.siteRule||'',p.tabId,p.frameId); }
    case 'GET_SITE_RULE': { const p=requirePage(); return getSiteRule(p.host); }
    case 'RESET_SITE_RULES': return resetSiteRules();
    case 'COPY': return copyWithClear(String(msg.text || ''));
    case 'EXPORT_BACKUP': return exportBackup();
    case 'IMPORT_BACKUP': return importBackup(msg.backupText,msg.recoveryText,msg.newPassword);
    case 'RECOVER_CURRENT': return recoverCurrentVault(msg.recoveryText,msg.newPassword);
    case 'TEST_RECOVERY_KEY': return testRecoveryKey(msg.recoveryText);
    case 'CHANGE_PASSWORD': return changePassword(msg.newPassword);
    case 'ROTATE_RECOVERY': return rotateRecoveryKey();
    case 'GET_SETTINGS': return getSettings();
    case 'SAVE_POPUP_DRAFT': return savePopupDraft(msg.draft || {});
    case 'GET_POPUP_DRAFT': return getPopupDraft();
    case 'CLEAR_POPUP_DRAFT': return clearPopupDraft();
    case 'SET_SETTINGS': return updateSettings(msg.settings || {});
    case 'BULK_IMPORT': return bulkImportEntries(msg.entries || []);
    case 'GET_BACKUP_STATUS': return getBackupState();
    case 'GET_LOCKED_INBOX_STATUS': return getLockedInboxStatus();
    case 'GET_AUTO_BACKUP_STATUS': return getAutoBackupStatus();
    case 'CREATE_AUTO_SNAPSHOT': return createAutoSnapshot(msg.reason||'manual',{force:true});
    case 'RESTORE_AUTO_SNAPSHOT': return restoreAutoSnapshot(msg.id||'');
    case 'SITE_ACCESS_STATUS': return siteAccessStatus();
    case 'SYNC_SITE_ACCESS': return syncSiteContentScripts();
    case 'INJECT_CURRENT_TAB': return injectIntoTab(Number(msg.tabId));
    case 'BRIDGE_STATUS': return bridgeStatus();
    case 'SHARED_FROM_PRIVATE': return sharedFromPrivate(msg.masterPassword);
    case 'SHARED_CONNECT': return connectShared();
    case 'SHARED_DISCONNECT': return disconnectShared();
    case 'EXTENSION_INFO': return { id:chrome.runtime.id, version:chrome.runtime.getManifest().version };
    case 'HEALTH': return health();
    case 'IS_KNOWN_CREDENTIAL': {
      const p=requirePage();
      const list=await credentialsForHost(p.host,p.protocol);
      return list.some(e=>e.username===String(msg.username||'') && e.password===String(msg.password||''));
    }
    default: throw new Error('UNKNOWN_MESSAGE');
  }
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg?.target === 'offscreen') return false;
  const task = () => dispatchMessage(msg, sender);
  const work = SERIALIZED_MESSAGES.has(String(msg?.type || '')) ? serializeMutation(task) : task();
  work.then(data=>sendResponse({ok:true,data})).catch(err=>{ LPM_DIAG.record(`rpc:${String(msg?.type||'UNKNOWN')}`, err); sendResponse({ok:false,error:err.message||'ERROR'}); });
  return true;
});
