/**
 * 模块注册中心与生命周期。
 *
 * 模块契约（ESM 模块用 defineModule，legacy IIFE 模块经 window.AppRegistry.register 进入同一套机制）：
 *
 *   defineModule({
 *     id: 'kiln-map',            // 唯一 id
 *     phase: 2,                  // 1 首屏 / 2 次屏 / 3 空闲期
 *     init(ctx) {},              // 启动；可返回清理函数
 *     destroy() {},              // 可选：额外清理
 *     actions: { name(ctx, ...args) {} },   // 对应模板里的 data-action
 *     onLangChange(lang) {}, onThemeChange(theme) {},
 *     getSearchItems(lang) {},   // 供 Ctrl+K 检索聚合
 *     api: {}                    // 给其他模块的窄接口（通过 registry.api(id) 取）
 *   })
 *
 * ctx 提供会被自动回收的资源登记：ctx.listen / ctx.raf / ctx.timeout / ctx.interval / ctx.onDispose。
 * registry.destroy(id) 后，模块不应残留事件监听、动画帧、定时器或 WebGL 资源。
 */
import bus from './bus.js';
import store from './store.js';
import { registerActions, unregisterActions } from './actions.js';

const modules = new Map();
const order = [];
const services = {};

/** 由 core/index.js 注入共享服务（data、i18n 等），避免循环依赖。 */
export function provide(name, service) {
    services[name] = service;
}

function createContext(entry) {
    const disposers = [];
    const ctx = {
        id: entry.id,
        bus,
        store,
        registry,
        ...services,
        onDispose(fn) {
            if (typeof fn === 'function') disposers.push(fn);
            return fn;
        },
        listen(target, type, handler, options) {
            if (!target || !target.addEventListener) return () => {};
            target.addEventListener(type, handler, options);
            const off = () => target.removeEventListener(type, handler, options);
            disposers.push(off);
            return off;
        },
        subscribe(eventName, handler) {
            const off = bus.on(eventName, handler);
            disposers.push(off);
            return off;
        },
        watch(key, handler) {
            const off = store.subscribe(key, handler);
            disposers.push(off);
            return off;
        },
        timeout(fn, ms) {
            const id = setTimeout(fn, ms);
            disposers.push(() => clearTimeout(id));
            return id;
        },
        interval(fn, ms) {
            const id = setInterval(fn, ms);
            disposers.push(() => clearInterval(id));
            return id;
        },
        /** 受管理的动画循环：返回 stop()；模块销毁时自动停止。 */
        raf(fn) {
            let id = 0;
            let alive = true;
            const tick = (t) => {
                if (!alive) return;
                id = requestAnimationFrame(tick);
                fn(t);
            };
            id = requestAnimationFrame(tick);
            const stop = () => {
                alive = false;
                cancelAnimationFrame(id);
            };
            disposers.push(stop);
            return stop;
        }
    };
    entry.disposers = disposers;
    return ctx;
}

export function register(def) {
    if (!def || !def.id) {
        console.warn('[registry] 忽略无效模块定义:', def);
        return null;
    }
    if (modules.has(def.id)) return modules.get(def.id);
    const entry = {
        id: def.id,
        phase: def.phase || 3,
        def,
        booted: false,
        disposers: [],
        api: def.api || def.publicApi || {}
    };
    modules.set(entry.id, entry);
    order.push(entry);
    if (def.actions) registerActions(def.actions, entry.id);
    // 过渡期兼容：legacy 模块声明的 globalBindings 仍会挂到 window，并自动登记为同名动作。
    if (def.globalBindings && typeof def.globalBindings === 'object') {
        const compat = {};
        for (const name of Object.keys(def.globalBindings)) {
            window[name] = def.globalBindings[name];
            compat[name] = (_ctx, ...args) => def.globalBindings[name](...args);
        }
        registerActions(compat, entry.id, { legacy: true });
    }
    return entry;
}

/** ESM 模块的声明入口：登记并返回定义本身，便于 `export default defineModule({...})`。 */
export function defineModule(def) {
    register(def);
    return def;
}

function boot(entry) {
    if (entry.booted) return;
    entry.booted = true;
    if (typeof entry.def.init !== 'function') return;
    try {
        const cleanup = entry.def.init(createContext(entry));
        if (typeof cleanup === 'function') entry.disposers.push(cleanup);
    } catch (err) {
        console.warn(`[registry] 模块 ${entry.id} (phase ${entry.phase}) 初始化异常:`, err);
    }
}

export function bootPhase(phase) {
    for (const entry of order.slice()) {
        if (entry.phase === phase) boot(entry);
    }
}

/** 单独启动某个模块（懒加载模块注册后调用）。 */
export function bootModule(id) {
    const entry = modules.get(id);
    if (entry) boot(entry);
    return !!entry;
}

export function destroy(id) {
    const entry = modules.get(id);
    if (!entry || !entry.booted) return false;
    try {
        if (typeof entry.def.destroy === 'function') entry.def.destroy();
    } catch (err) {
        console.warn(`[registry] 模块 ${id} destroy 异常:`, err);
    }
    for (const fn of entry.disposers.splice(0).reverse()) {
        try {
            fn();
        } catch (err) {
            console.warn(`[registry] 模块 ${id} 清理异常:`, err);
        }
    }
    entry.booted = false;
    return true;
}

export function unregister(id) {
    destroy(id);
    const entry = modules.get(id);
    if (!entry) return;
    unregisterActions(id);
    modules.delete(id);
    const i = order.indexOf(entry);
    if (i > -1) order.splice(i, 1);
}

export function api(id) {
    const entry = modules.get(id);
    return entry ? entry.api : null;
}

export function list() {
    return order.map((e) => ({ id: e.id, phase: e.phase, booted: e.booted }));
}

export function collectSearchItems(lang) {
    const items = [];
    for (const entry of order) {
        if (typeof entry.def.getSearchItems !== 'function') continue;
        try {
            const res = entry.def.getSearchItems(lang || store.get('lang'));
            if (Array.isArray(res)) items.push(...res);
        } catch (err) {
            console.warn(`[registry] 收集检索项失败 (${entry.id}):`, err);
        }
    }
    return items;
}

function fanOut(hook, value) {
    for (const entry of order) {
        const fn = entry.def[hook];
        if (typeof fn !== 'function' || !entry.booted) continue;
        try {
            fn(value);
        } catch (err) {
            console.warn(`[registry] ${hook}(${entry.id}):`, err);
        }
    }
}

bus.on('lang:changed', (p) => fanOut('onLangChange', (p && p.lang) || store.get('lang')));
bus.on('theme:changed', (p) => fanOut('onThemeChange', (p && p.theme) || store.get('theme')));

export const registry = { register, defineModule, bootPhase, bootModule, destroy, unregister, api, get: api, list, collectSearchItems, provide };
export default registry;
