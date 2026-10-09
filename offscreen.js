let clearTimer = null;

async function writeClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    ta.remove();
  }
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg?.target !== 'offscreen') return false;
  (async () => {
    if (msg.type === 'CLIPBOARD_WRITE') {
      if (clearTimer) clearTimeout(clearTimer);
      await writeClipboard(String(msg.text || ''));
      clearTimer = setTimeout(() => writeClipboard(''), Math.max(1000, Number(msg.clearAfterMs || 20000)));
      return true;
    }
    if (msg.type === 'CLIPBOARD_CLEAR') {
      if (clearTimer) clearTimeout(clearTimer);
      await writeClipboard('');
      return true;
    }
  })().then(v => sendResponse({ ok: true, data: v })).catch(e => sendResponse({ ok: false, error: e.message }));
  return true;
});
