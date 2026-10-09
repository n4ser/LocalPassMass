const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];

const state = {
  entries: [],
  recoveryKeyText: '',
  health: null,
  backup: null,
  autoBackups: null,
  editingEntry: null,
  language: 'fa',
  theme: 'system',
  settings: null,
  bridge: null,
  siteAccess: null,
  currentSite: null,
  siteIconsGranted: false,
  activeTab: 'vault',
  draftRestoring: false,
  draftTimer: null,
  draftSaving: false,
  draftDirty: false,
  siteFilterMode: 'auto'
};

function t(key, arg) {
  const value = I18N[state.language]?.[key] ?? I18N.fa[key] ?? key;
  return typeof value === 'function' ? value(arg) : value;
}

const UI_ICONS = Object.freeze({
  user:'<svg class="ui-icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="3.2"></circle><path d="M5.5 19c.8-3.1 3-5 6.5-5s5.7 1.9 6.5 5"></path></svg>',
  copy:'<svg class="ui-icon" viewBox="0 0 24 24" aria-hidden="true"><rect x="8" y="8" width="11" height="11" rx="2"></rect><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"></path></svg>',
  share:'<svg class="ui-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M14 5h5v5"></path><path d="m19 5-8 8"></path><path d="M18 13v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h5"></path></svg>',
  edit:'<svg class="ui-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="m4 20 4.3-1 9.6-9.6-3.3-3.3L5 15.7 4 20Z"></path><path d="m13.8 6.9 3.3 3.3"></path></svg>',
  eye:'<svg class="ui-icon eye-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z"></path><circle cx="12" cy="12" r="2.5"></circle></svg>'
});
function setIconButton(button, icon, label, extraClass='') {
  button.innerHTML = UI_ICONS[icon] || '';
  if (extraClass) button.classList.add(extraClass);
  button.title = label || '';
  button.setAttribute('aria-label', label || '');
}

async function rpc(type, payload = {}) {
  const response = await chrome.runtime.sendMessage({ type, ...payload });
  if (!response?.ok) throw new Error(response?.error || 'ERROR');
  return response.data;
}

async function copySecure(text) {
  const value=String(text||'');
  const result=await rpc('COPY',{text:value});
  if(result?.needsClientCopy){
    if(navigator.clipboard?.writeText) await navigator.clipboard.writeText(value);
    else {
      const ta=document.createElement('textarea'); ta.value=value; ta.style.position='fixed'; ta.style.opacity='0'; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); ta.remove();
    }
  }
  return { autoClear:result?.autoClear===true };
}

async function currentTabInfo(){
  const [tab]=await chrome.tabs.query({active:true,currentWindow:true});
  if(!tab?.id) throw new Error('SITE_UNSUPPORTED');
  let href=tab.url||'';
  if(!/^https?:/i.test(href)){
    try{const r=await chrome.scripting.executeScript({target:{tabId:tab.id},func:()=>location.href});href=r?.[0]?.result||'';}catch{}
  }
  const u=new URL(href);
  if(!['http:','https:'].includes(u.protocol)) throw new Error('SITE_UNSUPPORTED');
  const scope=(typeof LP_PSL!=='undefined'&&LP_PSL.registrableDomain)?(LP_PSL.registrableDomain(u.hostname)||u.hostname):u.hostname;
  const isIp=/^(?:\d{1,3}\.){3}\d{1,3}$/.test(scope)||scope==='localhost'||scope.includes(':');
  const hostPattern=isIp?u.hostname:`*.${scope}`;
  const safePageUrl=LPM_ACCOUNT_META.safeUrl(u.href)||u.origin;
  return {
    tabId:tab.id,
    url:safePageUrl,
    rawUrl:u.href,
    title:String(tab.title||'').slice(0,300),
    host:u.hostname,
    suggestedTitle:LPM_ACCOUNT_META.makeTitle(tab.title||'',u.hostname),
    pattern:`${u.protocol}//${hostPattern}/*`
  };
}

function setPill(el,text,kind='neutral'){if(!el)return;el.textContent=text;el.className=`status-pill ${kind}`;}

async function refreshSiteAccessUI({ refreshTab = false } = {}){
  if(refreshTab || !state.currentSite){try{ state.currentSite=await currentTabInfo(); }catch{ state.currentSite=null; }}
  try{
    state.siteAccess=await rpc('SITE_ACCESS_STATUS');
    if(state.siteAccess.allSites)setPill($('#siteAccessPill'),t('siteAccessAll'),'good');
    else if(state.siteAccess.count)setPill($('#siteAccessPill'),t('siteAccessSome',state.siteAccess.count),'warn2');
    else setPill($('#siteAccessPill'),t('siteAccessNone'),'neutral');
  }catch{setPill($('#siteAccessPill'),'—','neutral');}
  renderSetupStrip();
}

async function refreshBridgeUI(){
  const pill=$('#bridgeStatusPill'), title=$('#sharedWizardTitle'), help=$('#sharedWizardHelp'), quick=$('#sharedQuickBtn'), disconnect=$('#disconnectSharedBtn');
  try{
    state.bridge=await rpc('BRIDGE_STATUS');
    const mode=state.bridge.mode==='shared'?'shared':'private';
    const helperReady=!!state.bridge.connected;
    const hasShared=!!state.bridge.hasSharedVault;
    if(mode==='shared'){
      setPill(pill,t('sharedMode'),'good');
      title.textContent=t('sharedWizardActiveTitle'); help.textContent=t('sharedWizardActiveHelp');
      quick.textContent=t('sharedActiveSimple'); quick.disabled=true;
      disconnect.classList.remove('hidden');
    }else if(!state.bridge.permission){
      setPill(pill,t('privateMode'),'neutral');
      title.textContent=t('sharedWizardPrivateTitle'); help.textContent=t('sharedWizardPrivateHelp');
      quick.textContent=t('sharedEnableSimple'); quick.disabled=false; disconnect.classList.add('hidden');
    }else if(!helperReady){
      setPill(pill,t('bridgeMissing'),'warn2');
      title.textContent=t('sharedWizardHelperTitle'); help.textContent=t('sharedWizardHelperHelp');
      quick.textContent=t('sharedEnableSimple'); quick.disabled=false; disconnect.classList.add('hidden');
    }else if(hasShared){
      setPill(pill,t('bridgeReady'),'good');
      title.textContent=t('sharedWizardExistingTitle'); help.textContent=t('sharedWizardExistingHelp');
      quick.textContent=t('sharedConnectSimple'); quick.disabled=false; disconnect.classList.add('hidden');
    }else{
      setPill(pill,t('bridgeReady'),'good');
      title.textContent=t('sharedWizardReadyTitle'); help.textContent=t('sharedWizardReadyHelp');
      quick.textContent=t('sharedCreateSimple'); quick.disabled=false; disconnect.classList.add('hidden');
    }
    $('#sharedVaultPath').disabled=mode==='shared';
  }catch{
    setPill(pill,t('bridgeUnavailable'),'bad');
    title.textContent=t('sharedWizardHelperTitle'); help.textContent=t('sharedWizardHelperHelp');
    quick.textContent=t('sharedEnableSimple'); quick.disabled=false; disconnect.classList.add('hidden');
  }
}

async function saveSharedConfig(){
  const vaultPath=$('#sharedVaultPath').value || state.settings?.sharedVaultPath || '%LOCALAPPDATA%\\LocalPassMass\\vault.lpm';
  const backupPath=$('#sharedBackupPath').value || state.settings?.sharedBackupPath || '%LOCALAPPDATA%\\LocalPassMass\\Backups';
  const backupMax=Number($('#sharedBackupMax').value) || Number(state.settings?.sharedBackupMax) || 5;
  state.settings=await rpc('SET_SETTINGS',{settings:{sharedVaultPath:vaultPath,sharedBackupPath:backupPath,sharedBackupMax:backupMax}});
}

