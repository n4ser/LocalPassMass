import { readFileSync, writeFileSync, readdirSync, mkdirSync, lstatSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { deflateRawSync } from 'node:zlib';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const manifest = JSON.parse(readFileSync(join(root, 'manifest.json'), 'utf8'));
const names = readdirSync(root).filter(name => name === 'manifest.json' || /\.(?:js|css|html)$/.test(name));
for (const name of readdirSync(join(root, 'icons'))) if (/\.png$/i.test(name)) names.push('icons/' + name);
names.sort();
for (const name of names) {
  const stat = lstatSync(join(root, name));
  if (!stat.isFile() || stat.isSymbolicLink()) throw Error('Unsafe package path: ' + name);
}
const crcTable = Uint32Array.from({ length:256 }, (_, n) => {
  let v = n;
  for (let i = 0; i < 8; i++) v = (v & 1) ? (0xedb88320 ^ (v >>> 1)) : (v >>> 1);
  return v >>> 0;
});
const crc32 = data => {
  let c=0xffffffff;
  for (const byte of data) c = crcTable[(c ^ byte) & 255] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};
const localParts = [], centralParts=[];
let offset = 0;
for (const name of names) {
  const nameBytes = Buffer.from(name, 'utf8');
  const uncompressed = readFileSync(join(root, name));
  const compressed = deflateRawSync(uncompressed, { level:9 });
  const local = Buffer.alloc(30 + nameBytes.length);
  local.writeUInt32LE(0x04034b50, 0);
  local.writeUInt16LE(20, 4);
  local.writeUInt16LE(0x0800, 6);
  local.writeUInt16LE(8, 8);
  local.writeUInt16LE(0x0021, 12);
  local.writeUInt32LE(crc32(uncompressed), 14);
  local.writeUInt32LE(compressed.length, 18);
  local.writeUInt32LE(uncompressed.length, 22);
  local.writeUInt16LE(nameBytes.length, 26);
  nameBytes.copy(local, 30);
  localParts.push(local, compressed);
  const central = Buffer.alloc(46 + nameBytes.length);
  central.writeUInt32LE(0x02014b50,0);
  central.writeUInt16LE(20,4);
  central.writeUInt16LE(20,6);
  central.writeUInt16LE(0x0800,8);
  central.writeUInt16LE(8,10);
  central.writeUInt16LE(0x0021,14);
  central.writeUInt32LE(crc32(uncompressed),16);
  central.writeUInt32LE(compressed.length,20);
  central.writeUInt32LE(uncompressed.length,24);
  central.writeUInt16LE(nameBytes.length,28);
  central.writeUInt32LE(offset,42);
  nameBytes.copy(central,46);
  centralParts.push(central);
  offset += local.length + compressed.length;
}
const centralSize = centralParts.reduce((size, b) => size+b.length,0);
const end = Buffer.alloc(22);
end.writeUInt32LE(0x06054b50,0);
end.writeUInt16LE(names.length,8);
end.writeUInt16LE(names.length,10);
end.writeUInt32LE(centralSize,12);
end.writeUInt32LE(offset,16);
const targetDir = join(root, 'dist');
mkdirSync(targetDir,{recursive:true});
const target = join(targetDir, 'LocalPassMass-v' + manifest.version + '.zip');
writeFileSync(target,Buffer.concat([...localParts,...centralParts,end]));
console.log('Packaged ' + names.length + ' runtime files: ' + target);
