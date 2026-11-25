/**
 * 多语言引擎（中 / EN）。
 *
 * 两类文案：
 *   1. 界面键值：content/i18n/ui.json，用 t('nav.3d') 或 data-i18n="nav.3d"；
 *   2. 内容原文：以中文原文为 msgid（gettext 做法），英文在 content/i18n/en.exact.json，
 *      另有短语表 en.phrases.json 兜底。用 tr('中文原文')，或交给 DOM 自动翻译。
 *
 * 英文词典约 700 KB，只在切到英文时按需加载（lazy 分块 i18n-en），不占首屏。
 * `npm run check:i18n` 会报告缺失与未使用的条目。
 */
import bus from './bus.js';
import store from './store.js';
import storage, { KEYS } from './storage.js';
import lazy from './lazy.js';
import staticSource from './data/static-source.js';
import ui from '../../content/i18n/ui.json';
import site from '../../content/site.json';

const CJK_RE = /[\u4e00-\u9fa5]/;
const SKIP_ATTR_TAGS = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'CODE', 'PRE']);
const SKIP_TEXT_TAGS = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEXTAREA', 'CODE', 'PRE']);
const ATTRS = ['title', 'alt', 'aria-label', 'placeholder'];

const origText = new WeakMap();
const origAttr = new WeakMap();
const origI18nHtml = new WeakMap();
const cache = new Map();
let dict = { exact: {}, phrases: [] };
let dictLoaded = false;
let observer = null;
let applying = false;
let lang = 'zh';
let origDescription = '';

export function currentLang() {
    return lang;
}

/** 界面键值翻译。 */
export function t(key) {
    const table = ui[lang] || ui.zh;
    return (table && table[key]) || (ui.zh && ui.zh[key]) || key;
}

function toEnglish(raw) {
    if (typeof raw !== 'string' || !CJK_RE.test(raw)) return raw;
    if (cache.has(raw)) return cache.get(raw);
    const trimmed = raw.replace(/\s+/g, ' ').trim();
    if (dict.exact[raw]) {
        cache.set(raw, dict.exact[raw]);
        return dict.exact[raw];
    }
    if (dict.exact[trimmed]) {
        const res = raw.replace(trimmed, dict.exact[trimmed]);
        cache.set(raw, res);
        return res;
    }
    let out = raw;
    for (const pair of dict.phrases) {
        if (!pair || !pair[0]) continue;
        if (out.indexOf(pair[0]) !== -1) {
            out = out.split(pair[0]).join(pair[1]);
            if (!CJK_RE.test(out)) break;
        }
    }
    if (!CJK_RE.test(out)) {
        out = out
            .replace(/【\s*/g, '[')
            .replace(/\s*】/g, ']')
            .replace(/[《》]/g, '"')
            .replace(/（/g, ' (')
            .replace(/）/g, ')')
            .replace(/：/g, ': ')
            .replace(/[、，]/g, ', ')
            .replace(/。/g, '. ')
            .replace(/\s{2,}/g, ' ')
            .trim();
    }
    if (cache.size < 6000) cache.set(raw, out);
    return out;
}

/** 内容原文翻译：中文模式原样返回。 */
export function tr(str) {
    return lang === 'en' ? toEnglish(str) : str;
}

function isLangToggle(el) {
    return !!(el && el.nodeType === 1 && (el.id === 'lang-toggle' || (el.closest && el.closest('#lang-toggle, [data-i18n-skip]'))));
}

function resolveContentText(spec, targetLang) {
    const [file, pathStr] = String(spec || '').split(':');
    if (!file || !pathStr || !staticSource.has(file)) return null;
    let cur = staticSource.get(file);
    for (const k of pathStr.split('.')) {
        if (cur == null || !(k in cur)) return null;
        cur = cur[k];
    }
    if (cur && typeof cur === 'object') {
        return cur[targetLang] || cur.zh || null;
    }
    return typeof cur === 'string' ? cur : null;
}