function applyTheme(theme = 'system') {
  const value = ['light','dark','system'].includes(theme) ? theme : 'system';
  state.theme = value;
  const dark = value === 'dark' || (value === 'system' && window.matchMedia?.('(prefers-color-scheme: dark)').matches);
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  if ($('#themeSelect')) $('#themeSelect').value = value;
}

function applySettingsHelp(show) {
  const enabled = show === true;
  $('#tab-settings')?.classList.toggle('show-help', enabled);
  if ($('#showSettingsHelp')) $('#showSettingsHelp').checked = enabled;
}

function updateAutoLockControls() {
  const enabled = $('#autoLockEnabled')?.checked !== false;
  if ($('#autoLockMinutes')) $('#autoLockMinutes').disabled = !enabled;
  $('#autoLockTimeRow')?.classList.toggle('is-disabled', !enabled);
}

function applyLanguage(lang) {
  state.language = lang === 'en' ? 'en' : 'fa';
  document.documentElement.lang = state.language;
  document.documentElement.dir = state.language === 'en' ? 'ltr' : 'rtl';
  if ($('#languageSelect')) $('#languageSelect').value = state.language;
  $$('[data-i18n]').forEach(el => { el.textContent = t(el.dataset.i18n); });
  $$('[data-i18n-html]').forEach(el => { el.innerHTML = t(el.dataset.i18nHtml); });
  $$('[data-i18n-placeholder]').forEach(el => { el.placeholder = t(el.dataset.i18nPlaceholder); });
  $$('[data-i18n-title]').forEach(el => { el.title = t(el.dataset.i18nTitle); });
  $$('[data-i18n-aria]').forEach(el => { el.setAttribute('aria-label', t(el.dataset.i18nAria)); });
  if (state.entries.length) renderEntries();
  if (state.health) renderHealth();
  if (state.backup) renderBackup();
  if (state.autoBackups) renderAutoBackupStatus();
}

function showOnly(viewId) {
  ['loadingView', 'setupView', 'recoveryView', 'restoreView', 'recoverView', 'sharedErrorView', 'unlockView', 'mainView']
    .forEach(id => $('#' + id).classList.toggle('hidden', id !== viewId));
  $('#lockBtn').classList.toggle('hidden', viewId !== 'mainView');
}

function toast(message, type = 'success') {
  const el = $('#toast');
  el.textContent = message;
  el.className = `toast is-${type}`;
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => el.classList.add('hidden'), 2400);
}

function errorText(code) {
  return ({
    BAD_PASSWORD:t('badPassword'), PASSWORD_EMPTY:t('passwordEmpty'), RECOVERY_FAILED:t('recoveryFailed'),
    BACKUP_INVALID:t('backupInvalid'), RECOVERY_KEY_INVALID:t('recoveryInvalid'), LOCKED:t('locked'),
    BRIDGE_PERMISSION_REQUIRED:t('sharedPermissionDenied'), BRIDGE_NOT_INSTALLED:t('bridgeMissing'), BRIDGE_PROFILE_NOT_REGISTERED:t('helperStillMissing'), BRIDGE_UNAVAILABLE:t('bridgeUnavailable'),
    SHARED_VAULT_EXISTS:t('sharedVaultExists'), SHARED_VAULT_MISSING:t('sharedVaultMissing'), VAULT_CONFLICT:t('vaultConflict'),
    SHARED_VAULT_CHANGED_REUNLOCK:t('sharedChanged'), DEVICE_SECRET_MISSING:t('bridgeUnavailable'), SITE_UNSUPPORTED:t('siteUnsupported'), SITE_INJECT_FAILED:t('siteUnsupported')
  })[code] || t('failed');
}

function downloadText(name, text, type = 'text/plain') {
  const blob = new Blob([text], { type });
  const anchor = document.createElement('a');
  anchor.href = URL.createObjectURL(blob);
  anchor.download = name;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(anchor.href), 1000);
}

function recoveryFileText(key) {
  if (state.language === 'en') {
    return `LocalPassMass Recovery Key\n===========================\n\n${key}\n\nKeep this key separate from the backup file.\nA LocalPassMass backup cannot be restored without this key.\nDo not store the Recovery Key and backup in the same place.\n`;
  }
  return `LocalPassMass Recovery Key\n===========================\n\n${key}\n\nاین کلید را جدا از فایل Backup نگه دارید.\nبدون این کلید، Backup خروجی LocalPassMass قابل بازیابی نیست.\nRecovery Key و Backup را در یک محل نگه ندارید.\n`;
}

function element(tag, className, text) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (text !== undefined) el.textContent = text;
  return el;
}

function switchTab(name, { persist = true } = {}) {
  name = ['vault','generator','guide','settings'].includes(name) ? name : 'vault';
  state.activeTab = name;
  $$('.tab').forEach(tab => tab.classList.toggle('active', tab.dataset.tab === name));
  $$('.tabpage').forEach(page => page.classList.add('hidden'));
  $('#tab-' + name)?.classList.remove('hidden');
  if (persist) schedulePopupDraft();
}


function collectPopupDraft() {
  const modalOpen = !$('#modal').classList.contains('hidden');
  return {
    activeTab: state.activeTab,
    search: $('#searchInput')?.value || '',
    entry: modalOpen ? { open:true, ...currentEntryForm() } : null,
    generator: {
      length:Number($('#lengthRange')?.value || 20),
      upper:$('#genUpper')?.checked !== false,
      lower:$('#genLower')?.checked !== false,
      number:$('#genNumber')?.checked !== false,
      symbol:$('#genSymbol')?.checked !== false,
      value:$('#generatedPassword')?.value || ''
    }
  };
}

async function savePopupDraftNow() {
  if (state.draftRestoring || $('#mainView').classList.contains('hidden')) return;
  clearTimeout(state.draftTimer); state.draftTimer = null;
  state.draftDirty = true;
  if (state.draftSaving) return;
  state.draftSaving = true;
  try {
    // Coalesce rapid typing into the latest encrypted snapshot instead of
    // building a backlog of crypto/storage work behind the popup.
    while (state.draftDirty) {
      state.draftDirty = false;
      const draft = collectPopupDraft();
      try { await rpc('SAVE_POPUP_DRAFT', { draft }); } catch (_) {}
    }
  } finally { state.draftSaving = false; }
}

function schedulePopupDraft(delay = 65) {
  if (state.draftRestoring || $('#mainView').classList.contains('hidden')) return;
  clearTimeout(state.draftTimer);
  state.draftTimer = setTimeout(savePopupDraftNow, Math.max(0, delay));
}

async function clearPopupDraft() {
  clearTimeout(state.draftTimer);
  state.draftTimer = null;
  state.draftDirty = false;
  // If a write is already in flight, clearing through the background draft
  // queue guarantees the clear happens after that write.
  try { await rpc('CLEAR_POPUP_DRAFT'); } catch (_) {}
}

async function restorePopupDraft() {
  let draft = null;
  try { draft = await rpc('GET_POPUP_DRAFT'); } catch (_) {}
  if (!draft) return;
  state.draftRestoring = true;
  try {
    if ($('#searchInput')) $('#searchInput').value = draft.search || '';
    if (draft.generator) {
      $('#lengthRange').value = Math.max(4, Math.min(128, Number(draft.generator.length || 20)));
      $('#genUpper').checked = draft.generator.upper !== false;
      $('#genLower').checked = draft.generator.lower !== false;
      $('#genNumber').checked = draft.generator.number !== false;
      $('#genSymbol').checked = draft.generator.symbol !== false;
      $('#lengthValue').textContent = $('#lengthRange').value;
      $('#generatedPassword').value = draft.generator.value || generatePassword();
    }
    switchTab(draft.activeTab || 'vault', { persist:false });
    renderEntries();
    if (draft.entry?.open) {
      const base = draft.entry.id ? state.entries.find(item => item.id === draft.entry.id) || null : null;
      openEntry(base, { persist:false, prefill:false });
      $('#entryId').value = draft.entry.id || '';
      $('#entryTitle').value = draft.entry.title || '';
      $('#entryUrl').value = draft.entry.url || '';
      $('#entryUsername').value = draft.entry.username || '';
      $('#entryTags').value = LPM_ACCOUNT_META.tagsText(draft.entry.tags || []);
      $('#entryPassword').value = draft.entry.password || '';
      $('#entryNotes').value = draft.entry.notes || '';
      $('#entryFavorite').checked = draft.entry.favorite === true;
    }
  } finally { state.draftRestoring = false; }
}

