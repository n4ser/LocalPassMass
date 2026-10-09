/* LocalPassMass field heuristics. Pure DOM helpers kept separate so login
   detection can evolve without growing the content-script controller. */
(() => {
  if (globalThis.LPM_FIELDS) return;

  const PASSWORD_SELECTOR = [
    'input[type="password"]',
    'input[autocomplete~="current-password"]',
    'input[autocomplete~="new-password"]',
    'input[name*="password" i]', 'input[name="passwd" i]', 'input[name="pwd" i]',
    'input[id*="password" i]', 'input[id="passwd" i]', 'input[id="pwd" i]',
    'input[aria-label*="password" i]', 'input[data-testid*="password" i]'
  ].join(',');

  const STRONG_IDENTITY_SELECTOR = [
    'input[autocomplete~="username"]','input[autocomplete~="email"]',
    'input[type="email"]','input[type="tel"]',
    'input[inputmode="email"]','input[inputmode="tel"]','input[inputmode="numeric"]',
    'input[name*="user" i]','input[name*="login" i]','input[name*="email" i]','input[name*="mail" i]',
    'input[name*="mobile" i]','input[name*="phone" i]','input[name*="account" i]','input[name*="identifier" i]',
    'input[id*="user" i]','input[id*="login" i]','input[id*="email" i]','input[id*="mobile" i]','input[id*="phone" i]',
    'input[aria-label*="user" i]','input[aria-label*="email" i]','input[aria-label*="mobile" i]','input[aria-label*="phone" i]',
    // Broad identity candidates are filtered by isStrongIdentityInput(). This lets
    // us recognize fields whose only useful signal lives in a <label> or placeholder.
    'input:not([type])','input[type="text"]','input[type="email"]','input[type="tel"]','input[type="number"]','input[type="search"]'
  ].join(',');

  const USER_WORDS_EN = /(?:^|\b)(?:user(?:name)?|login|logon|email|e-mail|mail|account|identifier|phone|mobile|tel(?:ephone)?|cell|member|customer|subscriber|client|national.?id)(?:\b|$)/i;
  const USER_WORDS_FA = /شماره\s*(?:موبایل|تلفن|همراه|مشتری|حساب)|موبایل|تلفن|ایمیل|پست\s*الکترونیک|نام\s*کاربری|کد\s*کاربری|شناسه\s*(?:کاربری|ورود)|حساب\s*کاربری|کاربر|شماره\s*همراه|کد\s*ملی|شناسه/i;
  const USER_WORDS = { test:text => USER_WORDS_EN.test(String(text||'')) || USER_WORDS_FA.test(String(text||'')) };
  const OTP_WORDS = /(?:otp|totp|2fa|mfa|one.?time|verification.?code|auth.?code|کد\s*(?:تایید|تأیید|احراز|یکبار|یک\s*بار)|رمز\s*(?:پویا|یکبار|یک\s*بار))/i;
  // Payment-card secrets often use type=password to hide CVV2 / dynamic card
  // passwords. They are not website account passwords and must never trigger
  // vault save/autofill/generator UI.
  const PAYMENT_SECRET_WORDS = /(?:cvv2?|cvc2?|(?:^|[\s_\-])cid(?:$|[\s_\-])|(?:^|[\s_\-])csc(?:$|[\s_\-])|cc.?csc|card.?verification|card.?security|card.?code|mpja|mpin)/i;
  const PAYMENT_SECRET_FA = /(?:کد\s*امنیتی\s*کارت|سی\s*وی\s*وی|رمز\s*(?:پویا|کارت|خرید|دوم\s*کارت)|رمز\s*اینترنتی\s*کارت|رمز\s*یکبار\s*(?:مصرف)?\s*کارت)/i;
  const CARD_CONTEXT_WORDS = /(?:card.?number|credit.?card|debit.?card|pan|expiry|expiration|exp.?date|cc.?number|cc.?exp|شماره\s*کارت|تاریخ\s*انقضا|ماه\s*انقضا|سال\s*انقضا|درگاه\s*پرداخت|پرداخت\s*اینترنتی|شاپرک)/i;
  const PASS_WORDS = /(?:password|passwd|passcode|pin|رمز\s*(?:عبور|ورود)|گذرواژه)/i;

  function visible(el) {
    if (!el?.isConnected) return false;
    const rect = el.getBoundingClientRect?.();
    if (!rect || rect.width <= 0 || rect.height <= 0) return false;
    const style = getComputedStyle(el);
    return style.visibility !== 'hidden' && style.display !== 'none' && Number(style.opacity || 1) !== 0;
  }

  function autocompleteTokens(input) {
    return String(input?.getAttribute?.('autocomplete') || input?.autocomplete || '')
      .toLowerCase().trim().split(/\s+/).filter(Boolean);
  }

  function labelsText(input) {
    const parts = [];
    try {
      if (input.labels?.length) for (const label of input.labels) parts.push(label.textContent || '');
    } catch (_) {}
    try {
      const parentLabel = input.closest?.('label');
      if (parentLabel) parts.push(parentLabel.textContent || '');
      // A very common component pattern (including the user's reported case) is
      // <div><label>Mobile</label><input ...></div> without for/id linkage.
      // Treat a short adjacent/direct label as field metadata too.
      const previous = input.previousElementSibling;
      if (previous?.tagName === 'LABEL') parts.push(previous.textContent || '');
      const direct = input.parentElement?.querySelector?.(':scope > label');
      if (direct && direct !== parentLabel && direct !== previous) parts.push(direct.textContent || '');
      const labelledBy = String(input.getAttribute?.('aria-labelledby') || '').trim().split(/\s+/).filter(Boolean);
      const root = input.getRootNode?.() || document;
      for (const ref of labelledBy.slice(0,4)) {
        const target = root.getElementById?.(ref) || document.getElementById?.(ref);
        if (target) parts.push(target.textContent || '');
      }
    } catch (_) {}
    try {
      const id = input.id;
      if (id) {
        const root = input.getRootNode?.() || document;
        const escaped = globalThis.CSS?.escape ? CSS.escape(id) : String(id).replace(/["\\]/g, '\\$&');
        const label = root.querySelector?.(`label[for="${escaped}"]`);
        if (label) parts.push(label.textContent || '');
      }
    } catch (_) {}
    return parts.join(' ').replace(/\s+/g, ' ').trim();
  }

  function fieldText(input) {
    return [
      input?.name, input?.id, input?.getAttribute?.('autocomplete'), input?.placeholder,
      input?.getAttribute?.('aria-label'), input?.getAttribute?.('data-testid'),
      input?.getAttribute?.('data-test'), labelsText(input)
    ].filter(Boolean).join(' ').replace(/\s+/g, ' ').slice(0, 1200);
  }

  function isSignupContext(input, scope = null) {
    const root = scope || input?.form || input?.closest?.('form,[role="form"]') || null;
    let text = fieldText(input);
    try {
      if (root?.querySelectorAll) {
        const controls=[...root.querySelectorAll('button,input[type="submit"],[role="button"]')].slice(0,30);
        text += ' ' + controls.map(el=>[el.textContent,el.value,el.getAttribute?.('aria-label'),el.name,el.id].filter(Boolean).join(' ')).join(' ');
        text += ' ' + String(root.textContent||'').slice(0,2200);
      }
    } catch (_) {}
    const signup=/(?:sign\s*up|signup|register|create\s*(?:an?\s*)?account|new\s*account|join|ثبت\s*نام|نام\s*نویسی|ایجاد\s*حساب|ساخت\s*حساب|عضویت)/i.test(text);
    const login=/(?:log\s*in|sign\s*in|ورود\s*به\s*حساب|ورود)/i.test(text);
    return signup || (!login && autocompleteTokens(input).includes('new-password'));
  }

  function nearbyText(input) {
    const parts = [fieldText(input)];
    try {
      const form = input?.form || input?.closest?.('form,[role="form"]');
      if (form) parts.push(String(form.textContent || '').slice(0, 2200));
      else {
        let node=input?.parentElement;
        for(let i=0;node&&i<3;i++,node=node.parentElement) parts.push(String(node.textContent||'').slice(0,700));
      }
    } catch (_) {}
    return parts.join(' ').replace(/\s+/g,' ').slice(0,3600);
  }

  function isPaymentSecretInput(input) {
    if (!input || input.tagName !== 'INPUT') return false;
    const tokens=autocompleteTokens(input);
    if (tokens.includes('cc-csc')) return true;
    const own=fieldText(input);
    if (PAYMENT_SECRET_WORDS.test(own) || PAYMENT_SECRET_FA.test(own)) return true;
    // A generic "security code" is ambiguous. Treat it as a payment secret only
    // when the surrounding form also looks like a card/payment form.
    const genericSecurity=/(?:security.?code|کد\s*امنیتی|رمز\s*دوم)/i.test(own);
    if (genericSecurity && CARD_CONTEXT_WORDS.test(nearbyText(input))) return true;
    return false;
  }

  function isPasswordLikeInput(input) {
    if (!input || input.tagName !== 'INPUT' || input.disabled) return false;
    const type = String(input.type || '').toLowerCase();
    if (type === 'hidden') return false;
    const tokens = autocompleteTokens(input);
    if (isPaymentSecretInput(input)) return false;
    if (tokens.includes('one-time-code') || OTP_WORDS.test(fieldText(input))) return false;
    if (type === 'password' || tokens.includes('current-password') || tokens.includes('new-password')) return true;
    // Some component libraries keep type=text and mask the field themselves.
    // Only accept strong password metadata to avoid treating arbitrary text or PIN
    // fields as secrets.
    if (!['text','search',''].includes(type)) return false;
    const meta = fieldText(input);
    const exact = /(?:^|[\s_\-])(password|passwd|pwd|pass|userpass|گذرواژه|رمز\s*(?:عبور|ورود))(?=$|[\s_\-])/i.test(meta);
    let masked = false;
    try { const css=getComputedStyle(input); masked=String(css.webkitTextSecurity||css.getPropertyValue?.('-webkit-text-security')||'').toLowerCase() && String(css.webkitTextSecurity||css.getPropertyValue?.('-webkit-text-security')||'').toLowerCase()!=='none'; } catch (_) {}
    return !!exact || !!masked;
  }

  function isOtpLike(input) {
    if (!input || input.tagName !== 'INPUT') return false;
    const tokens = autocompleteTokens(input);
    return tokens.includes('one-time-code') || OTP_WORDS.test(fieldText(input));
  }

  function inputTypeAllowedForIdentity(input) {
    const type = String(input?.type || 'text').toLowerCase();
    return ['text','email','tel','number','search','url',''].includes(type);
  }

  function identityScore(input, passwordInput = null, index = 0, passwordIndex = 0) {
    if (!input || input === passwordInput || input.disabled || !inputTypeAllowedForIdentity(input) || isOtpLike(input)) return -Infinity;
    const tokens = autocompleteTokens(input);
    const type = String(input.type || '').toLowerCase();
    const inputMode = String(input.inputMode || input.getAttribute?.('inputmode') || '').toLowerCase();
    const text = fieldText(input);
    let score = 0;
    if (tokens.includes('username')) score += 140;
    if (tokens.includes('email')) score += 90;
    if (type === 'email' || inputMode === 'email') score += 70;
    if (type === 'tel' || inputMode === 'tel' || inputMode === 'numeric') score += 45;
    if (USER_WORDS.test(text)) score += 75;
    if (PASS_WORDS.test(text)) score -= 100;
    if (tokens.includes('off') || tokens.includes('new-password') || tokens.includes('current-password')) score -= 60;
    if (passwordInput) {
      if (index <= passwordIndex) score += 24;
      const distance = Math.abs(passwordIndex - index);
      score += Math.max(0, 22 - distance * 4);
    }
    if (input.readOnly) score -= 5;
    if (!visible(input)) score -= 30;
    return score;
  }

  function scopeForPassword(passwordInput) {
    const form = passwordInput?.form || passwordInput?.closest?.('form,[role="form"]');
    if (form) return form;
    let node = passwordInput?.parentElement || null;
    let fallback = passwordInput?.getRootNode?.() || document;
    for (let depth = 0; node && depth < 7; depth++, node = node.parentElement) {
      const inputs = [...(node.querySelectorAll?.('input') || [])];
      if (inputs.includes(passwordInput) && inputs.length >= 2 && inputs.length <= 16) {
        fallback = node;
        if (inputs.some(input => input !== passwordInput && identityScore(input, passwordInput, inputs.indexOf(input), inputs.indexOf(passwordInput)) >= 60)) return node;
      }
    }
    return fallback;
  }

  function fieldPair(passwordInput) {
    const scope = scopeForPassword(passwordInput);
    const inputs = [...(scope?.querySelectorAll?.('input') || [])];
    const passwordIndex = Math.max(0, inputs.indexOf(passwordInput));
    const candidates = inputs
      .map((input, index) => ({ input, index, score:identityScore(input, passwordInput, index, passwordIndex) }))
      .filter(item => item.score > -Infinity)
      .sort((a,b) => b.score - a.score || Math.abs(passwordIndex-a.index) - Math.abs(passwordIndex-b.index));
    const strong = candidates.find(item => item.score >= 45);
    const fallback = candidates.find(item => item.index <= passwordIndex && visible(item.input));
    return { usernameInput:(strong || fallback)?.input || null, passwordInput };
  }

  function queryPasswords(root = document, { requireValue = false } = {}) {
    // Scan INPUT elements once and let the semantic classifier decide. This is
    // both faster than several complex selector passes and also catches masked
    // text inputs whose only password signal comes from CSS/metadata.
    const list = [];
    if (root?.matches?.('input') && isPasswordLikeInput(root)) list.push(root);
    for (const input of (root?.querySelectorAll?.('input') || [])) if (isPasswordLikeInput(input)) list.push(input);
    const unique = [...new Set(list)].filter(visible);
    return requireValue ? unique.filter(input => String(input.value || '').length > 0) : unique;
  }

  function choosePasswordInput(root = document) {
    const passwords = queryPasswords(root, { requireValue:true });
    if (!passwords.length) return null;
    // Registration/change forms usually have new-password + confirmation. Prefer
    // the repeated value so we do not accidentally capture the old password.
    for (let i=passwords.length-1; i>0; i--) {
      if (passwords[i].value && passwords[i].value === passwords[i-1].value) return passwords[i];
    }
    const newPassword = passwords.findLast?.(input => autocompleteTokens(input).includes('new-password'));
    return newPassword || passwords[passwords.length - 1];
  }

  function isStrongIdentityInput(input) {
    if (!input || input.tagName !== 'INPUT' || input.disabled || !inputTypeAllowedForIdentity(input) || isOtpLike(input)) return false;
    const tokens = autocompleteTokens(input);
    if (tokens.includes('username')) return true;
    const type = String(input.type || '').toLowerCase();
    const inputMode = String(input.inputMode || input.getAttribute?.('inputmode') || '').toLowerCase();
    const meta = fieldText(input);
    // Fast reject broad text candidates before identityScore() reaches its
    // visibility/computed-style work. This keeps label-based support without
    // turning every ordinary text input on a large page into a costly candidate.
    const semantic = tokens.includes('email') || type === 'email' || type === 'tel' || inputMode === 'email' || inputMode === 'tel' || inputMode === 'numeric' || USER_WORDS.test(meta);
    if (!semantic) return false;
    const score = identityScore(input, null, 0, 0);
    return score >= 90 || (USER_WORDS.test(meta) && score >= 65) || ((type === 'email' || type === 'tel') && score >= 60);
  }

  function normalizeIdentityValue(input) {
    return String(input?.value || '').trim().slice(0, 1000);
  }

  globalThis.LPM_FIELDS = Object.freeze({
    PASSWORD_SELECTOR, STRONG_IDENTITY_SELECTOR, visible, fieldText,
    isPasswordLikeInput, isPaymentSecretInput, isOtpLike, isStrongIdentityInput, isSignupContext,
    fieldPair, queryPasswords, choosePasswordInput, normalizeIdentityValue,
    identityScore, autocompleteTokens
  });
})();
