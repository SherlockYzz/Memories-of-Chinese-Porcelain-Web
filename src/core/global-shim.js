/**
 * 按需分块里的 @core：不重复打包内核，而是复用主包挂在 window.__TQ__.core 上的同一份实例。
 * 导出名必须与 core/index.js 保持一致（check:code 会校验）。
 */
const core = window.__TQ__.core;

export const {
    bus, store, storage, KEYS, registry, defineModule, actions, installActionDelegation,
    data, userData, i18n, t, tr, modal, toast, lazy, legacy,
    installLegacyBridge, installLegacyLazyChunks, diagnostics,
    html, raw, esc, setHTML, when, $, $$, prefersReducedMotion
} = core;
