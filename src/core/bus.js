/**
 * 事件总线：模块之间唯一的“广播”通道（发布 / 订阅，异常隔离）。
 * 约定事件名用 `域:动作`，如 `theme:changed`、`vessel:selected`。完整清单见 docs/ARCHITECTURE.md。
 */
const listeners = new Map();

export function on(eventName, handler) {
    if (!eventName || typeof handler !== 'function') return () => {};
    let set = listeners.get(eventName);
    if (!set) {
        set = new Set();
        listeners.set(eventName, set);
    }
    set.add(handler);
    return () => off(eventName, handler);
}

export function off(eventName, handler) {
    const set = listeners.get(eventName);
    if (!set) return;
    set.delete(handler);
    if (set.size === 0) listeners.delete(eventName);
}

export function once(eventName, handler) {
    if (typeof handler !== 'function') return () => {};
    const wrapper = (payload) => {
        off(eventName, wrapper);
        handler(payload);
    };
    return on(eventName, wrapper);
}

export function emit(eventName, payload) {
    const set = listeners.get(eventName);
    if (!set || set.size === 0) return;
    for (const fn of Array.from(set)) {
        try {
            fn(payload);
        } catch (err) {
            console.warn('[bus]', eventName, 'listener error:', err);
        }
    }
}

/** 仅供测试 / 诊断：当前各事件的监听数量。 */
export function stats() {
    const out = {};
    listeners.forEach((set, name) => {
        out[name] = set.size;
    });
    return out;
}

export const bus = { on, off, once, emit, stats };
export default bus;
