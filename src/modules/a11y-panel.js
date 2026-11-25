/**
 * 模块：无障碍与适老阅读面板 (a11y-panel)
 * 提供“大字模式”“高对比度”“减少动效”“当前板块语音朗读”四个一键开关，持久化至 tq_a11y_v1。
 */
import { defineModule, store, bus, modal, toast, html, setHTML } from '@core';

const STORAGE_KEY = 'tq_a11y_v1';
let modalEl = null;
let prefs = { largeText: false, highContrast: false, reduceMotion: false };
let speaking = false;

function loadPrefs() {
    try {
        const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
        prefs = {
            largeText: !!parsed.largeText,
            highContrast: !!parsed.highContrast,
            reduceMotion: !!parsed.reduceMotion
        };
    } catch {}
}

function applyPrefs() {
    const de = document.documentElement;
    de.toggleAttribute('data-large-text', prefs.largeText);
    de.toggleAttribute('data-high-contrast', prefs.highContrast);
    de.toggleAttribute('data-reduce-motion', prefs.reduceMotion);
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    } catch {}
    bus.emit('a11y:changed', { ...prefs });
}

function stopSpeech() {
    speaking = false;
    const synth = globalThis.speechSynthesis;
    if (synth) synth.cancel();
}

function toggleSpeechRead() {
    const synth = globalThis.speechSynthesis;
    if (!synth || typeof SpeechSynthesisUtterance === 'undefined') {
        toast.show('当前浏览器暂不支持 Web Speech 语音合成');
        return;
    }
    if (speaking) {
        stopSpeech();
        renderModal();
        return;
    }
    const secId = store.get('activeSection') || 'hero';
    const secEl = document.getElementById(secId);
    const title = secEl ? (secEl.querySelector('h1, h2, h3') || {}).textContent : '天青泥火';
    const sub = secEl ? (secEl.querySelector('.section-subtitle, .hero__lead') || {}).textContent : '';
    const text = `${title || ''}。${sub || ''}`.trim();
    if (!text) return;

    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = document.documentElement.getAttribute('data-lang') === 'en' ? 'en-US' : 'zh-CN';
    utter.rate = 0.95;
    utter.onend = () => {
        speaking = false;
        renderModal();
    };
    utter.onerror = () => {
        speaking = false;
        renderModal();
    };
    speaking = true;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utter);
    renderModal();
}

function ensureModal() {
    if (modalEl) return modalEl;
    modalEl = document.createElement('div');
    modalEl.id = 'a11y-panel-modal';
    modalEl.className = 'modal-backdrop';
    modalEl.setAttribute('role', 'dialog');
    modalEl.setAttribute('aria-modal', 'true');
    modalEl.setAttribute('aria-labelledby', 'a11y-panel-title');
    modalEl.setAttribute('data-action-self', 'closeAccessibilityPanel()');
    document.body.appendChild(modalEl);
    modal.registerCloser('a11y-panel-modal', closePanel);
    return modalEl;
}

function renderModal() {
    const host = ensureModal();
    setHTML(
        host,
        html`
        <div class="modal-content-lg max-w-lg text-left space-y-4">
            <div class="flex items-center justify-between pb-3 border-b border-border-light">
                <h3 id="a11y-panel-title" class="font-serif-cn text-lg font-semibold text-text-title">
                    <i class="fa-solid fa-universal-access text-tianqing-deep mr-1.5" aria-hidden="true"></i>
                    <span>无障碍与适老阅读设置</span>
                </h3>
                <button type="button" data-action="closeAccessibilityPanel()" class="w-8 h-8 rounded-full hover:bg-yuebai flex items-center justify-center" aria-label="关闭无障碍设置">
                    <i class="fa-solid fa-xmark" aria-hidden="true"></i>
                </button>
            </div>

            <div class="space-y-2.5 text-left">
                <div class="a11y-toggle-row">
                    <div>
                        <div class="text-sm font-serif-cn font-semibold text-text-title">适老放大字号</div>
                        <div class="text-xs text-text-muted">全站正文与标签整体放大约 18.75%</div>
                    </div>
                    <button type="button" class="a11y-switch" aria-pressed="${prefs.largeText ? 'true' : 'false'}" data-action="toggleA11yPref('largeText')">
                        ${prefs.largeText ? '已开启' : '关闭'}
                    </button>
                </div>

                <div class="a11y-toggle-row">
                    <div>
                        <div class="text-sm font-serif-cn font-semibold text-text-title">高对比度增强</div>
                        <div class="text-xs text-text-muted">提高文字与背景底纱不透明度，增强弱视可读性</div>
                    </div>
                    <button type="button" class="a11y-switch" aria-pressed="${prefs.highContrast ? 'true' : 'false'}" data-action="toggleA11yPref('highContrast')">
                        ${prefs.highContrast ? '已开启' : '关闭'}
                    </button>
                </div>

                <div class="a11y-toggle-row">
                    <div>
                        <div class="text-sm font-serif-cn font-semibold text-text-title">减少动效与 3D 旋转</div>
                        <div class="text-xs text-text-muted">暂停首屏 3D 自转与页面过渡动画</div>
                    </div>
                    <button type="button" class="a11y-switch" aria-pressed="${prefs.reduceMotion ? 'true' : 'false'}" data-action="toggleA11yPref('reduceMotion')">
                        ${prefs.reduceMotion ? '已开启' : '关闭'}
                    </button>
                </div>

                <div class="a11y-toggle-row">
                    <div>
                        <div class="text-sm font-serif-cn font-semibold text-text-title">当前板块语音朗读</div>
                        <div class="text-xs text-text-muted">调用浏览器本地语音朗读当前章节导语</div>
                    </div>
                    <button type="button" class="a11y-switch" aria-pressed="${speaking ? 'true' : 'false'}" data-action="toggleA11ySpeech()">
                        ${speaking ? '停止朗读' : '开始朗读'}
                    </button>
                </div>
            </div>
        </div>`
    );
}

function openPanel() {
    renderModal();
    modal.open(modalEl, '.a11y-switch');
}

function closePanel() {
    if (modalEl) modal.close(modalEl);
}

export default defineModule({
    id: 'a11y-panel',
    phase: 3,
    init() {
        loadPrefs();
        applyPrefs();
    },
    destroy() {
        stopSpeech();
        if (modalEl) modalEl.remove();
        modalEl = null;
    },
    actions: {
        openAccessibilityPanel: openPanel,
        closeAccessibilityPanel: closePanel,
        toggleA11yPref(_ctx, key) {
            if (!(key in prefs)) return;
            prefs[key] = !prefs[key];
            applyPrefs();
            renderModal();
        },
        toggleA11ySpeech: toggleSpeechRead
    }
});
