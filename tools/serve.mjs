#!/usr/bin/env node
/**
 * 零依赖静态服务器（开发预览 / 回归测试用）。
 * 用法: node tools/serve.mjs [目录=dist] [端口=4173]
 * 支持 Range（音视频拖动）、正确的 MIME、可选 gzip，行为尽量贴近 GitHub Pages。
 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

const MIME = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.mjs': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.webmanifest': 'application/manifest+json; charset=utf-8',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.webp': 'image/webp',
    '.gif': 'image/gif',
    '.ico': 'image/x-icon',
    '.woff2': 'font/woff2',
    '.woff': 'font/woff',
    '.ttf': 'font/ttf',
    '.mp3': 'audio/mpeg',
    '.webm': 'video/webm',
    '.mp4': 'video/mp4',
    '.glb': 'model/gltf-binary',
    '.gltf': 'model/gltf+json',
    '.bin': 'application/octet-stream',
    '.hdr': 'application/octet-stream',
    '.ktx2': 'image/ktx2',
    '.wasm': 'application/wasm',
    '.txt': 'text/plain; charset=utf-8',
    '.md': 'text/markdown; charset=utf-8'
};
const COMPRESSIBLE = new Set(['.html', '.js', '.mjs', '.css', '.json', '.svg', '.gltf', '.txt', '.md', '.webmanifest']);

export function createStaticServer(rootDir, { quiet = false } = {}) {
    const root = path.resolve(rootDir);
    return http.createServer((req, res) => {
        let urlPath;
        try {
            urlPath = decodeURIComponent(new URL(req.url, 'http://x').pathname);
        } catch {
            res.writeHead(400).end('bad request');
            return;
        }
        let file = path.normalize(path.join(root, urlPath));
        if (!file.startsWith(root)) {
            res.writeHead(403).end('forbidden');
            return;
        }
        if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
        if (!fs.existsSync(file)) {
            if (!quiet) console.warn('[serve] 404', urlPath);
            res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('404 Not Found: ' + urlPath);
            return;
        }
        const stat = fs.statSync(file);
        const ext = path.extname(file).toLowerCase();
        const headers = {
            'Content-Type': MIME[ext] || 'application/octet-stream',
            'Accept-Ranges': 'bytes',
            'Cache-Control': 'no-cache',
            'Last-Modified': stat.mtime.toUTCString()
        };
        const range = req.headers.range && /^bytes=(\d*)-(\d*)$/.exec(req.headers.range);
        if (range) {
            const start = range[1] ? parseInt(range[1], 10) : 0;
            const end = range[2] ? Math.min(parseInt(range[2], 10), stat.size - 1) : stat.size - 1;
            if (start > end || start >= stat.size) {
                res.writeHead(416, { 'Content-Range': `bytes */${stat.size}` }).end();
                return;
            }
            res.writeHead(206, { ...headers, 'Content-Range': `bytes ${start}-${end}/${stat.size}`, 'Content-Length': end - start + 1 });
            fs.createReadStream(file, { start, end }).pipe(res);
            return;
        }
        const acceptsGzip = /\bgzip\b/.test(req.headers['accept-encoding'] || '');
        if (acceptsGzip && COMPRESSIBLE.has(ext) && stat.size > 1024) {
            res.writeHead(200, { ...headers, 'Content-Encoding': 'gzip', Vary: 'Accept-Encoding' });
            fs.createReadStream(file).pipe(zlib.createGzip({ level: 6 })).pipe(res);
            return;
        }
        res.writeHead(200, { ...headers, 'Content-Length': stat.size });
        if (req.method === 'HEAD') res.end();
        else fs.createReadStream(file).pipe(res);
    });
}

export function serve(rootDir, port, opts) {
    return new Promise((resolve, reject) => {
        const server = createStaticServer(rootDir, opts);
        server.once('error', reject);
        server.listen(port, '127.0.0.1', () => resolve(server));
    });
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
    const dir = process.argv[2] || 'dist';
    const port = parseInt(process.argv[3] || '4173', 10);
    if (!fs.existsSync(dir)) {
        console.error(`[serve] 目录不存在: ${dir}（先运行 npm run build）`);
        process.exit(1);
    }
    await serve(dir, port);
    console.log(`[serve] ${path.resolve(dir)} -> http://127.0.0.1:${port}/`);
}
