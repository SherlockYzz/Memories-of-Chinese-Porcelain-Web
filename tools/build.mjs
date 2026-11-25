#!/usr/bin/env node
/**
 * 天青泥火 · 构建脚本（可重复、确定性）
 *
 *   node tools/build.mjs            生产构建 -> dist/
 *   node tools/build.mjs --dev      不压缩、带 sourcemap
 *   node tools/build.mjs --watch    监听 src/ content/ 变更后重建
 *   node tools/build.mjs --serve    构建后启动预览服务器 (默认 4173)
 *
 * 产物文件名带内容哈希；名称 -> 路径的映射以 window.__TQ_ASSETS__ 注入 index.html，
 * 运行时 lazy-loader 通过逻辑名加载按需模块，源码里不出现产物路径。
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import * as esbuild from 'esbuild';
import config from './build.config.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const argv = new Set(process.argv.slice(2));
const DEV = argv.has('--dev') || argv.has('--watch');
const abs = (p) => path.join(ROOT, p);
const read = (p) => fs.readFileSync(abs(p), 'utf8').replace(/^\uFEFF+/, '');
const hashOf = (buf) => crypto.createHash('sha256').update(buf).digest('hex').slice(0, 10);
const kb = (n) => (n / 1024).toFixed(1) + ' KB';

function ensureDir(file) {
    fs.mkdirSync(path.dirname(file), { recursive: true });
}

/** 写入带哈希的产物并返回相对 dist 的路径。 */
function emit(outDir, logicalOut, content, emitted) {
    const buf = Buffer.isBuffer(content) ? content : Buffer.from(content, 'utf8');
    const ext = path.extname(logicalOut);
    const rel = DEV ? logicalOut : logicalOut.slice(0, -ext.length) + '.' + hashOf(buf) + ext;
    const file = path.join(outDir, rel);
    ensureDir(file);
    fs.writeFileSync(file, buf);
    emitted.add(rel.replace(/\\/g, '/'));
    return { rel: rel.replace(/\\/g, '/'), bytes: buf.length };
}

/** 增量复制静态资源目录（按大小 + mtime 判断），返回复制统计。 */
function copyPublic(srcDir, outDir) {
    let copied = 0;
    let total = 0;
    const walk = (dir) => {
        for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
            const from = path.join(dir, ent.name);
            const to = path.join(outDir, path.relative(srcDir, from));
            if (ent.isDirectory()) {
                walk(from);
                continue;
            }
            if (ent.name === '.gitkeep') continue;
            total++;
            const s = fs.statSync(from);
            if (fs.existsSync(to)) {
                const d = fs.statSync(to);
                // 目标文件 mtime 精度可能低于源文件，留 2 秒容差。
                if (d.size === s.size && d.mtimeMs + 2000 >= s.mtimeMs) continue;
            }
            ensureDir(to);
            fs.copyFileSync(from, to);
            fs.utimesSync(to, s.atime, s.mtime);
            copied++;
        }
    };
    if (fs.existsSync(srcDir)) walk(srcDir);
    return { copied, total };
}

function listFiles(dir, base = dir, acc = []) {
    if (!fs.existsSync(dir)) return acc;
    for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
        const p = path.join(dir, ent.name);
        if (ent.isDirectory()) listFiles(p, base, acc);
        else acc.push(path.relative(base, p).replace(/\\/g, '/'));
    }
    return acc;
}

/**
 * 压缩单个经典脚本 / 样式表。
 * 走"落盘 + entryPoints"而不是 esbuild.transform：后者对大输入会借用系统临时目录，
 * 在受限环境（杀软 / 沙箱）下可能因无权清理临时文件而失败。
 * bundle:false 且不指定 format 时，esbuild 不会重命名顶层声明。
 */
async function minifyViaFile(name, code) {
    const tmp = abs(path.join('.cache', 'build', name));
    ensureDir(tmp);
    // 独立的 package.json：让 esbuild 把这些文件当作“经典脚本”而非 ES module 解析。
    fs.writeFileSync(path.join(path.dirname(tmp), 'package.json'), '{}');
    fs.writeFileSync(tmp, code);
    const result = await esbuild.build({
        absWorkingDir: ROOT,
        entryPoints: [tmp],
        bundle: false,
        minify: true,
        write: false,
        legalComments: 'none',
        charset: 'utf8',
        target: name.endsWith('.css') ? undefined : 'es2019',
        logLevel: 'warning'
    });
    return Buffer.from(result.outputFiles[0].contents).toString('utf8');
}

