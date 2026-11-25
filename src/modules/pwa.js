/**
 * 模块：PWA 离线支持 (pwa)
 * 页面空闲后再注册 Service Worker，采用应用壳缓存策略，确保不拖慢首屏加载。
 */
import { defineModule } from '@core';

function registerSw() {
    if (!('serviceWorker' in navigator)) return;
    if (!window.isSecureContext && location.hostname !== '127.0.0.1' && location.hostname !== 'localhost') return;
    navigator.serviceWorker.register('./sw.js', { scope: './' }).catch(() => {});
}

export default defineModule({
    id: 'pwa',
    phase: 3,
    init() {
        const schedule = () => {
            if (typeof requestIdleCallback === 'function') requestIdleCallback(registerSw, { timeout: 4000 });
            else setTimeout(registerSw, 2500);
        };
        if (document.readyState === 'complete') schedule();
        else window.addEventListener('load', schedule, { once: true });
    }
});
