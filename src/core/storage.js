/**
 * 本地持久化适配器。所有 localStorage 读写都经过这里，键名集中登记，
 * 以后换成云端同步时只需提供同样接口的适配器（见 core/data/user-data.js）。
 */
export const KEYS = Object.freeze({
    theme: 'huaxia_theme',
    lang: 'huaxia_lang',
    bgMotion: 'huaxia_bg_motion',
    bookmarks: 'huaxia_study_bookmarks',
    notes: 'huaxia_study_notes',
    passport: 'tq_passport_v1',
    accessibility: 'tq_a11y_v1',
    quizBest: 'tq_quiz_best_v1',
    works: 'tq_works_v1'
});

function available() {
    try {
        const k = '__tq_probe__';
        window.localStorage.setItem(k, '1');
        window.localStorage.removeItem(k);
        return true;
    } catch {
        return false;
    }
}

const memory = new Map();
const ok = typeof window !== 'undefined' && available();

export const storage = {
    available: ok,
    getRaw(key) {
        if (!ok) return memory.has(key) ? memory.get(key) : null;
        try {
            return window.localStorage.getItem(key);
        } catch {
            return null;
        }
    },
    setRaw(key, value) {
        if (!ok) {
            memory.set(key, String(value));
            return true;
        }
        try {
            window.localStorage.setItem(key, String(value));
            return true;
        } catch {
            return false;
        }
    },
    getJSON(key, fallback) {
        const raw = this.getRaw(key);
        if (raw == null) return fallback;
        try {
            const v = JSON.parse(raw);
            return v == null ? fallback : v;
        } catch {
            return fallback;
        }
    },
    setJSON(key, value) {
        return this.setRaw(key, JSON.stringify(value));
    },
    remove(key) {
        memory.delete(key);
        if (!ok) return;
        try {
            window.localStorage.removeItem(key);
        } catch {}
    }
};

export default storage;