async function boot() {
  try {
    state.settings = await rpc('GET_SETTINGS');
    applyTheme(state.settings?.theme || 'system');
    applyLanguage(state.settings?.language || 'fa');
    applySettingsHelp(state.settings?.showSettingsHelp === true);
    const status = await rpc('STATUS');
    if (status.bridgeError) { showOnly('sharedErrorView'); toast(errorText(status.bridgeError),'error'); return; }
    if (status.vaultMode === 'shared' && !status.setup) { showOnly('sharedErrorView'); toast(t('sharedFileMissing'),'error'); return; }
    if (!status.setup) return showOnly('setupView');
    if (!status.unlocked) return showOnly('unlockView');
    showOnly('mainView');
    await loadMain();
    await maybeShowFirstSetupChecklist();
  } catch {
    showOnly('unlockView');
  }
}

async function loadMain() {
  // Fetch independent state in parallel. This removes several sequential
  // service-worker round trips from every popup open/reopen.
  const [entries, settings, health, backup, autoBackups, currentSite] = await Promise.all([
    rpc('LIST'), rpc('GET_SETTINGS'), rpc('HEALTH').catch(()=>null),
    rpc('GET_BACKUP_STATUS').catch(()=>null), rpc('GET_AUTO_BACKUP_STATUS').catch(()=>null),
    currentTabInfo().catch(()=>null)
  ]);
  state.entries = entries || [];
  state.settings = settings || {};
  state.health = health;
  state.backup = backup;
  state.autoBackups = autoBackups;
  state.currentSite = currentSite;
  state.siteFilterMode = 'auto';

  applyTheme(state.settings.theme || 'system');
  applyLanguage(state.settings.language || 'fa');
  applySettingsHelp(state.settings.showSettingsHelp === true);
  $('#autoLockEnabled').checked = state.settings.autoLockEnabled !== false;
  $('#autoLockMinutes').value = state.settings.autoLockMinutes;
  $('#clipboardSeconds').value = state.settings.clipboardSeconds;
  $('#clipboardAutoClearEnabled').checked = state.settings.clipboardAutoClearEnabled === true;
  $('#showSiteIcons').checked = state.settings.showSiteIcons === true;
  try { state.siteIconsGranted = await chrome.permissions.contains({ permissions:['favicon'] }); } catch { state.siteIconsGranted = false; }
  if (!state.siteIconsGranted && state.settings.showSiteIcons) { $('#showSiteIcons').checked=false; state.settings.showSiteIcons=false; }
  $('#subdomainMatch').checked = state.settings.subdomainMatch;
  $('#allowHttpFill').checked = state.settings.allowHttpFill;
  $('#savePrompt').checked = state.settings.savePrompt;
  $('#lockOnSystemLock').checked = state.settings.lockOnSystemLock !== false;
  $('#lockOnBrowserClose').checked = state.settings.lockOnBrowserClose !== false;
  $('#autoBackupEnabled').checked = state.settings.autoBackupEnabled !== false;
  $('#autoBackupMaxSnapshots').value = state.settings.autoBackupMaxSnapshots || 5;
  $('#sharedVaultPath').value = state.settings.sharedVaultPath || '%LOCALAPPDATA%\\LocalPassMass\\vault.lpm';
  $('#sharedBackupPath').value = state.settings.sharedBackupPath || '%LOCALAPPDATA%\\LocalPassMass\\Backups';
  $('#sharedBackupMax').value = state.settings.sharedBackupMax || 5;
  $('#languageSelect').value = state.language;
  $('#themeSelect').value = state.settings.theme || 'system';
  updateAutoLockControls();
  renderEntries(); renderHealth(); renderBackup(); renderAutoBackupStatus();

  // These are UI-only status checks and can run together after settings exist.
  await Promise.all([refreshSiteAccessUI(), refreshBridgeUI()]);
  generatePassword();
  await restorePopupDraft();
}

function setupOutstanding() {
  const needsSiteAccess = !state.siteAccess || Number(state.siteAccess.count || 0) === 0;
  const needsBackup = state.entries.length > 0 && !state.backup?.lastBackupAt;
  return { needsSiteAccess, needsBackup, count:Number(needsSiteAccess)+Number(needsBackup) };
}

function renderSetupStrip() {
  const el=$('#setupStrip'); if(!el)return;
  const info=setupOutstanding();
  if(!info.count){el.classList.add('hidden');return;}
  el.textContent = info.needsSiteAccess ? t('setupNeedsSiteAccess') : t('setupNeedsBackup');
  el.classList.remove('hidden');
}

function setupChecklistDialog() {
  const info=setupOutstanding(); const wrap=element('div','setup-checklist');
  const intro=element('div','confirm-copy',t('setupChecklistHelp')); wrap.appendChild(intro);
  const site=element('div','checklist-item');
  const siteText=element('div','checklist-copy'); siteText.append(element('strong','',t('setupSiteAccessTitle')),element('small','',info.needsSiteAccess?t('setupSiteAccessMissing'):t('setupSiteAccessReady')));
  const siteActions=element('div','checklist-actions');
  if(info.needsSiteAccess){
    const all=element('button','primary small',t('allowAllSites')); all.type='button'; all.addEventListener('click',async()=>{await enableAllSites();closeSimple();setupChecklistDialog();});
    const current=element('button','ghost small',t('allowCurrentSite')); current.type='button'; current.addEventListener('click',async()=>{await enableCurrentSite();closeSimple();setupChecklistDialog();});
    siteActions.append(all,current);
  } else siteActions.append(element('span','check-ok','✓'));
  site.append(siteText,siteActions); wrap.appendChild(site);

  const backup=element('div','checklist-item');
  const backupText=element('div','checklist-copy'); backupText.append(element('strong','',t('setupBackupTitle')),element('small','',info.needsBackup?t('setupBackupMissing'):t('setupBackupReady')));
  const backupActions=element('div','checklist-actions');
  if(info.needsBackup){const make=element('button','ghost small',t('makeBackupNow'));make.type='button';make.addEventListener('click',()=>{closeSimple();$('#exportBackupBtn').click();});backupActions.append(make);} else backupActions.append(element('span','check-ok','✓'));
  backup.append(backupText,backupActions); wrap.appendChild(backup);
  wrap.appendChild(element('div','setup-optional-note',t('setupOptionalPermissions')));
  openSimple(t('completeSetup'),wrap);
}

async function maybeShowFirstSetupChecklist() {
  try {
    const key='lpSetupChecklistV110Seen';
    const stored=await chrome.storage.local.get(key);
    if(stored?.[key]) return;
    await chrome.storage.local.set({[key]:true});
    if(setupOutstanding().count) setTimeout(setupChecklistDialog,90);
  } catch (_) {}
}

function renderHealth() {
  const health = state.health;
  const el = $('#healthStrip');
  if (!health || (!health.weak.length && !health.reused.length && !health.old.length)) {
    el.classList.add('hidden'); return;
  }
  const parts = [];
  if (health.reused.length) parts.push(t('duplicateCount', health.reused.length));
  if (health.weak.length) parts.push(t('weakCount', health.weak.length));
  if (health.old.length) parts.push(t('oldCount', health.old.length));
  el.textContent = `Password Health · ${parts.join(' • ')}`;
  el.classList.remove('hidden');
}

