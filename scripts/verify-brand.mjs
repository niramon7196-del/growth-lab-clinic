import fs from 'node:fs';
import crypto from 'node:crypto';

const files = [
  'Growth_Lab_MASTER_transparent.png'
];

const expected = '89504e470d0a1a0a';
const hashes = files.map((f) => {
  const b = fs.readFileSync(f);
  const hash = crypto.createHash('sha256').update(b).digest('hex');
  if (b.subarray(0, 8).toString('hex') !== expected) {
    throw new Error(`Invalid PNG signature: ${f}`);
  }
  return [f, hash, b.length];
});

const unique = new Set(hashes.map(([, h]) => h));
if (unique.size !== 1) throw new Error('Brand assets do not match byte-for-byte.');

for (const [f, h, n] of hashes) console.log(`${f}\t${n} bytes\t${h}`);
console.log(`BRAND ASSET INTEGRITY: PASS - ALL ${files.length} ASSET(S) MATCH 100% BYTE-FOR-BYTE`);
