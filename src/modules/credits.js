/**
 * 模块：素材与致谢 (credits)
 * 从 content/credits.json 渲染三维模型、图片、音视频、字体、开源库与文献的来源及授权状态。
 */
import { defineModule, data, i18n, html, setHTML, $ } from '@core';

const pick = (obj) => (typeof obj === 'string' ? obj : (obj && (obj[i18n.currentLang()] || obj.zh)) || '');

const STATUS_BADGE = {
    verified: 'source-badge--verified',
    project: 'source-badge--project',
    pending: 'source-badge--pending'
};

function render() {
    const host = document.getElementById('credits-groups-container');
    if (!host) return;
    const credits = data.get('credits');
    const labels = credits.statusLabels || {};
    const copyrightText = pick(credits.copyright) || '版权制作：折木柯南';

    setHTML(
        host,
        html`${(credits.groups || []).map((group) => html`
        <div class="feature-card p-5 sm:p-6">
            <h3 class="text-base sm:text-lg font-serif-cn font-semibold text-text-title mb-4 pb-2.5 border-b border-border-light flex items-center gap-2">
                <span class="w-2 h-2 rounded-full bg-tianqing-deep" aria-hidden="true"></span>
                <span>${pick(group.title)}</span>
            </h3>
            <div class="grid md:grid-cols-2 gap-4">
                ${(group.items || []).map((item) => {
                    const statusClass = STATUS_BADGE[item.status] || 'source-badge--partial';
                    const statusLabel = pick(labels[item.status]) || item.status || '';
                    return html`
                    <article class="p-4 rounded-xl bg-bg-main border border-border-light flex flex-col justify-between gap-2 text-left">
                        <div class="space-y-1.5">
                            <div class="flex flex-wrap items-start justify-between gap-2">
                                <h4 class="text-sm font-serif-cn font-semibold text-text-title leading-snug">${item.name}</h4>
                                <span class="source-badge ${statusClass}">${statusLabel}</span>
                            </div>
                            <p class="text-xs text-text-body"><strong>${i18n.tr('来源：')}</strong>${item.source}${item.url ? html` · <a href="${item.url}" target="_blank" rel="noopener noreferrer" class="text-tianqing-deep underline">${item.url}</a>` : ''}</p>
                            <p class="text-xs text-text-muted"><strong>${i18n.tr('授权：')}</strong>${item.license}</p>
                        </div>
                        ${item.note ? html`<p class="text-[11px] text-text-muted leading-relaxed pt-2 border-t border-border-light/70">${item.note}</p>` : ''}
                    </article>`;
                })}
            </div>
        </div>`)}
        <div class="feature-card p-5 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-left" data-credits-copyright>
            <div class="flex items-center gap-3">
                <span class="w-9 h-9 rounded-full bg-tianqing-deep text-white flex items-center justify-center shrink-0">
                    <i class="fa-solid fa-copyright" aria-hidden="true"></i>
                </span>
                <div>
                    <p class="text-sm sm:text-base font-serif-cn font-semibold text-text-title">${copyrightText}</p>
                    <p class="text-xs text-text-muted">${i18n.currentLang() === 'en' ? 'Digital reconstruction, WebGL shaders and interactive labs · CC BY-NC-SA 4.0' : '三维建模复原、WebGL 物理釉面与互动研学空间制作 · CC BY-NC-SA 4.0'}</p>
                </div>
            </div>
            <span class="source-badge source-badge--project">${copyrightText}</span>
        </div>`
    );
}

export default defineModule({
    id: 'credits',
    phase: 3,
    init() {
        render();
    },
    destroy() {
        const host = $('#credits-groups-container');
        if (host) setHTML(host, '');
    },
    onLangChange: render
});
