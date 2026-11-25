#!/usr/bin/env node
/**
 * 校验样式分层规范：
 * - 新架构样式 (src/styles/[0-9]*.css) 禁止无注释 !important，禁止裸写高 z-index 数值（应使用 var(--z-*)）
 * - 统计 legacy CSS 中 !important 数量，防止继续膨胀
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const abs = (p) => path.join(ROOT, p);

const errors = [];
const modernFiles = fs
    .readdirSync(abs('src/styles'))
    .filter((f) => /^\d+.*\.css$/.test(f))
    .map((f) => path.join('src/styles', f));

for (const rel of modernFiles) {
    const lines = fs.readFileSync(abs(rel), 'utf8').split(/\r?\n/);
    lines.forEach((line, idx) => {
        // 只检查 CSS 规则里的 !important，忽略纯注释行
        const codePart = line.replace(/\/\*[\s\S]*?\*\//g, '').trim();
        const isCommentLine = /^\s*(\/\*|\*)/.test(line);
        if (!isCommentLine && /!important/.test(codePart)) {
            const context = lines.slice(Math.max(0, idx - 5), idx + 1).join('\n');
            if (!/\/\*\s*例外/.test(context)) {
                errors.push(`${rel}:${idx + 1} 出现未附带 /* 例外：... */ 说明的 !important`);
            }
        }
        const z = /z-index\s*:\s*(\d+)/.exec(codePart);
        if (z && Number(z[1]) > 20) {
            errors.push(`${rel}:${idx + 1} 出现裸写 z-index: ${z[1]}，请改用 00-tokens.css 的 var(--z-*)`);
        }
    });
}

let legacyImportant = 0;
for (const rel of ['src/styles/legacy/style.css', 'src/styles/legacy/visual-enhance.css']) {
    const txt = fs.readFileSync(abs(rel), 'utf8');
    legacyImportant += (txt.match(/!important/g) || []).length;
}

if (errors.length) {
    console.error('[check:style] 失败:');
    errors.forEach((e) => console.error('  x', e));
    process.exit(1);
}
console.log(`[check:style] 通过: 现代样式(${modernFiles.length} 个)零违规，legacy !important 计数=${legacyImportant}`);
