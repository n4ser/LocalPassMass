(() => {
  if (globalThis.__LOCALPASSMASS_CONTENT_V1104__) return;
  globalThis.__LOCALPASSMASS_CONTENT_V1104__ = true;

  const APP = 'LocalPassMass';
  const FIELDS = globalThis.LPM_FIELDS;
  if (!FIELDS) return;
  const { PASSWORD_SELECTOR, STRONG_IDENTITY_SELECTOR } = FIELDS;
  const attachedPasswords = new WeakSet();
  const attachedInteractive = new WeakSet();
  const pairByField = new WeakMap();
  const passwordInputs = new Set();
  const attachedIdentities = new WeakSet();
  const identityInputs = new Set();
  let loginOutcomeWatch = null;
  let loginOutcomeWatchPriority = 0;
  let loginOutcomeWatchInput = null;
  const lastInputEventAt = new WeakMap();
  const lastPolledValue = new WeakMap();
  const lastIdentityValue = new WeakMap();
  const lastIdentityStageAt = new WeakMap();

  let chooser = null;
  let chooserAnchor = null;
  let chooserPair = null;
  const fieldButtons = new Map();
  let proactiveSuggestionDone = false;
  let proactiveSuggestionPending = false;
  let savePromptEl = null;
  let savePromptTimer = null;
  let savePromptSignature = '';
  let confirmSuccessInFlight = false;
  let suppressChooserUntil = 0;
  let language = 'fa';
  let theme = 'system';
  let cachedSettings = null;
  let cachedSettingsAt = 0;
  let lastCandidate = null;
  let lastCaptureSignature = '';
  let lastCaptureAt = 0;
  let lastCaptureWatchLevel = 0;
  let lastStagedSignature = '';
  let lastStagedAt = 0;
  let observer = null;
  let candidatePoll = null;
  let lastSubmitIntentAt = 0;
  let credentialsCache = null;
  let credentialsCacheAt = 0;
  let credentialsPromise = null;
  let overlayPositionFrame = 0;
  let chooserRequestSeq = 0;
  let identityPollUntil = 0;
  let lastPointerSubmitAt = 0;
  let lastPointerSubmitControl = null;
  const autoChooserShownScopes = new WeakSet();
  const shadowDiscoveryQueue = new Set();
  let shadowDiscoveryScheduled = false;

  const TXT = {
    fa: {
      oneAccount:'یک حساب', accounts:n=>`${n} حساب`, noUsername:'بدون نام کاربری',
      vaultLocked:'Vault قفل است؛ LocalPassMass را باز کنید.', noAccount:'حسابی برای این سایت ذخیره نشده.',
      httpOff:'Autofill روی HTTP خاموش است یا حسابی برای این سایت ندارید.', filled:'اطلاعات ورود وارد شد.',
      saveNew:'ذخیره در LocalPassMass؟', saveChanged:'رمز جدید در LocalPassMass ذخیره شود؟', saveUnknown:'ذخیره در LocalPassMass؟',
      previousKept:'نسخه قبلی رمز در تاریخچه باقی می‌ماند.', reused:n=>`هشدار: این رمز در ${n} حساب دیگر هم استفاده شده است.`,
      save:'ذخیره', update:'به‌روزرسانی', unlockSave:'ذخیره امن', no:'فعلاً نه', always:'همیشه ذخیره کن', never:'برای این سایت نپرس', more:'تنظیمات سایت', seconds:n=>`${n} ثانیه`,
      saved:'در Vault ذخیره شد.', updated:'رمز جدید ذخیره شد؛ نسخه قبلی محفوظ است.', expired:'فرصت ذخیره منقضی شد.',
      unlockHint:'Vault قفل است؛ این ورود رمزگذاری و ذخیره می‌شود. فقط هنگام استفاده باید Vault را باز کنید.',
      queuedLocked:'ورود به‌صورت رمزگذاری‌شده ذخیره شد؛ برای استفاده بعداً Vault را باز کنید.',
      unlockOnce:'برای فعال‌شدن ذخیره امن در حالت قفل، یک‌بار LocalPassMass را باز کنید.', autoSaved:'ورود با موفقیت ذخیره شد.', same:'این رمز قبلاً ذخیره شده است.',
      formGuard:'برای امنیت، Autofill روی فرم با مقصد دامنه دیگر متوقف شد.', saveFailed:'ذخیره انجام نشد؛ دوباره تلاش کنید.', saving:'در حال ذخیره…',
      reviewLogin:'اطلاعات ورود را بررسی و ذخیره کنید.', generateStrong:'ساخت رمز عبور قوی', generateStrongHint:'۲۰ کاراکتر؛ در فیلد تکرار رمز هم وارد می‌شود.', generatedStrong:'رمز قوی ساخته و در فیلدهای رمز وارد شد.',
      passwordTools:'ابزار رمز عبور', savedPassword:'رمز ذخیره‌شده', showPassword:'نمایش رمز', hidePassword:'مخفی کردن رمز', fillSaved:'پر کردن اطلاعات ورود'
    },
    en: {
      oneAccount:'1 account', accounts:n=>`${n} accounts`, noUsername:'No username',
      vaultLocked:'Vault is locked. Open LocalPassMass first.', noAccount:'No saved account for this site.',
      httpOff:'Autofill on HTTP is disabled or no account is saved for this site.', filled:'Login filled.',
      saveNew:'Save to LocalPassMass?', saveChanged:'Save the new password to LocalPassMass?', saveUnknown:'Save to LocalPassMass?', previousKept:'The previous password stays in password history.',
      reused:n=>`Warning: this password is reused in ${n} other account(s).`, save:'Save', update:'Update', unlockSave:'Save securely', no:'Not now', always:'Always save', never:'Never ask for this site', more:'Site options', seconds:n=>`${n}s`,
      saved:'Saved to your vault.', updated:'New password saved; the previous version is kept.', expired:'Save request expired.',
      unlockHint:'Vault is locked. This login can still be encrypted and saved; unlock only when you need to use it.', queuedLocked:'Login encrypted and saved. Unlock the vault later when you need to use it.',
      unlockOnce:'Unlock LocalPassMass once to enable secure saving while locked after this upgrade.', autoSaved:'Login saved automatically.', same:'This password is already saved.',
      formGuard:'For safety, autofill was blocked because this form submits to another site.', saveFailed:'Could not save this login. Please try again.', saving:'Saving…',
      reviewLogin:'Review this login before saving.', generateStrong:'Generate strong password', generateStrongHint:'20 characters; fills the matching confirmation field too.', generatedStrong:'Strong password generated and filled.',
      passwordTools:'Password tools', savedPassword:'Saved password', showPassword:'Show password', hidePassword:'Hide password', fillSaved:'Fill login'
    }
  };

  const t = (key, arg) => {
    const value = TXT[language]?.[key] ?? TXT.fa[key] ?? key;
    return typeof value === 'function' ? value(arg) : value;
  };

  async function rpc(type, payload = {}) {
    try {
      const result = await chrome.runtime.sendMessage({ type, ...payload });
      if (!result?.ok) throw new Error(result?.error || 'ERROR');
      return result.data;
    } catch (_) { return null; }
  }

  async function rpcDetailed(type, payload = {}) {
    try {
      const result = await chrome.runtime.sendMessage({ type, ...payload });
      if (!result?.ok) return { ok:false, error:String(result?.error || 'ERROR') };
      return { ok:true, data:result.data };
    } catch (error) { return { ok:false, error:String(error?.message || 'ERROR') }; }
  }

  const darkUi = () => theme === 'dark' || (theme === 'system' && globalThis.matchMedia?.('(prefers-color-scheme: dark)').matches);
  const applyThemeClass = el => { if (el && darkUi()) el.classList.add('lpm-dark'); return el; };
  function syncRenderedTheme() {
    const dark = darkUi();
    document.querySelectorAll('.lpm-key-btn,.lpm-chooser,.lpm-save,.lpm-toast').forEach(el => el.classList.toggle('lpm-dark', dark));
  }
  try { globalThis.matchMedia?.('(prefers-color-scheme: dark)').addEventListener('change', () => { if (theme === 'system') syncRenderedTheme(); }); } catch (_) {}

  async function refreshPrefs({ force = false } = {}) {
    if (!force && cachedSettings && Date.now() - cachedSettingsAt < 5000) return cachedSettings;
    const settings = await rpc('GET_SETTINGS') || {};
    cachedSettings = settings;
    cachedSettingsAt = Date.now();
    language = settings.language === 'en' ? 'en' : 'fa';
    theme = ['light','dark','system'].includes(settings.theme) ? settings.theme : 'system';
    syncRenderedTheme();
    return settings;
  }

  const visible = FIELDS.visible;
  const fieldPair = FIELDS.fieldPair;
  const isPasswordLikeInput = FIELDS.isPasswordLikeInput;
  const queryPasswords = FIELDS.queryPasswords;
  const choosePasswordInput = FIELDS.choosePasswordInput;

  function nativeSet(input, value) {
    if (!input) return;
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
    setter ? setter.call(input, value ?? '') : (input.value = value ?? '');
    input.dispatchEvent(new Event('input', { bubbles:true, composed:true }));
    input.dispatchEvent(new Event('change', { bubbles:true, composed:true }));
  }

  async function formPostsCrossSite(pair, credential) {
    const form = pair?.passwordInput?.form || pair?.passwordInput?.closest?.('form');
    if (!form?.action) return false;
    const safe = await rpc('FORM_ACTION_SAFE', { actionUrl:form.action, credentialUrl:credential.url || location.origin });
    return safe !== true; // fail closed
  }

  async function fill(pair, credential) {
    if (!pair?.passwordInput?.isConnected) return;
    if (await formPostsCrossSite(pair, credential)) {
      closeChooser();
      return toast(t('formGuard'), 'error');
    }
    suppressChooserUntil = Date.now() + 700;
    nativeSet(pair.usernameInput, credential.username);
    nativeSet(pair.passwordInput, credential.password);
    closeChooser();
    pair.passwordInput?.focus({ preventScroll:true });
    // Filling should feel instant. Usage recency is bookkeeping, so do not hold
    // the UI on a full encrypted-vault rewrite. The background still serializes it.
    rpc('MARK_USED', { id:credential.id }).then(result => { if (result) invalidateCredentialCache(); });
    toast(t('filled'), 'success');
  }

  async function requestFill(pair, summary) {
    const result = await rpc('REQUEST_FILL_CREDENTIAL', { id:summary.id });
    if (!result?.credential) return toast(t('vaultLocked'), 'warning');
    return fill(pair, result.credential);
  }

  function invalidateCredentialCache() {
    credentialsCache = null;
    credentialsCacheAt = 0;
    credentialsPromise = null;
  }

  async function getCredentials({ force = false } = {}) {
    await refreshPrefs();
    const stamp = Date.now();
    if (!force && credentialsCache && stamp - credentialsCacheAt < 3000) return credentialsCache;
    if (!force && credentialsPromise) return credentialsPromise;
    credentialsPromise = rpc('GET_FOR_HOST').then(result => {
      credentialsPromise = null;
      if (Array.isArray(result)) {
        credentialsCache = result;
        credentialsCacheAt = Date.now();
      }
      return result;
    }, () => { credentialsPromise = null; return null; });
    return credentialsPromise;
  }

  function removeChooser() {
    chooser?.remove(); chooser = null; chooserAnchor = null; chooserPair = null;
  }

  function closeChooser() {
    chooserRequestSeq++;
    removeChooser();
  }

  function isInputFocused(input) {
    if (!input?.isConnected) return false;
    const root = input.getRootNode?.();
    return document.activeElement === input || root?.activeElement === input;
  }

  function positionChooser() {
    if (!chooser || !chooserAnchor || !visible(chooserAnchor)) return closeChooser();
    const rect = chooserAnchor.getBoundingClientRect();
    const vw = Math.max(document.documentElement?.clientWidth || 0, innerWidth || 0);
    const vh = Math.max(document.documentElement?.clientHeight || 0, innerHeight || 0);
    const margin = 8, gap = 6;
    const desired = Math.max(220, Math.min(326, Math.max(248, rect.width || 248)));
    const availableWidth = Math.max(140, vw - margin * 2);
    const width = Math.min(desired, availableWidth);
    chooser.style.setProperty('width', `${width}px`, 'important');
    chooser.style.setProperty('visibility', 'hidden', 'important');
    chooser.style.setProperty('left', '0px', 'important');
    chooser.style.setProperty('top', '0px', 'important');
    const menuHeight = chooser.offsetHeight, finalWidth = chooser.offsetWidth;
    let left = language === 'en' ? rect.left : rect.right - finalWidth;
    left = Math.max(margin, Math.min(left, vw - finalWidth - margin));
    const preferTop = chooserAnchor.type === 'password' || /password/i.test(chooserAnchor.autocomplete || '');
    const canTop = rect.top - menuHeight - gap >= margin;
    const canBottom = rect.bottom + menuHeight + gap <= vh - margin;
    const canRight = rect.right + gap + finalWidth <= vw - margin;
    const canLeft = rect.left - gap - finalWidth >= margin;
    let top;
    if ((preferTop && canTop) || (!canBottom && canTop)) {
      top = rect.top - menuHeight - gap; chooser.dataset.placement = 'top';
    } else if (preferTop && (canRight || canLeft)) {
      top = Math.max(margin, Math.min(rect.top, vh - menuHeight - margin));
      left = canRight ? rect.right + gap : rect.left - finalWidth - gap;
      chooser.dataset.placement = canRight ? 'right' : 'left';
    } else {
      top = Math.max(margin, Math.min(rect.bottom + gap, vh - menuHeight - margin)); chooser.dataset.placement = 'bottom';
    }
    chooser.style.setProperty('left', `${Math.round(left)}px`, 'important');
    chooser.style.setProperty('top', `${Math.round(top)}px`, 'important');
    chooser.style.setProperty('visibility', 'visible', 'important');
  }

  function generationTargets(input, { allowStandalone = false } = {}) {
    if (!isPasswordLikeInput(input) || input.disabled || input.readOnly) return [];
    const standalone=()=>allowStandalone?[input]:[];
    const scope=input.form||input.closest?.('form,[role="form"]')||input.parentElement?.parentElement||input.getRootNode?.()||document;
    const passwords=queryPasswords(scope).filter(el=>!el.disabled&&!el.readOnly);
    const tokens=FIELDS.autocompleteTokens(input);
    const meta=FIELDS.fieldText(input);
    const signupContext=FIELDS.isSignupContext(input,scope);
    const looksNew=tokens.includes('new-password')||signupContext||/new.?password|confirm.?password|repeat.?password|password.?confirmation|رمز\s*جدید|تکرار\s*رمز|تأیید\s*رمز|تاييد\s*رمز/i.test(meta);
    const looksCurrent=tokens.includes('current-password')||/current.?password|old.?password|existing.?password|رمز\s*(?:فعلی|قديمی|قدیمی)/i.test(meta);
    const hasCurrent=passwords.some(el=>FIELDS.autocompleteTokens(el).includes('current-password')||/current.?password|old.?password|existing.?password|رمز\s*(?:فعلی|قديمی|قدیمی)/i.test(FIELDS.fieldText(el)));
    if(looksCurrent) return standalone();
    // Automatic generation stays conservative on login/change forms. An explicit
    // click on the L button may still generate into the selected password field.
    if(!looksNew && passwords.length>=3 && passwords[0]===input) return standalone();
    if(!looksNew && (passwords.length<2 || hasCurrent)) return standalone();
    let targets=passwords.filter(el=>{
      const tks=FIELDS.autocompleteTokens(el), txt=FIELDS.fieldText(el);
      return el===input||tks.includes('new-password')||/confirm|repeat|confirmation|تکرار|تأیید|تاييد/i.test(txt);
    });
    if(targets.length<2 && passwords.length===2 && !hasCurrent) targets=passwords;
    if(!targets.includes(input)) targets.unshift(input);
    return [...new Set(targets)].slice(0,3);
  }

  function canGenerateFor(input, options) { return generationTargets(input, options).length>0; }

  function generateIntoFields(input, { allowStandalone = false } = {}) {
    const targets=generationTargets(input,{allowStandalone});
    if(!targets.length)return false;
    const password=LPM_PASSWORD_GENERATOR.generate({length:20,upper:true,lower:true,number:true,symbol:true});
    suppressChooserUntil=Date.now()+900;
    for(const target of targets) nativeSet(target,password);
    const candidate=targets.find(el=>el===input)||targets[0];
    rememberCandidate(candidate);
    stageCandidate(candidate,'generated-password').catch(()=>undefined);
    closeChooser(); candidate?.focus?.({preventScroll:true});
    toast(t('generatedStrong'),'success');
    return true;
  }

  async function togglePasswordPreview(summary, valueEl, revealButton) {
    if (!summary?.id || !valueEl || !revealButton) return;
    if (valueEl.dataset.revealed === 'true') {
      valueEl.textContent='••••••••';
      valueEl.dataset.revealed='false';
      revealButton.textContent=t('showPassword');
      return;
    }
    revealButton.disabled=true;
    const result=await rpc('REQUEST_FILL_CREDENTIAL',{id:summary.id});
    revealButton.disabled=false;
    if(!result?.credential){toast(t('vaultLocked'),'warning');return;}
    valueEl.textContent=String(result.credential.password||'');
    valueEl.dataset.revealed='true';
    revealButton.textContent=t('hidePassword');
  }

  async function showChooser(input, { manual = false, proactive = false } = {}) {
    if (Date.now() < suppressChooserUntil || !input?.isConnected) return;
    const requestId = ++chooserRequestSeq;
    const pair = pairByField.get(input) || (isPasswordLikeInput(input) ? fieldPair(input) : null);
    if (!pair) return;
    const automaticCanGenerate=canGenerateFor(input);
    const result = await getCredentials();
    // A slow vault decrypt must never reopen a stale menu. Manual L-clicks and
    // the one proactive saved-login suggestion are allowed without field focus.
    if (requestId !== chooserRequestSeq || !input.isConnected || (!manual && !proactive && !isInputFocused(input))) return;
    const credentials=Array.isArray(result)?result:[];
    const canGenerate=manual?canGenerateFor(input,{allowStandalone:true}):automaticCanGenerate;
    if(proactive && (!credentials.length || !visible(input))) return;
    if (!result && !canGenerate) { if (manual) toast(t('vaultLocked'), 'warning'); return; }
    if (!credentials.length && !canGenerate) { if (manual) toast(location.protocol === 'http:' ? t('httpOff') : t('noAccount'), 'warning'); return; }

    removeChooser(); chooserAnchor = input; chooserPair = pair;
    chooser = document.createElement('div'); chooser.className = 'lpm-chooser'; applyThemeClass(chooser);
    chooser.setAttribute('role','listbox'); chooser.dir = language === 'en' ? 'ltr' : 'rtl';
    const header = document.createElement('div'); header.className = 'lpm-chooser-head';
    const brand = document.createElement('span'); brand.className = 'lpm-chooser-brand'; brand.textContent = APP;
    const hint = document.createElement('small');
    hint.textContent = credentials.length ? (credentials.length === 1 ? t('oneAccount') : t('accounts', credentials.length)) : t('passwordTools');
    header.append(brand, hint); chooser.appendChild(header);

    for (const credential of credentials) {
      const group=document.createElement('div');group.className='lpm-credential';
      const button = document.createElement('button'); button.type='button'; button.className='lpm-choice lpm-saved-choice'; button.setAttribute('role','option');
      button.title=t('fillSaved');
      const avatar=document.createElement('span'); avatar.className='lpm-choice-avatar'; avatar.textContent=(credential.title||credential.username||'L').trim()[0]?.toUpperCase()||'L';
      const meta=document.createElement('span'); meta.className='lpm-choice-meta';
      const title=document.createElement('strong'); title.textContent=credential.title||location.hostname;
      const username=document.createElement('span'); username.textContent=credential.username||t('noUsername'); meta.append(title,username);
      const arrow=document.createElement('span'); arrow.className='lpm-choice-arrow'; arrow.textContent=language==='en'?'›':'‹';
      button.append(avatar,meta,arrow);
      button.addEventListener('mousedown',event=>event.preventDefault());
      button.addEventListener('click',event=>{ event.preventDefault(); event.stopPropagation(); requestFill(chooserPair||pair,credential); });

      const tools=document.createElement('div');tools.className='lpm-credential-tools';
      const label=document.createElement('span');label.className='lpm-password-label';label.textContent=t('savedPassword');
      const value=document.createElement('code');value.className='lpm-password-value';value.textContent='••••••••';value.dataset.revealed='false';
      const reveal=document.createElement('button');reveal.type='button';reveal.className='lpm-password-reveal';reveal.textContent=t('showPassword');
      reveal.addEventListener('mousedown',event=>event.preventDefault());
      reveal.addEventListener('click',event=>{event.preventDefault();event.stopPropagation();togglePasswordPreview(credential,value,reveal);});
      tools.append(label,value,reveal);
      group.append(button,tools);chooser.appendChild(group);
    }

    if (canGenerate) {
      const gen=document.createElement('button');gen.type='button';gen.className='lpm-choice lpm-generate-choice';gen.setAttribute('role','option');
      const avatar=document.createElement('span');avatar.className='lpm-choice-avatar lpm-generate-avatar';avatar.textContent='✦';
      const meta=document.createElement('span');meta.className='lpm-choice-meta';
      const title=document.createElement('strong');title.textContent=t('generateStrong');
      const sub=document.createElement('span');sub.textContent=t('generateStrongHint');meta.append(title,sub);
      const arrow=document.createElement('span');arrow.className='lpm-choice-arrow';arrow.textContent=language==='en'?'›':'‹';
      gen.append(avatar,meta,arrow);gen.addEventListener('mousedown',event=>event.preventDefault());
      gen.addEventListener('click',event=>{event.preventDefault();event.stopPropagation();generateIntoFields(input,{allowStandalone:manual});});
      chooser.appendChild(gen);
    }

    (document.documentElement || document.body)?.appendChild(chooser); positionChooser();
  }

  function chooserScopeFor(input, pair) {
    return pair?.passwordInput?.form || pair?.passwordInput?.closest?.('form,[role="form"]') || pair?.passwordInput || input;
  }

  function attachInteractive(input, pair) {
    if (!input || attachedInteractive.has(input)) return;
    attachedInteractive.add(input); pairByField.set(input, pair);
    const passwordField = isPasswordLikeInput(input);
    // Keep the field UI quiet while the user types through a form. Automatic
    // suggestions are shown only once, on the password field, and only while it
    // is empty. The L button / ArrowDown always remain explicit ways to reopen it.
    input.addEventListener('focus',()=>{
      if(!passwordField || String(input.value||'').length) return;
      const scope=chooserScopeFor(input,pair);
      if(scope&&autoChooserShownScopes.has(scope))return;
      if(scope)autoChooserShownScopes.add(scope);
      setTimeout(()=>{if(isInputFocused(input)&&!String(input.value||'').length)showChooser(input,{manual:false});},55);
    });
    input.addEventListener('click',()=>{
      if(!passwordField || String(input.value||'').length || chooser)return;
      const scope=chooserScopeFor(input,pair);
      if(scope&&autoChooserShownScopes.has(scope))return;
      if(scope)autoChooserShownScopes.add(scope);
      setTimeout(()=>{if(isInputFocused(input))showChooser(input,{manual:false});},35);
    });
    input.addEventListener('keydown',event=>{
      if ((event.key==='ArrowDown'||(event.altKey&&event.key==='ArrowDown'))&&!chooser) showChooser(input,{manual:true});
      if(event.key==='Escape')closeChooser();
    });
  }

  function ensureFieldButton(input) {
    if(!input?.isConnected)return null;
    let button=fieldButtons.get(input);
    if(button?.isConnected)return button;
    button=document.createElement('button');button.type='button';button.className='lpm-key-btn is-visible';button.textContent='L';button.title=`${APP} — ${t('passwordTools')}`;button.tabIndex=-1;applyThemeClass(button);
    button.addEventListener('mousedown',event=>event.preventDefault());
    button.addEventListener('click',event=>{event.preventDefault();event.stopPropagation();if(input.isConnected)showChooser(input,{manual:true});});
    fieldButtons.set(input,button);
    (document.documentElement || document.body)?.appendChild(button);
    return button;
  }

  function positionFieldButton(input, button=fieldButtons.get(input)) {
    if(!button)return;
    if(!input?.isConnected){button.remove();fieldButtons.delete(input);return;}
    if(!visible(input)){button.classList.remove('is-visible');return;}
    const rect=input.getBoundingClientRect();
    const vw=Math.max(document.documentElement?.clientWidth||0,innerWidth||0);
    const size=20;
    const top=Math.round(rect.top+Math.max(2,(rect.height-size)/2));
    const outsideRight=rect.right+5;
    const outsideLeft=rect.left-size-5;
    const preferred=outsideRight+size<=vw-3?outsideRight:(outsideLeft>=3?outsideLeft:rect.right-size-5);
    const left=Math.round(Math.max(3,Math.min(vw-size-3,preferred)));
    button.style.setProperty('top',`${top}px`,'important');
    button.style.setProperty('left',`${left}px`,'important');
    button.classList.add('is-visible');
  }

  function positionFieldButtons() {
    for(const [input,button] of [...fieldButtons])positionFieldButton(input,button);
  }

  function scheduleOverlayPosition() {
    if (overlayPositionFrame) return;
    overlayPositionFrame = requestAnimationFrame(() => {
      overlayPositionFrame = 0;
      positionChooser();
      positionFieldButtons();
    });
  }

  function showFieldButton(input) {
    const button=ensureFieldButton(input);if(button)positionFieldButton(input,button);
  }

  function scheduleSavedCredentialSuggestion(input) {
    if(proactiveSuggestionDone||proactiveSuggestionPending||!input?.isConnected||String(input.value||'').length)return;
    proactiveSuggestionPending=true;
    setTimeout(async()=>{
      proactiveSuggestionPending=false;
      if(proactiveSuggestionDone||!input?.isConnected||String(input.value||'').length||!visible(input))return;
      const result=await getCredentials();
      const credentials=Array.isArray(result)?result:[];
      if(!credentials.length||proactiveSuggestionDone||!input.isConnected||String(input.value||'').length||!visible(input))return;
      proactiveSuggestionDone=true;
      const pair=pairByField.get(input)||fieldPair(input);
      const scope=chooserScopeFor(input,pair);
      if(scope)autoChooserShownScopes.add(scope);
      showChooser(input,{proactive:true});
    },240);
  }

  function stageIdentity(input, { force = false } = {}) {
    if (!FIELDS.isStrongIdentityInput(input)) return;
    const value = FIELDS.normalizeIdentityValue(input);
    if (!value) return;
    const stamp=Date.now(), previous=lastIdentityValue.get(input), lastAt=Number(lastIdentityStageAt.get(input)||0);
    if (!force && previous===value && stamp-lastAt<20_000) return;
    lastIdentityValue.set(input,value); lastIdentityStageAt.set(input,stamp);
    rpc('SET_LOGIN_IDENTITY', { value }).catch?.(()=>undefined);
  }

  function armIdentityPolling(ms = 20_000) {
    identityPollUntil = Math.max(identityPollUntil, Date.now() + ms);
    ensureCandidatePoll();
  }

  function attachIdentity(input) {
    if (!input || attachedIdentities.has(input) || !FIELDS.isStrongIdentityInput(input)) return;
    attachedIdentities.add(input); identityInputs.add(input); armIdentityPolling();
    input.addEventListener('focus', () => armIdentityPolling(30_000), true);
    input.addEventListener('change', () => stageIdentity(input), true);
    input.addEventListener('blur', () => stageIdentity(input), true);
    input.addEventListener('keydown', event => { if (event.key === 'Enter') stageIdentity(input); }, true);
  }

  function makeEntry(passwordInput) {
    if (!passwordInput?.value) return null;
    const pair=fieldPair(passwordInput);
    return {
      title:LPM_ACCOUNT_META.makeTitle(document.title,location.hostname),
      url:LPM_ACCOUNT_META.safeUrl(location.href)||location.origin,
      username:pair.usernameInput?.value||'',
      password:passwordInput.value
    };
  }

  function rememberCandidate(passwordInput) {
    const entry=makeEntry(passwordInput);
    if(!entry)return null;
    lastCandidate={input:passwordInput,entry,at:Date.now()};
    return lastCandidate;
  }

  async function captureLogin(passwordInput, reason='submit', { watch=true, passive=false }={}) {
    const candidate=rememberCandidate(passwordInput);
    if(!candidate)return null;
    const signature=[location.origin,candidate.entry.username,candidate.entry.password].join('\u001f');
    const watchLevel = watch ? (passive ? 1 : 2) : 0;
    if(signature===lastCaptureSignature&&Date.now()-lastCaptureAt<650&&watchLevel<=lastCaptureWatchLevel)return null;
    lastCaptureSignature=signature; lastCaptureAt=Date.now(); lastCaptureWatchLevel=watchLevel;
    const pending=await rpc('SET_PENDING_LOGIN',{entry:candidate.entry,captureMode:passive?'passive':'active'});
    if(!pending||pending.ignored||pending.same)return pending;
    if(watch)watchLoginOutcome(passwordInput,pending,reason,{passive});
    return pending;
  }

  function candidateSignature(entry) {
    return [location.origin,String(entry?.username||''),String(entry?.password||'')].join('\u001f');
  }

  async function stageCandidate(passwordInput, reason='candidate') {
    // Once the post-login decision card is visible, field changes must not
    // replace/reopen it. The user should make one decision per login flow.
    if (savePromptEl?.isConnected) return null;
    const candidate=rememberCandidate(passwordInput);
    if(!candidate?.entry?.password)return null;
    const signature=candidateSignature(candidate.entry);
    // Stage a unique credential once per short window. Staging only writes an
    // encrypted pending candidate; it never shows a prompt until success is
    // independently detected. This catches browser-native autofill and sites
    // that submit with JavaScript without a normal submit event.
    if(signature===lastStagedSignature&&Date.now()-lastStagedAt<20_000)return null;
    lastStagedSignature=signature; lastStagedAt=Date.now();
    return captureLogin(passwordInput,reason,{watch:true,passive:true});
  }

  function captureBest(root=document,reason='submit',options={}) {
    let input=choosePasswordInput(root)||choosePasswordInput(document);
    if(!input&&lastCandidate?.input?.isConnected&&lastCandidate.input.value&&Date.now()-lastCandidate.at<60_000) input=lastCandidate.input;
    return input?captureLogin(input,reason,options):Promise.resolve(null);
  }

  function loginFieldsVisible() {
    for (const input of [...passwordInputs]) {
      if (!input.isConnected) { passwordInputs.delete(input); continue; }
      if (visible(input)) return true;
    }
    return false;
  }

  function isChallengePage() {
    const otp=[...document.querySelectorAll('input')].some(input=>visible(input)&&(
      String(input.autocomplete||'').toLowerCase()==='one-time-code'||
      /otp|totp|2fa|mfa|verification.?code|auth.?code|security.?code/i.test([input.name,input.id,input.placeholder,input.getAttribute('aria-label')].join(' '))
    ));
    if(otp)return true;
    if(loginFieldsVisible())return false;
    return /(?:^|\/)(?:otp|2fa|mfa|challenge|verify|verification|authenticator)(?:\/|$)/i.test(location.pathname);
  }

  function hasVisibleAuthError() {
    const selectors='[role="alert"],[aria-live="assertive"],[aria-live="polite"],.error,.errors,.invalid,.alert-danger,.field-error';
    const nodes=[...document.querySelectorAll(selectors)].slice(0,40);
    const errorWords=/incorrect|invalid|wrong|failed|try again|not match|نامعتبر|اشتباه|نادرست|خطا|مجدد/i;
    return nodes.some(node=>visible(node)&&errorWords.test((node.textContent||'').trim().slice(0,500)));
  }

  function hasPositiveAuthEvidence() {
    const selectors='a,button,[role="button"],[aria-label],[data-testid]';
    const words=/log\s*out|sign\s*out|my\s*account|account\s*settings|profile|dashboard|welcome|signed\s*in|login\s*successful|logged\s*in|خروج|حساب\s*(?:من|کاربری)|پروفایل|داشبورد|خوش\s*آمد|ورود\s*موفق/i;
    let checked=0;
    for (const node of document.querySelectorAll(selectors)) {
      if (++checked > 180) break;
      if (!visible(node)) continue;
      const text=[node.textContent,node.getAttribute?.('aria-label'),node.getAttribute?.('title'),node.getAttribute?.('data-testid')].filter(Boolean).join(' ').trim().slice(0,300);
      if (words.test(text)) return true;
    }
    return false;
  }

  async function confirmSuccess(evidence) {
    // Multiple password fields / SPA observers can see the same successful login.
    // Serialize confirmation so one login creates exactly one decision card.
    if (confirmSuccessInFlight || savePromptEl?.isConnected) return;
    confirmSuccessInFlight = true;
    try {
      const result=await rpc('CONFIRM_LOGIN_SUCCESS',{evidence});
      if(!result||result.ignored||result.same)return;
      if(result.autoSaved){clearPromptUi();return toast(t('autoSaved'),'success');}
      if(result.status==='confirmed')showSavePrompt(result);
    } finally { confirmSuccessInFlight = false; }
  }

  function passwordSubmissionState(passwordInput) {
    const connected=!!passwordInput?.isConnected;
    const shown=connected&&visible(passwordInput);
    const value=connected?String(passwordInput.value||''):'';
    const disabled=!!passwordInput?.disabled, readOnly=!!passwordInput?.readOnly;
    const form=passwordInput?.form||passwordInput?.closest?.('form,[role="form"]');
    const formGone=!!form&&(!form.isConnected||!visible(form));
    return {connected,shown,value,empty:connected&&!value,disabled,readOnly,formGone};
  }

  function clearLoginOutcomeWatch() {
    if (loginOutcomeWatch) clearInterval(loginOutcomeWatch);
    loginOutcomeWatch = null;
    loginOutcomeWatchPriority = 0;
    loginOutcomeWatchInput = null;
  }

  function watchLoginOutcome(passwordInput,pending,reason,{passive=false}={}) {
    const priority = passive ? 1 : 2;
    // A single page-level watcher is enough. This prevents signup/change-password
    // forms with several password inputs from opening the save UI repeatedly.
    if (loginOutcomeWatch && loginOutcomeWatchPriority > priority) return;
    clearLoginOutcomeWatch();
    loginOutcomeWatchPriority = priority;
    loginOutcomeWatchInput = passwordInput;
    const started=Date.now(); const sourceUrl=pending.sourceUrl||location.href; let candidateSince=0;
    loginOutcomeWatch=setInterval(async()=>{
      if(Date.now()-started>180_000||Date.now()>Number(pending.expiresAt||0)){clearLoginOutcomeWatch();return;}
      if(isChallengePage()||hasVisibleAuthError()){candidateSince=0;return;}
      const moved=location.href!==sourceUrl;
      const state=passwordSubmissionState(loginOutcomeWatchInput || passwordInput);
      const inputGone=!state.connected||!state.shown;
      const structuralStrong=inputGone||state.formGone||(moved&&!state.shown);
      const needsPositive = (passive && (inputGone || state.formGone || state.empty || state.disabled || state.readOnly)) || (!passive && (state.empty || state.disabled || state.readOnly));
      const positive = needsPositive ? hasPositiveAuthEvidence() : false;
      const activeStrong=structuralStrong||(state.empty&&positive)||(state.disabled&&positive)||(state.readOnly&&positive);
      const passiveStrong=positive&&(moved||inputGone||state.formGone);
      const strong=passive?passiveStrong:activeStrong;
      const weakAfterSubmit=!passive&&(Date.now()-lastSubmitIntentAt<18_000)&&(state.empty||state.disabled||state.readOnly);
      const probable=strong||weakAfterSubmit;
      if(!probable){candidateSince=0;return;}
      if(!candidateSince)candidateSince=Date.now();
      const stableFor=strong?(passive?800:1100):4200;
      if(Date.now()-candidateSince<stableFor)return;
      clearLoginOutcomeWatch();
      const evidenceText=strong?(moved?'navigation-or-route-change':`form-disappeared:${reason}`):`weak:submitted-field-settled:${reason}`;
      await confirmSuccess(evidenceText);
    },550);
  }

  function clearPromptUi(){if(savePromptTimer)clearInterval(savePromptTimer);savePromptTimer=null;savePromptEl?.remove();savePromptEl=null;savePromptSignature='';}
  function checkbox(labelText,className){const label=document.createElement('label');label.className=`lpm-save-check ${className}`;const input=document.createElement('input');input.type='checkbox';const span=document.createElement('span');span.textContent=labelText;label.append(input,span);return{label,input};}

  function promptSiteLabel(pending) {
    try { return new URL(pending?.sourceUrl || location.href).hostname.replace(/^www\./i,'') || location.hostname; }
    catch (_) { return String(location.hostname || ''); }
  }

  function showSavePrompt(pending) {
    if(!pending?.expiresAt||pending.status!=='confirmed')return;
    const signature=[pending.sourceUrl||'',pending.username||'',pending.kind||'',Number(pending.expiresAt||0)].join('\u001f');
    if(savePromptEl?.isConnected&&savePromptSignature===signature)return;
    clearPromptUi();savePromptSignature=signature;
    const prompt=document.createElement('div');prompt.className='lpm-save';applyThemeClass(prompt);prompt.dir=language==='en'?'ltr':'rtl';savePromptEl=prompt;
    const top=document.createElement('div');top.className='lpm-save-top';
    const mark=document.createElement('span');mark.className='lpm-save-mark';mark.textContent='L';
    const texts=document.createElement('div');texts.className='lpm-save-texts';
    const title=document.createElement('div');title.className='lpm-save-title';title.textContent=pending.kind==='changed'?t('saveChanged'):(pending.kind==='new'?t('saveNew'):t('saveUnknown'));
    const sub=document.createElement('div');sub.className='lpm-save-sub';
    if(pending.risk?.reusedCount){sub.textContent=t('reused',pending.risk.reusedCount);sub.classList.add('is-warning');}
    else if(!pending.unlocked){sub.textContent=t('unlockHint');sub.classList.add('is-info');}
    else sub.textContent=pending.kind==='changed'?t('previousKept'):t('reviewLogin');
    texts.append(title,sub);
    const timer=document.createElement('span');timer.className='lpm-save-timer';
    const more=document.createElement('button');more.type='button';more.className='lpm-save-more';more.textContent='⋯';more.title=t('more');more.setAttribute('aria-label',t('more'));more.setAttribute('aria-expanded','false');
    const tools=document.createElement('div');tools.className='lpm-save-tools';tools.append(timer,more);
    top.append(mark,texts,tools);

    const account=document.createElement('div');account.className='lpm-save-account';
    const accountSite=document.createElement('strong');accountSite.textContent=promptSiteLabel(pending);
    const accountUser=document.createElement('span');accountUser.textContent=pending.username||t('noUsername');
    account.append(accountSite,accountUser);

    const prefs=document.createElement('div');prefs.className='lpm-save-prefs';
    const always=checkbox(t('always'),'is-always'),never=checkbox(t('never'),'is-never');
    always.input.checked=pending.policy==='always';never.input.checked=pending.policy==='never';
    always.input.addEventListener('change',()=>{if(always.input.checked)never.input.checked=false;});
    never.input.addEventListener('change',()=>{if(never.input.checked)always.input.checked=false;});
    prefs.append(always.label,never.label);
    more.addEventListener('click',()=>{const open=!prefs.classList.contains('is-open');prefs.classList.toggle('is-open',open);more.setAttribute('aria-expanded',open?'true':'false');});

    const actions=document.createElement('div');actions.className='lpm-save-actions';
    const no=document.createElement('button');no.className='lpm-save-no';no.textContent=t('no');
    const yes=document.createElement('button');yes.className='lpm-save-yes';yes.textContent=!pending.unlocked?t('unlockSave'):(pending.kind==='changed'?t('update'):t('save'));
    actions.append(no,yes);
    prompt.append(top,account,prefs,actions);(document.documentElement||document.body)?.appendChild(prompt);
    const tick=async()=>{const remaining=Math.max(0,Number(pending.expiresAt)-Date.now());timer.textContent=t('seconds',Math.ceil(remaining/1000));if(remaining<=0){clearPromptUi();await rpc('CLEAR_PENDING_LOGIN');}};
    tick();savePromptTimer=setInterval(tick,1000);
    yes.addEventListener('click',async()=>{
      if(never.input.checked)never.input.checked=false;
      if(yes.disabled)return;
      const original=yes.textContent;yes.disabled=true;yes.textContent=t('saving');
      const remember=always.input.checked?'always':'';
      let attempt=await rpcDetailed('SAVE_PENDING_LOGIN',{remember});
      if(!attempt.ok && attempt.error==='PENDING_MISSING' && lastCandidate?.entry?.password && Date.now()-Number(lastCandidate.at||0)<180_000){
        const staged=await rpcDetailed('SET_PENDING_LOGIN',{entry:lastCandidate.entry,captureMode:'active'});
        if(staged.ok){
          const confirmed=await rpcDetailed('CONFIRM_LOGIN_SUCCESS',{evidence:'user-confirmed-save-recovery'});
          if(confirmed.ok) attempt=await rpcDetailed('SAVE_PENDING_LOGIN',{remember});
        }
      }
      yes.disabled=false;yes.textContent=original;
      if(!attempt.ok){toast(t('saveFailed'),'error');return;}
      const result=attempt.data;
      if(!result){toast(t('saveFailed'),'error');return;}
      if(result.needsUnlockSetup){toast(t('unlockOnce'),'warning');return;}
      clearPromptUi();
      if(result.saved||result.queued||result.same)invalidateCredentialCache();
      if(result.queued)toast(t('queuedLocked'),'success');
      else if(result.saved)toast(pending.kind==='changed'?t('updated'):t('saved'),'success');
      else if(result.same)toast(t('same'),'success');
      else toast(t('saveFailed'),'error');
    });
    no.addEventListener('click',async()=>{clearPromptUi();await rpc('CLEAR_PENDING_LOGIN',{siteRule:never.input.checked?'never':''});});
  }

  function watchPostNavigationPending(pending) {
    const started=Date.now(); let clearSince=0;
    const timer=setInterval(async()=>{
      if(Date.now()-started>270_000){clearInterval(timer);return;}
      if(document.visibilityState==='hidden'||document.readyState==='loading'){clearSince=0;return;}
      if(isChallengePage()||hasVisibleAuthError()){clearSince=0;return;}
      const positive = hasPositiveAuthEvidence();
      if(loginFieldsVisible() && !positive){clearSince=0;return;}
      // A candidate captured only from field/autofill observation has no proof
      // that a login was submitted. Across navigation it may simply be a Forgot
      // Password/help flow, so require positive signed-in evidence before confirming.
      if(pending?.captureMode==='passive' && !positive){clearSince=0;return;}
      if(!clearSince){clearSince=Date.now();return;}
      // Require a stable login-free page before confirming. This also covers
      // successful POSTs that return to the exact same URL while avoiding a
      // false save during slow login-form rendering.
      if(Date.now()-clearSince<1600)return;
      clearInterval(timer);await confirmSuccess('post-navigation-settled');
    },550);
  }

  async function restorePendingPrompt() {
    await refreshPrefs({force:true});
    const pending=await rpc('GET_PENDING_LOGIN');
    if(!pending)return;
    if(pending.status==='confirmed')return showSavePrompt(pending);
    if(pending.status==='captured')watchPostNavigationPending(pending);
  }

  function ensureCandidatePoll() {
    if (candidatePoll) return;
    candidatePoll = setInterval(() => {
      if (document.visibilityState === 'hidden') return;
      for (const input of [...passwordInputs]) {
        if (!input.isConnected) { passwordInputs.delete(input); continue; }
        if (visible(input) && input.value) {
          rememberCandidate(input);
          const value = String(input.value);
          const changedWithoutPageInput = lastPolledValue.get(input) !== value && Date.now() - Number(lastInputEventAt.get(input) || 0) > 250;
          lastPolledValue.set(input, value);
          if (changedWithoutPageInput) stageCandidate(input,'native-autofill').catch(()=>undefined);
        }
      }
      if (Date.now() < identityPollUntil) {
        for (const input of [...identityInputs]) {
          if (!input.isConnected) { identityInputs.delete(input); continue; }
          if (visible(input) && input.value) {
            const value=FIELDS.normalizeIdentityValue(input);
            if (value && lastIdentityValue.get(input)!==value) stageIdentity(input);
          }
        }
      } else {
        for (const input of [...identityInputs]) if (!input.isConnected) identityInputs.delete(input);
      }
      if (!passwordInputs.size && (Date.now() >= identityPollUntil || !identityInputs.size)) { clearInterval(candidatePoll); candidatePoll = null; }
    }, 450);
  }

  function attach(passwordInput) {
    if(!passwordInput||attachedPasswords.has(passwordInput)||!isPasswordLikeInput(passwordInput))return;
    attachedPasswords.add(passwordInput);passwordInputs.add(passwordInput);ensureCandidatePoll();
    const pair=fieldPair(passwordInput);attachInteractive(passwordInput,pair);attachInteractive(pair.usernameInput,pair);
    showFieldButton(passwordInput);
    scheduleSavedCredentialSuggestion(passwordInput);
    passwordInput.addEventListener('focus',()=>{rememberCandidate(passwordInput);showFieldButton(passwordInput);});
    passwordInput.addEventListener('blur',()=>{rememberCandidate(passwordInput);stageCandidate(passwordInput,'blur').catch(()=>undefined);});
    passwordInput.addEventListener('input',event=>{
      lastInputEventAt.set(passwordInput,Date.now());rememberCandidate(passwordInput);
      // Chrome/Google password autofill commonly emits one replacement-style
      // input event. Stage it immediately so a fast auto-submit/navigation does
      // not outrun the 450ms native-autofill poll. Typing still only stages an
      // encrypted candidate and never triggers a save prompt by itself.
      const replacement=event?.inputType==='insertReplacementText'||(event?.isTrusted&&event?.data==null&&String(passwordInput.value||'').length>=4);
      if(replacement)stageCandidate(passwordInput,'autofill-input').catch(()=>undefined);
    });
    passwordInput.addEventListener('change',()=>{rememberCandidate(passwordInput);stageCandidate(passwordInput,'change').catch(()=>undefined);});
    passwordInput.addEventListener('keydown',event=>{if(event.key==='Enter'&&passwordInput.value)captureLogin(passwordInput,'enter');});
  }

  function scan(root=document) {
    // One INPUT pass replaces two large complex-selector passes. Besides being
    // cheaper on SPA mutations, this lets the semantic classifier catch custom
    // masked inputs that do not match a conventional password selector.
    const inputs=[];
    if(root?.matches?.('input'))inputs.push(root);
    root?.querySelectorAll?.('input').forEach(input=>inputs.push(input));
    for(const input of inputs){
      if(isPasswordLikeInput(input)) attach(input);
      else if(FIELDS.isStrongIdentityInput(input)) attachIdentity(input);
    }

    if (root?.shadowRoot) { observeShadowRoot(root.shadowRoot); scan(root.shadowRoot); }
    queueShadowDiscovery(root);
  }

  function discoverShadowRoots(root){
    if(!root)return;
    const doc=root.ownerDocument||document;
    let walker;
    try{walker=doc.createTreeWalker(root,NodeFilter.SHOW_ELEMENT);}catch{return;}
    let node=walker.currentNode;
    while(node){
      if(node!==root&&node.shadowRoot){observeShadowRoot(node.shadowRoot);scan(node.shadowRoot);}
      node=walker.nextNode();
    }
  }

  function queueShadowDiscovery(root){
    if(!root)return;
    shadowDiscoveryQueue.add(root);
    if(shadowDiscoveryScheduled)return;
    shadowDiscoveryScheduled=true;
    const run=()=>{
      shadowDiscoveryScheduled=false;
      const batch=[...shadowDiscoveryQueue];shadowDiscoveryQueue.clear();
      for(const item of batch)discoverShadowRoots(item);
    };
    if(typeof requestIdleCallback==='function')requestIdleCallback(run,{timeout:120});
    else setTimeout(run,0);
  }

  const shadowObservers=new WeakSet();
  const scanQueue=new Set();
  let scanFrame=0;

  function queueScan(node){
    if(!node||node.nodeType!==1)return;
    scanQueue.add(node);
    if(scanFrame)return;
    scanFrame=requestAnimationFrame(()=>{
      scanFrame=0;
      const batch=[...scanQueue];scanQueue.clear();
      for(const item of batch){
        if(batch.some(parent=>parent!==item&&parent.contains?.(item)))continue;
        scan(item);
      }
    });
  }

  function observeShadowRoot(root){
    if(!root||shadowObservers.has(root))return;shadowObservers.add(root);
    installLoginCaptureListeners(root);
    new MutationObserver(muts=>{for(const m of muts){for(const node of m.addedNodes)queueScan(node);if(m.removedNodes?.length)scheduleOverlayPosition();}}).observe(root,{childList:true,subtree:true});
  }

  function startObserver(){
    const root=document.documentElement;if(!root)return setTimeout(startObserver,20);
    scan(document);
    observer=new MutationObserver(mutations=>{
      for(const mutation of mutations){
        for(const node of mutation.addedNodes)queueScan(node);
        if(mutation.removedNodes?.length)scheduleOverlayPosition();
      }
    });
    observer.observe(root,{childList:true,subtree:true});
  }

  function eventSource(event) {
    try { const path = event?.composedPath?.(); if (path?.length) return path[0]; } catch (_) {}
    return event?.target || null;
  }

  function isLikelySubmitControl(target) {
    const el=target?.closest?.('button,input[type="submit"],input[type="button"],[role="button"],[onclick],a');
    if(!el || el.disabled || el.getAttribute?.('aria-disabled') === 'true')return null;
    const text=[el.textContent,el.value,el.getAttribute('aria-label'),el.getAttribute('title'),el.name,el.id].join(' ').trim();
    // Do not treat account-help/navigation controls as a login submission merely
    // because they live beside a non-empty password field. This fixed false save
    // prompts after Forgot password / Cancel / Back links removed the login form.
    if(/show\s*password|hide\s*password|toggle\s*password|forgot|reset\s*password|recover|cancel|go\s*back|help|نمایش\s*رمز|مخفی\s*کردن\s*رمز|فراموش|بازیابی\s*رمز|لغو|بازگشت|راهنما/i.test(text))return null;
    if(el.matches('button[type="submit"],input[type="submit"]'))return el;
    if(/log\s*in|sign\s*in|continue|next|submit|register|create\s*account|ورود|ادامه|بعدی|ثبت|ایجاد\s*حساب|ساخت\s*حساب|ت[أا]یید/i.test(text))return el;
    // Unlabelled custom submit controls are common, but plain anchors are too
    // ambiguous (forgot-password/help links). Restrict the fallback to controls.
    if(!el.matches('button,input[type="button"],[role="button"],[onclick]'))return null;
    const root=el.form||el.closest?.('form')||el.getRootNode?.()||document;
    return choosePasswordInput(root)?el:null;
  }

  function fastCaptureOnExit(reason) {
    if (Date.now() - lastSubmitIntentAt > 8000) return;
    let candidate=lastCandidate;
    if(!candidate||Date.now()-candidate.at>30_000){const input=choosePasswordInput(document);if(input)candidate=rememberCandidate(input);}
    if(!candidate?.entry?.password)return;
    // Fire-and-forget: pointer/submit capture normally wins; this is a final
    // fallback for sites that navigate through custom JS handlers.
    try{chrome.runtime.sendMessage({type:'SET_PENDING_LOGIN',entry:candidate.entry,captureMode:'active'});}catch(_){}
  }

  function onLoginSubmit(event) {
    lastSubmitIntentAt=Date.now();
    captureBest(event.target?.querySelectorAll?event.target:document,'submit');
  }
  function onLoginFormData(event) {
    lastSubmitIntentAt=Date.now();
    captureBest(event.target?.querySelectorAll?event.target:document,'formdata');
  }
  function onLoginPointerDown(event) {
    const source=eventSource(event);
    const control=isLikelySubmitControl(source);if(!control)return;
    const stamp=Date.now();
    if(event.type==='click'&&control===lastPointerSubmitControl&&stamp-lastPointerSubmitAt<900)return;
    if(event.type==='pointerdown'){lastPointerSubmitControl=control;lastPointerSubmitAt=stamp;}
    lastSubmitIntentAt=stamp;
    const root=control.form||control.closest?.('form')||event.currentTarget||document;
    const identity=[...(root?.querySelectorAll?.('input')||[])].find(input=>FIELDS.isStrongIdentityInput(input)&&String(input.value||'').trim());
    if(identity)stageIdentity(identity,{force:true});
    captureBest(root,'button');
  }
  function onLoginEnter(event) {
    if(event.key!=='Enter')return;
    lastSubmitIntentAt=Date.now();
    const source=eventSource(event);
    if(FIELDS.isStrongIdentityInput(source))stageIdentity(source);
    const root=source?.form||source?.closest?.('form')||source?.getRootNode?.()||event.currentTarget||document;captureBest(root,'enter-global');
  }
  function installLoginCaptureListeners(root) {
    root.addEventListener('submit',onLoginSubmit,true);
    root.addEventListener('formdata',onLoginFormData,true);
    root.addEventListener('pointerdown',onLoginPointerDown,true);
    root.addEventListener('click',onLoginPointerDown,true);
    root.addEventListener('keydown',onLoginEnter,true);
  }

  installLoginCaptureListeners(document);
  // Focus events from open Shadow DOM are retargeted to the host, but the
  // composed path still exposes the real input. Attach lazily so autofill works
  // even when a pre-existing host creates its shadow root after document_start.
  document.addEventListener('focusin',event=>{
    const source=eventSource(event);
    if (FIELDS.isStrongIdentityInput(source)) attachIdentity(source);
    if(!isPasswordLikeInput(source))return;
    attach(source);rememberCandidate(source);showFieldButton(source);
    const pair=pairByField.get(source)||fieldPair(source);
    const scope=chooserScopeFor(source,pair);
    if(!String(source.value||'').length && (!scope || !autoChooserShownScopes.has(scope))){
      if(scope)autoChooserShownScopes.add(scope);
      setTimeout(()=>{if(isInputFocused(source)&&!String(source.value||'').length)showChooser(source,{manual:false});},55);
    }
  },true);
  document.addEventListener('pointerdown',event=>{
    const path=event.composedPath?.()||[];
    const onFieldButton=path.some(node=>node?.classList?.contains?.('lpm-key-btn'));
    if(chooser&&!chooser.contains(event.target)&&event.target!==chooserAnchor&&!onFieldButton)closeChooser();
  },true);
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')fastCaptureOnExit('hidden');});
  window.addEventListener('pagehide',()=>fastCaptureOnExit('pagehide'),{capture:true});
  window.addEventListener('beforeunload',()=>fastCaptureOnExit('beforeunload'),{capture:true});
  window.addEventListener('scroll',scheduleOverlayPosition,{passive:true,capture:true});
  window.addEventListener('resize',scheduleOverlayPosition,{passive:true});
  window.addEventListener('pageshow',restorePendingPrompt,{once:true});
  document.addEventListener('keydown',event=>{if(event.key==='Escape')closeChooser();},true);

  // Candidate polling starts only after a password field exists and stops again
  // when those fields leave the document. It catches browser-native autofill
  // without keeping a timer alive on ordinary pages or empty iframes.

  startObserver();
  restorePendingPrompt();
})();
