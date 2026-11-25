#!/usr/bin/env node
/**
 * 端到端 Playwright 视觉与功能回归测试。
 * 校验：
 * 1. 桌面 1280/1440/1920 与手机 390 下零控制台错误、零 404 请求、零 undefined/NaN 文本
 * 2. 无横向溢出 (scrollWidth <= clientWidth)，顶栏无溢出 (navScrollWidth <= navClientWidth)
 * 3. 浅色与深色主题在滚动 1400 / 3200 / 6000 / 10000 px 处 3D 背景画布可见且板块背景透明度 <= 0.30
 * 4. 手机端抽屉导航、语言切换、3D 工具栏滚动可用且热点不越界
 */
import assert from 'node:assert/strict';
import { serve } from '../tools/serve.mjs';
import { openBrowser, newPage, scrollToY } from './lib/browser.mjs';

const PORT = parseInt(process.env.TEST_PORT || '4179', 10);
const server = await serve('dist', PORT, { quiet: true });
const { browser, close } = await openBrowser();

try {
    // 1. 桌面端 1280 / 1440 / 1920 顶栏与基础检查
    for (const vp of ['laptop', 'desktop', 'wide']) {
        const { page, context, logs } = await newPage(browser, vp, { theme: 'light' });
        await page.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: 'load', timeout: 60000 });
        await page.waitForTimeout(1800);
        const res = await page.evaluate(() => {
            const de = document.documentElement;
            const navInner = document.querySelector('[data-nav-inner]');
            const acts = document.querySelector('[data-nav-acts]');
            const tools = document.querySelector('.site-nav__tools');
            return {
                scrollWidth: de.scrollWidth,
                clientWidth: de.clientWidth,
                navScrollWidth: navInner ? navInner.scrollWidth : 0,
                navClientWidth: navInner ? navInner.clientWidth : 0,
                actsOverflow: acts ? acts.scrollWidth > acts.clientWidth + 2 : false,
                toolsRight: tools ? tools.getBoundingClientRect().right : 0,
                winWidth: window.innerWidth
            };
        });
        assert.equal(logs.errors.length, 0, `${vp} 控制台有报错: ${logs.errors.join('; ')}`);
        assert.equal(logs.failed.length, 0, `${vp} 有请求失败: ${logs.failed.join('; ')}`);
        assert.ok(res.scrollWidth <= res.clientWidth, `${vp} 存在横向溢出: ${res.scrollWidth} > ${res.clientWidth}`);
        assert.ok(res.navScrollWidth <= res.navClientWidth + 2, `${vp} 顶栏溢出: ${res.navScrollWidth} > ${res.navClientWidth}`);
        assert.ok(res.toolsRight <= res.winWidth + 1, `${vp} 顶栏工具条超出右边界`);
        await context.close();
        console.log(`[test] ${vp}/light 顶栏与溢出检查通过 (nav ${res.navScrollWidth}/${res.navClientWidth})`);
    }

    // 2. 浅色与深色主题下的滚动背景透出 + 全页 badText 检查
    for (const theme of ['light', 'dark']) {
        const { page, context, logs } = await newPage(browser, 'desktop', { theme });
        await page.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: 'load', timeout: 60000 });
        await page.waitForTimeout(2200);

        for (const y of [1400, 3200, 6000, 10000]) {
            await scrollToY(page, y, 500);
            const state = await page.evaluate(() => {
                const bg = document.getElementById('webgl-ambient-bg');
                const bgStyle = bg ? getComputedStyle(bg) : null;
                const sec = document.querySelector('section.section-surface');
                const secBg = sec ? getComputedStyle(sec).backgroundColor : '';
                const m = /rgba?\([^,]+,[^,]+,[^,]+(?:,\s*([\d.]+))?\)/.exec(secBg);
                const alpha = m ? (m[1] !== undefined ? parseFloat(m[1]) : 1) : 0;
                return {
                    bgVisible: !!(bg && bgStyle.display !== 'none' && parseFloat(bgStyle.opacity) > 0 && bg.width > 0 && bg.height > 0),
                    sectionAlpha: alpha
                };
            });
            assert.equal(state.bgVisible, true, `${theme} y=${y} 处 3D 背景画布不可见`);
            assert.ok(state.sectionAlpha <= 0.30, `${theme} y=${y} 处板块底色不透明度过高: ${state.sectionAlpha}`);
        }

        const badText = await page.evaluate(() => {
            const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
            const bad = [];
            let n;
            while ((n = walker.nextNode())) {
                if (/\bundefined\b|\bNaN\b|\[object Object\]/.test(n.nodeValue)) {
                    const p = n.parentElement;
                    if (p && !/^(SCRIPT|STYLE|NOSCRIPT|TEMPLATE)$/.test(p.tagName)) bad.push(n.nodeValue.trim().slice(0, 80));
                }
            }
            return bad;
        });
        assert.equal(badText.length, 0, `${theme} 发现未兜底异常文本: ${badText.join(' | ')}`);
        assert.equal(logs.errors.length, 0, `${theme} 控制台报错: ${logs.errors.join('; ')}`);

        // 语言切换测试
        await page.click('#lang-toggle');
        await page.waitForTimeout(600);
        const langAttr = await page.getAttribute('html', 'data-lang');
        assert.equal(langAttr, 'en', '切换到英文后 html[data-lang] 未更新为 en');
        await page.click('#lang-toggle');
        await page.waitForTimeout(400);

        await context.close();
        console.log(`[test] desktop/${theme} 背景透出、无异常文本、双语切换通过`);
    }

    // 3. 移动端 390×844 横向溢出、抽屉导航、3D 工具条与热点钳位检查
    {
        const { page, context, logs } = await newPage(browser, 'mobile', { theme: 'light' });
        await page.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: 'load', timeout: 60000 });
        await page.waitForTimeout(2200);

        const mobileCheck = await page.evaluate(() => {
            const de = document.documentElement;
            const stage = document.getElementById('three-stage-container');
            const stageRect = stage ? stage.getBoundingClientRect() : null;
            const hotspots = Array.from(document.querySelectorAll('.vessel-3d-hotspot')).map((el) => {
                const r = el.getBoundingClientRect();
                return { left: r.left, right: r.right, opacity: parseFloat(getComputedStyle(el).opacity) };
            });
            const toolbar = document.querySelector('.canvas-quick-toolbar');
            const tbRect = toolbar ? toolbar.getBoundingClientRect() : null;
            return {
                scrollWidth: de.scrollWidth,
                clientWidth: de.clientWidth,
                stageRight: stageRect ? stageRect.right : 0,
                tbWidth: tbRect ? tbRect.width : 0,
                hotspotsClipped: hotspots.filter((h) => h.opacity > 0.1 && (h.left < -1 || h.right > window.innerWidth + 1))
            };
        });
        assert.equal(mobileCheck.scrollWidth, mobileCheck.clientWidth, `手机端存在横向溢出: ${mobileCheck.scrollWidth} != ${mobileCheck.clientWidth}`);
        assert.ok(mobileCheck.tbWidth <= 390, `手机端 3D 工具条超出屏幕: ${mobileCheck.tbWidth}`);
        assert.equal(mobileCheck.hotspotsClipped.length, 0, '手机端 3D 热点标签超出视口');

        // 打开移动端抽屉
        await page.click('#hamburger');
        await page.waitForTimeout(400);
        const drawerOpen = await page.locator('#mobile-menu.active').count();
        assert.equal(drawerOpen, 1, '手机端抽屉导航未能打开');
        await page.click('#mobile-close');
        await page.waitForTimeout(350);

        assert.equal(logs.errors.length, 0, `mobile 控制台报错: ${logs.errors.join('; ')}`);
        await context.close();
        console.log('[test] mobile/light 零溢出、抽屉导航、工具条与热点检查通过');
    }

    // 4. 新增模块（开片模拟器、金缮修复、1300℃时间轴、研学护照、致谢页、AR 预览、无障碍面板）与后端不可用兜底检查
    {
        const { page, context, logs } = await newPage(browser, 'desktop', { theme: 'light' });
        await page.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: 'load', timeout: 60000 });
        await page.waitForTimeout(2000);

        // 验证新板块均已挂载
        const mounted = await page.evaluate(() => {
            const cCanvas = document.getElementById('crackle-sim-canvas');
            const kCanvas = document.getElementById('kintsugi-canvas');
            const fSlider = document.getElementById('firing-temp-slider');
            const pStamps = document.querySelectorAll('#passport-mount .passport-stamp').length;
            const credCards = document.querySelectorAll('#credits-groups-container article').length;
            const credCopyright = document.querySelector('#credits-groups-container [data-credits-copyright]')?.textContent || '';
            return {
                crackleOk: !!(cCanvas && cCanvas.width > 0),
                kintsugiOk: !!(kCanvas && kCanvas.width > 0),
                firingOk: !!fSlider,
                passportStamps: pStamps,
                creditsCount: credCards,
                credCopyright
            };
        });
        assert.equal(mounted.crackleOk, true, '开片模拟器未挂载');
        assert.equal(mounted.kintsugiOk, true, '金缮修复未挂载');
        assert.equal(mounted.firingOk, true, '1300℃ 烧成时间轴未挂载');
        assert.equal(mounted.passportStamps, 8, '研学护照印章数应为 8');
        assert.ok(mounted.creditsCount >= 12, `素材与致谢条目渲染不足: ${mounted.creditsCount}`);
        assert.ok(mounted.credCopyright.includes('版权制作：折木柯南'), '素材与致谢缺少“版权制作：折木柯南”声明');
        const negativeHits = await page.evaluate(() => {
            const t = document.body.innerText || '';
            return ['出处待核实', '待作者确认', '非实物扫描', '请勿当作馆藏著录'].filter((w) => t.includes(w));
        });
        assert.equal(negativeHits.length, 0, `页面存在负面防御用语: ${negativeHits.join(', ')}`);

        // 交互验证：金缮辅助对位 & 打开 AR 实尺弹窗 & 无障碍弹窗
        await page.locator('[data-action="assistKintsugiStep()"]').scrollIntoViewIfNeeded();
        await page.click('[data-action="assistKintsugiStep()"]');
        const kStatus = await page.locator('#kintsugi-stage-status').textContent();
        assert.ok(kStatus.includes('1 / 4'), `金缮辅助对位状态异常: ${kStatus}`);

        await page.evaluate(() => window.__TQ__.core.actions.run('openArViewer'));
        await page.waitForTimeout(300);
        assert.equal(await page.locator('#ar-viewer-modal.active').count(), 1, 'AR 实尺弹窗未打开');
        await page.keyboard.press('Escape');
        await page.waitForTimeout(250);
        assert.equal(await page.locator('#ar-viewer-modal.active').count(), 0, 'Esc 未能关闭 AR 弹窗');

        await page.evaluate(() => window.__TQ__.core.actions.run('openAccessibilityPanel'));
        await page.waitForTimeout(300);
        assert.equal(await page.locator('#a11y-panel-modal.active').count(), 1, '无障碍面板未打开');
        await page.click('[data-action="toggleA11yPref(\'largeText\')"]');
        assert.equal(await page.evaluate(() => document.documentElement.hasAttribute('data-large-text')), true, '大字模式开关未生效');
        await page.click('[data-action="toggleA11yPref(\'largeText\')"]');
        await page.keyboard.press('Escape');

        assert.equal(logs.errors.length, 0, `新模块交互存在控制台报错: ${logs.errors.join('; ')}`);
        assert.equal(logs.failed.length, 0, `新模块交互存在失败请求: ${logs.failed.join('; ')}`);

        // 再拦截测试用 /api/ 请求返回 503，验证静态兜底触发且仍返回 15 件器物
        await page.route('**/api/**', (route) =>
            route.fulfill({ status: 503, contentType: 'application/json', body: '{"error":"unavailable"}' })
        );
        const fallbackCheck = await page.evaluate(async () => {
            let fallbackEvent = null;
            const off = window.__TQ__.core.bus.on('data:fallback', (p) => {
                fallbackEvent = p;
            });
            window.__TQ__.core.data.configureRemote({ baseUrl: '/api' });
            const vesselsFallback = await window.__TQ__.core.data.load('vessels');
            off();
            return {
                fallbackLen: Array.isArray(vesselsFallback) ? vesselsFallback.length : 0,
                fallbackEvent,
                remoteHealthy: window.__TQ__.core.data.status().remoteHealthy
            };
        });
        assert.equal(fallbackCheck.fallbackLen, 15, '后端 503 时静态兜底未返回全部 15 件器物');
        assert.equal(fallbackCheck.fallbackEvent?.collection, 'vessels', '未触发 data:fallback 兜底事件');
        assert.equal(fallbackCheck.remoteHealthy, false, '远程熔断状态应标记为不健康');

        await context.close();
        console.log('[test] 五大创新模块、AR/无障碍弹窗、Esc 关闭与后端 503 静态兜底测试全部通过');
    }

    console.log('\n[test] 全部 E2E 回归检查通过！');
} finally {
    await close();
    server.close();
}
process.exit(0);
