#!/usr/bin/env node
/**
 * 校验 i18n 资源：
 * - content/i18n/ui.json 中 zh 与 en 键值是否齐备
 * - 页面 [data-i18n] 键是否在 ui.json 中存在
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const abs = (p) => path.join(ROOT, p);
const ui = JSON.parse(fs.readFileSync(abs('content/i18n/ui.json'), 'utf8').replace(/^\uFEFF+/, ''));

const zhKeys = new Set(Object.keys(ui.zh || {}));
const enKeys = new Set(Object.keys(ui.en || {}));
const errors = [];
const warnings = [];

for (const k of zhKeys) {
    if (!enKeys.has(k)) errors.push(`ui.en 缺少键: ${k}`);
}
for (const k of enKeys) {
    if (!zhKeys.has(k)) warnings.push(`ui.en 多余键（ui.zh 无对应）: ${k}`);
}

function walkHtml(dir, acc = []) {
    for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
        const p = path.join(dir, ent.name);
        if (ent.isDirectory()) walkHtml(p, acc);
        else if (ent.name.endsWith('.html')) acc.push(p);
    }
    return acc;
}

const usedKeys = new Set();
for (const file of walkHtml(abs('src/pages'))) {
    const text = fs.readFileSync(file, 'utf8');
    const re = /data-i18n="([^"]+)"/g;
    let m;
    while ((m = re.exec(text))) {
        usedKeys.add(m[1]);
        if (!zhKeys.has(m[1])) {
            warnings.push(`${path.relative(ROOT, file)} 引用了 ui.json 未登记的 data-i18n 键: ${m[1]}`);
        }
    }
}

const enExact = JSON.parse(fs.readFileSync(abs('content/i18n/en.exact.json'), 'utf8').replace(/^\uFEFF+/, ''));
const enPhrases = JSON.parse(fs.readFileSync(abs('content/i18n/en.phrases.json'), 'utf8').replace(/^\uFEFF+/, ''));

if (warnings.length) {
    console.warn(`[check:i18n] 提示 (${warnings.length}):`);
    warnings.slice(0, 15).forEach((w) => console.warn('  -', w));
}
if (errors.length) {
    console.error('[check:i18n] 失败:');
    errors.forEach((e) => console.error('  x', e));
    process.exit(1);
}
console.log(`[check:i18n] 通过: ui.zh(${zhKeys.size}), ui.en(${enKeys.size}), exact(${Object.keys(enExact).length}), phrases(${enPhrases.length}), HTML 引用(${usedKeys.size})`);
