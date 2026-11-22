/**
 * 模块：传世名品典藏库 & 历代官窑纪年款识大辞典 (archive-catalog)
 * 职责：筛选、渲染、查阅单件国宝档案；仅通过 AppStore.get('bookmarks') 与 AppBus 协同收藏状态。
 */
(function (global) {
    'use strict';

    let currentArchiveFilter = 'all';

    function tr(s) {
        return typeof global.tText === 'function' ? global.tText(s) : s;
    }

    function filterArchivePorcelains(filterKey) {
        currentArchiveFilter = filterKey;
        document.querySelectorAll('.archive-filter-btn, .archive-dynasty-btn').forEach(btn => {
            const k = btn.dataset.filter || btn.dataset.dynasty;
            if (k === filterKey) {
                btn.classList.add('bg-tianqing-deep', 'text-white', 'active');
                btn.classList.remove('bg-yuebai', 'text-text-body');
            } else {
                btn.classList.remove('bg-tianqing-deep', 'text-white', 'active');
                btn.classList.add('bg-yuebai', 'text-text-body');
            }
        });
        renderArchiveGrid();
    }

    function renderArchiveGrid() {
        const container = document.getElementById('archive-grid-container');
        if (!container || typeof archivePorcelains === 'undefined') return;

        const bookmarks = (global.AppStore && global.AppStore.get('bookmarks')) || [];

        const filtered = archivePorcelains.filter(item => {
            if (currentArchiveFilter === 'all') return true;
            if (currentArchiveFilter === 'scanned') return item.modelIdx >= 7 || (item.tags && item.tags.some(t => t.includes('扫描')));
            if (currentArchiveFilter === 'song') return item.dynastyKey === 'song' || item.name.includes('宋');
            if (currentArchiveFilter === 'ming') return item.dynastyKey === 'ming' || item.name.includes('明');
            if (currentArchiveFilter === 'qing') return item.dynastyKey === 'qing' || item.name.includes('清');
            if (currentArchiveFilter === 'tang') return item.dynastyKey === 'tang' || item.name.includes('唐') || (item.period && item.period.includes('唐'));
            if (currentArchiveFilter === 'yuan') return item.dynastyKey === 'yuan' || item.name.includes('元') || (item.period && item.period.includes('元'));
            return true;
        });

        container.innerHTML = filtered.map(item => {
            const isFav = bookmarks.includes(item.id);
            const dimensionText = item.specs || item.size || '';
            const canView3D = typeof item.modelIdx === 'number' && item.modelIdx !== null && item.modelIdx >= 0 && item.modelIdx <= 20;
            return `
            <div class="feature-card p-5 group cursor-pointer hover-lift relative text-left flex flex-col justify-between" onclick="openArchiveDetailModal(${item.id})">
                <div>
                    <div class="aspect-square rounded-xl overflow-hidden mb-4 porcelain-card-skeleton relative border border-border-light/60">
                        <div class="porcelain-skeleton-icon">
                            <i class="fa-solid fa-gem opacity-40" aria-hidden="true"></i>
                            <span class="text-[10px] font-serif-cn mt-1 opacity-50 tracking-wider">${tr('天青雅鉴')}</span>
                        </div>
                        <img src="${item.img}" alt="${tr(item.name)}" class="w-full h-full object-cover group-hover:scale-105 transition-all duration-500 opacity-0 relative z-10" onload="this.classList.remove('opacity-0'); const icon = this.previousElementSibling; if(icon) icon.style.opacity='0';" onerror="this.src='./images/13.jpg'; this.classList.remove('opacity-0');">
                        <span class="absolute top-2.5 right-2.5 bg-tianqing-deep text-white text-[10px] px-2.5 py-0.5 rounded-full font-serif-cn shadow-sm">
                            ${tr(item.level)}
                        </span>
                        <button onclick="event.stopPropagation(); toggleArchiveBookmark(${item.id});" class="absolute top-2.5 left-2.5 w-8 h-8 rounded-full bg-black/65 backdrop-blur-sm text-white flex items-center justify-center hover:bg-tianqing-deep transition-colors" title="${tr(isFav ? '从典藏集移除' : '收录入典藏集')}" aria-label="${tr(isFav ? '从典藏集移除' : '收录入典藏集')}">
                            <i class="${isFav ? 'fa-solid text-amber-400' : 'fa-regular'} fa-bookmark text-xs" aria-hidden="true"></i>
                        </button>
                    </div>
                    <h4 class="text-base font-serif-cn text-text-title font-semibold mb-1 truncate">${tr(item.name)}</h4>
                    <p class="text-xs text-tianqing-deep font-medium mb-1">${tr(item.kiln)}</p>
                    <p class="text-[11px] text-text-muted mb-2.5 font-mono">${tr(dimensionText)}</p>
                    <div class="flex flex-wrap gap-1.5 mb-3">
                        ${(item.tags || []).map(t => `<span class="bg-yuebai text-text-body text-[10px] px-2 py-0.5 rounded border border-border-light">${tr(t)}</span>`).join('')}
                    </div>
                    <p class="text-xs text-text-body font-light line-clamp-2 leading-relaxed">${tr(item.desc)}</p>
                </div>
                <div class="mt-3.5 pt-2.5 border-t border-border-light text-[11px] text-tianqing-deep flex items-center justify-between">
                    <span class="hover:underline">${tr('查阅数字化研考档案')}</span>
                    ${canView3D
                        ? `<button onclick="event.stopPropagation(); loadComparisonModelTo3D(${item.id})" class="text-amber-400 hover:text-amber-300 hover:underline font-serif-cn font-medium flex items-center gap-1">
                            <i class="fa-solid fa-cube text-[10px]" aria-hidden="true"></i>${tr('3D全息检视')} &rarr;
                        </button>`
                        : `<span class="text-[11px] text-text-muted font-serif-cn opacity-60 flex items-center gap-1 select-none">
                            <i class="fa-regular fa-file-lines text-[10px]" aria-hidden="true"></i>${tr('典藏图录收录')}
                        </span>`
                    }
                </div>
            </div>
            `;
        }).join('');
    }

    function renderImperialReignMarks() {
        const container = document.getElementById('imperial-marks-grid');
        if (!container || typeof imperialReignMarks === 'undefined') return;

        container.innerHTML = imperialReignMarks.map(m => {
            const isCircle = m.style === 'blue-circle' || m.style === 'seal-round';
            const isCinnabar = m.style === 'cinnabar-square' || m.style === 'seal-round';
            const borderStyle = isCircle ? 'rounded-full border-2 border-double' : 'rounded-lg border-2';
            return `
                <div class="feature-card p-5 hover-lift text-left flex flex-col justify-between">
                    <div>
                        <div class="flex items-center gap-4 mb-3.5">
                            <div class="w-16 h-16 ${borderStyle} shrink-0 flex flex-col items-center justify-center font-serif-cn font-bold text-sm leading-tight shadow-inner"
                                 style="border-color: ${m.color}; color: ${isCinnabar ? '#fff' : m.color}; background: ${isCinnabar ? m.color : 'rgba(255,255,255,0.04)'};">
                                <span>${m.sealText[0]}</span>
                                <span>${m.sealText[1] || ''}</span>
                            </div>
                            <div>
                                <span class="text-[10px] font-mono text-amber-400 block">${tr(m.era)}</span>
                                <h4 class="text-sm sm:text-base font-serif-cn font-semibold text-text-title leading-snug mt-0.5">${tr(m.title)}</h4>
                                <span class="text-[11px] text-tianqing-deep">${tr(m.type)}</span>
                            </div>
                        </div>
                        <p class="text-xs text-text-body font-light leading-relaxed">${tr(m.desc)}</p>
                    </div>
                </div>
            `;
        }).join('');
    }

    function openArchiveDetailModal(id) {
        if (typeof archivePorcelains === 'undefined') return;
        const item = archivePorcelains.find(a => a.id === id);
        if (!item) return;

        const modal = document.getElementById('universal-modal');
        const modalTitle = document.getElementById('modal-title');
        const modalBody = document.getElementById('modal-body');
        if (!modal || !modalTitle || !modalBody) return;

        const canView3D = typeof item.modelIdx === 'number' && item.modelIdx !== null && item.modelIdx >= 0 && item.modelIdx <= 20;

        modalTitle.textContent = tr(item.name);
        modalBody.innerHTML = `
            <div class="space-y-4 text-left">
                <div class="aspect-square max-w-sm mx-auto rounded-2xl overflow-hidden shadow-sm bg-black border border-border-light">
                    <img src="${item.img}" alt="${tr(item.name)}" class="w-full h-full object-cover">
                </div>
                <div class="flex flex-wrap items-center justify-between gap-2 border-b border-border-light pb-3">
                    <div>
                        <span class="text-xs text-text-muted">${tr('窑口归属：')}</span>
                        <strong class="text-sm font-medium text-text-title font-serif-cn">${tr(item.kiln)}</strong>
                    </div>
                    <span class="badge bg-tianqing-deep text-white text-xs">${tr(item.level)}</span>
                </div>
                <div class="text-xs text-text-body space-y-2 font-light">
                    <p><strong>${tr('实测规制：')}</strong>${tr(item.size)}</p>
                    <p><strong>${tr('馆藏出处：')}</strong>${tr(item.collection || '华夏器道数字典藏')}</p>
                    <p><strong>${tr('典型器型特征：')}</strong>${tr(item.desc)}</p>
                </div>
                <div class="p-4 rounded-xl bg-yuebai/50 text-xs text-text-body leading-relaxed border border-border-light">
                    <strong class="font-medium text-text-title block mb-1">【${tr('数字化研考按语')}】</strong>
                    ${tr('此器物造型沉穆端庄，其釉汁层层厚施，微观100倍显微镜下可见特征气泡层与矿物结晶，属两宋至明初皇家御用或数字孪生典范之作。')}
                </div>
                <div class="pt-2 flex justify-end">
                    ${canView3D
                        ? `<button onclick="closeUniversalModal(); loadComparisonModelTo3D(${item.id});" class="px-5 py-2 rounded-full bg-tianqing-deep text-white text-xs font-serif-cn hover:bg-tianqing transition-colors flex items-center gap-1.5 shadow-md"><i class="fa-solid fa-cube" aria-hidden="true"></i>${tr('调入 3D 展馆立体观摩')}</button>`
                        : `<span class="px-4 py-2 rounded-full bg-stone-100 dark:bg-stone-800 text-text-muted text-xs font-serif-cn border border-border-light flex items-center gap-1"><i class="fa-solid fa-bookmark text-[10px]" aria-hidden="true"></i>${tr('典藏图录档案 (未开放3D模型)')}</span>`
                    }
                </div>
            </div>
        `;
        if (global.ModalManager) global.ModalManager.open(modal);
        else modal.classList.add('active');
    }

    function closeUniversalModal() {
        const modal = document.getElementById('universal-modal');
        if (!modal) return;
        if (global.ModalManager) global.ModalManager.close(modal);
        else modal.classList.remove('active');
    }

    function refreshAll() {
        renderArchiveGrid();
        renderImperialReignMarks();
    }

    global.AppRegistry.register({
        id: 'archive-catalog',
        phase: 2,
        init: function ({ bus }) {
            renderArchiveGrid();
            setTimeout(renderImperialReignMarks, 60);
            if (bus) {
                bus.on('bookmarks:changed', renderArchiveGrid);
                bus.on('archive:updated', renderArchiveGrid);
            }
        },
        onLangChange: refreshAll,
        getSearchItems: function () {
            if (typeof archivePorcelains === 'undefined') return [];
            return archivePorcelains.map(a => ({
                type: tr('3D国宝典藏'),
                icon: 'fa-cube',
                title: tr(a.name),
                sub: `${tr(a.kiln)} · ${tr(a.size)}`,
                action: () => {
                    if (typeof a.modelIdx === 'number' && a.modelIdx !== null) {
                        if (typeof global.loadComparisonModelTo3D === 'function') global.loadComparisonModelTo3D(a.modelIdx);
                    } else {
                        openArchiveDetailModal(a.id);
                    }
                }
            }));
        },
        publicApi: {
            filterArchivePorcelains,
            renderArchiveGrid,
            renderImperialReignMarks,
            openArchiveDetailModal,
            closeUniversalModal
        },
        globalBindings: {
            filterArchivePorcelains,
            setArchiveDynastyFilter: filterArchivePorcelains,
            renderArchiveGrid,
            openArchiveDetailModal,
            closeUniversalModal
        }
    });
})(window);
