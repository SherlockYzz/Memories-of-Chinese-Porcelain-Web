/**
 * 按需加载：通过“逻辑名”加载构建产物，源码里不出现产物路径。
 * 逻辑名 -> 路径 的映射由构建脚本注入 window.__TQ_ASSETS__。
 *
 *   await lazy.load('i18n-en')        // 加载并返回该分块通过 provideChunk 交出的导出
 *   lazy.whenVisible('#pottery-studio', () => lazy.load('legacy-pottery'))
 */
const state = new Map(); // name -> { promise, exports }

function assetUrl(name) {
    const map = (typeof window !== 'undefined' && window.__TQ_ASSETS__) || {};
    return map[name] || null;
}

export function has(name) {
    return !!assetUrl(name);
}

export function load(name, { priority = 'low' } = {}) {
    if (state.has(name)) return state.get(name).promise;
    const url = assetUrl(name);
    const entry = { exports: undefined, promise: null };
    entry.promise = new Promise((resolve, reject) => {
        if (!url) {
            reject(new Error(`[lazy] 未知的按需分块: ${name}`));
            return;
        }
        const s = document.createElement('script');
        s.src = url;
        s.async = true;
        try {
            s.fetchPriority = priority;
        } catch {}
        s.onload = () => resolve(entry.exports);
        s.onerror = () => {
            state.delete(name); // 允许稍后重试
            reject(new Error(`[lazy] 分块加载失败: ${name}`));
        };
        document.head.appendChild(s);
    });
    state.set(name, entry);
    return entry.promise;
}

/** 分块脚本执行时调用，把自己的导出交给等待中的 load()。 */
export function provideChunk(name, exports) {
    const entry = state.get(name);
    if (entry) entry.exports = exports;
    else state.set(name, { exports, promise: Promise.resolve(exports) });
}

export function isLoaded(name) {
    const e = state.get(name);
    return !!(e && e.exports !== undefined);
}

/** 元素接近视口时触发一次回调；返回取消函数。 */
export function whenVisible(target, callback, { rootMargin = '600px 0px' } = {}) {
    const el = typeof target === 'string' ? document.querySelector(target) : target;
    if (!el || !('IntersectionObserver' in window)) {
        const id = setTimeout(callback, 3000);
        return () => clearTimeout(id);
    }
    const io = new IntersectionObserver(
        (entries) => {
            if (entries.some((e) => e.isIntersecting)) {
                io.disconnect();
                callback();
            }
        },
        { rootMargin }
    );
    io.observe(el);
    return () => io.disconnect();
}

/** 浏览器空闲时执行（不支持 requestIdleCallback 时退化为 setTimeout）。 */
export function whenIdle(callback, timeout = 2500) {
    if ('requestIdleCallback' in window) return window.requestIdleCallback(callback, { timeout });
    return setTimeout(callback, Math.min(timeout, 1200));
}

export const lazy = { load, has, provideChunk, isLoaded, whenVisible, whenIdle };
export default lazy;
