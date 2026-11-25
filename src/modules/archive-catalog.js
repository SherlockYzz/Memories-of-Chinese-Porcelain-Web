/**
 * 模块：典藏图录与历代款识 (archive-catalog)
 * 数据：content/archive.json、content/reign-marks.json（经统一数据接口）。
 * 每张卡片都显示“出处核验状态”（已核验 / 部分核验 / 待核实 / 本项目建模），不再默认声称馆藏。
 */
import { defineModule, data, store, modal, tr, html, raw, setHTML, when, legacy } from '@core';

let filter = 'all';
let offBookmarks = null;

const DYNASTY_HINT = { song: '宋', ming: '明', qing: '清', tang: '唐', yuan: '元' };

const SOURCE_BADGE = {
    verified: { icon: 'fa-circle-check', cls: 'source-badge--verified', label: '馆藏号已核验' },
    partial: { icon: 'fa-circle-half-stroke', cls: 'source-badge--partial', label: '馆藏号部分核验' },
    unverified: { icon: 'fa-circle-question', cls: 'source-badge--pending', label: '出处待核实' },
    project: { icon: 'fa-cube', cls: 'source-badge--project', label: '本项目建模复原' }
};

function sourceOf(item) {
    return (item.source && SOURCE_BADGE[item.source.status]) || SOURCE_BADGE.unverified;
}

function has3D(item) {
    return typeof item.modelIdx === 'number' && item.modelIdx >= 0 && item.modelIdx <= 20;
}

function matches(item) {
    if (filter === 'all') return true;
    if (filter === 'verified') return !!(item.source && item.source.status === 'verified');
    if (filter === 'scanned') return typeof item.modelIdx === 'number' && item.modelIdx >= 8 && item.modelIdx <= 12;
    const hint = DYNASTY_HINT[filter];
    if (hint) return item.dynastyKey === filter || item.name.includes(hint);
    return true;
}

