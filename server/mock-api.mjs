#!/usr/bin/env node
/**
 * 轻量参考后端示例（仅作接口契约与本地联调演示，无外部依赖）。
 * 前端通过 window.__TQ__.core.data.configureRemote({ baseUrl: 'http://127.0.0.1:4188/api' }) 接入；
 * 当本服务停止或返回 503 时，前端自动回退到静态数据。
 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORT = parseInt(process.env.API_PORT || '4188', 10);

const server = http.createServer((req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }
    const url = new URL(req.url, `http://127.0.0.1:${PORT}`);
    if (url.pathname === '/api/health') {
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ ok: true, mode: 'mock' }));
        return;
    }
    const m = /^\/api\/content\/([\w-]+)$/.exec(url.pathname);
    if (req.method === 'GET' && m) {
        const file = path.join(ROOT, 'content', `${m[1]}.json`);
        if (!fs.existsSync(file)) {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'not_found' }));
            return;
        }
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(fs.readFileSync(file, 'utf8'));
        return;
    }
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'unsupported' }));
});

server.listen(PORT, '127.0.0.1', () => {
    console.log(`[mock-api] listening on http://127.0.0.1:${PORT}`);
});
