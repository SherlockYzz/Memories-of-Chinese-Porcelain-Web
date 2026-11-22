/**
 * 华夏器道 · 微内核事件总线 (AppBus)
 * 提供轻量、异常隔离的发布/订阅通信机制，消除模块间直接耦合。
 */
(function (global) {
    'use strict';

    const listeners = new Map();

    function on(eventName, handler) {
        if (!eventName || typeof handler !== 'function') return function () {};
        let set = listeners.get(eventName);
        if (!set) {
            set = new Set();
            listeners.set(eventName, set);
        }
        set.add(handler);
        return function unsubscribe() {
            off(eventName, handler);
        };
    }

    function off(eventName, handler) {
        const set = listeners.get(eventName);
        if (!set) return;
        set.delete(handler);
        if (set.size === 0) listeners.delete(eventName);
    }

    function once(eventName, handler) {
        if (typeof handler !== 'function') return function () {};
        const wrapper = function (payload) {
            off(eventName, wrapper);
            handler(payload);
        };
        return on(eventName, wrapper);
    }

    function emit(eventName, payload) {
        const set = listeners.get(eventName);
        if (!set || set.size === 0) return;
        const snapshot = Array.from(set);
        for (let i = 0; i < snapshot.length; i++) {
            try {
                snapshot[i](payload);
            } catch (err) {
                console.warn('[AppBus]', eventName, 'listener error:', err);
            }
        }
    }

    global.AppBus = { on, off, once, emit };
})(window);
