#!/usr/bin/env node
/**
 * 截图回归对比：逐像素比较两个截图目录中同名 PNG。
 * 页面含实时 3D / 粒子动画，所以给的是“差异像素占比 + 平均色差”，而不是要求逐像素相等；
 * 先用同一版本连拍两次得到噪声基线，再判断改动是否引入了超出噪声的变化。
 *
 * 用法: node tests/compare.mjs <目录A> <目录B> [--threshold 24] [--out reports/compare.json]
 */
import fs from 'node:fs';
import path from 'node:path';
import { openBrowser } from './lib/browser.mjs';

const [dirA, dirB] = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const flag = (n, d) => {
    const i = process.argv.indexOf('--' + n);
    return i > -1 ? process.argv[i + 1] : d;
};
const threshold = parseInt(flag('threshold', '24'), 10);
const outFile = flag('out', '');
if (!dirA || !dirB) {
    console.error('用法: node tests/compare.mjs <目录A> <目录B>');
    process.exit(2);
}

const names = fs.readdirSync(dirA).filter((f) => f.endsWith('.png') && fs.existsSync(path.join(dirB, f)));
const { browser, close } = await openBrowser();
const context = await browser.newContext();
const page = await context.newPage();
await page.setContent('<canvas id="c"></canvas>');
const rows = [];
for (const name of names) {
    const a = 'data:image/png;base64,' + fs.readFileSync(path.join(dirA, name)).toString('base64');
    const b = 'data:image/png;base64,' + fs.readFileSync(path.join(dirB, name)).toString('base64');
    const r = await page.evaluate(
        async ([ua, ub, th]) => {
            const load = (u) =>
                new Promise((res, rej) => {
                    const im = new Image();
                    im.onload = () => res(im);
                    im.onerror = rej;
                    im.src = u;
                });
            const [ia, ib] = await Promise.all([load(ua), load(ub)]);
            if (ia.width !== ib.width || ia.height !== ib.height) return { sizeMismatch: `${ia.width}x${ia.height} vs ${ib.width}x${ib.height}` };
            const data = (im) => {
                const c = document.createElement('canvas');
                c.width = im.width;
                c.height = im.height;
                const x = c.getContext('2d', { willReadFrequently: true });
                x.drawImage(im, 0, 0);
                return x.getImageData(0, 0, im.width, im.height).data;
            };
            const da = data(ia);
            const db = data(ib);
            let diff = 0;
            let sum = 0;
            const n = ia.width * ia.height;
            for (let i = 0; i < da.length; i += 4) {
                const d = Math.abs(da[i] - db[i]) + Math.abs(da[i + 1] - db[i + 1]) + Math.abs(da[i + 2] - db[i + 2]);
                sum += d;
                if (d > th) diff++;
            }
            return { diffRatio: diff / n, meanDelta: sum / n / 3 };
        },
        [a, b, threshold]
    );
    rows.push({ name, ...r });
    console.log(
        r.sizeMismatch
            ? `${name.padEnd(30)} 尺寸不同 ${r.sizeMismatch}`
            : `${name.padEnd(30)} 差异像素 ${(r.diffRatio * 100).toFixed(2).padStart(6)}%   平均色差 ${r.meanDelta.toFixed(2)}`
    );
}
await context.close();
await close();
if (outFile) {
    fs.mkdirSync(path.dirname(outFile), { recursive: true });
    fs.writeFileSync(outFile, JSON.stringify({ dirA, dirB, threshold, rows }, null, 2));
}
process.exit(0);
