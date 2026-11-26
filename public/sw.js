/* 天青泥火 · 安全高性能 Service Worker（不可变静态构建 + 模型与图片一次缓存，二次访问秒开） */
const CACHE_NAME = 'tianqing-nihuo-v10.0.0-fast';

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

    // 仅对构建静态产物、字体、3D 模型与图录图片启用安全 CacheFirst；
    // HTML 文档、audio/*、videos/* 与 /api/* 一律交由浏览器原生网络直连。
    if (!/\/(assets|webfonts|models|images)\//i.test(url.pathname)) return;

    event.respondWith(
        caches.match(req).then((cached) => {
            if (cached) return cached;
            return fetch(req).then((res) => {
                if (res && res.ok && res.status === 200 && res.type === 'basic') {
                    const copy = res.clone();
                    caches.open(CACHE_NAME).then((c) => c.put(req, copy));
                }
                return res;
            });
        })
    );
});
