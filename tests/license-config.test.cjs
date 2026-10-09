const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { webcrypto } = require('node:crypto');
const root=path.resolve(__dirname,'..');
const config=vm.runInNewContext(fs.readFileSync(path.join(root,'license-config.js'),'utf8')+
  '\nLPM_LICENSE_CONFIG');
test('release contains a usable public verification key and a valid HTTPS checkout',async()=>{
  assert.equal(config.checkoutUrl,'https://pay.inaser.ir/localpassmass/');
  assert.equal(config.publicKey.kty,'EC');
  assert.equal(config.publicKey.crv,'P-256');
  assert.equal(Object.isFrozen(config.publicKey),true);
  const key=await webcrypto.subtle.importKey('jwk',config.publicKey,
    {name:'ECDSA',namedCurve:'P-256'},false,['verify']);
  assert.equal(key.type,'public');
});
test('Pro settings have one checkout link and accessible license controls',()=>{
  const html=fs.readFileSync(path.join(root,'popup.html'),'utf8');
  assert.equal((html.match(/id="proBuyBtn"/g)||[]).length,1);
  assert.equal((html.match(/id="proShowCodeBtn"/g)||[]).length,1);
  assert.equal(html.includes('LocalPassMass/buy.php'),false);
  assert.equal(html.includes('aria-describedby="proLicenseStatus"'),true);
  const version=JSON.parse(fs.readFileSync(path.join(root,'manifest.json'),'utf8')).version;
  assert.ok(html.includes('v'+version));
});
