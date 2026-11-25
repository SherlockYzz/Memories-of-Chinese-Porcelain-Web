/**
 * 华夏器道 · 统一模态框管理器 (ModalManager)
 * 职责：inert 背景锁定、焦点捕获与归还、Overlay 关闭栈、以及通过 AppBus 通知背景层暂停/恢复。
 */
(function (global) {
    'use strict';

    const closeHandlers = [];

    function getBackgroundLandmarks() {
        return [
            document.getElementById('navbar'),
            document.getElementById('main-content'),
            document.querySelector('footer'),
            document.getElementById('back-to-top')
        ].filter(Boolean);
    }

    function hasActive() {
        if (document.querySelector('.modal-backdrop.active')) return true;
        const mobileMenu = document.getElementById('mobile-menu');
        return !!(mobileMenu && mobileMenu.classList.contains('active'));
    }

    function resolveModal(modalOrId) {
        if (!modalOrId) return null;
        return typeof modalOrId === 'string' ? document.getElementById(modalOrId) : modalOrId;
    }

    function open(modalOrId, focusTarget) {
        const modal = resolveModal(modalOrId);
        if (!modal) return;
        modal.classList.add('active');

        if (!modal._prevFocus || !document.contains(modal._prevFocus)) {
            modal._prevFocus = document.activeElement;
        }
        if ('inert' in HTMLElement.prototype) {
            getBackgroundLandmarks().forEach((el) => {
                if (!el.contains(modal)) el.inert = true;
            });
        }
        if (global.AppBus) {
            global.AppBus.emit('modal:opened', { id: modal.id || '' });
        }
        if (typeof global.setOrientalAmbientPaused === 'function') {
            global.setOrientalAmbientPaused(true);
        }

        setTimeout(() => {
            if (!modal.classList.contains('active')) return;
            let targetEl = null;
            if (typeof focusTarget === 'string') targetEl = modal.querySelector(focusTarget);
            else if (focusTarget && typeof focusTarget.focus === 'function') targetEl = focusTarget;
            if (!targetEl) {
                targetEl = modal.querySelector('input:not([disabled]), textarea:not([disabled]), select:not([disabled]), button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])');
            }
            if (!targetEl) {
                const box = modal.querySelector('.modal-content-lg') || modal;
                if (!box.hasAttribute('tabindex')) box.setAttribute('tabindex', '-1');
                targetEl = box;
            }
            if (targetEl && typeof targetEl.focus === 'function') {
                targetEl.focus({ preventScroll: true });
            }
        }, 60);
    }

    function close(modalOrId) {
        const modal = resolveModal(modalOrId);
        if (modal) modal.classList.remove('active');

        if (!hasActive()) {
            if ('inert' in HTMLElement.prototype) {
                getBackgroundLandmarks().forEach((el) => { el.inert = false; });
            }
            if (global.AppBus) {
                global.AppBus.emit('modal:closed', { id: modal ? modal.id : '' });
            }
            if (typeof global.setOrientalAmbientPaused === 'function') {
                global.setOrientalAmbientPaused(false);
            }
        }

        if (modal && modal._prevFocus && document.contains(modal._prevFocus) && typeof modal._prevFocus.focus === 'function') {
            try {
                modal._prevFocus.focus({ preventScroll: true });
            } catch (e) {}
            modal._prevFocus = null;
        }
    }

    function registerOverlayCloser(id, fn) {
        if (!id || typeof fn !== 'function') return;
        const idx = closeHandlers.findIndex(x => x.id === id);
        if (idx >= 0) closeHandlers[idx].fn = fn;
        else closeHandlers.unshift({ id, fn });
    }

    function dismissTop() {
        // 先检查显式注册顺序，再兜底静态默认层叠序
        for (let i = 0; i < closeHandlers.length; i++) {
            const el = document.getElementById(closeHandlers[i].id);
            if (el && el.classList.contains('active')) {
                closeHandlers[i].fn();
                return true;
            }
        }
        const fallbackOrder = [
            'collector-card-modal',
            'scale-ruler-modal',
            'command-palette-modal',
            'shortcuts-help-modal',
            'study-notebook-modal',
            'microscope-modal',
            'camera-modal',
            'universal-modal',
            'mobile-menu'
        ];
        for (let i = 0; i < fallbackOrder.length; i++) {
            const el = document.getElementById(fallbackOrder[i]);
            if (el && el.classList.contains('active')) {
                if (fallbackOrder[i] === 'camera-modal' && typeof global.stopCameraScan === 'function') global.stopCameraScan();
                else if (fallbackOrder[i] === 'microscope-modal' && typeof global.closeMicroscopeView === 'function') global.closeMicroscopeView();
                else if (fallbackOrder[i] === 'mobile-menu' && typeof global.closeMobileMenu === 'function') global.closeMobileMenu();
                else close(el);
                return true;
            }
        }
        return false;
    }

    global.ModalManager = {
        open,
        close,
        hasActive,
        registerOverlayCloser,
        dismissTop
    };

    // 兼容桥接
    global.manageModalOpen = function (modal, focusTarget) { open(modal, focusTarget); };
    global.manageModalClose = function (modal) { close(modal); };
    global.hasAnyActiveOverlay = hasActive;
})(window);
