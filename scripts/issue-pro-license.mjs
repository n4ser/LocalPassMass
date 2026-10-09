import { sign } from 'node:crypto';
import { readFileSync } from 'node:fs';

const [privateKeyPath, id, expiry='lifetime'] = process.argv.slice(2);
if (!privateKeyPath || !/^[a-zA-Z0-9_-]{5,80}$/.test(id || '')) {
  console.error('Usage: node scripts/issue-pro-license.mjs /safe/private-key.pem ORDER_ID [YYYY-MM-DD|lifetime]');
  process.exit(2);
}
let expiresAt = null;
if (expiry !== 'lifetime') {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(expiry)) throw new Error('Invalid expiry date');
  const ms = Date.parse(expiry + 'T23:59:59Z');
  if (!Number.isFinite(ms) || new Date(ms).toISOString().slice(0,10) !== expiry)
    throw new Error('Invalid expiry date');
  expiresAt = Math.floor(ms / 1000);
  if (expiresAt <= Math.floor(Date.now()/1000)) throw new Error('Expiry must be in the future');
}
const payload = {
  version:1, product:'LocalPassMass', tier:'pro', id,
  issuedAt:Math.floor(Date.now()/1000), expiresAt
};
const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
const signed = 'LPM1.' + body;
const privateKey = readFileSync(privateKeyPath, 'utf8');
const signature = sign('sha256', Buffer.from(signed), {key:privateKey,dsaEncoding:'ieee-p1363'});
console.log(signed + '.' + signature.toString('base64url'));
