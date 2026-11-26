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

let legacyPromise = null;
let legacyReady = false;
function ensureLegacy(priority = 'low') {
    if (!legacyPromise) {
        legacyPromise = core.lazy.load('legacy', { priority }).then(() => {
            legacyReady = true;
            registry.bootPhase(1);
            registry.bootPhase(2);
            registry.bootPhase(3);
            if (i18n.currentLang() !== 'zh') i18n.applyDom();
            core.bus.emit('legacy:ready', {});
        }).catch((err) => {
            legacyPromise = null;
            console.warn('[boot] legacy 分块加载失败:', err);
        });
    }
    return legacyPromise;
}

let threeBooted = false;
function ensureThreeJS() {
    if (threeBooted) return;
    threeBooted = true;
    ensureLegacy('high').then(() => {
        if (!legacyReady) {
            threeBooted = false;
            return;
        }
        try {
            legacy.call('initThreeJS');
        } catch (err) {
            console.warn('[boot] 三维展馆初始化异常:', err);
        }
    });
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
                    ensureLegacy('high');
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

    // 移动端延后至 Hero3D 首帧落地或用户主动操作时再唤醒 legacy，确保首屏与预览秒开
    if (!legacyReady && window.innerWidth < 768) {
        const wakeMobileLegacy = () => ensureLegacy('low');
        const mobileFallback = setTimeout(wakeMobileLegacy, 1800);
        core.bus.once('hero:ready', () => {
            clearTimeout(mobileFallback);
            setTimeout(wakeMobileLegacy, 120);
        });
        window.addEventListener('scroll', () => {
            if ((window.scrollY || window.pageYOffset || 0) > 100) {
                clearTimeout(mobileFallback);
                wakeMobileLegacy();
            }
        }, { passive: true, once: true });
    }

    // 任意直接跳往展馆或触发器物/尚未注册动作的操作，立即激活 legacy 与三维展馆
    document.addEventListener(
        'click',
        (ev) => {
            const target = ev.target;
            if (!target || !target.closest) return;
            const actionEl = target.closest('[data-action], [data-action-self]');
            if (actionEl && !legacyReady) {
                const attr = actionEl.hasAttribute('data-action') ? 'data-action' : 'data-action-self';
                const expr = actionEl.getAttribute(attr) || '';
                const firstCall = expr.split(';')[0].split('(')[0].trim();
                if (firstCall && !actions.has(firstCall)) {
                    ev.preventDefault();
                    ev.stopPropagation();
                    ensureLegacy('high').then(() => {
                        if (firstCall.includes('Porcelain') || firstCall.includes('GuidedTour') || firstCall.includes('Microscope') || firstCall.includes('Comparison')) {
                            ensureThreeJS();
                        }
                        actionEl.click();
                    });
                    return;
                }
            }
            if (threeBooted) return;
            const hit = target.closest(
                '[href="#3d-gallery"], [data-action*="loadPorcelainModel"], [data-action*="loadComparisonModelTo3D"], [data-action*="startGuidedTour"], [data-action*="openMicroscopeView"]'
            );
            if (hit) ensureThreeJS();
        },
        { capture: true }
    );

    // 桌面端：legacy 已由 <link rel="preload" media="(min-width:768px)"> 在 0ms 并行下进缓存，
    // 等到 Hero3D 首帧完成渲染（hero:ready + 20ms）或 1500ms 兜底再挂载执行，彻底消除首屏插队卡顿；
    // 然后于 1200ms 空闲期温和预热次屏 3D 展馆。
    const saveData = !!(navigator.connection && navigator.connection.saveData);
    if (window.innerWidth >= 768) {
        const execDesktopLegacy = () => ensureLegacy('high');
        const legacyFallback = setTimeout(execDesktopLegacy, 1500);
        core.bus.once('hero:ready', () => {
            clearTimeout(legacyFallback);
            setTimeout(execDesktopLegacy, 20);
        });
        if (!saveData) {
            const idleWarm = () => {
                if (threeBooted) return;
                if (typeof requestIdleCallback === 'function') {
                    requestIdleCallback(() => ensureThreeJS(), { timeout: 1200 });
                } else {
                    setTimeout(ensureThreeJS, 200);
                }
            };
            const fallbackTimer = setTimeout(idleWarm, 12000);
            core.bus.once('hero:ready', () => {
                clearTimeout(fallbackTimer);
                setTimeout(idleWarm, 1200);
            });
        }
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
