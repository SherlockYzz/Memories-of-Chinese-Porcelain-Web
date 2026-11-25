/* 天青泥火 · 离线缓存 Service Worker（HTML NetworkFirst / 哈希资产 CacheFirst / 其余 Stale-While-Revalidate） */
const CACHE_NAME = 'tianqing-nihuo-v9-perf';
const APP_SHELL = ['./', './index.html', './manifest.webmanifest'];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches
            .open(CACHE_NAME)
            .then((cache) => cache.addAll(APP_SHELL))
            .then(() => self.skipWaiting())
    );
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
    // 跳过后端接口与大体积视频，不缓存 API 响应并避免撑爆配额
    if (/\/api\//i.test(url.pathname) || /\.(webm|mp4)$/i.test(url.pathname)) return;

    // 1. HTML 文档导航：NetworkFirst，优先保证最新版本，离线时回退缓存
    if (req.mode === 'navigate' || url.pathname.endsWith('/index.html')) {
        event.respondWith(
            fetch(req)
                .then((res) => {
                    if (res && res.status === 200 && res.type === 'basic') {
                        const copy = res.clone();
                        caches.open(CACHE_NAME).then((c) => c.put(req, copy));
                    }
                    return res;
                })
                .catch(() => caches.match(req).then((c) => c || caches.match('./index.html')))
        );
        return;
    }

    // 2. 带内容哈希的构建产物与字体：CacheFirst 实现二次访问零网络延迟
    if (/\/(assets|webfonts)\//i.test(url.pathname)) {
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
        return;
    }

    // 3. 其余静态图片与模型资源：Stale-While-Revalidate
    event.respondWith(
        caches.match(req).then((cached) => {
            const network = fetch(req)
                .then((res) => {
                    if (res && res.status === 200 && res.type === 'basic') {
                        const copy = res.clone();
                        caches.open(CACHE_NAME).then((c) => c.put(req, copy));
                    }
                    return res;
                })
                .catch(() => cached);
            return cached || network;
        })
    );
});
