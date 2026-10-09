const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const root=path.resolve(__dirname,'..');
const code=fs.readFileSync(path.join(root,'psl.js'),'utf8')+'\n'+
  fs.readFileSync(path.join(root,'site-utils.js'),'utf8')+'\nthis.site=LPM_SITE;';
const site=vm.runInNewContext(code,{URL});
test('registrable domains are isolated across public suffix boundaries',()=>{
  assert.equal(site.hostMatches('accounts.bank.co.uk','login.bank.co.uk',true),true);
  assert.equal(site.hostMatches('accounts.bank.co.uk','login.other.co.uk',true),false);
  assert.equal(site.hostMatches('alpha.github.io','beta.github.io',true),false);
});
test('form actions reject cross-site collection and HTTPS downgrade',()=>{
  assert.equal(site.formActionSafe('bank.co.uk','https://accounts.bank.co.uk/login','https:'),true);
  assert.equal(site.formActionSafe('bank.co.uk','https://other.co.uk/login','https:'),false);
  assert.equal(site.formActionSafe('bank.co.uk','http://accounts.bank.co.uk/login','https:'),false);
  assert.equal(site.formActionSafe('bank.co.uk','data:text/html,foo','https:'),false);
});
test('sender page origin only accepts web pages',()=>{
  assert.equal(site.senderPage({url:'chrome-extension://example/page.html'}),null);
  assert.equal(site.senderPage({url:'about:blank'}),null);
  const s=site.senderPage({url:'https://accounts.bank.co.uk/page',tab:{id:3},frameId:1});
  assert.equal(s.host,'accounts.bank.co.uk');
  assert.equal(s.protocol,'https:');
});
