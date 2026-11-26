/**
 * 图像分级空闲预加载器 (image-prefetch)
 * - 绝不在首屏加载前抢占带宽；等到 hero:ready（或兜底延时）且页面空闲时，
 *   以低并发（移动端 2 路 / 桌面端 3 路）按阅读顺序静默暖图进浏览器与 Service Worker 缓存，
 *   让手机端下滑到任意图文板块时图片 0ms 瞬出。
 */
import bus from './bus.js';
import data from './data/data-service.js';

const prefetched = new Set();

function isSlowOrSaveData() {
    const conn = typeof navigator !== 'undefined' ? navigator.connection : null;
    if (!conn) return false;
    return !!(conn.saveData || /(^|-)2g$/.test(conn.effectiveType || ''));
}

function collectOrderedImageUrls() {
    const urls = [];
    const push = (u) => {
        if (!u || typeof u !== 'string') return;
        const clean = u.replace(/^\.\//, '');
        if (!prefetched.has(clean) && !urls.includes(clean)) urls.push(clean);
    };

    // 1. 馆藏图录首批（移动端首屏以下最先看到的 8 张卡片）
    const archive = data.get('archive') || [];
    archive.slice(0, 8).forEach((item) => push(item.img));

    // 2. 七艺缩略图 + AI 样本图（已转超轻 WebP，合计仅 ~40KB）
    for (let i = 1; i <= 7; i++) push(`images/icons/craft-${i}.webp`);
    ['guan', 'ru', 'ge', 'jun', 'ding', 'qinghua'].forEach((k) => push(`images/ai-samples/sample-${k}.webp`));

    // 3. 工序步骤与通史首屏配图 + 视频封面
    (data.get('workshop-steps') || []).slice(0, 8).forEach((s) => push(s.img));
    (data.get('history') || []).slice(0, 4).forEach((h) => push(h.img));
    ['step1-throwing', 'step2-trimming', 'step3-glazing', 'step4-qinghua', 'step5-kiln'].forEach((s) =>
        push(`images/videos/${s}.webp`)
    );

    // 4. 其余展品预览与图录
    (data.get('vessels') || []).forEach((v) => v.model && push(v.model.previewImg));
    archive.slice(8).forEach((item) => push(item.img));

    return urls;
}

function runQueue(urls, concurrency) {
    let idx = 0;
    let active = 0;

    function pump() {
        if (document.hidden) return;
        while (active < concurrency && idx < urls.length) {
            const url = urls[idx++];
            if (prefetched.has(url)) continue;
            prefetched.add(url);
            active++;
            const img = new Image();
            img.decoding = 'async';
            const done = () => {
                active = Math.max(0, active - 1);
                if (idx < urls.length) {
                    if (typeof requestIdleCallback === 'function') {
                        requestIdleCallback(pump, { timeout: 500 });
                    } else {
                        setTimeout(pump, 16);
                    }
                }
            };
            img.onload = done;
            img.onerror = done;
            img.src = url;
        }
    }

    pump();
}

export function startImagePrefetch() {
    if (typeof window === 'undefined' || isSlowOrSaveData()) return;

    let started = false;
    const kick = () => {
        if (started) return;
        started = true;
        const urls = collectOrderedImageUrls();
        if (!urls.length) return;
        const isMobile = window.innerWidth < 768;
        const concurrency = isMobile ? 2 : 3;
        const start = () => runQueue(urls, concurrency);
        if (typeof requestIdleCallback === 'function') {
            requestIdleCallback(start, { timeout: 1200 });
        } else {
            setTimeout(start, 200);
        }
    };

    const fallback = setTimeout(kick, 1100);
    bus.once('hero:ready', () => {
        clearTimeout(fallback);
        setTimeout(kick, 180);
    });
}

export default startImagePrefetch;
