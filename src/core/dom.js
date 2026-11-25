/**
 * DOM / 模板辅助。
 *
 * html`...` 是带转义的模板标签：
 *   - 插值默认做 HTML 转义，避免内容里的 < > & 破坏结构；
 *   - null / undefined 输出为空串（并在开发构建下告警），页面上不会再出现 "undefined"；
 *   - 需要插入可信 HTML 片段时用 raw(...)；数组会被拼接。
 */
const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

export function esc(value) {
    if (value == null) return '';
    return String(value).replace(/[&<>"']/g, (ch) => ESC[ch]);
}

export function raw(value) {
    return { __raw: value == null ? '' : String(value) };
}

function render(value) {
    if (value == null || value === false) return '';
    if (Array.isArray(value)) return value.map(render).join('');
    if (typeof value === 'object' && '__raw' in value) return value.__raw;
    return esc(value);
}

export function html(strings, ...values) {
    let out = strings[0];
    for (let i = 0; i < values.length; i++) {
        if (values[i] === undefined && typeof __DEV__ !== 'undefined' && __DEV__) {
            console.warn('[html] 模板插值为 undefined，已输出空串。片段：', strings[i].slice(-60));
        }
        out += render(values[i]) + strings[i + 1];
    }
    return raw(out);
}

/** 把 html`...` 的结果或字符串写入元素。 */
export function setHTML(el, content) {
    if (!el) return;
    el.innerHTML = content && typeof content === 'object' && '__raw' in content ? content.__raw : String(content == null ? '' : content);
}

/** 有值才渲染：when(v, (v) => html`...`)。 */
export function when(value, fn) {
    if (value == null || value === '' || value === false) return '';
    return fn(value);
}

export function $(selector, root = document) {
    return root.querySelector(selector);
}

export function $$(selector, root = document) {
    return Array.from(root.querySelectorAll(selector));
}

export const prefersReducedMotion = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
