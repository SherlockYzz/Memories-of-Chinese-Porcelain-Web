#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const scripts = ['tools/check-content.mjs', 'tools/check-i18n.mjs', 'tools/check-style.mjs', 'tools/check-code.mjs'];

for (const s of scripts) {
    const res = spawnSync(process.execPath, [path.join(ROOT, s)], { stdio: 'inherit' });
    if (res.status !== 0) process.exit(res.status || 1);
}
console.log('[check] 全部静态工程校验通过！');
