/* LocalPass cryptography helpers. Uses only Web Crypto primitives. */
const LP = (() => {
  const enc = new TextEncoder();
  const dec = new TextDecoder();

  function bytesToB64(bytes) {
    let binary = '';
    const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
    for (let i = 0; i < arr.length; i++) binary += String.fromCharCode(arr[i]);
    return btoa(binary);
  }

  function b64ToBytes(str) {
    const binary = atob(str);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes;
  }

  function concatBytes(...parts) {
    const arrays = parts.map(p => p instanceof Uint8Array ? p : new Uint8Array(p));
    const total = arrays.reduce((n, a) => n + a.length, 0);
    const out = new Uint8Array(total);
    let offset = 0;
    for (const a of arrays) {
      out.set(a, offset);
      offset += a.length;
    }
    return out;
  }

  function randomBytes(n) {
    return crypto.getRandomValues(new Uint8Array(n));
  }

  async function derivePasswordKey(password, pepper, salt, iterations = 600000) {
    const material = concatBytes(enc.encode(password), pepper);
    const baseKey = await crypto.subtle.importKey('raw', material, 'PBKDF2', false, ['deriveKey']);
    return crypto.subtle.deriveKey(
      { name: 'PBKDF2', hash: 'SHA-256', salt, iterations },
      baseKey,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }

  async function importAesKey(raw, usages = ['encrypt', 'decrypt']) {
    return crypto.subtle.importKey('raw', raw, { name: 'AES-GCM' }, false, usages);
  }

  async function aesEncrypt(key, bytes, aadText = '') {
    const iv = randomBytes(12);
    const params = { name: 'AES-GCM', iv };
    if (aadText) params.additionalData = enc.encode(aadText);
    const cipher = await crypto.subtle.encrypt(params, key, bytes);
    return { iv: bytesToB64(iv), cipher: bytesToB64(new Uint8Array(cipher)) };
  }

  async function aesDecrypt(key, payload, aadText = '') {
    const params = { name: 'AES-GCM', iv: b64ToBytes(payload.iv) };
    if (aadText) params.additionalData = enc.encode(aadText);
    const plain = await crypto.subtle.decrypt(params, key, b64ToBytes(payload.cipher));
    return new Uint8Array(plain);
  }

  function keyToText(bytes) {
    const hex = [...bytes].map(b => b.toString(16).padStart(2, '0').toUpperCase()).join('');
    return 'LP1-' + hex.match(/.{1,4}/g).join('-');
  }

  function textToKey(text) {
    const source = String(text || '').trim().toUpperCase();
    // Recovery files contain explanatory text around the key. Extract the LP1
    // token first; still accept a raw 64-hex key for backwards compatibility.
    const match = source.match(/LP1-(?:[0-9A-F]{4}-){15}[0-9A-F]{4}/);
    const candidate = match ? match[0] : source;
    const clean = candidate.replace(/^LP1-/, '').replace(/[^0-9A-F]/g, '');
    if (clean.length !== 64) throw new Error('RECOVERY_KEY_INVALID');
    const out = new Uint8Array(32);
    for (let i = 0; i < 32; i++) out[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16);
    return out;
  }

  async function wrapVaultKeyWithPassword(vaultKeyBytes, password, pepper, salt, iterations) {
    const key = await derivePasswordKey(password, pepper, salt, iterations);
    return aesEncrypt(key, vaultKeyBytes, 'LocalPass:vault-key:password:v1');
  }

  async function unwrapVaultKeyWithPassword(payload, password, pepper, salt, iterations) {
    const key = await derivePasswordKey(password, pepper, salt, iterations);
    return aesDecrypt(key, payload, 'LocalPass:vault-key:password:v1');
  }

  async function wrapVaultKeyWithRecovery(vaultKeyBytes, recoveryKeyBytes) {
    const key = await importAesKey(recoveryKeyBytes);
    return aesEncrypt(key, vaultKeyBytes, 'LocalPass:vault-key:recovery:v1');
  }

  async function unwrapVaultKeyWithRecovery(payload, recoveryKeyBytes) {
    const key = await importAesKey(recoveryKeyBytes);
    return aesDecrypt(key, payload, 'LocalPass:vault-key:recovery:v1');
  }

  async function encryptJson(vaultKeyBytes, data, aadText) {
    const key = await importAesKey(vaultKeyBytes);
    return aesEncrypt(key, enc.encode(JSON.stringify(data)), aadText);
  }

  async function decryptJson(vaultKeyBytes, payload, aadText) {
    const key = await importAesKey(vaultKeyBytes);
    const bytes = await aesDecrypt(key, payload, aadText);
    return JSON.parse(dec.decode(bytes));
  }


  async function generateInboxKeyPair() {
    const pair = await crypto.subtle.generateKey(
      { name: 'RSA-OAEP', modulusLength: 3072, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' },
      true,
      ['encrypt', 'decrypt']
    );
    return {
      publicKeyJwk: await crypto.subtle.exportKey('jwk', pair.publicKey),
      privateKeyJwk: await crypto.subtle.exportKey('jwk', pair.privateKey)
    };
  }

  async function encryptForInbox(publicKeyJwk, data, aadText = '') {
    if (!publicKeyJwk || publicKeyJwk.kty !== 'RSA') throw new Error('LOCKED_INBOX_KEY_INVALID');
    const publicKey = await crypto.subtle.importKey(
      'jwk', publicKeyJwk, { name: 'RSA-OAEP', hash: 'SHA-256' }, false, ['encrypt']
    );
    const contentKey = randomBytes(32);
    const wrapped = await crypto.subtle.encrypt({ name: 'RSA-OAEP' }, publicKey, contentKey);
    const body = await encryptJson(contentKey, data, aadText);
    return {
      version: 1,
      algorithm: 'RSA-OAEP-3072+A256GCM',
      wrappedKey: bytesToB64(new Uint8Array(wrapped)),
      body
    };
  }

  async function decryptFromInbox(privateKeyJwk, payload, aadText = '') {
    if (!privateKeyJwk || privateKeyJwk.kty !== 'RSA' || !payload?.wrappedKey || !payload?.body) throw new Error('LOCKED_INBOX_PAYLOAD_INVALID');
    const privateKey = await crypto.subtle.importKey(
      'jwk', privateKeyJwk, { name: 'RSA-OAEP', hash: 'SHA-256' }, false, ['decrypt']
    );
    const raw = await crypto.subtle.decrypt({ name: 'RSA-OAEP' }, privateKey, b64ToBytes(payload.wrappedKey));
    return decryptJson(new Uint8Array(raw), payload.body, aadText);
  }

  async function encryptVault(vaultKeyBytes, data) {
    return encryptJson(vaultKeyBytes, data, 'LocalPass:vault:data:v1');
  }

  async function decryptVault(vaultKeyBytes, payload) {
    return decryptJson(vaultKeyBytes, payload, 'LocalPass:vault:data:v1');
  }

  return {
    bytesToB64, b64ToBytes, randomBytes, keyToText, textToKey,
    wrapVaultKeyWithPassword, unwrapVaultKeyWithPassword,
    wrapVaultKeyWithRecovery, unwrapVaultKeyWithRecovery,
    encryptJson, decryptJson, encryptVault, decryptVault,
    generateInboxKeyPair, encryptForInbox, decryptFromInbox
  };
})();
