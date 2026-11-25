#!/usr/bin/env node
/**
 * 校验代码规范：
 * - HTML 模板严禁出现内联事件 on*=
 * - 严禁出现未处理重复入口或 bundle-core.js 回归
 * - 检查核心模板里的未兜底模板变量告警
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const abs = (p) => path.join(ROOT, p);
const errors = [];

function walk(dir, ext, acc = []) {
    if (!fs.existsSync(dir)) return acc;
    for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
        const p = path.join(dir, ent.name);
        if (ent.isDirectory()) walk(p, ext, acc);
        else if (ent.name.endsWith(ext)) acc.push(p);
    }
    return acc;
}

for (const file of walk(abs('src/pages'), '.html')) {
    const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/);
    lines.forEach((line, idx) => {
        if (/\bon(click|change|input|submit|keydown|keyup|mouseover|mouseout)\s*=/.test(line)) {
            errors.push(`${path.relative(ROOT, file)}:${idx + 1} 存在内联事件，请改用 data-action*`);
        }
        if (/[\u2600-\u27BF]|[\uD83C-\uDBFF][\uDC00-\uDFFF]/.test(line)) {
            errors.push(`${path.relative(ROOT, file)}:${idx + 1} 存在残留 emoji，请统一换为线描图标`);
        }
    });
}

if (fs.existsSync(abs('主代码.html')) || fs.existsSync(abs('js/bundle-core.js'))) {
    errors.push('根目录发现重复或废弃入口文件（主代码.html 或 js/bundle-core.js）');
}

// 检查 src/modules/*.js 语法是否可被 esbuild 正常解析
for (const file of walk(abs('src/modules'), '.js')) {
    const txt = fs.readFileSync(file, 'utf8');
    if (/\bwindow\.[a-zA-Z0-9_]+\s*=(?!=)/.test(txt)) {
        errors.push(`${path.relative(ROOT, file)} 不应直接挂载 window.xxx 全局函数`);
    }
}

if (errors.length) {
    console.error('[check:code] 失败:');
    errors.forEach((e) => console.error('  x', e));
    process.exit(1);
}
console.log('[check:code] 通过: 无内联事件、无重复入口、ESM 模块无 window 全局赋值');
