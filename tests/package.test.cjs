const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
test('the release ZIP includes only extension runtime files',()=>{
  const root=path.resolve(__dirname,'..');
  const result=spawnSync(process.execPath,['scripts/package-extension.mjs'],{cwd:root,encoding:'utf8'});
  assert.equal(result.status,0,result.stderr);
  const version=JSON.parse(fs.readFileSync(path.join(root,'manifest.json'),'utf8')).version;
  const zip=fs.readFileSync(path.join(root,'dist','LocalPassMass-v'+version+'.zip'));
  const end=zip.lastIndexOf(Buffer.from([0x50,0x4b,0x05,0x06]));
  assert.ok(end>0,'ZIP end-of-central-directory must exist');
  let index=zip.readUInt32LE(end+16);
  const total=zip.readUInt16LE(end+10);
  const names=[];
  for(let i=0;i<total;i++){
    assert.equal(zip.readUInt32LE(index),0x02014b50);
    const len=zip.readUInt16LE(index+28);
    const extra=zip.readUInt16LE(index+30);
    const comment=zip.readUInt16LE(index+32);
    names.push(zip.subarray(index+46,index+46+len).toString('utf8'));
    index+=46+len+extra+comment;
  }
  assert.ok(names.includes('manifest.json'));
  assert.ok(names.includes('background.js'));
  assert.ok(names.includes('license-core.js'));
  assert.ok(names.includes('popup.html'));
  assert.ok(names.includes('icons/icon128.png'));
  assert.equal(names.some(n=>/^(scripts|tests|website|docs)\//.test(n)),false);
  assert.equal(names.some(n=>/\.(?:pem|svault|lpm|bak|txt|md|zip)$/i.test(n)),false);
  assert.ok(names.every(n=>n==='manifest.json'||/\.(?:js|css|html|png)$/i.test(n)));
});
