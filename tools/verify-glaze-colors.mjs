#!/usr/bin/env node
/**
 * 名窑釉色与渲染质量定量对比工具：
 * 1. 通过 Playwright 渲染 content/reference-colors.json 中的核心器物
 * 2. 分别截取 正面 / 斜侧 / 微距三视图至 reports/shots/glaze-compare/
 * 3. 从器物中段釉面采样有效像素（剔除暗背景与镜面高光极值），转 CIELab 与馆藏参考色计算 ΔE2000
 * 4. 输出 reports/glaze-color-verify.md 量化评估表
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { serve } from '../tools/serve.mjs';
import { openBrowser, newPage } from '../tests/lib/browser.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const abs = (p) => path.join(ROOT, p);
const refs = JSON.parse(fs.readFileSync(abs('content/reference-colors.json'), 'utf8'));

function srgbToLab(r8, g8, b8) {
    const lin = (c) => {
        const s = c / 255;
        return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
    };
    const r = lin(r8), g = lin(g8), b = lin(b8);
    // D65
    let x = (r * 0.4124564 + g * 0.3575761 + b * 0.1804375) / 0.95047;
    let y = (r * 0.2126729 + g * 0.7151522 + b * 0.0721750) / 1.0;
    let z = (r * 0.0193339 + g * 0.1191920 + b * 0.9503041) / 1.08883;
    const f = (t) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
    x = f(x); y = f(y); z = f(z);
    return [116 * y - 16, 500 * (x - y), 200 * (y - z)];
}

function deltaE2000(lab1, lab2) {
    const [L1, a1, b1] = lab1;
    const [L2, a2, b2] = lab2;
    const deg = Math.PI / 180;
    const C1 = Math.hypot(a1, b1), C2 = Math.hypot(a2, b2);
    const Cbar = (C1 + C2) / 2;
    const C7 = Math.pow(Cbar, 7);
    const G = 0.5 * (1 - Math.sqrt(C7 / (C7 + Math.pow(25, 7))));
    const a1p = (1 + G) * a1, a2p = (1 + G) * a2;
    const C1p = Math.hypot(a1p, b1), C2p = Math.hypot(a2p, b2);
    const h = (ap, bp) => (ap === 0 && bp === 0 ? 0 : ((Math.atan2(bp, ap) * 180) / Math.PI + 360) % 360);
    const h1p = h(a1p, b1), h2p = h(a2p, b2);
    const dLp = L2 - L1, dCp = C2p - C1p;
    let dhp = 0;
    if (C1p * C2p !== 0) {
        if (Math.abs(h2p - h1p) <= 180) dhp = h2p - h1p;
        else if (h2p - h1p > 180) dhp = h2p - h1p - 360;
        else dhp = h2p - h1p + 360;
    }
    const dHp = 2 * Math.sqrt(C1p * C2p) * Math.sin((dhp / 2) * deg);
    const Lbp = (L1 + L2) / 2, Cbp = (C1p + C2p) / 2;
    let hbp = h1p + h2p;
    if (C1p * C2p !== 0) {
        if (Math.abs(h1p - h2p) <= 180) hbp = (h1p + h2p) / 2;
        else if (h1p + h2p < 360) hbp = (h1p + h2p + 360) / 2;
        else hbp = (h1p + h2p - 360) / 2;
    }
    const T =
        1 -
        0.17 * Math.cos((hbp - 30) * deg) +
        0.24 * Math.cos((2 * hbp) * deg) +
        0.32 * Math.cos((3 * hbp + 6) * deg) -
        0.20 * Math.cos((4 * hbp - 63) * deg);
    const dTheta = 30 * Math.exp(-Math.pow((hbp - 275) / 25, 2));
    const Cbp7 = Math.pow(Cbp, 7);
    const RC = 2 * Math.sqrt(Cbp7 / (Cbp7 + Math.pow(25, 7)));
    const L50 = Math.pow(Lbp - 50, 2);
    const SL = 1 + (0.015 * L50) / Math.sqrt(20 + L50);
    const SC = 1 + 0.045 * Cbp;
    const SH = 1 + 0.015 * Cbp * T;
    const RT = -Math.sin(2 * dTheta * deg) * RC;
    return Math.sqrt(
        Math.pow(dLp / SL, 2) +
            Math.pow(dCp / SC, 2) +
            Math.pow(dHp / SH, 2) +
            RT * (dCp / SC) * (dHp / SH)
    );
}

const outDir = abs('reports/shots/glaze-compare');
fs.mkdirSync(outDir, { recursive: true });

const PORT = 4181;
const server = await serve('dist', PORT, { quiet: true });
const { browser, close } = await openBrowser();
const rows = [];

try {
    const { page, context } = await newPage(browser, 'desktop', { theme: 'light' });
    await page.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: 'load', timeout: 60000 });
    await page.waitForTimeout(2200);

    // 滚动到 3D 展馆并开启纯净沉浸，隐藏热点以无遮挡取样与截图
    await page.locator('[id="3d-gallery"]').scrollIntoViewIfNeeded();
    await page.evaluate(() => {
        if (typeof window.toggleZenMode === 'function') window.toggleZenMode();
        if (typeof window.toggle3DHotspots === 'function') window.toggle3DHotspots();
        if (typeof window.toggleAutoRotate === 'function') window.toggleAutoRotate();
        if (typeof window.switchRealisticSceneEnv === 'function') window.switchRealisticSceneEnv('palace', false);
    });
    await page.waitForTimeout(600);

    const stage = page.locator('#three-stage-container');

    for (const ref of refs) {
        await page.evaluate(
            ({ idx, glazeId }) => {
                window.loadPorcelainModel(idx, true);
                if (idx !== 13 && idx !== 5 && idx !== 4) {
                    // 除自带彩绘/窑变/兔毫特殊原生贴图外，也可检验其默认釉面
                }
                if (typeof window.setCameraView === 'function') window.setCameraView('front');
            },
            { idx: ref.vesselIndex, glazeId: ref.glazeId }
        );
        // 等待模型加载及相机平滑到达
        await page.waitForTimeout(1600);
        await stage.screenshot({ path: path.join(outDir, `${ref.vesselId}-front.png`) });

        // 采样中心釉面主色（矮碗类器物位于画面中偏下，立瓶类位于中腹）
        const isLowBowl = /bowl/i.test(ref.vesselId);
        const isDarkJian = ref.vesselId === 'jian-yaobian-bowl';
        const sample = await page.evaluate(({ lowBowl, darkJian }) => {
            const c = document.getElementById('three-canvas');
            const tmp = document.createElement('canvas');
            tmp.width = 200;
            tmp.height = 200;
            const ctx = tmp.getContext('2d');
            const sx = Math.round(c.width * 0.40);
            const sy = Math.round(c.height * (lowBowl ? 0.56 : 0.36));
            const sw = Math.round(c.width * 0.20);
            const sh = Math.round(c.height * (lowBowl ? 0.16 : 0.24));
            ctx.drawImage(c, sx, sy, sw, sh, 0, 0, 200, 200);
            const px = ctx.getImageData(0, 0, 200, 200).data;
            let rSum = 0, gSum = 0, bSum = 0, count = 0;
            const minLum = darkJian ? 12 : (lowBowl ? 55 : 22);
            for (let i = 0; i < px.length; i += 4) {
                const r = px[i], g = px[i + 1], b = px[i + 2];
                const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
                // 剔除暗背景与镜面高光极值
                if (lum >= minLum && lum <= 240) {
                    rSum += r; gSum += g; bSum += b; count++;
                }
            }
            if (!count) return { r: 0, g: 0, b: 0, count: 0 };
            return { r: Math.round(rSum / count), g: Math.round(gSum / count), b: Math.round(bSum / count), count };
        }, { lowBowl: isLowBowl, darkJian: isDarkJian });

        // 斜侧视角（通过拖拽canvas模拟斜角）
        const box = await stage.boundingBox();
        await page.mouse.move(box.x + box.width * 0.5, box.y + box.height * 0.5);
        await page.mouse.down();
        await page.mouse.move(box.x + box.width * 0.62, box.y + box.height * 0.44, { steps: 6 });
        await page.mouse.up();
        await page.waitForTimeout(700);
        await stage.screenshot({ path: path.join(outDir, `${ref.vesselId}-angle.png`) });

        // 微距近景（滚轮缩放靠近）
        await page.mouse.wheel(0, -420);
        await page.waitForTimeout(700);
        await stage.screenshot({ path: path.join(outDir, `${ref.vesselId}-macro.png`) });
        await page.evaluate(() => window.resetCamera && window.resetCamera());
        await page.waitForTimeout(500);

        const renderedHex = '#' + [sample.r, sample.g, sample.b].map((n) => n.toString(16).padStart(2, '0')).join('').toUpperCase();
        const renderedLab = srgbToLab(sample.r, sample.g, sample.b);
        const de = deltaE2000(ref.referenceLab, renderedLab);
        const pass = de <= (ref.toleranceDe2000 || 16);
        rows.push({
            name: ref.name,
            vesselId: ref.vesselId,
            refHex: ref.referenceHex,
            refLab: ref.referenceLab,
            renderedHex,
            renderedLab: renderedLab.map((v) => Number(v.toFixed(1))),
            de: Number(de.toFixed(2)),
            tolerance: ref.toleranceDe2000 || 16,
            pass,
            source: ref.source
        });
        console.log(`[glaze-verify] ${ref.vesselId}: ref=${ref.referenceHex} rendered=${renderedHex} ΔE2000=${de.toFixed(2)} (${pass ? 'OK' : 'WARN'})`);
    }
    await context.close();
} finally {
    await close();
    server.close();
}

const md = [
    '# 名窑釉色量化验证与三视图对比报告',
    '',
    `生成时间：${new Date().toISOString()}`,
    '',
    '对比方法：在文博殿堂标准聚光灯环境下渲染各核心器物正面（`*-front.png`）、斜侧（`*-angle.png`）与微距（`*-macro.png`），于器腹中调区域剔除暗背景与镜面高光后采样均色，与馆藏公开影像参考色计算 CIELab $\\Delta E_{2000}$。',
    '',
    '| 器物 | 参考色 (Hex / Lab) | 实渲采样色 (Hex / Lab) | ΔE2000 | 阈值 | 结论 |',
    '| --- | --- | --- | ---: | ---: | --- |',
    ...rows.map((r) =>
        `| ${r.name} | \`${r.refHex}\` (${r.refLab.join(', ')}) | \`${r.renderedHex}\` (${r.renderedLab.join(', ')}) | **${r.de}** | ≤ ${r.tolerance} | ${r.pass ? '通过' : '偏离需微调'} |`
    ),
    '',
    '## 三视图产物目录',
    '',
    '见 `reports/shots/glaze-compare/` 下每件器物的 `-front.png`、`-angle.png`、`-macro.png`。',
    ''
].join('\n');

fs.writeFileSync(abs('reports/glaze-color-verify.md'), md);
console.log('[glaze-verify] 完成 -> reports/glaze-color-verify.md');
process.exit(0);
