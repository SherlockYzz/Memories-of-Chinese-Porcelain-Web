/**
 * 应用入口：装配内核、登记模块、按三个阶段启动。
 * 这里不写业务逻辑——新增功能请在 src/modules/ 下建模块，然后在下方 import 一行。
 */
import * as core from '@core';
import './modules/index.js';

const { registry, actions, i18n, legacy } = core;

// 供按需分块（global-shim）与旧脚本（legacy-bridge）复用同一份内核实例。
window.__TQ__ = { core, diagnostics: core.diagnostics, version: core.data.get('site').version };

core.installLegacyBridge();
core.installActionDelegation();

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

function boot() {
    // 阶段一：首屏（导航、主题、背景、三维展馆）
    registry.bootPhase(1);
    try {
        legacy.call('initThreeJS');
    } catch (err) {
        console.warn('[boot] 三维展馆初始化异常:', err);
    }
    core.installLegacyLazyChunks();

    // 阶段二：次屏内容
    requestAnimationFrame(() => registry.bootPhase(2));

    // 阶段三：其余模块 + 恢复语言偏好
    setTimeout(() => {
        registry.bootPhase(3);
        i18n.restoreLanguage();
        core.bus.emit('app:ready', {});
    }, 80);
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
else boot();
