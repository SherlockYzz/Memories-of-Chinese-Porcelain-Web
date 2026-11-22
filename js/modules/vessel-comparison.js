/**
 * 模块：名瓷双物并照 · 学术对比台与 3D 展台联动跳转 (vessel-comparison)
 */
(function (global) {
    'use strict';

    let comparisonSpecimenA = 0;
    let comparisonSpecimenB = 7;

    function tr(s) {
        return typeof global.tText === 'function' ? global.tText(s) : s;
    }

    function renderPorcelainComparison() {
        const container = document.getElementById('porcelain-comparison-display');
        if (!container || typeof porcelainComparisonData === 'undefined') return;

        const itemA = porcelainComparisonData.find(d => d.id === comparisonSpecimenA) || porcelainComparisonData[0];
        const itemB = porcelainComparisonData.find(d => d.id === comparisonSpecimenB) || porcelainComparisonData[7] || porcelainComparisonData[1];

        const generateOptions = (selectedId) => porcelainComparisonData.map(item => `
            <option value="${item.id}" ${item.id === selectedId ? 'selected' : ''}>
                ${tr(item.name)} (${tr(item.dynasty.split(' ')[0])})
            </option>
        `).join('');

        container.innerHTML = `
            <div class="space-y-5">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div class="p-4 rounded-xl bg-bg-main border border-border-light flex flex-col gap-2">
                        <div class="flex items-center justify-between">
                            <span class="badge bg-tianqing-deep text-white text-[11px]">${tr('对照标本 A')}</span>
                            <button onclick="loadComparisonModelTo3D(${itemA.id})" class="text-xs text-tianqing-deep hover:underline flex items-center gap-1 font-medium">
                                <i class="fa-solid fa-cube" aria-hidden="true"></i>${tr('调入 3D 展台')}
                            </button>
                        </div>
                        <select id="compare-specimen-a" name="compare-specimen-a" onchange="switchComparisonSpecimen('A', this.value)" aria-label="${tr('选择对照标本 A')}" class="w-full bg-yuebai border border-border-light rounded-lg px-3 py-2 text-xs font-serif-cn text-text-title outline-none">
                            ${generateOptions(itemA.id)}
                        </select>
                    </div>

                    <div class="p-4 rounded-xl bg-bg-main border border-border-light flex flex-col gap-2">
                        <div class="flex items-center justify-between">
                            <span class="badge bg-amber-700 text-white text-[11px]">${tr('对照标本 B')}</span>
                            <button onclick="loadComparisonModelTo3D(${itemB.id})" class="text-xs text-amber-400 hover:underline flex items-center gap-1 font-medium">
                                <i class="fa-solid fa-cube" aria-hidden="true"></i>${tr('调入 3D 展台')}
                            </button>
                        </div>
                        <select id="compare-specimen-b" name="compare-specimen-b" onchange="switchComparisonSpecimen('B', this.value)" aria-label="${tr('选择对照标本 B')}" class="w-full bg-yuebai border border-border-light rounded-lg px-3 py-2 text-xs font-serif-cn text-text-title outline-none">
                            ${generateOptions(itemB.id)}
                        </select>
                    </div>
                </div>

                <div class="overflow-x-auto rounded-2xl border border-border-light bg-bg-main">
                    <table class="w-full text-xs text-left">
                        <thead>
                            <tr class="bg-yuebai border-b border-border-light text-text-title font-serif-cn">
                                <th scope="col" class="py-3 px-4 font-medium w-36 whitespace-nowrap">${tr('鉴别维度')}</th>
                                <th scope="col" class="py-3 px-4 font-medium text-tianqing-deep border-r border-border-light">${tr(itemA.name)}</th>
                                <th scope="col" class="py-3 px-4 font-medium text-amber-400">${tr(itemB.name)}</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y text-text-body font-light">
                            <tr>
                                <td class="py-2.5 px-4 font-medium text-text-title bg-yuebai/20 whitespace-nowrap">${tr('窑口与时代')}</td>
                                <td class="py-2.5 px-4 border-r border-border-light">${tr(itemA.kiln)} · ${tr(itemA.dynasty)}</td>
                                <td class="py-2.5 px-4">${tr(itemB.kiln)} · ${tr(itemB.dynasty)}</td>
                            </tr>
                            <tr>
                                <td class="py-2.5 px-4 font-medium text-text-title bg-yuebai/20 whitespace-nowrap">${tr('胎骨质地')}</td>
                                <td class="py-2.5 px-4 border-r border-border-light font-medium text-text-title">${tr(itemA.bodyType)}</td>
                                <td class="py-2.5 px-4 font-medium text-text-title">${tr(itemB.bodyType)}</td>
                            </tr>
                            <tr>
                                <td class="py-2.5 px-4 font-medium text-text-title bg-yuebai/20 whitespace-nowrap">${tr('釉面特质')}</td>
                                <td class="py-2.5 px-4 border-r border-border-light">${tr(itemA.glazeType)}</td>
                                <td class="py-2.5 px-4">${tr(itemB.glazeType)}</td>
                            </tr>
                            <tr>
                                <td class="py-2.5 px-4 font-medium text-text-title bg-yuebai/20 whitespace-nowrap">${tr('开片与纹饰')}</td>
                                <td class="py-2.5 px-4 border-r border-border-light">${tr(itemA.crackle)}</td>
                                <td class="py-2.5 px-4">${tr(itemB.crackle)}</td>
                            </tr>
                            <tr>
                                <td class="py-2.5 px-4 font-medium text-text-title bg-yuebai/20 whitespace-nowrap">${tr('烧成规制')}</td>
                                <td class="py-2.5 px-4 border-r border-border-light">${tr(itemA.temperature)} · ${tr(itemA.firingMethod)}</td>
                                <td class="py-2.5 px-4">${tr(itemB.temperature)} · ${tr(itemB.firingMethod)}</td>
                            </tr>
                            <tr>
                                <td class="py-2.5 px-4 font-medium text-text-title bg-yuebai/20 whitespace-nowrap">${tr('口沿与底足')}</td>
                                <td class="py-2.5 px-4 border-r border-border-light">${tr(itemA.rimFoot)}</td>
                                <td class="py-2.5 px-4">${tr(itemB.rimFoot)}</td>
                            </tr>
                            <tr>
                                <td class="py-2.5 px-4 font-medium text-text-title bg-yuebai/20 whitespace-nowrap">${tr('文博地位')}</td>
                                <td class="py-2.5 px-4 border-r border-border-light text-text-muted italic">${tr(itemA.historicalRarity)}</td>
                                <td class="py-2.5 px-4 text-text-muted italic">${tr(itemB.historicalRarity)}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }

    function switchComparisonSpecimen(which, id) {
        id = parseInt(id, 10);
        if (which === 'A') comparisonSpecimenA = id;
        else comparisonSpecimenB = id;
        renderPorcelainComparison();
        if (typeof global.playPorcelainChime === 'function') global.playPorcelainChime(2300);
    }

    function loadComparisonModelTo3D(targetId) {
        let modelIdx = null;
        let glazeKey = 'tianqing';
        let displayName = '馆藏器物';

        if (typeof targetId === 'number' && typeof archivePorcelains !== 'undefined') {
            const item = archivePorcelains.find(a => a.id === targetId);
            if (item) {
                if (item.modelIdx === null || item.modelIdx === undefined) {
                    if (global.ToastService) {
                        global.ToastService.show(`📜【${item.name}】属文献图录典藏收录，暂未开放 3D 三维模型。`);
                    }
                    return;
                }
                modelIdx = item.modelIdx;
                glazeKey = item.glazeKey || 'tianqing';
                displayName = item.name || displayName;
            } else if (targetId >= 0 && targetId <= 20) {
                modelIdx = targetId;
            }
        } else if (typeof targetId === 'number' && targetId >= 0 && targetId <= 20) {
            modelIdx = targetId;
        }

        if (modelIdx === null || modelIdx === undefined) return;

        if (typeof global.switchExhibitionMode === 'function') {
            global.switchExhibitionMode('inspector');
        }
        if (typeof global.isZenMode !== 'undefined' && global.isZenMode && typeof global.toggleZenMode === 'function') {
            global.toggleZenMode();
        }
        if (typeof global.loadPorcelainModel === 'function') {
            global.loadPorcelainModel(modelIdx);
        }
        if (glazeKey && typeof global.switchGlaze === 'function') {
            global.switchGlaze(glazeKey);
        }
        if (global.AppStore) global.AppStore.set('modelIndex', modelIdx);
        if (global.AppBus) global.AppBus.emit('model:selected', { index: modelIdx, name: displayName });

        const stageEl = document.getElementById('three-stage-container') || document.getElementById('3d-gallery');
        if (stageEl) {
            const topOffset = stageEl.getBoundingClientRect().top + global.pageYOffset - 80;
            global.scrollTo({ top: Math.max(0, topOffset), behavior: 'smooth' });
        }
        if (typeof global.playPorcelainChime === 'function') global.playPorcelainChime(2520);
        if (global.ToastService) {
            global.ToastService.show(`🏛️ 已同步调入【${displayName}】至 3D 展馆，支持 360° 旋转研鉴！`);
        }
    }

    global.AppRegistry.register({
        id: 'vessel-comparison',
        phase: 3,
        init: renderPorcelainComparison,
        onLangChange: renderPorcelainComparison,
        publicApi: { renderPorcelainComparison, switchComparisonSpecimen, loadComparisonModelTo3D },
        globalBindings: { switchComparisonSpecimen, loadComparisonModelTo3D }
    });
})(window);
