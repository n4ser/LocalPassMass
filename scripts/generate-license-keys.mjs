import { generateKeyPairSync } from 'node:crypto';
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const destination = process.argv[2];
if (!destination || process.argv.length !== 3) {
  console.error('Usage: node scripts/generate-license-keys.mjs /safe/location/private-key.pem');
  process.exit(2);
}
const { privateKey, publicKey } = generateKeyPairSync('ec', { namedCurve:'prime256v1' });
writeFileSync(resolve(destination), privateKey.export({type:'pkcs8',format:'pem'}),
  { mode:0o600, flag:'wx' });
const { kty, crv, x, y } = publicKey.export({format:'jwk'});
console.log('Keep the PRIVATE PEM outside the repository. Back it up securely.');
console.log('Paste only this PUBLIC JWK into license-config.js:');
console.log(JSON.stringify({kty,crv,x,y}));