function renderBackup() {
  const el = $('#backupStrip');
  const backup = state.backup || { lastBackupAt: null, changesSinceBackup: 0 };
  if (!state.entries.length) { el.classList.add('hidden'); renderSetupStrip(); return; }
  const changes = Number(backup.changesSinceBackup || 0);
  let text = '';
  if (!backup.lastBackupAt) text = t('noBackup');
  else if (changes >= 5) text = t('changesBackup', changes);
  else if (Date.now() - Number(backup.lastBackupAt) > 7 * 86400_000) text = t('oldBackup');
  if (!text) { el.classList.add('hidden'); renderSetupStrip(); return; }
  el.textContent = text + '  ←';
  el.classList.remove('hidden');
  renderSetupStrip();
}

function renderAutoBackupStatus() {
  const el = $('#autoBackupStatus');
  if (!el) return;
  const count = Number(state.autoBackups?.count || 0);
  el.textContent = count ? t('autoBackupCount', count) : t('autoBackupStatusEmpty');
}

function shareEntryText(entry) {
  return LPM_POPUP_UTILS.shareEntryText(entry);
}

async function shareEntry(entry) {
  try {
    const r=await copySecure(shareEntryText(entry));
    toast(r.autoClear?t('sharedCopied'):t('sharedCopiedPlain'),'success');
  } catch (error) { toast(errorText(error.message), 'error'); }
}

function autoBackupDialog() {
  const status = state.autoBackups || { snapshots: [] };
  const wrap = element('div');
  const create = element('button', 'primary wide tight', t('createSnapshot'));
  create.type = 'button';
  create.addEventListener('click', async () => {
    try {
      state.autoBackups = await rpc('CREATE_AUTO_SNAPSHOT', { reason:'manual' });
      renderAutoBackupStatus(); closeSimple(); autoBackupDialog();
      toast(t('backupMade'), 'success');
    } catch (error) { toast(errorText(error.message), 'error'); }
  });
  wrap.appendChild(create);
  const snapshots = Array.isArray(status.snapshots) ? status.snapshots : [];
  if (!snapshots.length) wrap.appendChild(element('div', 'confirm-copy', t('noSnapshots')));
  const locale = state.language === 'en' ? 'en-US' : 'fa-IR';
  snapshots.forEach(snapshot => {
    const row = element('div', 'snapshot-row');
    const meta = element('div', 'snapshot-meta');
    meta.append(element('strong','',new Date(snapshot.createdAt).toLocaleString(locale)), element('small','',snapshot.reason || 'change'));
    const restore = element('button', 'ghost small', t('restoreSnapshot'));
    restore.type = 'button';
    restore.addEventListener('click', () => confirmAction({ title:t('snapshotQuestion'), message:t('snapshotMessage'), confirmText:t('restore'), onConfirm:async()=>{
      try { await rpc('RESTORE_AUTO_SNAPSHOT', { id:snapshot.id }); closeSimple(); await loadMain(); toast(t('snapshotRestored'),'success'); }
      catch(error){ toast(errorText(error.message),'error'); }
    }}));
    row.append(meta, restore); wrap.appendChild(row);
  });
  openSimple(t('autoBackupManager'), wrap);
}

function faviconUrl(entry) {
  if (!state.settings?.showSiteIcons || !state.siteIconsGranted || !entry?.url) return '';
  try {
    const url = new URL(chrome.runtime.getURL('_favicon/'));
    url.searchParams.set('pageUrl', entry.url);
    url.searchParams.set('size', '32');
    return url.toString();
  } catch { return ''; }
}

function hostFromUrl(value) {
  try { return new URL(String(value||'').includes('://') ? String(value||'') : `https://${String(value||'')}`).hostname.toLowerCase().replace(/^www\./,''); }
  catch { return ''; }
}

function siteScopeForHost(host) {
  const clean=String(host||'').toLowerCase().replace(/^www\./,'');
  if(!clean)return '';
  try{return (typeof LP_PSL!=='undefined'&&LP_PSL.registrableDomain)?(LP_PSL.registrableDomain(clean)||clean):clean;}catch{return clean;}
}

function entryMatchesCurrentSite(entry) {
  if(!state.currentSite?.host)return false;
  const entryHost=hostFromUrl(entry?.url); if(!entryHost)return false;
  const current=String(state.currentSite.host||'').toLowerCase().replace(/^www\./,'');
  if(state.settings?.subdomainMatch===false)return entryHost===current;
  return siteScopeForHost(entryHost)===siteScopeForHost(current);
}

function siteFilteredEntries() {
  const matching=state.entries.filter(entryMatchesCurrentSite);
  const useSite=matching.length>0 && state.siteFilterMode!=='all';
  return { matching, useSite, base:useSite?matching:state.entries };
}

function renderSiteFilterBar(matching,useSite){
  const bar=$('#siteFilterBar'), text=$('#siteFilterText'), toggle=$('#siteFilterToggle');
  if(!bar||!text||!toggle)return;
  if(!state.currentSite?.host||!matching.length){bar.classList.add('hidden');return;}
  bar.classList.remove('hidden');
  text.textContent=useSite?t('siteAccounts',matching.length):t('allAccounts',state.entries.length);
  toggle.textContent=useSite?t('showAll'):t('showThisSite');
}

function renderEntries() {
  const query = $('#searchInput').value.trim().toLocaleLowerCase();
  const {matching,useSite,base}=siteFilteredEntries();
  const items = base.filter(entry => [entry.title, entry.username, entry.url, ...(entry.tags || [])].join(' ').toLocaleLowerCase().includes(query));
  renderSiteFilterBar(matching,useSite);
  const list = $('#entryList');
  list.textContent = '';
  $('#emptyState').classList.toggle('hidden', items.length > 0);

  for (const entry of items) {
    const row = element('div', 'entry');
    const icon = element('div', 'entry-icon', (entry.title || '?').trim()[0] || '?');
    const favUrl=faviconUrl(entry);
    if (favUrl) {
      const img=document.createElement('img'); img.alt=''; img.loading='lazy'; img.decoding='async'; img.referrerPolicy='no-referrer'; img.src=favUrl;
      img.addEventListener('load',()=>icon.classList.add('has-favicon'),{once:true});
      img.addEventListener('error',()=>img.remove(),{once:true});
      icon.appendChild(img);
    }
    const meta = element('div', 'entry-meta');
    const title = element('div', 'entry-title');
    title.appendChild(element('span', '', entry.title || t('noTitle')));
    if (entry.favorite) title.appendChild(element('span', 'star', '★'));
    meta.append(title, element('div', 'entry-user', entry.username || entry.url || '—'));
    const tags=LPM_ACCOUNT_META.normalizeTags(entry.tags || []);
    if(tags.length){
      const tagRow=element('div','entry-tags');
      tags.slice(0,3).forEach(tag=>tagRow.appendChild(element('span','entry-tag',tag)));
      if(tags.length>3)tagRow.appendChild(element('span','entry-tag more',`+${tags.length-3}`));
      meta.appendChild(tagRow);
    }

    const actions = element('div', 'entry-actions');
    const copyUser = element('button', 'tiny');
    copyUser.type = 'button'; setIconButton(copyUser,'user',t('usernameEmail'),'icon-user');
    copyUser.addEventListener('click', async event => {
      event.stopPropagation();
      if (!entry.username) return toast(t('noUsername'), 'warning');
      await copySecure(entry.username); toast(t('usernameCopied'),'success');
    });
    const copyPassword = element('button', 'tiny');
    copyPassword.type = 'button'; setIconButton(copyPassword,'copy',t('copy'),'icon-copy');
    copyPassword.addEventListener('click', async event => {
      event.stopPropagation(); const r=await copySecure(entry.password); toast(r.autoClear?t('passwordCopied'):t('passwordCopiedPlain'),'success');
    });
    const share = element('button', 'tiny');
    share.type = 'button'; setIconButton(share,'share',t('share'),'icon-share');
    share.addEventListener('click', async event => { event.stopPropagation(); await shareEntry(entry); });
    const edit = element('button', 'tiny');
    edit.type = 'button'; setIconButton(edit,'edit',t('edit'),'icon-edit');
    edit.addEventListener('click', event => { event.stopPropagation(); requestEdit(entry); });
    actions.append(copyUser, copyPassword, share, edit);
    row.append(icon, meta, actions);
    meta.addEventListener('click', () => requestEdit(entry));
    list.appendChild(row);
  }
}

