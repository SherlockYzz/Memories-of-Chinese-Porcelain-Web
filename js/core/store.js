/**
 * 华夏器道 · 受控共享状态仓 (AppStore)
 * 集中管理跨模块共享状态，禁止模块直接修改彼此私有变量。
 */
(function (global) {
    'use strict';

    function loadBookmarks() {
        try {
            const raw = localStorage.getItem('huaxia_study_bookmarks');
            if (raw) {
                const parsed = JSON.parse(raw);
                if (Array.isArray(parsed)) return parsed;
            }
        } catch (e) {}
        return [1, 2];
    }

    function loadTheme() {
        try {
            const saved = localStorage.getItem('huaxia_theme');
            if (saved === 'dark' || saved === 'light') return saved;
        } catch (e) {}
        return (typeof document !== 'undefined' && document.documentElement.getAttribute('data-theme')) || 'light';
    }

    function loadLang() {
        try {
            const saved = localStorage.getItem('huaxia_lang');
            if (saved === 'en' || saved === 'zh') return saved;
        } catch (e) {}
        return (typeof document !== 'undefined' && document.documentElement.getAttribute('data-lang')) || 'zh';
    }

    function loadBgEnabled() {
        try {
            const saved = localStorage.getItem('huaxia_bg_motion');
            if (saved === 'false') return false;
            if (saved === 'true') return true;
        } catch (e) {}
        return true;
    }

    const state = {
        theme: loadTheme(),
        lang: loadLang(),
        modelIndex: 0,
        exhibitionMode: 'inspector',
        bgEnabled: loadBgEnabled(),
        bookmarks: loadBookmarks()
    };

    const subscribers = new Map();

    function get(key) {
        return state[key];
    }

    function set(key, value) {
        const prev = state[key];
        const sameArray = Array.isArray(prev) && Array.isArray(value) &&
            prev.length === value.length && prev.every((v, i) => v === value[i]);
        if (prev === value || sameArray) return value;

        state[key] = value;

        if (key === 'bookmarks') {
            try { localStorage.setItem('huaxia_study_bookmarks', JSON.stringify(value)); } catch (e) {}
        } else if (key === 'theme') {
            try { localStorage.setItem('huaxia_theme', value); } catch (e) {}
        } else if (key === 'lang') {
            try { localStorage.setItem('huaxia_lang', value); } catch (e) {}
        } else if (key === 'bgEnabled') {
            try { localStorage.setItem('huaxia_bg_motion', String(!!value)); } catch (e) {}
        }

        const subs = subscribers.get(key);
        if (subs) {
            subs.forEach((fn) => {
                try { fn(value, prev); } catch (err) { console.warn('[AppStore]', key, err); }
            });
        }
        if (global.AppBus) {
            global.AppBus.emit(`store:${key}`, { value, prev });
        }
        return value;
    }

    function subscribe(key, fn) {
        if (!key || typeof fn !== 'function') return function () {};
        let setForKey = subscribers.get(key);
        if (!setForKey) {
            setForKey = new Set();
            subscribers.set(key, setForKey);
        }
        setForKey.add(fn);
        return function () { setForKey.delete(fn); };
    }

    function snapshot() {
        return { ...state, bookmarks: state.bookmarks.slice() };
    }

    global.AppStore = { get, set, subscribe, snapshot };
})(window);
