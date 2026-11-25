/**
 * 远程数据源（可选）。默认不启用；启用方式：
 *
 *   <script>window.__TQ_CONFIG__ = { api: { baseUrl: 'https://example.com/api', timeoutMs: 2500 } }</script>
 *
 * 约定接口：GET {baseUrl}/content/{collection} -> JSON（结构与 content/{collection}.json 相同）
 *           GET/PUT {baseUrl}/user/{key}       -> 用户数据（手记、收藏、护照），需自行处理鉴权
 *
 * 任何失败（超时、非 2xx、JSON 损坏）都只会让 data-service 回退到静态数据，不会影响页面。
 * 页面与模块永远不直接 fetch 后端，只通过 data-service。
 */
export function createRemoteSource({ baseUrl, timeoutMs = 2500, headers = {} } = {}) {
    const root = String(baseUrl || '').replace(/\/+$/, '');
    let healthy = true;
    let lastFailure = 0;

    async function request(path, init = {}) {
        // 熔断：最近 30 秒内失败过就不再打扰后端，直接走静态兜底。
        if (!healthy && Date.now() - lastFailure < 30000) throw new Error('remote circuit open');
        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), timeoutMs);
        try {
            const res = await fetch(root + path, { ...init, headers: { Accept: 'application/json', ...headers, ...(init.headers || {}) }, signal: ctrl.signal });
            if (!res.ok) throw new Error('HTTP ' + res.status);
            const json = await res.json();
            healthy = true;
            return json;
        } catch (err) {
            healthy = false;
            lastFailure = Date.now();
            throw err;
        } finally {
            clearTimeout(timer);
        }
    }

    return {
        name: 'remote',
        enabled: !!root,
        isHealthy: () => healthy,
        load: (collection) => request('/content/' + encodeURIComponent(collection)),
        getUser: (key) => request('/user/' + encodeURIComponent(key)),
        putUser: (key, value) =>
            request('/user/' + encodeURIComponent(key), {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(value)
            })
    };
}
