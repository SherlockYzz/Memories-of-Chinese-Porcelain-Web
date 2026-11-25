/**
 * 动作委托：取代模板里的内联事件（onclick="foo()"）。
 *
 * 模板写法（声明式，不能执行任意 JS，只能调用已登记的动作，参数只能是字面量）：
 *
 *   <button data-action="loadPorcelainModel(7)">                    点击
 *   <a href="#3d-gallery" data-action="switchExhibitionMode('hall')" data-action-delay="250">
 *   <input data-action-input="setCutawayOffset($value)">             input 事件
 *   <select data-action-change="setCompareRightModel($value)">       change 事件
 *   <div data-action-self="closeUniversalModal()">                   仅当点击目标是元素自身（遮罩层）
 *   <button data-action="closeUniversalModal(); loadComparisonModelTo3D('ru')">  顺序执行多个
 *
 * 特殊参数：$value（元素 value）、$number（数值化的 value）、$checked、$el（元素自身）、$event、$data.xxx（dataset 字段）。
 *
 * 模块通过 defineModule({ actions: { name(ctx, ...args) {} } }) 登记动作；
 * ctx = { el, event, value }。动作名全站唯一，重复登记会告警。
 */
const handlers = new Map(); // name -> { fn, owner, legacy }
const parseCache = new Map();
const missing = new Set();
let fallbackResolver = null;

export function registerActions(map, owner = 'anonymous', opts = {}) {
    for (const name of Object.keys(map || {})) {
        const fn = map[name];
        if (typeof fn !== 'function') continue;
        const existing = handlers.get(name);
        if (existing && existing.owner !== owner && !existing.legacy) {
            console.warn(`[actions] 动作 "${name}" 已由模块 ${existing.owner} 登记，${owner} 的重复登记被忽略`);
            continue;
        }
        handlers.set(name, { fn, owner, legacy: !!opts.legacy });
    }
}

export function unregisterActions(owner) {
    handlers.forEach((h, name) => {
        if (h.owner === owner) handlers.delete(name);
    });
}

/** 过渡期：未登记的动作名交给 legacy 桥解析（window 上的旧全局函数）。 */
export function setFallbackResolver(fn) {
    fallbackResolver = fn;
}

export function hasAction(name) {
    return handlers.has(name) || !!(fallbackResolver && fallbackResolver(name));
}

export function listActions() {
    return Array.from(handlers.entries()).map(([name, h]) => ({ name, owner: h.owner, legacy: h.legacy }));
}

export function missingActions() {
    return Array.from(missing);
}

/* ---------- 解析 `name(arg, ...); name2(...)` ---------- */

function splitTopLevel(src, sep) {
    const out = [];
    let depth = 0;
    let quote = '';
    let cur = '';
    for (let i = 0; i < src.length; i++) {
        const ch = src[i];
        if (quote) {
            cur += ch;
            if (ch === '\\') {
                cur += src[++i] || '';
            } else if (ch === quote) quote = '';
            continue;
        }
        if (ch === '"' || ch === "'") {
            quote = ch;
            cur += ch;
        } else if (ch === '(' || ch === '[' || ch === '{') {
            depth++;
            cur += ch;
        } else if (ch === ')' || ch === ']' || ch === '}') {
            depth--;
            cur += ch;
        } else if (ch === sep && depth === 0) {
            out.push(cur);
            cur = '';
        } else cur += ch;
    }
    if (cur.trim()) out.push(cur);
    return out;
}