function openEntry(entry = null, { persist = true, prefill = true } = {}) {
  state.editingEntry = entry || null;
  $('#modalTitle').textContent = entry ? t('editAccount') : t('newAccountTitle');
  const site = !entry && prefill ? state.currentSite : null;
  $('#entryId').value = entry?.id || '';
  $('#entryTitle').value = entry?.title || site?.suggestedTitle || '';
  $('#entryUrl').value = entry?.url || site?.url || '';
  $('#entryUsername').value = entry?.username || '';
  $('#entryTags').value = LPM_ACCOUNT_META.tagsText(entry?.tags || []);
  $('#entryPassword').value = entry?.password || '';
  $('#entryNotes').value = entry?.notes || '';
  $('#entryFavorite').checked = !!entry?.favorite;
  const historyCount = entry?.history?.length || 0;
  $('#historyCount').textContent = historyCount ? `(${historyCount})` : '';
  $('#historyBtn').classList.toggle('hidden', !historyCount);
  $('#deleteEntryBtn').classList.toggle('hidden', !entry);
  $('#modal').classList.remove('hidden');
  if (persist) schedulePopupDraft();
}

function closeEntry({ persist = true } = {}) { $('#modal').classList.add('hidden'); state.editingEntry = null; if (persist) schedulePopupDraft(); }
function openSimple(title, bodyNode) { $('#simpleTitle').textContent = title; const body = $('#simpleBody'); body.textContent = ''; body.appendChild(bodyNode); $('#simpleModal').classList.remove('hidden'); }
function closeSimple() { $('#simpleModal').classList.add('hidden'); }

function confirmAction({ title, message, confirmText = null, danger = false, detail = '', onConfirm }) {
  const wrap = element('div'); wrap.appendChild(element('p', 'confirm-copy', message));
  if (detail) wrap.appendChild(element('div', 'confirm-risk', detail));
  const actions = element('div', 'confirm-actions');
  const cancel = element('button', 'ghost small', t('cancel')); cancel.type = 'button'; cancel.addEventListener('click', closeSimple);
  const confirm = element('button', 'primary small', confirmText || t('confirm')); confirm.type = 'button';
  if (danger) confirm.classList.add('danger-primary');
  confirm.addEventListener('click', async () => { closeSimple(); await onConfirm?.(); });
  actions.append(cancel, confirm); wrap.appendChild(actions); openSimple(title, wrap);
}

function requestEdit(entry) {
  confirmAction({ title:t('editQuestion'), message:t('editMessage', entry.title), confirmText:t('edit'), onConfirm:() => openEntry(entry) });
}

function currentEntryForm() {
  return { id:$('#entryId').value || undefined, title:$('#entryTitle').value, url:$('#entryUrl').value, username:$('#entryUsername').value, tags:LPM_ACCOUNT_META.normalizeTags($('#entryTags').value), password:$('#entryPassword').value, notes:$('#entryNotes').value, favorite:$('#entryFavorite').checked };
}

async function persistEntry(entry) {
  try {
    await rpc('SAVE_ENTRY', { entry });
    await clearPopupDraft(); closeEntry({ persist:false });
    state.entries = await rpc('LIST'); state.health = await rpc('HEALTH'); state.backup = await rpc('GET_BACKUP_STATUS');
    renderEntries(); renderHealth(); renderBackup(); schedulePopupDraft(0); toast(t('saved'), 'success');
  } catch (error) { toast(errorText(error.message), 'error'); }
}

async function saveEntryWithRiskCheck() {
  const entry = currentEntryForm();
  if (!entry.password) return toast(t('passwordEmpty'), 'error');
  let risk = null; try { risk = await rpc('PASSWORD_RISK', { password:entry.password, excludeId:entry.id || '' }); } catch {}
  if (risk?.reusedCount || risk?.weak) {
    const parts = []; if (risk.reusedCount) parts.push(t('reused', risk.reusedCount)); if (risk.weak) parts.push(t('weak'));
    return confirmAction({ title:t('weakReuseTitle'), message:t('weakReuseLead'), detail:parts.join(' '), confirmText:t('saveAnyway'), onConfirm:() => persistEntry(entry) });
  }
  return persistEntry(entry);
}

function generatePassword() {
  const length = Number($('#lengthRange').value); $('#lengthValue').textContent = length;
  const output=LPM_PASSWORD_GENERATOR.generate({
    length, upper:$('#genUpper').checked, lower:$('#genLower').checked,
    number:$('#genNumber').checked, symbol:$('#genSymbol').checked
  });
  $('#generatedPassword').value = output; return output;
}

function passwordChangeDialog() {
  const wrap = element('div'); wrap.appendChild(element('p', 'confirm-copy', t('newPasswordHelp')));
  const first = element('input'); first.type = 'password'; first.placeholder = t('newPassword');
  const second = element('input'); second.type = 'password'; second.placeholder = t('repeatNewPassword'); second.style.marginTop = '6px';
  const apply = element('button', 'primary wide', t('changePassword')); apply.type = 'button';
  apply.addEventListener('click', async () => {
    if (first.value !== second.value) return toast(t('passwordsMismatch'), 'error');
    try { await rpc('CHANGE_PASSWORD', { newPassword:first.value }); closeSimple(); toast(t('passwordChanged'), 'success'); }
    catch (error) { toast(errorText(error.message), 'error'); }
  });
  wrap.append(first, second, apply); openSimple(t('changePassword'), wrap);
}

function historyDialog() {
  const entry = state.editingEntry;
  const history = Array.isArray(entry?.history) ? entry.history : [];
  const wrap = element('div'); wrap.appendChild(element('div', 'hint', t('historyInfo')));
  const list = element('div', 'history-list');
  history.forEach((item, index) => {
    const row = element('div', 'history-item'); const meta = element('div', 'history-meta');
    const locale = state.language === 'en' ? 'en-US' : 'fa-IR';
    meta.append(element('span','',item.username || entry.username || t('noUsernameText')), element('span','', item.changedAt ? new Date(item.changedAt).toLocaleString(locale) : `#${index+1}`));
    const secret = element('div','history-secret'); const code = element('code','', '••••••••••••'); code.dataset.shown='0';
    const show = element('button','history-reveal'); show.type='button'; setIconButton(show, 'eye', t('password')); show.addEventListener('click',()=>{ const shown=code.dataset.shown==='1'; code.dataset.shown=shown?'0':'1'; code.textContent=shown?'••••••••••••':item.password; });
    const copy = element('button','history-copy'); copy.type='button'; setIconButton(copy, 'copy', t('copy')); copy.addEventListener('click',async()=>{ await copySecure(item.password); toast(t('previousCopied'),'success'); });
    secret.append(code,show,copy); row.append(meta,secret); list.appendChild(row);
  });
  wrap.appendChild(list); openSimple(t('historyTitle'), wrap);
}

function healthDialog() {
  const health = state.health || { weak:[], reused:[], old:[] }; const wrap=element('div');
  [[t('reusedPasswords'),health.reused.length],[t('weakPasswords'),health.weak.length],[t('olderYear'),health.old.length]].forEach(([title,count])=>{ const row=element('div','health-line'); row.append(element('span','',title),element('strong','',String(count))); wrap.appendChild(row); });
  openSimple(t('healthTitle'), wrap);
}

