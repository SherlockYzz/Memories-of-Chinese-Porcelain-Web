/**
 * 模块：全局智能检索引擎命令面板 (Ctrl/Cmd + K) (command-palette)
 * 职责：动态聚合 AppRegistry.collectSearchItems()，支持新增插件自动进入全局搜索，无硬编码数据依赖。
 */
(function (global) {
    'use strict';

    let cmdSelectedIndex = 0;
    let cmdSearchTimer = null;
    let currentMatched = [];

    function tr(s) {
        return typeof global.tText === 'function' ? global.tText(s) : s;
    }

    function escapeHtmlSafe(str) {
        return String(str).replace(/[&<>"']/g, (ch) => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
        }[ch]));
    }

    function highlightQuerySafe(text, rawQuery) {
        const safeText = escapeHtmlSafe(text);
        const q = (rawQuery || '').trim();
        if (!q) return safeText;
        const escapedRe = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        return safeText.replace(new RegExp(`(${escapedRe})`, 'ig'), '<mark class="cmd-highlight">$1</mark>');
    }

    function updateCommandSelectionUI() {
        const listEl = document.getElementById('command-results-list');
        if (!listEl) return;
        const items = listEl.querySelectorAll('.cmd-result-item');
        items.forEach((btn, idx) => {
            const active = idx === cmdSelectedIndex;
            btn.classList.toggle('cmd-item-active', active);
            btn.setAttribute('aria-selected', active ? 'true' : 'false');
            if (active) btn.scrollIntoView({ block: 'nearest' });
        });
    }

    function renderCommandResults(query = '') {
        const listEl = document.getElementById('command-results-list');
        if (!listEl) return;
        const q = query.trim().toLowerCase();
        cmdSelectedIndex = 0;

        const lang = (global.AppStore && global.AppStore.get('lang')) || 'zh';
        const allItems = global.AppRegistry ? global.AppRegistry.collectSearchItems(lang) : [];

        const matched = q
            ? allItems.filter(it => (String(it.title || '') + String(it.sub || '') + String(it.type || '')).toLowerCase().includes(q))
            : allItems.slice(0, 10);

        if (matched.length === 0) {
            currentMatched = [];
            global._currentCmdMatched = [];
            listEl.innerHTML = `<div class="py-8 text-center text-xs text-text-muted">${tr('未检索到匹配的器物、窑口或釉色，请尝试搜索“汝窑”、“苏麻离青”、“冰裂”、“贯耳瓶”')}</div>`;
            return;
        }

        const visibleList = matched.slice(0, 12);
        currentMatched = visibleList;
        global._currentCmdMatched = visibleList;

        listEl.innerHTML = visibleList.map((item, idx) => `
            <button type="button" role="option" aria-selected="${idx === 0 ? 'true' : 'false'}" data-action="triggerCommandItem(${idx})" class="cmd-result-item ${idx === 0 ? 'cmd-item-active' : ''} w-full p-3 rounded-xl bg-bg-main hover:bg-yuebai border border-border-light flex items-center justify-between gap-3 text-left transition-colors">
                <div class="flex items-center gap-3 min-w-0">
                    <div class="w-8 h-8 rounded-lg bg-yuebai flex items-center justify-center text-tianqing-deep shrink-0">
                        <i class="fa-solid ${item.icon || 'fa-cube'} text-xs" aria-hidden="true"></i>
                    </div>
                    <div class="min-w-0">
                        <div class="text-xs font-serif-cn font-medium text-text-title truncate">${highlightQuerySafe(item.title, query)}</div>
                        <div class="text-[11px] text-text-muted truncate">${highlightQuerySafe(item.sub || '', query)}</div>
                    </div>
                </div>
                <span class="badge bg-yuebai text-tianqing-deep text-[10px] shrink-0 border border-border-light">${escapeHtmlSafe(item.type || '')}</span>
            </button>
        `).join('');
    }

    function debouncedRenderCommandResults(query = '') {
        clearTimeout(cmdSearchTimer);
        cmdSearchTimer = setTimeout(() => renderCommandResults(query), 120);
    }

    function triggerCommandItem(idx) {
        if (currentMatched[idx] && typeof currentMatched[idx].action === 'function') {
            currentMatched[idx].action();
        }
    }

    function openCommandPalette() {
        const modal = document.getElementById('command-palette-modal');
        const input = document.getElementById('command-search-input');
        if (!modal) return;
        renderCommandResults(input ? input.value : '');
        if (global.ModalManager) global.ModalManager.open(modal, input || '#command-search-input');
        else modal.classList.add('active');
    }

    function closeCommandPalette() {
        const modal = document.getElementById('command-palette-modal');
        if (!modal) return;
        if (global.ModalManager) global.ModalManager.close(modal);
        else modal.classList.remove('active');
    }

    function initCommandPalette() {
        const input = document.getElementById('command-search-input');
        if (input && input.dataset.cmdBound !== '1') {
            input.dataset.cmdBound = '1';
            input.addEventListener('keydown', (e) => {
                const maxVisible = currentMatched.length;
                if (e.key === 'ArrowDown') {
                    if (maxVisible > 0) {
                        e.preventDefault();
                        cmdSelectedIndex = (cmdSelectedIndex + 1) % maxVisible;
                        updateCommandSelectionUI();
                    }
                } else if (e.key === 'ArrowUp') {
                    if (maxVisible > 0) {
                        e.preventDefault();
                        cmdSelectedIndex = (cmdSelectedIndex - 1 + maxVisible) % maxVisible;
                        updateCommandSelectionUI();
                    }
                } else if (e.key === 'Enter') {
                    if (maxVisible > 0) {
                        e.preventDefault();
                        triggerCommandItem(cmdSelectedIndex);
                    }
                }
            });
        }
        renderCommandResults('');
    }

    global.AppRegistry.register({
        id: 'command-palette',
        phase: 3,
        init: initCommandPalette,
        onLangChange: function () {
            const input = document.getElementById('command-search-input');
            renderCommandResults(input ? input.value : '');
        },
        publicApi: {
            openCommandPalette,
            closeCommandPalette,
            renderCommandResults,
            debouncedRenderCommandResults,
            triggerCommandItem
        },
        globalBindings: {
            openCommandPalette,
            closeCommandPalette,
            renderCommandResults,
            debouncedRenderCommandResults,
            triggerCommandItem
        }
    });
})(window);
