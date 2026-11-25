#!/usr/bin/env node
/**
 * 回归截图：按 视口 × 主题 × 滚动位置 批量截图，并采集页面健康指标。
 *
 * 用法:
 *   node tests/shots.mjs --root <目录> --out <输出目录> [--port 4173]
 *                        [--viewports desktop,mobile] [--themes light,dark]
 *                        [--scrolls 0,1400,3200,6000,10000] [--label 名称]
 *
 * 输出: <out>/<viewport>-<theme>-y<scroll>.png 以及 <out>/metrics.json
 */
import fs from 'node:fs';
import path from 'node:path';
import { serve } from '../tools/serve.mjs';
import { openBrowser, newPage, scrollToY, VIEWPORTS } from './lib/browser.mjs';

function arg(name, def) {
    const i = process.argv.indexOf('--' + name);
    return i > -1 && process.argv[i + 1] ? process.argv[i + 1] : def;
}

const root = arg('root', 'dist');
const out = arg('out', 'reports/shots/current');
const port = parseInt(arg('port', '4173'), 10);
const viewports = arg('viewports', 'desktop,mobile').split(',');
const themes = arg('themes', 'light,dark').split(',');
const scrolls = arg('scrolls', '0,1400,3200,6000,10000').split(',').map(Number);
const settle = parseInt(arg('settle', '900'), 10);

fs.mkdirSync(out, { recursive: true });
const server = await serve(root, port, { quiet: true });
const { browser, close } = await openBrowser();
const metrics = { root, generatedAt: new Date().toISOString(), runs: [] };

try {
    for (const vpName of viewports) {
        if (!VIEWPORTS[vpName]) throw new Error('未知视口 ' + vpName);
        for (const theme of themes) {
            const { page, context, logs } = await newPage(browser, vpName, { theme });
            const t0 = Date.now();
            await page.goto(`http://127.0.0.1:${port}/`, { waitUntil: 'load', timeout: 60000 });
            await page.waitForTimeout(2500);
            const loadMs = Date.now() - t0;
            const info = await page.evaluate(() => {
                const de = document.documentElement;
                const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
                const bad = [];
                let n;
                while ((n = walker.nextNode())) {
                    const t = n.nodeValue;
                    if (/\bundefined\b|\bNaN\b|\[object Object\]|\bnull\b/.test(t)) {
                        const p = n.parentElement;
                        if (p && !/^(SCRIPT|STYLE|NOSCRIPT|TEMPLATE)$/.test(p.tagName)) bad.push(t.trim().slice(0, 80));
                    }
                }
                const nav = document.querySelector('#navbar');
                const navInner = nav && nav.querySelector('.flex.items-center.justify-between, [data-nav-inner]');
                return {
                    scrollWidth: de.scrollWidth,
                    clientWidth: de.clientWidth,
                    scrollHeight: de.scrollHeight,
                    horizontalOverflow: de.scrollWidth > de.clientWidth,
                    badText: bad.slice(0, 20),
                    navScrollWidth: navInner ? navInner.scrollWidth : null,
                    navClientWidth: navInner ? navInner.clientWidth : null,
                    theme: de.getAttribute('data-theme')
                };
            });
            const shots = [];
            for (const y of scrolls) {
                await scrollToY(page, y, settle);
                const file = `${vpName}-${theme}-y${y}.png`;
                await page.screenshot({ path: path.join(out, file) });
                shots.push(file);
            }
            metrics.runs.push({
                viewport: vpName,
                theme,
                loadMs,
                ...info,
                consoleErrors: logs.errors.slice(0, 20),
                failedRequests: logs.failed.slice(0, 20),
                shots
            });
            console.log(
                `[shots] ${vpName}/${theme}: scrollWidth=${info.scrollWidth}/${info.clientWidth}` +
                    ` height=${info.scrollHeight} errors=${logs.errors.length} failed=${logs.failed.length} bad=${info.badText.length}`
            );
            await context.close();
        }
    }
} finally {
    await close();
    server.close();
}
fs.writeFileSync(path.join(out, 'metrics.json'), JSON.stringify(metrics, null, 2));
console.log('[shots] 完成 ->', out);
process.exit(0);
