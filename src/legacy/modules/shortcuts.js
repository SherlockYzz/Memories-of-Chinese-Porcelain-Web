/**
 * 模块：博古鉴瓷全局键盘快捷键系统 (shortcuts)
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

    function isSectionInFocusZone(sectionId) {
        const el = document.getElementById(sectionId);
        if (!el) return false;
        const rect = el.getBoundingClientRect();
        const vh = global.innerHeight || document.documentElement.clientHeight;
        return rect.top < vh * 0.85 && rect.bottom > vh * 0.15;
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

            if (e.key === '?' || (e.key.toLowerCase() === 'h' && !e.ctrlKey && !e.metaKey && !e.altKey)) {
                e.preventDefault();
                const modal = document.getElementById('shortcuts-help-modal');
                if (modal && modal.classList.contains('active')) closeShortcutsHelpModal();
                else openShortcutsHelpModal();
                return;
            }

            if ((e.key === ' ' || e.code === 'Space') && !e.ctrlKey && !e.metaKey && !e.altKey) {
                const role = activeEl && activeEl.getAttribute ? activeEl.getAttribute('role') : '';
                const isInteractive = ['BUTTON', 'A', 'VIDEO', 'AUDIO', 'SUMMARY'].includes(tag) || role === 'button';
                if (!isInteractive && isSectionInFocusZone('3d-gallery')) {
                    e.preventDefault();
                    if (typeof global.toggleAutoRotate === 'function') global.toggleAutoRotate();
                }
                return;
            }

            if (e.ctrlKey || e.metaKey || e.altKey) return;

            const keyLower = e.key.toLowerCase();

            if (keyLower === 'b') {
                e.preventDefault();
                if (typeof global.toggleBottomView === 'function') global.toggleBottomView();
                return;
            }
            if (keyLower === 't') {
                e.preventDefault();
                if (typeof global.toggleTransilluminationTorch === 'function') global.toggleTransilluminationTorch();
                return;
            }
            if (keyLower === 'c') {
                e.preventDefault();
                if (typeof global.switchExhibitionMode === 'function') {
                    global.switchExhibitionMode(global.exhibitionMode === 'comparison' ? 'inspector' : 'comparison');
                }
                return;
            }
            if (keyLower === 'm') {
                e.preventDefault();
                const microModal = document.getElementById('microscope-modal');
                if (microModal && microModal.classList.contains('active')) {
                    if (typeof global.closeMicroscopeView === 'function') global.closeMicroscopeView();
                } else if (typeof global.openMicroscopeView === 'function') {
                    global.openMicroscopeView();
                }
                return;
            }
            if (keyLower === 'x') {
                e.preventDefault();
                if (typeof global.switchExhibitionMode === 'function') {
                    global.switchExhibitionMode(global.exhibitionMode === 'cutaway' ? 'inspector' : 'cutaway');
                }
                return;
            }
            if (keyLower === 'd') {
                e.preventDefault();
                if (typeof global.toggleMuseumTheme === 'function') global.toggleMuseumTheme();
                return;
            }
            if (keyLower === 'z') {
                e.preventDefault();
                if (typeof global.toggleZenMode === 'function') global.toggleZenMode();
                return;
            }

            const num = parseInt(e.key, 10);
            if (!isNaN(num) && num >= 1 && num <= 9) {
                e.preventDefault();
                if (num <= 5 && isSectionInFocusZone('video-theatre') && !isSectionInFocusZone('3d-gallery') && typeof global.strikeAncientChime === 'function' && typeof pentatonicNotesData !== 'undefined') {
                    const targetNote = pentatonicNotesData[num - 1];
                    if (targetNote) global.strikeAncientChime(targetNote.key);
                    return;
                }
                if (typeof global.loadPorcelainModel === 'function') {
                    global.loadPorcelainModel(num - 1);
                }
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
