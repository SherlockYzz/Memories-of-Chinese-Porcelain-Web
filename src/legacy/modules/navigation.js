/**
 * 模块：全局导航与移动端抽屉菜单 (navigation)
 */
(function (global) {
    'use strict';

    let closeMenuFn = null;

    function setupNavAndScroll() {
        const navbar = document.getElementById('navbar');
        const backToTop = document.getElementById('back-to-top');
        let ticking = false;

        global.addEventListener('scroll', () => {
            if (!ticking) {
                global.requestAnimationFrame(() => {
                    const scrollY = global.scrollY;
                    if (navbar) navbar.classList.toggle('scrolled', scrollY > 50);
                    if (backToTop) backToTop.classList.toggle('visible', scrollY > 400);
                    ticking = false;
                });
                ticking = true;
            }
        }, { passive: true });
    }

    function setupMobileMenu() {
        const hamburger = document.getElementById('hamburger');
        const mobileMenu = document.getElementById('mobile-menu');
        const mobileClose = document.getElementById('mobile-close');
        const overlay = document.getElementById('mobile-menu-overlay');

        const openMenu = () => {
            if (mobileMenu) {
                mobileMenu.classList.add('active');
                if (global.ModalManager) global.ModalManager.open(mobileMenu, '#mobile-close');
            }
            if (overlay) overlay.classList.add('active');
            if (hamburger) hamburger.setAttribute('aria-expanded', 'true');
        };
        const closeMenu = () => {
            if (mobileMenu) {
                mobileMenu.classList.remove('active');
                if (global.ModalManager) global.ModalManager.close(mobileMenu);
            }
            if (overlay) overlay.classList.remove('active');
            if (hamburger) hamburger.setAttribute('aria-expanded', 'false');
        };

        closeMenuFn = closeMenu;
        global.closeMobileMenu = closeMenu;
        if (global.ModalManager) {
            global.ModalManager.registerOverlayCloser('mobile-menu', closeMenu);
        }

        if (hamburger) hamburger.addEventListener('click', openMenu);
        if (mobileClose) mobileClose.addEventListener('click', closeMenu);
        if (overlay) overlay.addEventListener('click', closeMenu);
        document.querySelectorAll('#mobile-menu a').forEach(a => a.addEventListener('click', closeMenu));
    }

    function syncBgMotionBtn(enabled) {
        const btn = document.getElementById('bg-motion-toggle');
        const icon = document.getElementById('bg-motion-icon');
        if (!btn) return;
        btn.setAttribute('aria-pressed', enabled ? 'true' : 'false');
        btn.classList.toggle('opacity-60', !enabled);
        if (icon) {
            icon.className = enabled
                ? 'fa-solid fa-wand-magic-sparkles text-tianqing-deep text-xs'
                : 'fa-solid fa-pause text-text-muted text-xs';
        }
    }

    function toggleWebGLBackgroundMotion() {
        const bgMod = global.AppRegistry && global.AppRegistry.get('webgl-bg');
        const cur = bgMod && typeof bgMod.isEnabled === 'function'
            ? bgMod.isEnabled()
            : (global.AppStore ? !!global.AppStore.get('bgEnabled') : true);
        const next = !cur;
        if (bgMod && typeof bgMod.setEnabled === 'function') {
            bgMod.setEnabled(next);
        } else if (global.AppStore) {
            global.AppStore.set('bgEnabled', next);
        }
        syncBgMotionBtn(next);
        if (global.ToastService) {
            global.ToastService.show(next ? '✨ 已开启 3D WebGL 动态东方意境背景' : '⏸️ 已暂停 3D 动态背景以节省电量');
        }
    }

    global.AppRegistry.register({
        id: 'navigation',
        phase: 1,
        init: function ({ store }) {
            setupNavAndScroll();
            setupMobileMenu();
            syncBgMotionBtn(store ? store.get('bgEnabled') !== false : true);
        },
        publicApi: {
            closeMobileMenu: function () { if (closeMenuFn) closeMenuFn(); },
            toggleWebGLBackgroundMotion
        },
        globalBindings: {
            toggleWebGLBackgroundMotion
        }
    });
})(window);
