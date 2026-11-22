/**
 * 模块：华夏陶瓷八千年通史长卷 (history-timeline)
 */
(function (global) {
    'use strict';

    let currentHistoryId = 'song';

    function tr(s) {
        return typeof global.tText === 'function' ? global.tText(s) : s;
    }

    function renderHistoryTimeline() {
        const navContainer = document.getElementById('history-nav-nodes');
        const displayContainer = document.getElementById('history-active-display');
        if (!navContainer || !displayContainer || typeof historyPeriods === 'undefined') return;
        const lang = (global.AppStore && global.AppStore.get('lang')) || global.currentLang || 'zh';

        navContainer.innerHTML = historyPeriods.map((p, idx) => `
            <button class="history-node-btn px-4 py-2.5 rounded-full text-xs font-serif-cn transition-all shrink-0 flex items-center gap-1.5 ${p.id === currentHistoryId ? 'bg-tianqing-deep text-white shadow-md ring-2' : 'bg-yuebai text-text-body hover:bg-tianqing'}" onclick="selectHistoryPeriod('${p.id}')">
                <span class="font-mono text-[10px] opacity-75">0${idx + 1}</span>
                <span>${(p.label && p.label[lang]) || (p.label && p.label.zh) || ''}</span>
            </button>
        `).join('');

        const curIdx = historyPeriods.findIndex(item => item.id === currentHistoryId);
        const p = historyPeriods[curIdx >= 0 ? curIdx : 3];
        const prevId = historyPeriods[(curIdx - 1 + historyPeriods.length) % historyPeriods.length].id;
        const nextId = historyPeriods[(curIdx + 1) % historyPeriods.length].id;

        displayContainer.innerHTML = `
            <div class="feature-card p-6 sm:p-8 space-y-6">
                <div class="flex flex-col md:flex-row items-center gap-8">
                    <div class="w-full md:w-1/2 aspect-[4/3] rounded-2xl overflow-hidden shadow-md shrink-0 porcelain-card-skeleton relative border border-border-light group">
                        <img src="${p.img}" alt="${(p.title && p.title[lang]) || ''}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">
                        <div class="absolute top-3 left-3 bg-black/75 backdrop-blur-md px-3.5 py-1 rounded-full text-amber-200 text-xs font-serif-cn border border-white/10">
                            ${tr(p.year)}
                        </div>
                        <div class="absolute bottom-3 right-3 bg-black/75 backdrop-blur-md px-3 py-1 rounded-full text-white text-[11px] font-mono border border-white/10">
                            🔥 ${tr('烧成温度')}：${tr(p.temp || '1260℃')}
                        </div>
                    </div>
                    <div class="flex-1 space-y-4 text-left">
                        <div class="flex items-center justify-between">
                            <span class="badge bg-tianqing-deep text-white text-xs">${(p.label && p.label[lang]) || ''}</span>
                            <div class="flex items-center gap-2">
                                <button onclick="selectHistoryPeriod('${prevId}')" class="w-8 h-8 rounded-full bg-yuebai border border-border-light flex items-center justify-center text-xs hover:bg-tianqing hover:text-white transition-colors" title="${tr('上一历史时期')}" aria-label="${tr('上一历史时期')}">
                                    <i class="fa-solid fa-chevron-left" aria-hidden="true"></i>
                                </button>
                                <button onclick="selectHistoryPeriod('${nextId}')" class="w-8 h-8 rounded-full bg-yuebai border border-border-light flex items-center justify-center text-xs hover:bg-tianqing hover:text-white transition-colors" title="${tr('下一历史时期')}" aria-label="${tr('下一历史时期')}">
                                    <i class="fa-solid fa-chevron-right" aria-hidden="true"></i>
                                </button>
                            </div>
                        </div>
                        <h3 class="text-2xl font-serif-cn text-text-title font-semibold leading-snug">${(p.title && p.title[lang]) || ''}</h3>
                        <p class="text-xs text-amber-400 italic font-serif-cn">${tr(p.quote || '')}</p>
                        <p class="text-sm text-text-body leading-relaxed font-light">${(p.desc && p.desc[lang]) || ''}</p>

                        <div class="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-2 text-xs">
                            <div class="p-2.5 rounded-xl bg-bg-main border border-border-light">
                                <span class="text-[10px] text-text-muted block">${tr('核心烧结温度')}</span>
                                <strong class="font-mono text-amber-400">${tr(p.temp || '1250℃')}</strong>
                            </div>
                            <div class="p-2.5 rounded-xl bg-bg-main border border-border-light">
                                <span class="text-[10px] text-text-muted block">${tr('胎体致密/吸水率')}</span>
                                <strong class="font-serif-cn text-tianqing-deep">${tr(p.porosity || '< 0.5%')}</strong>
                            </div>
                            <div class="p-2.5 rounded-xl bg-bg-main border border-border-light col-span-2 sm:col-span-1">
                                <span class="text-[10px] text-text-muted block">${tr('代表窑炉制度')}</span>
                                <strong class="font-serif-cn text-text-title">${tr(p.kilnType || '龙窑/馒头窑')}</strong>
                            </div>
                        </div>

                        <div class="pt-3 flex items-center justify-between text-xs text-text-muted border-t border-border-light">
                            <span><i class="fa-solid fa-flask text-tianqing-deep mr-1" aria-hidden="true"></i>${tr('釉料体系')}：${tr(p.glazeSystem || '')}</span>
                            <button onclick="loadComparisonModelTo3D(${p.modelIdx || 0})" class="text-tianqing-deep font-medium hover:underline font-serif-cn">
                                ${tr('在3D展厅观摩此时期代表器')} &rarr;
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    function selectHistoryPeriod(id) {
        currentHistoryId = id;
        renderHistoryTimeline();
        if (typeof global.playPorcelainChime === 'function') global.playPorcelainChime(2350);
    }

    global.AppRegistry.register({
        id: 'history-timeline',
        phase: 2,
        init: renderHistoryTimeline,
        onLangChange: renderHistoryTimeline,
        publicApi: { renderHistoryTimeline, selectHistoryPeriod },
        globalBindings: { renderHistoryTimeline, selectHistoryPeriod }
    });
})(window);
