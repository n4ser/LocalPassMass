import assert from 'node:assert/strict';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const manifest = JSON.parse(readFileSync(join(root, 'manifest.json'), 'utf8'));
const checkPath = (relative, label) => {
  assert.equal(typeof relative, 'string', label + ' must be a path');
  assert.ok(relative && !relative.startsWith('/') && !relative.includes('..') && !relative.includes('://'), label + ': unsafe path ' + relative);
  assert.ok(existsSync(join(root, relative)), label + ': missing ' + relative);
};
assert.equal(manifest.manifest_version, 3);
assert.ok(/^\d+\.\d+\.\d+$/.test(manifest.version));
checkPath(manifest.background.service_worker, 'worker');
checkPath(manifest.action.default_popup, 'popup');
for (const [size, filename] of Object.entries(manifest.icons ?? {})) checkPath(filename, 'icon ' + size);
for (const [size, filename] of Object.entries(manifest.action.default_icon ?? {})) checkPath(filename, 'action icon ' + size);
for (const html of [manifest.action.default_popup, 'offscreen.html']) {
  checkPath(html, 'HTML');
  for (const match of readFileSync(join(root, html), 'utf8').matchAll(/<script\b[^>]*\bsrc=["']([^"']+)["']/gi))
    checkPath(match[1], 'HTML script');
}
const worker = readFileSync(join(root, manifest.background.service_worker), 'utf8');
for (const match of worker.matchAll(/['"]([^'"]+\.js)['"]/g)) checkPath(match[1], 'worker import');
for (const filename of readdirSync(root).filter(name => name.endsWith('.js'))) {
  const result = spawnSync(process.execPath, ['--check', join(root, filename)], { encoding: 'utf8' });
  assert.equal(result.status, 0, filename + ': ' + result.stderr);
}
assert.ok(!/https?:\/\//i.test(manifest.content_security_policy?.extension_pages ?? ''));
console.log('Manifest ' + manifest.version + ': paths, icons, imports and JavaScript syntax verified.');
