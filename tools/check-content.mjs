#!/usr/bin/env node
/**
 * 校验 content/*.json 的合法性、必填字段与本地静态资源引用完整性。
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const abs = (p) => path.join(ROOT, p);
const readJson = (p) => JSON.parse(fs.readFileSync(abs(p), 'utf8').replace(/^\uFEFF+/, ''));

const errors = [];
const warnings = [];

// 1. 解析全部 content JSON 文件
for (const ent of fs.readdirSync(abs('content'), { withFileTypes: true })) {
    const p = path.join('content', ent.name);
    if (ent.isFile() && ent.name.endsWith('.json')) {
        try {
            readJson(p);
        } catch (e) {
            errors.push(`${p} JSON 解析失败: ${e.message}`);
        }
    }
}

// 2. 校验 vessels.json 必填字段与文件引用
const vessels = readJson('content/vessels.json');
if (!Array.isArray(vessels) || vessels.length < 10) {
    errors.push('content/vessels.json 必须是不少于 10 件器物的数组');
} else {
    const requiredFields = ['id', 'name', 'period', 'kiln', 'dimensions', 'wallThickness', 'desc', 'provenance', 'model', 'bottom'];
    const ids = new Set();
    vessels.forEach((v, idx) => {
        for (const f of requiredFields) {
            if (v[f] === undefined || v[f] === null || v[f] === '') {
                errors.push(`vessels[${idx}] (${v.id || '?'}) 缺少必填字段: ${f}`);
            }
        }
        if (ids.has(v.id)) errors.push(`vessels[${idx}] 存在重复 id: ${v.id}`);
        ids.add(v.id);
        if (v.model && v.model.path) {
            const mp = abs(path.join('public', v.model.path));
            if (!fs.existsSync(mp)) errors.push(`vessels[${idx}] (${v.id}) 模型不存在: public/${v.model.path}`);
        }
        if (v.model && v.model.previewImg) {
            const ip = abs(path.join('public', v.model.previewImg));
            if (!fs.existsSync(ip)) errors.push(`vessels[${idx}] (${v.id}) 预览图不存在: public/${v.model.previewImg}`);
        }
        if (!v.audio || !v.audio.file) {
            errors.push(`vessels[${idx}] (${v.id}) 缺少导览语音字段 audio.file`);
        } else {
            const ap = abs(path.join('public', v.audio.file));
            if (!fs.existsSync(ap)) errors.push(`vessels[${idx}] (${v.id}) 音频不存在: public/${v.audio.file}`);
        }
    });
}

// 3. 校验 archive.json 图片与必填字段
const archive = readJson('content/archive.json');
if (!Array.isArray(archive) || archive.length === 0) {
    errors.push('content/archive.json 不能为空');
} else {
    archive.forEach((item, idx) => {
        for (const f of ['id', 'name', 'kiln', 'dynastyKey', 'size', 'desc', 'img']) {
            if (!item[f]) errors.push(`archive[${idx}] (${item.id || '?'}) 缺少字段: ${f}`);
        }
        if (item.img && !fs.existsSync(abs(path.join('public', item.img)))) {
            errors.push(`archive[${idx}] 图片不存在: public/${item.img}`);
        }
    });
}

// 3.1 校验 history.json 与 workshop-steps.json 图片路径
for (const relJson of ['content/history.json', 'content/workshop-steps.json']) {
    const list = readJson(relJson);
    if (!Array.isArray(list) || list.length === 0) {
        errors.push(`${relJson} 不能为空`);
    } else {
        list.forEach((item, idx) => {
            if (!item.img) {
                errors.push(`${relJson}[${idx}] 缺少 img 字段`);
            } else if (!fs.existsSync(abs(path.join('public', item.img)))) {
                errors.push(`${relJson}[${idx}] 图片不存在: public/${item.img}`);
            }
        });
    }
}

// 3.2 校验背景音乐与视频封面静态资源
for (const asset of [
    'public/audio/guqin-zuiyu.mp3',
    'public/audio/guqin-yangguan.mp3',
    'public/images/videos/step1-throwing.webp',
    'public/images/videos/step2-trimming.webp',
    'public/images/videos/step3-glazing.webp',
    'public/images/videos/step4-qinghua.webp',
    'public/images/videos/step5-kiln.webp'
]) {
    if (!fs.existsSync(abs(asset))) {
        errors.push(`缺失媒体资源: ${asset}`);
    }
}

// 4. 校验 glazes / quiz / notes / kilns / site / navigation / credits / scene
const glazes = readJson('content/glazes.json');
if (!Array.isArray(glazes) || glazes.length < 7) errors.push('content/glazes.json 至少需包含 7 种釉色参数');
else {
    glazes.forEach((g, i) => {
        if (!g.id || !g.name || !g.material || !g.material.color) errors.push(`glazes[${i}] 缺少 id/name/material.color`);
    });
}

const quiz = readJson('content/quiz.json');
if (!Array.isArray(quiz) || quiz.length < 12) errors.push('content/quiz.json 题库至少需包含 12 道题');
else {
    quiz.forEach((q, i) => {
        if (!q.question || !Array.isArray(q.options) || typeof q.answer !== 'number' || !q.explanation) {
            errors.push(`quiz[${i}] 缺少 question/options/answer/explanation`);
        }
    });
}

for (const extra of ['crackle-lab', 'kintsugi', 'firing-timeline', 'passport', 'reference-colors']) {
    const d = readJson(`content/${extra}.json`);
    if (!d || (Array.isArray(d) && d.length === 0)) errors.push(`content/${extra}.json 不能为空`);
}

const notes = readJson('content/notes.json');
notes.forEach((n, i) => {
    if (!n.title || !n.fullText) errors.push(`notes[${i}] 缺少 title/fullText`);
    if (/\$[^$]+\$/.test(n.fullText || '')) warnings.push(`notes[${i}] (${n.id}) 存在未渲染的 LaTeX $...$`);
});

if (warnings.length) {
    console.warn('[check:content] 警告:');
    warnings.forEach((w) => console.warn('  -', w));
}
if (errors.length) {
    console.error('[check:content] 失败:');
    errors.forEach((e) => console.error('  x', e));
    process.exit(1);
}
console.log(`[check:content] 通过: vessels(${vessels.length}), archive(${archive.length}), glazes(${glazes.length}), quiz(${quiz.length}), notes(${notes.length})`);
