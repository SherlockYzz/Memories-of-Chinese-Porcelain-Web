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
    const galleryEl = document.getElementById('3d-gallery');
    if (galleryEl && 'IntersectionObserver' in window) {
        const io = new IntersectionObserver(
            (entries) => {
                if (entries.some((e) => e.isIntersecting)) {
                    io.disconnect();
                    ensureThreeJS();
                }
            },
            { rootMargin: '700px 0px' }
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

    // 非省流模式下，在 load 完成且首屏稳定后尽快预热三维展馆（桌面 200ms，移动 700ms）
    const saveData = !!(navigator.connection && navigator.connection.saveData);
    if (!saveData) {
        const delayMs = window.innerWidth >= 768 ? 200 : 700;
        const idleWarm = () => {
            if (typeof requestIdleCallback === 'function') {
                requestIdleCallback(() => ensureThreeJS(), { timeout: delayMs + 400 });
            } else {
                setTimeout(ensureThreeJS, delayMs);
            }
        };
        if (document.readyState === 'complete') setTimeout(idleWarm, delayMs);
        else window.addEventListener('load', () => setTimeout(idleWarm, delayMs), { once: true });
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
