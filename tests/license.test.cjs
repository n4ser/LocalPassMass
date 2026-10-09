const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { generateKeyPairSync, sign, webcrypto } = require('node:crypto');
const source = fs.readFileSync(path.join(__dirname, '..', 'license-core.js'), 'utf8');
const license = vm.runInNewContext(source + '\nLPM_LICENSE', {
  crypto:webcrypto, TextDecoder, TextEncoder,
  atob: value => Buffer.from(value, 'base64').toString('latin1'), Uint8Array, Date
});
const keys = generateKeyPairSync('ec', {namedCurve:'prime256v1'});
const publicKey = keys.publicKey.export({format:'jwk'});
const now = Math.floor(Date.now()/1000);
function token(data={}) {
  const json = {version:1,product:'LocalPassMass',tier:'pro',id:'order_12345',issuedAt:now,
    expiresAt:null, ...data};
  const signed = 'LPM1.' + Buffer.from(JSON.stringify(json)).toString('base64url');
  return signed + '.' + sign('sha256', Buffer.from(signed),
    {key:keys.privateKey,dsaEncoding:'ieee-p1363'}).toString('base64url');
}
test('valid signed perpetual license works fully offline', async () => {
  const result = await license.verify(token(), publicKey, now);
  assert.equal(result.ok,true);
  assert.equal(result.license.tier,'pro');
});
test('valid signed expiry is enforced', async () => {
  assert.equal((await license.verify(token({expiresAt:now+3600}),publicKey,now)).ok,true);
  assert.equal((await license.verify(token({expiresAt:now-1}),publicKey,now)).reason,'LICENSE_EXPIRED');
});
test('modified payload cannot be activated', async () => {
  const valid=token(); const parts=valid.split('.');
  parts[1]=Buffer.from(JSON.stringify({version:1,product:'LocalPassMass',tier:'pro',
    id:'fake_99999',issuedAt:now,expiresAt:null})).toString('base64url');
  assert.equal((await license.verify(parts.join('.'),publicKey,now)).reason,'INVALID_LICENSE');
});
test('incorrect product and malformed tokens fail', async () => {
  assert.equal((await license.verify(token({product:'Other'}),publicKey,now)).ok,false);
  assert.equal((await license.verify('abc.def',publicKey,now)).ok,false);
  assert.equal((await license.verify('x'.repeat(5000),publicKey,now)).ok,false);
});
test('unknown key and unconfigured deployment fail closed', async () => {
  assert.equal((await license.verify(token(),null,now)).reason,'LICENSE_NOT_CONFIGURED');
  const other=generateKeyPairSync('ec',{namedCurve:'prime256v1'}).publicKey.export({format:'jwk'});
  assert.equal((await license.verify(token(),other,now)).reason,'INVALID_LICENSE');
});
