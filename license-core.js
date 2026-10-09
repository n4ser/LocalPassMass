/* Offline verification of signed LocalPassMass Pro entitlements. */
const LPM_LICENSE = (() => {
  const PREFIX = 'LPM1';
  const MAX_TOKEN_LENGTH = 4096;
  function decodeBase64Url(value) {
    if (!/^[A-Za-z0-9_-]+$/.test(value)) throw new Error('INVALID_LICENSE');
    const base64 = value.replace(/-/g, '+').replace(/_/g, '/');
    const binary = atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, '='));
    return Uint8Array.from(binary, character => character.charCodeAt(0));
  }
  function parseLicense(token) {
    if (typeof token !== 'string' || !token || token.length > MAX_TOKEN_LENGTH) throw new Error('INVALID_LICENSE');
    const parts = token.trim().split('.');
    if (parts.length !== 3 || parts[0] !== PREFIX) throw new Error('INVALID_LICENSE');
    const payloadBytes = decodeBase64Url(parts[1]);
    if (payloadBytes.length > 2048) throw new Error('INVALID_LICENSE');
    const payload = JSON.parse(new TextDecoder('utf-8', { fatal:true }).decode(payloadBytes));
    const signature = decodeBase64Url(parts[2]);
    if (signature.length !== 64) throw new Error('INVALID_LICENSE');
    if (!payload || payload.version !== 1 || payload.product !== 'LocalPassMass'
        || payload.tier !== 'pro' || typeof payload.id !== 'string'
        || !/^[a-zA-Z0-9_-]{5,80}$/.test(payload.id)
        || !Number.isSafeInteger(payload.issuedAt) || payload.issuedAt <= 0
        || !(payload.expiresAt === null || Number.isSafeInteger(payload.expiresAt))) {
      throw new Error('INVALID_LICENSE');
    }
    return { payload, signature, signedData:new TextEncoder().encode(parts[0] + '.' + parts[1]) };
  }
  async function verify(token, publicKey, nowSeconds = Math.floor(Date.now() / 1000)) {
    if (!publicKey || publicKey.kty !== 'EC' || publicKey.crv !== 'P-256'
        || !publicKey.x || !publicKey.y) return { ok:false, reason:'LICENSE_NOT_CONFIGURED' };
    try {
      const parsed = parseLicense(token);
      const key = await crypto.subtle.importKey('jwk', publicKey,
        { name:'ECDSA', namedCurve:'P-256' }, false, ['verify']);
      const valid = await crypto.subtle.verify({name:'ECDSA', hash:'SHA-256'},
        key, parsed.signature, parsed.signedData);
      if (!valid) return { ok:false, reason:'INVALID_LICENSE' };
      if (parsed.payload.issuedAt > nowSeconds + 300) return { ok:false, reason:'INVALID_LICENSE' };
      if (parsed.payload.expiresAt !== null && parsed.payload.expiresAt <= nowSeconds)
        return { ok:false, reason:'LICENSE_EXPIRED' };
      return { ok:true, license:parsed.payload };
    } catch {
      return { ok:false, reason:'INVALID_LICENSE' };
    }
  }
  return Object.freeze({ verify });
})();
