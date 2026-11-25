/**
 * 统一浮层管理：背景 inert 锁定、焦点捕获与归还、Esc 逐层关闭。
 * 所有弹窗 / 抽屉都通过它打开关闭，并用 registerCloser 登记“如何关掉自己”，
 * 这样 Esc 与遮罩点击不需要知道具体模块。
 */
import bus from './bus.js';

const closers = []; // { id, fn }，后登记的优先
const prevFocus = new WeakMap();

function landmarks() {
    return [document.getElementById('navbar'), document.getElementById('main-content'), document.querySelector('footer'), document.getElementById('back-to-top')].filter(Boolean);
}

function resolve(modalOrId) {
    if (!modalOrId) return null;
    return typeof modalOrId === 'string' ? document.getElementById(modalOrId) : modalOrId;
}

export function hasActive() {
    return !!document.querySelector('.modal-backdrop.active, [data-overlay].active');
}

export function open(modalOrId, focusTarget) {
    const modal = resolve(modalOrId);
    if (!modal) return;
    modal.classList.add('active');
    const remembered = prevFocus.get(modal);
    if (!remembered || !document.contains(remembered)) prevFocus.set(modal, document.activeElement);
    if ('inert' in HTMLElement.prototype) {
        landmarks().forEach((el) => {
            if (!el.contains(modal)) el.inert = true;
        });
    }
    bus.emit('modal:opened', { id: modal.id || '' });
    setTimeout(() => {
        if (!modal.classList.contains('active')) return;
        let target = null;
        if (typeof focusTarget === 'string') target = modal.querySelector(focusTarget);
        else if (focusTarget && typeof focusTarget.focus === 'function') target = focusTarget;
        if (!target) {
            target = modal.querySelector('input:not([disabled]), textarea:not([disabled]), select:not([disabled]), button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])');
        }
        if (!target) {
            const box = modal.querySelector('.modal-content-lg') || modal;
            if (!box.hasAttribute('tabindex')) box.setAttribute('tabindex', '-1');
            target = box;
        }
        if (target && typeof target.focus === 'function') target.focus({ preventScroll: true });
    }, 60);
}

export function close(modalOrId) {
    const modal = resolve(modalOrId);
    if (modal) modal.classList.remove('active');
    if (!hasActive()) {
        if ('inert' in HTMLElement.prototype) landmarks().forEach((el) => (el.inert = false));
        bus.emit('modal:closed', { id: modal ? modal.id : '' });
    }
    const back = modal && prevFocus.get(modal);
    if (back && document.contains(back) && typeof back.focus === 'function') {
        try {
            back.focus({ preventScroll: true });
        } catch {}
        prevFocus.delete(modal);
    }
}

/** 登记某个浮层的关闭方式（模块自己知道关闭时要做哪些收尾）。 */
export function registerCloser(id, fn) {
    if (!id || typeof fn !== 'function') return;
    const i = closers.findIndex((x) => x.id === id);
    if (i >= 0) closers[i].fn = fn;
    else closers.unshift({ id, fn });
}

/** 关闭最上层的浮层；返回是否关掉了什么。Esc 键与“返回”手势都走这里。 */
export function dismissTop() {
    for (const c of closers) {
        const el = document.getElementById(c.id);
        if (el && el.classList.contains('active')) {
            c.fn();
            return true;
        }
    }
    // 兜底：没有登记关闭方式的通用弹窗，按 DOM 逆序关闭。
    const open = Array.from(document.querySelectorAll('.modal-backdrop.active, [data-overlay].active'));
    if (open.length) {
        close(open[open.length - 1]);
        return true;
    }
    return false;
}

export const modal = { open, close, hasActive, registerCloser, registerOverlayCloser: registerCloser, dismissTop };
export default modal;
