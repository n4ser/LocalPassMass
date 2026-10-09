/* LocalPassMass site/origin helpers. No network access. */
const LPM_SITE = (() => {
  function normalizeHost(value) {
    if (!value) return '';
    try {
      const u = value.includes('://') ? new URL(value) : new URL('https://' + value);
      return u.hostname.toLowerCase().replace(/^www\./, '').replace(/\.$/, '');
    } catch {
      return String(value).trim().toLowerCase().replace(/^www\./, '').replace(/\.$/, '').split('/')[0];
    }
  }

  function siteScope(value) {
    const host = normalizeHost(value);
    return LP_PSL.registrableDomain(host) || host;
  }

  function hostMatches(currentHost, entryHost, subdomains) {
    currentHost = normalizeHost(currentHost);
    entryHost = normalizeHost(entryHost);
    if (!currentHost || !entryHost) return false;
    if (currentHost === entryHost) return true;
    if (!subdomains) return false;
    const a = siteScope(currentHost), b = siteScope(entryHost);
    return !!a && a === b;
  }

  // Fail closed: an invalid/unknown action is not considered safe.
  function formActionSafe(currentHost, actionUrl, credentialUrl) {
    try {
      const currentScope = siteScope(currentHost);
      const action = new URL(actionUrl);
      if (!['http:', 'https:'].includes(action.protocol)) return false;
      const actionScope = siteScope(action.hostname);
      const savedScope = siteScope(credentialUrl);
      if (!currentScope || !actionScope) return false;
      return actionScope === currentScope || (!!savedScope && actionScope === savedScope);
    } catch {
      return false;
    }
  }

  function senderPage(sender) {
    const raw = sender?.url || sender?.tab?.url || '';
    try {
      const u = new URL(raw);
      if (!['http:', 'https:'].includes(u.protocol)) return null;
      return { url: u.href, host: normalizeHost(u.hostname), protocol: u.protocol, origin: u.origin, tabId:Number(sender?.tab?.id), frameId:Number.isInteger(sender?.frameId)?sender.frameId:0 };
    } catch {
      return null;
    }
  }

  return { normalizeHost, siteScope, hostMatches, formActionSafe, senderPage };
})();
