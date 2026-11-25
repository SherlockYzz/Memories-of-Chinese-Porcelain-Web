/* 天青泥火 · 安全可控 Service Worker（仅缓存不可变哈希静态产物 /assets/ 与 /webfonts/，全面放行 HTML/图片/3D 模型） */
const CACHE_NAME = 'tianqing-nihuo-v9-safe';

self.addEventListener('install', (event) => {
    event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches
            .keys()
            .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
            .then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    const req = event.request;
    if (req.method !== 'GET') return;
    const url = new URL(req.url);
    if (url.origin !== self.location.origin) return;

    // 仅对带内容哈希的不可变构建脚本/样式与字体启用 CacheFirst；
    // HTML 文档、images/*、models/*、audio/*、videos/* 与 /api/* 一律交由浏览器原生网络请求处理。
    if (!/\/(assets|webfonts)\//i.test(url.pathname)) return;

    event.respondWith(
        caches.match(req).then((cached) => {
            if (cached) return cached;
            return fetch(req).then((res) => {
                if (res && res.status === 200 && res.type === 'basic') {
                    const copy = res.clone();
                    caches.open(CACHE_NAME).then((c) => c.put(req, copy));
                }
                return res;
            });
        })
    );
});