/** HTML 片段包含：<!-- @include partials/xxx.html --> （相对于入口 HTML 所在目录，可嵌套）。 */
function resolveIncludes(file, seen = []) {
    if (seen.includes(file)) throw new Error('HTML include 循环引用: ' + [...seen, file].join(' -> '));
    const dir = path.dirname(file);
    const src = fs.readFileSync(file, 'utf8').replace(/^\uFEFF+/, '');
    return src.replace(/^([ \t]*)<!--\s*@include\s+([^\s]+)\s*-->[ \t]*$/gm, (_, indent, rel) => {
        const target = path.join(dir, rel);
        if (!fs.existsSync(target)) throw new Error(`HTML include 不存在: ${rel} (于 ${path.relative(ROOT, file)})`);
        return resolveIncludes(target, [...seen, file]).replace(/\s+$/, '');
    });
}

const contentCache = new Map();
function readContentValue(expr) {
    const parts = expr.split('.');
    const file = parts.shift();
    if (!file) throw new Error(`无效的 content 占位符: ${expr}`);
    if (!contentCache.has(file)) {
        const filePath = abs(path.join('content', `${file}.json`));
        if (!fs.existsSync(filePath)) throw new Error(`content 文件不存在: content/${file}.json`);
        contentCache.set(file, JSON.parse(fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF+/, '')));
    }
    let cur = contentCache.get(file);
    for (const k of parts) {
        if (cur == null || !(k in cur)) throw new Error(`content 路径不存在: ${expr}`);
        cur = cur[k];
    }
    if (cur && typeof cur === 'object') {
        if ('zh' in cur) cur = cur.zh;
        else throw new Error(`content 路径指向非文本对象: ${expr}`);
    }
    return String(cur ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

async function buildOnce() {
    contentCache.clear();
    const t0 = Date.now();
    const outDir = abs(config.outDir);
    fs.mkdirSync(outDir, { recursive: true });
    const emitted = new Set();
    const assets = {}; // 逻辑名 -> 相对路径
    const report = [];

    // 1. 静态资源
    const pub = copyPublic(abs(config.publicDir), outDir);

    // 2. CSS
    for (const entry of config.css) {
        let css = entry.files.map((f) => `/* === ${f} === */\n${read(f)}`).join('\n');
        if (!DEV && entry.minify !== false) {
            css = await minifyViaFile(entry.name + '.css', css);
        }
        const r = emit(outDir, entry.out, css, emitted);
        assets[entry.name] = r.rel;
        report.push([entry.name, r]);
    }

    // 3. 经典脚本拼接（vendor / legacy）
    for (const entry of config.concat) {
        let js = entry.files.map((f) => `/* === ${f} === */\n${read(f).replace(/\s+$/, '')}\n;\n`).join('\n');
        if (!DEV && entry.minify !== false) {
            // 不指定 format：esbuild 视其为全局脚本，不会重命名顶层声明，跨文件全局引用保持有效。
            js = await minifyViaFile(entry.name + '.js', js);
        }
        const r = emit(outDir, entry.out, js, emitted);
        assets[entry.name] = r.rel;
        report.push([entry.name + (entry.lazy ? ' (lazy)' : ''), r]);
    }

    // 4. ESM 入口 -> IIFE
    for (const entry of config.esm) {
        const result = await esbuild.build({
            absWorkingDir: ROOT,
            entryPoints: [entry.entry],
            bundle: true,
            format: 'iife',
            target: 'es2019',
            minify: !DEV,
            sourcemap: DEV ? 'inline' : false,
            write: false,
            legalComments: 'none',
            charset: 'utf8',
            logLevel: 'warning',
            loader: { '.json': 'json', '.html': 'text', '.svg': 'text', '.glsl': 'text' },
            define: { __DEV__: String(DEV) },
            alias: { '@core': abs(entry.core || 'src/core/index.js') }
        });
        const r = emit(outDir, entry.out, Buffer.from(result.outputFiles[0].contents), emitted);
        assets[entry.name] = r.rel;
        report.push([entry.name + (entry.lazy ? ' (lazy)' : ''), r]);
    }

    // 5. HTML
    let html = resolveIncludes(abs(config.html.entry));
    const buildId = hashOf(Buffer.from(JSON.stringify(assets)));
    html = html
        .replace(/\{\{content:([\w.-]+)\}\}/g, (_, expr) => readContentValue(expr))
        .replace(/\{\{asset:([\w-]+)\}\}/g, (_, name) => {
            if (!assets[name]) throw new Error(`index.html 引用了未知产物 {{asset:${name}}}`);
            return assets[name];
        })
        .replace(/\{\{assets-manifest\}\}/g, `<script>window.__TQ_ASSETS__=${JSON.stringify(assets)};window.__TQ_BUILD__=${JSON.stringify({ id: buildId, dev: DEV })};</script>`)
        .replace(/\{\{build-id\}\}/g, buildId);
    const leftover = html.match(/\{\{[\w:-]+\}\}/);
    if (leftover) throw new Error('index.html 存在未解析的占位符: ' + leftover[0]);
    ensureDir(path.join(outDir, config.html.out));
    fs.writeFileSync(path.join(outDir, config.html.out), html);
    emitted.add(config.html.out);
    report.push(['index.html', { rel: config.html.out, bytes: Buffer.byteLength(html) }]);

    // 6. 清理过期的哈希产物（仅 assets/ 目录）
    for (const f of listFiles(path.join(outDir, 'assets'), outDir)) {
        if (!emitted.has(f)) fs.rmSync(path.join(outDir, f));
    }

    fs.writeFileSync(
        path.join(outDir, 'build-meta.json'),
        JSON.stringify({ buildId, dev: DEV, assets, sizes: Object.fromEntries(report.map(([n, r]) => [n, r.bytes])) }, null, 2)
    );

    const firstLoad = report.filter(([n]) => !/\(lazy\)/.test(n)).reduce((a, [, r]) => a + r.bytes, 0);
    console.log(`\n[build] ${DEV ? '开发' : '生产'}构建完成，用时 ${Date.now() - t0} ms，buildId=${buildId}`);
    for (const [name, r] of report) console.log(`  ${name.padEnd(30)} ${kb(r.bytes).padStart(11)}  ${r.rel}`);
    console.log(`  ${'首屏必载代码合计'.padEnd(22)} ${kb(firstLoad).padStart(11)}`);
    console.log(`  静态资源: ${pub.total} 个文件，本次复制 ${pub.copied} 个`);
    return { assets, report };
}

async function main() {
    await buildOnce();
    if (argv.has('--serve')) {
        const { serve } = await import('./serve.mjs');
        const port = parseInt(process.env.PORT || '4173', 10);
        await serve(abs(config.outDir), port);
        console.log(`[build] 预览: http://127.0.0.1:${port}/`);
    }
    if (argv.has('--watch')) {
        let timer = null;
        let running = false;
        const trigger = (dir) => (evt, file) => {
            if (file && /(^|[\\/])\.|~$/.test(String(file))) return;
            clearTimeout(timer);
            timer = setTimeout(async () => {
                if (running) return;
                running = true;
                try {
                    console.log(`[watch] ${dir}/${file} 变更，重建…`);
                    await buildOnce();
                } catch (e) {
                    console.error('[watch] 构建失败:', e.message);
                } finally {
                    running = false;
                }
            }, 150);
        };
        for (const dir of ['src', 'content', 'public']) {
            if (fs.existsSync(abs(dir))) fs.watch(abs(dir), { recursive: true }, trigger(dir));
        }
        console.log('[watch] 监听 src/ content/ public/ …');
    } else if (!argv.has('--serve')) {
        process.exit(0);
    }
}

main().catch((e) => {
    console.error('\n[build] 失败:', e && e.message ? e.message : e);
    if (e && e.errors) for (const er of e.errors) console.error('  ', er.text, er.location ? `(${er.location.file}:${er.location.line})` : '');
    process.exit(1);
});
