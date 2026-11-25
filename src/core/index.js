/**
 * 内核出口。模块统一 `import { ... } from '@core'`。
 * （主包里 @core 指向本文件；按需分块里指向 global-shim.js，复用主包已加载的同一份实例。）
 */
import bus from './bus.js';
import store from './store.js';
import storage, { KEYS } from './storage.js';
import registry, { defineModule, provide } from './registry.js';
import actions, { installActionDelegation } from './actions.js';
import data from './data/data-service.js';
import userData from './data/user-data.js';
import i18n, { t, tr } from './i18n.js';
import modal from './modal.js';
import toast from './toast.js';
import lazy from './lazy.js';
import legacy, { installLegacyBridge, installLegacyLazyChunks, diagnostics } from './legacy-bridge.js';
import { html, raw, esc, setHTML, when, $, $$, prefersReducedMotion } from './dom.js';
import glaze from './glaze-shader.js';

provide('data', data);
provide('userData', userData);
provide('i18n', i18n);
provide('actions', actions);
provide('modal', modal);
provide('toast', toast);
provide('lazy', lazy);
provide('legacy', legacy);

export {
    bus, store, storage, KEYS, registry, defineModule, actions, installActionDelegation,
    data, userData, i18n, t, tr, modal, toast, lazy, legacy, glaze,
    installLegacyBridge, installLegacyLazyChunks, diagnostics,
    html, raw, esc, setHTML, when, $, $$, prefersReducedMotion
};