function setFilter(_ctx, key) {
    filter = key;
    document.querySelectorAll('.archive-filter-btn, .archive-dynasty-btn').forEach((btn) => {
        const active = (btn.dataset.filter || btn.dataset.dynasty) === key;
        btn.classList.toggle('bg-tianqing-deep', active);
        btn.classList.toggle('text-white', active);
        btn.classList.toggle('active', active);
        btn.classList.toggle('bg-yuebai', !active);
        btn.classList.toggle('text-text-body', !active);
        btn.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
    renderGrid();
}

function renderGrid() {
    const container = document.getElementById('archive-grid-container');
    if (!container) return;
    const bookmarks = store.get('bookmarks') || [];
    const items = data.get('archive').filter(matches);
    setHTML(
        container,
        html`${items.map((item) => {
            const fav = bookmarks.includes(item.id);
            const badge = sourceOf(item);
            const favLabel = tr(fav ? '从典藏集移除' : '收录入典藏集');
            return html`
            <article class="feature-card p-5 group cursor-pointer hover-lift relative text-left flex flex-col justify-between" tabindex="0" role="button"
                     aria-label="${tr(item.name)}" data-action="openArchiveDetailModal(${item.id})">
                <div>
                    <div class="aspect-square rounded-xl overflow-hidden mb-4 porcelain-card-skeleton relative border border-border-light/60">
                        <div class="porcelain-skeleton-icon"><i class="fa-solid fa-gem opacity-40" aria-hidden="true"></i></div>
                        <img src="${item.img}" alt="${tr(item.name)}" loading="lazy" decoding="async" data-fade-img
                             class="w-full h-full object-cover group-hover:scale-105 transition-all duration-500 opacity-0 relative z-10">
                        <span class="archive-level-tag">${tr(item.level)}</span>
                        <button type="button" data-action="toggleArchiveBookmark(${item.id})" data-action-stop class="archive-fav-btn" title="${favLabel}" aria-label="${favLabel}" aria-pressed="${fav ? 'true' : 'false'}">
                            <i class="${fav ? 'fa-solid text-amber-400' : 'fa-regular'} fa-bookmark text-xs" aria-hidden="true"></i>
                        </button>
                    </div>
                    <h4 class="text-base font-serif-cn text-text-title font-semibold mb-1 truncate">${tr(item.name)}</h4>
                    <p class="text-xs text-tianqing-deep font-medium mb-1">${tr(item.kiln)}</p>
                    ${when(item.size, (size) => html`<p class="text-[11px] text-text-muted mb-2.5 font-mono">${tr(size)}</p>`)}
                    <div class="flex flex-wrap gap-1.5 mb-3">
                        ${(item.tags || []).map((tag) => html`<span class="bg-yuebai text-text-body text-[10px] px-2 py-0.5 rounded border border-border-light">${tr(tag)}</span>`)}
                    </div>
                    <p class="text-xs text-text-body font-light line-clamp-2 leading-relaxed">${tr(item.desc)}</p>
                </div>
                <div class="mt-3.5 pt-2.5 border-t border-border-light text-[11px] flex items-center justify-between gap-2">
                    <span class="source-badge ${badge.cls}"><i class="fa-solid ${badge.icon}" aria-hidden="true"></i>${tr(badge.label)}</span>
                    ${has3D(item)
                        ? html`<button type="button" data-action="loadComparisonModelTo3D(${item.id})" data-action-stop class="text-amber-400 hover:underline font-serif-cn font-medium flex items-center gap-1">
                              <i class="fa-solid fa-cube text-[10px]" aria-hidden="true"></i>${tr('在三维展馆查看')} &rarr;</button>`
                        : html`<span class="text-text-muted font-serif-cn">${tr('查看档案')} &rarr;</span>`}
                </div>
            </article>`;
        })}`
    );
    fadeInImages(container);
}

/** 图片加载完成后淡入；加载失败则保留占位图标，不再回退到无关图片。 */
function fadeInImages(root) {
    root.querySelectorAll('img[data-fade-img]').forEach((img) => {
        const show = () => {
            img.classList.remove('opacity-0');
            const icon = img.previousElementSibling;
            if (icon) icon.style.opacity = '0';
        };
        if (img.complete && img.naturalWidth > 0) show();
        else {
            img.addEventListener('load', show, { once: true });
            img.addEventListener('error', () => img.remove(), { once: true });
        }
    });
}

function renderMarks() {
    const container = document.getElementById('imperial-marks-grid');
    if (!container) return;
    setHTML(
        container,
        html`${data.get('reign-marks').map((m) => {
            const round = m.style === 'blue-circle' || m.style === 'seal-round';
            const cinnabar = m.style === 'cinnabar-square' || m.style === 'seal-round';
            const seal = Array.isArray(m.sealText) ? m.sealText : [m.sealText];
            return html`
            <div class="feature-card p-5 hover-lift text-left flex flex-col justify-between">
                <div class="flex items-center gap-4 mb-3.5">
                    <div class="reign-seal ${round ? 'reign-seal--round' : ''} ${cinnabar ? 'reign-seal--cinnabar' : ''}" style="--seal-color: ${m.color}">
                        <span>${seal[0]}</span><span>${seal[1] || ''}</span>
                    </div>
                    <div>
                        <span class="text-[10px] font-mono text-amber-400 block">${tr(m.era)}</span>
                        <h4 class="text-sm sm:text-base font-serif-cn font-semibold text-text-title leading-snug mt-0.5">${tr(m.title)}</h4>
                        <span class="text-[11px] text-tianqing-deep">${tr(m.type)}</span>
                    </div>
                </div>
                <p class="text-xs text-text-body font-light leading-relaxed">${tr(m.desc)}</p>
            </div>`;
        })}`
    );
}

function sourceBlock(item) {
    const s = item.source || { status: 'unverified' };
    if (s.status === 'verified' || s.status === 'partial') {
        return html`
            <p><strong>${tr('收藏单位：')}</strong>${s.institution}</p>
            <p><strong>${tr('馆藏号：')}</strong>${s.accessionNo}${when(s.title, (t) => html` · ${t}`)}</p>
            ${when(s.dimensions, (d) => html`<p><strong>${tr('馆方著录尺寸：')}</strong>${d}</p>`)}
            ${when(s.license, (l) => html`<p><strong>${tr('图像授权：')}</strong>${l}</p>`)}
            ${when(s.url, (u) => html`<p><a class="text-tianqing-deep underline" href="${u}" target="_blank" rel="noopener noreferrer">${tr('查看馆方页面')}</a></p>`)}
            ${when(s.note, (n) => html`<p class="text-text-muted">${tr(n)}</p>`)}`;
    }
    if (s.status === 'project') return html`<p>${tr(s.note || '本项目建模复原器物的图录卡片。')}</p>`;
    return html`<p>${tr('这条图录的图片与文字出处尚未核实，内容仅作教学示意，请勿当作馆藏著录引用。')}</p>
        ${when(s.note, (n) => html`<p class="text-text-muted">${tr(n)}</p>`)}`;
}

function openDetail(_ctx, id) {
    const item = data.byId('archive', id);
    const el = document.getElementById('universal-modal');
    const title = document.getElementById('modal-title');
    const body = document.getElementById('modal-body');
    if (!item || !el || !title || !body) return;
    const badge = sourceOf(item);
    title.textContent = tr(item.name);
    setHTML(
        body,
        html`
        <div class="space-y-4 text-left">
            <div class="aspect-square max-w-sm mx-auto rounded-2xl overflow-hidden shadow-sm bg-black border border-border-light">
                <img src="${item.img}" alt="${tr(item.name)}" class="w-full h-full object-cover">
            </div>
            <div class="flex flex-wrap items-center justify-between gap-2 border-b border-border-light pb-3">
                <div><span class="text-xs text-text-muted">${tr('窑口：')}</span><strong class="text-sm font-medium text-text-title font-serif-cn">${tr(item.kiln)}</strong></div>
                <span class="badge bg-tianqing-deep text-white text-xs">${tr(item.level)}</span>
            </div>
            <div class="text-xs text-text-body space-y-2 font-light">
                ${when(item.size, (size) => html`<p><strong>${tr('尺寸：')}</strong>${tr(size)}</p>`)}
                <p><strong>${tr('器型特征：')}</strong>${tr(item.desc)}</p>
            </div>
            <div class="p-4 rounded-xl bg-yuebai/50 text-xs text-text-body leading-relaxed border border-border-light space-y-1.5">
                <strong class="font-medium text-text-title flex items-center gap-1.5"><span class="source-badge ${badge.cls}"><i class="fa-solid ${badge.icon}" aria-hidden="true"></i>${tr(badge.label)}</span></strong>
                ${sourceBlock(item)}
            </div>
            ${when(has3D(item), () => html`
            <div class="pt-2 flex justify-end">
                <button type="button" data-action="closeUniversalModal(); loadComparisonModelTo3D(${item.id})" class="px-5 py-2 rounded-full bg-tianqing-deep text-white text-xs font-serif-cn hover:bg-tianqing transition-colors flex items-center gap-1.5 shadow-md">
                    <i class="fa-solid fa-cube" aria-hidden="true"></i>${tr('在三维展馆查看对应器型')}</button>
            </div>`)}
        </div>`
    );
    modal.open(el);
}

function closeUniversalModal() {
    modal.close('universal-modal');
}

function refresh() {
    renderGrid();
    renderMarks();
}

export default defineModule({
    id: 'archive-catalog',
    phase: 2,
    init(ctx) {
        renderGrid();
        ctx.timeout(renderMarks, 60);
        ctx.subscribe('bookmarks:changed', renderGrid);
        ctx.subscribe('archive:updated', renderGrid);
        offBookmarks = ctx.watch('bookmarks', renderGrid);
        modal.registerCloser('universal-modal', closeUniversalModal);
    },
    destroy() {
        offBookmarks = null;
        setHTML(document.getElementById('archive-grid-container'), raw(''));
        setHTML(document.getElementById('imperial-marks-grid'), raw(''));
    },
    onLangChange: refresh,
    getSearchItems() {
        return data.get('archive').map((a) => ({
            type: tr('典藏图录'),
            icon: 'fa-book-open',
            title: tr(a.name),
            sub: [tr(a.kiln), a.size ? tr(a.size) : ''].filter(Boolean).join(' · '),
            action: () => (has3D(a) ? legacy.run('loadComparisonModelTo3D', a.modelIdx) : openDetail(null, a.id))
        }));
    },
    actions: {
        filterArchivePorcelains: setFilter,
        setArchiveDynastyFilter: setFilter,
        openArchiveDetailModal: openDetail,
        closeUniversalModal
    },
    api: { render: renderGrid, openDetail: (id) => openDetail(null, id), close: closeUniversalModal }
});