function bridgeInstallDialog(){
  const wrap=element('div');
  const intro=element('div','shared-setup-steps');
  intro.append(element('p','confirm-copy',t('helperStep1')),element('p','confirm-copy',t('helperStep2')),element('div','modal-note',t('helperNoId')));
  const actions=element('div','confirm-actions shared-setup-actions');
  const create=element('button','ghost',t('helperCreateFile')); create.type='button';
  create.addEventListener('click',async()=>{
    create.disabled=true;
    try{ await createWindowsSetupFile(); }
    finally{ create.disabled=false; }
  });
  const check=element('button','primary',t('helperCheckAgain')); check.type='button';
  check.addEventListener('click',async()=>{
    check.disabled=true;
    try{
      await refreshBridgeUI();
      if(state.bridge?.connected){ closeSimple(); toast(t('helperReadyNow'),'success'); await sharedQuickAction(); }
      else toast(t('helperStillMissing'),'warning');
    }finally{check.disabled=false;}
  });
  actions.append(create,check); wrap.append(intro,actions); openSimple(t('helperDialogTitle'),wrap);
}

async function createWindowsSetupFile(){
  const filename='LocalPassMass-Shared-Setup.cmd';
  const content=typeof LPM_SHARED_SETUP_CMD==='string' ? LPM_SHARED_SETUP_CMD : '';
  if(!content) throw new Error('SETUP_TEMPLATE_MISSING');
  try{
    if(typeof window.showSaveFilePicker==='function'){
      const handle=await window.showSaveFilePicker({suggestedName:filename,startIn:'desktop'});
      const writable=await handle.createWritable();
      await writable.write(content);
      await writable.close();
      toast(t('helperFileSaved'),'success');
      return {saved:true,method:'picker'};
    }
  }catch(error){
    if(error?.name==='AbortError'){ toast(t('helperFileCanceled'),'info'); return {saved:false,canceled:true}; }
  }
  try{
    const blob=new Blob([content],{type:'text/plain;charset=utf-8'});
    const url=URL.createObjectURL(blob);
    const a=document.createElement('a'); a.href=url; a.download=filename; a.style.display='none';
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(url),1500);
    toast(t('helperFileDownloadFallback'),'success');
    return {saved:true,method:'download'};
  }catch(error){
    toast(t('helperFileFailed'),'error');
    return {saved:false};
  }
}

function sharedMigrationDialog(){
  const wrap=element('div');
  wrap.appendChild(element('p','confirm-copy',t('sharedNeedUnlock')));
  wrap.appendChild(element('div','confirm-risk',t('sharedSwitchWarning')));
  const label=element('label','modal-input-label',t('masterPassword'));
  const input=element('input'); input.type='password'; input.autocomplete='current-password';
  const button=element('button','primary wide',t('sharedCreateSimple')); button.type='button';
  button.addEventListener('click',async()=>{
    if(!input.value)return toast(t('passwordEmpty'),'warning');
    button.disabled=true;
    try{
      await saveSharedConfig();
      await rpc('SHARED_FROM_PRIVATE',{masterPassword:input.value});
      closeSimple(); toast(t('sharedCreated'),'success'); showOnly('unlockView');
    }catch(error){
      if(['BRIDGE_NOT_INSTALLED','BRIDGE_PROFILE_NOT_REGISTERED','BRIDGE_UNAVAILABLE'].includes(error.message))bridgeInstallDialog();
      toast(errorText(error.message),'error');
    }finally{button.disabled=false;}
  });
  wrap.append(label,input,button); openSimple(t('sharedMasterTitle'),wrap); input.focus();
}

async function connectExistingShared(){
  const doConnect=async()=>{
    await rpc('SHARED_CONNECT');
    toast(t('sharedConnected'),'success');
    showOnly('unlockView');
  };
  if(state.entries.length>0 && !$('#mainView').classList.contains('hidden')){
    return confirmAction({
      title:t('connectExistingTitle'),
      message:t('connectExistingMessage',state.entries.length),
      confirmText:t('connectAndKeepPrivate'),
      onConfirm:doConnect
    });
  }
  return doConnect();
}

async function sharedQuickAction(){
  try{
    let bridge=await rpc('BRIDGE_STATUS');
    if(!bridge.permission){
      const granted=await chrome.permissions.request({permissions:['nativeMessaging']});
      if(!granted)throw new Error('BRIDGE_PERMISSION_REQUIRED');
      bridge=await rpc('BRIDGE_STATUS');
    }
    state.bridge=bridge;
    if(!bridge.connected){ await refreshBridgeUI(); return bridgeInstallDialog(); }
    await saveSharedConfig();
    bridge=await rpc('BRIDGE_STATUS'); state.bridge=bridge;
    if(bridge.mode==='shared'){ await refreshBridgeUI(); return; }
    if(bridge.hasSharedVault){ return connectExistingShared(); }
    const st=await rpc('STATUS');
    if(!st.setup){ toast(t('sharedNoExistingForFresh'),'warning'); return; }
    sharedMigrationDialog();
  }catch(error){
    if(['BRIDGE_NOT_INSTALLED','BRIDGE_PROFILE_NOT_REGISTERED','BRIDGE_UNAVAILABLE'].includes(error.message))bridgeInstallDialog();
    else toast(errorText(error.message),'error');
  }
}

function advancedSetupDialog(){
  const wrap=element('div');
  wrap.appendChild(element('p','confirm-copy',t('advancedSetupIntro')));
  const btn=element('button','primary wide',t('checkSharedVault')); btn.type='button';
  btn.addEventListener('click',async()=>{ closeSimple(); await sharedQuickAction(); });
  wrap.appendChild(btn);
  openSimple(t('advancedSettings'),wrap);
}

async function repairSharedConnection(){
  try{
    let bridge=await rpc('BRIDGE_STATUS');
    if(!bridge.permission){
      const granted=await chrome.permissions.request({permissions:['nativeMessaging']});
      if(!granted)throw new Error('BRIDGE_PERMISSION_REQUIRED');
      bridge=await rpc('BRIDGE_STATUS');
    }
    if(!bridge.connected)return bridgeInstallDialog();
    if(!bridge.hasSharedVault){ toast(t('sharedFileMissing'),'error'); return; }
    showOnly('unlockView');
    toast(t('helperReadyNow'),'success');
  }catch(error){
    if(['BRIDGE_NOT_INSTALLED','BRIDGE_PROFILE_NOT_REGISTERED','BRIDGE_UNAVAILABLE'].includes(error.message))bridgeInstallDialog();
    else toast(errorText(error.message),'error');
  }
}

async function enableCurrentSite(){
  try{
    const tab=state.currentSite || await currentTabInfo();
    const granted=await chrome.permissions.request({permissions:['scripting'],origins:[tab.pattern]});
    if(!granted)return toast(t('sitePermissionDenied'),'warning');
    await rpc('SYNC_SITE_ACCESS');
    try{await rpc('INJECT_CURRENT_TAB',{tabId:tab.tabId});}catch{}
    await refreshSiteAccessUI(); toast(t('sitePermissionAdded'),'success');
  }catch(error){toast(errorText(error.message),'error');}
}

async function enableAllSites(){
  try{
    const granted=await chrome.permissions.request({permissions:['scripting'],origins:['https://*/*']});
    if(!granted)return toast(t('sitePermissionDenied'),'warning');
    await rpc('SYNC_SITE_ACCESS');
    try{const tab=await currentTabInfo();await rpc('INJECT_CURRENT_TAB',{tabId:tab.tabId});}catch{}
    await refreshSiteAccessUI(); toast(t('sitePermissionAdded'),'success');
  }catch(error){toast(errorText(error.message),'error');}
}

async function removeSiteAccess(){
  try{
    const info=await rpc('SITE_ACCESS_STATUS');
    if(info.origins?.length)await chrome.permissions.remove({origins:info.origins});
    await rpc('SYNC_SITE_ACCESS');
    try{await chrome.permissions.remove({permissions:['scripting']});}catch{}
    await refreshSiteAccessUI(); toast(t('sitePermissionRemoved'),'success');
  }catch(error){toast(errorText(error.message),'error');}
}

