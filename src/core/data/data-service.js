/**
 * 统一数据接口。页面与模块只通过它取内容数据，不关心数据来自本地文件还是后端。
 *
 *   data.get('vessels')            同步取静态快照（永远可用，适合首屏与渲染循环）
 *   await data.load('vessels')     异步取“最新”数据：配置了后端且可达时取后端，否则回退静态
 *   data.byId('vessels', id)       按 id 取单条
 *   data.find('archive', pred)     条件查找
 *   data.subscribe('vessels', fn)  后端数据到达并替换快照时通知（静态模式下不会触发）
 *
 * 取到的对象视为只读；需要改内容请改 content/ 下的文件。
 */
import bus from '../bus.js';
import staticSource from './static-source.js';
import { createRemoteSource } from './remote-source.js';

const cache = new Map(); // collection -> data（可能已被远程数据覆盖）
const inflight = new Map();
const subs = new Map();
let remote = null;

function shapeMatches(a, b) {
    // 远程数据必须与静态数据同构（同为数组或同为对象），否则视为无效，继续用静态数据。
    return Array.isArray(a) === Array.isArray(b) && typeof a === typeof b && a != null;
}

export function configureRemote(options) {
    remote = options && options.baseUrl ? createRemoteSource(options) : null;
    return remote;
}

export function has(collection) {
    return staticSource.has(collection);
}

export function get(collection) {
    if (cache.has(collection)) return cache.get(collection);
    if (!staticSource.has(collection)) {
        console.error(`[data] 未知的内容集合: ${collection}`);
        return undefined;
    }
    const value = staticSource.get(collection);
    cache.set(collection, value);
    return value;
}

export async function load(collection, { preferRemote = true } = {}) {
    const local = get(collection);
    if (!remote || !preferRemote) return local;
    if (inflight.has(collection)) return inflight.get(collection);
    const task = remote
        .load(collection)
        .then((fresh) => {
            if (!shapeMatches(fresh, local)) throw new Error('remote shape mismatch');
            cache.set(collection, fresh);
            const set = subs.get(collection);
            if (set) set.forEach((fn) => fn(fresh));
            bus.emit('data:updated', { collection, source: 'remote' });
            return fresh;
        })
        .catch((err) => {
            bus.emit('data:fallback', { collection, reason: String(err && err.message ? err.message : err) });
            return local;
        })
        .finally(() => inflight.delete(collection));
    inflight.set(collection, task);
    return task;
}

export function byId(collection, id) {
    const list = get(collection);
    if (!Array.isArray(list)) return undefined;
    return list.find((item) => item && String(item.id) === String(id));
}

export function find(collection, predicate) {
    const list = get(collection);
    return Array.isArray(list) ? list.filter(predicate) : [];
}

export function subscribe(collection, fn) {
    let set = subs.get(collection);
    if (!set) {
        set = new Set();
        subs.set(collection, set);
    }
    set.add(fn);
    return () => set.delete(fn);
}

export function status() {
    return { remoteEnabled: !!remote, remoteHealthy: remote ? remote.isHealthy() : null, collections: Array.from(cache.keys()) };
}

export function getRemote() {
    return remote;
}

export const data = { get, load, byId, find, has, subscribe, configureRemote, status };
export default data;
