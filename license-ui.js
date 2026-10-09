/* License controls are independent of vault unlock and credential data. */
const LPM_LICENSE_UI = (() => {
  const STORAGE_KEY = 'lpmProLicenseToken';
  const input = document.getElementById('proLicenseInput');
  const status = document.getElementById('proLicenseStatus');
  const activate = document.getElementById('proActivateBtn');
  const remove = document.getElementById('proRemoveBtn');
  const buy = document.getElementById('proBuyBtn');
  const badge = document.getElementById('proPlanBadge');
  const showCode = document.getElementById('proShowCodeBtn');
  if (buy) buy.href = LPM_LICENSE_CONFIG.checkoutUrl;

  function setStatus(key, kind = 'neutral') {
    status.textContent = t(key);
    status.dataset.kind = kind;
    if (badge) {
      badge.textContent = t(kind === 'success' ? 'proBadgeActive' : 'proBadgeFree');
      badge.dataset.kind = kind === 'success' ? 'pro' : 'free';
    }
  }
  if (showCode) showCode.addEventListener('click', () => {
    const visible = input.type === 'text';
    input.type = visible ? 'password' : 'text';
    showCode.setAttribute('aria-pressed', String(!visible));
    showCode.textContent = t(visible ? 'proShowCode' : 'proHideCode');
  });
  async function refresh() {
    try {
      const saved = await chrome.storage.local.get(STORAGE_KEY);
      if (!saved[STORAGE_KEY]) {
        setStatus('proStatusFree');
        remove.classList.add('hidden');
        return;
      }
      const result = await LPM_LICENSE.verify(saved[STORAGE_KEY], LPM_LICENSE_CONFIG.publicKey);
      if (result.ok) {
        setStatus('proStatusActive', 'success');
        remove.classList.remove('hidden');
      } else {
        setStatus(result.reason === 'LICENSE_EXPIRED' ? 'proStatusExpired' :
          result.reason === 'LICENSE_NOT_CONFIGURED' ? 'proStatusNotReady' : 'proStatusInvalid', 'error');
        remove.classList.remove('hidden');
      }
    } catch {
      setStatus('proStatusError', 'error');
    }
  }
  activate.addEventListener('click', async () => {
    const token = input.value.trim();
    if (!token) { setStatus('proEnterCode', 'error'); return; }
    activate.disabled = true;
    try {
      const result = await LPM_LICENSE.verify(token, LPM_LICENSE_CONFIG.publicKey);
      if (!result.ok) {
        setStatus(result.reason === 'LICENSE_NOT_CONFIGURED' ? 'proStatusNotReady' :
          result.reason === 'LICENSE_EXPIRED' ? 'proStatusExpired' : 'proStatusInvalid', 'error');
        return;
      }
      await chrome.storage.local.set({ [STORAGE_KEY]:token });
      input.value = '';
      input.type = 'password';
      if (showCode) { showCode.setAttribute('aria-pressed', 'false'); showCode.textContent = t('proShowCode'); }
      await refresh();
    } catch {
      setStatus('proStatusError', 'error');
    } finally {
      activate.disabled = false;
    }
  });
  input.addEventListener('keydown', event => { if (event.key === 'Enter') activate.click(); });
  remove.addEventListener('click', async () => {
    try {
      await chrome.storage.local.remove(STORAGE_KEY);
      input.value = '';
      await refresh();
    } catch { setStatus('proStatusError', 'error'); }
  });
  void refresh();
  return Object.freeze({ refresh });
})();
