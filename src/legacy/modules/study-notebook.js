/**
 * 模块：个人研学手记与典藏收藏夹 (study-notebook)
 * 职责：收藏夹增删持久化 (AppStore bookmarks)、手记自动保存、Markdown 导出；通过 AppBus 发布 bookmarks:changed。
 */
(function (global) {
    'use strict';

    function tr(s) {
        return typeof global.tText === 'function' ? global.tText(s) : s;
    }

    function getBookmarks() {
        return (global.AppStore && global.AppStore.get('bookmarks')) || [1, 2];
    }

    function updateBookmarkUI() {
        const list = getBookmarks();
        const countBadge = document.getElementById('bookmark-count-badge');
        const mobileCountBadge = document.getElementById('mobile-bookmark-count-badge');
        if (countBadge) countBadge.textContent = list.length;
        if (mobileCountBadge) mobileCountBadge.textContent = list.length;
    }

    function toggleArchiveBookmark(id) {
        id = parseInt(id, 10);
        const current = getBookmarks().slice();
        const idx = current.indexOf(id);
        if (idx >= 0) {
            current.splice(idx, 1);
            if (global.ToastService) global.ToastService.show('已从个人典藏集中移除该名瓷');
        } else {
            current.push(id);
            if (typeof global.playPorcelainChime === 'function') global.playPorcelainChime(2500);
            if (global.ToastService) global.ToastService.show('⭐ 已收录入个人古瓷研学典藏集！');
        }
        if (global.AppStore) global.AppStore.set('bookmarks', current);
        updateBookmarkUI();
        if (global.AppBus) global.AppBus.emit('bookmarks:changed', current);
    }

    function renderStudyNotebookList() {
        const container = document.getElementById('study-notebook-list');
        if (!container || typeof archivePorcelains === 'undefined') return;
        const bookmarks = getBookmarks();
        if (bookmarks.length === 0) {
            container.innerHTML = `
                <div class="text-center py-8 text-text-muted font-light text-xs">
                    <i class="fa-regular fa-bookmark text-2xl block mb-2" aria-hidden="true"></i>
                    ${tr('尚未收录任何传世名瓷。请在「传世名品典藏库」卡片左上角点击书签即可收录。')}
                </div>
            `;
        } else {
            const favItems = archivePorcelains.filter(item => bookmarks.includes(item.id));
            container.innerHTML = favItems.map(item => `
                <div class="p-3 rounded-xl bg-yuebai/50 border border-border-light flex items-center justify-between gap-3 text-xs">
                    <div class="flex items-center gap-3">
                        <img src="${item.img}" class="w-10 h-10 rounded-lg object-cover" alt="${tr(item.name)}">
                        <div class="text-left">
                            <h5 class="font-serif-cn font-medium text-text-title">${tr(item.name)}</h5>
                            <p class="text-[11px] text-tianqing-deep">${tr(item.kiln)} · ${tr(item.level)}</p>
                        </div>
                    </div>
                    <div class="flex items-center gap-2">
                        <button data-action="openArchiveDetailModal(${item.id})" class="text-tianqing-deep hover:underline text-[11px]">${tr('研读档案')}</button>
                        <button data-action="toggleArchiveBookmark(${item.id}); openStudyNotebook()" class="text-red-500 text-xs px-1" title="${tr('移除')}" aria-label="${tr('从典藏集移除')}"><i class="fa-solid fa-trash-can" aria-hidden="true"></i></button>
                    </div>
                </div>
            `).join('');
        }
    }

    function openStudyNotebook() {
        const modal = document.getElementById('study-notebook-modal');
        const notesInput = document.getElementById('study-notebook-textarea');
        if (!modal) return;

        try {
            const savedNotes = localStorage.getItem('huaxia_study_user_notes') || '';
            if (notesInput) notesInput.value = savedNotes;
        } catch (e) {}

        renderStudyNotebookList();

        if (global.ModalManager) global.ModalManager.open(modal, '#study-notebook-textarea');
        else modal.classList.add('active');
    }

    function closeStudyNotebook() {
        const modal = document.getElementById('study-notebook-modal');
        if (!modal) return;
        if (global.ModalManager) global.ModalManager.close(modal);
        else modal.classList.remove('active');
    }

    function saveStudyNotes() {
        const notesInput = document.getElementById('study-notebook-textarea');
        if (!notesInput) return;
        try { localStorage.setItem('huaxia_study_user_notes', notesInput.value); } catch (e) {}
    }

    function exportStudyNotes() {
        const notesInput = document.getElementById('study-notebook-textarea');
        const userNotes = notesInput ? notesInput.value : '';
        const bookmarks = getBookmarks();
        const favItems = (typeof archivePorcelains !== 'undefined')
            ? archivePorcelains.filter(item => bookmarks.includes(item.id))
            : [];

        let content = `# 华夏器道 · 天青泥火个人古瓷研学手记\n\n`;
        content += `> 研学导出时间：${new Date().toLocaleString()}\n\n`;
        content += `## 一、典藏标本收录清单 (${favItems.length} 件)\n\n`;
        if (favItems.length === 0) {
            content += `(暂未添加标本)\n\n`;
        } else {
            favItems.forEach((item, idx) => {
                content += `### ${idx + 1}. ${item.name}\n`;
                content += `- **窑口归属**：${item.kiln}\n`;
                content += `- **文物等级**：${item.level}\n`;
                content += `- **实测规制**：${item.size}\n`;
                content += `- **典型特征**：${item.desc}\n\n`;
            });
        }
        content += `## 二、个人学术心得与鉴赏札记\n\n`;
        content += userNotes || '（暂无自由随笔记录）\n';

        const blob = new Blob([content], { type: 'text/markdown;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `华夏器道_研学手记_${Date.now()}.md`;
        link.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        if (global.ToastService) global.ToastService.show('已成功导出个人研学手记 Markdown 文档！');
    }

    function clearStudyData() {
        const notesInput = document.getElementById('study-notebook-textarea');
        if (notesInput) notesInput.value = '';
        try { localStorage.removeItem('huaxia_study_user_notes'); } catch (e) {}
        if (global.AppStore) global.AppStore.set('bookmarks', []);
        updateBookmarkUI();
        renderStudyNotebookList();
        if (global.AppBus) global.AppBus.emit('bookmarks:changed', []);
        if (global.ToastService) global.ToastService.show('已清空本地研学手记与个人收藏');
    }

    global.AppRegistry.register({
        id: 'study-notebook',
        phase: 3,
        init: function ({ bus }) {
            updateBookmarkUI();
            if (bus) bus.on('bookmarks:changed', updateBookmarkUI);
        },
        onLangChange: function () {
            const modal = document.getElementById('study-notebook-modal');
            if (modal && modal.classList.contains('active')) renderStudyNotebookList();
        },
        publicApi: {
            toggleArchiveBookmark,
            openStudyNotebook,
            closeStudyNotebook,
            saveStudyNotes,
            exportStudyNotes,
            clearStudyData
        },
        globalBindings: {
            toggleArchiveBookmark,
            openStudyNotebook,
            closeStudyNotebook,
            saveStudyNotes,
            exportStudyNotes,
            clearStudyData
        }
    });
})(window);