async function handleBulkImportFile(file) {
  if(!file)return;
  if(file.size>15*1024*1024) return toast(t('importFileTooLarge'),'error');
  try{
    const parsed=LPM_BULK_IMPORT.parse(await file.text(),file.name);
    if(!parsed.entries.length)return toast(t('importNoEntries'),'warning');
    const wrap=element('div');
    wrap.append(element('div','confirm-copy',t('bulkImportFound',parsed.entries.length)));
    wrap.append(element('div','confirm-risk',t('bulkImportPlainWarning')));
    if(parsed.skipped)wrap.append(element('div','modal-note',t('bulkImportSkipped',parsed.skipped)));
    const go=element('button','primary wide tight',t('importNow'));go.type='button';
    go.addEventListener('click',async()=>{
      go.disabled=true;
      try{
        const result=await rpc('BULK_IMPORT',{entries:parsed.entries});
        closeSimple();
        [state.entries,state.health,state.backup,state.autoBackups]=await Promise.all([rpc('LIST'),rpc('HEALTH').catch(()=>null),rpc('GET_BACKUP_STATUS').catch(()=>null),rpc('GET_AUTO_BACKUP_STATUS').catch(()=>null)]);
        renderEntries();renderHealth();renderBackup();renderAutoBackupStatus();
        toast(t('bulkImportDone',Number(result?.imported||0)+Number(result?.updated||0)),'success');
      }catch(error){go.disabled=false;toast(errorText(error.message),'error');}
    });
    wrap.append(go);openSimple(t('bulkImport'),wrap);
  }catch{toast(t('importInvalid'),'error');}
}

$$('.peek').forEach(button => button.addEventListener('click', () => { const input = $('#' + button.dataset.for); input.type = input.type === 'password' ? 'text' : 'password'; }));
$('#setupPassword').addEventListener('input', () => { $('#setupWarn').classList.toggle('hidden', $('#setupPassword').value.length >= 8); });

$('#setupBtn').addEventListener('click', async () => {
  const password=$('#setupPassword').value, repeat=$('#setupPassword2').value;
  if (password !== repeat) return toast(t('passwordsMismatch'),'error');
  try { const result=await rpc('SETUP',{password}); state.recoveryKeyText=result.recoveryKeyText; $('#recoveryPreview').textContent=result.recoveryKeyText; showOnly('recoveryView'); }
  catch(error){ toast(errorText(error.message),'error'); }
});
$('#downloadRecoveryBtn').addEventListener('click',()=>downloadText(`LocalPassMass-Recovery-Key-${new Date().toISOString().slice(0,10)}.txt`,recoveryFileText(state.recoveryKeyText)));
$('#recoveryDoneBtn').addEventListener('click',async()=>{showOnly('mainView');await loadMain();await maybeShowFirstSetupChecklist();});
$('#showRestoreBtn').addEventListener('click',()=>showOnly('restoreView'));
$('#restoreBack').addEventListener('click',()=>showOnly('setupView'));
$('#advancedSetupBtn').addEventListener('click',advancedSetupDialog);
$('#sharedRepairBtn').addEventListener('click',repairSharedConnection);
$('#sharedFallbackBtn').addEventListener('click',()=>confirmAction({title:t('returnPrivate'),message:t('sharedVaultNote'),confirmText:t('returnPrivate'),onConfirm:async()=>{try{await rpc('SHARED_DISCONNECT');const st=await rpc('STATUS');showOnly(st.setup?'unlockView':'setupView');toast(t('privateRestored'),'success');}catch(error){toast(errorText(error.message),'error');}}}));

$('#restoreBtn').addEventListener('click',async()=>{
  const backupFile=$('#backupFile').files[0], recoveryFile=$('#recoveryFile').files[0];
  if(!backupFile||!recoveryFile) return toast(t('bothFiles'),'error');
  try { await rpc('IMPORT_BACKUP',{backupText:await backupFile.text(),recoveryText:await recoveryFile.text(),newPassword:$('#restorePassword').value}); showOnly('mainView'); await loadMain(); toast(t('restored'),'success'); }
  catch(error){ toast(errorText(error.message),'error'); }
});

$('#forgotPasswordBtn').addEventListener('click',()=>showOnly('recoverView'));
$('#recoverBack').addEventListener('click',()=>showOnly('unlockView'));
$('#recoverBtn').addEventListener('click',async()=>{
  const file=$('#recoverKeyFile').files[0];
  const password=$('#recoverPassword').value, repeat=$('#recoverPassword2').value;
  if(!file) return toast(t('selectRecoveryFile'),'warning');
  if(password!==repeat) return toast(t('passwordsMismatch'),'error');
  try {
    const result=await rpc('RECOVER_CURRENT',{recoveryText:await file.text(),newPassword:password});
    $('#recoverPassword').value=''; $('#recoverPassword2').value=''; $('#recoverKeyFile').value='';
    showOnly('mainView'); await loadMain();
    toast(result?.source==='current'?t('recoveredCurrent'):t('recoveredSnapshot'), result?.source==='current'?'success':'warning');
  } catch(error){ toast(errorText(error.message),'error'); }
});

$('#unlockBtn').addEventListener('click',async()=>{
  try {
    const grace=$('#unlockNoReprompt').checked ? $('#unlockGrace').value : 0;
    const result=await rpc('UNLOCK',{password:$('#unlockPassword').value,grace}); $('#unlockPassword').value=''; showOnly('mainView'); await loadMain();
    const imported=Number(result?.inboxImported?.imported||0);
    if(imported>0) toast(t('lockedInboxImported',imported),'success');
  } catch(error){ toast(errorText(error.message),'error'); }
});
$('#unlockPassword').addEventListener('keydown',event=>{if(event.key==='Enter')$('#unlockBtn').click();});
$('#unlockNoReprompt').addEventListener('change',()=>{$('#unlockGrace').disabled=!$('#unlockNoReprompt').checked;});
$('#lockBtn').addEventListener('click',async()=>{await rpc('LOCK');showOnly('unlockView');});

$('#languageSelect').addEventListener('change',async()=>{applyLanguage($('#languageSelect').value);await refreshBridgeUI();});
$('#themeSelect').addEventListener('change',()=>applyTheme($('#themeSelect').value));
$('#showSettingsHelp').addEventListener('change',()=>applySettingsHelp($('#showSettingsHelp').checked));
$('#autoLockEnabled').addEventListener('change',updateAutoLockControls);
$('#allowCurrentSiteBtn').addEventListener('click',enableCurrentSite);
$('#allowAllSitesBtn').addEventListener('click',enableAllSites);
$('#removeSiteAccessBtn').addEventListener('click',removeSiteAccess);
$('#sharedQuickBtn').addEventListener('click',sharedQuickAction);
$('#disconnectSharedBtn').addEventListener('click',()=>confirmAction({title:t('returnPrivate'),message:t('sharedVaultNote'),confirmText:t('returnPrivate'),onConfirm:async()=>{try{await rpc('SHARED_DISCONNECT');toast(t('privateRestored'),'success');const st=await rpc('STATUS');showOnly(st.setup?'unlockView':'setupView');}catch(error){toast(errorText(error.message),'error');}}}));
$('#clipboardAutoClearEnabled').addEventListener('change',async()=>{
  let enabled=$('#clipboardAutoClearEnabled').checked;
  if(enabled){
    try{const granted=await chrome.permissions.request({permissions:['offscreen','clipboardWrite']});if(!granted){enabled=false;$('#clipboardAutoClearEnabled').checked=false;toast(t('clipboardPermissionDenied'),'warning');}else toast(t('clipboardAutoClearOn'),'success');}
    catch{enabled=false;$('#clipboardAutoClearEnabled').checked=false;toast(t('clipboardPermissionDenied'),'warning');}
  }else{
    try{await chrome.permissions.remove({permissions:['offscreen','clipboardWrite']});}catch{}
  }
  try{state.settings=await rpc('SET_SETTINGS',{settings:{clipboardAutoClearEnabled:enabled}});}catch{}
});

