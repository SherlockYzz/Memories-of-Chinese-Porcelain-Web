/**
 * 浏览器连接辅助：
 *  - 若设置了 CDP_URL（或本机 9333 端口已有无头 Chrome），通过 CDP 连接；
 *  - 否则用 playwright-core 启动系统 Chrome（channel: 'chrome'），无需下载浏览器。
 */
import { chromium } from 'playwright-core';

export const VIEWPORTS = {
    desktop: { width: 1440, height: 900, deviceScaleFactor: 1, isMobile: false, hasTouch: false },
    laptop: { width: 1280, height: 800, deviceScaleFactor: 1, isMobile: false, hasTouch: false },
    wide: { width: 1920, height: 1080, deviceScaleFactor: 1, isMobile: false, hasTouch: false },
    mobile: { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true }
};

async function cdpAlive(url) {
    try {
        const res = await fetch(url + '/json/version', { signal: AbortSignal.timeout(1500) });
        return res.ok;
    } catch {
        return false;
    }
}

export async function openBrowser() {
    const cdpUrl = process.env.CDP_URL || 'http://127.0.0.1:9333';
    if (await cdpAlive(cdpUrl)) {
        const browser = await chromium.connectOverCDP(cdpUrl);
        return { browser, viaCDP: true, close: async () => {} };
    }
    const browser = await chromium.launch({
        channel: process.env.PW_CHANNEL || 'chrome',
        headless: true,
        args: ['--ignore-gpu-blocklist', '--enable-unsafe-swiftshader', '--hide-scrollbars', '--autoplay-policy=no-user-gesture-required']
    });
    return { browser, viaCDP: false, close: () => browser.close() };
}

export async function newPage(browser, viewportName = 'desktop', { theme, lang, reducedMotion } = {}) {
    const vp = VIEWPORTS[viewportName];
    if (!vp) throw new Error('未知视口: ' + viewportName);
    const context = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
        deviceScaleFactor: vp.deviceScaleFactor,
        isMobile: vp.isMobile,
        hasTouch: vp.hasTouch,
        reducedMotion: reducedMotion ? 'reduce' : 'no-preference',
        userAgent: vp.isMobile
            ? 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
            : undefined
    });
    if (theme || lang) {
        await context.addInitScript(([t, l]) => {
            try {
                if (t) localStorage.setItem('huaxia_theme', t);
                if (l) localStorage.setItem('huaxia_lang', l);
            } catch {}
        }, [theme || null, lang || null]);
    }
    const page = await context.newPage();
    const logs = { errors: [], warnings: [], failed: [] };
    page.on('pageerror', (e) => logs.errors.push(String(e && e.message ? e.message : e)));
    page.on('console', (m) => {
        if (m.type() === 'error') logs.errors.push(m.text());
        else if (m.type() === 'warning') logs.warnings.push(m.text());
    });
    page.on('requestfailed', (r) => logs.failed.push(`${r.url()} :: ${r.failure() ? r.failure().errorText : ''}`));
    page.on('response', (r) => {
        if (r.status() >= 400) logs.failed.push(`${r.status()} ${r.url()}`);
    });
    return { page, context, logs };
}

/** 滚动到指定位置并等待渲染稳定（页面有滚动联动动画，给两帧 + 定时缓冲）。 */
export async function scrollToY(page, y, settleMs = 900) {
    await page.evaluate((top) => window.scrollTo({ top, behavior: 'instant' }), y);
    await page.waitForTimeout(settleMs);
}