function parseArg(raw) {
    const s = raw.trim();
    if (s === '') return { kind: 'literal', value: undefined };
    if (s[0] === '$') return { kind: 'special', name: s.slice(1) };
    if (s === 'true') return { kind: 'literal', value: true };
    if (s === 'false') return { kind: 'literal', value: false };
    if (s === 'null') return { kind: 'literal', value: null };
    if (/^-?\d+(\.\d+)?$/.test(s)) return { kind: 'literal', value: Number(s) };
    if ((s[0] === "'" && s[s.length - 1] === "'") || (s[0] === '"' && s[s.length - 1] === '"')) {
        const body = s.slice(1, -1).replace(/\\(['"\\])/g, '$1');
        return { kind: 'literal', value: body };
    }
    if (s[0] === '[' || s[0] === '{') {
        try {
            return { kind: 'literal', value: JSON.parse(s) };
        } catch {
            /* fallthrough */
        }
    }
    console.warn('[actions] 无法解析的参数（只允许字面量与 $ 变量）:', raw);
    return { kind: 'literal', value: undefined };
}

export function parseActionExpr(expr) {
    if (parseCache.has(expr)) return parseCache.get(expr);
    const calls = [];
    for (const part of splitTopLevel(expr, ';')) {
        const m = /^\s*([A-Za-z_$][\w$.:-]*)\s*(?:\(([\s\S]*)\))?\s*$/.exec(part);
        if (!m) {
            console.warn('[actions] 无法解析的动作表达式:', part);
            continue;
        }
        const args = m[2] != null && m[2].trim() !== '' ? splitTopLevel(m[2], ',').map(parseArg) : [];
        calls.push({ name: m[1], args });
    }
    parseCache.set(expr, calls);
    return calls;
}

function resolveArg(arg, ctx) {
    if (arg.kind === 'literal') return arg.value;
    const el = ctx.el;
    switch (arg.name) {
        case 'value':
            return el && 'value' in el ? el.value : undefined;
        case 'number':
            return el && 'value' in el ? Number(el.value) : undefined;
        case 'checked':
            return !!(el && el.checked);
        case 'el':
            return el;
        case 'event':
            return ctx.event;
        default:
            if (arg.name.startsWith('data.')) return el && el.dataset ? el.dataset[arg.name.slice(5)] : undefined;
            return undefined;
    }
}

/** 以编程方式触发动作（模块之间需要“请求对方做事”时用它，而不是直接调对方函数）。 */
export function run(name, ...args) {
    return invoke(name, { el: null, event: null }, args);
}

function invoke(name, ctx, args) {
    let h = handlers.get(name);
    if (!h && fallbackResolver) {
        const fn = fallbackResolver(name);
        if (fn) h = { fn: (_c, ...a) => fn(...a), owner: 'legacy-global', legacy: true };
    }
    if (!h) {
        if (!missing.has(name)) {
            missing.add(name);
            console.error(`[actions] 未登记的动作: ${name}`);
        }
        return undefined;
    }
    try {
        return h.fn(ctx, ...args);
    } catch (err) {
        console.error(`[actions] 动作 ${name} 执行异常:`, err);
        return undefined;
    }
}

function execute(expr, ctx) {
    for (const call of parseActionExpr(expr)) {
        invoke(
            call.name,
            ctx,
            call.args.map((a) => resolveArg(a, ctx))
        );
    }
}

function dispatch(attr, event, { selfOnly = false } = {}) {
    const target = event.target;
    if (!target || !target.closest) return;
    let el = target.closest(`[${attr}]`);
    while (el) {
        if (!selfOnly || event.target === el) {
            if (el.disabled || el.getAttribute('aria-disabled') === 'true') return;
            const expr = el.getAttribute(attr);
            const delay = parseInt(el.getAttribute('data-action-delay') || '0', 10);
            const ctx = { el, event, value: 'value' in el ? el.value : undefined };
            if (delay > 0) setTimeout(() => execute(expr, ctx), delay);
            else execute(expr, ctx);
            if (el.hasAttribute('data-action-stop')) event.stopPropagation();
            if (el.hasAttribute('data-action-prevent')) event.preventDefault();
        }
        // 允许嵌套：外层带 data-action 的容器也会收到（与原生冒泡一致），除非内层声明 data-action-stop。
        if (el.hasAttribute('data-action-stop') || selfOnly) break;
        el = el.parentElement ? el.parentElement.closest(`[${attr}]`) : null;
    }
}

let installed = false;

/** 在 document 上安装一次委托监听。 */
export function installActionDelegation(root = document) {
    if (installed) return;
    installed = true;
    root.addEventListener('click', (e) => {
        dispatch('data-action', e);
        dispatch('data-action-self', e, { selfOnly: true });
    });
    root.addEventListener('input', (e) => dispatch('data-action-input', e));
    root.addEventListener('change', (e) => dispatch('data-action-change', e));
    // 非按钮元素（div/span 卡片）声明了 data-action 时，补上键盘可达性：Enter / 空格触发。
    root.addEventListener('keydown', (e) => {
        if (e.key !== 'Enter' && e.key !== ' ') return;
        const el = e.target;
        if (!el || !el.hasAttribute || !el.hasAttribute('data-action')) return;
        if (/^(BUTTON|A|INPUT|SELECT|TEXTAREA|SUMMARY)$/.test(el.tagName)) return;
        e.preventDefault();
        el.click();
    });
}

export const actions = { register: registerActions, unregister: unregisterActions, run, has: hasAction, list: listActions, missing: missingActions };
export default actions;
