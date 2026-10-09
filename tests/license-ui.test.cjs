const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '..', 'license-ui.js'), 'utf8');
function setup(resultForToken, existingToken) {
  const storage = new Map();
  if (existingToken) storage.set('lpmProLicenseToken',existingToken);
  const elements = {};
  for (const id of ['proLicenseInput','proLicenseStatus','proActivateBtn','proRemoveBtn','proBuyBtn']) {
    const handlers = {};
    const classes = new Set(['hidden']);
    elements[id] = {
      value:'', textContent:'', href:'', disabled:false, dataset:{},
      handlers,
      classList:{add:x=>classes.add(x),remove:x=>classes.delete(x),contains:x=>classes.has(x)},
      addEventListener:(type,callback)=>handlers[type]=callback,
      trigger:(type, event={})=>handlers[type](event)
    };
  }
  let requests=0;
  const ctx = vm.createContext({
    document:{getElementById:id=>elements[id]},
    LPM_LICENSE_CONFIG:{checkoutUrl:'https://pay.inaser.ir/localpassmass/',publicKey:{kty:'EC'}},
    LPM_LICENSE:{verify:async token=>resultForToken(token)},
    chrome:{storage:{local:{
      get:async key=>({[key]:storage.get(key)}),
      set:async object=>{for(const [key,value] of Object.entries(object))storage.set(key,value);},
      remove:async key=>storage.delete(key)
    }}},
    t:key=>key,
    fetch:()=>{requests++;throw Error('License UI must never call network');}
  });
  const ui = vm.runInContext(source+'\nLPM_LICENSE_UI',ctx);
  return { ui, elements, storage, get requests(){return requests;} };
}
test('free status and official checkout link need no network',async()=>{
  const a=setup(async()=>({ok:false,reason:'INVALID_LICENSE'}));
  await a.ui.refresh();
  assert.equal(a.elements.proLicenseStatus.textContent,'proStatusFree');
  assert.equal(a.elements.proBuyBtn.href,'https://pay.inaser.ir/localpassmass/');
  assert.equal(a.requests,0);
});
test('invalid licenses are never stored',async()=>{
  const a=setup(async()=>({ok:false,reason:'INVALID_LICENSE'}));
  a.elements.proLicenseInput.value='fake-license';
  await a.elements.proActivateBtn.trigger('click');
  assert.equal(a.storage.size,0);
  assert.equal(a.elements.proLicenseStatus.textContent,'proStatusInvalid');
  assert.equal(a.requests,0);
});
test('valid license remains local and is removable',async()=>{
  const a=setup(async token=>token==='signed-token'?
    {ok:true,license:{tier:'pro'}}:{ok:false,reason:'INVALID_LICENSE'});
  a.elements.proLicenseInput.value='signed-token';
  await a.elements.proActivateBtn.trigger('click');
  assert.equal(a.storage.get('lpmProLicenseToken'),'signed-token');
  assert.equal(a.elements.proLicenseStatus.textContent,'proStatusActive');
  assert.equal(a.elements.proLicenseInput.value,'');
  await a.elements.proRemoveBtn.trigger('click');
  assert.equal(a.storage.size,0);
  assert.equal(a.elements.proLicenseStatus.textContent,'proStatusFree');
  assert.equal(a.requests,0);
});
test('expired saved license is not displayed as active',async()=>{
  const a=setup(async()=>({ok:false,reason:'LICENSE_EXPIRED'}),'expired-signed-token');
  await a.ui.refresh();
  assert.equal(a.elements.proLicenseStatus.textContent,'proStatusExpired');
  assert.equal(a.elements.proLicenseStatus.dataset.kind,'error');
});