$('#showSiteIcons').addEventListener('change',async()=>{
  let enabled=$('#showSiteIcons').checked;
  if(enabled){
    try{const granted=await chrome.permissions.request({permissions:['favicon']});if(!granted){enabled=false;$('#showSiteIcons').checked=false;toast(t('siteIconsPermissionDenied'),'warning');}}
    catch{enabled=false;$('#showSiteIcons').checked=false;toast(t('siteIconsPermissionDenied'),'warning');}
  }else{ try{await chrome.permissions.remove({permissions:['favicon']});}catch{} }
  state.siteIconsGranted=enabled;
  try{state.settings=await rpc('SET_SETTINGS',{settings:{showSiteIcons:enabled}});}catch{}
  renderEntries();
});

$('#setupStrip').addEventListener('click',setupChecklistDialog);
$$('.tab').forEach(tab=>tab.addEventListener('click',()=>switchTab(tab.dataset.tab)));
$('#searchInput').addEventListener('input',()=>{renderEntries();schedulePopupDraft();});
$('#siteFilterToggle').addEventListener('click',()=>{state.siteFilterMode=siteFilteredEntries().useSite?'all':'site';renderEntries();});
$('#addBtn').addEventListener('click',()=>openEntry());
$('#modalClose').addEventListener('click',closeEntry);
$('#saveEntryBtn').addEventListener('click',saveEntryWithRiskCheck);

$('#deleteEntryBtn').addEventListener('click',()=>{
  const id=$('#entryId').value;
  confirmAction({title:t('deleteQuestion'),message:t('deleteMessage'),confirmText:t('delete'),danger:true,onConfirm:async()=>{await rpc('DELETE_ENTRY',{id});await clearPopupDraft();closeEntry({persist:false});state.entries=await rpc('LIST');state.backup=await rpc('GET_BACKUP_STATUS');state.health=await rpc('HEALTH');renderEntries();renderBackup();renderHealth();toast(t('deleted'),'success');}});
});

$('#fillGeneratedBtn').addEventListener('click',()=>{$('#entryPassword').value=generatePassword();schedulePopupDraft(0);});
$('#lengthRange').addEventListener('input',()=>{generatePassword();schedulePopupDraft();});
['genUpper','genLower','genNumber','genSymbol'].forEach(id=>$('#'+id).addEventListener('change',()=>{generatePassword();schedulePopupDraft();}));
$('#regenBtn').addEventListener('click',()=>{generatePassword();schedulePopupDraft();});
$('#copyGenerated').addEventListener('click',async()=>{await copySecure($('#generatedPassword').value);toast(t('copied'),'success');});

['entryTitle','entryUrl','entryUsername','entryTags','entryPassword','entryNotes'].forEach(id=>{
  const el=$('#'+id);
  el.addEventListener('input',()=>schedulePopupDraft());
  // Switching browser tabs closes an action popup. Blur is usually delivered
  // before teardown, so flush the encrypted draft immediately as a second line
  // of defence instead of relying only on pagehide.
  el.addEventListener('blur',()=>savePopupDraftNow());
});
$('#entryFavorite').addEventListener('change',()=>schedulePopupDraft(0));
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden'&&!state.draftRestoring)savePopupDraftNow();});
window.addEventListener('pagehide',()=>{if(!state.draftRestoring)savePopupDraftNow();});

$('#saveSettingsBtn').addEventListener('click',async()=>{
  try {
    state.settings=await rpc('SET_SETTINGS',{settings:{autoLockEnabled:$('#autoLockEnabled').checked,autoLockMinutes:Number($('#autoLockMinutes').value),clipboardSeconds:Number($('#clipboardSeconds').value),clipboardAutoClearEnabled:$('#clipboardAutoClearEnabled').checked,subdomainMatch:$('#subdomainMatch').checked,allowHttpFill:$('#allowHttpFill').checked,savePrompt:$('#savePrompt').checked,lockOnSystemLock:$('#lockOnSystemLock').checked,lockOnBrowserClose:$('#lockOnBrowserClose').checked,autoBackupEnabled:$('#autoBackupEnabled').checked,autoBackupMaxSnapshots:Number($('#autoBackupMaxSnapshots').value),sharedVaultPath:$('#sharedVaultPath').value,sharedBackupPath:$('#sharedBackupPath').value,sharedBackupMax:Number($('#sharedBackupMax').value),language:$('#languageSelect').value,theme:$('#themeSelect').value,showSettingsHelp:$('#showSettingsHelp').checked,showSiteIcons:$('#showSiteIcons').checked}});
    applyTheme(state.settings.theme); applyLanguage(state.settings.language); applySettingsHelp(state.settings.showSettingsHelp === true); await refreshBridgeUI(); try{state.autoBackups=await rpc('GET_AUTO_BACKUP_STATUS');renderAutoBackupStatus();}catch{} toast(t('settingsSaved'),'success');
  } catch { toast(t('settingsFailed'),'error'); }
});

$('#autoBackupBtn').addEventListener('click',async()=>{try{state.autoBackups=await rpc('GET_AUTO_BACKUP_STATUS');autoBackupDialog();}catch(error){toast(errorText(error.message),'error');}});
$('#bulkImportBtn').addEventListener('click',()=>$('#bulkImportFile').click());
$('#bulkImportFile').addEventListener('change',async()=>{const file=$('#bulkImportFile').files[0];$('#bulkImportFile').value='';await handleBulkImportFile(file);});
$('#exportBackupBtn').addEventListener('click',async()=>{try{const text=await rpc('EXPORT_BACKUP');downloadText(`LocalPassMass-Backup-${new Date().toISOString().slice(0,10)}.svault`,text,'application/json');state.backup=await rpc('GET_BACKUP_STATUS');renderBackup();toast(t('backupMade'),'success');}catch(error){toast(errorText(error.message),'error');}});
$('#rotateRecoveryBtn').addEventListener('click',()=>confirmAction({title:t('newRecoveryQuestion'),message:t('newRecoveryMessage'),confirmText:t('createKey'),onConfirm:async()=>{try{const result=await rpc('ROTATE_RECOVERY');downloadText(`LocalPassMass-Recovery-Key-${new Date().toISOString().slice(0,10)}.txt`,recoveryFileText(result.recoveryKeyText));toast(t('recoveryCreated'),'success');}catch(error){toast(errorText(error.message),'error');}}}));
$('#testRecoveryBtn').addEventListener('click',()=>$('#recoveryTestFile').click());
$('#recoveryTestFile').addEventListener('change',async()=>{const file=$('#recoveryTestFile').files[0];if(!file)return;try{await rpc('TEST_RECOVERY_KEY',{recoveryText:await file.text()});toast(t('recoveryValid'),'success');}catch(error){toast(error.message==='RECOVERY_FAILED'?t('recoveryInvalidCurrent'):errorText(error.message),'error');}finally{$('#recoveryTestFile').value='';}});
$('#changePasswordBtn').addEventListener('click',passwordChangeDialog);
$('#healthBtn').addEventListener('click',async()=>{state.health=await rpc('HEALTH');healthDialog();});
$('#healthStrip').addEventListener('click',async()=>{state.health=await rpc('HEALTH');healthDialog();});
$('#historyBtn').addEventListener('click',historyDialog);
$('#backupStrip').addEventListener('click',()=>$('#exportBackupBtn').click());
$('#resetSiteRulesBtn').addEventListener('click',()=>confirmAction({title:t('resetRulesQuestion'),message:t('resetRulesMessage'),confirmText:t('reset'),onConfirm:async()=>{await rpc('RESET_SITE_RULES');toast(t('rulesReset'),'success');}}));
$('#simpleClose').addEventListener('click',closeSimple);
$('#modal').addEventListener('click',event=>{if(event.target===$('#modal'))closeEntry();});
$('#simpleModal').addEventListener('click',event=>{if(event.target===$('#simpleModal'))closeSimple();});
document.addEventListener('keydown',event=>{if(event.key!=='Escape')return;if(!$('#simpleModal').classList.contains('hidden'))closeSimple();else if(!$('#modal').classList.contains('hidden'))closeEntry();});

try{window.matchMedia?.('(prefers-color-scheme: dark)').addEventListener('change',()=>{if((state.settings?.theme||state.theme)==='system')applyTheme('system');});}catch{}

boot();
