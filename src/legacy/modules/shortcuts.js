/**
 * 模块：精简全局键盘快捷键系统 (shortcuts)
 * 仅保留 6 个核心全局快捷键，避免单字母快捷键冲突与记忆负担：
 *   Ctrl/Cmd+K 检索 | Esc 关闭浮层 | T 切换主题 | L 切换语言 | G 跳转 3D 展馆 | ? 帮助
 */
(function (global) {
    'use strict';

    function openShortcutsHelpModal() {
        const modal = document.getElementById('shortcuts-help-modal');
        if (modal) {
            if (global.ModalManager) global.ModalManager.open(modal);
            else modal.classList.add('active');
        }
        if (typeof global.playPorcelainChime === 'function') global.playPorcelainChime(2620);
    }

    function closeShortcutsHelpModal() {
        const modal = document.getElementById('shortcuts-help-modal');
        if (!modal) return;
        if (global.ModalManager) global.ModalManager.close(modal);
        else modal.classList.remove('active');
    }

    function initGlobalConnoisseurShortcuts() {
        if (global._globalShortcutsBound) return;
        global._globalShortcutsBound = true;

        global.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                if (global.ModalManager && global.ModalManager.dismissTop()) {
                    e.preventDefault();
                }
                return;
            }

            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
                e.preventDefault();
                const cmdModal = document.getElementById('command-palette-modal');
                if (cmdModal && cmdModal.classList.contains('active')) {
                    if (typeof global.closeCommandPalette === 'function') global.closeCommandPalette();
                } else if (typeof global.openCommandPalette === 'function') {
                    global.openCommandPalette();
                }
                return;
            }

            if (global.ModalManager && global.ModalManager.hasActive()) return;

            const activeEl = document.activeElement;
            const tag = (activeEl && activeEl.tagName) || '';
            if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || (activeEl && activeEl.isContentEditable)) {
                return;
            }

            if (e.key === '?') {
                e.preventDefault();
                const modal = document.getElementById('shortcuts-help-modal');
                if (modal && modal.classList.contains('active')) closeShortcutsHelpModal();
                else openShortcutsHelpModal();
                return;
            }

            if (e.ctrlKey || e.metaKey || e.altKey) return;
            const keyLower = e.key.toLowerCase();

            if (keyLower === 't') {
                e.preventDefault();
                if (global.__TQ__ && global.__TQ__.core && global.__TQ__.core.actions) {
                    global.__TQ__.core.actions.run('toggleMuseumTheme');
                }
                return;
            }
            if (keyLower === 'l') {
                e.preventDefault();
                if (global.__TQ__ && global.__TQ__.core && global.__TQ__.core.actions) {
                    global.__TQ__.core.actions.run('toggleLanguage');
                }
                return;
            }
            if (keyLower === 'g') {
                e.preventDefault();
                const gEl = document.getElementById('3d-gallery');
                if (gEl) gEl.scrollIntoView({ behavior: 'smooth' });
            }
        });
    }

    global.AppRegistry.register({
        id: 'shortcuts',
        phase: 3,
        init: initGlobalConnoisseurShortcuts,
        publicApi: { openShortcutsHelpModal, closeShortcutsHelpModal },
        globalBindings: { openShortcutsHelpModal, closeShortcutsHelpModal }
    });
})(window);