export function applyDom(targetLang = lang, rootNode) {
    if (typeof document === 'undefined' || applying) return;
    const root = rootNode || document.body;
    if (!root) return;
    applying = true;
    try {
        const contentNodes = rootNode
            ? [rootNode, ...rootNode.querySelectorAll('[data-content]')].filter((el) => el.hasAttribute && el.hasAttribute('data-content'))
            : document.querySelectorAll('[data-content]');
        contentNodes.forEach((el) => {
            const val = resolveContentText(el.getAttribute('data-content'), targetLang);
            if (typeof val === 'string') el.textContent = val;
        });

        const table = ui[targetLang] || {};
        const keyed = rootNode ? [rootNode, ...rootNode.querySelectorAll('[data-i18n]')] : document.querySelectorAll('[data-i18n]');
        keyed.forEach((el) => {
            if (!el || !el.getAttribute) return;
            const key = el.getAttribute('data-i18n');
            if (!key || !table[key]) return;
            if (el.children.length === 0) {
                el.textContent = table[key];
                return;
            }
            if (!origI18nHtml.has(el)) origI18nHtml.set(el, el.innerHTML);
            const icon = el.querySelector('i, svg');
            if (icon && targetLang === 'en') el.innerHTML = icon.outerHTML + ' ' + table[key];
            else if (targetLang === 'zh' && origI18nHtml.has(el)) el.innerHTML = origI18nHtml.get(el);
            else el.textContent = table[key];
        });

        const all = [root, ...root.querySelectorAll('*')];
        for (const el of all) {
            if (!el || el.nodeType !== 1 || SKIP_ATTR_TAGS.has(el.tagName) || isLangToggle(el)) continue;
            let saved = origAttr.get(el);
            for (const attr of ATTRS) {
                if (!el.hasAttribute(attr)) continue;
                const val = el.getAttribute(attr);
                if (targetLang === 'en') {
                    if (!CJK_RE.test(val)) continue;
                    if (!saved) {
                        saved = {};
                        origAttr.set(el, saved);
                    }
                    if (!(attr in saved)) saved[attr] = val;
                    const translated = toEnglish(val);
                    if (translated !== val) el.setAttribute(attr, translated);
                } else if (saved && attr in saved) {
                    el.setAttribute(attr, saved[attr]);
                }
            }
        }

        const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
        let node;
        while ((node = walker.nextNode())) {
            const parent = node.parentElement;
            if (!parent || SKIP_TEXT_TAGS.has(parent.tagName) || isLangToggle(parent)) continue;
            if (parent.hasAttribute('data-i18n')) continue;
            const text = node.nodeValue;
            if (!text || !text.trim()) continue;
            if (targetLang === 'en') {
                if (!CJK_RE.test(text)) continue;
                if (!origText.has(node)) origText.set(node, text);
                const translated = toEnglish(text);
                if (translated !== text) node.nodeValue = translated;
            } else if (origText.has(node)) {
                node.nodeValue = origText.get(node);
            }
        }
    } finally {
        if (observer) observer.takeRecords();
        applying = false;
    }
}

function ensureObserver() {
    if (observer || typeof MutationObserver === 'undefined' || !document.body) return;
    observer = new MutationObserver((mutations) => {
        if (lang !== 'en' || applying) return;
        const targets = new Set();
        for (const m of mutations) {
            if (m.type === 'childList') {
                m.addedNodes.forEach((n) => {
                    if (n.nodeType === 1 && !SKIP_ATTR_TAGS.has(n.tagName)) targets.add(n);
                    else if (n.nodeType === 3 && n.parentElement) targets.add(n.parentElement);
                });
            } else if (m.type === 'characterData' && m.target.parentElement) {
                targets.add(m.target.parentElement);
            } else if (m.type === 'attributes' && m.target.nodeType === 1) {
                targets.add(m.target);
            }
        }
        targets.forEach((el) => {
            if (el && el.isConnected) applyDom('en', el);
        });
    });
    observer.observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATTRS });
}

async function ensureDictionary() {
    if (dictLoaded) return true;
    try {
        const chunk = await lazy.load('i18n-en', { priority: 'high' });
        if (chunk && chunk.exact) {
            dict = { exact: chunk.exact, phrases: chunk.phrases || [] };
            dictLoaded = true;
            cache.clear();
        }
    } catch (err) {
        console.warn('[i18n] 英文词典加载失败，保持中文显示:', err && err.message);
    }
    return dictLoaded;
}

function syncChrome() {
    const de = document.documentElement;
    de.lang = lang === 'zh' ? 'zh-CN' : 'en';
    de.setAttribute('data-lang', lang);
    document.title = lang === 'zh' ? site.title.zh : site.title.en;
    const meta = document.querySelector('meta[name="description"]');
    if (meta) {
        if (!origDescription) origDescription = meta.getAttribute('content') || '';
        meta.setAttribute('content', lang === 'zh' ? origDescription : site.description.en || toEnglish(origDescription));
    }
    document.querySelectorAll('[data-lang-toggle-label]').forEach((el) => {
        el.textContent = lang === 'zh' ? '中 / EN' : 'EN / 中';
    });
    document.querySelectorAll('#lang-toggle, [data-lang-toggle]').forEach((btn) => {
        const label = lang === 'zh' ? '切换中英文语言' : 'Switch language (Chinese / English)';
        btn.setAttribute('aria-label', label);
        btn.setAttribute('title', label);
    });
}

export async function setLanguage(next) {
    const target = next === 'en' ? 'en' : 'zh';
    if (target === 'en' && !(await ensureDictionary())) {
        bus.emit('i18n:unavailable', { lang: 'en' });
        return lang;
    }
    lang = target;
    storage.setRaw(KEYS.lang, lang);
    store.set('preferredLang', lang);
    syncChrome();
    applying = true;
    try {
        store.set('lang', lang);
        bus.emit('lang:changed', { lang });
    } finally {
        if (observer) observer.takeRecords();
        applying = false;
    }
    applyDom(lang);
    ensureObserver();
    return lang;
}

export function toggleLanguage() {
    return setLanguage(lang === 'zh' ? 'en' : 'zh');
}

/** 启动时恢复上次的语言偏好。 */
export function restoreLanguage() {
    ensureObserver();
    if (store.get('preferredLang') === 'en') return setLanguage('en');
    return Promise.resolve(lang);
}

export const i18n = { t, tr, setLanguage, toggleLanguage, restoreLanguage, applyDom, currentLang, uiTable: ui };
export default i18n;
