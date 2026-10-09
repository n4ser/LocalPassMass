const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '..', 'site-utils.js'), 'utf8');
const LP_PSL = { registrableDomain: host => host === 'localhost' ? '' : host.split('.').slice(-2).join('.') };
const site = vm.runInNewContext(source + '\nLPM_SITE', { URL, LP_PSL });
test('same site and subdomains match only when enabled', () => {
  assert.equal(site.hostMatches('login.example.com', 'https://www.example.com/path', true), true);
  assert.equal(site.hostMatches('login.example.com', 'example.com', false), false);
  assert.equal(site.hostMatches('login.example.com', 'example.net', true), false);
});
test('same-domain HTTPS form actions are permitted', () => {
  assert.equal(site.formActionSafe('accounts.example.com', 'https://login.example.com/session', 'https:'), true);
});
test('off-site and unsafe form actions are rejected', () => {
  assert.equal(site.formActionSafe('accounts.example.com', 'https://evil.test/collect', 'https:'), false);
  assert.equal(site.formActionSafe('accounts.example.com', 'javascript:alert(1)', 'https:'), false);
  assert.equal(site.formActionSafe('accounts.example.com', 'not a URL', 'https:'), false);
});
test('HTTPS to HTTP downgrade is blocked', () => {
  assert.equal(site.formActionSafe('accounts.example.com', 'http://login.example.com/submit', 'https:'), false);
  assert.equal(site.formActionSafe('accounts.example.com', 'https://login.example.com/submit', 'http:'), true);
});
test('credential-derived URLs cannot grant off-site form permission', () => {
  assert.equal(site.formActionSafe('accounts.example.com', 'https://evil.test/collect', 'https://evil.test'), false);
});
test('only web sender pages are classified', () => {
  assert.equal(site.senderPage({ url: 'chrome-extension://fake/popup.html' }), null);
  assert.equal(site.senderPage({ url: 'https://www.example.com/a', tab: { id: 12 }, frameId: 4 }).host, 'example.com');
});