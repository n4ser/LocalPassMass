const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { webcrypto } = require('node:crypto');
const source = fs.readFileSync(path.join(__dirname, '..', 'password-generator.js'), 'utf8');
const generator = vm.runInNewContext(source + '\nglobalThis.LPM_PASSWORD_GENERATOR', { crypto: webcrypto });
test('default passwords cover the enabled character classes', () => {
  for (let i = 0; i < 50; i++) {
    const password = generator.generate();
    assert.equal(password.length, 20);
    assert.match(password, /[A-Z]/); assert.match(password, /[a-z]/);
    assert.match(password, /[0-9]/); assert.match(password, /[!@#$%^&*()\-_=+\[\]{};:,.?]/);
  }
});
test('length is clamped and malformed values use a safe fallback', () => {
  assert.equal(generator.generate({ length: 1 }).length, 4);
  assert.equal(generator.generate({ length: 1000 }).length, 128);
  assert.equal(generator.generate({ length: 'invalid' }).length, 20);
  assert.equal(generator.generate({ length: Infinity }).length, 20);
  assert.equal(generator.generate({ length: 12.9 }).length, 12);
});
test('disabled character groups and empty selection', () => {
  assert.match(generator.generate({ length: 64, upper: false, lower: false, symbol: false }), /^[23456789]+$/);
  assert.match(generator.generate({ length: 64, upper: false, lower: false, number: false }), /^[!@#$%^&*()\-_=+\[\]{};:,.?]+$/);
  assert.equal(generator.generate({ upper:false, lower:false, number:false, symbol:false }).length, 20);
});