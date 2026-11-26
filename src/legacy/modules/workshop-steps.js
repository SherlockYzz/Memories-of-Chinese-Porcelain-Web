/**
 * 模块：天工开物 · 七十二工核心工序网格与详情弹窗 (workshop-steps)
 */
(function (global) {
    'use strict';

    function tr(s) {
        return typeof global.tText === 'function' ? global.tText(s) : s;
    }

    function renderWorkshopGrid() {
        const container = document.getElementById('workshop-grid-container');
        if (!container || typeof workshopSteps === 'undefined') return;
        const lang = (global.AppStore && global.AppStore.get('lang')) || global.currentLang || 'zh';

        container.innerHTML = workshopSteps.map(step => `
            <div class="feature-card p-5 group cursor-pointer hover-lift flex flex-col justify-between" data-action="openStepDetailModal(${step.id})">
                <div>
                    <div class="aspect-[4/3] rounded-xl overflow-hidden mb-3.5 porcelain-card-skeleton relative border border-border-light">
                        <img src="${step.img}" alt="${(step.title && step.title[lang]) || ''}" width="480" height="360" loading="lazy" decoding="async" data-fade-img class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">
                        <div class="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/35"></div>
                        <span class="absolute top-2.5 left-2.5 bg-black/80 backdrop-blur-md text-amber-200 text-[10px] px-2.5 py-1 rounded-full font-serif-cn border border-white/15 shadow-sm">
                            ${tr(step.category)}
                        </span>
                        <span class="absolute bottom-2 left-2.5 right-2.5 text-[10px] text-white/90 font-mono truncate">
                            ${tr(step.params || '')}
                        </span>
                    </div>
                    <div class="flex items-center gap-2.5 mb-2">
                        <div class="w-8 h-8 rounded-full bg-yuebai flex items-center justify-center shrink-0 border border-border-light group-hover:bg-tianqing-deep transition-colors">
                            <i class="fa-solid ${step.icon} text-tianqing-deep group-hover:text-white text-xs transition-colors" aria-hidden="true"></i>
                        </div>
                        <h4 class="text-base font-serif-cn text-text-title font-semibold">${(step.title && step.title[lang]) || ''}</h4>
                    </div>
                    <p class="text-xs text-text-body line-clamp-3 font-light leading-relaxed">${(step.desc && step.desc[lang]) || ''}</p>
                </div>
                <div class="mt-3.5 pt-2.5 border-t border-border-light flex items-center justify-between text-[11px] text-tianqing-deep">
                    <span class="font-mono">${tr('《天工开物》规制')} #0${step.id}</span>
                    <span class="group-hover:translate-x-1 transition-transform font-serif-cn">${tr('详阅古法要略')} <i class="fa-solid fa-chevron-right text-[9px]" aria-hidden="true"></i></span>
                </div>
            </div>
        `).join('');

        container.querySelectorAll('img[data-fade-img]').forEach((img) => {
            const done = () => {
                img.classList.add('is-loaded');
                const wrap = img.closest('.porcelain-card-skeleton');
                if (wrap) wrap.classList.add('is-loaded');
            };
            if (img.complete && img.naturalWidth > 0) done();
            else img.addEventListener('load', done, { once: true });
        });
    }

    function openStepDetailModal(id) {
        if (typeof workshopSteps === 'undefined') return;
        const step = workshopSteps.find(s => s.id === id);
        if (!step) return;

        const modal = document.getElementById('universal-modal');
        const modalTitle = document.getElementById('modal-title');
        const modalBody = document.getElementById('modal-body');
        if (!modal || !modalTitle || !modalBody) return;
        const lang = (global.AppStore && global.AppStore.get('lang')) || global.currentLang || 'zh';

        modalTitle.textContent = `${tr(step.category)} · ${(step.title && step.title[lang]) || ''}`;
        modalBody.innerHTML = `
            <div class="space-y-4 text-left">
                <div class="aspect-video rounded-xl overflow-hidden shadow-sm bg-black border border-border-light">
                    <img src="${step.img}" alt="${(step.title && step.title[lang]) || ''}" loading="lazy" decoding="async" class="w-full h-full object-cover">
                </div>
                <div class="flex flex-wrap items-center justify-between gap-2">
                    <span class="badge bg-tianqing-deep text-white text-xs">${tr(step.category)}</span>
                    <span class="text-xs font-mono text-amber-400">${tr(step.params || '')}</span>
                </div>
                <div class="p-3.5 rounded-xl bg-yuebai/50 border border-border-light text-xs text-amber-400 font-serif-cn italic">
                    ${tr(step.ancientQuote || '《天工开物·陶埏》：“共计一坯工力，过手七十二，方克成器。”')}
                </div>
                <p class="text-sm text-text-body leading-relaxed font-light">${(step.desc && step.desc[lang]) || ''}</p>
                <div class="p-4 rounded-xl bg-bg-main text-xs text-text-body leading-relaxed border border-border-light">
                    <strong class="font-medium text-text-title block mb-1 font-serif-cn">【${tr('非遗活态传承与热工控制要领')}】</strong>
                    ${tr('此道工序要求匠人顺应四时物候与水土秉性。若有毫厘之差，在后续 1300℃ 松柴还原烈焰中必致胎体变形开裂或釉面失色。古人云“一窑生一窑死，过手七十二方克成器”，恰在每一道工序的极致苛求。')}
                </div>
            </div>
        `;
        if (global.ModalManager) global.ModalManager.open(modal);
        else modal.classList.add('active');
    }

    global.AppRegistry.register({
        id: 'workshop-steps',
        phase: 3,
        init: renderWorkshopGrid,
        onLangChange: renderWorkshopGrid,
        getSearchItems: function (lang) {
            if (typeof workshopSteps === 'undefined') return [];
            const l = lang || 'zh';
            return workshopSteps.map(s => ({
                type: tr('天工七十二工'),
                icon: 'fa-hammer',
                title: `${tr(s.category)} · ${(s.title && (s.title[l] || s.title.zh)) || ''}`,
                sub: tr(s.params || ''),
                action: () => openStepDetailModal(s.id)
            }));
        },
        publicApi: { renderWorkshopGrid, openStepDetailModal },
        globalBindings: { renderWorkshopGrid, openStepDetailModal }
    });
})(window);
