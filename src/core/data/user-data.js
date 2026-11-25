/**
 * 用户数据仓库（手记、收藏、研学护照、作品、成绩）。
 * 现在落在 localStorage；配置了后端时会在本地写入成功后“尽力同步”，失败不影响本地。
 * 模块不直接碰 localStorage，统一走这里，方便以后换成账号体系。
 */
import bus from '../bus.js';
import storage, { KEYS } from '../storage.js';
import { getRemote } from './data-service.js';

const DEFAULTS = {
    notes: '',
    passport: { stamps: {}, startedAt: null },
    works: [],
    quizBest: null,
    accessibility: { largeText: false, highContrast: false, reduceMotion: false }
};

function keyOf(name) {
    if (!KEYS[name]) throw new Error('未登记的用户数据键: ' + name);
    return KEYS[name];
}

export function read(name) {
    const fallback = DEFAULTS[name];
    if (typeof fallback === 'string') {
        const raw = storage.getRaw(keyOf(name));
        return raw == null ? fallback : raw;
    }
    const v = storage.getJSON(keyOf(name), null);
    if (v == null) return structuredCloneSafe(fallback);
    return v;
}

export function write(name, value) {
    const ok = typeof value === 'string' ? storage.setRaw(keyOf(name), value) : storage.setJSON(keyOf(name), value);
    bus.emit('user:changed', { name, value });
    const remote = getRemote();
    if (remote && remote.enabled) remote.putUser(name, value).catch(() => {});
    return ok;
}

export function update(name, fn) {
    const next = fn(read(name));
    write(name, next);
    return next;
}

/** 导出全部用户数据（给“导出我的数据”按钮用）。 */
export function exportAll() {
    const out = { exportedAt: new Date().toISOString(), app: 'tianqing-nihuo' };
    for (const name of Object.keys(DEFAULTS)) out[name] = read(name);
    out.bookmarks = storage.getJSON(KEYS.bookmarks, []);
    return out;
}

/** 清除全部用户数据（不含主题 / 语言等界面偏好）。 */
export function clearAll() {
    for (const name of Object.keys(DEFAULTS)) storage.remove(keyOf(name));
    storage.remove(KEYS.bookmarks);
    bus.emit('user:cleared', {});
}

function structuredCloneSafe(v) {
    return v == null ? v : JSON.parse(JSON.stringify(v));
}

export const userData = { read, write, update, exportAll, clearAll, persistent: storage.available };
export default userData;
