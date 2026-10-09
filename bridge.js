/* LocalPassMass Native Messaging bridge client. */
const LPM_BRIDGE = (() => {
  const HOST = 'ir.inaser.localpassmass';
  const CHUNK = 420000; // safely below Chrome's 1 MB native-host response limit.
  const MAX_DOCUMENT_BYTES = 40 * 1024 * 1024; // headroom for JSON framing under Chrome's 64 MiB extension->host limit.

  async function hasPermission() {
    return chrome.permissions.contains({ permissions: ['nativeMessaging'] });
  }

  async function send(message) {
    if (!(await hasPermission())) throw new Error('BRIDGE_PERMISSION_REQUIRED');
    let reply;
    try { reply = await chrome.runtime.sendNativeMessage(HOST, message); }
    catch (e) {
      const m=String(e?.message||'');
      if (/host.*not found|native messaging host.*not found|not registered/i.test(m)) throw new Error('BRIDGE_NOT_INSTALLED');
      if (/forbidden|not allowed|access.*denied|specified native messaging host.*forbidden/i.test(m)) throw new Error('BRIDGE_PROFILE_NOT_REGISTERED');
      throw new Error('BRIDGE_UNAVAILABLE');
    }
    if (!reply || reply.ok !== true) throw new Error(reply?.error || 'BRIDGE_ERROR');
    return reply.data;
  }

  async function ping() { return send({ op: 'ping' }); }

  async function readDocument(path) {
    const info = await send({ op: 'read_info', path });
    if (!info?.exists) return null;
    const length = Number(info.length || 0);
    if (length < 0 || length > MAX_DOCUMENT_BYTES) throw new Error('BRIDGE_FILE_TOO_LARGE');
    const token = String(info.token || '');
    if (!/^[a-f0-9]{32}$/i.test(token)) throw new Error('BRIDGE_READ_FAILED');
    let offset = 0;
    const bytes = new Uint8Array(length);
    while (offset < length) {
      const part = await send({ op: 'read_chunk', token, offset, length: Math.min(CHUNK, length - offset) });
      const encoded = String(part?.data || '');
      const got = Number(part?.bytes || 0);
      if (!encoded || got <= 0 || offset + got > length) throw new Error('BRIDGE_READ_FAILED');
      let raw;
      try { raw = atob(encoded); } catch { throw new Error('BRIDGE_READ_FAILED'); }
      if (raw.length !== got) throw new Error('BRIDGE_READ_FAILED');
      for (let i = 0; i < got; i++) bytes[offset + i] = raw.charCodeAt(i);
      offset += got;
    }
    let doc;
    try { doc = JSON.parse(new TextDecoder().decode(bytes)); } catch { throw new Error('SHARED_VAULT_INVALID'); }
    return doc;
  }

  async function writeDocument(path, doc, expectedGeneration, options = {}) {
    const text = JSON.stringify(doc);
    if (new TextEncoder().encode(text).byteLength > MAX_DOCUMENT_BYTES) throw new Error('BRIDGE_FILE_TOO_LARGE');
    return send({
      op: 'write_vault', path, document: text,
      expectedGeneration: Number(expectedGeneration || 0),
      backupDir: String(options.backupDir || ''),
      backupMax: options.backupEnabled === false ? 0 : Math.max(1, Math.min(20, Number(options.backupMax || 5)))
    });
  }

  async function createSecret(vaultId) { return send({ op: 'create_secret', vaultId }); }
  async function getSecret(vaultId) { return send({ op: 'get_secret', vaultId }); }
  async function listBackups(path, backupDir) { return send({ op: 'list_backups', path, backupDir: String(backupDir || '') }); }
  async function validatePath(path) { return send({ op: 'validate_path', path }); }

  return { HOST, hasPermission, send, ping, readDocument, writeDocument, createSecret, getSecret, listBackups, validatePath };
})();
