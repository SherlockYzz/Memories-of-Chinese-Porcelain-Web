/**
 * 共享状态仓：只放“跨模块都关心”的少量状态；模块私有状态留在模块内部。
 * 变更会同步广播 `store:<key>` 事件。
 */
import bus from './bus.js';
import storage, { KEYS } from './storage.js';

function initialTheme() {
    const saved = storage.getRaw(KEYS.theme);
    if (saved === 'dark' || saved === 'light') return saved;
    return (typeof document !== 'undefined' && document.documentElement.getAttribute('data-theme')) || 'light';
}

function initialLang() {
    const saved = storage.getRaw(KEYS.lang);
    if (saved === 'en' || saved === 'zh') return saved;
    return 'zh';
}

function initialBookmarks() {
    const v = storage.getJSON(KEYS.bookmarks, null);
    return Array.isArray(v) ? v : [1, 2];
}

const state = {
    theme: initialTheme(),
    // 语言在英文词典按需加载完成前保持 'zh'，由 i18n 模块负责切换。
    lang: 'zh',
    preferredLang: initialLang(),
    modelIndex: 0,
    exhibitionMode: 'inspector',
    bgEnabled: storage.getRaw(KEYS.bgMotion) !== 'false',
    bookmarks: initialBookmarks(),
    activeSection: 'hero'
};

const PERSIST = {
    theme: (v) => storage.setRaw(KEYS.theme, v),
    lang: (v) => storage.setRaw(KEYS.lang, v),
    bgEnabled: (v) => storage.setRaw(KEYS.bgMotion, String(!!v)),
    bookmarks: (v) => storage.setJSON(KEYS.bookmarks, v)
};

const subscribers = new Map();

function sameArray(a, b) {
    return Array.isArray(a) && Array.isArray(b) && a.length === b.length && a.every((v, i) => v === b[i]);
}

export function get(key) {
    return state[key];
}

export function set(key, value) {
    const prev = state[key];
    if (prev === value || sameArray(prev, value)) return value;
    state[key] = value;
    if (PERSIST[key]) PERSIST[key](value);
    const subs = subscribers.get(key);
    if (subs) {
        subs.forEach((fn) => {
            try {
                fn(value, prev);
            } catch (err) {
                console.warn('[store]', key, err);
            }
        });
    }
    bus.emit(`store:${key}`, { value, prev });
    return value;
}

export function subscribe(key, fn) {
    if (!key || typeof fn !== 'function') return () => {};
    let setForKey = subscribers.get(key);
    if (!setForKey) {
        setForKey = new Set();
        subscribers.set(key, setForKey);
    }
    setForKey.add(fn);
    return () => setForKey.delete(fn);
}

export function snapshot() {
    return { ...state, bookmarks: state.bookmarks.slice() };
}

export const store = { get, set, subscribe, snapshot };
export default store;
