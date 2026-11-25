/**
 * 应用入口：装配内核、登记模块、分片启动并按需预热次屏三维展馆。
 * 这里不写业务逻辑——新增功能请在 src/modules/ 下建模块，然后在 modules/index.js import 一行。
 */
import * as core from '@core';
import './modules/index.js';

const { registry, actions, i18n, legacy } = core;

// 供按需分块（global-shim）与旧脚本（legacy-bridge）复用同一份内核实例。
window.__TQ__ = { core, diagnostics: core.diagnostics, version: core.data.get('site').version };

core.installLegacyBridge();
core.installActionDelegation();

// 优先使用 scheduler.yield() 让出主线程（排在队列前部以保障 INP），不支持时回退 setTimeout。
function yieldToMain() {
    if (typeof window.scheduler !== 'undefined' && typeof window.scheduler.yield === 'function') {
        return window.scheduler.yield();
    }
    return new Promise((resolve) => setTimeout(resolve, 0));
}

let threeBooted = false;
function ensureThreeJS() {
    if (threeBooted) return;
    threeBooted = true;
    try {
        legacy.call('initThreeJS');
    } catch (err) {
        console.warn('[boot] 三维展馆初始化异常:', err);
    }
}

function scheduleGalleryBoot() {
    let heroReady = false;
    let pendingIntersect = false;

    const triggerIntersect = () => {
        if (threeBooted) return;
        ensureThreeJS();
    };

    core.bus.once('hero:ready', () => {
        heroReady = true;
        if (pendingIntersect) {
            pendingIntersect = false;
            setTimeout(triggerIntersect, 450);
        }
    });

    const galleryEl = document.getElementById('3d-gallery');
    if (galleryEl && 'IntersectionObserver' in window) {
        const io = new IntersectionObserver(
            (entries) => {
                if (entries.some((e) => e.isIntersecting)) {
                    if (heroReady || (window.scrollY || window.pageYOffset || 0) > 80) {
                        io.disconnect();
                        triggerIntersect();
                    } else {
                        pendingIntersect = true;
                    }
                }
            },
            { rootMargin: '0px 0px' }
        );
        io.observe(galleryEl);
    }

    // 任意直接跳往展馆或触发器物载入的操作，立即激活三维展馆
    document.addEventListener(
        'click',
        (ev) => {
            if (threeBooted) return;
            const hit = ev.target && ev.target.closest(
                '[href="#3d-gallery"], [data-action*="loadPorcelainModel"], [data-action*="loadComparisonModelTo3D"], [data-action*="startGuidedTour"], [data-action*="openMicroscopeView"]'
            );
            if (hit) ensureThreeJS();
        },
        { capture: true, passive: true }
    );

    // 桌面端等待首屏 3D 器物完成首次渲染（hero:ready）后再温和预热次屏展馆，避免三路 WebGL 着色器撞车
    const saveData = !!(navigator.connection && navigator.connection.saveData);
    if (!saveData && window.innerWidth >= 768) {
        const idleWarm = () => {
            if (threeBooted) return;
            if (typeof requestIdleCallback === 'function') {
                requestIdleCallback(() => ensureThreeJS(), { timeout: 1200 });
            } else {
                setTimeout(ensureThreeJS, 200);
            }
        };
        let fallbackTimer = setTimeout(idleWarm, 12000);
        core.bus.once('hero:ready', () => {
            clearTimeout(fallbackTimer);
            setTimeout(idleWarm, 1200);
        });
    }
}

// 内核级动作：不属于任何业务模块的通用行为。
actions.register(
    {
        toggleLanguage: () => i18n.toggleLanguage(),
        scrollToTop: () => window.scrollTo({ top: 0, behavior: core.prefersReducedMotion() ? 'auto' : 'smooth' }),
        dismissOverlay: () => core.modal.dismissTop(),
        triggerClick: (_ctx, selector) => {
            const el = document.querySelector(selector);
            if (el) el.click();
        },
        reloadPage: () => window.location.reload()
    },
    'core'
);

async function boot() {
    // 阶段一：首屏核心（导航、主题、背景与首屏展台容器）
    registry.bootPhase(1);
    core.installLegacyLazyChunks();
    scheduleGalleryBoot();

    await yieldToMain();

    // 阶段二：次屏内容分片挂载
    registry.bootPhase(2);

    await yieldToMain();

    // 阶段三：其余次屏模块 + 恢复语言偏好（排在空闲片段后不抢首绘）
    setTimeout(() => {
        registry.bootPhase(3);
        i18n.restoreLanguage();
        core.bus.emit('app:ready', {});
    }, 60);
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
else boot();
