/**
 * Legacy 桥：新内核与尚未迁移的经典脚本（src/legacy/**）之间唯一的接缝。
 *
 * 规则：
 *   - 只有本文件可以往 window 上挂东西（check:code 会检查）；
 *   - ESM 模块想调用还没迁移的旧函数，用 legacy.call('fnName', ...)，不要直接碰 window；
 *   - 旧脚本想用新内核，用下面挂出的兼容名（AppBus / AppStore / AppRegistry / tText …）。
 * 每迁移完一个旧文件，就从这里删掉对应的兼容项，并在 docs/MIGRATION.md 更新进度。
 */
import bus from './bus.js';
import store from './store.js';
import registry from './registry.js';
import actions, { setFallbackResolver, run as runAction } from './actions.js';
import modal from './modal.js';
import toast from './toast.js';
import lazy from './lazy.js';
import data from './data/data-service.js';
import userData from './data/user-data.js';
import i18n, { t, tr, applyDom, setLanguage, toggleLanguage, currentLang } from './i18n.js';

const w = typeof window !== 'undefined' ? window : {};

/** 调用旧全局函数；函数不存在时静默返回 undefined（旧代码里普遍是这种容错写法）。 */
function call(name, ...args) {
    const fn = w[name];
    if (typeof fn === 'function') return fn(...args);
    return undefined;
}

function has(name) {
    return typeof w[name] === 'function';
}

/** 仍由 legacy 懒加载脚本提供的函数：首次调用时先加载对应分块，再转发。 */
function defineLazyStubs(chunk, initName, fnNames) {
    let ready = null;
    const ensure = (priority) => {
        if (!ready) {
            ready = lazy.load(chunk, { priority }).then(() => {
                call(initName);
                bus.emit('legacy:chunk-ready', { chunk });
            });
        }
        return ready;
    };
    for (const name of fnNames) {
        const stub = (...args) => {
            ensure('high').then(() => {
                const real = w[name];
                if (typeof real === 'function' && real !== stub) real(...args);
            });
        };
        stub.__lazyStub = true;
        w[name] = stub;
    }
    return ensure;
}

export function installLegacyBridge() {
    // 旧脚本使用的服务别名
    w.AppBus = bus;
    w.AppStore = store;
    w.AppRegistry = registry;
    w.ModalManager = modal;
    w.ToastService = toast;
    w.showToast = toast.show;
    w.manageModalOpen = (m, focus) => modal.open(m, focus);
    w.manageModalClose = (m) => modal.close(m);
    w.hasAnyActiveOverlay = modal.hasActive;
    w.HuaxiaApp = { bus, store, registry, modules: new Proxy({}, { get: (_t, id) => registry.api(String(id)) }) };

    // i18n 兼容名
    w.t = t;
    w.tText = tr;
    w.applyDomTranslations = applyDom;
    w.switchLanguage = setLanguage;
    w.toggleLanguage = toggleLanguage;
    Object.defineProperty(w, 'currentLang', { configurable: true, get: currentLang });
    w.translations = i18n.uiTable;

    // 模板里尚未登记为模块动作的旧函数名，按名字从 window 解析。
    setFallbackResolver((name) => (typeof w[name] === 'function' ? w[name] : null));

    // 浮层打开时暂停首屏 2D/3D 背景动画（旧实现挂在 window 上）。
    bus.on('modal:opened', () => call('setOrientalAmbientPaused', true));
    bus.on('modal:closed', () => call('setOrientalAmbientPaused', false));

    // 这些弹窗关闭时有额外收尾（停摄像头、停显微镜动画），由旧函数负责。
    modal.registerCloser('microscope-modal', () => call('closeMicroscopeView'));
    modal.registerCloser('camera-modal', () => call('stopCameraScan'));
}

/** 登记两个 legacy 懒加载分块（拉坯工坊、图像分析）。 */
export function installLegacyLazyChunks() {
    const pottery = defineLazyStubs('legacy-pottery', 'initPotteryWorkshop', [
        'resetClay', 'applyPresetVessel', 'setPotPattern', 'selectPotGlaze', 'selectPotSeal', 'firePotInKiln',
        'setPotTool', 'downloadPotteryArtwork', 'undoPotteryAction', 'setBrushStyle', 'setBrushStamp', 'setBrushSize',
        'setBrushSymmetry', 'toggleWheelPause', 'clearQinghuaPaint', 'resetPotCamera', 'savePotteryDraft', 'loadPotteryDraft',
        'toggleAmbientGuqin', 'playPorcelainChime', 'playCrackleSound', 'playPentatonicChime'
    ]);
    const ai = defineLazyStubs('legacy-ai', 'initAiRecognition', ['setAiVisualMode', 'startCameraScan', 'stopCameraScan', 'captureAndIdentify']);
    lazy.whenVisible('#pottery-studio', () => pottery('low'));
    lazy.whenVisible('#ai-recognition', () => ai('low'));
}

export const legacy = { call, has, run: runAction };
export default legacy;

// 供控制台诊断：window.__TQ__.diagnostics()
export function diagnostics() {
    return {
        modules: registry.list(),
        actions: actions.list().length,
        missingActions: actions.missing(),
        bus: bus.stats(),
        data: data.status(),
        userDataPersistent: userData.persistent
    };
}
